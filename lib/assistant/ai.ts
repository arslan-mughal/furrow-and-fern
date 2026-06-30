import type { ChatMessage, AssistantResponse } from "./types";
import { log } from "./logger";

// Model is declared once in lib/anthropic.ts and imported here so there is
// a single source of truth.  The dynamic import below means the SDK is only
// resolved at call-time, so the assistant still starts even when the package
// is somehow missing from node_modules.
import { ASSISTANT_MODEL } from "@/lib/anthropic";

const GARDENING_SYSTEM_PROMPT = `You are Sprout, a knowledgeable gardening assistant for Furrow & Fern, an online plant and garden supply store in Pakistan.

Your role is ONLY to give gardening advice — plant care, growing tips, soil choices, fertilizer recommendations, pest control, seed germination, and similar horticultural topics.

Rules:
- Keep answers concise and practical (2–4 sentences or a short list).
- Tailor advice for Pakistan's climate where relevant (continental/subtropical).
- If asked about something that isn't gardening-related, redirect: say you can only help with gardening questions, and suggest they ask about orders, products, or contact us.
- Never invent product names, prices, or stock levels — those come from the store's database, not from you.
- Never claim to know the user's order details.`;

// ── Dev-only debug payload ────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === "development";

function devExtra(err: unknown): Record<string, string> {
  if (!IS_DEV) return {};
  const message = err instanceof Error ? err.message : String(err);
  const stack   = err instanceof Error ? (err.stack ?? "") : "";
  return { debug: message, stack };
}

// ── Error classification ───────────────────────────────────────────────────────
// Anthropic SDK surfaces errors through a status code on the response and
// through the error message text.  We classify every failure surface so the
// log entry carries a machine-readable reason and the user message is
// appropriately specific.

type AiErrorKind =
  | "no_api_key"       // ANTHROPIC_API_KEY not set
  | "auth"             // 401 — invalid or revoked key
  | "credits"          // 402 / 529 — insufficient credits / overloaded
  | "rate_limit"       // 429 — too many requests
  | "network"          // fetch / ECONNREFUSED / timeout
  | "empty_response"   // SDK returned successfully but no text block
  | "unknown";         // anything else

function classifyError(error: unknown): AiErrorKind {
  if (!(error instanceof Error)) return "unknown";

  const msg = error.message.toLowerCase();
  // Anthropic SDK wraps HTTP errors with the status in the message or name
  const name = (error as { name?: string }).name?.toLowerCase() ?? "";
  const status = (error as { status?: number }).status;

  if (status === 401 || msg.includes("invalid x-api-key") || msg.includes("authentication")) {
    return "auth";
  }
  if (status === 402 || msg.includes("credit") || msg.includes("billing") || msg.includes("insufficient")) {
    return "credits";
  }
  if (status === 429 || name.includes("ratelimit") || msg.includes("rate limit") || msg.includes("too many request")) {
    return "rate_limit";
  }
  if (
    status === 529 ||
    status === 503 ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("service")
  ) {
    return "credits"; // treat service-unavailable the same as credits for the user message
  }
  if (
    msg.includes("fetch") ||
    msg.includes("econnrefused") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("enotfound")
  ) {
    return "network";
  }
  if (msg.includes("empty response")) {
    return "empty_response";
  }
  if (msg.includes("auth")) {
    return "auth";
  }
  return "unknown";
}

// User-facing messages keyed by error kind.  These never leak internal detail.
const USER_MESSAGES: Record<AiErrorKind, string> = {
  no_api_key:
    "Gardening questions are handled by our AI, but it's not configured yet. For plant care advice, check out our [product descriptions](/products) or contact us directly.",
  auth:
    "My gardening AI isn't responding right now — the API key may need updating. Try again later, or contact us for plant care advice.",
  credits:
    "Our gardening AI is temporarily unavailable. Try again in a little while, or contact us for plant care advice.",
  rate_limit:
    "Our gardening AI is a bit busy right now. Wait a moment and try again, or contact us for advice.",
  network:
    "I couldn't reach my gardening knowledge base — there may be a temporary network issue. Try again in a moment.",
  empty_response:
    "I had trouble getting a gardening answer right now. Try again in a moment, or contact us for advice.",
  unknown:
    "I had trouble reaching my gardening knowledge base. Try again in a moment, or contact us for advice.",
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGardeningAdvice(
  history: ChatMessage[]
): Promise<AssistantResponse> {
  // Guard: no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    log("warn", "ai_unavailable", { reason: "no_api_key" });
    return {
      reply: USER_MESSAGES.no_api_key,
      source: "fallback",
      intent: "gardening_advice",
    };
  }

  try {
    // Dynamic import so the module graph doesn't require the SDK at startup.
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 512,
      system: GARDENING_SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlock = response.content.find((b: any) => b.type === "text") as any;
    const text = textBlock?.text ?? "";
    if (!text) throw new Error("Empty response from AI");

    return { reply: text, source: "ai", intent: "gardening_advice" };

  } catch (error) {
    const kind = classifyError(error);

    // DEBUG: print the complete error object — stack trace included — so the
    // real cause is visible in the terminal rather than being silently swallowed.
    console.error("[assistant/ai] Anthropic API call failed (kind:", kind, "):", error);

    // Also log via the structured logger for machine-readable output.
    log("error", "ai_call_failed", {
      reason: kind,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      reply: USER_MESSAGES[kind],
      source: "fallback",
      intent: "gardening_advice",
      ...devExtra(error),
    };
  }
}