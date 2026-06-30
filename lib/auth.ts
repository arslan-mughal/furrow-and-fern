import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

// Social providers are only registered if their credentials are present, so
// the app still runs (email/password works) before you've set up Google or
// Facebook OAuth apps. See README.md "Phase 2 setup" for how to add them.
type SocialProviderConfig = { clientId: string; clientSecret: string };
const socialProviders: { google?: SocialProviderConfig; facebook?: SocialProviderConfig } = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  // Required for production. Without an explicit baseURL, Better Auth tries
  // to infer its own origin from the incoming request — this works on
  // localhost but is unreliable behind Vercel's proxy/edge layer, and a
  // mismatch causes EVERY sign-in/sign-up/session request to fail with
  // "Invalid origin" (returned as result.error.message, not a thrown
  // error — which is why the login form showed a generic error rather
  // than crashing). See:
  //   https://github.com/better-auth/better-auth/issues/2203
  //   https://github.com/better-auth/better-auth/discussions/7437
  //
  // BETTER_AUTH_URL was already documented in .env.example and used by
  // lib/email.ts for building links in emails, but never actually passed
  // to the Better Auth instance itself — that's the gap this fixes.
  //
  // Set BETTER_AUTH_URL in Vercel's Environment Variables to your real
  // production URL, e.g. "https://furrow-and-fern.vercel.app" or your
  // custom domain. Falls back to localhost so local dev keeps working
  // unconfigured.
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Explicitly list which origins are allowed to make authenticated
  // requests. baseURL alone covers same-origin cookie/session behaviour,
  // but trustedOrigins is the belt-and-suspenders check Better Auth's own
  // issue threads recommend for production — it stops the origin check
  // from silently depending on inference in edge cases (redirects,
  // proxied requests, etc).
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,

    // Hard requirement: unverified accounts cannot sign in at all. Better
    // Auth enforces this itself (returns 403 on signIn.email for an
    // unverified user) — LoginForm.tsx handles that error and offers a
    // resend link, it doesn't need to duplicate this check.
    requireEmailVerification: true,

    // Fires when a signed-in user requests a password reset (the "forgot
    // password?" flow). `url` already contains the token; we just need to
    // deliver it. Per Better Auth's docs, this is NOT awaited — emailing is
    // fire-and-forget here to avoid leaking timing information about
    // whether the address exists (email enumeration protection).
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail(user.email, url);
    },

    // Resetting a password kills every other active session for that
    // account — appropriate when a reset usually means "I think someone
    // else might have my password."
    revokeSessionsOnPasswordReset: true,
  },

  // Fires on signup (sendOnSignUp) and can also be triggered manually from
  // the client (authClient.sendVerificationEmail) or server
  // (auth.api.sendVerificationEmail) — used by the admin "Resend
  // verification" action in app/admin/users/actions.ts.
  emailVerification: {
    sendOnSignUp: true,
    // Without this, a signed-out user hitting the 403 on signIn.email
    // wouldn't get a fresh email purely from retrying sign-in — they'd be
    // limited to the explicit "Resend verification email" button in
    // LoginForm.tsx. Both paths are kept: this covers the case where
    // someone just retries their password a few times.
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail(user.email, url);
    },
  },

  socialProviders,
  plugins: [
    // Powers /admin/users: listUsers (search + pagination), setRole,
    // banUser/unbanUser (revokes sessions + blocks sign-in), removeUser.
    // defaultRole matches what this app already uses (Phase 4) instead of
    // the plugin's own "user" default. adminRoles isn't set because its
    // own default (["admin"]) already matches this app's admin role string.
    admin({
      defaultRole: "customer",
    }),
  ],
});