/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Tell Next.js NOT to bundle these packages into the Server Components /
  // Server Actions build. Instead they are imported at runtime from
  // node_modules, exactly like a normal Node.js require().
  //
  // Why this is required:
  //
  // @prisma/client — The generated Prisma client references native Node.js
  // modules (node:net, node:tls, node:crypto, node:fs, node:dns) through
  // its connection pool. Webpack/Turbopack cannot inline these; attempting
  // to bundle them produces "Module not found: Can't resolve 'node:net'"
  // errors that cascade through every file that imports lib/auth.ts or
  // lib/prisma.ts, since both ultimately instantiate PrismaClient.
  //
  // better-auth — The auth library also imports Node.js built-ins and ships
  // its own CJS/ESM dual package. Bundling it causes similar resolution
  // failures and can break the plugin system's dynamic require() calls.
  //
  // This setting only affects the server-side bundle. The client bundle
  // never sees these packages (lib/auth.ts has no "use client" and is
  // never imported by client components directly).
  //
  // Next.js 15+ renamed this key from `serverComponentsExternalPackages`
  // (Next.js 13/14) to `serverExternalPackages`. This project targets
  // Next.js ^16.x so the current name is used here.
  serverExternalPackages: ["@prisma/client", "better-auth"],
};

module.exports = nextConfig;