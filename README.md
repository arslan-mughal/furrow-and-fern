# Furrow & Fern — Phase 1–7 Storefront

A Next.js storefront for a gardening e-commerce brand, built phase by phase
and since upgraded to Next.js 16 (see "Upgrading to Next.js 16" below).
**Phase 1** (storefront MVP), **Phase 2** (accounts), **Phase 3** (Stripe
checkout + orders), **Phase 4** (admin dashboard, database-backed catalog),
**Phase 5** (real search & filters), **Phase 6** (real email), and
**Phase 7** (AI shopping assistant) are all built — every phase from the
original roadmap. **Admin User Management** (`/admin/users`) was added on
top afterward as its own request — see that section below. See "Where this
could go next" at the bottom for optional further hardening, not strictly
required for this to work.

## Run it locally

You'll need [Node.js 20.9+](https://nodejs.org) installed (required by Next.js 16).

### 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically (via `postinstall`). A
checked-in `.npmrc` (`legacy-peer-deps=true`) is what keeps this install
from failing outright — see "Upgrading to Next.js 16" below for why that's
there and when it's safe to remove.

### 2. Get a Postgres database

Accounts now persist to a real database. The fastest free option is
[Neon](https://neon.com) (or [Supabase](https://supabase.com) works too):

1. Create a free account and a new project.
2. Copy the connection string it gives you (starts with `postgresql://`).

### 3. Set environment variables

```bash
cp .env.example .env
```

Then fill in `.env`:

- `DATABASE_URL` — the Neon/Supabase connection string from step 2
- `BETTER_AUTH_SECRET` — generate one with `npx auth@latest secret`
- `BETTER_AUTH_URL` — leave as `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, see below
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` — optional, see below
- `RESEND_API_KEY` / `EMAIL_FROM` — optional, see "Setting up Resend" below

**Email/password login works with just `DATABASE_URL` and
`BETTER_AUTH_SECRET` set** — the social buttons and email sending are all
optional and degrade gracefully (a clear error, or a skipped send logged to
the console) if their credentials aren't set yet.

### 4. Create and seed the database

```bash
npm run db:push
npm run db:seed
```

`db:push` creates every table from `prisma/schema.prisma` (`user`, `session`,
`account`, `verification`, `Order`, `OrderItem`, `Category`, `Product`).
`db:seed` populates the 7 categories and 14 products that used to be
hardcoded in `lib/products.ts` — the storefront has nothing to show without
this step now. Run `npm run db:studio` any time to browse the data in a GUI.

### 5. Run it

```bash
npm run dev
```

Open http://localhost:3000, click the account icon in the header, and
create an account at `/register`.

### 6. Make yourself an admin

There's no sign-up flow for admins on purpose — the first one has to be
promoted by hand:

1. Register a normal account at `/register`.
2. Run `npm run db:studio`, open the `user` table, find your row, and
   change `role` from `customer` to `admin`.
3. Visit `/admin`. There's no link to it from the storefront nav — admins
   just go there directly.

Every admin *after* the first doesn't need Prisma Studio — promote them at
`/admin/users/[id]` instead, by changing their role from there.

### Setting up Google sign-in (optional)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth client ID → Web application.
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Copy the Client ID/Secret into `.env`.

### Setting up Facebook sign-in (optional)

1. [Facebook Developers](https://developers.facebook.com/apps) → Create App → add "Facebook Login" product.
2. Valid OAuth Redirect URI: `http://localhost:3000/api/auth/callback/facebook`
3. Copy the App ID/Secret into `.env`. Facebook requires a dedicated dev app to allow `localhost` callbacks — it won't accept them on a production app.

### Setting up Stripe (required for checkout)

1. Create a free [Stripe account](https://dashboard.stripe.com/register). You don't need to activate live payments — test mode works for everything below.
2. Copy your **test secret key** from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) into `.env` as `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The CLI prints a `whsec_...` value — copy that into `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Keep `stripe listen` running in its own terminal alongside `npm run dev` whenever you're testing checkout locally — without it, Stripe has nowhere to send the "payment succeeded" event, and no Order will ever get created.
6. At checkout, use [any Stripe test card](https://docs.stripe.com/testing#cards) — `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.

In production, you won't run `stripe listen` — instead you'll add a webhook endpoint in the Stripe Dashboard pointing at `https://yourdomain.com/api/webhooks/stripe` and use the signing secret it gives you.

### Setting up Resend (optional, for real email)

Without this, the app still runs fine — newsletter signups and orders still
work, emails are just skipped with a console warning instead of sent.

1. Create a free [Resend account](https://resend.com) and an [API key](https://resend.com/api-keys).
2. Put it in `.env` as `RESEND_API_KEY`.
3. Leave `EMAIL_FROM` as the default (`onboarding@resend.dev`) to start —
   it works immediately with no DNS setup, but can only send to the email
   address you signed up to Resend with.
4. To send to real customers, verify a domain in the Resend dashboard, then
   change `EMAIL_FROM` to an address at that domain (e.g.
   `Furrow & Fern <hello@yourdomain.com>`).

### Setting up the AI assistant (optional)

Without this, the chat widget (bottom-right corner, every page) still
opens and you can type messages — it just replies with an error instead
of an actual answer.

1. Create an [Anthropic Console account](https://console.anthropic.com) and an [API key](https://console.anthropic.com/settings/keys).
2. Put it in `.env` as `ANTHROPIC_API_KEY`.
3. Ask it something like "do you have anything under $20" or "what tools do you sell" — it calls back into the same `queryProducts()` the storefront's own search uses, so answers reflect whatever's actually in your database, including anything you've added or changed in `/admin`.
4. Sign in and ask "what's the status of my last order" to see the order-lookup tool in action — it only works for orders belonging to whoever's actually signed in.

## Upgrading to Next.js 16

This project was originally built on Next.js 14 and was upgraded to 16 once
that became current. A few things worth knowing about that upgrade
specifically:

- **React 19 came along with it, mandatorily.** Next.js made React 19 the
  minimum supported version starting with v15, and 16 carries that forward
  — there's no version of Next 16 that runs on React 18. `react`,
  `react-dom`, `@types/react`, and `@types/react-dom` are all bumped to 19
  in `package.json`.
- **`npm install` would otherwise fail outright** because `better-auth@1.x`
  still declares `peerOptional next@"^14.0.0 || ^15.0.0"` in its own
  package.json — it hasn't published an update widening that range to
  include Next 16 yet ([open issue](https://github.com/better-auth/better-auth/issues/6439)
  as of this writing). This is a packaging metadata lag, not an actual
  runtime incompatibility — better-auth's Next.js integration
  (`app/api/auth/[...all]/route.ts`) is just standard Request/Response
  objects, nothing version-specific. The checked-in `.npmrc`
  (`legacy-peer-deps=true`) tells npm to install anyway. Safe to delete once
  that issue closes and you've confirmed `npm install` succeeds without it.
- **Every page reading `params` or `searchParams` was updated** to treat
  them as Promises and `await` them — Next.js 15 made this the only
  option going forward, with 16 finishing that by removing the temporary
  synchronous fallback entirely. Six files touched:
  `app/products/page.tsx`, `app/products/[slug]/page.tsx`,
  `app/admin/products/[id]/page.tsx`, `app/admin/orders/[id]/page.tsx`,
  `app/checkout/success/page.tsx`, and `app/unsubscribe/page.tsx`. Every
  `headers()` call elsewhere in the app (`lib/admin.ts`, the checkout and
  assistant API routes, the account page) was already written as
  `await headers()` from the start, even back when Next 14 didn't strictly
  require it — so none of those needed touching.
- **Turbopack is now the default bundler** for both `next dev` and
  `next build`, not just dev. This project has no custom webpack
  configuration to migrate, so it's a non-issue here; if you add one later
  and it doesn't have a Turbopack equivalent, `next dev --webpack` /
  `next build --webpack` opt back out.
- **`next lint` was removed** in v16; the old `"lint": "next lint"` script
  is gone from `package.json` rather than left pointing at a removed
  command. This project never had ESLint configured to begin with, so
  nothing was lost — adding ESLint or Biome directly is the v16-recommended
  path if you want linting.
- **What wasn't touched**: no `"use cache"` directives were added anywhere.
  Next 16's Cache Components make all dynamic code request-time by default
  unless you opt in to caching — which is exactly the behavior this app
  already depended on (Prisma queries on every request, nothing relying on
  stale data), so the default needed no help.

## What's included

- **Home page** — hero, featured products, category strip, trust section, newsletter signup
- **Product listing** (`/products`) — search, category, price range, and in-stock filters, plus sorting; all run as a single Postgres query and are reflected in the URL (shareable, back-button-friendly)
- **Product detail** (`/products/[slug]`) — quantity selector, add to cart, related products
- **Cart** (`/cart`) — persists to `localStorage`, quantity controls, subtotal
- **Checkout** (`/checkout`) — reviews the cart, then redirects to a real Stripe Checkout session
- **Order pipeline** — a Stripe webhook records a paid `Order` in Postgres automatically and decrements stock in the same transaction; `/checkout/success` shows the receipt and doubles as the order-detail view linked from account history
- **Accounts** (`/login`, `/register`, `/account`) — email/password + Google/Facebook sign-in via [Better Auth](https://better-auth.com), sessions stored in Postgres, real order history
- **Admin dashboard** (`/admin`) — database-backed product & category CRUD, order list with status updates, basic stats. Gated by a `role` field on `User`; see "Phase 4 setup" below to bootstrap your first admin
- The product catalog itself now lives in Postgres (`Category`/`Product` models), seeded from `prisma/seed.ts`
- **Real email** via [Resend](https://resend.com) — newsletter signup (`Subscriber` table, working unsubscribe link), order confirmation on payment, "your order has shipped" when an admin marks an order Fulfilled. All sends are best-effort: a missing API key or provider error is logged and skipped, never breaks checkout or signup
- **AI shopping assistant** ("Sprout") — a chat widget on every page, backed by Claude (Haiku) with two tools: live product search against the real catalog, and order lookup scoped to whoever's actually signed in. Runs without an API key set too (the widget just shows an error reply)
- **Admin user management** (`/admin/users`) — search by name or email, paginated list, view/edit profile name, change role, activate/deactivate (revokes sessions + blocks sign-in), delete, and per-user order history. Built on Better Auth's official `admin` plugin rather than hand-rolled — see "User management architecture notes"
- Fully responsive, keyboard-focus-visible, respects `prefers-reduced-motion`

## Design system

The brand ("Furrow & Fern") draws on actual gardening artifacts — seed
packets and plant tags — rather than a generic storefront template:

| Token | Value | Use |
|---|---|---|
| `canopy` | `#1F3A2E` | Primary text/surface, deep forest green |
| `loam` | `#3B2A1F` | Body text |
| `parchment` | `#F2EDE1` | Page background |
| `marigold` | `#E0A030` | Primary CTA accent |
| `clay` | `#B5573A` | Secondary accent, sale tags |
| `sage` | `#D8E2D3` | Card/section surfaces |

Typefaces: **Fraunces** (display headlines), **Inter** (body), **Space Mono**
(prices, badges, category labels — the "stamped ticket" detail).

The signature element is the `.seed-packet` card: a dashed "perforation"
top edge used on product cards and the hero category tiles, echoing a torn
seed packet. It's the one deliberate visual flourish; everything else stays
quiet so it doesn't compete.

## Auth architecture notes

A few decisions worth knowing about if you extend this:

- **Better Auth, not NextAuth/Auth.js.** Auth.js merged into the Better
  Auth project and is now in maintenance mode (security patches only, no
  new features) — Better Auth is the maintainers' own recommendation for
  new projects as of this build.
- **Protected pages check the session directly**, not via `middleware.ts`.
  `/account` calls `auth.api.getSession()` server-side and redirects if
  there's no user. This is Better Auth's own recommended pattern —
  middleware-based session checks run on the Edge runtime, which doesn't
  support Prisma well, and Next.js middleware has had spoofing issues
  (CVE-2025-29927) when used as the sole gate for protected routes. Add the
  same `getSession` + `redirect` check to any new page you want to protect.
- **Prisma is pinned to 6.x**, not the newer 7.x line, which shipped a
  Rust-free client with a different setup (a `prisma.config.ts` file,
  driver adapters). 6.x uses the longer-established `prisma-client-js`
  generator, which is simpler to get right in a single pass.
- The cart lives in `localStorage`, independent of login, for both Phases 2
  and 3 — Stripe Checkout collects email regardless of auth state, so guest
  checkout works without any merge step. Logged-in orders are linked via
  Stripe's `client_reference_id`, set from the session at checkout time.

## Payments architecture notes

- **Stripe Checkout (hosted redirect), not Elements/Embedded Checkout.**
  Checkout offloads PCI compliance entirely and is Stripe's own recommendation
  unless you have a specific reason to build a custom payment form — this
  storefront doesn't.
- **The webhook is the only place that creates an `Order`.** Never the
  success-page redirect, which Stripe itself warns isn't reliable —
  the user's tab can close, or the network can drop, between Stripe
  confirming payment and the redirect completing. `/checkout/success`
  reads whatever the webhook already wrote; if it hasn't landed yet
  (normally a second or two), the page says so rather than faking it.
- **Prices are re-derived server-side, twice** — once in
  `app/api/checkout/route.ts` when building the Stripe line items, and again
  in the webhook handler when building the `OrderItem` rows. The client only
  ever sends `{ productId, quantity }`; it never sends a price. This is what
  stops a tampered request from checking out at an attacker-chosen amount.
- **The webhook handler is idempotent**, keyed on `stripeSessionId`. Stripe
  retries undelivered webhooks for up to 72 hours, and a single successful
  payment can fire more than one event type — both paths call the same
  function, which checks for an existing Order before creating one.
- **No `apiVersion` is pinned** in `lib/stripe.ts`. stripe-node defaults to
  the version it shipped with when unset; hand-picking a date string risked
  drifting out of sync with whichever `stripe` package version actually
  gets installed, which wasn't verifiable without running `npm install` here.
- **Stock decrements atomically with order creation** as of Phase 4 — both
  happen inside one `prisma.$transaction`. This is still best-effort, not a
  hard reservation system: stock is checked at checkout-creation time and
  decremented at payment-confirmation time, so two near-simultaneous
  checkouts for the last unit of something could both succeed. A real
  reservation system (decrementing at checkout creation, rolling back on
  expiry) would close that gap; out of scope for this pass.
- **Not built**: rate limiting on `/api/checkout`, refunds/cancellations,
  and `checkout.session.expired` handling. Reasonable next hardening steps,
  out of scope for this pass.

## Phase 4 architecture notes

- **Price stays a dollar `Float`, not integer cents**, on the `Product`
  model — inconsistent with `Order`/`OrderItem`, which use cents
  deliberately. Switching the whole storefront to cents would have touched
  nearly every component that displays or multiplies a price (`ProductCard`,
  cart, checkout review, …) for a precision benefit that doesn't really
  matter at this catalog's scale. Order math still happens in cents, which
  is the part that actually handles money.
- **`OrderItem.productId` is a plain string, not a foreign key to
  `Product`.** Deleting or repricing a product must never change what a
  past order says was purchased — order line items snapshot name/image/price
  at the moment of sale.
- **`lib/products.ts` kept every function name and return shape** it had as
  a static array (`getAllProducts`, `getProductBySlug`, etc.) — only the
  implementation changed, from filtering an array to querying Postgres. No
  page needed to change except to add `await`. This is the payoff of the
  abstraction Phase 1 set up specifically for this swap.
- **No admin sign-up flow, on purpose.** The first admin is promoted by hand
  via Prisma Studio (see setup step 6) — a self-serve "become an admin"
  endpoint would be a glaring privilege-escalation hole.
- **Server Actions, not a parallel `/api/admin/*` REST layer**, power every
  admin mutation (`app/admin/actions.ts`). Each one calls
  `requireAdminAction()` itself, re-checking admin status independently of
  whether the UI that called it would have allowed it — Server Actions are
  independently callable endpoints, not just buttons behind a gate.
- **Admin pages share the storefront's root layout** (header/footer/cart
  icon still render above the dashboard) rather than getting their own
  `<html>` shell. A fully separate admin shell is possible in the App
  Router via top-level route groups, but doing that here would have meant
  moving every existing Phase 1–3 route into a group folder — a wide,
  high-risk rename for a cosmetic win at this stage.
- **Product pages are now dynamically rendered**, not statically generated —
  Prisma queries aren't cached the way `fetch()` is in the App Router, so
  every request re-queries Postgres. Correct default for a catalog an admin
  can edit at any time; consider `unstable_cache` or ISR if traffic grows
  enough for it to matter.

## Phase 5 architecture notes

- **Filtering moved from the browser to Postgres.** Phase 1's
  `ProductsExplorer` fetched the whole catalog once and filtered an array in
  JS — fine for 14 hardcoded products, not a real pattern. `queryProducts()`
  in `lib/products.ts` now builds a single `Prisma.ProductWhereInput`
  (search, category, price range, in-stock) and lets Postgres do the work.
- **Filters live in the URL, not component state.** `/products?q=trowel&category=Tools&sort=price-asc`
  is a complete, shareable, back-button-friendly description of what's on
  screen. `ProductsExplorer` reads `currentParams` as a prop from the server
  (rather than calling the `useSearchParams()` hook itself) specifically to
  avoid the Suspense-boundary requirement that hook carries — the server
  component already parsed the URL once, so there's no reason for the
  client component to re-read it.
- **The search box is debounced (350ms) client-side**, then pushes a URL
  change, which re-runs the Server Component and re-queries Postgres.
  Price min/max commit on blur or Enter rather than every keystroke, for
  the same reason — typing "100" into a price field shouldn't fire three
  queries for "1", "10", and "100".
- **Search uses Postgres `ILIKE`** (Prisma's `contains` with
  `mode: "insensitive"`) against name and description — substring matching,
  not fuzzy/typo-tolerant search. A catalog at real scale would want
  Postgres full-text search (`tsvector`) or an external engine like
  Meilisearch/Algolia; substring matching is the right amount of
  engineering for this catalog's size.

## Phase 6 architecture notes

- **Hand-written HTML emails, not React Email**, despite React Email +
  Resend being the standard 2026 recommendation. React Email shipped a
  major v6 restructuring very recently (deprecating `@react-email/components`
  in favor of a unified package) and, at the time of writing, its own
  official scaffolding tool (`create-email`) has an open bug producing
  templates that fail to type-check out of the box. With no way to run
  `npm install` here to verify which package-version combination actually
  works, hand-rolled inline-styled HTML via Resend's plain `html` parameter
  sidesteps that whole risk surface. `lib/email.ts`'s `emailLayout()`
  helper keeps the three templates visually consistent; swapping in React
  Email later is a contained change, not a rewrite.
- **Every email send goes through one function** (`sendEmail` in
  `lib/email.ts`) that returns `false` and logs instead of throwing — on a
  missing API key, a Resend API error, or a network failure alike. None of
  this app's three triggers (newsletter welcome, order confirmation, order
  shipped) should ever fail the operation that caused them just because
  mail delivery had a problem; a lost order confirmation email is bad, a
  lost order is worse.
- **The unsubscribe link requires an explicit confirm step**, not an
  instant unsubscribe on page load. Corporate email security scanners
  (Outlook Safe Links, Proofpoint, Mimecast) prefetch every link in an
  inbound email to scan it — a GET request that mutates would silently
  unsubscribe people who never clicked anything.
- **`unsubscribeToken` is a separate value from the subscriber's `id`**,
  generated the same way (`cuid()`) but never otherwise exposed. Using the
  row's primary key directly in a public link would let someone walk
  sequential/short ids and unsubscribe other people.
- **Shipping emails fire on a status transition, not a status value** —
  `updateOrderStatus` only sends one when the previous status wasn't
  already `FULFILLED`, so clicking "Update" twice on an already-fulfilled
  order doesn't resend it.
- **Resend's free-tier constraint is worth knowing before it surprises
  you**: until you verify a domain, you can only send to the email address
  you signed up to Resend with — not to arbitrary customer addresses. Real
  end-to-end testing (subscribing with a different email, checking out as a
  guest with a different email) needs a verified sending domain.

## Phase 7 architecture notes

- **Claude Haiku, not a larger model.** The assistant's two jobs — search a
  14-product catalog and read back a few order rows — don't need frontier
  reasoning. `ASSISTANT_MODEL` in `lib/anthropic.ts` is the one line to
  change if you extend this with tasks that do.
- **No streaming.** Each chat turn is one request/response, even though it
  may involve multiple round-trips to Claude internally when a tool gets
  called. Streaming a response that's also running a tool-calling loop
  means bridging partial-JSON tool-call accumulation with token-by-token
  text streaming — solvable, but a meaningfully different and harder
  problem than the rest of this build, and not one to take on blind in a
  sandbox with no way to run the result. The "Sprout is thinking…" state
  covers the wait.
- **Order lookups are scoped server-side to the actual signed-in session,
  not to anything the client sends.** The chat widget never transmits a
  user id — `app/api/assistant/route.ts` resolves it from the session, the
  same way checkout does. There's no way to ask Sprout about someone else's
  order by guessing an ID, because the tool never accepts one.
- **The tool-calling loop is capped at 4 iterations** (`MAX_TOOL_ITERATIONS`
  in `lib/assistant.ts`) to bound both latency and API cost per chat
  message against a runaway back-and-forth.
- **Message/content types are typed loosely (`any`) at the SDK boundary in
  `lib/assistant.ts`**, rather than imported from the Anthropic SDK's
  nested type paths. Those paths are namespaced deeply enough, and have
  shifted across SDK versions enough, that importing one by exact name
  risked a compile error with no way to check here. The object shapes sent
  still match the documented Messages API exactly — the SDK accepts them
  structurally regardless of which named type they'd otherwise be checked
  against.
- **Not built**: conversation persistence (the chat resets on page
  reload), rate limiting on `/api/assistant` (same gap as `/api/checkout`),
  and product cards/links rendered inline in replies — Sprout can mention a
  product by name but won't render a clickable card for it; teaching the
  widget to parse structured product references out of a reply and render
  them was scoped out in favor of getting the core assistant right first.

## User management architecture notes

- **Built on Better Auth's official `admin` plugin** (`auth.api.listUsers`,
  `setRole`, `banUser`/`unbanUser`, `removeUser`, `adminUpdateUser`), not
  hand-rolled Prisma mutations. The reason that matters most: `banUser`
  correctly revokes the target's existing sessions and blocks future
  sign-in. A hand-written `prisma.user.update({ data: { banned: true } })`
  would set a flag that nothing actually checks — every session they
  already have would keep working until it naturally expired.
- **Schema fields the plugin requires** (`User.banned`, `banReason`,
  `banExpires`, `Session.impersonatedBy`) were added by hand to
  `schema.prisma` rather than via the `npx auth migrate` CLI the docs lead
  with, for the same reason as everything else in this build: no way to run
  it here. The docs' own "Schema" section is the documented fallback for
  exactly this case.
- **`defaultRole: "customer"`** is the only plugin option set — the
  `adminRoles` option (which roles count as admin) was deliberately left
  unset because its own default, `["admin"]`, already matches the role
  string this app has used since Phase 4. An earlier draft of this set a
  nonexistent `adminRole` (singular) option, found and corrected by
  fetching the actual current docs page rather than trusting an
  ambiguous search snippet from a third-party fork of the plugin.
- **"Edit profile" covers `name` only — not `email`.** Better Auth ties
  email to login identity and verification state; an arbitrary admin-side
  email edit (bypassing Better Auth's own validation) could leave
  `emailVerified` and any pending verification flow in an inconsistent
  state. Role and active/deactivated status go through the plugin's
  dedicated endpoints instead of a generic field edit, for the same
  reason `banUser` is used instead of a raw update.
- **Search is one field at a time** (Name *or* Email, picked via a
  dropdown next to the search box), not both simultaneously. The
  underlying `listUsers` endpoint's `searchField` parameter only accepts a
  single field — merging two separately-paginated queries into one results
  list would break the pagination math (`total`/`limit`/`offset`) the page
  relies on.
- **Self-protection**: an admin can't change their own role, deactivate
  themselves, or delete their own account through this UI — both the
  buttons (disabled, with a tooltip) and the underlying Server Actions
  (which throw if `userId === the caller's own id`) enforce this, not just
  the UI.
- **Deleting a user is a hard delete** (`auth.api.removeUser`), consistent
  with how `Order.userId` was designed back in Phase 3:
  `onDelete: SetNull`. Their past orders aren't deleted or orphaned — the
  admin order list just shows them as a deleted account going forward.
- **Confirmation is the existing `ConfirmSubmitButton`** (a native
  `window.confirm()` dialog before the form submits), matching how
  delete-product and delete-category already work, rather than a new
  custom in-page modal component.

## Project structure

```
app/
  layout.tsx                    Root layout — fonts, CartProvider, header/footer
  page.tsx                      Home page
  products/page.tsx             Reads URL filters, queries Postgres, renders results
  products/[slug]/page.tsx      Product detail
  cart/page.tsx                  Cart
  checkout/page.tsx              Cart review → creates a Stripe Checkout Session
  checkout/success/page.tsx      Order receipt / order-detail view
  login/page.tsx                 Sign in
  register/page.tsx              Sign up
  account/page.tsx               Protected account page + real order history
  admin/layout.tsx               Admin gate (requireAdminPage) + sub-nav
  admin/page.tsx                 Dashboard stats + recent orders
  admin/products/page.tsx        Product list, inline delete
  admin/products/new/page.tsx    Create product
  admin/products/[id]/page.tsx   Edit / delete product
  admin/categories/page.tsx      Category list, add, delete
  admin/orders/page.tsx          All orders
  admin/orders/[id]/page.tsx     Order detail + status update
  admin/users/page.tsx           User list — search by name/email, pagination
  admin/users/[id]/page.tsx      User detail — edit name, role, ban/unban, delete, order history
  admin/users/actions.ts         Server Actions wrapping Better Auth's admin plugin (setRole/banUser/etc.)
  admin/actions.ts               Server Actions for product/category/order mutations
  api/auth/[...all]/route.ts     Better Auth's catch-all route handler
  api/checkout/route.ts          Creates the Stripe Checkout Session (server-side pricing)
  api/webhooks/stripe/route.ts   Verifies Stripe's signature, writes the Order + decrements stock + emails a receipt
  api/subscribe/route.ts         Newsletter signup — upserts Subscriber, sends welcome email
  api/assistant/route.ts         Sprout chat endpoint — validates input, scopes order lookups to the session
  unsubscribe/page.tsx           Confirm-then-unsubscribe page (token-gated, no login required)
  unsubscribe/actions.ts         The actual unsubscribe mutation (separate from the page's GET render)
components/                     Storefront UI components
components/admin/                Admin-only UI components (ProductForm, ConfirmSubmitButton, UserSearchControls)
components/AssistantWidget.tsx   Floating chat widget, mounted in the root layout
lib/products.ts                 Catalog queries — Prisma-backed since Phase 4; queryProducts() (Phase 5) handles search/filter/sort
lib/cart-context.tsx            Cart state (React Context + localStorage)
lib/auth.ts                     Better Auth server config (Prisma adapter, providers)
lib/auth-client.ts              Better Auth React client (signIn/signUp/signOut/useSession)
lib/admin.ts                    Admin authorization (requireAdminPage, requireAdminAction)
lib/prisma.ts                   Prisma client singleton
lib/stripe.ts                   Lazy Stripe client
lib/checkout.ts                 Cart validation + server-side pricing (zod)
lib/money.ts                    Cents ⇄ dollars formatting helpers
lib/email.ts                    Resend client + hand-written HTML templates + send functions
lib/anthropic.ts                Lazy Anthropic client + model choice
lib/assistant.ts                System prompt, tools (search_products, get_my_orders), tool-calling loop
prisma/schema.prisma             User/Session/Account/Verification, Order/OrderItem, Category/Product, Subscriber
prisma/seed.ts                   Seeds the 7 categories and 14 products
```

## Where this could go next

Every phase from the original roadmap is built. Nothing below is a missing
phase — it's hardening and polish that would matter more at real scale or
before a genuine production launch than it does for this build:

- **Checkout/webhook hardening**: rate limiting, refund handling, `checkout.session.expired` cleanup
- **Assistant hardening**: rate limiting on `/api/assistant`, conversation persistence (currently resets on page reload)
- **Admin hardening**: bulk actions, product image upload (URLs only for now), audit log of who changed what, pagination on the products/orders tables (fine at this catalog's scale, not at thousands of rows)
- **Hard inventory reservation** — see "stock decrements atomically" in the Phase 3/4 notes above; current decrementing is best-effort, not a true reservation system
- **Full-text/fuzzy search** — current search is Postgres substring matching (`ILIKE`); see "Phase 5 architecture notes"
- **Welcome email on account registration** — deliberately skipped; see "Phase 6 architecture notes" for why
- **Email deliverability beyond Resend's defaults**: no retry/backoff on transient send failures, no DKIM/SPF guidance beyond "verify a domain in the dashboard", no email open/click tracking
- **Production launch readiness**: this has been run with `npm run dev` throughout — a real launch wants a `next build` pass checked for errors, Lighthouse/Core Web Vitals review, an actual domain with HTTPS, error monitoring (e.g. Sentry), and a CI step that runs `prisma migrate deploy` rather than the `db push` used here for fast local iteration

## Swapping in real product photos

Product images default to placeholder graphics (`https://placehold.co/...`)
generated from each product's name. As of Phase 4, you can replace any
product's image with a real photo URL directly from `/admin/products/[id]` —
no file editing required. There's no upload/storage integration (e.g. S3,
Cloudinary) yet, so it has to be a URL to an already-hosted image.
