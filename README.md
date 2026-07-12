# 3DVerse — Next.js store + admin CMS

A responsive, WhatsApp-order e-commerce site for **3DVerse** (3D printing, Sylhet, Bangladesh),
built on **Next.js (App Router) · Supabase · Tailwind CSS · shadcn/ui · Framer Motion**. Customers
browse products and order via WhatsApp (no payment gateway). The owner manages the catalog through a
password-protected admin panel. Runs entirely on **Vercel Free + Supabase Free**.

See `docs/MASTER_PRD.md` for the full product spec (all 10 planning parts consolidated).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

The site works immediately in **demo mode** with built-in sample products (a thin banner says so).
To use your real catalog + admin, connect Supabase:

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Full setup: `docs/SUPABASE_SETUP.md`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

---

## Structure

```
src/
  app/
    layout.jsx, globals.css, page.jsx        Root layout + Home
    shop/                                    Shop (search/filter/sort)
    product/[slug]/                          Product detail (+ JSON-LD, metadata)
    category/[slug]/                         Category listing
    about/ contact/                          Static pages
    admin/                                   Admin CMS (auth-gated)
      layout.jsx  page.jsx  dashboard/  products/ (list, new, [id])
    sitemap.js  robots.js  not-found.jsx     SEO + 404
  components/
    Navbar, Footer, ProductCard, ProductGrid, ProductGallery,
    ShopBrowser, CategoryProducts, BuyButton, SocialLinks, Motion, DemoBanner, icons
    ui/           shadcn-style primitives (button, card, input, select, switch, …)
    admin/        AdminShell, ProductTable, ProductForm, AdminDashboard
  lib/
    config.js         Business info + categories (edit here)
    supabaseClient.js Client + "configured?" flag
    products.js       Public data layer (Supabase or mock)
    adminProducts.js  Admin CRUD + image upload
    mockData.js       Demo catalog
    whatsapp.js       wa.me order-link builder (Bangla message)
    format.js  utils.js
  hooks/useAuth.js    Supabase Auth session
supabase/  schema.sql, seed.sql
docs/      MASTER_PRD.md, SUPABASE_SETUP.md, HOW_TO_ADD_A_PRODUCT.md, DEPLOYMENT.md
.github/workflows/ci.yml
```

The public site reads through `lib/products.js`, which uses Supabase when configured and the mock
catalog otherwise — so demo → live needs **no code change**, just the env vars.

---

## Admin panel

`/admin` — sign in with the Supabase Auth account you create (see setup guide). Add/edit/delete
products, upload images to Supabase Storage, toggle stock, set category + tags. Writes are protected
by Supabase Row Level Security, not just the UI.

In demo mode (no Supabase), `/admin` shows a notice explaining it needs Supabase configured.

---

## Key features

- WhatsApp Buy Now with a Bangla pre-filled message (name, price, product link), `encodeURIComponent`,
  mobile + desktop via `wa.me`.
- Keyword search + category filter + sort; category pages; product gallery; related products.
- SEO: per-page metadata, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD Product data.
- Performance: `next/image`, server components, code-split admin, font `display: swap`.
- Security headers in `next.config.mjs`; anon key only in the client; RLS for writes.
- Studio Minimal design system (cream / ink / clay) with subtle Framer Motion.

---

## Deploy

Deploy on Vercel and connect Supabase — step by step in `docs/DEPLOYMENT.md`.

## Notes on env vars

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key only, never the
  service_role/secret key.
- `NEXT_PUBLIC_SITE_URL` — your production domain; used for absolute WhatsApp links, sitemap and OG.
