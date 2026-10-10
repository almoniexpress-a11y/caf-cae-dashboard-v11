# CAF CAE Standalone Dashboard v11 — Full Live Backend Package

This package is the full dashboard package for **Agent + Commercialista + Team Bangla + Team Italy + Admin**.
It is not only Commercialista.

## What is included

- Frontend dashboard from v10 with Agent, Commercialista, Bangla Team, Italy Team and Admin dashboards.
- Blue CGN-style header and role-based dashboard screens.
- Agent domanda system, 730 wizard, client list, documents, credit, tickets, notifications and generated documents.
- Commercialista dashboard design, clients/ditte, fatture, F24, vendite, dipendenti, documenti, comunicazioni, scadenze, backup.
- Team Bangla intake/order creation and document control.
- Team Italy assigned practices, completion, receipt/protocol flow.
- Admin users, tickets, agent credit, pratiche, salary, commission, sources/notices.
- Full Express backend with Supabase/PostgreSQL persistence.
- Live state sync for the whole dashboard.
- Shopify App Proxy endpoints for `/apps/cae-commercialista`.
- Shopify webhook verification route.
- Supabase SQL schema for all main tables.
- Railway deployment files and environment example.

## Folders

```text
frontend/
  index.html
  style.css
  app.js
  products.js
  config.js
  api-client.js
  assets/
    caf-cae-logo.png
    730_modello_2026.pdf

backend/
  server.js
  package.json
  .env.example

supabase/
  caf_cae_schema.sql
  caf_cae_schema_v11.sql

docs/
  LIVE-SETUP.md
  API-ENDPOINTS.md
  SECURITY-CHECKLIST.md
```

## Local quick test

1. Open terminal in `backend/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. For quick demo without Supabase, leave Supabase empty and run:
   `npm run dev`
5. Open `frontend/config.js` and set:
   `API_URL: "http://localhost:3000"`
6. Open `frontend/index.html` with Live Server.
7. Login:
   - `old demo credentials`
   - secure commercialista password from Supabase/Admin
   - secure Team Bangla password from Supabase/Admin
   - secure Team Italy password from Supabase/Admin
   - secure admin password from Supabase/Admin

## Production live mode

1. Run `supabase/caf_cae_schema.sql` in Supabase.
2. Deploy `backend/` to Railway.
3. Add Supabase URL and service role key to Railway variables.
4. Set frontend `API_URL` to `https://api.cafcae.it`.
5. Deploy frontend to `admin.cafcae.it`.
6. Create Shopify App Proxy:
   `/apps/cae-commercialista` → `https://api.cafcae.it/apps/cae-commercialista`

## Live sync logic

The frontend still works locally if backend is offline. When API is configured:

- Every save writes localStorage and pushes a live snapshot to backend.
- Backend saves the snapshot and increments version.
- Other dashboards poll version every 25 seconds and refresh if data changed.
- Shopify customer dashboard uses verified App Proxy endpoints and client version system.

## Important note

This v11 package gives the live backend foundation for the full dashboard. The next hardening step is replacing snapshot sync gradually with table-by-table API calls for each form, but the backend already includes granular endpoints for practices, agent wallet, commercialista modules, tickets, notices, documents, Shopify proxy and webhooks.


## v17 Agent CGN-style
Added CGN-style agent portal structure based on uploaded screen recording while keeping CAF CAE branding and secure backend.


## v19 update
CAF CAE own service catalogue, appointment/call intake and improved blue header/logo.


## v33 Login Panel Final Fix
See `README-v33-LOGIN-PANEL-FINAL.md`.
