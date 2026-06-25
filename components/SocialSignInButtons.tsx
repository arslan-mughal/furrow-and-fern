"use client";

import { signIn } from "@/lib/auth-client";

export function SocialSignInButtons() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-canopy/10" />
        <span className="stamp-badge text-loam/50">or continue with</span>
        <div className="h-px flex-1 bg-canopy/10" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => signIn.social({ provider: "google", callbackURL: "/account" })}
          className="rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam transition-colors hover:border-canopy"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => signIn.social({ provider: "facebook", callbackURL: "/account" })}
          className="rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam transition-colors hover:border-canopy"
        >
          Facebook
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-loam/50">
        Needs Google/Facebook credentials in <code>.env</code> — see README.
      </p>
    </div>
  );
}
