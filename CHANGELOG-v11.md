# Changelog v11

## Main goal
Turn the dashboard from frontend-only structure into a full live backend package for all roles.

## Added

- Full backend folder with Express server.
- Supabase/PostgreSQL schema for all main dashboard modules.
- Live sync endpoint for the whole dashboard state.
- Frontend API client.
- Automatic push to backend after save.
- Version polling for real-time dashboard refresh.
- Backend auth endpoints.
- Role dashboards API.
- Pratiche create/update/status/route/complete endpoints.
- Agent wallet, agent clients, credit requests and modification requests endpoints.
- Commercialista endpoints for companies, sales, invoices, F24, employees, documents, communications, deadlines, backups, subscriptions and payments.
- Admin endpoints for users, tickets, notices, sources and stats.
- Document upload endpoint with Supabase Storage support.
- Shopify App Proxy endpoints for `/apps/cae-commercialista`.
- Shopify webhook HMAC verification route.
- Railway `.env.example`.
- Live setup, API endpoint and security docs.

## Preserved

- Agent dashboard from v9.
- Commercialista dashboard design from v10.
- Team Bangla dashboard.
- Team Italy dashboard.
- Admin dashboard.
- Existing demo logins.
- Local demo mode.
