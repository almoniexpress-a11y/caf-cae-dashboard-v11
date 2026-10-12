(() => {
  const cfg = window.CAF_CAE_CONFIG || {};
  const API_URL = (cfg.API_URL || '').replace(/\/$/, '');
  const TOKEN_KEY = 'caf_cae_v12_token';
  const enabled = () => Boolean(API_URL && cfg.LIVE_SYNC !== false);
  let lastPush = 0;
  let lastVersion = null;
  let pushing = false;

  const token = () => localStorage.getItem(TOKEN_KEY) || '';
  const setToken = value => {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  };
  const headers = () => {
    const h = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  };

  const json = async (path, options = {}) => {
    if (!enabled()) return null;
    const res = await fetch(API_URL + path, {
      credentials: 'include',
      headers: { ...headers(), ...(options.headers || {}) },
      ...options
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = { ok: false, error: text || `API ${res.status}` }; }
    if (!res.ok) throw new Error(data?.error || `API ${res.status}`);
    return data;
  };

  function slimState(state) {
    const raw = state || {};
    const { session, chartRefs, signatureDataUrl, signature730DataUrl, banglaSignatureDataUrl, ...safeState } = raw;
    if (Array.isArray(safeState.users)) safeState.users = safeState.users.map(({ password, password_hash, reset_token, ...u }) => u);
    return JSON.parse(JSON.stringify(safeState, (key, value) => {
      if (key === 'password' || key === 'password_hash' || key === 'reset_token') return undefined;
      if (typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('blob:'))) return '';
      if (value && typeof value === 'object' && (
        value instanceof HTMLElement ||
        value instanceof CanvasRenderingContext2D ||
        value instanceof HTMLCanvasElement
      )) return undefined;
      return value;
    }));
  }

  window.CAF_CAE_API = {
    enabled,
    token,
    setToken,
    async login(username, password) {
      const data = await json('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (data?.token) setToken(data.token);
      return data;
    },
    async logout() { try { await json('/api/auth/logout', { method: 'POST', body: '{}' }); } finally { setToken(''); } },
    async me() { return json('/api/auth/me'); },
    async forgotPassword(email) { return json('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); },
    async resetPassword(token, password) { return json('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); },
    async changePassword(currentPassword, newPassword) { return json('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }); },
    async createUser(payload) { return json('/api/admin/users/create', { method: 'POST', body: JSON.stringify(payload || {}) }); },
    async updateUserPassword(userId, password) { return json(`/api/admin/users/${encodeURIComponent(userId)}/password`, { method: 'POST', body: JSON.stringify({ password }) }); },
    async listUsers() { return json('/api/admin/users'); },
    async loadSnapshot(session) {
      if (!session) return null;
      const role = encodeURIComponent(session.role || 'admin');
      const email = encodeURIComponent(session.email || '');
      return json(`/api/live/state?role=${role}&email=${email}`);
    },
    async pushSnapshot(state, session) {
      if (!session || pushing) return null;
      const now = Date.now();
      if (now - lastPush < 1000) return null;
      lastPush = now;
      pushing = true;
      try {
        const data = await json('/api/live/state', {
          method: 'POST',
          body: JSON.stringify({ role: session.role, email: session.email, user: session.name, state: slimState(state) })
        });
        if (data?.version) lastVersion = data.version;
        return data;
      } finally { pushing = false; }
    },
    async version(session) {
      if (!session) return null;
      return json(`/api/live/version?role=${encodeURIComponent(session.role)}&email=${encodeURIComponent(session.email || '')}`);
    },
    async startVersionPolling(getSession, onChange) {
      if (!enabled()) return;
      const tick = async () => {
        try {
          const session = getSession?.();
          if (!session) return;
          const v = await this.version(session);
          if (v?.version && lastVersion && v.version !== lastVersion) await onChange?.(v);
          if (v?.version && !lastVersion) lastVersion = v.version;
        } catch (_) {}
      };
      setInterval(tick, Math.max(10, Number(cfg.VERSION_POLL_SECONDS || 25)) * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    },
    async post(path, body) { return json(path, { method: 'POST', body: JSON.stringify(body || {}) }); },
    async patch(path, body) { return json(path, { method: 'PATCH', body: JSON.stringify(body || {}) }); },
    async get(path) { return json(path); },
    async transferPractice(id, toOwner, message, status) { return json(`/api/pratiche/${encodeURIComponent(id)}/route`, { method: 'POST', body: JSON.stringify({ team: toOwner, message, status }) }); },
    async practiceTimeline(id) { return json(`/api/practices/${encodeURIComponent(id)}/timeline`); },
    async practiceNotifications(role) { return json(`/api/practices/notifications/${encodeURIComponent(role)}`); },
    async practiceComment(id, message) { return json(`/api/practices/${encodeURIComponent(id)}/comment`, { method: 'POST', body: JSON.stringify({ message }) }); }
  };
})();
