# CAF CAE ERP v22 Pro — Green UI + Shopify-style backend workflow

This pack upgrades the v21 backend-native practice system with the planned v22 modules:

## Included

### Workflow
- Agent-created practices go first to **Team Bangla + Admin**.
- Team Italy receives practices only after **Team Bangla/Admin authorization**.
- Admin can override/authorize.
- Team members can view team queue; assigned staff can be stored per practice.

### Team Bangla
- Premium dark-green dashboard shell.
- Authorize and transfer to Team Italy.
- Upload backend documents.
- Missing document / daily report hooks.
- Client-oriented workflow.

### Team Italy
- Better practice full-detail panel hooks.
- Upload receipt/document to backend storage.
- Return to Team Bangla for integration.
- Status/progress/timeline support.

### Agent
- Practices stay backend-native.
- Credit request API.
- Profit/credit dashboard shell.
- Client save/search API.

### Commercialista
- Company/package API.
- Document storage foundations.
- Client/ditta management foundations.

### Admin
- Centralized control APIs.
- Team members/daily reports.
- Agent credit requests and approval ledger.
- Notifications and tickets.

### Documents / allegati
- `practice_files` backend table.
- Upload endpoint:
  - `POST /api/practices/:id/files/upload`
- List endpoint:
  - `GET /api/practices/:id/files`
- Preview/download endpoints:
  - `GET /api/files/:id/preview`
  - `GET /api/files/:id/download`
- Uses Supabase Storage bucket `documents`.

## Deploy order

1. Run SQL in Supabase:
   - `supabase/caf_cae_schema_v22_erp_storage_workflow.sql`
2. Copy this pack into the current project.
3. Push to GitHub.
4. Update Hetzner backend from this pack, restart PM2.
5. Wait Vercel deploy and hard refresh admin site.
6. In browser console run:
   - `CAF_CAE_V22_SYNC()`

## Important environment

Backend needs existing Supabase env:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional `SUPABASE_STORAGE_BUCKET=documents`

## Manual smoke tests

### 1. Backend route check
From browser console:
```js
fetch('https://api.cafcae.it/api/practices', {headers:{Authorization:'Bearer '+localStorage.getItem('caf_cae_v12_token')}}).then(r=>r.json()).then(console.log)
```

### 2. File upload
Open a practice detail and click **Carica allegati**. Then reload in another browser/user and verify preview/download.

### 3. Workflow
Agent creates practice -> Team Bangla sees it -> Team Bangla authorizes -> Team Italy sees it.

## Notes
This pack keeps current screens working and layers v22 APIs/UI on top. It does not remove old screens; it upgrades them safely.
