# Security Checklist v11

- Keep service role key only in Railway.
- Never place Shopify Admin token in frontend.
- Use HTTPS custom domains.
- Set `NODE_ENV=production`.
- Set strong `SESSION_SECRET`.
- Restrict `CORS_ORIGIN` to real domains.
- Verify Shopify App Proxy signature.
- Verify Shopify webhook HMAC.
- Use signed URLs for private files.
- Store files in private Supabase/R2 bucket.
- Add Row Level Security policies before direct browser DB access.
- Keep customer dashboard reading through App Proxy, not raw Supabase.
- Use audit logs for important changes.
- Use role checks for admin-only actions.
