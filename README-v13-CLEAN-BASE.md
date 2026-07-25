# CAF CAE Dashboard v13 Clean Base

This version is the stable live base after v12 secure auth. It removes demo seed practices/companies/tickets and starts with a clean dashboard for real work.

## Included
- Secure backend login remains active.
- No demo pratiche in frontend seed.
- No demo companies/invoices/tickets.
- Agent/Team/Commercialista/Admin pages stay available for later individual upgrades.
- Clean reset SQL included: `supabase/caf_cae_reset_clean_start.sql`.

## Deploy
Copy these files into the live GitHub repo root, then push:

```powershell
git add -A
git commit -m "Upgrade v13 clean live base"
git push
```

## Supabase clean reset
Run `supabase/caf_cae_reset_clean_start.sql` only if you want to delete current demo/snapshot/practice data and start fresh. It keeps `dashboard_users` and secure `password_hash`.

## Browser clean
After deploy:

```js
localStorage.clear();sessionStorage.clear();location.reload();
```
