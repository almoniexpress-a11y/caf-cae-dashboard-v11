(() => {
  const cfg = window.CAF_CAE_CONFIG || {};
  const API_URL = (cfg.API_URL || '').replace(/\/$/, '');
  const enabled = () => Boolean(API_URL && cfg.LIVE_SYNC !== false);
  let lastPush = 0;
  let lastVersion = null;
  let pushing = false;
  const headers = () => ({ 'Content-Type': 'application/json' });
  const json = async (path, options = {}) => {
    if (!enabled()) return null;
    const res = await fetch(API_URL + path, { credentials: 'include', headers: headers(), ...options });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  };
  function slimState(state) {
  const raw = state || {};

  // Remove browser-only / circular objects BEFORE JSON.stringify
  const {
    session,
    chartRefs,
    signatureDataUrl,
    signature730DataUrl,
    banglaSignatureDataUrl,
    ...safeState
  } = raw;

  return JSON.parse(JSON.stringify(safeState, (key, value) => {
    // Do not send huge base64 signatures or canvas/image data to backend snapshot
    if (
      typeof value === 'string' &&
      (value.startsWith('data:image') || value.startsWith('blob:'))
    ) {
      return '';
    }

    // Do not send DOM / Chart / browser objects
    if (
      value &&
      typeof value === 'object' &&
      (
        value instanceof HTMLElement ||
        value instanceof CanvasRenderingContext2D ||
        value instanceof HTMLCanvasElement
      )
    ) {
      return undefined;
    }

    return value;
  }));
}
  window.CAF_CAE_API = {
    enabled,
    async login(username, password) {
      return json('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    },
    async me() { return json('/api/auth/me'); },
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
    async get(path) { return json(path); }
  };
})();
