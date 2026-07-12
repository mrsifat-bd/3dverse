# 3DVerse — Claude Code handoff (finish the deployment)

Paste the "PROMPT TO PASTE" block below into Claude Code (run it from the project folder). Everything
it needs is included. Context first, then the exact task.

---

## What's already done
- **App is built**: Next.js (App Router) + Supabase + Tailwind + shadcn/ui + Framer Motion, with a
  public store, WhatsApp order flow, and an admin CMS. Code lives in this folder.
- **Supabase is fully set up** on project `jrjyltlpxtfetqagibyh` (org "mrsifat-bd's Org", Free):
  `products` table + indexes, RLS (public read, authenticated write), `product-images` storage bucket
  with policies, and 12 seed products inserted.
- **GitHub repo created (empty)**: https://github.com/mrsifat-bd/3dverse
- **Local env** is already written to `.env.local` with the real Supabase values.

## What's left
1. Push this code to the GitHub repo.
2. Deploy to Vercel (import the repo or use the Vercel CLI).
3. Set 3 environment variables on Vercel.
4. Create the admin auth user in Supabase.
5. Verify the live site.

## Values you'll need
- Project folder: `/Users/mrsifat/Library/Application Support/Claude/local-agent-mode-sessions/f3ae7651-2865-4f6a-889b-fc915fa67720/2e18a200-b65c-4bce-9390-531ee6d36faa/local_2e6b45a0-0297-4584-bcca-3eb28c468aa2/outputs/3dverse-next`
- GitHub remote: `https://github.com/mrsifat-bd/3dverse.git`
- `NEXT_PUBLIC_SUPABASE_URL` = `https://jrjyltlpxtfetqagibyh.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_tgTwNiYSwrlf99JPfGsH8A_dWoqQpw_`
- `NEXT_PUBLIC_SITE_URL` = (set to the Vercel URL after first deploy)

---

## PROMPT TO PASTE into Claude Code

> You're finishing a deployment. The project is at
> `/Users/mrsifat/Library/Application Support/Claude/local-agent-mode-sessions/f3ae7651-2865-4f6a-889b-fc915fa67720/2e18a200-b65c-4bce-9390-531ee6d36faa/local_2e6b45a0-0297-4584-bcca-3eb28c468aa2/outputs/3dverse-next`.
> It's a Next.js app. Supabase is already configured and a GitHub repo already exists at
> https://github.com/mrsifat-bd/3dverse (empty). Do the following, showing me output at each step:
>
> 1. `cd` into the project folder. Run `npm install` then `npm run build` to confirm it builds. Fix any build error before continuing.
> 2. Initialize git and push to the existing repo:
>    `git init && git add -A && git commit -m "3DVerse: Next.js store + admin CMS" && git branch -M main && git remote add origin https://github.com/mrsifat-bd/3dverse.git && git push -u origin main`
>    (If it asks for GitHub auth, use my `gh` login or credential helper.)
> 3. Deploy to Vercel with the Vercel CLI: `npx vercel@latest --yes` for a preview, then
>    `npx vercel@latest --prod --yes` for production. If I'm not logged in, run `npx vercel login` and
>    wait for me to approve in the browser.
> 4. Set these production env vars on Vercel (via `npx vercel env add` or `--build-env`), then redeploy:
>    - `NEXT_PUBLIC_SUPABASE_URL` = `https://jrjyltlpxtfetqagibyh.supabase.co`
>    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_tgTwNiYSwrlf99JPfGsH8A_dWoqQpw_`
>    - `NEXT_PUBLIC_SITE_URL` = the production URL Vercel gave me
> 5. Print the final production URL and confirm the home page, `/shop`, a product page, and `/admin`
>    all load.
>
> Note: only the public "anon/publishable" Supabase key is used in the frontend — never add a
> service_role key. Don't commit `.env.local` (it's gitignored).

---

## Last manual step (admin login) — do this in the Supabase dashboard
Create your admin account so you can sign in at `/admin` on the live site:
1. Open https://supabase.com/dashboard/project/jrjyltlpxtfetqagibyh/auth/users
2. **Add user → Create new user** → enter your email + a password → **Create user**.
3. Go to `https://<your-vercel-url>/admin` and sign in with those credentials.
