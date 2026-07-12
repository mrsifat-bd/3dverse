# Deploy now — the one step I need you to run

Everything else is done or will be done by me in the browser. Pushing code to GitHub is the only
step that needs your own login, so here's the single command block. Open **Terminal** and paste it.

## 1. Push the code to GitHub

I already created the empty repo: **https://github.com/mrsifat-bd/3dverse**. Just run:

```bash
cd "/Users/mrsifat/Library/Application Support/Claude/local-agent-mode-sessions/f3ae7651-2865-4f6a-889b-fc915fa67720/2e18a200-b65c-4bce-9390-531ee6d36faa/local_2e6b45a0-0297-4584-bcca-3eb28c468aa2/outputs/3dverse-next"
git init
git add -A
git commit -m "3DVerse: Next.js store + admin CMS"
git branch -M main
git remote add origin https://github.com/mrsifat-bd/3dverse.git
git push -u origin main
```

If git asks you to sign in to GitHub, approve it (browser or keychain). That's the only auth needed.

## 2. I take it from here
Once it's on GitHub, tell me "pushed" and I'll:
- Import the repo into Vercel and deploy it.
- Add these environment variables in Vercel for you:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://jrjyltlpxtfetqagibyh.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_tgTwNiYSwrlf99JPfGsH8A_dWoqQpw_`
  - `NEXT_PUBLIC_SITE_URL` = your new Vercel URL
- Verify the live site end to end.

## Test locally first (optional)
Your real keys are already in `.env.local`, so you can preview the real site now:
```bash
npm install
npm run dev     # http://localhost:3000
```
