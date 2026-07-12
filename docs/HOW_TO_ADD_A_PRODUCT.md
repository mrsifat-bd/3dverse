# How to add a product

Two ways: the **admin panel** (easiest) or the Supabase Table Editor.

## Option A — Admin panel (recommended)
1. Go to `/admin` and sign in with your Supabase owner account.
2. **Products → New product**.
3. Fill in:
   - **Name** — the slug auto-fills (editable).
   - **Price (৳)** — number only.
   - **Description** — full text.
   - **Category** — pick from the list.
   - **Tags** — comma-separated keywords for search (e.g. `skull, anatomy, medical`).
   - **In stock** — toggle on if ready to print.
   - **Images** — click the upload tile to add one or more photos (first = main image).
4. **Create product.** It appears on the live site immediately.

Edit or delete any product from **Products** (pencil / trash icons). Deleting asks for confirmation.

## Option B — Supabase Table Editor
1. Supabase → **Table Editor → products → Insert row**.
2. Fill `name`, `slug` (unique, lowercase-hyphenated), `price`, `description`, `category`, `tags`
   (array), `image_url` (array of public Storage URLs), `in_stock`. Leave `id` and `created_at` blank.
3. Save.

## Category slugs
`bone-models` · `keyrings` · `home-decor` · `gifts` · `miscellaneous`
(Change or add categories in `src/lib/config.js` — keep slugs matching.)

## Search
Matches name, description, category, and tags. Add helpful tags (Bangla + English) so customers find
products easily.
