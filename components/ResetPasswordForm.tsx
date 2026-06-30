"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Better Auth redirects here with ?error=INVALID_TOKEN if the link was
  // already used or has expired (1 hour, per resetPasswordTokenExpiresIn's
  // default in lib/auth.ts). No token at all means someone navigated here
  // directly rather than via the emailed link.
  if (tokenError || !token) {
    return (
      <div className="seed-packet mx-auto max-w-sm p-6 text-center">
        <h1 className="font-display text-2xl text-canopy">Link expired</h1>
        <p className="mt-3 text-sm text-loam/70">
          This password reset link is invalid or has expired. Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="seed-packet mx-auto max-w-sm p-6 text-center">
        <h1 className="font-display text-2xl text-canopy">Password updated</h1>
        <p className="mt-3 text-sm text-loam/70">
          Your password has been changed. Any other devices you were signed in on have
          been signed out for security.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message ?? "Couldn't reset your password. Try requesting a new link.");
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="seed-packet mx-auto max-w-sm p-6">
      <h1 className="font-display text-2xl text-canopy">Choose a new password</h1>

      {error && (
        <p className="mt-4 rounded-card bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label htmlFor="password" className="text-xs text-loam/70">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
          <p className="mt-1 text-xs text-loam/50">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-xs text-loam/70">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:opacity-60"
        >
          {loading ? "Saving…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}
