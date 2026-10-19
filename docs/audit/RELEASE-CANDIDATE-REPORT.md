# 3D Verse: release candidate report (20 Oct 2026)

**Verdict: READY FOR REVIEW** for the `hardening-rc` code. It is not
production-ready as a whole: several items below wait on owner decisions, and
Bangla mobile LCP still misses its target.

Nothing in this work was merged, deployed or pushed to the production repo.

## 1. Git and deployment state
- Production: `3dversebd/3dverse` main = `4836a91` (same tree as `1f15d1d`). Not touched.
- Release candidate: `mrsifat-bd/3dverse` branches `hardening-rc` and `mrsifat-bd` = `5e5811a` (9 commits on top of production).
- Next 15 upgrade: branch `next15-upgrade` = `6c07cce` (RC plus the upgrade). Not deployed.
- Vercel previews (project sifat72/3dverse-next) built **READY** for all three branches. Previews are behind Vercel login. Behavioural checks on the previews were **not done** because neither the Vercel connector nor the browser could open them. All behaviour below was tested locally.

## 2. Changes in the RC (small, separate commits)
| Commit | What |
|---|---|
| 4bc5c32 | DB hardening migrations + 45 DB tests |
| b68c058 | Rate-limit messages, review-photo limit, cart quantity 1-1000 with 20/50/100 suggestions |
| 1aff05b | sharp 0.33 to 0.35.5 |
| 329f52c | Bangla order timeline and courier labels, Bangla legacy redirects, CSP report-only, Bangla font/layout perf |
| 15df57c | e2e suites in repo, CI jobs, product JSON-LD fixes |
| 81c28e8 | Per-page Open Graph, Bangla product-name draft |
| a8472bd | Accessibility fixes, suites fail on findings |
| 2788754 | Invoice PDF test |
| 5e5811a | Privacy policy change draft |

Prices, delivery charges, payment flow, courier integration and order rules are unchanged.

## 3. Dependencies
- RC (Next 14.2.35): `npm audit --omit=dev` = **1 critical + 1 high (23 Next.js advisories, 4 PostCSS)**. They can't be fixed on Next 14. Mitigating factor: `images.unoptimized` is on, so the Next image optimizer (where the AVIF RCE and image-DoS advisories live) is not used. That does not cover the RSC/Server Action DoS and SSRF advisories.
- `next15-upgrade` (Next 15.5.28, React 19.2.9, @react-pdf/renderer 4.9): only **PostCSS bundled inside Next** remains (moderate/high). It is build-time only and processes our own CSS, not user input. The only fix offered is Next 16 (a major upgrade, not done).
- Recommendation: ship the Next 15 branch after review. All suites pass on it (section 15).

## 4. Rate limiting (DB-backed, no in-memory limiter)
- Written and tested (45/45 on local Postgres 16): `supabase/migration_hardening_2_rate_limits.sql`.
- Limits: orders 5 per 10 min and 30 per day per customer; cancel 20 per 10 min; track 10 per 15 min per order number and 600 per 15 min site-wide; subscribe 3 per day per email and 300 per hour site-wide; reviews 10 per hour; review photos 10 per hour; leads, page views and searches have site-wide caps.
- **NOT applied to production. Needs your approval.** App code works with or without it, so it can be applied before or after the deploy.

## 5. Quantity limits
- Cart: custom quantity 1-1000, with 20/50/100 suggestions (your answer).
- DB (part 2): whole numbers 1-1000, at most 50 lines, product IDs must be UUIDs. Live today: no upper limit. Not applied yet (see 4).

## 6. Database permissions
- **Part 1 applied live (with your approval) and verified:** `create_customer_order` and `build_invoice_for_order` can no longer be called by anon or authenticated users. `gen_order_number`, `gen_invoice_number` and `next_daily_seq` are closed to anon. Authenticated keeps them because admin order inserts use the column default. Rollback SQL is in the file.
- Read-only audit only otherwise; no policies were dropped or altered.

## 7. CSP
- `Content-Security-Policy-Report-Only` with a `/api/csp-report` endpoint. That endpoint logs only the directive, the blocked host and the page path. Nothing is enforced yet. Next step: watch the reports for 1-2 weeks, then enforce.

## 8. Other app security (manual actions for you)
- Supabase Auth uses the default SMTP (about 2 emails per hour) with "Confirm email" on, so signup and reset emails will be rate-limited. **Set up custom SMTP (e.g. Resend).**
- Redirect allowlist has `3dverse-alpha.vercel.app/**` and `*.domain.com`. Please confirm these are yours; remove `*.domain.com` if it is a placeholder.
- CAPTCHA is off (optional to enable).
- Google/Facebook login is disabled in Supabase. The buttons are hidden by a flag, but the privacy policy still mentions them (section 16).

## 9. Performance (lab only, not field data)
Local `next start`, demo data, Lighthouse 12 mobile simulated, 5 runs each. Shown as median [min-max].

| Page | Production | RC | Next 15 |
|---|---|---|---|
| / score, LCP | 88 [83-91], 3.0s | 91 [76-98], 3.2s | 84 [71-95], 2.5s |
| /bn score, LCP | 82 [80-83], 4.5s | 78 [70-86], 4.7s | 78 [68-84], 4.2s |
| /shop score, LCP | 86 [81-88], 3.8s | 88 [87-94], 3.3s | 86 [79-91], 3.3s |
| /bn/product score, LCP | 88 [86-97], 3.7s | 85 [84-90], 4.0s | 85 [81-88], 3.7s |

- CLS 0.000 everywhere. TBT 69-368 ms. Ranges overlap, so **there is no measurable difference** between the three builds in this environment.
- **Bangla LCP (about 4.2-4.7s) still misses the 2.5s target. Not fixed.** The test container has no Bengali system fonts, so it may overstate the real cost; real-device field data is needed to confirm.
- First-load JS (gzip): RC is +1 kB over production (the earlier +12 kB was a measurement artefact). Next 15 adds about 9 kB shared (React 19).
- Field data (CrUX / Search Console Core Web Vitals) was not checked: no access.
- Next steps for Bangla: lazy-load supabase-js (about 64 kB gz in the initial bundle), and subset the Hind Siliguri font. A per-language dictionary split saves only about 6-7 kB gz, so it is low value.

## 10. Bilingual
- Done: order timeline and courier status labels in Bangla, Bangla legacy redirects, rate-limit messages in both languages.
- Product names: `docs/translations/product-names-bn-DRAFT.csv` (124 names, draft, **not imported**). Please review the `approved` column.
- Product descriptions: no Bangla descriptions were invented. 22 products have very short English descriptions (under 50 characters).
- Category `islamic-items` has no Bangla blurb (English shown).
- Auth emails (Supabase templates) are still English only; they need editing in the Supabase dashboard.

## 11. Technical SEO
- Live crawl: all 288 sitemap URLs return 200. hreflang is present and reciprocal.
- Fixed in RC: og:url pointed to the home page on 39 pages; every page now sets its own og:url/locale/alternateLocale.
- Local crawl suite (canonical, hreflang, titles, robots, 404s, legacy redirects, internal links): **no issues**.
- Content issues for you: 74 products have no photo, so they get no image in search results; `mini-phone-stand` and `mini-phone-stand2` are duplicates (same title).

## 12. Structured data and business positioning
- Organization/Store: Sylhet address, area served Bangladesh, BDT, COD + bKash. Product JSON-LD shows only real ratings. Invalid `inLanguage` and an unverified return-policy block were removed from Product.
- Rich-result validation in Google's tool was not run (needs a browser).

## 13. Google tools
- The Search Console verification meta tag is present. Access to Search Console was not verified, and no claims are made about indexing or ranking.

## 14. Accessibility (axe, WCAG 2.1 A/AA, 24 pages EN+BN)
- Fixed: grey text contrast (`--stone` darkened), accessible names for Like/gallery/language buttons, underlined inline links, footer note contrast.
- **Remaining: the brand clay colour #C0603A** (white on clay = 4.04:1, clay text = 3.7-4.0:1, need 4.5:1). This changes the look, so it needs your decision. Option: `#A95433` passes everywhere.
- Keyboard: the first tab stops are named and have visible focus. A manual screen-reader review was not done.

## 15. Tests (all run locally on 20 Oct)
| Suite | RC | Next 15 |
|---|---|---|
| Unit (vitest) | 52/52 | 52/52 |
| DB hardening (Postgres 16) | 45/45 | same SQL |
| Browser regression | 47/47 | 47/47 |
| Orders + admin (fake backend) | 37/37 | 37/37 |
| SEO/link crawl | no issues | no issues |
| Accessibility | pass (clay known) | pass (clay known) |
| Lint | 0 errors | 0 errors |

The CI workflow now has `database` and `e2e` jobs. They have not run on GitHub yet; check the first run.

## 16. Privacy
- The live policy says visit data is "non-personal", but the site stores the visitor's IP via ipwho.is. Resend (the email provider) is not named, and Google/Facebook login is mentioned while disabled.
- Proposed text (EN + BN) is in `docs/policy/privacy-policy-changes-DRAFT.md`. Not live. Not legal advice.

## 17. Approvals needed before release
1. Review and merge `hardening-rc` (or `next15-upgrade`, recommended) into production, then deploy.
2. Apply `migration_hardening_2_rate_limits.sql` to Supabase.
3. Brand clay colour change for contrast (yes/no).
4. Privacy policy option A or B.
5. Manual: custom SMTP, redirect allowlist check, Bangla product names CSV, product photos and descriptions, duplicate product, Bangla auth email templates.
