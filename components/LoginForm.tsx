"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { SocialSignInButtons } from "./SocialSignInButtons";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn.email({ email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Incorrect email or password.");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="seed-packet mx-auto max-w-sm p-6">
      <h1 className="font-display text-2xl text-canopy">Welcome back</h1>
      <p className="mt-1 text-sm text-loam/70">Sign in to your Furrow &amp; Fern account.</p>

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
        <div>
          <label htmlFor="password" className="text-xs text-loam/70">
            Password
          </label>
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
