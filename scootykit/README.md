# ScootyKit — E-commerce Store

**Everything Your Scooty Needs.** A production-oriented Pakistani e-commerce store for electric scooty, scooter and motorcycle accessories.

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Lucide icons
- **Backend:** Next.js Server Actions + Route Handlers · Supabase PostgreSQL · Supabase Auth · Supabase Storage
- **Forms:** React Hook Form + Zod (client) and Zod again on the server
- **Deploy:** Vercel

---

## 1. What's included

| Area | Features |
| --- | --- |
| Storefront | Premium homepage (hero, featured categories, all 27 categories, featured / best sellers / new arrivals / popular accessories, why-us, verified reviews, newsletter), `/shop` with search, category/price/availability filters, 4 sorts, pagination, all 27 `/category/[slug]` routes (empty ones included), `/categories` |
| Product | Gallery (multi-image, keyboard, fallback), sale price only when configured, live stock, quantity limits, Add to Cart, Buy Now, wishlist, delivery info, specs, features, related products, verified-buyer reviews, JSON-LD |
| Cart | Guest cart in localStorage (cross-tab), synced to the DB for signed-in users, live price/stock refresh, coupon preview, delivery estimate |
| Checkout | Pakistani phone validation (03XXXXXXXXX / +923XXXXXXXXX), province + city, server-side quote, COD + Bank Transfer, idempotent atomic order creation, friendly stock/coupon errors |
| Orders | Private confirmation page (secret token / owner / admin), `/track-order` (order number **+** phone, rate-limited, no address shown), timeline |
| Accounts | Register, login, forgot/reset password, dashboard, profile, order history, saved addresses (up to 10), wishlist |
| Admin `/admin` | Real-data dashboard + 30-day chart, products CRUD + image upload/reorder/alt, archive/delete, categories CRUD + images, orders (search/filter, status & payment updates, history, internal notes, cancel → stock restored), customers, inventory quick-edit, coupons, delivery zones, store settings (announcement, contact, bank details, free-delivery threshold, hero image, socials), newsletter + CSV export, review moderation, contact messages, **CSV/Excel import → drafts** |
| SEO | Per-page metadata, product/category metadata, canonical URLs, sitemap, robots, Open Graph image, JSON-LD (store, product, breadcrumb, FAQ), semantic HTML |
| Content | About, Contact (form → admin inbox), FAQ, Shipping, Returns, Privacy, Terms (policy pages are clearly marked **drafts** with `[placeholders]`) |

**No fake data anywhere:** no products are seeded, best sellers come from real units sold, ratings only from approved verified-buyer reviews, dashboard numbers come from the database, and sale prices / free delivery only appear when an admin configures them.

---

## 2. Project structure

```text
app/
  (store)/            storefront routes (home, shop, category/[slug], product/[slug], cart, checkout,
                      order-confirmation/[orderNumber], track-order, wishlist, account/*, auth pages, content pages)
  admin/              admin dashboard (server-side guarded)
  auth/confirm/       Supabase email link handler (signup + password recovery)
  sitemap.ts robots.ts opengraph-image.tsx not-found.tsx global-error.tsx icon.svg
components/
  layout/ home/ products/ cart/ checkout/ account/ auth/ admin/ content/ ui/
lib/
  supabase/           server (cookie), public (anon, cacheable), admin (service role), browser, proxy
  auth/               getUser / requireUser / requireAdmin, safe redirects
  data/               read queries (catalog, settings, account, admin)
  actions/            server actions (checkout, cart, wishlist, auth, account, reviews, engagement, admin/*)
  commerce/           pricing, phone, slug, import parser, statuses, error mapping
  validation/         Zod schemas
  client/             browser stores (cart, wishlist, coupon, session, toasts)
supabase/
  migrations/         schema, RLS/storage, business functions
  seed.sql            27 categories, store settings, placeholder delivery zone
tests/
  unit/               Vitest (34 tests)
  db/                 SQL tests against a real PostgreSQL
  e2e/                browser smoke test (puppeteer-core)
proxy.ts              session refresh + optimistic protection of /account and /admin
```

---

## 3. Supabase setup (once)

1. Create a project at [supabase.com](https://supabase.com) (region close to Pakistan, e.g. Mumbai/Singapore).
2. **Run the migrations in order** — either with the CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   or paste these files into **SQL Editor** one by one:
   `supabase/migrations/20261119000001_schema.sql` → `…02_security.sql` → `…03_functions.sql`
3. **Run the seed:** paste `supabase/seed.sql` into the SQL Editor (safe to re-run). This creates the 27 categories, the settings row and a **placeholder** Rs. 250 nationwide delivery zone.
4. **Auth → URL Configuration**
   - Site URL: `https://your-domain.pk`
   - Redirect URLs: `https://your-domain.pk/auth/confirm`, `http://localhost:3000/auth/confirm`
5. **Auth → Providers → Email:** keep "Confirm email" on (recommended). The app handles both PKCE `?code=` links (default templates) and `token_hash` links.
   For best results with SSR, optionally change the templates:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
6. **Auth → SMTP:** configure a real SMTP sender before launch (Supabase's built-in sender is rate-limited).
7. **Create your admin user:** register on the website, then in SQL Editor:
   ```sql
   insert into public.admin_users (user_id, role)
   select id, 'owner' from auth.users where email = 'you@example.com';
   ```
   Admin roles can only be granted from SQL — never from the app. There are no hard-coded passwords.

The `product-images` storage bucket (public read, admin-only write, 5 MB, JPG/PNG/WebP/AVIF) is created by the migration.

---

## 4. Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | e.g. `https://scootykit.com` — used for SEO, sitemap, email links |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | anon / publishable key (safe in the browser — RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | service role / secret key. Never prefix with `NEXT_PUBLIC_`, never commit |

The service-role key is only imported from `lib/supabase/admin.ts` (marked `server-only`) and used for: order creation, order tracking, rate limiting, newsletter and contact-form inserts.

---

## 5. Local development

```bash
npm install
cp .env.example .env.local     # fill in your Supabase values
npm run dev                    # http://localhost:3000
```

Useful scripts:

```bash
npm run typecheck   # next typegen + tsc
npm run lint        # eslint
npm test            # vitest unit tests
npm run test:db     # SQL tests (needs a local PostgreSQL, see below)
npm run build       # production build
npm run check       # all of the above except test:db
```

**DB tests** run the real migrations + seed against a throwaway local PostgreSQL 15/16 with a small Supabase stub (`tests/db/supabase_stub.sql`):

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres npm run test:db
```

---

## 6. Deploying to Vercel

1. Push the project to GitHub and **Import** it in Vercel (framework: Next.js, defaults are fine).
2. Add the 4 environment variables (Production + Preview). Set `NEXT_PUBLIC_SITE_URL` to your real domain.
3. Deploy. Add your domain in Vercel → Domains, then update Supabase **Site URL / Redirect URLs** to match.
4. Sign in, open `/admin`, and complete the **Launch checklist** shown on the dashboard.

Pages are statically generated/ISR where possible (homepage 2 min, product pages 60 s on demand). Admin changes and new orders revalidate the storefront automatically.

---

## 7. Admin workflow

1. **Settings** → contact details, payment methods (COD on by default; bank transfer needs account number/IBAN), delivery time text, optional free-delivery threshold, announcement bar.
2. **Delivery charges** → replace the placeholder Rs. 250 nationwide rate with your courier's real rate; add province- or city-specific zones if needed (city → province → nationwide).
3. **Products → Add product** (or **Import**) → saves as **Draft** → upload images → set a verified price and stock → set status **Active**. The server refuses to publish without a price, category and at least one image.
4. **Orders** → confirm, process, ship (add the courier/tracking number as a history note), deliver. Mark **Paid** only after verifying a bank transfer or receiving COD remittance. Cancelling returns stock and coupon usage.
5. **Reviews** → approve verified-buyer reviews before they appear.

### Importing researched products (Alibaba / Daraz)

`/admin/products/import` accepts **CSV or .xlsx** (template downloadable on the page). Columns: `name, category, sku, supplier_url, images, description, specifications, cost_price, selling_price, stock` (common header names like "Product Name", "Price", "Qty" are recognised).

- Preview shows errors (missing name, invalid numbers, duplicate SKUs in the file or already in the store) and warnings before anything is written.
- Every row is created as a **Draft**. Cost price, supplier URL and supplier image links are stored in the private `product_sourcing` table — **supplier images are never copied or shown** on the store. Upload images you own or have permission to use.

---

## 8. Security model

- **Row Level Security on every table.** Anonymous users only read visible categories and *active* products. Customers read only their own orders, addresses, cart and wishlist. `product_sourcing`, coupons, customers and messages are admin-only.
- **Admin** = row in `admin_users`, checked by `public.is_admin()` in every policy, in every admin page (`requireAdmin`) and in every admin server action (`assertAdmin`). Hiding links is not relied on.
- **Orders** are created only by `public.create_order()` (executable by the service role only): it locks product rows, re-reads prices from the DB, checks stock, resolves delivery, validates coupons (with row locks), decrements stock and writes the order + item price snapshots + history **in one transaction**. Frontend totals are ignored. An idempotency key makes double-submits return the same order.
- **Order privacy:** confirmation links carry a random secret token; tracking requires order number **and** checkout phone, returns no address and gives the same error for "not found" and "wrong phone".
- **Rate limiting** (Postgres-backed, works on serverless): checkout, tracking, coupon checks, login, register, password reset, newsletter, contact.
- **Uploads:** admin-only, MIME + size + magic-byte validation in code, plus bucket-level size/type limits.
- Payment status is never set to *paid* automatically.
- Security headers, open-redirect protection on auth redirects, CSV-injection-safe exports, no secrets in client code.

---

## 9. Future online payments

The checkout is ready for a provider (e.g. JazzCash, Easypaisa, Safepay, PayFast) but **none is connected**, and the UI says so. To add one:

1. Add the method to the `payment_method` check constraint and `create_order()` (initial status `unpaid`).
2. Redirect to the provider after order creation.
3. Add a webhook Route Handler that **verifies the provider signature** server-side, then sets `payment_status = 'paid'` (service role) and writes an `order_status_history` row.

---

## 10. Testing report

What was actually executed during development (Nov 2026):

| Check | Result |
| --- | --- |
| `tsc --noEmit` (strict) | ✅ no errors |
| `eslint .` (next core-web-vitals + TS + React Compiler rules) | ✅ no errors/warnings |
| `next build` (Next 16.4.6, Turbopack) | ✅ all 50+ routes built |
| Vitest unit tests | ✅ 34/34 — phone normalisation, pricing, PKR format, import parsing & duplicate SKUs, Zod schemas (checkout, register, tracking, admin product), open-redirect guard, error mapping, slugify, delivery-zone resolution |
| SQL tests on real PostgreSQL 16 (`tests/db`) | ✅ migrations + seed apply cleanly; order creation with DB prices, sale price, merged duplicate lines, 10% coupon, delivery zone; stock decrement; **idempotent duplicate submission**; per-customer coupon limit; **out-of-stock** rollback; draft product rejected; invalid phone; disabled bank transfer; city > province > default zones; free-delivery threshold; tracking requires matching phone & hides address; rate limiter; **RLS** (anon can't see drafts/orders/coupons/sourcing, can't call `create_order`, can't change prices; customers see only own orders, can't edit orders or grant admin); admin stats; status updates; cancellation restores stock exactly once; cancelled orders can't reopen; reviews require delivered purchase and stay hidden until approved |
| HTTP smoke test (production server, no Supabase) | ✅ all public routes 200, unknown product/route 404, `/admin` & `/account` → login redirect |
| Browser test (`tests/e2e/ui-flow.mjs`, Chrome) | ✅ 14/14 — persisted cart badge, mega menu open/Escape, cart drops products the server doesn't confirm, checkout validation, landline rejected, order submit fails safely with no fake success, tracking validation, private confirmation, register validation, mobile menu, admin redirect, **no horizontal overflow on 6 pages at 375/768/1440**, no browser errors |

**Not executed here** (needs your live Supabase project — please run through once after setup):
sign-up/confirmation emails, login & password reset, admin CRUD and image upload against Supabase Storage, a full storefront → checkout → confirmation → tracking run with real products, and the signed-in cart/wishlist sync. The SQL those flows depend on is covered by the DB tests above.

Suggested launch QA: create admin → add 2 products with images → place a COD order as guest → place a bank-transfer order signed in → track both → mark one delivered and review it → cancel the other and confirm stock returns.

---

## 11. Before launch — external configuration checklist

- [ ] Supabase project, migrations, seed, Auth URLs, SMTP
- [ ] Admin user inserted into `admin_users`
- [ ] Vercel env vars + domain; `NEXT_PUBLIC_SITE_URL` set
- [ ] **Real delivery rate(s)** (seeded Rs. 250 is a placeholder)
- [ ] Contact phone/email/WhatsApp/address in Settings
- [ ] Bank details (only if offering bank transfer)
- [ ] Replace `[placeholders]` in Shipping, Returns, Privacy, Terms pages and have them reviewed
- [ ] Real products with prices, stock and images you have rights to use
- [ ] Optional: hero photo URL, category images, social links, Google Search Console + sitemap submission

---

Fonts: Inter and Plus Jakarta Sans (SIL Open Font License), self-hosted in `app/fonts`.
Brand assets: `public/brand/` (`scootykit-logo.svg`, `scootykit-logo-dark.svg`, `scootykit-icon.svg`).
