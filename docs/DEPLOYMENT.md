# Deployment — GitHub + Vercel (free)

We'll do this together in a guided browser session, but here are the exact steps.

## 1. Push to GitHub
```bash
git init
git add .
git commit -m "3DVerse: initial Next.js store + admin CMS"
git branch -M main
git remote add origin https://github.com/<you>/3dverse.git
git push -u origin main
```

## 2. Import to Vercel
1. https://vercel.com → **Add New… → Project** → import the `3dverse` repo.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults.
3. **Environment Variables** — add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your Vercel domain (e.g. `https://3dverse.vercel.app`)
4. **Deploy.**

## 3. Verify live
- Home, Shop (search/filter/sort), a product page, category page, About, Contact.
- **Buy Now on WhatsApp** opens a chat with the Bangla message (test on mobile + desktop).
- `/admin` sign-in works; create a test product with an image; confirm it appears on the site.
- Check `/(sitemap.xml)` and `/robots.txt`.

## 4. Custom domain (optional)
Vercel → Project → **Settings → Domains** → add your domain and follow the DNS steps. Update
`NEXT_PUBLIC_SITE_URL` to match, then redeploy.

## CI (already included)
`.github/workflows/ci.yml` runs install → lint → tests → build on every push/PR. Vercel deploys
Preview builds for PRs and Production from `main` automatically once the repo is connected.

## Notes
- The build runs in demo mode without env vars (safe for CI); real data comes from the Vercel env
  vars at runtime.
- Only the anon public key is ever exposed to the browser; RLS protects all writes.
