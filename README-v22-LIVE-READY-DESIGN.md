# CAF CAE v22 Live Ready Design Patch

This patch keeps the premium Revisu dark-green SaaS design, but removes static/demo KPI numbers from the main dashboards and uses real backend/local state values instead.

Included improvements:
- Admin dashboard KPIs use real practices/users/clients/revenue where available.
- Agent dashboard uses real practices, wallet/credit, client count and estimated profit.
- Team Bangla dashboard uses real inbox/workflow/document/client counts.
- Team Italy dashboard uses real assigned practices, progress and upload/receipt actions.
- Commercialista dashboard uses real companies, invoices, documents and assigned practices.
- Membership panel uses real membership/practice data; if none exists it shows zero instead of fake numbers.
- Tables show only real practices from backend/Supabase state.
- No demo table rows are inserted.

Deploy: replace frontend app.js/style.css and push to Vercel. Backend restart is not required unless backend files changed.
