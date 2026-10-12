# CAF CAE v15 UUID Final Hotfix

Fixes Supabase UUID errors like:

`invalid input syntax for type uuid: "ORXgKyDA2eJ2"`

What changed:
- Backend no longer sends frontend nanoid/text ids to UUID columns.
- Invalid UUID filters return empty result so fallback by code works.
- Nullable foreign UUIDs like client_id/company_id/pratica_id are cleaned before insert/update.
- Agent order sync frontend from v15 sync hotfix is included.

Copy backend/server.js and frontend/app.js, then push.
