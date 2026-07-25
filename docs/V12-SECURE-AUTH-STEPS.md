# CAF CAE v12 Secure Auth Upgrade

## What changed
- Frontend no longer checks passwords from `app.js`.
- Login goes to Railway `/api/auth/login`.
- Backend checks `dashboard_users.password_hash` in Supabase.
- Admin can create new employee/agent/team accounts from the dashboard.
- Forgot password endpoint is ready: `/api/auth/forgot-password` and `/api/auth/reset-password`.
- Snapshot sync removes `password` and `password_hash` before saving.

## 1) Run Supabase migration
Open Supabase → SQL Editor → New query.
Open this file:

`supabase/caf_cae_schema_v12_secure_auth.sql`

Replace every `CHANGE_ME_*` password with private passwords. Then Run.

## 2) Railway variables
Set:

```env
NODE_ENV=production
JWT_SECRET=make-a-long-random-secret
SESSION_SECRET=make-a-long-random-secret
FRONTEND_URL=https://admin.cafcae.it
CORS_ORIGIN=https://admin.cafcae.it,https://caf-cae-dashboard-v11.vercel.app,http://localhost:5500,http://127.0.0.1:5500
ALLOW_LEGACY_PASSWORDS=false
```

Keep your existing Supabase variables:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3) Deploy files
Push these changed files:

```text
backend/server.js
frontend/api-client.js
frontend/app.js
frontend/config.js
frontend/index.html
frontend/style.css
supabase/caf_cae_schema_v12_secure_auth.sql
```

## 4) Clear browser cache
Open `https://admin.cafcae.it`, press F12 → Console:

```js
localStorage.clear();sessionStorage.clear();location.reload();
```

## 5) Test
Try old login:

```text
agent / 123
```

It must fail.

Then login with the new password you set in Supabase migration.

## Notes
Forgot password currently creates a reset token and returns a temporary reset link. For full email delivery, connect SMTP/Resend later.
