import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { runAssistant } from "@/lib/assistant/index";
import { checkAssistantLimit, checkAiLimit } from "@/lib/assistant/rate-limit";
import { log } from "@/lib/assistant/logger";

export const dynamic = "force-dynamic";

// ── Dev-only debug payload ────────────────────────────────────────────────────
// Attached to the response body only when NODE_ENV === "development".
// Never present in production — the conditional is evaluated at runtime so
// a minifier cannot accidentally inline it.

const IS_DEV = process.env.NODE_ENV === "development";

function devExtra(err: unknown): Record<string, string> {
  if (!IS_DEV) return {};
  const message = err instanceof Error ? err.message : String(err);
  const stack   = err instanceof Error ? (err.stack ?? "") : "";
  return { debug: message, stack };
}

// ── Request schema ────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
});

// ── IP extraction ─────────────────────────────────────────────────────────────

function extractIp(request: NextRequest): string {
  // Trust these headers when the app sits behind a known proxy/CDN.
  // In production, pin this to a specific header your platform sets.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = extractIp(request);

  // ── Rate limit: all assistant messages ────────────────────────────────
  const generalLimit = checkAssistantLimit(ip);
  if (!generalLimit.allowed) {
    const retryAfterSec = Math.ceil(generalLimit.resetInMs / 1000);
    log("warn", "rate_limited", { ip, retryAfterSec });
    return NextResponse.json(
      {
        error: "Too many messages. Please wait a moment before sending another.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    // DEBUG: print the complete error so a malformed body is visible in the terminal.
    console.error("[assistant/route] JSON parse failed:", err);
    return NextResponse.json(
      { error: "Invalid JSON body.", ...devExtra(err) },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const { messages } = parsed.data;

  // ── Resolve session (server-side — never trust client-supplied userId) ─
  // Wrapped in try/catch: getSession queries the database. If the DB is
  // unreachable or the session table doesn't exist, we log the error and
  // continue with userId = null (unauthenticated) rather than letting the
  // throw escape uncaught and produce a 500 or bypass our fallback logic.
  let userId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    userId = session?.user?.id ?? null;
  } catch (err) {
    console.error("[assistant/route] auth.api.getSession threw:", err);
    log("error", "session_error", {
      error: err instanceof Error ? err.message : String(err),
      ip,
    });
    // userId stays null — DB-backed handlers will return "please sign in"
    // responses, which is the safest degraded behaviour.
  }

  // ── Gardening AI: additional stricter rate limit ───────────────────────
  // We check this here before calling runAssistant so the limit is applied
  // even though runAssistant handles the AI call internally.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const couldUseAi = lastUser && /\b(grow|plant|water|fertilize|prune|soil|seed|germinate|bloom)\b/i.test(lastUser.content);

  if (couldUseAi && process.env.ANTHROPIC_API_KEY) {
    const aiLimit = checkAiLimit(ip);
    if (!aiLimit.allowed) {
      const retryAfterSec = Math.ceil(aiLimit.resetInMs / 1000);
      log("warn", "ai_rate_limited", { ip, retryAfterSec });
      return NextResponse.json(
        {
          reply:
            "You've sent a lot of gardening questions in a short time — please wait a minute before asking another.",
          source: "fallback",
          intent: "gardening_advice",
        },
        {
          status: 200, // Return 200 so the widget displays the message
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }
  }

  // ── Run the assistant ─────────────────────────────────────────────────
  // The try/catch here is the outermost safety net: runAssistant has its own
  // internal error handling, but if something truly unexpected escapes (e.g.
  // a Prisma connection failure at startup, an import error), we return a
  // structured 200 instead of letting Next.js emit an HTTP 500.
  let response;
  try {
    response = await runAssistant(messages, { userId, ip });
  } catch (err) {
    // DEBUG: print the complete error object — stack trace included — so the
    // real cause is visible in the terminal rather than being silently swallowed.
    console.error("[assistant/route] Unhandled error from runAssistant:", err);

    const message = err instanceof Error ? err.message : String(err);
    log("error", "unhandled_assistant_error", { error: message, ip });
    response = {
      reply:
        "Something went wrong — please try again in a moment. If the issue persists, contact us directly.",
      source: "fallback" as const,
      intent: "unknown" as const,
      ...devExtra(err),
    };
  }

  return NextResponse.json(response, {
    headers: {
      "X-RateLimit-Remaining": String(generalLimit.remaining),
    },
  });
}
