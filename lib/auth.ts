import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

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
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
