# CAF CAE ERP v20 - Workflow Engine Pack 1

This update fixes the disappearing-practice problem and starts the enterprise workflow engine.

## What changed

### Frontend
- Practices now use **Owner + Watchers**.
- Team Bangla can transfer to:
  - Team Italy
  - Commercialista
  - Admin / Bangla return
- A transferred practice does **not disappear** from the previous team.
- Team Bangla can still track practices after sending to Italy or Commercialista.
- Team Italy can verify, update status, return to Bangla, send to Commercialista, and complete.
- Commercialista has a v20 queue for assigned practices.
- Admin gets live workflow activity, transfer history, and notifications.
- Practice detail modal now shows:
  - Current owner
  - Workflow status
  - Progress
  - Watchers
  - Timeline
  - Transfer buttons

### Backend
- Added v20 workflow helpers.
- Added workflow fields to pratica payload:
  - current_owner
  - workflow_status
  - progress
  - watchers
  - previous_owners
- Added workflow APIs:
  - POST /api/pratiche/:id/route
  - POST /api/practices/:id/transfer
  - GET /api/practices/:id/timeline
  - GET /api/practices/notifications/:role
  - POST /api/practices/:id/comment
- Added backend history/notification/audit support.

### Supabase
Run this SQL first:

```text
supabase/caf_cae_schema_v20_workflow.sql
```

## Deploy order

1. Run SQL migration in Supabase:
   - `supabase/caf_cae_schema_v20_workflow.sql`
2. Replace project files with this package.
3. Commit and push to GitHub.
4. Wait Vercel deployment.
5. Restart Hetzner backend with PM2.
6. Open admin.cafcae.it and clear cache/local storage once.

## Test flow

1. Login Agent and create one practice.
2. Login Team Bangla.
3. Open practice.
4. Click `Invia Team Italy`.
5. Check Team Bangla: practice remains visible as watcher.
6. Login Team Italy: practice appears as owner.
7. Open and click `Invia Commercialista`.
8. Login Commercialista: practice appears.
9. Login Admin: live activity and notifications appear.

## Important

This is Sprint 1 Pack 1. It does not rebuild the entire ERP yet. It fixes the workflow foundation first.
