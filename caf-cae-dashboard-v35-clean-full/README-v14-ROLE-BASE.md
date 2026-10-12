# CAF CAE Dashboard v14 — Role Base Upgrade

This version keeps the v12 secure backend login and v13 clean start, then improves the live base for future individual page upgrades.

## Included

- Premium CGN-style blue header across all roles
- Dark navy role sidebars for Agent, Commercialista, Team Bangla, Team Italy, Admin
- Improved secure login page with CAF CAE logo and no demo text
- Admin portal upgraded with:
  - Create new employee / agent / team / commercialista / admin
  - Phone, office, salary, credit, active status fields
  - Reset password and activate/deactivate user
  - Create a practice/order directly from Admin
  - See all pratiche
  - See Team Bangla / Italy daily work reports
  - See team actions, salary, credit, commissions, tickets, docs, official sources
- Agent and Commercialista remain usable as the stable live base
- Clean Supabase reset SQL kept from v13

## Push instructions

Copy this package into the live GitHub repo root, then:

```powershell
cd "C:\Users\almon\Downloads\caf-cae-standalone-dashboard-v11\caf-cae-standalone-dashboard-v11"
git add -A
git commit -m "Upgrade v14 role base dashboard"
git push
```

## Supabase

If you want a clean start, run:

```text
supabase/caf_cae_reset_clean_start.sql
```

Keep users/password_hash. Do not run the old v11 seed SQL.

## After deployment

Open:

```text
https://admin.cafcae.it
```

Then clear browser state once:

```js
localStorage.clear();sessionStorage.clear();location.reload();
```

