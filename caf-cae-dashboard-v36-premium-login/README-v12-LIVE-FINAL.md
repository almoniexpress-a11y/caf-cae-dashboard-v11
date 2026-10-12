# CAF CAE Dashboard v12 Live Final

This package is the live-ready secure version for admin.cafcae.it.

## Included fixes
- Premium login page, no demo text, corrected logo asset.
- Secure backend login through Railway.
- Passwords stored as bcrypt hashes in Supabase.
- Admin can create users and reset passwords.
- User can change own password from the top key button.
- Agent and Commercialista pages kept working with live snapshot sync.
- Missing assets restored: CAF CAE logo and 730 model PDF.

## Replace files
Upload/replace the whole project folder, or copy these folders into your GitHub project:

- backend/
- frontend/
- supabase/
- docs/

## Supabase
Run `supabase/caf_cae_schema_v12_secure_auth.sql` in Supabase SQL Editor. Replace CHANGE_ME passwords before running.

## Railway variables
CORS_ORIGIN=https://admin.cafcae.it,https://caf-cae-dashboard-v11.vercel.app
FRONTEND_URL=https://admin.cafcae.it
SESSION_SECRET=long-random-secret
ALLOW_LEGACY_PASSWORDS=false

## After deploy
Open browser console once and run:

```js
localStorage.clear();sessionStorage.clear();location.reload();
```
