# CAF CAE Pro v35 — Clean Full Rebuild

- Original stable login from `index.html` + `app.js` is preserved.
- v35 never creates/replaces login inputs and never intercepts login typing.
- New SaaS dashboard mounts only after the original login succeeds.
- Logout delegates to the original `#btnLogout` handler and returns to the original login.
- Live backend/Supabase data only; no demo rows are generated.
- Role dashboards: Admin, Agent, Team Bangla, Team Italy, Commercialista.
- Core working actions: create practice, save clients, authorize to Italy, status updates, document/receipt upload, preview/download, tickets, daily reports, agent credit requests and admin approval.
