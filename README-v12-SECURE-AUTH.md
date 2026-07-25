# CAF CAE Standalone Dashboard v12 — Secure Auth Upgrade

This package upgrades the existing v11 dashboard to a safer login system.

## Core changes
- Password check moved to Railway backend.
- Supabase stores `password_hash`, not plain password.
- Frontend `app.js` no longer has demo passwords.
- Admin can create users from dashboard; backend hashes the password.
- Forgot/reset password endpoints added.
- Cross-site production cookies fixed for `admin.cafcae.it` → Railway API.
- Snapshot sync sanitizes users and removes password fields before saving.

## Files changed

```text
backend/server.js
frontend/api-client.js
frontend/app.js
frontend/config.js
frontend/index.html
frontend/style.css
supabase/caf_cae_schema.sql
supabase/caf_cae_schema_v12_secure_auth.sql
docs/V12-SECURE-AUTH-STEPS.md
```

## Deploy order
1. Run `supabase/caf_cae_schema_v12_secure_auth.sql` in Supabase after replacing `CHANGE_ME_*` passwords.
2. Push files to GitHub.
3. Railway redeploys backend.
4. Vercel redeploys frontend.
5. Clear browser storage and test.

## Test
Old demo login such as `agent / 123` must fail.
