# 3DVerse — Enterprise Product Requirements Document (Master)

**Product:** 3DVerse — WhatsApp-order e-commerce store for 3D printed products
**Owner:** Maksudur Rahman Rahat · Sylhet, Bangladesh
**Stack:** Next.js (App Router) · Supabase (Postgres + Storage + Auth) · Tailwind CSS · shadcn/ui · Framer Motion
**Constraints:** Vercel Free + Supabase Free tiers only. No payment gateway.
**Document status:** Living document — update alongside implementation.
**Last updated:** 2026-07-12

This master PRD consolidates the ten planning parts into one reference:

1. Project Foundation & PRD
2. UI/UX Design System
3. Sitemap, User Flow, Wireframes
4. Supabase Database Architecture
5. Admin Panel / CMS
6. Frontend Pages & Components
7. Product Catalog, Search & WhatsApp
8. SEO, Performance & Security
9. Testing, Deployment & CI/CD
10. Claude Workflow & Documentation

---

## Part 1 — Project Foundation & PRD

### 1.1 Vision
3DVerse is an online storefront that looks and behaves like a modern e-commerce site but replaces
online checkout with a **WhatsApp order flow**. Customers browse a catalog, open a product, and tap
"Buy Now on WhatsApp," which launches a chat with a pre-filled Bangla order message. The owner
confirms and fulfils the order manually. This keeps operating cost at zero (no payment gateway, no
paid backend) while giving customers a professional buying experience.

### 1.2 Business goals
- Present 3DVerse's products (anatomical/bone models, custom keyrings, home decor, gifts, misc.)
  in a clean, credible storefront.
- Convert browsing into WhatsApp conversations with minimal friction.
- Let the owner manage the catalog without touching code (admin CMS).
- Run entirely on free infrastructure and remain easy to hand over.

### 1.3 Success metrics
- **Primary:** number of WhatsApp order chats initiated per week (Buy Now clicks).
- Product detail views; search usage; category page views.
- Catalog size maintained by the owner via the admin panel (self-service > developer tickets).
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on mobile.

### 1.4 Personas
- **Student / clinic buyer (Nabila):** wants accurate anatomical models, compares price and detail,
  orders on mobile over WhatsApp.
- **Gift buyer (Tanvir):** browses keyrings/gifts, wants a quick personalised order.
- **Business buyer (Rima):** wants bulk logo keyrings, needs a quote — WhatsApp is ideal.
- **Owner/admin (Rahat):** adds and edits products, uploads photos, toggles stock, all from a phone
  or laptop, no database knowledge required.

### 1.5 Scope
**In scope (v1):** catalog, search, filters, sort, product detail with gallery, categories, About,
Contact, WhatsApp order flow, admin CMS (auth + product CRUD + image upload), SEO, responsive
design, deployment.
**Out of scope (v1):** online payments, shopping cart/checkout, user accounts for customers,
shipping/logistics integration, multi-language toggle beyond bilingual copy, reviews/ratings.
**Later (v2 candidates):** customer wishlists, order/inquiry logging table, analytics dashboard,
discount codes, multi-admin roles, Bangla/English UI switch.

### 1.6 Assumptions & constraints
- Single admin user (owner) initially.
- Product data currently seeded from placeholders; real data to be imported from the owner's Google
  Sheets once shared with view access (the two links provided were identical — the "Bones" tab must
  be confirmed before import).
- Prices in BDT (৳). Customer-facing order text in Bangla; general UI bilingual/English.
- All services must stay within free-tier limits.

### 1.7 Milestones
1. PRD + design system approved. ✅
2. Next.js scaffold + design system components.
3. Public pages (Home, Shop, Product, Category, About, Contact) on mock data.
4. WhatsApp order flow.
5. Supabase schema + data layer + real data switch.
6. Admin CMS (auth + CRUD + images).
7. SEO, performance, security, testing.
8. Deploy to Vercel + connect Supabase (live, via guided Chrome session).
9. Handover docs.

### 1.8 Risks & mitigations
- **Free-tier limits exceeded** → compress images, lazy-load, cache; monitor Supabase usage.
- **WhatsApp deep link differences (mobile vs desktop)** → use `wa.me` which routes per platform;
  test both.
- **Admin key leakage** → only the public anon key ships to the browser; admin writes are gated by
  Supabase Auth + RLS; service_role key never leaves server/dashboard.
- **Data import ambiguity** → confirm sheet/tab mapping with owner before bulk insert.

---

## Part 2 — UI/UX Design System ("Studio Minimal")

### 2.1 Design principles
Clean, modern, minimalist; generous whitespace; let colourful prints be the visual interest; fast
and accessible; subtle motion, never decorative noise.

### 2.2 Color tokens
| Token | Hex | Use |
|---|---|---|
| `cream` | `#F4F1EA` | Page background |
| `paper` | `#FBFAF7` | Cards, raised surfaces |
| `ink` | `#2C2A26` | Primary text, dark surfaces |
| `clay` | `#C0603A` | Accent — buttons, links, highlights |
| `clay-dark` | `#A44E2D` | Accent hover |
| `stone` | `#8A8577` | Muted text |
| `line` | `#E7E2D6` | Borders, dividers |

Contrast: ink on cream ≈ 11:1; clay on paper ≈ 4.7:1 (AA for large/UI); paper on clay ≈ 4.6:1.

### 2.3 Typography
- **Display / headings:** Playfair Display (600) — editorial, distinctive.
- **Body / UI:** Inter (400/500/600).
- **Bangla:** Hind Siliguri.
- Scale: H1 40–48px, H2 24–30px, H3 18–20px, body 14–16px, caption 12px. Line-height 1.6–1.7 body.

### 2.4 Spacing & radius
- Spacing rhythm: 4/8/12/16/24/32/48/64 px.
- Radius: controls 8px, cards 16–24px (rounded-2xl/3xl), pills full.
- Borders: 1px `line`; hover shifts to `clay/40`.

### 2.5 Components (shadcn/ui + custom)
Button (primary clay / ghost outline), Card, Input, Select, Badge, Sheet (mobile nav), Dialog,
DropdownMenu, Skeleton, Toast (sonner), Table (admin). Custom: ProductCard, ProductGallery,
BuyButton, SocialLinks, CategoryCard, SearchBar.

### 2.6 Motion (Framer Motion)
- Page/section entrance: fade + 12px rise, 0.4–0.5s ease-out, stagger children 0.05s.
- Card hover: translateY(-2px) + border color, 0.2s.
- Respect `prefers-reduced-motion` — disable non-essential motion.

### 2.7 Accessibility
WCAG 2.1 AA target: semantic landmarks, alt text on all images, keyboard focus rings, labelled
inputs, `aria-label` on icon buttons, color never the sole signal, reduced-motion support.

---

## Part 3 — Sitemap, User Flow, Wireframes

### 3.1 Sitemap
```
/                     Home
/shop                 All products (search + filter + sort)
/product/[slug]       Product detail
/category/[slug]      Category listing
/about                About
/contact              Contact (+ map)
/admin                Admin login
/admin/dashboard      Admin overview
/admin/products       Product list (CRUD)
/admin/products/new   Create product
/admin/products/[id]  Edit product
sitemap.xml, robots.txt, 404
```

### 3.2 Core user flow — browse to order
1. Land on Home → click category or search.
2. Shop grid → filter/sort → open a product.
3. Product detail → review images, price, description → **Buy Now on WhatsApp**.
4. WhatsApp opens with pre-filled Bangla message (name, price, link).
5. Owner confirms order in chat.

### 3.3 Admin flow
Login (`/admin`) → dashboard → Products → add/edit/delete, upload images, toggle stock → changes
appear live on the storefront.

### 3.4 Wireframes (text)
- **Home:** sticky nav → hero (headline, subcopy, CTAs, social) → category grid → featured products
  → "how ordering works" → brand intro → footer.
- **Shop:** page title + count → search bar + category + sort → responsive product grid (2/3/4 cols).
- **Product:** breadcrumb → gallery (main + thumbnails) | info (category, title, price, stock,
  description, tags, Buy Now) → related products.
- **Category:** breadcrumb → title + blurb + sort → grid.
- **About:** headline → story → stat cards → CTAs → socials.
- **Contact:** contact cards (WhatsApp/email/location) → WhatsApp CTA panel → map embed.
- **Admin:** sidebar/topbar → data table (image, name, category, price, stock, actions) → product
  form (fields + image dropzone).

---

## Part 4 — Supabase Database Architecture

### 4.1 Tables
**`products`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| name | text | required |
| slug | text unique | clean URLs |
| price | numeric | BDT |
| description | text | |
| category | text | category slug |
| tags | text[] | keyword search |
| image_url | text[] | Storage public URLs |
| in_stock | boolean | default true |
| created_at | timestamptz | default now() |

Indexes: `category`, `created_at desc`, GIN on `tags`.

**`categories`** (optional, for admin-managed categories)
| id uuid PK · slug text unique · name text · blurb text · sort_order int |

### 4.2 Storage
Public bucket `product-images`. Public read policy; writes restricted to authenticated admin.

### 4.3 Row Level Security
- `products`: public `SELECT` (using true). `INSERT/UPDATE/DELETE` only for `authenticated` role.
- `storage.objects` in `product-images`: public `SELECT`; `INSERT/UPDATE/DELETE` only for
  `authenticated`.
- Never expose the service_role key to the client. The browser uses only the anon key; RLS enforces
  who can write.

### 4.4 Auth
Supabase Auth email/password. Owner account created once in the dashboard. `/admin` routes are
protected client- and middleware-side by checking the session.

### 4.5 Environment
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. App auto-falls back to bundled mock
data when these are absent (demo mode), so the site is always runnable.

---

## Part 5 — Admin Panel / CMS

### 5.1 Goal
Let the owner manage the full catalog without SQL: create, edit, delete products, upload images,
toggle stock, set category and tags — from any device.

### 5.2 Features
- **Auth:** email/password login; protected `/admin/*`; sign out; session persistence.
- **Dashboard:** counts (total products, in stock, by category), quick links.
- **Product list:** searchable table with thumbnail, name, category, price, stock badge, edit/delete.
- **Create/Edit form:** name, auto-slug (editable), price, description, category select, tags
  (comma input → array), image upload (multiple, drag-drop to Storage), in-stock switch.
- **Delete:** confirm dialog; also removes associated Storage objects where feasible.
- **Feedback:** toasts for success/error; optimistic UI where safe.

### 5.3 Security
All mutations require an authenticated session; RLS is the server-side guarantee. The UI hides admin
nav from anonymous users, but security does not depend on UI hiding — RLS does. Rate limiting and
brute-force protection handled by Supabase Auth defaults.

### 5.4 Demo mode
Without Supabase configured, `/admin` shows a notice explaining it needs Supabase Auth + keys, and
links to the setup guide. No mock writes (keeps demo state predictable).

---

## Part 6 — Frontend Pages & Components

### 6.1 Rendering strategy (Next.js App Router)
- Public catalog pages: server components fetching from Supabase where configured; ISR/revalidation
  for freshness. Falls back to mock data module in demo mode.
- Interactive pieces (search box, filters, gallery, admin) are client components.
- Metadata via the App Router `metadata`/`generateMetadata` API.

### 6.2 Component inventory
Layout: `Navbar`, `Footer`, `Container`, `DemoBanner`.
Catalog: `ProductCard`, `ProductGrid`, `ProductGallery`, `CategoryCard`, `SearchBar`, `SortSelect`,
`CategoryFilter`, `BuyButton`, `SocialLinks`, `Breadcrumb`, `Skeleton`.
UI primitives (shadcn/ui): button, card, input, select, badge, dialog, sheet, dropdown-menu, switch,
table, sonner (toast), skeleton, label, textarea.
Admin: `AdminShell`, `ProductTable`, `ProductForm`, `ImageUploader`, `AuthGuard`.

### 6.3 States
Every list has loading (skeleton), empty ("no products found"), and error states. Images lazy-load
with fixed aspect ratio to avoid layout shift.

---

## Part 7 — Product Catalog, Search & WhatsApp

### 7.1 Catalog
Grid of product cards (image, category, name, price). Category filter, sort (newest, price asc/desc).
Category pages reuse the grid filtered by slug.

### 7.2 Search
Keyword search across name, description, category, and tags. Client-side filter over the fetched set
for instant response at current catalog size; can migrate to Postgres full-text/`ilike` + GIN when
the catalog grows. Search state reflected in the URL (`/shop?q=…&category=…`) so results are
shareable.

### 7.3 WhatsApp order flow
On Buy Now, open:
```
https://wa.me/8801357141040?text=<encoded message>
```
Message template (Bangla), URL-encoded with `encodeURIComponent`:
```
আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই:

প্রোডাক্ট: {name}
মূল্য: ৳{price}
লিংক: {product_url}

দয়া করে অর্ডার কনফার্ম করতে সাহায্য করুন।
```
`wa.me` routes to the app on mobile and WhatsApp Web on desktop. The product URL is absolute (uses
the deployed origin) so the owner can open the exact product.

---

## Part 8 — SEO, Performance & Security

### 8.1 SEO
- Per-page metadata (title, description) and `generateMetadata` for product/category pages.
- Open Graph + Twitter cards; product images as OG images.
- `sitemap.xml` (products + static pages) and `robots.txt` via App Router route handlers.
- Semantic HTML, descriptive alt text, canonical URLs, JSON-LD `Product` structured data on product
  pages.

### 8.2 Performance
- `next/image` for responsive, lazy, optimized images; explicit sizes to prevent CLS.
- Server components + streaming; minimal client JS; code-split admin from public bundle.
- Font `display: swap`; preconnect to fonts and Supabase.
- Target Lighthouse mobile: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

### 8.3 Security
- Only anon key in client; RLS enforces write protection; service_role stays server-side/dashboard.
- Security headers (CSP-friendly defaults, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`) via `next.config` headers / middleware.
- Input validation on admin forms; sanitised rendering (React escapes by default).
- No secrets committed; `.env` gitignored; env set in Vercel dashboard.

---

## Part 9 — Testing, Deployment & CI/CD

### 9.1 Testing
- **Unit:** Vitest for pure logic (WhatsApp URL builder, price/format helpers, search/sort).
- **Component:** React Testing Library for key components (ProductCard, BuyButton).
- **E2E (optional):** Playwright smoke test — home loads, search filters, product page renders,
  Buy Now href is correct.
- Lint/format: ESLint + Prettier.

### 9.2 CI/CD (GitHub Actions)
Workflow on push/PR: install → lint → typecheck → unit tests → build. Vercel auto-deploys from the
connected GitHub repo (Preview on PRs, Production on main). `vercel.json` handles config.

### 9.3 Deployment (Vercel Free)
1. Push repo to GitHub.
2. Import to Vercel (framework preset: Next.js).
3. Set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy; verify live storefront, WhatsApp flow, and admin login.

> The live GitHub + Vercel + Supabase connection will be done together in a guided browser session
> (Claude in Chrome) when the owner is ready and logged in.

### 9.4 Environments
Local (`.env.local`, mock or dev Supabase) → Preview (per-PR) → Production (main). Same schema
across environments.

---

## Part 10 — Claude Workflow & Documentation

### 10.1 Working method
- Plan each phase, implement, verify (build/tests), then update docs — iteratively.
- Keep `PROGRESS.md` current after each task: done / next / open questions.
- Ask blocking questions up front; default sensibly and note assumptions otherwise.

### 10.2 Documentation set
- `docs/MASTER_PRD.md` (this file) — single source of truth.
- `README.md` — run, structure, deploy.
- `docs/SUPABASE_SETUP.md` — project, schema, storage, auth, keys.
- `docs/HOW_TO_ADD_A_PRODUCT.md` — admin panel and Table Editor workflows.
- `docs/DEPLOYMENT.md` — GitHub + Vercel steps (for the guided session).
- `PROGRESS.md` — running log.

### 10.3 Open questions for the owner
- Confirm final category list against the real product sheets.
- Re-share the two Google Sheets with view access; confirm which tab is "Bones."
- Provide real product photos and a logo (placeholders used until then).
- Confirm the admin email to create in Supabase Auth.

### 10.4 Definition of done (v1)
All public pages live and responsive; WhatsApp flow verified on mobile + desktop; admin CMS creating
real products with images; SEO essentials in place; Lighthouse targets met; deployed on Vercel with
Supabase connected; docs complete.
