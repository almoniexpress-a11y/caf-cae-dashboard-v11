# Live Setup — CAF CAE v11

## 1. Supabase

1. Create Supabase project.
2. Open SQL Editor.
3. Run `supabase/caf_cae_schema.sql`.
4. Create storage bucket named `documents`.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` private in Railway only.

## 2. Railway backend

1. Create a Railway project.
2. Deploy the `backend/` folder.
3. Add environment variables from `backend/.env.example`.
4. Run deploy.
5. Test:
   `https://your-railway-url/api/health`

## 3. Custom backend domain

Set:

```text
api.cafcae.it -> Railway backend
```

Add the CNAME/TXT records Railway gives you in Cloudflare or your domain provider.

## 4. Admin frontend domain

Host `frontend/` as static files on Cloudflare Pages, Vercel, Netlify, or Railway static.

Set:

```text
admin.cafcae.it -> frontend hosting
```

In `frontend/config.js` set:

```js
API_URL: "https://api.cafcae.it"
```

## 5. Shopify App Proxy

In Shopify app settings:

```text
Subpath prefix: apps
Subpath: cae-commercialista
Proxy URL: https://api.cafcae.it/apps/cae-commercialista
```

Then customer dashboard URL is:

```text
https://www.cafcae.it/apps/cae-commercialista
```

## 6. Shopify webhooks

Create these webhooks pointing to backend:

```text
POST https://api.cafcae.it/api/shopify/webhooks/customers-create
POST https://api.cafcae.it/api/shopify/webhooks/customers-update
POST https://api.cafcae.it/api/shopify/webhooks/orders-create
POST https://api.cafcae.it/api/shopify/webhooks/orders-paid
POST https://api.cafcae.it/api/shopify/webhooks/app-uninstalled
```

## 7. Test live sync

1. Login as `agent / 123`.
2. Create one pratica.
3. Login as `bangla / 123` in another browser.
4. Wait 25 seconds or refresh.
5. Bangla sees the updated pratica.
6. Admin can see all.
