# CAF CAE Pro v37 — Live UI Fix

- Keeps the original working login/authentication.
- Forces the new SaaS UI file to be the deployed `frontend/v26-rebuild.js`.
- Adds `CAF_CAE_V37_RENDER()` and `CAF_CAE_V37_SYNC()`.
- Guards the legacy v21 render so a missing old DOM node cannot break the new UI.
- Uses cache-busting `?v=37` for the new UI JS/CSS.
- Includes an install helper that verifies the copied file before Git push.
