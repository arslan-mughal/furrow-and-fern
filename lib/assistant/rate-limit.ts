/**
 * In-memory sliding-window rate limiter. Works correctly for a single
 * Next.js process. For multi-instance deployments (e.g. Vercel with multiple
 * serverless functions), swap this for an Upstash Redis rate limiter — the
 * interface is identical, only the store changes.
 */

interface Window {
  /** Timestamps of each request in the current window (ms). */
  timestamps: number[];
}

const store = new Map<string, Window>();

// Clean expired entries every 5 minutes so the map doesn't grow unbounded.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, window] of store.entries()) {
      // Remove windows that have no recent timestamps in the last 2 minutes
      if (window.timestamps.every((ts) => now - ts > 120_000)) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't keep the Node process alive just for cleanup
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Check and record a request for `key` (typically an IP address).
 * @param key       Identifier — usually the client IP
 * @param limit     Max requests allowed in the window
 * @param windowMs  Rolling window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const cutoff = now - windowMs;

  if (!store.has(key)) {
    store.set(key, { timestamps: [] });
  }

  const window = store.get(key)!;

  // Slide the window: drop timestamps older than the cutoff
  window.timestamps = window.timestamps.filter((ts) => ts > cutoff);

  const count = window.timestamps.length;

  if (count >= limit) {
    // Oldest timestamp tells us when the window will free a slot
    const oldest = window.timestamps[0]!;
    return {
      allowed: false,
      remaining: 0,
      resetInMs: oldest + windowMs - now,
    };
  }

  // Allow — record this request
  window.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - window.timestamps.length,
    resetInMs: windowMs,
  };
}

// ── Preconfigured limit profiles ──────────────────────────────────────────────

/** General assistant messages: 30 per minute per IP */
export function checkAssistantLimit(ip: string): RateLimitResult {
  return checkRateLimit(ip, 30, 60_000);
}

/** AI (Anthropic) calls: 10 per minute per IP — they're expensive */
export function checkAiLimit(ip: string): RateLimitResult {
  return checkRateLimit(ip, 10, 60_000);
}
