# CAF CAE ERP v21 — Shopify-style Practices Backend

This pack moves practices/orders from browser-only localStorage into the backend/Supabase flow.

## What changes

- Admin, Bangla, Italy and Commercialista load practices from `/api/practices`.
- Every save/transfer/status update pushes practices to Supabase via `/api/practices/bulk-upsert`.
- Bangla → Italy transfers stay visible to Bangla because watchers/current owner are stored in the `pratiche` table.
- Other browsers no longer depend on local demo data.
- Console helpers included:
  - `CAF_CAE_SYNC_PRACTICES()` pulls from backend.
  - `CAF_CAE_PUSH_PRACTICES()` pushes current local practices to backend.

## Deploy order

1. Run `supabase/caf_cae_schema_v21_shopify_practices.sql` in Supabase SQL Editor.
2. Replace files from this ZIP.
3. Push to GitHub.
4. Pull/restart Hetzner backend.
5. Wait Vercel deploy.
6. On all browsers: clear cache once and login again.

## Test

1. Create a new practice in Admin or Agent.
2. Open Team Bangla in another browser: it should appear.
3. Transfer Bangla → Italy.
4. Open Team Italy in another browser: it should appear.
5. Bangla should still track it as watcher.
