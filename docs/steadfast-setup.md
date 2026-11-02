# Steadfast courier setup

Parcels are created from Admin → Orders → "Create Steadfast Parcel".
The server needs these Vercel environment variables (Production):

| Variable | Where it comes from |
|---|---|
| `STEADFAST_API_KEY` | Steadfast portal → API |
| `STEADFAST_SECRET_KEY` | Steadfast portal → API |
| `STEADFAST_BASE_URL` (optional) | defaults to `https://portal.packzy.com/api/v1` |

After adding or changing them, redeploy (Vercel only reads new values on a new deployment).
Never put these in code or in any `NEXT_PUBLIC_` variable.

## Cash on delivery (COD) sent to Steadfast
- Website orders: the customer pays the delivery charge by bKash, so the courier
  collects **product price − discount** only.
- Manual orders added by the admin: the courier collects **products + delivery − discount**.
- The server recalculates this when the parcel is created (`codForOrder` in `src/lib/orders.js`).
