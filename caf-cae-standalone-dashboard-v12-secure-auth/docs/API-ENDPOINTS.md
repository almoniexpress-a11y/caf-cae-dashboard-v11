# CAF CAE v11 API Endpoints

## Health
- `GET /api/health`

## Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Live sync
- `GET /api/live/state?role=agent&email=agent@cafcae.it`
- `POST /api/live/state`
- `GET /api/live/version?role=agent&email=agent@cafcae.it`

## Dashboard
- `GET /api/dashboard/:role`

## Pratiche
- `GET /api/pratiche`
- `POST /api/pratiche`
- `PATCH /api/pratiche/:id`
- `POST /api/pratiche/:id/missing-docs`
- `POST /api/pratiche/:id/route`
- `POST /api/pratiche/:id/complete`

## Agent
- `GET /api/agent/:email/wallet`
- `GET /api/agent/:email/clients`
- `POST /api/agent/client/upsert`
- `POST /api/agent/credit-request`
- `POST /api/agent/modify-request`

## Commercialista
- `GET/POST/PATCH /api/commercialista/companies`
- `GET/POST/PATCH /api/commercialista/invoices`
- `GET/POST/PATCH /api/commercialista/sales`
- `GET/POST/PATCH /api/commercialista/f24`
- `GET/POST/PATCH /api/commercialista/employees`
- `GET/POST/PATCH /api/commercialista/documents`
- `GET/POST/PATCH /api/commercialista/communications`
- `GET/POST/PATCH /api/commercialista/deadlines`
- `GET/POST/PATCH /api/commercialista/backups`
- `GET/POST/PATCH /api/commercialista/subscriptions`
- `GET/POST/PATCH /api/commercialista/payments`

## Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users/create`
- `POST /api/admin/credit-request/:id/approve`
- `POST /api/admin/modify-request/:id/approve`
- `GET /api/tickets`
- `POST /api/tickets/create`
- `PATCH /api/tickets/:id`
- `GET /api/notices`
- `POST /api/notices/create`
- `GET /api/sources`
- `POST /api/sources/create`

## Documents
- `POST /api/documents/upload`
- `GET /api/documents/:id/signed-url`
- `POST /api/documents/generated`

## Shopify App Proxy
- `GET /apps/cae-commercialista/version`
- `GET /apps/cae-commercialista/dashboard`
- `GET /apps/cae-commercialista/resources/:kind`

## Shopify webhooks
- `POST /api/shopify/webhooks/:topic`
