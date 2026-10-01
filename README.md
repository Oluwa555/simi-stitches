# Simi Stitches

## Overview
Simi Stitches is an online shop that sells Nigerian clothing materials
(fabrics) for women. The shop owner is also a local fashion designer.
This is an individual project for HNG15 Lesson 2.

Target customers: women in Nigeria buying fabric for outfits.

Design feel: colorful, elegant and mobile-first (most customers shop on
phones).

## Goal
Build a working online shop where customers can browse products, sign in
with Google, check out, and get a confirmation email. All data is saved in
a database. The finished site will be deployed online.

## Tech Stack
- Frontend: Next.js 16 (JavaScript, App Router, Tailwind CSS v4, ESLint)
- Database and auth: Supabase (data via `@supabase/supabase-js`; Google
  sign-in via `@supabase/ssr` cookie sessions)
- Emails: Mailgun (order confirmation emails)
- Google sign-in: Google Cloud Console (OAuth) — registered on the
  Supabase project, so the site talks to Supabase Auth, which talks to
  Google
- Secrets: stored in `.env` (never committed, never written in this file)

## Features
Planned, in build order:
1. Shop pages (browse products) ✅ working
2. Shopping cart (add, quantities, remove, ₦ subtotal, survives refresh) ✅ working
3. Checkout flow (form + server-side order saving + confirmation page) ✅ working — proof order kept in the database (\"Test Buyer\", ₦105,000, status `pending`)
4. Google sign-in via Google Cloud Console ✅ built (code complete, build
   + lint verified; owner's browser test pending)
5. Order confirmation emails via Mailgun
6. Deployment

## Database Schema
Supabase project is already created. Tables:
- `products`: the items for sale (sample products added; columns confirmed 2026-09-30 via a read-only Supabase API call)
- `orders`: one row per customer order
- `order_items`: the products inside each order
  (expected to link to `orders` and `products`)

Products are fabrics sold by a unit (per yard, per 6 yards, per set, or
any other wording the owner enters — sample data also contains
"per 5 yards" and "per 3 yards"). The unit is always shown next to the
price.

`products` columns (confirmed):
- `id` — uuid, primary key
- `name` — e.g. "Ankara Print Fabric"
- `description` — e.g. "Vibrant cotton wax print, 6 yards"
- `price` — number in Naira (e.g. 15000.00), displayed as ₦15,000
- `image_url` — image link (sample rows use placehold.co placeholders)
- `category` — e.g. Ankara, Aso Oke, Lace, Adire
- `unit` — e.g. "per 6 yards", "per set"
- `stock` — number (e.g. 20)
- `created_at` — timestamp

`orders` columns (confirmed 2026-10-01 via the service-role key):
- `id` — uuid, primary key
- `created_at` — timestamp
- `customer_name`, `customer_email`, `customer_phone`, `shipping_address`,
  `city`, `state` — text (the last three were added this session)
- `total` — number in Naira, calculated on the server (never trusted
  from the browser)
- `status` — text, new orders are `"pending"` (no payment integration yet)
- `user_id` — uuid, nullable; now filled with the signed-in user's id,
  read from the **server-side session cookie** in `POST /api/orders`.
  NULL for guests and for the older proof order.

`order_items` columns (confirmed 2026-10-01):
- `id` — uuid, primary key
- `order_id` — uuid, links to `orders.id`
- `product_id` — uuid, links to `products.id`
- `quantity` — integer
- `unit_price` — number in Naira, copied from `products.price` at order time
- (no `created_at` column on this table — not needed)

## Current Status
Updated 2026-10-01 (18:03), after the fourth coding session (Google
sign-in via Supabase Auth).

Working:
- Next.js app lives in this folder (JavaScript, App Router, Tailwind CSS v4, ESLint).
- Shop home page, header with cart badge, and shopping cart (React Context
  + `localStorage`, key `simi-stitches-cart`) — all working as before.
- `/checkout`: real form (full name, email, phone, delivery address, city,
  state — all required, valid email check). Phone accepts **only Nigerian
  numbers**: 11 digits starting with 0 (e.g. 08012345678) or +234 followed
  by 10 digits (e.g. +2348012345678); spaces/dashes are ignored. The same
  rule runs in the browser (`lib/validatePhone.js`, shared by form and API)
  and on the server (`POST /api/orders`) — invalid numbers get a clear
  error message in both places. Empty cart redirects to `/cart`. Order
  summary beside the form (items + subtotal in ₦, stacked on mobile).
- `POST /api/orders` (server-only Supabase client
  `lib/supabaseServer.js`, key `SUPABASE_SERVICE_ROLE_KEY` with no
  `NEXT_PUBLIC_` prefix — never reaches the browser, verified by grepping
  the built client bundles): re-validates everything, fetches real prices
  from `products`, calculates the total on the server, inserts one
  `orders` row (`pending`, `user_id` from the signed-in user's session,
  or NULL for a guest) plus `order_items` rows with
  `unit_price`; deletes the order if the items fail (no half-saved data);
  returns the new order id. Submit button disables with "Placing order…"
  and failures show a red error box (retry allowed).
- `/order-confirmation/[id]` (server-rendered): thank-you + customer name,
  order ID, status badge, address, items and server-calculated total;
  unknown ID → 404 page.
- Success clears the cart and redirects to the confirmation page.
- Proof order kept in the database (owner's choice): "Test Buyer",
  ₦105,000 (15,000×1 + 45,000×2), status `pending`. Phone-validation test
  orders were cleaned up.
- `.env.example` lists all four variable names (values blank), including
  `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- **Google sign-in** (new, this session): header shows a rose "Sign
  in" button when signed out, and Google photo + name + "Sign out" when
  signed in. Powered by `@supabase/ssr` (owner approved the install) —
  a **browser** client (`lib/supabaseBrowser.js`) and a **server,
  anon-key** client (`lib/supabaseServerAuth.js`, kept separate from the
  service-role `lib/supabaseServer.js`). Google returns to
  `app/auth/callback/route.js`, which swaps the one-time code for a
  session cookie stored in cookies. Cancel or failure sends the shopper
  home with a friendly amber banner (`components/AuthMessage.js`,
  rendered once in `app/layout.js`).
- `orders.user_id` is now filled in inside `POST /api/orders` from the
  **server-read cookie session** (`getCurrentUser()`) — never from a
  value the browser sends. Guests still save `user_id` NULL.
- `/checkout` pre-fills name + email when signed in (both stay
  editable); phone, address, city and state stay blank. Guests check
  out exactly as before (no sign-in wall).
- Secret handling unchanged: the same 4 `.env.local` variables are
  enough; no new secret was added anywhere.
- `npm run build` ✅ (7 routes, including the dynamic `/auth/callback`)
  and `npm run lint` ✅ (0 errors, **0 warnings** — checked 2026-10-01);
  `/`, `/cart`, `/checkout` all return 200; `/auth/callback` with no
  code → 307 to `/?auth=cancelled`; service-role key grepped out of the
  built output — **no leak**.

Confirmed working in the owner's browser (2026-09-30): 4 product cards
(Ankara Print Fabric ₦15,000 per 6 yards, Aso Oke (Woven) ₦45,000 per
set, French Lace ₦38,000 per 5 yards, Adire Fabric ₦12,000 per 3
yards). The cart, checkout and sign-in browser tests by the owner are
still unreported — test lists are in the Session Log below.

Not done yet:
- **Owner must add the redirect URL in Supabase** (see Next Steps 1) or
  the Google round-trip will not finish.
- No git repository yet (`git init` has never been run) — nothing is
  version-controlled.
- Mailgun confirmation emails, then deployment: not started.
- Cart, checkout and sign-in browser tests by the owner not reported.
- Stock is NOT reduced when an order is placed (spec decision).
- Product images are grey placehold.co placeholders.

Files and secrets:
- `.gitignore` protects `.env`, `.env.local` and every other `.env*`
  file.
- `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (an alias line with the same value),
  and `SUPABASE_SERVICE_ROLE_KEY` (server-only). Key values were never
  printed or written into any document.
- `.env.example` lists the same 4 variable names with blank values.

Run it:
```bash
npm run dev     # then open http://localhost:3000
npm run build   # production check
npm run lint    # code-rules check
```

## Decisions
- Next.js chosen as the frontend framework.
- Supabase handles both the database and authentication.
- Build order is shop pages and checkout, then Google sign-in, then
  Mailgun emails, then deploy. This gets the core shopping flow working
  before the extras.
- Secrets live in `.env` only, and `.env` must be in `.gitignore`.
- Currency is Nigerian Naira (₦). Prices are shown formatted like ₦15,000.
- Design is colorful, elegant and mobile-first, because most customers
  shop on phones. Build and test the small-screen layout first.
- Each product shows its unit (per yard, per 6 yards, or per set) next to
  the price, so customers know what they are buying.
- JavaScript instead of TypeScript: simpler for a beginner; the project
  can move to TypeScript later without rewriting the pages.
- `create-next-app` could not be downloaded (network outage), so the
  starter files were hand-written in the standard layout — same result,
  fewer moving parts.
- Product cards use a plain `<img>` tag because `image_url` values can
  point to any host; `next/image` would first need a list of allowed
  hosts in `next.config.mjs`.
- The home page is a client component (`"use client"`) that fetches from
  Supabase in the browser — that is why the env vars need the
  `NEXT_PUBLIC_` prefix to be exposed to browser code.
- 2026-09-30 (cart): cart state lives in React Context
  (`context/CartContext.js`) and mirrors itself to `localStorage` (key
  `simi-stitches-cart`) — browser-only for now; nothing goes to Supabase
  until checkout is built.
- 2026-09-30 (cart): the Header lives in `app/layout.js` wrapped in
  `CartProvider`, so the badge shows on every page; the cart icon is an
  inline SVG (no icon library added).
- 2026-09-30 (cart): adding a product already in the cart increases its
  quantity instead of duplicating the row; the "−" button is disabled at
  quantity 1 (use Remove instead).
- 2026-09-30 (cart): `eslint.config.mjs` was rewritten to import
  `eslint-config-next/core-web-vitals` directly — v16 ships native ESLint
  flat config and the old FlatCompat bridge crashed.
- 2026-09-30 (cart): two one-line
  `eslint-disable react-hooks/set-state-in-effect` comments (each
  documented inline): loading localStorage after mount, and the one-time
  product fetch on mount — standard React patterns that the strict new
  rule cannot see through; both run exactly once.
- 2026-10-01 (auth): `@supabase/ssr` was added (the owner approved the
  install first) because `@supabase/supabase-js` on its own cannot keep
  a **cookie** session that the Next.js server can read. Sign-in would
  have looked successful while the server still saw a guest.
- 2026-10-01 (auth): the server now has **two** Supabase clients, on
  purpose — `lib/supabaseServerAuth.js` (anon key, answers "who is
  signed in?") and `lib/supabaseServer.js` (service-role key, saves
  orders). Keeping the powerful key inside one small file limits the
  damage if a mistake is ever made.
- 2026-10-01 (auth): `orders.user_id` is only ever written from the
  server-read session cookie (`getCurrentUser()`), never from a value in
  the request body — a browser cannot claim to be another customer.
- 2026-10-01 (auth): signing in and signing out both trigger a **full
  page load** (`window.location.href`) rather than a soft Next.js
  navigation, because the new cookie session and every server component
  must be re-read and the banner has to remount. Two documented
  `eslint-disable @next/next/no-location-assign-relative-destination`
  comments mark those two intentional cases.
- 2026-10-01 (auth): Google avatars use a plain `<img>` with
  `referrerPolicy="no-referrer"` — same reasoning as product images (the
  photo host is not known in advance, so `next/image` would need an
  allow-list). The header shows photo + name + "Sign out" (name falls
  back to the part of the email before "@").
- 2026-10-01 (auth): checkout stays open to guests — no sign-in wall.
  Signing in only pre-fills name + email, and the form always wins over
  the pre-fill so typing is never overwritten.
- 2026-10-01 (auth): `AuthMessage` is rendered once in `app/layout.js`
  rather than only on the home page, so the friendly cancel/error banner
  appears whichever page Google returns the shopper to.
- 2026-10-01 (auth): no new environment variables were introduced; the
  existing 4 in `.env.local` cover sign-in as well.

## Next Steps (in order)
1. **Owner, do this first:** Supabase dashboard → Authentication → URL
   Configuration → Redirect URLs → add
   `http://localhost:3000/auth/callback`. Without it Supabase may
   ignore the return trip and sign-in will not complete. (Later, add
   the deployed URL too, e.g. `https://<site>/auth/callback`.)
2. Owner: run the cart, checkout **and sign-in** browser test lists in
   the Session Log below. Then `git init` and make the first commit —
   `.gitignore` already excludes all env files, so keys cannot be
   committed (`.env.example` already exists with placeholder names
   only).
3. Send Mailgun confirmation emails after an order is placed.
4. Deploy (e.g. Vercel), set the env vars there, add the production
   redirect URL in Supabase, test the live site.
5. Later polish: real product photos (currently placehold.co
   placeholders); optionally list the signed-in user's past orders.

## Session Log

### 2026-10-01 — fourth session: Google sign-in via Supabase Auth

- **What was built / changed:** new files — `lib/supabaseBrowser.js`
  (browser client built with `createBrowserClient` from `@supabase/ssr`;
  used by the header), `lib/supabaseServerAuth.js` (server client built
  on `cookies()` from `next/headers`, **anon key only**; exports
  `getCurrentUser()`), `app/auth/callback/route.js` (GET route handler:
  `exchangeCodeForSession`, then redirect home; no code → 307 to
  `/?auth=cancelled`; failure → `/?auth=error`), `components/AuthMessage.js`
  (client component: reads the `?auth=` value on mount, shows an amber
  banner, then tidies the query string out of the address bar). Edited —
  `components/Header.js` (rewritten: reads the session on mount,
  subscribes with `onAuthStateChange`, shows "Sign in" or Google photo +
  name + "Sign out"; the cart icon and badge are unchanged),
  `app/layout.js` (renders `<AuthMessage />` once for the whole app),
  `app/checkout/page.js` (an effect pre-fills name + email from the
  session using `setForm({ ...current, fullName: current.fullName || name })`
  so anything already typed is kept), `app/api/orders/route.js` (calls
  `getCurrentUser()` and inserts `user_id` from the **server** session),
  `package.json` + `package-lock.json` (`@supabase/ssr` installed after
  the owner approved it). No new environment variables were needed.
- **Decisions made and why:** see the 2026-10-01 (auth) entries in the
  Decisions section above.
- **Problems hit and how they were solved:**
  1. `@supabase/supabase-js` alone cannot give the Next.js server the
     signed-in user (no shared cookie session), so sign-in would have
     looked fine while the server still saw a guest. Fixed by adding
     `@supabase/ssr` — the official Supabase package for App Router
     cookie sessions. The owner was asked before installing, as agreed.
  2. The first lint run reported three warnings in the new header: one
     unused `eslint-disable react-hooks/set-state-in-effect` comment and
     two `@next/next/no-location-assign-relative-destination` warnings.
     The unused suppression was deleted (the async `getSession()`
     callback is not flagged). The two navigations are deliberate — a
     full page load is what makes the new cookie session and all server
     components re-read and the banner remount — so each kept a
     one-line documented `eslint-disable`. `npm run lint` then printed
     **0 problems**.
  3. The owner reported a "popping error" while viewing the app. Every
     route answered 200 at that moment, so it was the editor's
     terminal-integration hiccup rather than a fault in the site.
     Nothing was changed for it and the owner chose to keep building —
     but re-check it if the pop-up returns.
  4. This README had accumulated two duplicate `## Session Log`
     headings and a duplicated "Not done yet" block during earlier
     sessions. Those were tidied this session (headings renamed /
     merged) so the file reads cleanly. No information was deleted.
- **What is working / what is not:** see Current Status above. Build ✅
  (7 routes; `/auth/callback` appears as dynamic ƒ), lint ✅ 0 problems,
  `/`, `/cart`, `/checkout` → 200, `/auth/callback` without a code →
  307 to `/?auth=cancelled`, and a `grep` of the `.next` output shows
  the service-role key **name and value nowhere**. Not verified from the
  command line (needs a real browser + Google account): the live Google
  round-trip, and a signed-in order's `user_id` in Supabase. Both are in
  the test list below.
- **Exact next steps:** see Next Steps (in order) above.
- **Sign-in test list for the owner** (dev server running,
  http://localhost:3000):
  1. Supabase → Authentication → URL Configuration → Redirect URLs: add
     `http://localhost:3000/auth/callback` (do this one first).
  2. Click **Sign in** → pick a Google account → you come back to the
     home page with avatar + name + **Sign out** in the header.
  3. Refresh the page → you are still signed in.
  4. Add a product → `/checkout` → name + email already filled in (both
     still editable); phone/address/city/state blank.
  5. Place the order → Supabase → the new `orders` row has `user_id`
     filled in (guests get NULL).
  6. Click **Sign out** → the header shows "Sign in" again.
  7. Click Sign in, then Cancel on Google's screen → home page with the
     amber "cancelled" banner.
  8. Signed out: add to cart → checkout → blank form → order saves with
     `user_id` NULL (the guest path still works).
- **Environment note:** dev server was restarted this session and left
  running on port 3000 (`npm run dev`).

### 2026-10-01 — third session: checkout flow + Nigerian phone validation

- **What was built / changed:** new files — `lib/supabaseServer.js`
  (lazy server-only client: no `NEXT_PUBLIC_` prefix + browser guard;
  only the API route and confirmation page import it),
  `lib/validatePhone.js` (one shared Nigerian-phone rule used by both
  form and API), `app/api/orders/route.js` (POST: server validation, real
  DB prices, server total, `orders` insert + `order_items` insert with
  compensating delete, returns order id), `app/checkout/page.js`
  (rewritten from placeholder: 6-field form + inline errors, summary
  beside it, empty-cart redirect, disabled submit + error box, clears
  cart on success), `app/order-confirmation/[id]/page.js`
  (server-rendered thank-you + summary, 404 on bad id),
  `context/CartContext.js` (`clearCart()` + `hydrated`), `.env.example`
  (4 names, values blank). Rewrote phone validation this session: only
  `0` + 10 digits or `+234` + 10 digits (spaces/dashes ignored), same
  clear message on form and API.
- **Decisions made and why:**
  - Stock is NOT reduced on order (spec said nothing about it; the old
    README note saying "reduce stock" is superseded). Say the word and
    it gets added.
  - `user_id` saved as NULL until Google sign-in exists (column is
    nullable — verified, so inserts succeed).
  - One shared validator file so the browser and server can never
    disagree about what a valid phone number is.
  - Proof order ("Test Buyer", ₦105,000, `pending`) kept in the database
    at the owner's request; the two phone-validation test orders were
    deleted.
- **Problems hit and how they were solved:**
  1. `SUPABASE_SERVICE_ROLE_KEY` was missing from `.env.local`, so the
     API route and confirmation page could not run — code was written
     key-tolerant (lazy client) and verified later.
  2. First key value rejected (401 "Invalid API key"): it did not start
     with `sb_` — wrong field copied. Second attempt had the word
     "here" glued onto the front (`heresb_sec…`, found via prefix
     check). Third value accepted (200 on all tables).
  3. `orders` and `order_items` were empty, so column names were probed
     one-by-one via the REST API — all 11 `orders` columns (incl. the 3
     new ones) and 5 `order_items` columns confirmed; `order_items` has
     no `created_at`.
  4. Dev server was down (earlier reboot killed it; `localhost:3000`
     returned 000) — restarted before the live order test.
- **What is working / what is not:** see Current Status above. Lint ✅
  build ✅ (both exit 0). Live `POST /api/orders` → 201, order + items
  verified in Supabase, confirmation page 200 with name and ₦105,000.
  Phone tests: 13 unit cases PASS, 5 live API cases (2 accepted, 3
  rejected with the clear message). Client bundles grepped — no
  `SERVICE_ROLE` leak. Owner browser tests (cart + checkout) still
  unreported.
- **Exact next steps:** see Next Steps (in order) above.
- **Checkout test list for the owner** (dev server running,
  http://localhost:3000):
  1. Add 1–2 products → `/checkout` shows the form + ₦ summary.
  2. Submit empty → inline error under every field.
  3. Phone: try `12345` → clear Nigerian-number error; try
     `08012345678` and `+2348012345678` → accepted.
  4. Fill all 6 fields → Place order → confirmation page with
     thank-you + totals; cart badge resets to 0.
  5. Empty cart + visit `/checkout` → redirected to `/cart`.
  6. Supabase dashboard → new `pending` row in `orders`, matching rows
     in `order_items` with correct `unit_price`.

## Session Log (continued)

### 2026-09-30 (evening) — second session: shopping cart

- **What was built / changed:** new files — `lib/format.js` (shared ₦
  formatter, moved out of the home page), `context/CartContext.js`
  (cart state, actions, localStorage save/load), `components/Header.js`
  (brand + cart icon with count badge), `app/cart/page.js` (item list,
  quantity controls, subtotal, checkout button), `app/checkout/page.js`
  (placeholder). Edited — `app/layout.js` (wraps the app in
  `CartProvider` and renders `Header`), `app/page.js` (Add-to-cart
  button with "Added ✓" flash; retry moved into `handleRetry`),
  `eslint.config.mjs` (rewritten for flat config).
- **Decisions made and why:** see the 2026-09-30 (cart) entries in the
  Decisions section above.
- **Problems hit and how they were solved:**
  1. `npm run lint` crashed with "Converting circular structure to
     JSON": the first session's FlatCompat bridge is incompatible with
     eslint-config-next v16, which ships native flat config. Fixed by
     importing `eslint-config-next/core-web-vitals` directly (6 lines).
  2. The new `react-hooks/set-state-in-effect` rule reported 2 errors.
     Home page: loading/error state moved out of `loadProducts` into
     the button's event handler (proper fix). Cart load + mount fetch:
     one-line documented suppressions — both patterns are standard,
     run once, and the comments explain why they are safe.
  3. The machine rebooted on 2026-10-01 (~06:18), killing the dev
     server and wiping `/tmp` logs. Project files (on /home) were
     untouched; the server was restarted and every route re-verified
     the same morning.
- **What is working / what is not:** see Current Status above. Build
  and lint both exit 0; `/`, `/cart`, `/checkout` all 200 after the
  reboot. Cart browser test by the owner not yet reported.
- **Exact next steps:** see Next Steps (in order) above.
- **Cart test list for the owner:**
  1. Home → click "Add to cart" twice on one product → header badge
     shows 2 (quantity, not duplicates).
  2. Refresh the page → badge still shows 2 (localStorage works).
  3. Cart icon → `/cart` → use +/−/Remove → subtotal in ₦ updates.
  4. "Proceed to checkout" → placeholder page → "Back to cart" →
     items still there.
  5. Narrow window or phone → header, cards and cart rows stay usable.
  6. Optional: DevTools → Application → Local Storage →
     `simi-stitches-cart` shows the saved items.

### 2026-09-30 — first coding session: home page + Supabase

- **What was built / changed:** all app files listed under Current Status
  were created (`package.json`, `package-lock.json`, `next.config.mjs`,
  `postcss.config.mjs`, `jsconfig.json`, `eslint.config.mjs`,
  `app/layout.js`, `app/globals.css`, `app/page.js`,
  `lib/supabaseClient.js`); the empty `.gitignore` was filled in;
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` was added to `.env.local` (value
  copied inside that file only — keys were never printed anywhere);
  dependencies installed (next 16.3.8, react 19,
  @supabase/supabase-js 2.117.2, tailwindcss 4, eslint 9);
  `products` columns confirmed with a read-only Supabase API call and
  written into the Database Schema section.
- **Problems hit and how they were solved:**
  1. The phone hotspot lost HTTPS (plain HTTP was redirected to
     Airtel's "ZeroD" portal; every https:// request timed out), so npm
     downloads failed. A background loop retried every minute until the
     owner restored the connection.
  2. Because of that outage `create-next-app` never downloaded — the
     starter files were hand-written instead (same structure).
  3. The first `npm install` was interrupted and left a half-written
     native file: `next-swc.linux-x64-gnu.node` was 43.7MB instead of
     96.7MB. Every `next build` / `next dev` crashed with
     `Bus error (core dumped)` (exit 135), on both Turbopack and
     webpack. Diagnosed with `readelf -S` ("extends past end of file").
     Fixed by deleting `node_modules` and doing a fresh `npm install`,
     then verifying every `*.node` file is complete and loadable. The
     build passed immediately afterwards.
  4. `npm ci` refused to run (lockfile missing other-platform `sharp`
     optional dependencies) — used `npm install` instead.
- **What is working / what is not:** see Current Status above.
- **Exact next steps:** see Next Steps (in order) above.

