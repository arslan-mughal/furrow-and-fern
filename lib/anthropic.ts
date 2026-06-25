import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env — see README.md Phase 7 setup."
      );
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// Haiku: fast and inexpensive, which fits a chat-widget product-Q&A/order-
// lookup assistant well — the tasks below (search the catalog, read back a
// few orders) don't need a frontier reasoning model. Swap to
// "claude-sonnet-4-6" if you extend this with more complex tasks later.
export const ASSISTANT_MODEL = "claude-haiku-4-5-20251001";
