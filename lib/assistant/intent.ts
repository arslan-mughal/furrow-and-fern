import type { Intent, IntentResult } from "./types";

// ── Patterns ──────────────────────────────────────────────────────────────────
// Each entry: [regex, base confidence]. The highest scorer wins.
// Patterns are ordered by specificity — more specific ones first so they
// score higher on overlapping inputs.

const PATTERNS: Array<{ intent: Intent; pattern: RegExp; weight: number }> = [
  // Order status — very specific phrases
  { intent: "order_status", pattern: /\b(where is my order|order status|status of my order|check.*order|my order.*status)\b/i, weight: 0.95 },
  { intent: "order_status", pattern: /\b(order|purchase|bought).*(status|update|progress|where|when)\b/i, weight: 0.8 },
  { intent: "order_status", pattern: /\b(what.*happened|any update).*(order|purchase)\b/i, weight: 0.75 },

  // Tracking
  { intent: "tracking", pattern: /\b(track|tracking number|track.*order|tracking.*id|track my package)\b/i, weight: 0.95 },
  { intent: "tracking", pattern: /\b(where.*package|courier|consignment)\b/i, weight: 0.8 },

  // Shipping status
  { intent: "shipping_status", pattern: /\b(ship|shipped|shipping|dispatched|dispatch|out for delivery)\b/i, weight: 0.85 },
  { intent: "shipping_status", pattern: /\b(when.*arrive|arriving|delivery.*date|estimated.*delivery)\b/i, weight: 0.8 },
  { intent: "shipping_status", pattern: /\b(how long|how many days|will.*arrive)\b/i, weight: 0.6 },

  // Order history
  { intent: "order_history", pattern: /\b(order history|past orders|previous orders|all.*orders|my orders|recent orders)\b/i, weight: 0.95 },
  { intent: "order_history", pattern: /\b(show me|list|view).*(orders|purchases)\b/i, weight: 0.85 },

  // Product availability
  { intent: "product_availability", pattern: /\b(in stock|out of stock|available|availability|stock level|do you have|do you sell|do you carry)\b/i, weight: 0.9 },
  { intent: "product_availability", pattern: /\b(find|looking for|search for|got any|have you got)\b.*(plant|seed|tool|pot|soil|fertilizer|garden)\b/i, weight: 0.75 },

  // Return policy
  { intent: "return_policy", pattern: /\b(return|refund|exchange|send.*back|bring.*back|return policy|money back|return process)\b/i, weight: 0.9 },

  // Contact
  { intent: "contact", pattern: /\b(contact|email|phone|call|reach|whatsapp|support|customer service|talk to|speak to|live chat)\b/i, weight: 0.9 },
  { intent: "contact", pattern: /\b(human|person|agent|representative|staff)\b/i, weight: 0.8 },

  // Gardening advice — plant care, growing tips
  { intent: "gardening_advice", pattern: /\b(how.*grow|how.*plant|how.*care|how.*water|how.*fertilize|how.*prune|how.*propagate|how.*germinate)\b/i, weight: 0.9 },
  { intent: "gardening_advice", pattern: /\b(best.*for.*garden|what.*soil|what.*fertilizer|what.*plant|when.*plant|when.*water)\b/i, weight: 0.8 },
  { intent: "gardening_advice", pattern: /\b(plant.*care|plant.*sick|leaves.*yellow|overwater|underwater|sunlight|indoor.*plant|outdoor.*plant)\b/i, weight: 0.85 },
  { intent: "gardening_advice", pattern: /\b(germination|seedling|cutting|propagation|compost|organic|pest.*control|soil.*pH)\b/i, weight: 0.8 },
  { intent: "gardening_advice", pattern: /\b(monstera|snake.*plant|pothos|cactus|succulent|orchid|fern|basil|tomato|herb)\b/i, weight: 0.7 },

  // Greeting / small talk
  { intent: "greeting", pattern: /^(hi|hello|hey|howdy|good morning|good evening|good afternoon|salaam|salam|hola|sup|what'?s up)\b/i, weight: 0.95 },
  { intent: "greeting", pattern: /\b(thanks|thank you|thx|bye|goodbye|see you|cheers|awesome|great|perfect|ok|okay|got it)\b/i, weight: 0.6 },
];

// ── Entity extraction ─────────────────────────────────────────────────────────

const ORDER_ID_RE = /\b#?([A-Z0-9]{6,12})\b/i;

function extractEntities(text: string): IntentResult["entities"] {
  const entities: IntentResult["entities"] = {};

  const orderIdMatch = text.match(ORDER_ID_RE);
  if (orderIdMatch) {
    entities.orderId = orderIdMatch[1].toUpperCase();
  }

  return entities;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

interface Score {
  intent: Intent;
  score: number;
}

export function detectIntent(text: string): IntentResult {
  const scores = new Map<Intent, number>();

  for (const { intent, pattern, weight } of PATTERNS) {
    if (pattern.test(text)) {
      const current = scores.get(intent) ?? 0;
      // Accumulate: multiple matches for the same intent raise confidence
      scores.set(intent, Math.min(1, current + weight * 0.6));
    }
  }

  if (scores.size === 0) {
    return { intent: "unknown", confidence: 0, entities: extractEntities(text) };
  }

  // Pick the intent with the highest combined score
  const sorted: Score[] = [...scores.entries()]
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);

  const top = sorted[0];

  return {
    intent: top.intent,
    confidence: Math.min(1, top.score),
    entities: extractEntities(text),
  };
}
