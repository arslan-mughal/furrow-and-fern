"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export function VerifyEmailResult() {
  const searchParams = useSearchParams();
  // Better Auth's own catch-all route (/api/auth/verify-email) verifies the
  // token server-side before redirecting here — this page never sees the
  // token itself, only the outcome. On failure it appends ?error=invalid_token
  // (expired or already-used link); no error param means success.
  const failed = searchParams.get("error") !== null;

  if (failed) {
    return (
      <div className="seed-packet mx-auto max-w-sm p-6 text-center">
        <XCircle className="mx-auto h-10 w-10 text-clay" strokeWidth={1.5} />
        <h1 className="mt-3 font-display text-2xl text-canopy">Link expired</h1>
        <p className="mt-3 text-sm text-loam/70">
          This verification link is invalid or has expired. You can request a new one
          from the sign-in page.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-card bg-canopy px-4 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="seed-packet mx-auto max-w-sm p-6 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-canopy" strokeWidth={1.5} />
      <h1 className="mt-3 font-display text-2xl text-canopy">Email verified</h1>
      <p className="mt-3 text-sm text-loam/70">
        Your email is confirmed. You can now sign in to your account.
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
