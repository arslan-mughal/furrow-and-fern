"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { SocialSignInButtons } from "./SocialSignInButtons";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signUp.email({ name, email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Couldn't create that account.");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="seed-packet mx-auto max-w-sm p-6">
      <h1 className="font-display text-2xl text-canopy">Create your account</h1>
      <p className="mt-1 text-sm text-loam/70">Track orders and check out faster.</p>

      {error && (
        <p className="mt-4 rounded-card bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label htmlFor="name" className="text-xs text-loam/70">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
          <p className="mt-1 text-xs text-loam/50">At least 8 characters.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <SocialSignInButtons />

      <p className="mt-6 text-center text-sm text-loam/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-canopy underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
