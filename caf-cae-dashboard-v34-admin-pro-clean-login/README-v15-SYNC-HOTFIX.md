# v15 Sync Hotfix

Fixes the issue where orders/pratiche created by Agent were visible only in Agent dashboard and not in Admin or Team Bangla/Italy.

Changed file:
- frontend/app.js

What changed:
- Saves operational data into shared backend snapshot `role=ops,email=all`.
- Admin/Team/Commercialista/Agent load this shared operational snapshot on login.
- No Supabase SQL required.
