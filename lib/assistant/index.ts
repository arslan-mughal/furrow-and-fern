import type { ChatMessage, AssistantContext, AssistantResponse } from "./types";
import { detectIntent } from "./intent";
import {
  handleOrderStatus,
  handleTracking,
  handleOrderHistory,
  handleProductAvailability,
  handleReturnPolicy,
  handleContact,
  handleShippingFAQ,
  handleGreeting,
  handleUnknown,
} from "./handlers";
import { handleGardeningAdvice } from "./ai";
import { log } from "./logger";

const AI_AVAILABLE = Boolean(process.env.ANTHROPIC_API_KEY);

// ── Dev-only debug payload ────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === "development";

function devExtra(err: unknown): Record<string, string> {
  if (!IS_DEV) return {};
  const message = err instanceof Error ? err.message : String(err);
  const stack   = err instanceof Error ? (err.stack ?? "") : "";
  return { debug: message, stack };
}

export async function runAssistant(
  history: ChatMessage[],
  ctx: AssistantContext
): Promise<AssistantResponse> {
  const start = Date.now();

  // The last user message drives intent detection
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return {
      reply: "I didn't catch that — could you try again?",
      source: "fallback",
      intent: "unknown",
    };
  }

  const detected = detectIntent(lastUser.content);

  log("info", "intent_detected", {
    intent: detected.intent,
    confidence: Math.round(detected.confidence * 100) / 100,
    userId: ctx.userId,
    ip: ctx.ip,
  });

  let response: AssistantResponse;

  try {
    switch (detected.intent) {
      // ── DB handlers ──────────────────────────────────────────────────────
      case "order_status":
        response = await handleOrderStatus(ctx.userId);
        break;

      case "tracking":
        response = await handleTracking(ctx.userId);
        break;

      case "shipping_status":
        // "When will my order arrive?" → check DB first; if not logged in
        // or no order found, fall back to the static shipping FAQ.
        if (ctx.userId) {
          response = await handleTracking(ctx.userId);
        } else {
          response = await handleShippingFAQ();
        }
        break;

      case "order_history":
        response = await handleOrderHistory(ctx.userId);
        break;

      case "product_availability":
        // Pass either an extracted product name or the full message as
        // the search query so Prisma can find the most relevant results.
        response = await handleProductAvailability(
          detected.entities.productQuery ?? lastUser.content
        );
        break;

      // ── FAQ handlers (no DB, no AI) ───────────────────────────────────
      case "return_policy":
        response = await handleReturnPolicy();
        break;

      case "contact":
        response = await handleContact();
        break;

      // ── AI handler (gardening only) ───────────────────────────────────
      case "gardening_advice":
        response = await handleGardeningAdvice(history);
        break;

      // ── Greeting ──────────────────────────────────────────────────────
      case "greeting":
        response = await handleGreeting();
        break;

      // ── Unknown intent ────────────────────────────────────────────────
      default: {
        // Low-confidence gardening signals → try AI if available
        if (AI_AVAILABLE && detected.confidence > 0.3) {
          response = await handleGardeningAdvice(history);
        } else {
          response = await handleUnknown(AI_AVAILABLE);
        }
        break;
      }
    }
  } catch (err) {
    // DEBUG: print the complete error object — stack trace included — so the
    // real cause is visible in the terminal rather than being silently swallowed.
    console.error("[assistant/index] Handler threw for intent", detected.intent, ":", err);

    const message = err instanceof Error ? err.message : String(err);
    log("error", "handler_error", {
      intent: detected.intent,
      error: message,
      userId: ctx.userId,
    });
    response = {
      reply:
        "Something went wrong on my end — please try again in a moment. If the issue persists, contact us directly.",
      source: "fallback",
      intent: detected.intent,
      ...devExtra(err),
    } as AssistantResponse;
  }

  log("info", "request_complete", {
    intent: detected.intent,
    source: response.source,
    latencyMs: Date.now() - start,
    userId: ctx.userId,
  });

  return response;
}

export type { ChatMessage, AssistantContext, AssistantResponse };