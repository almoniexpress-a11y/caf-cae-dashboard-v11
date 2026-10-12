# CAF CAE Dashboard v34 — Admin Pro + Clean Login

This version fixes the login-panel problem by removing the custom takeover login.

## What changed
- Original working login from the existing dashboard is kept.
- v29/v30/v31/v33 custom login overlays are disabled.
- New SaaS/Admin Pro UI loads only after a valid session exists.
- Logout returns to the original working login page.
- v34 globals:
  - `CAF_CAE_V34_RENDER()`
  - `CAF_CAE_V34_SYNC()`
  - `CAF_CAE_V34_LOGOUT()`

## Deployment
1. Copy files into the current project.
2. Push GitHub for Vercel frontend.
3. Upload backend only if you need the included `/api/me` compatibility routes.

## Test
After deploy and hard refresh:

```js
typeof CAF_CAE_V34_RENDER
```

It should return `"function"` after login.
