"use client";

import { useState, type FormEvent } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setStatus("error");
        return;
      }

      setStatus("submitted");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <section className="bg-canopy">
      <div className="mx-auto max-w-6xl px-6 py-16 text-parchment">
        <div className="max-w-md">
          <h2 className="font-display text-2xl">Stay rooted</h2>
          <p className="mt-2 text-sm text-parchment/80">
            Seasonal planting tips and first dibs on new arrivals — once a
            month, never spammy.
          </p>
          {status === "submitted" ? (
            <p className="mt-5 stamp-badge text-marigold">
              You&apos;re on the list — check your inbox for a welcome note.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-card border border-parchment/30 bg-canopy px-4 py-2 text-sm text-parchment placeholder:text-parchment/50 focus:border-marigold"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 rounded-card bg-marigold px-5 py-2 text-sm font-semibold text-loam transition-colors hover:bg-parchment disabled:opacity-60"
              >
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && error && (
            <p className="mt-3 text-sm text-marigold">{error}</p>
          )}
        </div>
      </div>
    </section>
  );
}
