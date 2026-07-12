# Supabase setup (free tier)

Connects the site to a real database + storage + admin auth. ~10 minutes, all free tier.

## 1. Create the project
1. Sign up at https://supabase.com (GitHub login is easiest).
2. **New project** → name `3dverse`, set a database password (save it), region **Singapore**.
3. Wait ~2 minutes to provision.

## 2. Schema + storage
1. **SQL Editor → New query**.
2. Paste all of `supabase/schema.sql`, click **Run**. This creates the `products` table, indexes,
   Row Level Security (public read, authenticated write), and the public `product-images` bucket.
3. (Optional) Run `supabase/seed.sql` to load the sample products.

## 3. Create the admin user
1. **Authentication → Users → Add user**.
2. Enter the owner email + a strong password. Confirm the user.
3. This is the account you'll sign in with at `/admin`.

## 4. Get API keys
1. **Project Settings → API**.
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> ⚠️ Use only the **anon public** key in the app. Never the **service_role** / secret key.

## 5. Add keys to the app
Local — create `.env.local` (copy `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev`. The demo banner disappears; products load from Supabase and `/admin` works.

On **Vercel**, add the same variables under **Project Settings → Environment Variables**, then
redeploy (set `NEXT_PUBLIC_SITE_URL` to your real domain).

## 6. Product images
- Upload via the admin panel (recommended) — `/admin/products/new` has drag-and-drop upload.
- Or in Supabase: **Storage → product-images → Upload**, then use the file's public URL.

## Free-tier limits
Database 500 MB · Storage 1 GB · Bandwidth 5 GB/month. Plenty for launch — compress images to
< 200 KB each. No paid plan needed.

## Troubleshooting
- **Still demo mode** → env vars missing/typo, or dev server not restarted / not redeployed.
- **Can't sign in to /admin** → create the user in Authentication → Users; check email/password.
- **Images broken** → bucket must be public; re-run the storage policies in `schema.sql`.
- **Write fails in admin** → re-run `schema.sql` so the authenticated write policies exist.
