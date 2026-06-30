"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, authClient } from "@/lib/auth-client";
import { SocialSignInButtons } from "./SocialSignInButtons";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Set when sign-in fails specifically because the email isn't verified
  // yet (Better Auth returns 403 for this — see requireEmailVerification
  // in lib/auth.ts). Shown as a distinct message with a resend action,
  // rather than the generic "incorrect email or password" text.
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUnverified(false);
    setResendSent(false);
    setLoading(true);

    const result = await signIn.email({ email, password });

    setLoading(false);

    if (result.error) {
      if (result.error.status === 403) {
        setUnverified(true);
        return;
      }
      setError(result.error.message ?? "Incorrect email or password.");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    await authClient.sendVerificationEmail({ email, callbackURL: "/verify-email" });
    setResending(false);
    setResendSent(true);
  }

  return (
    <div className="seed-packet mx-auto max-w-sm p-6">
      <h1 className="font-display text-2xl text-canopy">Welcome back</h1>
      <p className="mt-1 text-sm text-loam/70">Sign in to your Furrow &amp; Fern account.</p>

      {error && (
        <p className="mt-4 rounded-card bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}

      {unverified && (
        <div className="mt-4 rounded-card bg-marigold/10 px-3 py-2 text-sm text-loam">
          <p>Please verify your email before signing in.</p>
          {resendSent ? (
            <p className="mt-1 text-xs text-loam/70">Verification email sent — check your inbox.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-1 text-xs font-medium text-canopy underline disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
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
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs text-loam/70">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-canopy underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <SocialSignInButtons />

      <p className="mt-6 text-center text-sm text-loam/70">
        New here?{" "}
        <Link href="/register" className="font-medium text-canopy underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
