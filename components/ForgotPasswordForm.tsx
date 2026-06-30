"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: requestError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setLoading(false);

    // Always show the "submitted" state regardless of whether the email
    // exists — Better Auth's own enumeration-protection guidance applies
    // here too: don't let a different response reveal whether an account
    // exists for this address.
    if (requestError) {
      setError("Something went wrong. Please try again in a moment.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="seed-packet mx-auto max-w-sm p-6 text-center">
        <h1 className="font-display text-2xl text-canopy">Check your email</h1>
        <p className="mt-3 text-sm text-loam/70">
          If an account exists for <span className="text-loam">{email}</span>, we&apos;ve sent
          a link to reset your password. It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-canopy underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="seed-packet mx-auto max-w-sm p-6">
      <h1 className="font-display text-2xl text-canopy">Forgot your password?</h1>
      <p className="mt-1 text-sm text-loam/70">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      {error && (
        <p className="mt-4 rounded-card bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label htmlFor="email" className="text-xs text-loam/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-loam/70">
        <Link href="/login" className="font-medium text-canopy underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
