/**
 * Anthropic client helpers — single source of truth for the model name.
 *
 * The assistant only calls the Anthropic API for gardening-advice questions
 * (lib/assistant/ai.ts).  All other intents — order lookups, FAQ, product
 * availability — run without an API key and are unaffected by any Anthropic
 * outage or misconfiguration.
 *
 * ASSISTANT_MODEL is imported by lib/assistant/ai.ts so the model string
 * is declared exactly once.  getAnthropicOrNull / getAnthropic are available
 * for future use outside the assistant (e.g. batch processing, internal
 * tooling) but are not part of the main request path.
 */

import Anthropic from "@anthropic-ai/sdk";

/** Returns a client if ANTHROPIC_API_KEY is set, otherwise null. */
export function getAnthropicOrNull(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/** Returns a client, throws with a clear message if the key is missing. */
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. The assistant works without it " +
      "(orders, FAQ, products), but gardening-advice questions require it. " +
      "Add it to .env — see README.md Phase 7 setup."
    );
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const ASSISTANT_MODEL = "claude-haiku-4-5-20251001";