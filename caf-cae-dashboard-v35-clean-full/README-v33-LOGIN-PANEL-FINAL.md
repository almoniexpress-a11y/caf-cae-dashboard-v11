# CAF CAE v33 - Login Panel Final Fix

This patch adds `frontend/v33-login-shield.js`, a standalone login panel that avoids Chrome Password Manager/autofill by using custom contenteditable fields instead of normal login inputs. It is loaded last and takes over logout/login without showing the old dashboard.

Test in console:

```js
typeof CAF_CAE_V33_LOGIN
```

Should return `function`.
