import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

/**
 * NOTE: `useSession` is intentionally NOT re-exported here.
 *
 * better-auth's React `useSession()` hook calls an internal `useStore` that
 * crashes with "Cannot read properties of null (reading 'useRef')" during
 * Next.js App Router server-side prerendering — confirmed upstream bug,
 * reproduced on both React 18 and 19, Next.js 15 and 16:
 *   https://github.com/better-auth/better-auth/issues/3123
 *
 * It crashes /_not-found and /_global-error specifically because those are
 * the only routes Next.js forces through full static prerendering even when
 * nothing in the app opts into that — so any client component in the root
 * layout that uses this hook takes down the entire build.
 *
 * The upstream-recommended workaround is to use `authClient.getSession()`
 * (a plain async function, not a hook) instead. See components/Header.tsx
 * for the pattern: fetch the session in a useEffect after mount, so it
 * never executes during server-side prerendering at all.
 */
export const { signIn, signUp, signOut } = authClient;