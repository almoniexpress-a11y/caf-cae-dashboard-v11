# CAF CAE v30 Login Fix

Fixes v29 login input/submit problems.

- Inputs clickable/typeable
- Uses real backend `/api/auth/login`
- Saves `caf_cae_v12_token`, `caf_cae_token`, and `caf_cae_v12_session`
- Exports `CAF_CAE_V30_RENDER`, `CAF_CAE_V30_SYNC`, `CAF_CAE_V30_LOGIN`, `CAF_CAE_V30_LOGOUT`
- Keeps old dashboard hidden after logout
