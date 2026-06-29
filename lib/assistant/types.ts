// ── Intents ───────────────────────────────────────────────────────────────────

export type Intent =
  | "order_status"
  | "tracking"
  | "shipping_status"
  | "order_history"
  | "product_availability"
  | "return_policy"
  | "contact"
  | "gardening_advice"
  | "greeting"
  | "unknown";

export const GARDENING_INTENTS: Intent[] = ["gardening_advice"];
export const DB_INTENTS: Intent[] = [
  "order_status",
  "tracking",
  "shipping_status",
  "order_history",
  "product_availability",
];
export const FAQ_INTENTS: Intent[] = ["return_policy", "contact"];

// ── Detection result ──────────────────────────────────────────────────────────

export interface IntentResult {
  intent: Intent;
  /** 0–1: how confident the pattern match is */
  confidence: number;
  entities: {
    orderId?: string;
    productQuery?: string;
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface AssistantContext {
  /** Server-verified user id from the session — never from the client */
  userId: string | null;
  /** Anonymised IP for rate limiting and logging */
  ip: string;
}

// ── Chat message (matches the API contract) ───────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Response ──────────────────────────────────────────────────────────────────

export type ResponseSource = "db" | "faq" | "ai" | "fallback";

export interface AssistantResponse {
  reply: string;
  source: ResponseSource;
  intent: Intent;
}
