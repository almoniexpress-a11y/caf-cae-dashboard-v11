(() => {
  'use strict';
  const API = () => (window.CAF_CAE_CONFIG && window.CAF_CAE_CONFIG.API_URL) || window.CAF_CAE_API_BASE || 'https://api.cafcae.it';
  const token = () => localStorage.getItem('caf_cae_v12_token') || localStorage.getItem('caf_cae_token') || '';
  const session = () => { try { return JSON.parse(localStorage.getItem('caf_cae_v12_session') || 'null'); } catch { return null; } };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clearAuth = () => {
    ['caf_cae_v12_token','caf_cae_token','caf_cae_v12_session','caf_cae_v11_session','caf_cae_v8_session'].forEach(k=>localStorage.removeItem(k));
    try { sessionStorage.clear(); } catch {}
    try { if(window.CAF_CAE_API && typeof window.CAF_CAE_API.setToken === 'function') window.CAF_CAE_API.setToken(''); } catch {}
  };

  function hideOldLoginAndUi(){
    ['loginOverlay','caeV29LoginRoot'].forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });
    document.documentElement.classList.add('cae-v33-login-mode');
    document.body.classList.add('cae-v33-login-active');
  }
  function unhideApp(){
    document.documentElement.classList.remove('cae-v33-login-mode','cae-v30-login-mode');
    document.body.classList.remove('cae-v33-login-active','cae-v29-login-active');
    const root = document.getElementById('caeV33LoginRoot'); if(root) root.remove();
    const overlay = document.getElementById('loginOverlay'); if(overlay) overlay.remove();
  }
  function fieldText(id){ const el=document.getElementById(id); return (el ? el.innerText || el.textContent || '' : '').replace(/\u00a0/g,' ').trim(); }
  function focusEnd(el){
    try { el.focus(); const r=document.createRange(); r.selectNodeContents(el); r.collapse(false); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch { el.focus(); }
  }

  async function login(username, password){
    let data = null, lastError = '';
    if(window.CAF_CAE_API && typeof window.CAF_CAE_API.login === 'function'){
      try { data = await window.CAF_CAE_API.login(username, password); }
      catch(e){ lastError = e.message || String(e); }
    }
    const body = { username, email: username, identifier: username, password };
    if(!data){
      for(const ep of ['/api/auth/login','/api/login','/login']){
        try{
          const res = await fetch(API()+ep, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(body) });
          const text = await res.text();
          let parsed = {}; try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw:text }; }
          console.log('CAF CAE v33 login try', ep, res.status, parsed);
          if(res.ok && (parsed.token || parsed.access_token || parsed.jwt || parsed.user || parsed.profile)) { data = parsed; break; }
          lastError = parsed.error || parsed.message || text || ('HTTP '+res.status);
        } catch(e){ lastError = e.message || String(e); }
      }
    }
    if(!data) throw new Error(lastError || 'Login non riuscito. Controlla username/password.');
    const tok = data.token || data.access_token || data.jwt || data.session?.access_token || '';
    const u = data.user || data.profile || data.session?.user || data;
    if(tok){
      localStorage.setItem('caf_cae_v12_token', tok);
      localStorage.setItem('caf_cae_token', tok);
      try { if(window.CAF_CAE_API && typeof window.CAF_CAE_API.setToken === 'function') window.CAF_CAE_API.setToken(tok); } catch {}
    }
    localStorage.setItem('caf_cae_v12_session', JSON.stringify({
      id: u.id || u.user_id || undefined,
      email: u.email || username,
      username: u.username || username,
      name: u.name || u.full_name || u.username || username,
      role: u.role || 'admin',
      phone: u.phone,
      office: u.office || 'CAF CAE'
    }));
    return true;
  }

  function renderLogin(message=''){
    hideOldLoginAndUi();
    let root = document.getElementById('caeV33LoginRoot');
    if(!root){ root = document.createElement('div'); root.id = 'caeV33LoginRoot'; document.body.appendChild(root); }
    root.innerHTML = `
      <style>
        html.cae-v33-login-mode, html.cae-v33-login-mode body{height:100%;overflow:hidden!important;}
        body.cae-v33-login-active #appShell, body.cae-v33-login-active #caeV26App, body.cae-v33-login-active .app-shell{display:none!important;}
        #caeV33LoginRoot{position:fixed!important;inset:0!important;z-index:2147483647!important;display:grid!important;place-items:center!important;background:radial-gradient(circle at 25% 10%,rgba(16,185,129,.24),transparent 28%),linear-gradient(135deg,#022c22,#064e3b 50%,#047857)!important;font-family:Inter,Arial,sans-serif!important;pointer-events:auto!important;}
        .v33-card{width:min(470px,calc(100vw - 32px));background:rgba(255,255,255,.97);border-radius:34px;padding:34px;box-shadow:0 35px 110px rgba(0,0,0,.36);border:1px solid rgba(255,255,255,.55);}
        .v33-brand{display:flex;align-items:center;gap:14px;margin-bottom:28px}.v33-mark{width:56px;height:56px;border-radius:18px;background:#064e3b;color:white;display:grid;place-items:center;font-size:29px;font-weight:1000}.v33-brand b{font-size:26px;color:#064e3b}.v33-brand em{font-style:normal;color:#f97316}.v33-brand small{display:block;color:#64748b;font-weight:800;margin-top:2px}
        .v33-card h1{margin:0 0 8px;color:#022c22;font-size:34px;letter-spacing:-1px}.v33-card p{margin:0 0 22px;color:#64748b;font-size:15px;font-weight:600}.v33-form{display:grid;gap:14px}.v33-label{font-size:13px;font-weight:1000;color:#052e25}.v33-field{margin-top:7px;width:100%;min-height:58px;border:1px solid #cbd5e1;border-radius:18px;background:#fff;padding:17px 18px;font-size:17px;font-weight:900;color:#0f172a;outline:none;box-sizing:border-box;cursor:text;white-space:nowrap;overflow:hidden;display:flex;align-items:center;}
        .v33-field:focus{border-color:#10b981;box-shadow:0 0 0 5px rgba(16,185,129,.16)}.v33-field[data-placeholder]:empty:before{content:attr(data-placeholder);color:#94a3b8}.v33-pass{-webkit-text-security:disc;text-security:disc;}
        .v33-btn{width:100%;border:0;border-radius:18px;min-height:58px;background:linear-gradient(135deg,#059669,#10b981);color:white;font-size:17px;font-weight:1000;cursor:pointer;margin-top:4px}.v33-btn:hover{filter:brightness(.98);transform:translateY(-1px)}.v33-btn:disabled{opacity:.65;cursor:wait;transform:none}
        .v33-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.v33-mini{border:1px solid #dbe7e2;border-radius:14px;background:#f8fffc;padding:11px;color:#064e3b;font-weight:900;cursor:pointer}.v33-alert{display:${message?'block':'none'};background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;border-radius:15px;padding:12px 14px;margin-bottom:16px;font-weight:900}.v33-error{background:#fef2f2;border-color:#fecaca;color:#991b1b}.v33-note{text-align:center;margin-top:17px;background:#ecfdf5;border-radius:16px;padding:12px;color:#047857;font-weight:1000;font-size:13px}
      </style>
      <div class="v33-card" role="dialog" aria-label="CAF CAE Login">
        <div class="v33-brand"><span class="v33-mark">C</span><div><b>CAF CAE <em>Pro</em></b><small>Servizi. Persone. Risultati.</small></div></div>
        <h1>Accesso operativo</h1><p>Login stabile senza popup Chrome: scrivi nei campi e premi Invio.</p>
        <div id="v33Message" class="v33-alert ${message && /errore|non|fall|password|controlla/i.test(message)?'v33-error':''}">${esc(message)}</div>
        <form id="v33LoginForm" class="v33-form" autocomplete="off" novalidate>
          <label class="v33-label">Email o username<div id="v33User" class="v33-field" contenteditable="true" spellcheck="false" data-placeholder="admin oppure italy@cafcae.it"></div></label>
          <label class="v33-label">Password<div id="v33Pass" class="v33-field v33-pass" contenteditable="true" spellcheck="false" data-placeholder="Scrivi la password"></div></label>
          <button id="v33LoginBtn" class="v33-btn" type="submit">Accedi alla dashboard</button>
        </form>
        <div class="v33-actions"><button class="v33-mini" type="button" data-fill="admin">Admin</button><button class="v33-mini" type="button" data-fill="italy@cafcae.it">Team Italy</button></div>
        <div class="v33-note">UI v33 · nessun campo input normale · Chrome Password Manager non può coprire il pannello</div>
      </div>`;
    const user = document.getElementById('v33User');
    const pass = document.getElementById('v33Pass');
    const form = document.getElementById('v33LoginForm');
    const btn = document.getElementById('v33LoginBtn');
    root.querySelectorAll('[contenteditable]').forEach(el => {
      el.addEventListener('keydown', ev => {
        if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); form.requestSubmit ? form.requestSubmit() : btn.click(); }
      });
      el.addEventListener('paste', ev => {
        ev.preventDefault(); const text=(ev.clipboardData||window.clipboardData).getData('text'); document.execCommand('insertText', false, text);
      });
    });
    root.querySelectorAll('[data-fill]').forEach(b => b.onclick = () => { user.textContent = b.dataset.fill || ''; focusEnd(pass); });
    form.onsubmit = async ev => {
      ev.preventDefault(); ev.stopPropagation();
      const username = fieldText('v33User'); const password = fieldText('v33Pass');
      const msg = document.getElementById('v33Message');
      if(!username || !password){ msg.className='v33-alert v33-error'; msg.style.display='block'; msg.textContent='Scrivi username/email e password.'; return; }
      btn.disabled = true; btn.textContent = 'Accesso in corso...';
      try { await login(username, password); unhideApp(); location.reload(); }
      catch(e){ msg.className='v33-alert v33-error'; msg.style.display='block'; msg.textContent=e.message || 'Login non riuscito.'; btn.disabled=false; btn.textContent='Accedi alla dashboard'; focusEnd(user); }
    };
    setTimeout(()=>focusEnd(user),80);
  }

  function needLogin(){ return !token() || !session(); }
  function boot(){ if(needLogin()) renderLogin(); }
  window.CAF_CAE_V33_LOGIN = renderLogin;
  window.CAF_CAE_V33_LOGOUT = function(){ clearAuth(); renderLogin('Logout completato. Accedi di nuovo.'); };
  window.CAF_CAE_V33_AUTH_OK = () => !needLogin();
  document.addEventListener('DOMContentLoaded', boot, true);
  window.addEventListener('load', boot, true);
  setTimeout(boot, 250);
  setTimeout(boot, 900);
  document.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest && ev.target.closest('[data-logout],#btnLogout,.v27-logout,.v26-btn.light.v27-logout');
    if(t){ ev.preventDefault(); ev.stopImmediatePropagation(); window.CAF_CAE_V33_LOGOUT(); }
  }, true);
})();
