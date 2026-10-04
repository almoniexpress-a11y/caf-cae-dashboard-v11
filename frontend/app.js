(() => {
  const CONFIG = window.CAF_CAE_CONFIG || {};
  const CATALOG = window.CAF_CAE_SERVICE_CATALOG || { agentServiceGroups: [], serviceForms: {}, checklists: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));
  const today = () => new Date().toISOString().slice(0, 10);
  const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const toNum = v => Number(String(v || 0).replace(',', '.')) || 0;

  const STATE = {
    session: null,
    selectedService: null,
    signatureDataUrl: '',
    chartRefs: {},
    users: [
      { id: 'u-admin', username: 'admin', role: 'admin', name: 'Imran Mollah', email: 'almoniexpress@gmail.com', phone: '+39 353 375 5988', office: 'Ufficio Admin', credit: 0, salary: 0, active: true },
      { id: 'u-agent', username: 'agent', role: 'agent', name: 'Usman Ali', email: 'agent@cafcae.it', phone: '+39 353 111 222', office: 'Agente Prato', credit: 250, salary: 0, active: true },
      { id: 'u-comm', username: 'commercialista', role: 'commercialista', name: 'Studio Commercialista', email: 'commercialista@cafcae.it', phone: '+39 353 222 333', office: 'Area Commercialista', credit: 0, salary: 0, active: true },
      { id: 'u-bangla', username: 'bangla', role: 'bangla', name: 'Team Bangla', email: 'bangla@cafcae.it', phone: '+39 353 333 444', office: 'Team Bangla', credit: 0, salary: 1450, active: true },
      { id: 'u-italy', username: 'italy', role: 'italy', name: 'Team Italy', email: 'italy@cafcae.it', phone: '+39 353 444 555', office: 'Team Italy', credit: 0, salary: 1850, active: true }
    ],
    pratiche: [],
    wallet: [],
    creditRequests: [],
    companies: [],
    invoices: [],
    communications: [],
    tickets: [],
    researchLinks: [],
    dailyReports: [],
    notices: [],
    receipts: [],
    teamActions: [],
    banglaSignatureDataUrl: "",
    signature730DataUrl: "",
    agentClients: [],
    modifyRequests: [],
    editingPraticaId: null,
    productPrices: {},
    servicePermissions: {},
    promotions: [],
    popups: [],
    complaints: [],
    salaryPayments: [],
    commissionPayments: [],
    adminSales: [],
    portalSettings: {
      headerTheme: 'cgn-blue',
      teamHeaderText: 'CAF CAE operativo',
      agentBannerText: 'Portale agente CAF CAE',
      globalPopupActive: false,
      globalPopupTitle: '',
      globalPopupMessage: ''
    },
    dashboardStructures: {}
  };


  function sanitizeUsers() {
    STATE.users = (STATE.users || []).map(u => {
      const { password, password_hash, reset_token, ...safeUser } = u || {};
      return safeUser;
    });
  }

  async function loadUsersFromBackend() {
    if (!window.CAF_CAE_API?.enabled?.() || STATE.session?.role !== 'admin') return;
    try {
      const data = await window.CAF_CAE_API.listUsers();
      if (data?.ok && Array.isArray(data.users)) {
        STATE.users = data.users.map(u => {
          const { password, password_hash, ...safeUser } = u;
          return safeUser;
        });
      }
    } catch (err) {
      console.warn('User list not loaded', err);
    }
  }

  function seed() {
    // v13 clean base: no demo pratiche, no demo companies, no demo tickets.
    // The dashboard starts empty and only shows real work created after login.
    const saved = localStorage.getItem('caf_cae_v13_state') || localStorage.getItem('caf_cae_v12_state') || localStorage.getItem('caf_cae_v11_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(STATE, parsed);
        STATE.signatureDataUrl = '';
        STATE.signature730DataUrl = '';
        STATE.banglaSignatureDataUrl = '';
        sanitizeUsers();
        return;
      } catch (_) {}
    }

    STATE.pratiche = [];
    STATE.wallet = [];
    STATE.creditRequests = [];
    STATE.companies = [];
    STATE.invoices = [];
    STATE.communications = [];
    STATE.tickets = [];
    STATE.agentClients = [];
    STATE.modifyRequests = [];
    STATE.dailyReports = [];
    STATE.receipts = [];
    STATE.teamActions = [];
    STATE.researchLinks = CATALOG.sourceLinks || [];
    STATE.productPrices = {};
    STATE.servicePermissions = {};
    STATE.promotions = [];
    STATE.popups = [];
    STATE.complaints = [];
    STATE.salaryPayments = [];
    STATE.commissionPayments = [];
    STATE.adminSales = [];
    STATE.portalSettings = STATE.portalSettings || {};
    STATE.dashboardStructures = {};
    sanitizeUsers();
    saveState();
  }

  function ensureState() {
    STATE.notices ||= [];
    STATE.receipts ||= [];
    STATE.teamActions ||= [];
    STATE.agentClients ||= [];
    STATE.modifyRequests ||= [];
    STATE.tickets ||= [];
    STATE.researchLinks ||= [];
    STATE.dailyReports ||= [];
    STATE.wallet ||= [];
    STATE.creditRequests ||= [];
    STATE.pratiche ||= [];
    STATE.companies ||= [];
    STATE.invoices ||= [];
    STATE.communications ||= [];
    STATE.productPrices ||= {};
    STATE.servicePermissions ||= {};
    STATE.promotions ||= [];
    STATE.popups ||= [];
    STATE.complaints ||= [];
    STATE.salaryPayments ||= [];
    STATE.commissionPayments ||= [];
    STATE.adminSales ||= [];
    STATE.dashboardStructures ||= {};
    STATE.appointments ||= [];
    STATE.portalSettings ||= {};
    STATE.portalSettings.headerTheme ||= 'cgn-blue';
    STATE.portalSettings.teamHeaderText ||= 'CAF CAE operativo';
    STATE.portalSettings.agentBannerText ||= 'Portale agente CAF CAE';
    STATE.portalSettings.globalPopupActive ||= false;
    STATE.users.forEach(u => { u.serviceAccess ||= []; u.blockStatus ||= (u.active === false ? 'Blocked' : 'Active'); });
    if (!STATE.notices.length) {
      STATE.notices = [
        { id:'n1', targetRole:'agent', level:'urgent', title:'730: controlla delega e CU', message:'Prima di inviare a Team Bangla verifica firma, CU, documento identità e privacy.', deadline:'2026-07-01', createdAt: today() },
        { id:'n2', targetRole:'agent', level:'info', title:'ISEE / DSU: giacenza media obbligatoria', message:'Per ISEE servono saldo e giacenza di tutti i componenti del nucleo.', deadline:'2026-07-05', createdAt: today() },
        { id:'n3', targetRole:'bangla', level:'urgent', title:'Controllo documenti entro 24h', message:'Le pratiche nuove da agenti devono essere controllate e inviate a Italy se complete.', deadline:'2026-07-01', createdAt: today() },
        { id:'n4', targetRole:'italy', level:'info', title:'Caricare ricevuta finale', message:'Quando completi la pratica, inserisci sempre link ricevuta o nota invio.', deadline:'2026-07-10', createdAt: today() }
      ];
    }
    STATE.pratiche.forEach(p => {
      p.generatedDocs ||= [];
      p.uploads ||= [];
      p.missingDocs ||= [];
      p.checkedDocs ||= [];
      p.serviceData ||= {};
      p.deadline ||= p.createdAt || today();
      p.teamHistory ||= [];
    });
  }

  function saveState() {
    sanitizeUsers();
    const copy = { ...STATE, session: null, signatureDataUrl: '', signature730DataUrl: '', banglaSignatureDataUrl: '', chartRefs: {} };
    localStorage.setItem('caf_cae_v13_state', JSON.stringify(copy));
    localStorage.setItem('caf_cae_v12_state', JSON.stringify(copy));
    if (window.CAF_CAE_API?.enabled?.() && STATE.session) {
      window.CAF_CAE_API.pushSnapshot(STATE, STATE.session).catch(() => showToast('Offline backend: salvato localmente.', 'warning'));

      // v15 sync hotfix: all operational work (orders/pratiche, clients, reports, tickets, sales)
      // must be saved in one shared snapshot, otherwise an order created by Agent remains visible
      // only inside the Agent account and Team/Admin cannot see it.
      window.CAF_CAE_API.pushSnapshot(sharedOpsState(), {
        role: 'ops',
        email: 'all',
        name: STATE.session.name || STATE.session.email || 'CAF CAE'
      }).catch(() => {});

      if (STATE.session.role === 'admin') {
        window.CAF_CAE_API.pushSnapshot(sharedAdminState(), { role: 'all', email: 'all', name: STATE.session.name || 'Admin' }).catch(() => {});
      }
    }
  }


  function sharedAdminState() {
    return {
      productPrices: STATE.productPrices || {},
      servicePermissions: STATE.servicePermissions || {},
      promotions: STATE.promotions || [],
      popups: STATE.popups || [],
      portalSettings: STATE.portalSettings || {},
      dashboardStructures: STATE.dashboardStructures || {},
      notices: STATE.notices || [],
      researchLinks: STATE.researchLinks || [],
      updatedAt: today()
    };
  }

  function mergeSharedAdminState(shared = {}) {
    ['productPrices','servicePermissions','promotions','popups','portalSettings','dashboardStructures','notices','researchLinks'].forEach(k => {
      if (shared[k] !== undefined) STATE[k] = shared[k];
    });
  }

  function sharedOpsState() {
    return {
      pratiche: STATE.pratiche || [],
      clients: STATE.clients || [],
      companies: STATE.companies || [],
      invoices: STATE.invoices || [],
      communications: STATE.communications || [],
      tickets: STATE.tickets || [],
      dailyReports: STATE.dailyReports || [],
      wallet: STATE.wallet || [],
      creditRequests: STATE.creditRequests || [],
      modifyRequests: STATE.modifyRequests || [],
      complaints: STATE.complaints || [],
      adminSales: STATE.adminSales || [],
      salaryPayments: STATE.salaryPayments || [],
      commissionPayments: STATE.commissionPayments || [],
      updatedAt: today()
    };
  }

  function mergeRecordArrays(local = [], incoming = []) {
    const out = [];
    const seen = new Set();
    [...(incoming || []), ...(local || [])].forEach(item => {
      if (!item || typeof item !== 'object') return;
      const key = item.id || item.code || `${item.email || ''}-${item.username || ''}-${item.createdAt || ''}-${item.date || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
    return out;
  }

  function mergeOpsState(shared = {}) {
    ['pratiche','clients','companies','invoices','communications','tickets','dailyReports','wallet','creditRequests','modifyRequests','complaints','adminSales','salaryPayments','commissionPayments'].forEach(k => {
      if (Array.isArray(shared[k])) STATE[k] = mergeRecordArrays(STATE[k], shared[k]);
    });
    normalizePratiche();
  }

  async function pullOpsState() {
    if (!window.CAF_CAE_API?.enabled?.() || !STATE.session) return;
    try {
      const ops = await window.CAF_CAE_API.get('/api/live/state?role=ops&email=all');
      if (ops?.ok && ops.state) mergeOpsState(ops.state);
    } catch (_) {}
  }

  async function pullSharedAdminState() {
    if (!window.CAF_CAE_API?.enabled?.() || !STATE.session) return;
    try {
      const shared = await window.CAF_CAE_API.get('/api/live/state?role=all&email=all');
      if (shared?.ok && shared.state) mergeSharedAdminState(shared.state);
    } catch (_) {}
  }

  async function pullBackendState(reason = 'sync') {
    if (!window.CAF_CAE_API?.enabled?.() || !STATE.session) return;
    try {
      const remote = await window.CAF_CAE_API.loadSnapshot(STATE.session);
      if (remote?.ok && remote.state) {
        const currentSession = STATE.session;
        Object.assign(STATE, remote.state);
        STATE.session = currentSession;
        sanitizeUsers();
        STATE.signatureDataUrl = '';
        STATE.signature730DataUrl = '';
        STATE.banglaSignatureDataUrl = '';
        normalizePratiche();
        await pullOpsState();
        await pullSharedAdminState();
        localStorage.setItem('caf_cae_v12_state', JSON.stringify({ ...STATE, session: null, chartRefs: {} }));
        setTimeout(() => { renderAll(); showToast(reason === 'login' ? 'Dati live caricati dal backend.' : 'Dashboard aggiornata in tempo reale.'); }, 80);
      }
    } catch (_) {
      showToast('Backend non raggiungibile: modalità locale attiva.', 'warning');
    }
  }

  function showToast(msg, tone = 'success') {
    const el = $('#toast');
    el.className = `toast ${tone}`;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  async function login(username, password) {
    if (!window.CAF_CAE_API?.enabled?.()) {
      showToast('Backend sicuro non configurato. Imposta API_URL in config.js.', 'error');
      return null;
    }
    try {
      const data = await window.CAF_CAE_API.login(username, password);
      if (!data?.ok || !data.user) return null;
      const u = { ...data.user, username: data.user.username || username, active: true };
      STATE.session = { ...u };
      localStorage.setItem('caf_cae_v12_session', JSON.stringify({ id: u.id, email: u.email, role: u.role }));
      localStorage.removeItem('caf_cae_v11_session');
      localStorage.removeItem('caf_cae_v8_session');
      await loadUsersFromBackend();
      return u;
    } catch (err) {
      console.warn('secure login failed', err);
      return null;
    }
  }

  async function restoreSession() {
    if (!window.CAF_CAE_API?.enabled?.()) return;
    try {
      const data = await window.CAF_CAE_API.me();
      if (data?.ok && data.user) {
        STATE.session = { ...data.user, active: true };
        await loadUsersFromBackend();
      }
    } catch (_) {
      localStorage.removeItem('caf_cae_v12_session');
      localStorage.removeItem('caf_cae_v11_session');
      localStorage.removeItem('caf_cae_v8_session');
    }
  }

  async function handleResetTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (!token || !window.CAF_CAE_API?.enabled?.()) return;
    const password = prompt('Imposta nuova password CAF CAE (minimo 8 caratteri):');
    if (!password) return;
    try {
      await window.CAF_CAE_API.resetPassword(token, password);
      params.delete('reset_token');
      history.replaceState({}, document.title, window.location.pathname + (params.toString() ? `?${params}` : ''));
      showToast('Password aggiornata. Ora fai login con la nuova password.', 'success');
    } catch (err) {
      showToast(err.message || 'Reset password non valido o scaduto.', 'error');
    }
  }

  function setRoleDashboard() {
    if (!STATE.session) return;
    $('#loginOverlay').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
    $('#sessionName').textContent = STATE.session.name;
    $('#sessionRole').textContent = STATE.session.office || STATE.session.role;
    $$('.role-dashboard').forEach(x => x.classList.add('hidden'));
    const map = { agent: 'dashboard-agent', commercialista: 'dashboard-commercialista', bangla: 'dashboard-bangla', italy: 'dashboard-italy', admin: 'dashboard-admin' };
    const id = map[STATE.session.role] || 'dashboard-admin';
    $(`#${id}`).classList.remove('hidden');
    $('#topBreadcrumb').textContent = `Home › ${STATE.session.office || STATE.session.role}`;
    renderAll();
  }

  function serviceByKey(key) {
    for (const g of CATALOG.agentServiceGroups) {
      const found = g.services.find(s => s.key === key || s.title === key);
      if (found) return applyServiceOverride({ ...found, group: g.group, groupIcon: g.icon });
    }
    return null;
  }

  function serviceByTitle(title) {
    for (const g of CATALOG.agentServiceGroups) {
      const found = g.services.find(s => s.title === title);
      if (found) return applyServiceOverride({ ...found, group: g.group, groupIcon: g.icon });
    }
    return null;
  }

  function allServicesFlat() {
    return (CATALOG.agentServiceGroups || []).flatMap(g => (g.services || []).map(s => applyServiceOverride({ ...s, group: g.group, groupIcon: g.icon, groupColor: g.color })));
  }

  function applyServiceOverride(service = {}) {
    const ov = (STATE.productPrices || {})[service.key] || {};
    return {
      ...service,
      cost: ov.cost !== undefined && ov.cost !== '' ? Number(ov.cost) : Number(service.cost || 0),
      commission: ov.commission !== undefined && ov.commission !== '' ? Number(ov.commission) : Number(service.commission || 0),
      enabled: ov.enabled === undefined ? true : ov.enabled !== false,
      adminNote: ov.note || ''
    };
  }

  function userRecord(email = STATE.session?.email) {
    return (STATE.users || []).find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase() || u.id === STATE.session?.id) || STATE.session || {};
  }

  function agentAllowedKeys(user = userRecord()) {
    const byEmail = STATE.servicePermissions?.[user.email] || STATE.servicePermissions?.[user.id] || user.serviceAccess || [];
    return Array.isArray(byEmail) ? byEmail : [];
  }

  function canUseService(serviceKey, user = userRecord()) {
    if (!user || user.role !== 'agent') return true;
    const allowed = agentAllowedKeys(user);
    return !allowed.length || allowed.includes(serviceKey);
  }


  function agentCredit(email = STATE.session?.email) {
    const tx = STATE.wallet.filter(w => w.agentEmail === email);
    return tx.reduce((sum, t) => sum + (t.type === 'plus' ? Number(t.amount) : -Number(t.amount)), 0);
  }

  function addWallet(agentEmail, type, amount, reason) {
    STATE.wallet.unshift({ id: `w-${Date.now()}`, agentEmail, type, amount: Number(amount), reason, date: today() });
    saveState();
  }

  function agentPratiche() { return STATE.pratiche.filter(p => p.agentEmail === STATE.session.email); }
  function banglaPratiche() { return STATE.pratiche.filter(p => p.assignedTeam === 'bangla' || p.routeTeam === 'bangla'); }
  function italyPratiche() { return STATE.pratiche.filter(p => p.assignedTeam === 'italy' || p.routeTeam === 'italy'); }

  function renderServiceMenu() {
    const wrap = $('#agentServiceMenu');
    if (!wrap) return;
    const q = ($('#agentServiceSearch')?.value || '').toLowerCase();
    wrap.innerHTML = CATALOG.agentServiceGroups.map(group => {
      const items = group.services.map(s => applyServiceOverride({ ...s, group: group.group, groupIcon: group.icon })).filter(s => s.enabled !== false && canUseService(s.key)).filter(s => !q || `${group.group} ${s.title}`.toLowerCase().includes(q));
      if (!items.length) return '';
      return `<div class="service-group">
        <div class="service-group-title ${group.color}"><i class="fa-solid ${group.icon}"></i>${group.group}</div>
        ${items.map(s => `<button class="service-btn ${STATE.selectedService?.key === s.key ? 'active' : ''}" data-service-key="${s.key}"><span>${s.title}</span><span class="cost-badge">${money(s.cost)}</span></button>`).join('')}
      </div>`;
    }).join('') || `<div class="flat-item"><div><div class="title">Nessun servizio abilitato</div><div class="meta">Admin deve abilitare i servizi per questo agente.</div></div></div>`;
  }

  function renderAgentDashboard() {
    if (!$('#dashboard-agent') || STATE.session?.role !== 'agent') return;
    renderServiceMenu();
    const items = agentPratiche();
    const working = items.filter(p => !['Completata', 'Respinta', 'Annullata'].includes(p.status));
    const missing = items.filter(p => (p.missingDocs || []).length || p.documentStatus === 'Documenti mancanti');
    const pendingCom = items.filter(p => p.commissionStatus !== 'Paid').reduce((s, p) => s + Number(p.commission || 0), 0);
    $('#agentCreditBalance').textContent = money(agentCredit());
    $('#agentSideCredit').textContent = money(agentCredit());
    $('#agentWalletBig').textContent = money(agentCredit());
    $('#agentTotalPratiche').textContent = items.length;
    $('#agentWorkingCount').textContent = working.length;
    $('#agentMissingCount').textContent = missing.length;
    $('#agentCommissionPending').textContent = money(pendingCom);
    $('#submitCreditText').textContent = `Credito disponibile: ${money(agentCredit())}`;
    renderAgentCharts(items);
    renderCreditTimeline();
    renderAgentPratiche();
    renderAgentMissing();
    renderAgentAcademy();
    renderAgentCommission();
    renderAgentClients();
    renderAgentModifyRequests();
    renderAgentProfile();
    populateAgentClientSelect();
    renderAgentNotices();
    if (STATE.selectedService) selectService(STATE.selectedService.key, false);
  }

  function renderAgentCharts(items) {
    const ctx = $('#agentChartStatus');
    if (!ctx || !window.Chart) return;
    const labels = ['Nuova', 'Documenti mancanti', 'In lavorazione', 'In verifica', 'Completata'];
    const values = labels.map(l => items.filter(p => p.status === l).length);
    if (STATE.chartRefs.agentStatus) STATE.chartRefs.agentStatus.destroy();
    STATE.chartRefs.agentStatus = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data: values, backgroundColor: ['#2e78ad', '#ef4444', '#f59e0b', '#6366f1', '#16a34a'] }] }, options: { plugins: { legend: { display: false } }, responsive: true } });
  }

  function renderCreditTimeline() {
    const tx = STATE.wallet.filter(w => w.agentEmail === STATE.session.email);
    const html = tx.slice(0, 8).map(w => `<div class="timeline-item"><span>${w.date}</span><div><b>${w.reason}</b><div class="meta">${w.type === 'plus' ? 'Credito aggiunto' : 'Credito scalato'}</div></div><span class="amount ${w.type}">${w.type === 'plus' ? '+' : '-'}${money(w.amount)}</span></div>`).join('') || `<div class="flat-item"><div><b>Nessun movimento</b><div class="meta">Quando crei pratiche vedrai credito scalato qui.</div></div></div>`;
    $('#agentCreditTimeline').innerHTML = html;
    $('#agentCreditMovements').innerHTML = html;
  }

  function renderAgentPratiche() {
    const q = ($('#agentPraticheSearch')?.value || '').toLowerCase();
    const rows = agentPratiche().filter(p => !q || JSON.stringify(p).toLowerCase().includes(q));
    $('#agentPraticheBody').innerHTML = rows.map(p => `<tr><td><b>${p.code}</b></td><td>${p.client.lastName || ''} ${p.client.firstName || ''}<br><small>${p.client.cf || ''}</small></td><td>${p.serviceTitle}</td><td>${p.assignedTeam || '--'}</td><td>${statusChip(p.status)}</td><td>${statusChip(p.paymentStatus)}</td><td>${money(p.cost)}</td><td>${money(p.commission)}</td><td><button class="btn light" data-detail="${p.id}">Apri</button> <button class="btn orange" data-download-pratica="${p.id}">Doc</button></td></tr>`).join('') || '<tr><td colspan="9">Nessuna pratica</td></tr>';
    $('#agentAlertsList').innerHTML = rows.filter(p => p.teamMessage || (p.missingDocs || []).length).slice(0, 5).map(p => alertItem(p)).join('') || emptyFlat('Nessun avviso', 'Il team non ha richiesto integrazioni.');
  }

  function renderAgentMissing() {
    const missing = agentPratiche().filter(p => (p.missingDocs || []).length || p.status === 'Documenti mancanti');
    $('#agentMissingList').innerHTML = missing.map(p => alertItem(p, true)).join('') || emptyFlat('Nessun documento mancante', 'Tutte le pratiche sembrano complete.');
  }

  function renderAgentAcademy() {
    const list = agentPratiche().filter(p => p.group === 'Academy');
    $('#agentAcademyList').innerHTML = list.map(p => `<div class="flat-item"><div><div class="title">${p.serviceTitle} · ${p.client.lastName || ''} ${p.client.firstName || ''}</div><div class="meta">${p.code} · ${p.status} · ${p.teamMessage || 'Nessun messaggio'}</div></div><button class="btn light" data-detail="${p.id}">Apri</button></div>`).join('') || emptyFlat('Nessun corso/esame', 'Crea un’iscrizione Academy o Esame A2/B1 dal menu laterale.');
  }

  function renderAgentCommission() {
    const list = agentPratiche();
    $('#agentCommissionList').innerHTML = list.map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${p.serviceTitle}</div><div class="meta">Cliente: ${p.client.lastName || ''} ${p.client.firstName || ''} · Stato pratica: ${p.status}</div></div><div><b>${money(p.commission)}</b><br>${statusChip(p.commissionStatus || 'Pending')}</div></div>`).join('') || emptyFlat('Nessuna commissione', 'Quando invii pratiche vedrai le commissioni qui.');
  }


  function upsertAgentClient(client, pratica) {
    if (!client || !client.cf) return;
    STATE.agentClients ||= [];
    const key = client.cf.toUpperCase();
    let row = STATE.agentClients.find(c => (c.cf || '').toUpperCase() === key && c.agentEmail === STATE.session.email);
    if (!row) { row = { id:`cl-${Date.now()}-${Math.random().toString(16).slice(2)}`, agentEmail:STATE.session.email, createdAt:today(), applications:[] }; STATE.agentClients.unshift(row); }
    Object.assign(row, client, { cf:key, agentName:STATE.session.name, updatedAt:today() });
    if (pratica && !row.applications.includes(pratica.code)) row.applications.unshift(pratica.code);
  }
  function rebuildAgentClientsFromPratiche() { STATE.agentClients ||= []; agentPratiche().forEach(p => upsertAgentClient(p.client || {}, p)); }
  function populateAgentClientSelect() { const sel=$('#agentExistingClient'); if(!sel) return; rebuildAgentClientsFromPratiche(); const cur=sel.value; const rows=(STATE.agentClients||[]).filter(c=>c.agentEmail===STATE.session.email); sel.innerHTML='<option value="">Nuovo cliente</option>'+rows.map(c=>`<option value="${safe(c.cf)}">${safe(c.lastName||'')} ${safe(c.firstName||'')} · ${safe(c.cf||'')}</option>`).join(''); sel.value=cur; }
  function fillAgentClientFromSelect() { const cf=$('#agentExistingClient')?.value; if(!cf) return; const c=(STATE.agentClients||[]).find(x=>x.cf===cf&&x.agentEmail===STATE.session.email); if(!c) return; const map={clientCF:'cf',clientLastName:'lastName',clientFirstName:'firstName',clientSex:'sex',clientDob:'dob',clientBirthPlace:'birthPlace',clientBirthProvince:'birthProvince',clientNationality:'nationality',clientMarital:'marital',clientCity:'city',clientProvince:'province',clientCap:'cap',clientStreetType:'streetType',clientAddress:'address',clientStreetNo:'streetNo',clientPhone:'phone',clientEmail:'email',clientIban:'iban'}; Object.entries(map).forEach(([id,k])=>{const el=$('#'+id); if(el&&c[k]!==undefined) el.value=c[k];}); updateLivePreview(); }
  function renderAgentClients() { const wrap=$('#agentClientList'); if(!wrap||STATE.session?.role!=='agent') return; rebuildAgentClientsFromPratiche(); const q=($('#agentClientSearch')?.value||'').toLowerCase(); const clients=(STATE.agentClients||[]).filter(c=>c.agentEmail===STATE.session.email).filter(c=>!q||JSON.stringify(c).toLowerCase().includes(q)); wrap.innerHTML=clients.map(c=>{const apps=agentPratiche().filter(p=>(p.client?.cf||'').toUpperCase()===(c.cf||'').toUpperCase()); return `<div class="client-card"><h4>${safe(c.lastName||'')} ${safe(c.firstName||'')}</h4><div class="meta"><b>CF:</b> ${safe(c.cf||'--')}<br><b>Telefono:</b> ${safe(c.phone||'--')}<br><b>Email:</b> ${safe(c.email||'--')}<br><b>Indirizzo:</b> ${safe([c.streetType,c.address,c.streetNo,c.city].filter(Boolean).join(' ')||'--')}</div><div class="mini-apps">${apps.map(p=>`<span>${safe(p.serviceTitle)} · ${safe(p.status)}</span>`).join('')||'<span>Nessuna domanda</span>'}</div><div class="doc-actions"><button class="btn light" data-fill-client="${safe(c.cf)}">Usa cliente</button>${apps[0]?`<button class="btn orange" data-detail="${apps[0].id}">Ultima pratica</button>`:''}</div></div>`}).join('')||emptyFlat('Nessun cliente salvato','Quando crei una domanda, il cliente viene salvato automaticamente.'); }
  function renderAgentModifyRequests() { const wrap=$('#agentModifyRequests'); if(!wrap) return; STATE.modifyRequests ||= []; const rows=STATE.modifyRequests.filter(r=>r.agentEmail===STATE.session.email); wrap.innerHTML=rows.map(r=>`<div class="flat-item ${r.status==='Approved'?'agent-approved':'agent-permission'}"><div><div class="title">${safe(r.praticaCode)} · ${safe(r.status)}</div><div class="meta">${safe(r.reason)}<br>Data: ${safe(r.date)} · Risposta: ${safe(r.adminNote||'--')}</div></div>${r.status==='Approved'?`<button class="btn green" data-start-modify="${safe(r.praticaId)}">Modifica pratica</button>`:statusChip(r.status)}</div>`).join('')||emptyFlat('Nessuna richiesta modifica','Apri una pratica e clicca Richiedi modifica se devi correggere dati o documenti.'); }
  function renderAgentProfile() { const box=$('#agentProfileBox'); if(!box||STATE.session?.role!=='agent') return; const u=STATE.session; const ps=agentPratiche(); const done=ps.filter(p=>p.status==='Completata').length; const pending=ps.filter(p=>p.status!=='Completata').length; box.innerHTML=`${previewLine('Nome agente',safe(u.name))}${previewLine('Email',safe(u.email))}${previewLine('Telefono',safe(u.phone||'--'))}${previewLine('Sede',safe(u.office||'--'))}${previewLine('Credito disponibile',money(agentCredit()))}${previewLine('Clienti salvati',(STATE.agentClients||[]).filter(c=>c.agentEmail===u.email).length)}${previewLine('Pratiche totali',ps.length)}${previewLine('Completate',done)}${previewLine('In lavorazione',pending)}`; const perf=$('#agentPerformanceBox'); if(perf) perf.innerHTML=`<div class="flat-item"><div><div class="title">Lavoro mese corrente</div><div class="meta">Pratiche create: ${ps.length}<br>Commissioni pending: ${money(ps.reduce((s,p)=>s+(p.commissionStatus==='Paid'?0:Number(p.commission||0)),0))}<br>Documenti mancanti: ${ps.filter(p=>(p.missingDocs||[]).length).length}</div></div></div>`; }

  function renderAgentNotices() {
    const notices = [
      ...(STATE.notices || []).filter(n => !n.targetRole || n.targetRole === 'agent' || n.targetRole === 'all'),
      ...(STATE.promotions || []).filter(n => n.active !== false && (!n.targetRole || n.targetRole === 'agent' || n.targetRole === 'all')).map(n => ({ ...n, level: n.level || 'info', deadline: n.endDate || n.deadline })),
      ...(STATE.popups || []).filter(n => n.active !== false && (!n.targetRole || n.targetRole === 'agent' || n.targetRole === 'all')).map(n => ({ ...n, level: 'urgent', deadline: n.endDate || n.deadline }))
    ];
    const urgentPratiche = agentPratiche().filter(p => p.deadline && daysUntil(p.deadline) <= 7 && !['Completata','Respinta','Annullata'].includes(p.status));
    const readyPratiche = agentPratiche().filter(p => p.documentStatus === 'Documenti ricevuti' || p.status === 'In verifica');
    $('#agentUrgentCount') && ($('#agentUrgentCount').textContent = urgentPratiche.length);
    $('#agentReadyCount') && ($('#agentReadyCount').textContent = readyPratiche.length);
    $('#agentNoticeCount') && ($('#agentNoticeCount').textContent = notices.length);
    const noticeHtml = notices.map(n => `<div class="flat-item notice-${n.level || 'info'}"><div><div class="title">${n.title}</div><div class="meta">${n.message}<br>Scadenza: ${n.deadline || '--'}</div></div><span>${statusChip(n.level === 'urgent' ? 'Urgente' : 'Info')}</span></div>`).join('') || emptyFlat('Nessun notice', 'Admin/team non ha pubblicato avvisi.');
    const deadlineHtml = urgentPratiche.map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${p.serviceTitle}</div><div class="meta">${fullName(p.client)} · ${p.status}<br>Scadenza: ${p.deadline || '--'} · ${daysUntil(p.deadline)} giorni</div></div><button class="btn light" data-detail="${p.id}">Apri</button></div>`).join('') || emptyFlat('Nessuna scadenza urgente', 'Non ci sono pratiche in scadenza entro 7 giorni.');
    ['agentHomeNoticeList','agentNoticeList'].forEach(id => { const el = $('#'+id); if (el) el.innerHTML = noticeHtml; });
    const dl = $('#agentDeadlineList'); if (dl) dl.innerHTML = deadlineHtml;
  }

  function daysUntil(date) {
    if (!date) return 999;
    const a = new Date(today());
    const b = new Date(date);
    return Math.ceil((b - a) / 86400000);
  }

  function statusChip(s) {
    const text = s || 'Nuova';
    const cls = /Completata|Pagato|Approved|Paid/i.test(text) ? 'green' : /mancanti|Respinta|Non/i.test(text) ? 'red' : /In|Pending|attesa/i.test(text) ? 'orange' : '';
    return `<span class="chip ${cls}">${text}</span>`;
  }

  function emptyFlat(title, meta) { return `<div class="flat-item"><div><div class="title">${title}</div><div class="meta">${meta}</div></div></div>`; }
  function alertItem(p, withAction = false) {
    return `<div class="flat-item"><div><div class="title">${p.code} · ${p.serviceTitle}</div><div class="meta">${p.client.lastName || ''} ${p.client.firstName || ''}<br>Team: ${p.teamMessage || '--'}<br>Mancanti: ${(p.missingDocs || []).join(', ') || '--'}</div></div>${withAction ? `<button class="btn orange" data-detail="${p.id}">Completa</button>` : `<button class="btn light" data-detail="${p.id}">Apri</button>`}</div>`;
  }

  function selectService(key, openTab = true) {
    const service = serviceByKey(key);
    if (!service || service.enabled === false || !canUseService(service.key)) return showToast('Servizio non abilitato per questo agente.', 'warning');
    STATE.selectedService = service;
    $('#agentSelectedServiceLabel').textContent = `${service.group} › ${service.title}`;
    $('#agentFormTitle').textContent = `${service.title} - nuova domanda`;
    $('#agentFormSubtitle').textContent = service.description || 'Compila dati cliente, documenti, delega e firma.';
    $('#agentServiceKey').value = service.key;
    $('#agentServiceTitle').value = service.title;
    $('#agentServiceGroup').value = service.group;
    $('#agentServiceCost').textContent = money(service.cost);
    $('#submitCostText').textContent = `Costo pratica: ${money(service.cost)}`;
    $('#agentServiceMenu') && renderServiceMenu();
    renderServiceSpecificForm(service);
    renderDocChecklist(service.title);
    updateLivePreview();
    if (openTab) {
      if (service.special === '730') switchAgentTab('agent-730');
      else switchAgentTab('agent-new');
    }
  }

  function renderServiceSpecificForm(service) {
    const area = $('#serviceSpecificArea');
    const fields = CATALOG.serviceForms[service.special] || CATALOG.serviceForms[service.key] || CATALOG.serviceForms.default || [];
    area.innerHTML = `<div class="form-section blue-title">Dati specifici servizio - ${service.title}</div><div class="form-grid cols-3">${fields.map(f => fieldHtml(f)).join('')}</div>`;
  }

  function fieldHtml(f) {
    if (f.type === 'textarea') return `<label class="form-span">${f.label}<textarea data-service-field="${f.name}" placeholder="${f.placeholder || ''}"></textarea></label>`;
    if (f.type === 'select') return `<label>${f.label}<select data-service-field="${f.name}">${(f.options || []).map(o => `<option>${o}</option>`).join('')}</select></label>`;
    return `<label>${f.label}<input data-service-field="${f.name}" type="${f.type || 'text'}" placeholder="${f.placeholder || ''}" /></label>`;
  }

  function renderDocChecklist(serviceTitle) {
    const list = CATALOG.checklists[serviceTitle] || CATALOG.checklists.default || [];
    $('#docChecklist').innerHTML = list.map(d => `<label class="doc-item"><input type="checkbox" data-doc-name="${d}" /><span><b>${d}</b><br><small>obbligatorio / se applicabile</small></span></label>`).join('');
  }

  function updateLivePreview() {
    const s = STATE.selectedService;
    $('#agentLivePreview').innerHTML = `<h4>${s ? s.title : 'Nessun servizio selezionato'}</h4>
      ${previewLine('Cliente', `${$('#clientLastName')?.value || '--'} ${$('#clientFirstName')?.value || ''}`)}
      ${previewLine('Codice fiscale', $('#clientCF')?.value || '--')}
      ${previewLine('Telefono', $('#clientPhone')?.value || '--')}
      ${previewLine('Email', $('#clientEmail')?.value || '--')}
      ${previewLine('Costo agente', s ? money(s.cost) : money(0))}
      ${previewLine('Credito attuale', money(agentCredit()))}
      ${previewLine('Delega', $('#delegaAccepted')?.checked ? 'Accettata' : 'Non accettata')}
      ${previewLine('Firma', STATE.signatureDataUrl ? 'Firmato' : 'Non firmato')}`;
  }
  function previewLine(a, b) { return `<div class="preview-line"><span>${a}</span><b>${b}</b></div>`; }

  function collectBaseClient() {
    return {
      cf: $('#clientCF').value.trim().toUpperCase(), lastName: $('#clientLastName').value.trim(), firstName: $('#clientFirstName').value.trim(), sex: $('#clientSex').value,
      dob: $('#clientDob').value, birthPlace: $('#clientBirthPlace').value, birthProvince: $('#clientBirthProvince').value, nationality: $('#clientNationality').value, marital: $('#clientMarital').value,
      city: $('#clientCity').value, province: $('#clientProvince').value, cap: $('#clientCap').value, streetType: $('#clientStreetType').value, address: $('#clientAddress').value, streetNo: $('#clientStreetNo').value,
      phone: $('#clientPhone').value, email: $('#clientEmail').value.toLowerCase(), iban: $('#clientIban').value
    };
  }

  function collectServiceData() {
    const data = {};
    $$('[data-service-field]').forEach(el => data[el.dataset.serviceField] = el.value);
    return data;
  }

  function checkedDocs() { return $$('#docChecklist input:checked').map(i => i.dataset.docName); }
  function allDocs() { return $$('#docChecklist input').map(i => i.dataset.docName); }
  function uploadedFiles(inputId = '#agentDocUpload') { return Array.from($(inputId)?.files || []).map(f => f.name); }

  function submitAgentApplication(e) {
    e.preventDefault();
    const s = STATE.selectedService;
    if (!s) return showToast('Seleziona prima un servizio dal menu laterale.', 'warning');
    if (!$('#delegaAccepted').checked || !$('#privacyAccepted').checked) return showToast('Serve accettazione delega e privacy.', 'warning');
    if (!STATE.signatureDataUrl) return showToast('Serve firma cliente sul pad.', 'warning');
    const balance = agentCredit();
    if (balance < s.cost) return showToast(`Credito insufficiente. Hai ${money(balance)}, servizio costa ${money(s.cost)}. Richiedi credito ad admin.`, 'error');
    const client = collectBaseClient();
    if (!client.cf || !client.lastName || !client.firstName) return showToast('Compila almeno CF, cognome e nome cliente.', 'warning');
    const docsOk = checkedDocs();
    const missing = allDocs().filter(d => !docsOk.includes(d));
    const code = makeCode(s.group, s.key);
    const pratica = {
      id: `p-${Date.now()}`, code, source: 'agent', group: s.group, serviceKey: s.key, serviceTitle: s.title, client,
      agentEmail: STATE.session.email, agentName: STATE.session.name, routeTeam: 'bangla', assignedTeam: 'bangla', status: missing.length ? 'Documenti mancanti' : 'Nuova',
      paymentStatus: 'In attesa pagamento', documentStatus: missing.length ? 'Documenti mancanti' : 'Documenti ricevuti', cost: s.cost, commission: s.commission, commissionStatus: 'Pending',
      missingDocs: missing, checkedDocs: docsOk, uploads: uploadedFiles(), teamMessage: missing.length ? `Mancano: ${missing.join(', ')}` : 'Pratica ricevuta da Agent. In controllo Bangla.',
      serviceData: collectServiceData(), delega: true, privacy: true, signature: true, signatureDataUrl: STATE.signatureDataUrl, generatedDocs: ['delega', 'ricevuta'], createdAt: today(), updatedAt: today()
    };
    STATE.pratiche.unshift(pratica);
    addWallet(STATE.session.email, 'minus', s.cost, `Creazione ${s.title} ${code}`);
    saveState();
    e.target.reset();
    STATE.signatureDataUrl = '';
    $('#signatureState').textContent = 'Non firmato';
    clearSignatureCanvas();
    renderAll();
    switchAgentTab('agent-pratiche');
    showToast(`Domanda ${code} inviata a Team Bangla. Credito scalato ${money(s.cost)}.`);
  }

  function makeCode(group, key) {
    const prefix = group === 'Patronato' ? 'PAT' : group === 'Immigrazione' ? 'IMM' : group === 'Azienda' ? 'AZI' : group === 'Academy' ? 'ACC' : 'CAF';
    const num = String(STATE.pratiche.length + 1).padStart(4, '0');
    return `${prefix}-${slug(key).toUpperCase()}-2026-${num}`;
  }

  function switchAgentTab(id) {
    $$('.agent-tab').forEach(t => t.classList.remove('active'));
    $(`#${id}`)?.classList.add('active');
    $('#topBreadcrumb').textContent = `Home › Agent › ${id.replace('agent-', '')}`;
  }

  function build730() {
    const client = {
      cf: $('#t730_cf').value.trim().toUpperCase(), lastName: $('#t730_last').value.trim(), firstName: $('#t730_first').value.trim(), sex: $('#t730_sex').value,
      dob: $('#t730_dob').value, birthPlace: $('#t730_birth').value, birthProvince: $('#t730_birthProv').value, marital: $('#t730_marital').value,
      city: $('#t730_city').value, province: $('#t730_prov').value, cap: $('#t730_cap').value, cityCode: $('#t730_cityCode').value, streetType: $('#t730_streetType').value, address: $('#t730_address').value, streetNo: $('#t730_no').value,
      phone: $('#t730_phone').value, email: $('#t730_email').value, dom2025: $('#t730_dom2025')?.value || '', dom2026: $('#t730_dom2026')?.value || '', integrativo: $('#t730_integrativo')?.value || 'No', congiunta: $('#t730_congiunta')?.value || 'No', primaVolta: $('#t730_first_decl')?.value || 'No'
    };
    const cu = $$('.cu-card').map(card => ({
      type: $('.cu-type', card).value, income: toNum($('.cu-income', card).value), days: toNum($('.cu-days', card).value), withheld: toNum($('.cu-withheld', card).value), regional: toNum($('.cu-regional', card).value), communal: toNum($('.cu-communal', card).value), trattamento: toNum($('.cu-trattamento', card).value)
    }));
    const expenses = { medical: toNum($('#t730_medical').value), mortgage: toNum($('#t730_mortgage').value), rent: toNum($('#t730_rent').value), school: toNum($('#t730_school').value), insurance: toNum($('#t730_insurance').value), contrib: toNum($('#t730_contrib').value), child: toNum($('#t730_child')?.value), otherFun: toNum($('#t730_otherFun')?.value), bonusCasa: toNum($('#t730_bonusCasa')?.value), energy: toNum($('#t730_energy')?.value), other19: toNum($('#t730_other19').value), note: $('#t730_expenseNote')?.value || '' };
    const credits = { acconti: toNum($('#t730_acconti').value), eccedenza: toNum($('#t730_eccedenza').value), rate: toNum($('#t730_rate').value) || 1, compensare: toNum($('#t730_compensare').value), noAcconto: $('#t730_no_acconto')?.value || 'No', f24note: $('#t730_f24note').value };
    return { client, cu, expenses, credits, noSub: $('#t730_noSub').value, sostituto: { cf: $('#t730_subCF').value, name: $('#t730_subName').value }, delega: $('#t730_delega').checked, privacy: $('#t730_privacy').checked, uploads: uploadedFiles('#t730_files') };
  }

  function calc730(data = build730()) {
    const income = data.cu.reduce((s, r) => s + r.income, 0);
    const withheld = data.cu.reduce((s, r) => s + r.withheld + r.regional + r.communal, 0);
    const treatment = data.cu.reduce((s, r) => s + r.trattamento, 0);
    const gross = progressiveTax(income);
    const workDeduction = calcWorkDeduction(income);
    const medicalDed = Math.max(0, data.expenses.medical - 129.11) * 0.19;
    const otherDed = (data.expenses.mortgage + data.expenses.rent + data.expenses.school + data.expenses.insurance + data.expenses.child + data.expenses.otherFun + data.expenses.other19) * 0.19 + (data.expenses.bonusCasa * 0.50 / 10) + (data.expenses.energy * 0.65 / 10);
    const contribDed = Math.min(data.expenses.contrib, income) * 0.23;
    const totalDet = workDeduction + medicalDed + otherDed + contribDed;
    const netTax = Math.max(0, gross - totalDet);
    const difference = netTax - withheld - data.credits.acconti - data.credits.eccedenza + treatment;
    const type = difference > 0 ? 'Debito' : 'Credito';
    const total = Math.abs(Math.round(difference));
    const november = (type === 'Debito' && data.credits.noAcconto !== 'Sì') ? Math.round(Math.min(total * 0.2, Math.max(0, income * 0.0105))) : 0;
    const june = type === 'Debito' ? Math.max(0, total) : total;
    return { type, income: Math.round(income), gross: Math.round(gross), totalDet: Math.round(totalDet), netTax: Math.round(netTax), withheld: Math.round(withheld), treatment: Math.round(treatment), total, june, november, note: 'Stima interna non sostituisce elaborazione ufficiale CAF/Commercialista.' };
  }

  function progressiveTax(income) {
    if (income <= 28000) return income * 0.23;
    if (income <= 50000) return 28000 * 0.23 + (income - 28000) * 0.35;
    return 28000 * 0.23 + 22000 * 0.35 + (income - 50000) * 0.43;
  }

  function calcWorkDeduction(income) {
    if (!income) return 0;
    if (income <= 15000) return 1955;
    if (income <= 28000) return 1910 + 1190 * ((28000 - income) / 13000);
    if (income <= 50000) return 1910 * ((50000 - income) / 22000);
    return 0;
  }

  function render730Result() {
    const r = calc730();
    $('#result730Box').innerHTML = `<div class="liquidation-item"><span>Risultato</span><strong>${r.type}</strong></div><div class="liquidation-item"><span>Totale</span><strong>${money(r.total)}</strong></div><div class="liquidation-item"><span>Saldo / giugno</span><strong>${money(r.june)}</strong></div><div class="liquidation-item"><span>Novembre</span><strong>${money(r.november)}</strong></div><div class="liquidation-message"><b>Riepilogo interno:</b> reddito ${money(r.income)}, imposta lorda ${money(r.gross)}, detrazioni ${money(r.totalDet)}, ritenute ${money(r.withheld)}. ${r.note}</div>`;
    return r;
  }

  function submit730Pratica() {
    const s = serviceByKey('730');
    const data = build730();
    if (!data.client.cf || !data.client.lastName || !data.client.firstName) return showToast('Compila frontespizio 730: CF, cognome, nome.', 'warning');
    if (!data.delega || !data.privacy) return showToast('Serve delega e privacy per 730.', 'warning');
    if (agentCredit() < s.cost) return showToast('Credito agente insufficiente per creare 730.', 'error');
    const result = render730Result();
    const code = makeCode('CAF', '730');
    const pratica = { id: `p-${Date.now()}`, code, source: 'agent', group: 'CAF', serviceKey: '730', serviceTitle: 'Modello 730', client: data.client, agentEmail: STATE.session.email, agentName: STATE.session.name, routeTeam: 'bangla', assignedTeam: 'bangla', status: 'Nuova', paymentStatus: 'In attesa pagamento', documentStatus: data.uploads.length ? 'Documenti ricevuti' : 'Documenti mancanti', cost: s.cost, commission: s.commission, commissionStatus: 'Pending', missingDocs: data.uploads.length ? [] : ['CU / CUD', 'Documento identità', 'Delega firmata'], uploads: data.uploads, teamMessage: '730 creato da agente. Primo controllo Team Bangla.', serviceData: data, internal730: result, delega: true, privacy: true, signature: true, generatedDocs: ['delega-730','ricevuta-730','f24-bozza'], signature730DataUrl: STATE.signature730DataUrl || '', deadline: $('#t730_f24_due')?.value || today(), teamHistory: [{ by: STATE.session.name, role:'agent', action:'730 creato e inviato a Bangla', date: today() }], createdAt: today(), updatedAt: today() };
    STATE.pratiche.unshift(pratica);
    addWallet(STATE.session.email, 'minus', s.cost, `Creazione Modello 730 ${code}`);
    saveState();
    renderAll();
    switchAgentTab('agent-pratiche');
    showToast(`730 ${code} creato e inviato a Team Bangla.`);
  }

  function addCuRow(data = {}) {
    const box = document.createElement('div');
    box.className = 'cu-card';
    box.innerHTML = `<div class="form-grid cols-4"><label>Tipo<select class="cu-type"><option>Lavoro dipendente</option><option>Pensione</option><option>Assimilato</option></select></label><label>Reddito CU<input class="cu-income" type="number" step="0.01" value="${data.income || ''}" /></label><label>Giorni<input class="cu-days" type="number" value="${data.days || 365}" /></label><label>Ritenute IRPEF<input class="cu-withheld" type="number" step="0.01" value="${data.withheld || ''}" /></label><label>Add. regionale<input class="cu-regional" type="number" step="0.01" value="${data.regional || ''}" /></label><label>Add. comunale<input class="cu-communal" type="number" step="0.01" value="${data.communal || ''}" /></label><label>Trattamento integrativo<input class="cu-trattamento" type="number" step="0.01" value="${data.trattamento || ''}" /></label><button type="button" class="btn light remove-row">Rimuovi</button></div>`;
    $('#cuRows').appendChild(box);
  }

  function addFamilyRow() {
    const box = document.createElement('div');
    box.className = 'family-card';
    box.innerHTML = `<div class="form-grid cols-4"><label>Relazione<select><option>Coniuge</option><option>Figlio</option><option>Altro familiare</option></select></label><label>Codice fiscale<input /></label><label>Mesi a carico<input type="number" value="12" /></label><label>% carico<input type="number" value="100" /></label><button type="button" class="btn light remove-row">Rimuovi</button></div>`;
    $('#familyRows').appendChild(box);
  }

  function renderCommercialista() {
    if (STATE.session?.role !== 'commercialista') return;
    $('#coType').innerHTML = CATALOG.commercialista.companyTypes.map(x => `<option>${x}</option>`).join('');
    $('#coRegime').innerHTML = CATALOG.commercialista.taxRegimes.map(x => `<option>${x}</option>`).join('');
    $('#invType').innerHTML = CATALOG.commercialista.invoiceTypes.map(x => `<option>${x}</option>`).join('');
    $('#invCompany').innerHTML = STATE.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    $('#commCompaniesCount').textContent = STATE.companies.length;
    $('#commInvoicesCount').textContent = STATE.invoices.length;
    $('#commDeadlineCount').textContent = STATE.companies.filter(c => c.deadline).length;
    $('#commMonthBalance').textContent = money(STATE.invoices.reduce((s, i) => s + Number(i.total || 0), 0));
    $('#commHomeList').innerHTML = STATE.communications.map(c => `<div class="flat-item"><div><div class="title">${c.title}</div><div class="meta">${c.message} · ${c.date}</div></div></div>`).join('') || emptyFlat('Nessuna comunicazione', 'Qui vedrai messaggi di clienti e team.');
    $('#commCompanyTable').innerHTML = table(['Ditta', 'P.IVA', 'ATECO', 'Regime', 'PEC', 'Scadenza'], STATE.companies.map(c => [c.name, c.vat || '--', c.ateco || '--', c.regime || '--', c.pec || '--', c.deadline || '--']));
    $('#commCommsList').innerHTML = STATE.invoices.map(i => `<div class="flat-item"><div><div class="title">${i.type} · ${companyName(i.companyId)}</div><div class="meta">${i.desc} · ${money(i.total)} · ${i.status}<br>${i.message || ''}</div></div></div>`).join('') || emptyFlat('Nessuna fattura', 'Crea una fattura o aggiornamento.');
  }

  function companyName(id) { return STATE.companies.find(c => c.id === id)?.name || '--'; }
  function submitCompany(e) {
    e.preventDefault();
    STATE.companies.unshift({ id: `co-${Date.now()}`, name: $('#coName').value, type: $('#coType').value, vat: $('#coVat').value, cf: $('#coCf').value, ateco: $('#coAteco').value, regime: $('#coRegime').value, pec: $('#coPec').value, sdi: $('#coSdi').value, phone: $('#coPhone').value, email: $('#coEmail').value, address: $('#coAddress').value, city: $('#coCity').value, inps: $('#coInps').value, inail: $('#coInail').value, rea: $('#coRea').value, iban: $('#coIban').value, owner: $('#coOwner').value, deadline: $('#coDeadline').value });
    STATE.communications.unshift({ id: `c-${Date.now()}`, target: 'commercialista', title: 'Nuova ditta aggiunta', message: $('#coName').value, date: today() });
    saveState(); e.target.reset(); renderAll(); showToast('Ditta salvata.');
  }
  function submitInvoice(e) {
    e.preventDefault();
    const net = toNum($('#invNet').value), vat = toNum($('#invVatRate').value);
    const total = +(net + (net * vat / 100)).toFixed(2);
    STATE.invoices.unshift({ id: `inv-${Date.now()}`, companyId: $('#invCompany').value, type: $('#invType').value, client: $('#invClient').value, desc: $('#invDesc').value, net, vatRate: vat, total, due: $('#invDue').value, status: $('#invStatus').value, message: $('#invMessage').value });
    STATE.communications.unshift({ id: `c-${Date.now()}`, target: 'commercialista', title: 'Aggiornamento fattura', message: `${$('#invDesc').value} · ${money(total)}`, date: today() });
    saveState(); e.target.reset(); renderAll(); showToast('Fattura/comunicazione salvata.');
  }

  function renderBangla() {
    if (STATE.session?.role !== 'bangla') return;
    populateBanglaServiceSelect();
    const rows = banglaPratiche();
    $('#banglaNewCount').textContent = rows.filter(p => p.status === 'Nuova').length;
    $('#banglaMissingCount').textContent = rows.filter(p => (p.missingDocs || []).length).length;
    $('#banglaReadyCount').textContent = rows.filter(p => p.documentStatus === 'Documenti ricevuti').length;
    $('#banglaInboxList').innerHTML = rows.slice(0, 8).map(p => teamItem(p, 'bangla')).join('') || emptyFlat('Nessuna pratica', 'Le pratiche agent/shopify/commercialista arriveranno qui.');
    $('#banglaInboxTable').innerHTML = table(['Codice', 'Cliente', 'Servizio', 'Source', 'Stato', 'Docs', 'Azioni'], rows.map(p => [p.code, fullName(p.client), p.serviceTitle, p.source, statusChip(p.status), p.documentStatus, `<button class="btn light" data-detail="${p.id}">Apri</button> <button class="btn orange" data-bangla-missing="${p.id}">Mancanti</button> <button class="btn green" data-send-italy="${p.id}">Italy</button> <button class="btn red" data-cancel-pratica="${p.id}">Annulla</button>`]));
    $('#banglaMissingPanel').innerHTML = rows.map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${fullName(p.client)}</div><div class="meta">Mancanti attuali: ${(p.missingDocs || []).join(', ') || '--'}<br>Messaggio: ${p.teamMessage || '--'}</div></div><div><button class="btn orange" data-bangla-missing="${p.id}">Richiedi docs</button><button class="btn light" data-add-docs="${p.id}">Aggiungi upload</button></div></div>`).join('');
    $('#banglaReadyPanel').innerHTML = rows.filter(p => p.documentStatus === 'Documenti ricevuti' || !(p.missingDocs || []).length).map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${p.serviceTitle}</div><div class="meta">Pronta per Team Italy</div></div><button class="btn green" data-send-italy="${p.id}">Invia a Italy</button></div>`).join('') || emptyFlat('Nessuna pronta', 'Quando i documenti sono ok, invia a Team Italy.');
    updateBanglaPreview();
  }

  function populateBanglaServiceSelect() {
    const el = $('#bnServiceSelect');
    if (!el || el.dataset.ready === '1') return;
    el.innerHTML = CATALOG.agentServiceGroups.map(g => `<optgroup label="${g.group}">${g.services.map(s => `<option value="${s.key}">${s.title} · ${money(s.cost)}</option>`).join('')}</optgroup>`).join('');
    el.dataset.ready = '1';
    renderBanglaDocs();
  }

  function renderBanglaDocs() {
    const service = serviceByKey($('#bnServiceSelect')?.value || '730') || serviceByKey('730');
    const list = CATALOG.checklists[service?.title] || CATALOG.checklists.default || [];
    const box = $('#bnDocChecklist');
    if (box) box.innerHTML = list.map(d => `<label class="doc-item"><input type="checkbox" data-bn-doc="${d}"><span><b>${d}</b><br><small>richiesto / se applicabile</small></span></label>`).join('');
  }

  function checkedBanglaDocs() { return $$('[data-bn-doc]:checked').map(i => i.dataset.bnDoc); }
  function allBanglaDocs() { return $$('[data-bn-doc]').map(i => i.dataset.bnDoc); }
  function banglaUploadedFiles() { return uploadedFiles('#bnDocUpload'); }

  function updateBanglaPreview() {
    const service = serviceByKey($('#bnServiceSelect')?.value || '730');
    const el = $('#banglaOrderPreview');
    if (!el) return;
    el.innerHTML = `<h4>${service?.title || 'Ordine manuale'}</h4>${previewLine('Cliente', `${$('#bnLastName')?.value || '--'} ${$('#bnFirstName')?.value || ''}`)}${previewLine('CF', $('#bnCf')?.value || '--')}${previewLine('Source', $('#bnSource')?.value || '--')}${previewLine('Order Shopify', $('#bnShopifyOrder')?.value || '--')}${previewLine('Importo', money($('#bnAmount')?.value || service?.cost || 0))}${previewLine('Delega', $('#bnDelega')?.checked ? 'Ricevuta' : 'Mancante')}${previewLine('Upload', banglaUploadedFiles().join(', ') || '--')}`;
  }

  function teamItem(p, role) { return `<div class="flat-item"><div><div class="title">${p.code} · ${fullName(p.client)}</div><div class="meta">${p.serviceTitle} · ${p.status}<br>${p.teamMessage || ''}</div></div><button class="btn light" data-detail="${p.id}">Apri</button></div>`; }
  function fullName(c = {}) { return `${c.lastName || ''} ${c.firstName || ''}`.trim() || c.name || '--'; }

  function submitBanglaOrder(e) {
    e.preventDefault();
    const service = serviceByKey($('#bnServiceSelect')?.value || 'manual') || { group:'Manuale', key:'manual', title: $('#bnService')?.value || 'Ordine manuale', cost: toNum($('#bnAmount')?.value), commission: 0 };
    const checked = checkedBanglaDocs();
    const missing = allBanglaDocs().filter(d => !checked.includes(d));
    const code = makeCode(service.group || 'CAF', service.key || 'manual');
    const client = { cf: ($('#bnCf')?.value || '').toUpperCase(), firstName: $('#bnFirstName')?.value || '', lastName: $('#bnLastName')?.value || '', email: $('#bnEmail')?.value || '', phone: $('#bnPhone')?.value || '', address: $('#bnAddress')?.value || '' };
    if (!client.lastName || !client.firstName) return showToast('Inserisci cognome e nome cliente.', 'warning');
    const pratica = { id: `p-${Date.now()}`, code, source: ($('#bnSource')?.value || 'bangla').toLowerCase(), group: service.group || 'Manuale', serviceKey: service.key || slug(service.title), serviceTitle: service.title || 'Ordine manuale', client, agentEmail: '', routeTeam:'bangla', assignedTeam:'bangla', status: missing.length ? 'Documenti mancanti' : 'Nuova', paymentStatus: $('#bnPayment')?.value || 'In attesa pagamento', documentStatus: missing.length ? 'Documenti mancanti' : 'Documenti ricevuti', cost: toNum($('#bnAmount')?.value || service.cost), commission: 0, missingDocs: missing, checkedDocs: checked, uploads: banglaUploadedFiles(), shopifyOrder: $('#bnShopifyOrder')?.value || '', teamMessage: $('#bnNote')?.value || 'Ordine creato da Team Bangla.', serviceData: { source: $('#bnSource')?.value, shopifyOrder: $('#bnShopifyOrder')?.value }, delega: $('#bnDelega')?.checked || false, privacy: $('#bnPrivacy')?.checked || false, signature: !!STATE.banglaSignatureDataUrl, signatureDataUrl: STATE.banglaSignatureDataUrl || '', generatedDocs:['delega','ricevuta'], deadline: $('#bnDeadline')?.value || today(), teamHistory:[{ by:STATE.session.name, role:'bangla', action:'Ordine/pratica creata manualmente', date:today() }], createdAt: today(), updatedAt: today() };
    STATE.pratiche.unshift(pratica);
    saveState(); e.target.reset(); STATE.banglaSignatureDataUrl=''; $('#banglaSignatureState') && ($('#banglaSignatureState').textContent='Non firmato'); clearCanvas('#banglaSignaturePad'); renderBanglaDocs(); renderAll(); showToast(`Pratica ${code} creata da Team Bangla.`);
  }

  function renderItaly() {
    if (STATE.session?.role !== 'italy') return;
    const rows = italyPratiche();
    $('#italyAssignedCount').textContent = rows.length;
    $('#italy730Count').textContent = rows.filter(p => p.serviceKey === '730').length;
    $('#italyCompletedCount').textContent = rows.filter(p => p.status === 'Completata').length;
    $('#italyWorkList').innerHTML = rows.map(p => teamItem(p, 'italy')).join('') || emptyFlat('Nessun lavoro', 'Le pratiche pronte da Bangla appariranno qui.');
    $('#italyAllTable').innerHTML = table(['Codice', 'Cliente', 'Servizio', 'Stato', 'Docs', 'Azione'], rows.map(p => [p.code, fullName(p.client), p.serviceTitle, p.status, p.documentStatus, `<button class="btn green" data-complete="${p.id}">Completa</button> <button class="btn orange" data-italy-missing="${p.id}">Integrazione</button> <button class="btn light" data-italy-receipt="${p.id}">Ricevuta</button> <button class="btn light" data-back-bangla="${p.id}">Ritorna Bangla</button>`]));
    $('#italy730List').innerHTML = rows.filter(p => p.serviceKey === '730').map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${fullName(p.client)}</div><div class="meta">Risultato agente: ${p.internal730 ? `${p.internal730.type} ${money(p.internal730.total)} · Giugno ${money(p.internal730.june)} · Novembre ${money(p.internal730.november)}` : 'non calcolato'}</div></div><button class="btn light" data-detail="${p.id}">Review</button></div>`).join('') || emptyFlat('Nessun 730', 'I 730 arrivano qui dopo controllo Bangla.');
    $('#italyCompleteList').innerHTML = rows.filter(p => p.status !== 'Completata').map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${p.serviceTitle}</div><div class="meta">${fullName(p.client)} · ${p.status}</div></div><button class="btn green" data-complete="${p.id}">Completa pratica</button> <button class="btn light" data-italy-receipt="${p.id}">Carica ricevuta</button></div>`).join('') || emptyFlat('Tutto completato', 'Non ci sono pratiche aperte.');
  }

  function renderAdmin() {
    if (STATE.session?.role !== 'admin') return;
    const creditTotal = STATE.users.filter(u => u.role === 'agent').reduce((s, u) => s + agentCredit(u.email), 0);
    const commissionPending = STATE.pratiche.filter(p => p.commissionStatus !== 'Paid').reduce((s, p) => s + Number(p.commission || 0), 0);
    const salaryMonth = STATE.users.filter(u => ['bangla', 'italy'].includes(u.role)).reduce((s, u) => s + Number(u.salary || 0), 0);
    $('#adminAllCount').textContent = STATE.pratiche.length;
    $('#adminCreditTotal').textContent = money(creditTotal);
    $('#adminCommissionPending').textContent = money(commissionPending);
    $('#adminSalaryMonth').textContent = money(salaryMonth);
    $('#adminActiveUsersCount') && ($('#adminActiveUsersCount').textContent = STATE.users.filter(u => u.active !== false).length);
    $('#adminUsersMiniCount') && ($('#adminUsersMiniCount').textContent = `${STATE.users.length} utenti`);
    $('#adminRoleSummary') && ($('#adminRoleSummary').innerHTML = ['admin','agent','commercialista','bangla','italy'].map(role => {
      const list = STATE.users.filter(u => u.role === role);
      return `<div class="role-summary-card"><span>${role}</span><strong>${list.length}</strong><small>${list.filter(u => u.active !== false).length} attivi</small></div>`;
    }).join(''));
    $('#adminOrderAgent') && ($('#adminOrderAgent').innerHTML = '<option value="">Creato da Admin</option>' + STATE.users.filter(u => u.role === 'agent' && u.active !== false).map(u => `<option value="${safe(u.email)}">${safe(u.name)} · ${safe(u.email)}</option>`).join(''));
    $('#adminOrderService') && ($('#adminOrderService').innerHTML = allServicesFlat().filter(s=>s.enabled!==false).map(s=>`<option value="${safe(s.key)}">${safe(s.group)} › ${safe(s.title)} · ${money(s.cost)}</option>`).join(''));
    $('#adminTodayWork') && ($('#adminTodayWork').innerHTML = (STATE.dailyReports || []).filter(r => (r.reportDate || r.date || '').slice(0,10) === today()).slice(0,6).map(r => `<div class="flat-item"><div><div class="title">${safe(r.name || r.userEmail || r.role)}</div><div class="meta">${safe(r.role)} · completate ${safe(r.done || 0)} · problemi ${safe(r.issues || 0)}<br>${safe(r.note || '')}</div></div>${statusChip('Oggi')}</div>`).join('') || emptyFlat('Nessun report oggi','Team Bangla e Team Italy invieranno qui il lavoro giornaliero.'));
    $('#adminTimeline').innerHTML = [...STATE.wallet].slice(0, 10).map(w => `<div class="timeline-item"><span>${w.date}</span><div><b>${w.reason}</b><div class="meta">${w.agentEmail}</div></div><span class="amount ${w.type}">${w.type === 'plus' ? '+' : '-'}${money(w.amount)}</span></div>`).join('');
    $('#adminUsersList').innerHTML = STATE.users.map(u => `<div class="flat-item admin-user-row"><div><div class="title">${safe(u.name || '--')} ${u.active === false ? '<span class="chip red">OFF</span>' : '<span class="chip green">ON</span>'}</div><div class="meta"><b>${safe(u.role || '--')}</b> · username <code>${safe(u.username || '')}</code> · ${safe(u.email || '--')}<br>Telefono: ${safe(u.phone || '--')} · Sede: ${safe(u.office || '--')} · Credito: ${money(u.credit || agentCredit(u.email))} · Salary: ${money(u.salary || 0)}</div></div><div class="admin-user-actions"><button class="btn light" data-reset-user-pass="${safe(u.id)}"><i class="fa-solid fa-key"></i> Reset</button><button class="btn red" data-toggle-user="${safe(u.id)}">${u.active !== false ? 'Disattiva' : 'Attiva'}</button></div></div>`).join('');
    const modifyHtml = (STATE.modifyRequests || [])
      .filter(r => r.status === 'Pending')
      .map(r => `<div class="flat-item agent-permission"><div><div class="title">Modifica richiesta: ${safe(r.praticaCode)}</div><div class="meta">${safe(r.agentName)} · ${safe(r.reason)}</div></div><button class="btn green" data-approve-modify="${safe(r.id)}">Approva modifica</button></div>`)
      .join('');
    const creditHtml = (STATE.creditRequests || [])
      .map(r => `<div class="flat-item"><div><div class="title">${r.agentName || r.agentEmail} chiede ${money(r.amount)}</div><div class="meta">${r.date} · ${r.status}</div></div>${r.status === 'Pending' ? `<button class="btn green" data-approve-credit="${r.id}">Approva</button>` : statusChip(r.status)}</div>`)
      .join('');
    $('#adminCreditRequests').innerHTML = (modifyHtml + creditHtml) || emptyFlat('Nessuna richiesta', 'Richieste credito agenti/modifiche appariranno qui.');
    $('#adminPraticheTable').innerHTML = table(['Codice', 'Source', 'Cliente', 'Servizio', 'Team', 'Stato', 'Costo', 'Commissione','Azioni'], STATE.pratiche.map(p => [p.code, p.source, fullName(p.client), p.serviceTitle, p.assignedTeam || '--', statusChip(p.status), money(p.cost), money(p.commission), `<button class="btn light" data-detail="${p.id}">Apri</button> <button class="btn orange" data-edit-status="${p.id}">Stato</button> <button class="btn light" data-add-docs="${p.id}">Docs</button> <button class="btn red" data-cancel-pratica="${p.id}">Cancel</button>`]));
    $('#adminSalaryList').innerHTML = STATE.users.filter(u => ['bangla', 'italy'].includes(u.role)).map(u => {
      const reports = (STATE.dailyReports || []).filter(r => (r.userEmail || r.email) === u.email || r.role === u.role);
      return `<div class="flat-item"><div><div class="title">${safe(u.name)}</div><div class="meta">${safe(u.role)} · ${safe(u.email)} · report: ${reports.length}</div></div><div><b>${money(u.salary)}</b><br><button class="btn green" data-pay-salary="${safe(u.id)}">Paga/segna</button></div></div>`;
    }).join('') || emptyFlat('Nessun team registrato','Crea Team Bangla/Italy da sezione Team & utenti.');
    $('#adminCommissionList').innerHTML = STATE.pratiche.filter(p => p.agentEmail).map(p => `<div class="flat-item"><div><div class="title">${safe(p.agentName || p.agentEmail)} · ${safe(p.code)}</div><div class="meta">${safe(p.serviceTitle)} · ${safe(p.commissionStatus || 'Pending')}</div></div><div><b>${money(p.commission)}</b><br>${p.commissionStatus==='Paid'?statusChip('Paid'):`<button class="btn green" data-pay-commission="${safe(p.id)}">Paga</button>`}</div></div>`).join('') || emptyFlat('Nessuna commissione','Le commissioni agent appariranno qui.');
    $('#adminDailyReports') && ($('#adminDailyReports').innerHTML = (STATE.dailyReports || []).slice(0,30).map(r => `<div class="flat-item"><div><div class="title">${safe(r.name || r.userEmail || r.role)} · ${safe(r.reportDate || r.date || today())}</div><div class="meta">Ruolo: ${safe(r.role)} · completate: ${safe(r.done || 0)} · problemi: ${safe(r.issues || 0)}<br>${safe(r.note || '')}</div></div>${statusChip(r.role || 'team')}</div>`).join('') || emptyFlat('Nessun daily report','I report salvati da Team Bangla/Italy appariranno qui.'));
    $('#adminTeamActions') && ($('#adminTeamActions').innerHTML = (STATE.teamActions || []).slice(0,30).map(a => `<div class="timeline-item"><span>${safe(a.date || today())}</span><div><b>${safe(a.action || 'Azione team')}</b><div class="meta">${safe(a.by || a.role || '--')} · ${safe(a.code || a.praticaCode || '')}</div></div></div>`).join('') || emptyFlat('Nessuna azione team','Le azioni sulle pratiche appariranno qui.'));
    renderAdminProV15();
  }


  function periodMatches(dateValue, period) {
    const d = String(dateValue || today()).slice(0, 10);
    const t = today();
    if (period === 'today') return d === t;
    if (period === 'month') return d.slice(0, 7) === t.slice(0, 7);
    if (period === 'year') return d.slice(0, 4) === t.slice(0, 4);
    return true;
  }

  function adminSalesStats(period = $('#adminSalesPeriod')?.value || 'today') {
    const pratiche = (STATE.pratiche || []).filter(p => periodMatches(p.createdAt || p.updatedAt, period));
    const sales = (STATE.adminSales || []).filter(s => periodMatches(s.date, period));
    const commSales = (STATE.commSales || []).filter(s => periodMatches(s.date, period));
    const invoices = (STATE.invoices || []).filter(s => periodMatches(s.date || s.createdAt, period));
    const praticaRevenue = pratiche.reduce((s,p)=>s + (/attesa/i.test(p.paymentStatus||'') ? 0 : Number(p.cost||0)),0);
    const manualRevenue = sales.reduce((s,x)=>s+Number(x.amount||0),0);
    const commercialistaRevenue = commSales.reduce((s,x)=>s+Number(x.card||0)+Number(x.cash||0)+Number(x.other||0)+Number(x.agencyTotal||0),0) + invoices.reduce((s,x)=>s+Number(x.total||0),0);
    const commission = pratiche.reduce((s,p)=>s+Number(p.commission||0),0);
    return { pratiche, sales, commSales, invoices, praticaRevenue, manualRevenue, commercialistaRevenue, commission, total: praticaRevenue + manualRevenue + commercialistaRevenue, count: pratiche.length + sales.length + commSales.length + invoices.length };
  }

  function roleUserList(role) { return (STATE.users || []).filter(u => u.role === role); }

  function serviceMatrixHtml(selected = []) {
    return allServicesFlat().map(s => `<label class="service-check"><input type="checkbox" data-ad-service-access value="${safe(s.key)}" ${selected.includes(s.key) ? 'checked' : ''}><span><b>${safe(s.title)}</b><small>${safe(s.group)} · ${money(s.cost)}</small></span></label>`).join('');
  }

  function renderAdminProV15() {
    if (STATE.session?.role !== 'admin') return;
    const period = $('#adminSalesPeriod')?.value || 'today';
    const stats = adminSalesStats(period);
    ['adminSalesTotal','adminSalesTotalHome'].forEach(id => $('#'+id) && ($('#'+id).textContent = money(stats.total)));
    ['adminSalesOrders','adminSalesOrdersHome'].forEach(id => $('#'+id) && ($('#'+id).textContent = stats.count));
    $('#adminSalesPratiche') && ($('#adminSalesPratiche').textContent = money(stats.praticaRevenue));
    ['adminSalesCommercialista','adminSalesCommercialistaHome'].forEach(id => $('#'+id) && ($('#'+id).textContent = money(stats.commercialistaRevenue)));
    $('#adminSalesCommission') && ($('#adminSalesCommission').textContent = money(stats.commission));
    $('#adminSalesList') && ($('#adminSalesList').innerHTML = [
      ...stats.pratiche.map(p => ({ date:p.createdAt||p.updatedAt, title:p.code, meta:`${p.serviceTitle} · ${fullName(p.client)} · ${p.paymentStatus}`, amount:p.cost })),
      ...stats.sales.map(s => ({ date:s.date, title:s.title||'Vendita manuale', meta:s.source||'Admin', amount:s.amount })),
      ...stats.invoices.map(i => ({ date:i.date||i.createdAt, title:i.desc||'Fattura', meta:i.client||i.companyId||'Commercialista', amount:i.total })),
      ...stats.commSales.map(s => ({ date:s.date, title:'Chiusura commercialista', meta:s.status||'', amount:Number(s.card||0)+Number(s.cash||0)+Number(s.other||0) }))
    ].slice(0,40).map(x => `<div class="flat-item"><div><div class="title">${safe(x.title)}</div><div class="meta">${safe(x.date)} · ${safe(x.meta)}</div></div><b>${money(x.amount)}</b></div>`).join('') || emptyFlat('Nessuna vendita','Le vendite giornaliere/mensili/annuali appariranno qui.'));

    ['adminAgentControlList','adminAgentControlListHome'].forEach(listId => { const listEl = $('#'+listId); if (!listEl) return; listEl.innerHTML = roleUserList('agent').map(u => {
      const access = agentAllowedKeys(u);
      const ps = (STATE.pratiche || []).filter(p => p.agentEmail === u.email);
      return `<div class="flat-item admin-pro-user"><div><div class="title">${safe(u.name)} ${u.active === false ? '<span class="chip red">BLOCCATO</span>' : '<span class="chip green">ATTIVO</span>'}</div><div class="meta">ID: <code>${safe(u.id)}</code> · ${safe(u.email)}<br>Credito: ${money(agentCredit(u.email))} · Ordini: ${ps.length} · Servizi abilitati: ${access.length ? access.length : 'Tutti'}</div></div><div class="admin-user-actions"><button class="btn blue" data-admin-agent-credit="${safe(u.id)}">Credito</button><button class="btn light" data-admin-agent-services="${safe(u.id)}">Servizi</button><button class="btn red" data-admin-block-user="${safe(u.id)}">${u.active === false ? 'Sblocca' : 'Blocca'}</button></div></div>`;
    }).join('') || emptyFlat('Nessun agente','Crea agenti da Team & utenti.'); });

    $('#adminTeamReportPro') && ($('#adminTeamReportPro').innerHTML = ['bangla','italy'].map(role => {
      const users = roleUserList(role);
      const done = (STATE.pratiche || []).filter(p => p.assignedTeam === role && p.status === 'Completata').length;
      const open = (STATE.pratiche || []).filter(p => p.assignedTeam === role && p.status !== 'Completata').length;
      const reports = (STATE.dailyReports || []).filter(r => r.role === role);
      return `<div class="admin-team-card"><h3>${role === 'bangla' ? 'Team Bangla' : 'Team Italy'}</h3><div class="mini-kpis"><span><b>${users.length}</b> operatori</span><span><b>${open}</b> aperte</span><span><b>${done}</b> completate</span><span><b>${reports.length}</b> report</span></div><div class="flat-list">${reports.slice(0,4).map(r=>`<div class="flat-item"><div><div class="title">${safe(r.name||r.userEmail||role)}</div><div class="meta">${safe(r.reportDate||r.date)} · completate ${safe(r.done||0)} · problemi ${safe(r.issues||0)}<br>${safe(r.note||'')}</div></div></div>`).join('') || emptyFlat('Nessun report','Nessun report ricevuto.')}</div></div>`;
    }).join(''));

    $('#adminCommercialistaOps') && ($('#adminCommercialistaOps').innerHTML = `<div class="mini-kpis"><span><b>${STATE.companies.length}</b> ditte</span><span><b>${STATE.invoices.length}</b> fatture</span><span><b>${money((STATE.invoices||[]).reduce((s,i)=>s+Number(i.total||0),0))}</b> fatturato</span><span><b>${(STATE.commF24||[]).length}</b> F24</span></div>` + ((STATE.companies||[]).slice(0,10).map(c=>`<div class="flat-item"><div><div class="title">${safe(c.name)}</div><div class="meta">P.IVA ${safe(c.vat||'--')} · ${safe(c.status||'Attivo')} · Piano ${safe(c.plan||'--')}</div></div>${statusChip(c.payStatus||c.status||'Attivo')}</div>`).join('') || emptyFlat('Nessuna ditta','Le ditte commercialista appariranno qui.')));

    $('#adminProductPriceTable') && ($('#adminProductPriceTable').innerHTML = table(['Servizio','Gruppo','Prezzo','Commissione','Stato','Azioni'], allServicesFlat().map(s => [safe(s.title), safe(s.group), money(s.cost), money(s.commission), s.enabled === false ? statusChip('Disattivato') : statusChip('Attivo'), `<button class="btn light" data-edit-product-price="${safe(s.key)}">Modifica</button>`])));
    $('#adServiceAccessBox') && ($('#adServiceAccessBox').innerHTML = serviceMatrixHtml([]));
    $('#adminPromoList') && ($('#adminPromoList').innerHTML = (STATE.promotions || []).map(p => `<div class="flat-item"><div><div class="title">${safe(p.title)} · ${statusChip(p.active === false ? 'OFF' : 'ON')}</div><div class="meta">Target ${safe(p.targetRole||'all')} · ${safe(p.startDate||'')} → ${safe(p.endDate||'')}<br>${safe(p.message||'')}</div></div><button class="btn red" data-delete-promo="${safe(p.id)}">Elimina</button></div>`).join('') || emptyFlat('Nessuna promozione','Pubblica slide/testi per agenti o tutti i ruoli.'));
    $('#adminPopupList') && ($('#adminPopupList').innerHTML = (STATE.popups || []).map(p => `<div class="flat-item"><div><div class="title">${safe(p.title)} · ${statusChip(p.active === false ? 'OFF' : 'ON')}</div><div class="meta">Target ${safe(p.targetRole||'all')}<br>${safe(p.message||'')}</div></div><button class="btn red" data-delete-popup="${safe(p.id)}">Elimina</button></div>`).join('') || emptyFlat('Nessun popup','Crea popup avviso per agent/team/clienti interni.'));
    $('#adminComplaintList') && ($('#adminComplaintList').innerHTML = (STATE.complaints || []).map(c => `<div class="flat-item"><div><div class="title">${safe(c.subject)} · ${statusChip(c.status||'Open')}</div><div class="meta">${safe(c.date)} · ${safe(c.source||'Admin')} · Pratica ${safe(c.praticaCode||'--')}<br>${safe(c.message||'')}</div></div><button class="btn green" data-close-complaint="${safe(c.id)}">Chiudi</button></div>`).join('') || emptyFlat('Nessun reclamo/problema','Registra problemi di ordine, reclami, errori o note operative.'));
    $('#adminPortalSettingsPreview') && ($('#adminPortalSettingsPreview').innerHTML = `${previewLine('Header', STATE.portalSettings.headerTheme || 'cgn-blue')}${previewLine('Testo team', STATE.portalSettings.teamHeaderText || '--')}${previewLine('Banner agent', STATE.portalSettings.agentBannerText || '--')}${previewLine('Popup globale', STATE.portalSettings.globalPopupActive ? 'Attivo' : 'Spento')}`);
  }

  function table(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }


  function currentTickets() {
    if (!STATE.session) return [];
    if (STATE.session.role === 'admin') return STATE.tickets || [];
    return (STATE.tickets || []).filter(t => t.creatorEmail === STATE.session.email || t.targetRole === STATE.session.role);
  }

  function renderTicketsAndSources() {
    const sourcesHtml = (STATE.researchLinks || []).map(s => `<div class="flat-item source-card"><div><div class="title">${s.title}</div><div class="meta">${s.category || 'Fonte'} · <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a></div></div></div>`).join('') || emptyFlat('Nessuna fonte', 'Aggiungi link ufficiali da Team Bangla o Admin.');
    ['agentSourcesList','banglaSourcesList','italySourcesList','adminSourcesList'].forEach(id => { const el = $('#'+id); if (el) el.innerHTML = sourcesHtml; });
    const ticketHtml = (list) => list.map(t => `<div class="flat-item ${t.status === 'Solved' ? 'ticket-solved' : 'ticket-open'}"><div><div class="title">${t.subject} · ${statusChip(t.status)}</div><div class="meta">${t.date} · ${t.creatorRole || ''} · ${t.creatorEmail || ''}<br>Pratica: ${t.praticaCode || '--'}<br>${t.message}<br><b>Progress:</b> ${t.progress || '--'}</div></div>${STATE.session?.role === 'admin' && t.status !== 'Solved' ? `<button class="btn green" data-solve-ticket="${t.id}">Risolvi</button>` : ''}</div>`).join('') || emptyFlat('Nessun ticket', 'Quando viene creato un ticket apparirà qui.');
    const own = currentTickets();
    ['agentTicketList','commTicketList','banglaTicketList','italyTicketList'].forEach(id => { const el = $('#'+id); if (el) el.innerHTML = ticketHtml(own); });
    const admin = $('#adminTicketList'); if (admin) admin.innerHTML = ticketHtml(STATE.tickets || []);
  }

  function renderProfilesAndDocs() {
    const u = STATE.session || {};
    const profileHtml = `<div style="display:flex;gap:16px;align-items:center"><div class="profile-photo"><i class="fa-solid fa-user"></i></div><div>${previewLine('Nome', u.name || '--')}${previewLine('Ruolo', u.role || '--')}${previewLine('Email', u.email || '--')}${previewLine('Telefono', u.phone || '--')}${previewLine('Salary mese', money(u.salary || 0))}${previewLine('Pratiche completate oggi', STATE.pratiche.filter(p => p.updatedAt === today() && p.status === 'Completata' && (u.role !== 'italy' || p.assignedTeam === 'italy')).length)}</div></div>`;
    ['banglaProfileBox','italyProfileBox'].forEach(id => { const el = $('#'+id); if (el) el.innerHTML = profileHtml; });
    const docs = $('#adminDocsList');
    if (docs) docs.innerHTML = STATE.pratiche.map(p => `<div class="flat-item"><div><div class="title">${p.code} · ${fullName(p.client)}</div><div class="meta">${p.serviceTitle} · ${p.status} · Upload: ${(p.uploads || []).join(', ') || '--'}</div></div><div><button class="btn light" data-detail="${p.id}">Apri</button> <button class="btn orange" data-download-pratica="${p.id}">Download pratica</button></div></div>`).join('') || emptyFlat('Nessun documento', 'Le pratiche create generano delega/ricevuta.' );
    const bio = $('#commBioList');
    if (bio) bio.innerHTML = STATE.companies.map(c => `<div class="flat-item"><div><div class="title">${c.name}</div><div class="meta">${c.type} · P.IVA ${c.vat || '--'} · CF ${c.cf || '--'}<br>ATECO ${c.ateco || '--'} · Regime ${c.regime || '--'} · PEC ${c.pec || '--'} · SDI ${c.sdi || '--'}<br>Sede: ${c.address || '--'} · ${c.city || '--'} · Titolare: ${c.owner || '--'} · Scadenza: ${c.deadline || '--'}</div></div></div>`).join('') || emptyFlat('Nessuna ditta', 'Aggiungi ditta da Nuova ditta.' );
  }

  function submitTicket(prefix, e) {
    e.preventDefault();
    const subject = $(`#${prefix}TicketSubject`)?.value || '';
    const praticaCode = $(`#${prefix}TicketPratica`)?.value || '';
    const message = $(`#${prefix}TicketMessage`)?.value || '';
    if (!subject || !message) return showToast('Completa oggetto e messaggio ticket.', 'warning');
    STATE.tickets.unshift({ id:`t-${Date.now()}`, creatorRole: STATE.session.role, creatorEmail: STATE.session.email, creatorName: STATE.session.name, targetRole:'admin', subject, praticaCode, message, status:'Open', progress:'Aperto - in attesa Admin', date: today() });
    saveState(); e.target.reset(); renderAll(); showToast('Ticket inviato ad Admin.');
  }

  function solveTicket(id) { const t = (STATE.tickets || []).find(x => x.id === id); if (!t) return; t.status = 'Solved'; t.progress = 'Risolto da Admin'; t.solvedAt = today(); saveState(); renderAll(); showToast('Ticket risolto.'); }

  function addSource(e) { e.preventDefault(); const title=$('#banglaSourceTitle')?.value; const url=$('#banglaSourceUrl')?.value; if(!title||!url) return showToast('Aggiungi titolo e link fonte.', 'warning'); STATE.researchLinks.unshift({ title, url, category: $('#banglaSourceCat')?.value || 'Team source' }); saveState(); e.target.reset(); renderAll(); showToast('Fonte ufficiale salvata.'); }

  function submitDailyReport(e) { e.preventDefault(); STATE.dailyReports.unshift({ id:`dr-${Date.now()}`, userEmail:STATE.session.email, role:STATE.session.role, done:toNum($('#banglaDailyDone')?.value), issues:toNum($('#banglaDailyIssues')?.value), note:$('#banglaDailyNote')?.value || '', date:today() }); saveState(); e.target.reset(); showToast('Report giornaliero salvato.'); }

  function docHtml(type, pratica) {
    let p = pratica;
    const idMatch = String(type || '').match(/(delega|ricevuta)-(.+)/);
    if (!p && idMatch) p = STATE.pratiche.find(x => x.id === idMatch[2]) || STATE.pratiche.find(x => x.code === idMatch[2]);
    p = p || { code:'BOZZA', serviceTitle:'Modello 730', client: build730().client, serviceData: build730(), internal730: calc730(), uploads: uploadedFiles('#t730_files'), signatureDataUrl: STATE.signature730DataUrl };
    const client = p.client || {};
    const result = p.internal730 || (String(type).includes('730') ? calc730() : null);
    const docs = (p.uploads || []).map(x => `<li>${safe(x)}</li>`).join('') || '<li>Documenti da allegare / non caricati nel browser demo</li>';
    const signature = p.signatureDataUrl || p.signature730DataUrl || STATE.signature730DataUrl || STATE.signatureDataUrl || STATE.banglaSignatureDataUrl || '';
    const title = String(type).includes('ricevuta') ? 'RICEVUTA CONSEGNA DOCUMENTI E PRATICA' : String(type).includes('f24') ? 'BOZZA F24 / RATE' : String(type).includes('modello-730-auto') ? 'MODELLO 730 AUTO-COMPILATO - BOZZA' : 'DELEGA E MANDATO PROFESSIONALE CAF CAE';
    const resultBlock = result ? `<section class="box result"><h2>Risultato interno 730</h2><div class="row"><span>Tipo</span><b>${result.type}</b></div><div class="row"><span>Totale</span><b>${money(result.total)}</b></div><div class="row"><span>Saldo / giugno</span><b>${money(result.june)}</b></div><div class="row"><span>Novembre</span><b>${money(result.november)}</b></div><div class="row"><span>Reddito</span><b>${money(result.income)}</b></div><p class="small">Stima interna per pre-controllo: la liquidazione ufficiale deve essere verificata dal team abilitato.</p></section>` : '';
    const modello730 = String(type).includes('modello-730-auto') || p.serviceKey === '730' ? `<section class="form730"><h2>Frontespizio 730 - bozza auto-compilata</h2><div class="grid"><div>Codice fiscale<br><b>${safe(client.cf)}</b></div><div>Cognome<br><b>${safe(client.lastName)}</b></div><div>Nome<br><b>${safe(client.firstName)}</b></div><div>Sesso<br><b>${safe(client.sex)}</b></div><div>Data nascita<br><b>${safe(client.dob)}</b></div><div>Comune nascita<br><b>${safe(client.birthPlace)}</b></div><div>Comune residenza<br><b>${safe(client.city)}</b></div><div>Indirizzo<br><b>${safe(client.streetType || '')} ${safe(client.address || '')} ${safe(client.streetNo || '')}</b></div></div></section>` : '';
    const delegaText = `<section class="box"><h2>Delega / mandato</h2><p>Il/La sottoscritto/a <b>${safe(fullName(client))}</b>, codice fiscale <b>${safe(client.cf)}</b>, conferisce mandato a CAF CAE e ai suoi incaricati/autorizzati per la raccolta documenti, il controllo preliminare, la predisposizione della pratica, la gestione di comunicazioni, integrazioni, ricevute e documenti collegati al servizio <b>${safe(p.serviceTitle)}</b>.</p><p>Il cliente autorizza, ove necessario per il servizio richiesto, l’accesso/consultazione dei dati utili presso portali e banche dati disponibili, inclusi documenti fiscali, CU, ricevute, protocolli e comunicazioni, nel rispetto della normativa privacy e con verifica finale umana.</p><p>Il cliente dichiara di aver letto e accettato l’informativa privacy e autorizza il trattamento dei dati personali e particolari necessari per l’erogazione del servizio.</p></section>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#111;background:#fff}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #0f8a4b;padding-bottom:14px}.brand{font-size:30px;font-weight:900;color:#0f8a4b}.box,.form730{border:1px solid #d8dee8;padding:16px;margin:16px 0}.form730{background:#fff0e6;border-color:#ecc8ad}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.grid>div{border:1px solid #d4dbe5;background:#f8fafc;padding:10px;min-height:52px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px}.sig{height:100px;border-bottom:1px solid #111;margin-top:30px;display:flex;align-items:flex-end}.sig img{max-height:90px;max-width:360px}.small{font-size:12px;color:#555}.result b{color:#0f8a4b}.footer{margin-top:25px;font-size:12px;color:#555}@media print{button{display:none}.box,.form730{break-inside:avoid}}</style></head><body><div class="head"><div><div class="brand">CAF CAE</div><div>Centro Assistenza Fiscale · Documento generato automaticamente</div></div><div><b>${safe(p.code || 'BOZZA')}</b><br>${today()}</div></div><h1>${title}</h1><section class="box"><div class="row"><span>Cliente</span><b>${safe(fullName(client))}</b></div><div class="row"><span>Codice fiscale</span><b>${safe(client.cf)}</b></div><div class="row"><span>Servizio</span><b>${safe(p.serviceTitle || 'Modello 730')}</b></div><div class="row"><span>Telefono</span><b>${safe(client.phone || '--')}</b></div><div class="row"><span>Email</span><b>${safe(client.email || '--')}</b></div><div class="row"><span>Stato pratica</span><b>${safe(p.status || 'Bozza')}</b></div></section>${modello730}${delegaText}${resultBlock}<section class="box"><h2>Documenti esibiti / caricati</h2><ul>${docs}</ul></section><div class="sig">${signature ? `<img src="${signature}" alt="firma cliente">` : 'Firma cliente'}</div><div class="footer">Documento interno CAF CAE. La trasmissione ufficiale, la protocollazione e il calcolo definitivo restano soggetti a verifica del team abilitato. Generato da piattaforma CAF CAE.</div><script>window.print()</script></body></html>`;
  }

  function safe(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  function downloadHtml(name, html) { const blob = new Blob([html], { type:'text/html;charset=utf-8' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000); }

  function downloadDoc(type) { downloadHtml(`${type}-${Date.now()}.html`, docHtml(type)); showToast('Documento generato. Aprilo e stampa/salva PDF.'); }
  function downloadPratica(id) { const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; downloadHtml(`${p.code}-fascicolo.html`, docHtml('fascicolo-pratica', p)); }

  function renderAll() { renderAgentDashboard(); renderCommercialista(); renderBangla(); renderItaly(); renderAdmin(); renderTicketsAndSources(); renderProfilesAndDocs(); }

  function switchSimple(prefix, tab) {
    $$(`.${prefix}-tab`).forEach(x => x.classList.remove('active'));
    $(`#${tab}`)?.classList.add('active');
    $$(`[data-${prefix}-tab]`).forEach(b => b.classList.toggle('active', b.dataset[`${prefix}Tab`] === tab));
  }

  function openDetail(id) {
    const p = STATE.pratiche.find(x => x.id === id);
    if (!p) return;
    const receiptHtml = p.receiptLink ? previewLine('Ricevuta Italy', `<a href="${p.receiptLink}" target="_blank" rel="noopener">Apri ricevuta</a>`) : '';
    const history = (p.teamHistory || []).map(h => `<div class="timeline-item"><span>${h.date}</span><div><b>${h.action}</b><div class="meta">${h.by || '--'} · ${h.role || '--'}</div></div></div>`).join('') || '<div class="meta">Nessuna attività registrata</div>';
    $('#detailModalBody').innerHTML = `<h2>${p.code}</h2><p>${statusChip(p.status)} ${statusChip(p.documentStatus)} ${statusChip(p.paymentStatus)}</p><div class="document-preview">
      ${previewLine('Cliente', fullName(p.client))}${previewLine('CF', p.client.cf || '--')}${previewLine('Email', p.client.email || '--')}${previewLine('Telefono', p.client.phone || '--')}${previewLine('Servizio', p.serviceTitle)}${previewLine('Source', p.source)}${previewLine('Shopify/Ref', p.shopifyOrder || '--')}${previewLine('Team', p.assignedTeam || '--')}${previewLine('Deadline', p.deadline || '--')}${previewLine('Messaggio team', p.teamMessage || '--')}${previewLine('Mancanti', (p.missingDocs || []).join(', ') || '--')}${previewLine('Upload', (p.uploads || []).join(', ') || '--')}${receiptHtml}${p.internal730 ? previewLine('730 risultato', `${p.internal730.type} ${money(p.internal730.total)} · giugno ${money(p.internal730.june)} · novembre ${money(p.internal730.november)}`) : ''}
    </div><div class="doc-actions"><button class="btn orange" data-download-pratica="${p.id}">Scarica fascicolo/delega</button><button class="btn light" data-download-doc="delega-${p.id}">Delega</button><button class="btn light" data-download-doc="ricevuta-${p.id}">Ricevuta</button><button class="btn light" data-add-docs="${p.id}">Aggiungi docs</button><button class="btn light" data-edit-status="${p.id}">Modifica stato</button><button class="btn orange" data-bangla-missing="${p.id}">Richiedi mancanti</button><button class="btn green" data-send-italy="${p.id}">Invia Italy</button><button class="btn green" data-complete="${p.id}">Completa</button><button class="btn light" data-payment-toggle="${p.id}">Pagamento</button><button class="btn red" data-cancel-pratica="${p.id}">Annulla/Rimborso</button></div><div class="white-card"><h3>Storico pratica</h3><div class="timeline-list">${history}</div></div>`;
    $('#detailModal').classList.remove('hidden');
  }

  function askMissing(id, source) {
    const p = STATE.pratiche.find(x => x.id === id);
    if (!p) return;
    const docs = prompt('Scrivi documenti/dati mancanti separati da virgola:', (p.missingDocs || []).join(', ') || 'Documento identità, Delega firmata');
    if (docs === null) return;
    p.missingDocs = docs.split(',').map(x => x.trim()).filter(Boolean);
    p.documentStatus = p.missingDocs.length ? 'Documenti mancanti' : 'Documenti ricevuti';
    p.status = p.missingDocs.length ? 'Documenti mancanti' : p.status;
    p.teamMessage = `${source === 'italy' ? 'Team Italy' : 'Team Bangla'} richiede: ${p.missingDocs.join(', ')}`;
    p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: `Richiesti mancanti: ${p.missingDocs.join(', ')}`, date: today() });
    p.updatedAt = today();
    saveState(); renderAll(); showToast('Richiesta inviata ad agente/cliente.');
  }

  function sendToItaly(id) {
    const p = STATE.pratiche.find(x => x.id === id);
    if (!p) return;
    p.routeTeam = 'italy'; p.assignedTeam = 'italy'; p.status = 'In verifica'; p.teamMessage = 'Pratica controllata da Bangla e inviata a Team Italy.'; p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action:'Inviata a Team Italy', date: today() }); p.updatedAt = today();
    saveState(); renderAll(); showToast('Pratica inviata a Team Italy.');
  }

  function completePratica(id) {
    const p = STATE.pratiche.find(x => x.id === id);
    if (!p) return;
    p.status = 'Completata'; p.documentStatus = 'Documenti ricevuti'; p.paymentStatus = p.paymentStatus === 'In attesa pagamento' ? 'Pagato' : p.paymentStatus; p.teamMessage = 'Pratica completata da Team Italy.'; p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action:'Pratica completata', date: today() }); p.updatedAt = today();
    saveState(); renderAll(); showToast('Pratica completata.');
  }


  function addDocsPrompt(id) {
    const p = STATE.pratiche.find(x => x.id === id); if (!p) return;
    const docs = prompt('Aggiungi nomi documenti caricati/link separati da virgola:', 'Documento identità.pdf, CU.pdf');
    if (docs === null) return;
    p.uploads = [...(p.uploads || []), ...docs.split(',').map(x => x.trim()).filter(Boolean)];
    p.checkedDocs = [...new Set([...(p.checkedDocs || []), ...p.uploads])];
    p.documentStatus = p.missingDocs?.length ? 'Documenti mancanti' : 'Documenti ricevuti';
    p.teamHistory ||= [];
    p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: 'Aggiunti documenti/upload', date: today() });
    p.updatedAt = today(); saveState(); renderAll(); openDetail(id); showToast('Documenti aggiunti.');
  }

  function editStatusPrompt(id) {
    const p = STATE.pratiche.find(x => x.id === id); if (!p) return;
    const status = prompt('Nuovo stato pratica:', p.status || 'In lavorazione');
    if (!status) return;
    p.status = status; p.updatedAt = today();
    p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: `Stato aggiornato: ${status}`, date: today() });
    saveState(); renderAll(); openDetail(id); showToast('Stato aggiornato.');
  }

  function togglePayment(id) {
    const p = STATE.pratiche.find(x => x.id === id); if (!p) return;
    p.paymentStatus = p.paymentStatus === 'Pagato' ? 'In attesa pagamento' : 'Pagato';
    p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: `Pagamento: ${p.paymentStatus}`, date: today() });
    p.updatedAt = today(); saveState(); renderAll(); openDetail(id); showToast('Pagamento aggiornato.');
  }

  function cancelPratica(id) {
    const p = STATE.pratiche.find(x => x.id === id); if (!p) return;
    const reason = prompt('Motivo annullamento/rimborso:', 'Cliente ha richiesto annullamento / rimborso');
    if (reason === null) return;
    p.status = 'Annullata'; p.paymentStatus = 'Rimborso richiesto'; p.teamMessage = reason; p.updatedAt = today();
    p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: `Annullata/Rimborso: ${reason}`, date: today() });
    saveState(); renderAll(); openDetail(id); showToast('Pratica annullata / rimborso segnato.', 'warning');
  }

  function italyReceiptPrompt(id) {
    const p = STATE.pratiche.find(x => x.id === id); if (!p) return;
    const link = prompt('Inserisci link ricevuta/PDF o protocollo finale:', p.receiptLink || '');
    if (link === null) return;
    p.receiptLink = link;
    p.status = 'Completata';
    p.documentStatus = 'Documenti ricevuti';
    p.teamMessage = 'Ricevuta/protocollo finale caricata da Team Italy.';
    p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: 'Ricevuta/protocollo finale caricato', date: today() });
    STATE.receipts.unshift({ id:`r-${Date.now()}`, praticaId:id, praticaCode:p.code, link, by:STATE.session.email, date:today() });
    saveState(); renderAll(); openDetail(id); showToast('Ricevuta caricata e pratica completata.');
  }

  function backToBangla(id) {
    const p = STATE.pratiche.find(x => x.id === id); if (!p) return;
    const reason = prompt('Motivo ritorno a Team Bangla:', 'Dati/documenti da ricontrollare');
    if (reason === null) return;
    p.assignedTeam = 'bangla'; p.routeTeam = 'bangla'; p.status = 'Documenti mancanti'; p.teamMessage = `Team Italy → Bangla: ${reason}`; p.updatedAt = today();
    p.teamHistory ||= []; p.teamHistory.unshift({ by: STATE.session.name, role: STATE.session.role, action: `Ritornata a Bangla: ${reason}`, date: today() });
    saveState(); renderAll(); showToast('Pratica ritornata a Team Bangla.');
  }

  function requestCredit(e) {
    e.preventDefault();
    const amount = toNum($('#creditRequestAmount').value);
    if (amount <= 0) return showToast('Inserisci importo valido.', 'warning');
    STATE.creditRequests.unshift({ id: `cr-${Date.now()}`, agentEmail: STATE.session.email, agentName: STATE.session.name, amount, status: 'Pending', date: today() });
    saveState(); $('#creditRequestAmount').value = ''; renderAll(); showToast('Richiesta credito inviata ad admin.');
  }

  function approveCredit(id) {
    const r = STATE.creditRequests.find(x => x.id === id);
    if (!r || r.status !== 'Pending') return;
    r.status = 'Approved';
    addWallet(r.agentEmail, 'plus', r.amount, `Credito approvato admin richiesta ${id}`);
    saveState(); renderAll(); showToast('Credito approvato e aggiunto.');
  }

  async function submitAdminUser(e) {
    e.preventDefault();
    if (STATE.session?.role !== 'admin') return showToast('Solo admin può creare user.', 'error');
    const email = $('#adEmail').value.toLowerCase().trim();
    const username = $('#adUsername').value.trim();
    const password = $('#adPassword').value.trim();
    if (!password || password.length < 8) return showToast('Password minima 8 caratteri.', 'warning');
    if (STATE.users.some(u => u.email === email || u.username === username)) return showToast('Email/username già esistente.', 'error');
    const selectedRole = $('#adRole').value;
    const payload = {
      name: $('#adName').value.trim(),
      email,
      username,
      password,
      role: selectedRole,
      phone: $('#adPhone')?.value.trim() || '',
      office: $('#adOffice')?.value.trim() || $('#adRole').selectedOptions[0].text,
      credit: toNum($('#adCredit')?.value),
      salary: toNum($('#adSalary')?.value) || (['bangla', 'italy'].includes(selectedRole) ? 1200 : 0),
      serviceAccess: $$('[data-ad-service-access]:checked').map(x => x.value),
      active: ($('#adActive')?.value || 'true') === 'true',
      blockStatus: (($('#adActive')?.value || 'true') === 'true') ? 'Active' : 'Blocked'
    };
    try {
      const created = await window.CAF_CAE_API?.createUser?.(payload);
      const u = created?.user || { ...payload, id: `u-${Date.now()}` };
      delete u.password; delete u.password_hash;
      STATE.users.push(u);
      u.serviceAccess = payload.serviceAccess || [];
      if (u.role === 'agent') STATE.servicePermissions[u.email] = u.serviceAccess;
      if (u.role === 'agent' && payload.credit > 0) addWallet(u.email, 'plus', payload.credit, 'Credito iniziale creazione admin');
      saveState();
      e.target.reset();
      renderAll();
      showToast('User creato in backend con password sicura.');
    } catch (err) {
      showToast(err.message || 'Errore creazione user backend.', 'error');
    }
  }



  function submitAdminPratica(e) {
    e.preventDefault();
    if (STATE.session?.role !== 'admin') return showToast('Solo admin può creare pratiche.', 'error');
    const selected = serviceByKey($('#adminOrderService')?.value) || { group: 'CAF', key: $('#adminOrderService')?.value || 'admin-order', title: $('#adminOrderService')?.selectedOptions?.[0]?.textContent || 'Pratica Admin', cost: toNum($('#adminOrderCost')?.value), commission: 0 };
    const team = $('#adminOrderTeam')?.value || 'bangla';
    const agentEmail = $('#adminOrderAgent')?.value || '';
    const agent = STATE.users.find(u => u.email === agentEmail);
    const client = {
      firstName: $('#adminOrderFirst')?.value || '',
      lastName: $('#adminOrderLast')?.value || '',
      cf: ($('#adminOrderCf')?.value || '').toUpperCase(),
      phone: $('#adminOrderPhone')?.value || '',
      email: $('#adminOrderEmail')?.value || ''
    };
    if (!client.firstName || !client.lastName) return showToast('Inserisci nome e cognome cliente.', 'warning');
    const cost = toNum($('#adminOrderCost')?.value || selected.cost || 0);
    const pratica = {
      id: `p-${Date.now()}`,
      code: makeCode(selected.group || 'CAF', selected.key || 'admin-order'),
      source: 'admin',
      group: selected.group || 'CAF',
      serviceKey: selected.key || slug(selected.title),
      serviceTitle: selected.title || 'Pratica Admin',
      client,
      agentEmail,
      agentName: agent?.name || '',
      routeTeam: team,
      assignedTeam: team,
      status: 'Nuova',
      paymentStatus: $('#adminOrderPayment')?.value || 'Pagato',
      documentStatus: 'Da verificare',
      cost,
      commission: agentEmail ? Number(selected.commission || 0) : 0,
      commissionStatus: agentEmail ? 'Pending' : 'N/A',
      missingDocs: [],
      checkedDocs: [],
      uploads: [],
      teamMessage: $('#adminOrderNote')?.value || 'Pratica creata da Admin e assegnata al team.',
      serviceData: { priority: $('#adminOrderPriority')?.value || 'Normale', createdFromAdmin: true },
      deadline: $('#adminOrderDeadline')?.value || today(),
      teamHistory: [{ by: STATE.session.name, role: 'admin', action: 'Pratica creata da Admin', date: today() }],
      createdAt: today(),
      updatedAt: today()
    };
    STATE.pratiche.unshift(pratica);
    STATE.teamActions.unshift({ id: `ta-${Date.now()}`, by: STATE.session.name, role: 'admin', action: `Creata pratica ${pratica.code}`, code: pratica.code, date: today() });
    saveState();
    e.target.reset();
    renderAll();
    switchSimple('admin', 'admin-pratiche');
    showToast(`Pratica ${pratica.code} creata e assegnata a ${team}.`);
  }

  async function changeOwnPassword() {
    if (!STATE.session) return;
    const currentPassword = prompt('Password attuale:');
    if (currentPassword === null) return;
    const newPassword = prompt('Nuova password (minimo 8 caratteri):');
    if (newPassword === null) return;
    if (String(newPassword).length < 8) return showToast('La nuova password deve avere almeno 8 caratteri.', 'warning');
    if (newPassword === '123') return showToast('Non puoi usare la vecchia password demo.', 'error');
    const confirmPassword = prompt('Conferma nuova password:');
    if (confirmPassword !== newPassword) return showToast('Le password non coincidono.', 'error');
    try {
      await window.CAF_CAE_API?.changePassword?.(currentPassword, newPassword);
      showToast('Password aggiornata. Rifai login con la nuova password.', 'success');
      try { await window.CAF_CAE_API?.logout?.(); } catch (_) {}
      STATE.session = null;
      localStorage.removeItem('caf_cae_v12_session');
      localStorage.removeItem('caf_cae_v11_session');
      localStorage.removeItem('caf_cae_v8_session');
      $('#appShell').classList.add('hidden');
      $('#loginOverlay').classList.remove('hidden');
    } catch (err) {
      showToast(err.message || 'Errore cambio password.', 'error');
    }
  }

  async function resetAdminUserPassword(id) {
    if (STATE.session?.role !== 'admin') return showToast('Solo admin può resettare password.', 'error');
    const u = STATE.users.find(x => x.id === id);
    if (!u) return showToast('Utente non trovato.', 'error');
    const password = prompt(`Nuova password per ${u.name || u.email} (minimo 8 caratteri):`);
    if (password === null) return;
    if (String(password).length < 8) return showToast('Password minima 8 caratteri.', 'warning');
    if (password === '123') return showToast('Non usare la vecchia password demo.', 'error');
    try {
      await window.CAF_CAE_API?.updateUserPassword?.(id, password);
      showToast('Password utente aggiornata nel backend.', 'success');
    } catch (err) {
      showToast(err.message || 'Errore reset password utente.', 'error');
    }
  }


  function submitAdminManualSale(e) {
    e.preventDefault();
    STATE.adminSales ||= [];
    const item = { id:`sale-admin-${Date.now()}`, date: $('#adminManualSaleDate')?.value || today(), title: $('#adminManualSaleTitle')?.value || 'Vendita manuale', source: $('#adminManualSaleSource')?.value || 'Admin', amount: toNum($('#adminManualSaleAmount')?.value), note: $('#adminManualSaleNote')?.value || '' };
    if (item.amount <= 0) return showToast('Inserisci importo vendita valido.', 'warning');
    STATE.adminSales.unshift(item);
    saveState(); e.target.reset(); renderAll(); showToast('Vendita manuale salvata.');
  }

  function submitAdminPromotion(e) {
    e.preventDefault();
    STATE.promotions ||= [];
    STATE.promotions.unshift({ id:`promo-${Date.now()}`, title:$('#promoTitle')?.value||'', targetRole:$('#promoTarget')?.value||'agent', level:$('#promoLevel')?.value||'info', message:$('#promoMessage')?.value||'', startDate:$('#promoStart')?.value||today(), endDate:$('#promoEnd')?.value||'', active:true, createdAt:today() });
    saveState(); e.target.reset(); renderAll(); showToast('Promozione/slide pubblicata.');
  }

  function submitAdminPopup(e) {
    e.preventDefault();
    STATE.popups ||= [];
    STATE.popups.unshift({ id:`popup-${Date.now()}`, title:$('#popupTitle')?.value||'', targetRole:$('#popupTarget')?.value||'all', message:$('#popupMessage')?.value||'', active:$('#popupActive')?.value !== 'false', createdAt:today() });
    saveState(); e.target.reset(); renderAll(); showToast('Popup salvato e condiviso.');
  }

  function submitAdminComplaint(e) {
    e.preventDefault();
    STATE.complaints ||= [];
    STATE.complaints.unshift({ id:`complaint-${Date.now()}`, date:today(), source:$('#complaintSource')?.value||'Admin', praticaCode:$('#complaintPratica')?.value||'', subject:$('#complaintSubject')?.value||'', message:$('#complaintMessage')?.value||'', status:'Open' });
    saveState(); e.target.reset(); renderAll(); showToast('Problema/reclamo registrato.');
  }

  function submitAdminPortalSettings(e) {
    e.preventDefault();
    STATE.portalSettings ||= {};
    Object.assign(STATE.portalSettings, { headerTheme: $('#portalHeaderTheme')?.value || 'cgn-blue', teamHeaderText: $('#portalTeamText')?.value || '', agentBannerText: $('#portalAgentText')?.value || '', globalPopupActive: $('#portalGlobalPopup')?.value === 'true', globalPopupTitle: $('#portalPopupTitle')?.value || '', globalPopupMessage: $('#portalPopupMessage')?.value || '' });
    saveState(); renderAll(); showToast('Impostazioni portali salvate.');
  }

  function editProductPrice(key) {
    const service = serviceByKey(key);
    if (!service) return;
    const cost = prompt(`Nuovo prezzo per ${service.title}:`, service.cost);
    if (cost === null) return;
    const commission = prompt(`Nuova commissione agente per ${service.title}:`, service.commission || 0);
    if (commission === null) return;
    const enabled = confirm('OK = servizio attivo, Annulla = servizio disattivato');
    STATE.productPrices ||= {};
    STATE.productPrices[key] = { cost: toNum(cost), commission: toNum(commission), enabled, updatedAt: today(), updatedBy: STATE.session?.email };
    saveState(); renderAll(); showToast('Prezzo servizio aggiornato.');
  }

  function adminAgentCredit(userId) {
    const u = STATE.users.find(x => x.id === userId); if (!u) return;
    const amount = prompt(`Importo credito da aggiungere/detrarre per ${u.name}. Usa negativo per scalare:`, '50');
    if (amount === null) return;
    const n = toNum(amount);
    if (!n) return showToast('Importo non valido.', 'warning');
    addWallet(u.email, n > 0 ? 'plus' : 'minus', Math.abs(n), `Admin credit adjustment ${STATE.session?.name || ''}`);
    showToast('Credito agente aggiornato.');
  }

  function adminAgentServices(userId) {
    const u = STATE.users.find(x => x.id === userId); if (!u) return;
    const current = agentAllowedKeys(u).join(',');
    const input = prompt('Servizi abilitati per agente. Lascia vuoto = tutti. Inserisci key separate da virgola (es. 730,isee,f24-compilazione):', current);
    if (input === null) return;
    const keys = input.split(',').map(x => x.trim()).filter(Boolean);
    u.serviceAccess = keys;
    STATE.servicePermissions ||= {};
    STATE.servicePermissions[u.email] = keys;
    saveState(); renderAll(); showToast(keys.length ? 'Servizi agente aggiornati.' : 'Agente abilitato a tutti i servizi.');
  }

  function adminBlockUser(userId) {
    const u = STATE.users.find(x => x.id === userId); if (!u || u.id === STATE.session?.id) return;
    if (u.active === false) { u.active = true; u.blockStatus = 'Active'; u.blockReason = ''; }
    else { u.active = false; u.blockStatus = 'Blocked'; u.blockReason = prompt('Motivo blocco utente/agent:', 'Bloccato da Admin') || 'Bloccato da Admin'; }
    window.CAF_CAE_API?.patch?.(`/api/admin/users/${encodeURIComponent(u.id)}`, { active: u.active, blockStatus: u.blockStatus, blockReason: u.blockReason }).catch(()=>{});
    saveState(); renderAll(); showToast(u.active ? 'Utente sbloccato.' : 'Utente bloccato.');
  }

  function adminPaySalary(userId) {
    const u = STATE.users.find(x => x.id === userId); if (!u) return;
    const amount = prompt(`Importo salary pagato a ${u.name}:`, u.salary || 0); if (amount === null) return;
    STATE.salaryPayments ||= [];
    STATE.salaryPayments.unshift({ id:`sal-${Date.now()}`, userId:u.id, userEmail:u.email, name:u.name, role:u.role, amount:toNum(amount), date:today(), status:'Paid', by:STATE.session?.name });
    saveState(); renderAll(); showToast('Pagamento salary registrato.');
  }

  function adminPayCommission(praticaId) {
    const p = STATE.pratiche.find(x => x.id === praticaId); if (!p) return;
    p.commissionStatus = 'Paid';
    STATE.commissionPayments ||= [];
    STATE.commissionPayments.unshift({ id:`com-${Date.now()}`, praticaId:p.id, code:p.code, agentEmail:p.agentEmail, amount:Number(p.commission||0), date:today(), status:'Paid', by:STATE.session?.name });
    saveState(); renderAll(); showToast('Commissione segnata come pagata.');
  }

  function initSignaturePad() {
    const canvas = $('#signaturePad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    const pos = e => {
      const rect = canvas.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      return { x: (point.clientX - rect.left) * (canvas.width / rect.width), y: (point.clientY - rect.top) * (canvas.height / rect.height) };
    };
    const start = e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.stroke(); STATE.signatureDataUrl = canvas.toDataURL('image/png'); $('#signatureState').textContent = 'Firmato'; updateLivePreview(); e.preventDefault(); };
    const end = () => { drawing = false; };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', end);
  }


  function initExtraSignaturePad() {
    const canvas = $('#signaturePad730'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); let drawing=false;
    const pos=e=>{ const rect=canvas.getBoundingClientRect(); const point=e.touches?e.touches[0]:e; return {x:(point.clientX-rect.left)*(canvas.width/rect.width), y:(point.clientY-rect.top)*(canvas.height/rect.height)}; };
    const start=e=>{drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault();};
    const move=e=>{ if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#111827'; ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.stroke(); STATE.signature730DataUrl=canvas.toDataURL('image/png'); $('#signature730State').textContent='Firmato'; e.preventDefault();};
    const end=()=>{drawing=false;};
    canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
    canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',end);
  }

  function clearCanvas(selector) { const c = $(selector); if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); }

  function clearSignatureCanvas() {
    const canvas = $('#signaturePad'); if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    STATE.signatureDataUrl = ''; updateLivePreview();
  }

  function initBanglaSignaturePad() {
    const canvas = $('#banglaSignaturePad'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); let drawing=false;
    const pos=e=>{ const rect=canvas.getBoundingClientRect(); const point=e.touches?e.touches[0]:e; return {x:(point.clientX-rect.left)*(canvas.width/rect.width), y:(point.clientY-rect.top)*(canvas.height/rect.height)}; };
    const start=e=>{drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault();};
    const move=e=>{ if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#111827'; ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.stroke(); STATE.banglaSignatureDataUrl=canvas.toDataURL('image/png'); $('#banglaSignatureState').textContent='Firmato'; updateBanglaPreview(); e.preventDefault();};
    const end=()=>{drawing=false;};
    canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
    canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',end);
    $('#clearBanglaSignatureBtn')?.addEventListener('click', () => { clearCanvas('#banglaSignaturePad'); STATE.banglaSignatureDataUrl=''; $('#banglaSignatureState').textContent='Non firmato'; updateBanglaPreview(); });
  }

  function bindEvents() {
    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.oldText = btn.innerHTML; btn.innerHTML = 'Accesso sicuro...'; }
      const u = await login($('#loginUser').value.trim(), $('#loginPass').value);
      if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.oldText || 'Entra nel portale'; }
      if (!u) { $('#loginError').textContent = 'Credenziali non valide o backend non raggiungibile.'; $('#loginError').classList.remove('hidden'); return; }
      $('#loginError').classList.add('hidden');
      setRoleDashboard();
      setTimeout(() => pullBackendState('login'), 120);
    });
    $('#btnLogout').addEventListener('click', async () => {
      try { await window.CAF_CAE_API?.logout?.(); } catch (_) {}
      STATE.session = null;
      localStorage.removeItem('caf_cae_v12_session');
      localStorage.removeItem('caf_cae_v11_session');
      localStorage.removeItem('caf_cae_v8_session');
      $('#appShell').classList.add('hidden');
      $('#loginOverlay').classList.remove('hidden');
      showToast('Logout effettuato.', 'warning');
    });
    $('#btnChangePassword')?.addEventListener('click', changeOwnPassword);

    $('#forgotPasswordBtn')?.addEventListener('click', async () => {
      const email = prompt('Inserisci email del tuo account CAF CAE:');
      if (!email) return;
      try {
        const data = await window.CAF_CAE_API?.forgotPassword?.(email.trim());
        if (data?.reset_url) prompt('Link reset temporaneo. Copialo e aprilo:', data.reset_url);
        showToast('Richiesta reset password registrata. Contatta Admin se non ricevi link.', 'success');
      } catch (err) {
        showToast('Non è stato possibile creare reset password.', 'error');
      }
    });
    document.body.addEventListener('click', e => {
      const service = e.target.closest('[data-service-key]'); if (service) { selectService(service.dataset.serviceKey); }
      const agentTab = e.target.closest('[data-agent-tab]'); if (agentTab) switchAgentTab(agentTab.dataset.agentTab);
      const commTab = e.target.closest('[data-comm-tab]'); if (commTab) switchSimple('comm', commTab.dataset.commTab);
      const banglaTab = e.target.closest('[data-bangla-tab]'); if (banglaTab) switchSimple('bangla', banglaTab.dataset.banglaTab);
      const italyTab = e.target.closest('[data-italy-tab]'); if (italyTab) switchSimple('italy', italyTab.dataset.italyTab);
      const adminTab = e.target.closest('[data-admin-tab]'); if (adminTab) switchSimple('admin', adminTab.dataset.adminTab);
      const detail = e.target.closest('[data-detail]'); if (detail) openDetail(detail.dataset.detail);
      const missingB = e.target.closest('[data-bangla-missing]'); if (missingB) askMissing(missingB.dataset.banglaMissing, 'bangla');
      const missingI = e.target.closest('[data-italy-missing]'); if (missingI) askMissing(missingI.dataset.italyMissing, 'italy');
      const sendI = e.target.closest('[data-send-italy]'); if (sendI) sendToItaly(sendI.dataset.sendItaly);
      const complete = e.target.closest('[data-complete]'); if (complete) completePratica(complete.dataset.complete);
      const approve = e.target.closest('[data-approve-credit]'); if (approve) approveCredit(approve.dataset.approveCredit);
      const solve = e.target.closest('[data-solve-ticket]'); if (solve) solveTicket(solve.dataset.solveTicket);
      const dl = e.target.closest('[data-download-doc]'); if (dl) downloadDoc(dl.dataset.downloadDoc);
      const dlp = e.target.closest('[data-download-pratica]'); if (dlp) downloadPratica(dlp.dataset.downloadPratica);
      const reqMod = e.target.closest('[data-request-modify]'); if (reqMod) requestModify(reqMod.dataset.requestModify);
      const startMod = e.target.closest('[data-start-modify]'); if (startMod) startModify(startMod.dataset.startModify);
      const approveMod = e.target.closest('[data-approve-modify]'); if (approveMod) approveModify(approveMod.dataset.approveModify);
      const fillClient = e.target.closest('[data-fill-client]'); if (fillClient) { switchAgentTab('agent-new'); $('#agentExistingClient').value = fillClient.dataset.fillClient; fillAgentClientFromSelect(); }
      const addDoc = e.target.closest('[data-add-docs]'); if (addDoc) addDocsPrompt(addDoc.dataset.addDocs);
      const editSt = e.target.closest('[data-edit-status]'); if (editSt) editStatusPrompt(editSt.dataset.editStatus);
      const payT = e.target.closest('[data-payment-toggle]'); if (payT) togglePayment(payT.dataset.paymentToggle);
      const cancelP = e.target.closest('[data-cancel-pratica]'); if (cancelP) cancelPratica(cancelP.dataset.cancelPratica);
      const receiptI = e.target.closest('[data-italy-receipt]'); if (receiptI) italyReceiptPrompt(receiptI.dataset.italyReceipt);
      const backB = e.target.closest('[data-back-bangla]'); if (backB) backToBangla(backB.dataset.backBangla);
      const resetUserPass = e.target.closest('[data-reset-user-pass]'); if (resetUserPass) resetAdminUserPassword(resetUserPass.dataset.resetUserPass);
      const toggle = e.target.closest('[data-toggle-user]'); if (toggle) { const u = STATE.users.find(x => x.id === toggle.dataset.toggleUser); if (u && u.id !== STATE.session.id) { u.active = !u.active; window.CAF_CAE_API?.patch?.(`/api/admin/users/${encodeURIComponent(u.id)}`, { active: u.active }).catch(() => showToast('Backend non aggiornato per stato user.', 'warning')); saveState(); renderAll(); } }
      const editProd = e.target.closest('[data-edit-product-price]'); if (editProd) editProductPrice(editProd.dataset.editProductPrice);
      const agentCredit = e.target.closest('[data-admin-agent-credit]'); if (agentCredit) adminAgentCredit(agentCredit.dataset.adminAgentCredit);
      const agentServices = e.target.closest('[data-admin-agent-services]'); if (agentServices) adminAgentServices(agentServices.dataset.adminAgentServices);
      const blockUser = e.target.closest('[data-admin-block-user]'); if (blockUser) adminBlockUser(blockUser.dataset.adminBlockUser);
      const paySalary = e.target.closest('[data-pay-salary]'); if (paySalary) adminPaySalary(paySalary.dataset.paySalary);
      const payCommission = e.target.closest('[data-pay-commission]'); if (payCommission) adminPayCommission(payCommission.dataset.payCommission);
      const delPromo = e.target.closest('[data-delete-promo]'); if (delPromo) { STATE.promotions = (STATE.promotions||[]).filter(x=>x.id!==delPromo.dataset.deletePromo); saveState(); renderAll(); }
      const delPopup = e.target.closest('[data-delete-popup]'); if (delPopup) { STATE.popups = (STATE.popups||[]).filter(x=>x.id!==delPopup.dataset.deletePopup); saveState(); renderAll(); }
      const closeComplaint = e.target.closest('[data-close-complaint]'); if (closeComplaint) { const c=(STATE.complaints||[]).find(x=>x.id===closeComplaint.dataset.closeComplaint); if(c)c.status='Closed'; saveState(); renderAll(); }
      const quad = e.target.closest('[data-quad]'); if (quad) { $$('.cgn-form-nav button').forEach(b => b.classList.remove('active')); quad.classList.add('active'); $$('.quad').forEach(q => q.classList.remove('active')); $(`#quad-${quad.dataset.quad}`).classList.add('active'); }
      const remove = e.target.closest('.remove-row'); if (remove) remove.closest('.cu-card,.family-card')?.remove();
    });
    $('#agentQuickNewBtn').addEventListener('click', () => { if (!STATE.selectedService) selectService('730', false); switchAgentTab('agent-new'); });
    $('#agentServiceSearch').addEventListener('input', renderServiceMenu);
    $('#agentApplicationForm').addEventListener('submit', submitAgentApplication);
    $('#creditRequestForm').addEventListener('submit', requestCredit);
    $('#companyForm').addEventListener('submit', submitCompany);
    $('#invoiceForm').addEventListener('submit', submitInvoice);
    $('#banglaOrderForm').addEventListener('submit', submitBanglaOrder);
    $('#adminUserForm').addEventListener('submit', submitAdminUser);
    $('#adminPraticaForm')?.addEventListener('submit', submitAdminPratica);
    $('#adminManualSaleForm')?.addEventListener('submit', submitAdminManualSale);
    $('#adminPromotionForm')?.addEventListener('submit', submitAdminPromotion);
    $('#adminPopupForm')?.addEventListener('submit', submitAdminPopup);
    $('#adminComplaintForm')?.addEventListener('submit', submitAdminComplaint);
    $('#adminPortalSettingsForm')?.addEventListener('submit', submitAdminPortalSettings);
    $('#adminSalesPeriod')?.addEventListener('change', renderAll);
    $('#clearSignatureBtn').addEventListener('click', () => { clearSignatureCanvas(); $('#signatureState').textContent = 'Non firmato'; });
    $('#agentDocUpload').addEventListener('change', () => { $('#uploadPreview').textContent = uploadedFiles().join(', ') || 'Nessun file caricato'; updateLivePreview(); });
    $('#t730_files').addEventListener('change', () => { $('#t730UploadPreview').textContent = uploadedFiles('#t730_files').join(', ') || 'Nessun documento'; });
    ['input', 'change'].forEach(ev => document.body.addEventListener(ev, e => { if (e.target.closest('#agentApplicationForm')) updateLivePreview(); if (e.target.closest('#agent730Form')) { const fn = `${$('#t730_last').value || ''} ${$('#t730_first').value || ''}`.trim(); $('#cgn730ClientTitle').textContent = fn || 'Nuovo contribuente'; } }));
    $('#addCuRow').addEventListener('click', () => addCuRow());
    $('#addFamilyRow').addEventListener('click', () => addFamilyRow());
    $('#calculate730Btn').addEventListener('click', render730Result);
    $('#submit730FromPanel').addEventListener('click', submit730Pratica);
    ['agent','comm','bangla','italy'].forEach(prefix => { const f = $(`#${prefix}TicketForm`); if (f) f.addEventListener('submit', e => submitTicket(prefix, e)); });
    const sf = $('#banglaSourceForm'); if (sf) sf.addEventListener('submit', addSource);
    const drf = $('#banglaDailyForm'); if (drf) drf.addEventListener('submit', submitDailyReport);
    $('#clearSignature730Btn')?.addEventListener('click', () => { const c=$('#signaturePad730'); if(c)c.getContext('2d').clearRect(0,0,c.width,c.height); STATE.signature730DataUrl=''; $('#signature730State').textContent='Non firmato'; });
    $('#closeDetailModal').addEventListener('click', () => $('#detailModal').classList.add('hidden'));
    $('#agentPraticheSearch').addEventListener('input', renderAgentPratiche);
    $('#agentClientSearch')?.addEventListener('input', renderAgentClients);
    $('#agentExistingClient')?.addEventListener('change', fillAgentClientFromSelect);
    $('#bnServiceSelect')?.addEventListener('change', () => { renderBanglaDocs(); updateBanglaPreview(); });
    $('#bnDocUpload')?.addEventListener('change', () => { $('#bnUploadPreview').textContent = banglaUploadedFiles().join(', ') || 'Nessun file'; updateBanglaPreview(); });
    ['input','change'].forEach(ev => document.body.addEventListener(ev, e => { if (e.target.closest('#banglaOrderForm')) updateBanglaPreview(); }));
  }


  /* ========================= v8 agent-only overrides ========================= */
  function fieldHtml(f) { const req=f.optional?'':'required'; const cls=f.optional?'':'required-star'; if(f.type==='textarea') return `<label class="form-span ${cls}">${f.label}<textarea data-service-field="${f.name}" ${req} placeholder="${f.placeholder||''}"></textarea></label>`; if(f.type==='select') return `<label class="${cls}">${f.label}<select data-service-field="${f.name}" ${req}>${(f.options||[]).map(o=>`<option>${o}</option>`).join('')}</select></label>`; return `<label class="${cls}">${f.label}<input data-service-field="${f.name}" type="${f.type||'text'}" ${req} placeholder="${f.placeholder||''}" /></label>`; }
  function renderDocChecklist(serviceTitle) { const list=CATALOG.checklists[serviceTitle]||CATALOG.checklists.default||[]; $('#docChecklist').innerHTML=list.map((d,idx)=>`<label class="doc-item"><input type="checkbox" data-doc-name="${safe(d)}" ${idx<3?'data-required-doc="1"':''} /><span><b>${safe(d)}</b><br><small>${idx<3?'obbligatorio':'se applicabile'}</small></span></label>`).join(''); }
  function validateRequiredServiceFields(){ const missing=[]; $$('#serviceSpecificArea [required]').forEach(el=>{ if(!String(el.value||'').trim()) missing.push(el.closest('label')?.innerText.replace('*','').trim()||el.dataset.serviceField); }); return missing; }
  function submitAgentApplication(e){ e.preventDefault(); const s=STATE.selectedService; if(!s) return showToast('Seleziona prima un servizio dal menu laterale.','warning'); if(!$('#delegaAccepted').checked||!$('#privacyAccepted').checked) return showToast('Serve accettazione delega e privacy.','warning'); if(!STATE.signatureDataUrl) return showToast('Serve firma cliente sul pad.','warning'); const client=collectBaseClient(); if(!client.cf||!client.lastName||!client.firstName||!client.phone) return showToast('Compila CF, cognome, nome e telefono cliente.','warning'); const missingFields=validateRequiredServiceFields(); if(missingFields.length) return showToast('Campi obbligatori mancanti: '+missingFields.slice(0,3).join(', '),'warning'); const editingId=$('#agentEditingPraticaId')?.value||STATE.editingPraticaId; const docsOk=checkedDocs(); const allMissing=allDocs().filter(d=>!docsOk.includes(d)); if(!editingId && agentCredit()<s.cost) return showToast(`Credito insufficiente. Hai ${money(agentCredit())}, servizio costa ${money(s.cost)}. Richiedi credito ad admin.`,'error'); const payload={source:'agent',group:s.group,serviceKey:s.key,serviceTitle:s.title,client,agentEmail:STATE.session.email,agentName:STATE.session.name,routeTeam:'bangla',assignedTeam:'bangla',status:allMissing.length?'Documenti mancanti':'Nuova',paymentStatus:'In attesa pagamento',documentStatus:allMissing.length?'Documenti mancanti':'Documenti ricevuti',cost:s.cost,commission:s.commission,commissionStatus:'Pending',missingDocs:allMissing,checkedDocs:docsOk,uploads:uploadedFiles(),teamMessage:allMissing.length?`Mancano: ${allMissing.join(', ')}`:'Domanda ricevuta. In controllo Team Bangla.',serviceData:{...collectServiceData(),clientReference:$('#agentClientReference')?.value||'',priority:$('#agentPriority')?.value||'Normale'},delega:true,privacy:true,signature:true,signatureDataUrl:STATE.signatureDataUrl,generatedDocs:['delega-pdf','ricevuta-pdf'],deadline:$('[data-service-field="deadline"]')?.value||today(),updatedAt:today()}; if(editingId){ const p=STATE.pratiche.find(x=>x.id===editingId); if(!p) return showToast('Pratica da modificare non trovata.','error'); Object.assign(p,payload); p.teamHistory ||= []; p.teamHistory.unshift({by:STATE.session.name,role:'agent',action:'Pratica modificata dopo autorizzazione',date:today()}); const r=(STATE.modifyRequests||[]).find(x=>x.praticaId===editingId&&x.status==='Approved'); if(r) r.status='Used'; $('#agentEditingPraticaId').value=''; STATE.editingPraticaId=null; upsertAgentClient(client,p); showToast(`Pratica ${p.code} modificata e reinviata.`); } else { const code=makeCode(s.group,s.key); const pratica={id:`p-${Date.now()}`,code,...payload,createdAt:today(),teamHistory:[{by:STATE.session.name,role:'agent',action:'Domanda creata e inviata',date:today()}]}; STATE.pratiche.unshift(pratica); addWallet(STATE.session.email,'minus',s.cost,`Creazione ${s.title} ${code}`); upsertAgentClient(client,pratica); showToast(`Domanda ${code} inviata. Credito scalato ${money(s.cost)}.`); } saveState(); e.target.reset(); STATE.signatureDataUrl=''; $('#signatureState').textContent='Non firmato'; clearSignatureCanvas(); renderAll(); switchAgentTab('agent-pratiche'); }
  function submit730Pratica(){ const s=serviceByKey('730'); const data=build730(); if(!data.client.cf||!data.client.lastName||!data.client.firstName||!data.client.phone) return showToast('Compila Frontespizio 730: CF, cognome, nome e cellulare.','warning'); if(!data.delega||!data.privacy||!$('#t730_firma_elettronica')?.checked) return showToast('Serve delega, privacy e autorizzazione firma elettronica 730.','warning'); if(!STATE.signature730DataUrl) return showToast('Serve firma cliente 730.','warning'); const editingId=STATE.editingPraticaId||''; if(!editingId && agentCredit()<s.cost) return showToast('Credito agente insufficiente per creare 730.','error'); const result=render730Result(); const payload={source:'agent',group:'CAF',serviceKey:'730',serviceTitle:'Modello 730',client:data.client,agentEmail:STATE.session.email,agentName:STATE.session.name,routeTeam:'bangla',assignedTeam:'bangla',status:'Nuova',paymentStatus:'In attesa pagamento',documentStatus:data.uploads.length?'Documenti ricevuti':'Documenti mancanti',cost:s.cost,commission:s.commission,commissionStatus:'Pending',missingDocs:data.uploads.length?[]:['CU / CUD','Documento identita','Delega firmata'],uploads:data.uploads,teamMessage:'730 creato da agente. Primo controllo Team Bangla.',serviceData:data,internal730:result,delega:true,privacy:true,signature:true,generatedDocs:['delega-730-pdf','ricevuta-730-pdf','f24-pdf','modello-730-pdf'],signature730DataUrl:STATE.signature730DataUrl||'',deadline:$('#t730_f24_due')?.value||today(),updatedAt:today()}; if(editingId){ const p=STATE.pratiche.find(x=>x.id===editingId); if(!p) return showToast('Pratica 730 da modificare non trovata.','error'); Object.assign(p,payload); p.teamHistory||=[]; p.teamHistory.unshift({by:STATE.session.name,role:'agent',action:'730 modificato dopo autorizzazione',date:today()}); STATE.editingPraticaId=null; const r=(STATE.modifyRequests||[]).find(x=>x.praticaId===editingId&&x.status==='Approved'); if(r) r.status='Used'; upsertAgentClient(data.client,p); showToast(`730 ${p.code} modificato e reinviato.`); } else { const code=makeCode('CAF','730'); const pratica={id:`p-${Date.now()}`,code,...payload,createdAt:today(),teamHistory:[{by:STATE.session.name,role:'agent',action:'730 creato e inviato',date:today()}]}; STATE.pratiche.unshift(pratica); addWallet(STATE.session.email,'minus',s.cost,`Creazione Modello 730 ${code}`); upsertAgentClient(data.client,pratica); showToast(`730 ${code} creato e inviato.`); } saveState(); renderAll(); switchAgentTab('agent-pratiche'); }
  function openDetail(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; const role=STATE.session?.role; const receiptHtml=p.receiptLink?previewLine('Ricevuta Italy',`<a href="${p.receiptLink}" target="_blank" rel="noopener">Apri ricevuta</a>`):''; const history=(p.teamHistory||[]).map(h=>`<div class="timeline-item"><span>${safe(h.date)}</span><div><b>${safe(h.action)}</b><div class="meta">${safe(h.by||'--')} · ${safe(h.role||'--')}</div></div></div>`).join('')||'<div class="meta">Nessuna attivita registrata</div>'; const docs=(p.uploads||[]).map(d=>`<div class="doc-tile"><i class="fa-solid fa-file-pdf"></i>${safe(d)}<br><button class="link-btn" data-preview-doc="${safe(d)}">preview</button></div>`).join('')||'<div class="doc-tile">Nessun documento caricato</div>'; let actions=`<button class="btn orange" data-download-pratica="${p.id}">Scarica fascicolo PDF</button><button class="btn light" data-download-doc="delega-${p.id}">Delega PDF</button><button class="btn light" data-download-doc="ricevuta-${p.id}">Ricevuta PDF</button>`; if(role==='agent'){ const approved=(STATE.modifyRequests||[]).some(r=>r.praticaId===p.id&&r.agentEmail===STATE.session.email&&r.status==='Approved'); actions+=`<button class="btn light" data-request-modify="${p.id}">Richiedi modifica</button>${approved?`<button class="btn green" data-start-modify="${p.id}">Modifica pratica</button>`:''}<button class="btn light" data-add-docs="${p.id}">Aggiungi docs</button>`; } else { actions+=`<button class="btn light" data-add-docs="${p.id}">Aggiungi docs</button><button class="btn light" data-edit-status="${p.id}">Modifica stato</button><button class="btn orange" data-bangla-missing="${p.id}">Richiedi mancanti</button><button class="btn green" data-send-italy="${p.id}">Invia Italy</button><button class="btn green" data-complete="${p.id}">Completa</button><button class="btn light" data-payment-toggle="${p.id}">Pagamento</button><button class="btn red" data-cancel-pratica="${p.id}">Annulla/Rimborso</button>`; } $('#detailModalBody').innerHTML=`<h2>${safe(p.code)}</h2><p>${statusChip(p.status)} ${statusChip(p.documentStatus)} ${statusChip(p.paymentStatus)}</p><div class="status-banner">${safe(p.teamMessage||'Nessun messaggio team')}</div><div class="document-preview">${previewLine('Cliente',safe(fullName(p.client)))}${previewLine('CF',safe(p.client.cf||'--'))}${previewLine('Email',safe(p.client.email||'--'))}${previewLine('Telefono',safe(p.client.phone||'--'))}${previewLine('Servizio',safe(p.serviceTitle))}${previewLine('Source',safe(p.source))}${previewLine('Team',safe(p.assignedTeam||'--'))}${previewLine('Deadline',safe(p.deadline||'--'))}${previewLine('Mancanti',safe((p.missingDocs||[]).join(', ')||'--'))}${receiptHtml}${p.internal730?previewLine('730 risultato',`${safe(p.internal730.type)} ${money(p.internal730.total)} · giugno ${money(p.internal730.june)} · novembre ${money(p.internal730.november)}`):''}</div><h3>Documenti caricati / preview</h3><div class="doc-list-preview">${docs}</div><div class="doc-actions">${actions}</div><div class="white-card"><h3>Storico pratica</h3><div class="timeline-list">${history}</div></div>`; $('#detailModal').classList.remove('hidden'); }
  function requestModify(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; const reason=prompt('Motivo modifica richiesta (es. CF sbagliato, documento mancante, dato errato):','Correzione dati/documenti pratica'); if(!reason) return; STATE.modifyRequests||=[]; STATE.modifyRequests.unshift({id:`mr-${Date.now()}`,praticaId:p.id,praticaCode:p.code,agentEmail:STATE.session.email,agentName:STATE.session.name,reason,status:'Pending',adminNote:'In attesa permesso admin/team',date:today()}); p.teamHistory||=[]; p.teamHistory.unshift({by:STATE.session.name,role:'agent',action:'Richiesta modifica inviata: '+reason,date:today()}); saveState(); renderAll(); showToast('Richiesta modifica inviata ad Admin/Team.'); }
  function approveModify(id){ const r=(STATE.modifyRequests||[]).find(x=>x.id===id); if(!r) return; r.status='Approved'; r.adminNote=prompt('Nota approvazione modifica:','Permesso concesso. Puoi correggere e reinviare.')||'Permesso concesso.'; const p=STATE.pratiche.find(x=>x.id===r.praticaId); if(p){p.teamHistory||=[]; p.teamHistory.unshift({by:STATE.session.name,role:STATE.session.role,action:'Modifica approvata per agente',date:today()});} saveState(); renderAll(); showToast('Modifica approvata.'); }
  function startModify(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; const ok=(STATE.modifyRequests||[]).some(r=>r.praticaId===id&&r.agentEmail===STATE.session.email&&r.status==='Approved'); if(STATE.session.role==='agent'&&!ok) return showToast('Serve permesso Admin/Team prima di modificare.','warning'); STATE.editingPraticaId=id; if(p.serviceKey==='730'){fill730FromPratica(p); switchAgentTab('agent-730');} else {selectService(p.serviceKey,false); fillGenericFormFromPratica(p); switchAgentTab('agent-new');} $('#detailModal').classList.add('hidden'); showToast('Modalita modifica attiva. Correggi e clicca Invia domanda.'); }
  function fillGenericFormFromPratica(p){ const c=p.client||{}; $('#agentEditingPraticaId').value=p.id; const map={clientCF:'cf',clientLastName:'lastName',clientFirstName:'firstName',clientSex:'sex',clientDob:'dob',clientBirthPlace:'birthPlace',clientBirthProvince:'birthProvince',clientNationality:'nationality',clientMarital:'marital',clientCity:'city',clientProvince:'province',clientCap:'cap',clientStreetType:'streetType',clientAddress:'address',clientStreetNo:'streetNo',clientPhone:'phone',clientEmail:'email',clientIban:'iban'}; Object.entries(map).forEach(([id,k])=>{const el=$('#'+id); if(el&&c[k]!==undefined) el.value=c[k];}); Object.entries(p.serviceData||{}).forEach(([k,v])=>{const el=$(`[data-service-field="${k}"]`); if(el) el.value=v;}); $('#delegaAccepted').checked=true; $('#privacyAccepted').checked=true; updateLivePreview(); }
  function fill730FromPratica(p){ const c=p.client||{}; const map={t730_cf:'cf',t730_last:'lastName',t730_first:'firstName',t730_sex:'sex',t730_dob:'dob',t730_birth:'birthPlace',t730_birthProv:'birthProvince',t730_marital:'marital',t730_city:'city',t730_prov:'province',t730_cap:'cap',t730_streetType:'streetType',t730_address:'address',t730_no:'streetNo',t730_phone:'phone',t730_email:'email'}; Object.entries(map).forEach(([id,k])=>{const el=$('#'+id); if(el&&c[k]!==undefined) el.value=c[k];}); $('#t730_delega').checked=true; $('#t730_privacy').checked=true; $('#t730_firma_elettronica').checked=true; }
  function downloadBlob(name,bytes,type='application/pdf'){ const blob=new Blob([bytes],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  async function makeSimplePdf(p,kind='ricevuta'){ if(!window.PDFLib) throw new Error('PDFLib not loaded'); const {PDFDocument,StandardFonts,rgb}=window.PDFLib; const pdf=await PDFDocument.create(); const page=pdf.addPage([595,842]); const font=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); const draw=(t,x,y,size=10,f=font,color=rgb(0,0,0))=>page.drawText(String(t||''),{x,y,size,font:f,color}); const client=p.client||{}; const isInps=/naspi|pensione|invalid|assegno|maternita|dis-coll|patronato|inps/i.test(p.serviceTitle||''); const isEntrate=/730|isee|f24|imu|redditi|affitto|successione|agenzia/i.test(p.serviceTitle||''); page.drawRectangle({x:0,y:795,width:595,height:47,color:rgb(0.18,0.47,0.67)}); draw('CAF CAE',40,812,18,bold,rgb(1,1,1)); draw(isInps?'Ricevuta stile INPS/Patronato':isEntrate?'Ricevuta fiscale / Agenzia Entrate':'Ricevuta pratica',350,815,11,bold,rgb(1,1,1)); draw(kind==='delega'?'DELEGA E MANDATO DI ASSISTENZA':'RICEVUTA DI PRESENTAZIONE DOMANDA',40,760,18,bold); draw(`Codice pratica: ${p.code||'BOZZA'}`,40,735,11,bold); draw(`Data: ${today()}`,420,735,10); let y=705; const line=(a,b)=>{draw(a,48,y,9,bold); draw(b||'--',220,y,9); y-=22;}; line('Cliente',fullName(client)); line('Codice fiscale',client.cf); line('Telefono',client.phone); line('Email',client.email); line('Servizio',p.serviceTitle); line('Stato pratica',p.status||'Bozza'); line('Documenti',(p.uploads||[]).join(', ')||'Da allegare'); y-=10; if(kind==='delega'){ draw('Il cliente conferisce mandato a CAF CAE e agli incaricati autorizzati per raccogliere documenti,',48,y,9); y-=14; draw('predisporre la pratica, richiedere integrazioni, gestire ricevute e comunicazioni collegate al servizio.',48,y,9); y-=14; draw('Il cliente accetta informativa privacy e trattamento dati necessari per la pratica.',48,y,9); y-=30; } else { draw('La domanda e i documenti sono stati ricevuti dalla piattaforma CAF CAE per il controllo operativo.',48,y,9); y-=18; draw('La pratica sara verificata dal team abilitato prima dell invio o completamento ufficiale.',48,y,9); y-=30; } if(p.internal730){draw(`Risultato 730 interno: ${p.internal730.type} ${money(p.internal730.total)} - Giugno ${money(p.internal730.june)} - Novembre ${money(p.internal730.november)}`,48,y,10,bold,rgb(0.02,0.45,0.2)); y-=28;} draw('Firma cliente',48,160,10,bold); page.drawLine({start:{x:48,y:145},end:{x:250,y:145},thickness:1,color:rgb(0,0,0)}); draw('Firma operatore / CAF CAE',330,160,10,bold); page.drawLine({start:{x:330,y:145},end:{x:535,y:145},thickness:1,color:rgb(0,0,0)}); draw('Documento generato automaticamente dalla piattaforma CAF CAE.',48,70,8); return pdf.save(); }
  async function make730TemplatePdf(p){ if(!window.PDFLib) throw new Error('PDFLib not loaded'); const {PDFDocument,StandardFonts,rgb}=window.PDFLib; const src=await fetch('assets/730_modello_2026.pdf').then(r=>r.arrayBuffer()); const pdf=await PDFDocument.load(src); const font=await pdf.embedFont(StandardFonts.HelveticaBold); const draw=(pageIndex,t,x,y,size=9)=>{const pg=pdf.getPage(pageIndex); pg.drawText(String(t||''),{x,y,size,font,color:rgb(0,0,0)});}; const c=p.client||{}; const sd=p.serviceData||{}; const r=p.internal730||calc730(sd); draw(0,c.cf,235,735,9); draw(0,c.lastName,155,682,9); draw(0,c.firstName,360,682,9); draw(0,c.sex||'M',520,682,9); draw(0,c.dob||'',150,647,9); draw(0,c.birthPlace||'',270,647,9); draw(0,c.birthProvince||'',520,647,9); draw(0,c.city||'',235,567,9); draw(0,c.province||'',455,567,9); draw(0,c.cap||'',500,567,9); draw(0,[c.streetType,c.address,c.streetNo].filter(Boolean).join(' '),160,527,9); draw(0,c.phone||'',205,470,9); draw(0,c.email||'',355,470,8); const cu=sd.cu||[]; cu.slice(0,3).forEach((row,i)=>{const y=500-(i*24); draw(1,row.type||'1',80,y,8); draw(1,String(row.income||''),210,y,8); draw(1,String(row.days||''),465,y-85,8);}); const wt=(cu||[]).reduce((s,x)=>s+Number(x.withheld||0),0); draw(1,String(Math.round(wt)),150,360,8); const ex=sd.expenses||{}; draw(2,ex.medical||'',130,728,8); draw(2,ex.mortgage||'',130,625,8); draw(2,ex.contrib||'',145,435,8); draw(16,r.type==='Debito'?String(r.june||0):'',440,628,9); draw(16,r.type==='Credito'?String(r.total||0):'',440,560,9); draw(16,r.november?String(r.november):'',510,628,9); if(r.type==='Debito'){ draw(16,'4001',180,380,8); draw(16,'2025',230,380,8); draw(16,String(r.june||0),480,380,8); if(r.november){draw(16,'4034',180,220,8); draw(16,'2026',230,220,8); draw(16,String(r.november),480,220,8);} } return pdf.save(); }
  async function downloadDoc(type){ try{ const idMatch=String(type||'').match(/(delega|ricevuta)-(.+)/); const p=idMatch?STATE.pratiche.find(x=>x.id===idMatch[2]||x.code===idMatch[2]):null; const pratica=p||{code:'BOZZA',serviceTitle:'Modello 730',client:build730().client,serviceData:build730(),internal730:calc730(),uploads:uploadedFiles('#t730_files'),signature730DataUrl:STATE.signature730DataUrl}; if(String(type).includes('modello-730-auto')) return downloadBlob(`Modello-730-auto-${pratica.code}.pdf`,await make730TemplatePdf(pratica)); if(String(type).includes('f24')) return downloadBlob(`F24-bozza-${pratica.code}.pdf`,await makeSimplePdf(pratica,'f24')); if(String(type).includes('delega')) return downloadBlob(`Delega-${pratica.code}.pdf`,await makeSimplePdf(pratica,'delega')); return downloadBlob(`Ricevuta-${pratica.code}.pdf`,await makeSimplePdf(pratica,'ricevuta')); } catch(err){ console.error(err); downloadHtml(`${type}-${Date.now()}.html`,docHtml(type)); showToast('PDFLib non disponibile: generato HTML stampabile come fallback.','warning'); } }
  async function downloadPratica(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; try{downloadBlob(`${p.code}-fascicolo.pdf`,await makeSimplePdf(p,'ricevuta'));} catch(err){downloadHtml(`${p.code}-fascicolo.html`,docHtml('fascicolo-pratica',p));} }



  /* ========================= v9 agent-focused form/pipeline upgrades ========================= */
  function v9AgencyForService(service){
    const t = `${service?.group||''} ${service?.title||''} ${service?.special||''}`.toLowerCase();
    if(/naspi|pensione|invalid|assegno|matern|dis-coll|inps|patronato|did|dimission/.test(t)) return {key:'inps', label:'INPS / Patronato', icon:'fa-building-columns'};
    if(/730|isee|f24|imu|redditi|affitto|successione|agenzia|rli|cu/.test(t)) return {key:'ade', label:'Agenzia Entrate / CAF', icon:'fa-file-invoice'};
    if(/immig|soggiorno|cittadin|flussi|asilo|questura|prefettura/.test(t)) return {key:'imm', label:'Immigrazione / Questura', icon:'fa-passport'};
    if(/azienda|partita|camera|scia|licenza|suap|ateco/.test(t)) return {key:'comune', label:'SUAP / Camera Commercio', icon:'fa-building'};
    if(/academy|corso|esame|studente/.test(t)) return {key:'academy', label:'CAF CAE Academy', icon:'fa-graduation-cap'};
    return {key:'comune', label:'Comune / CAF CAE', icon:'fa-landmark'};
  }
  function v9EnsureNews(){
    STATE.newsSlides ||= [
      {id:'ns1',targetRole:'agent',title:'Campagna 730/2026',message:'Controlla CU, delega, privacy, firma e documenti prima di inviare la domanda.',level:'Importante',icon:'fa-file-invoice-dollar',active:true,date:today()},
      {id:'ns2',targetRole:'agent',title:'Documenti mancanti',message:'Se Team Bangla o Team Italy richiede integrazioni, apri la pratica e carica subito i file richiesti.',level:'Operativo',icon:'fa-folder-open',active:true,date:today()},
      {id:'ns3',targetRole:'agent',title:'Credito agente',message:'Ogni domanda scala automaticamente il credito. Se il saldo è basso, richiedi ricarica ad Admin.',level:'Credito',icon:'fa-wallet',active:true,date:today()}
    ];
  }
  function v9RenderAgentNews(){
    if(STATE.session?.role!=='agent') return;
    v9EnsureNews();
    const home=$('#agent-home'); if(!home) return;
    let slider=$('#agentNewsSlider');
    if(!slider){
      slider=document.createElement('div'); slider.id='agentNewsSlider'; slider.className='agent-news-slider';
      const kpi=home.querySelector('.kpi-row'); kpi?.insertAdjacentElement('afterend',slider);
    }
    const slides=STATE.newsSlides.filter(n=>n.active!==false && (!n.targetRole || ['agent','all'].includes(n.targetRole)));
    slider.innerHTML=(slides.map((n,i)=>`<div class="agent-news-slide ${i===0?'active':''}" data-news-slide="${i}"><div class="agent-news-img"><i class="fa-solid ${safe(n.icon||'fa-bullhorn')}"></i></div><div><h3>${safe(n.title)}</h3><p>${safe(n.message)}</p></div><span class="chip ${/importante|urgent/i.test(n.level)?'orange':'green'}">${safe(n.level||'News')}</span></div>`).join('')||'<div class="agent-news-slide active"><div class="agent-news-img"><i class="fa-solid fa-bullhorn"></i></div><div><h3>Nessun avviso</h3><p>Admin può pubblicare news e notice per gli agenti.</p></div></div>')+`<div class="news-dots">${slides.map((_,i)=>`<button class="${i===0?'active':''}" data-news-dot="${i}" type="button"></button>`).join('')}</div>`;
  }
  function v9RenderAdminNewsTools(){
    if(STATE.session?.role!=='admin') return;
    v9EnsureNews();
    const box=$('#adminSourcesList'); if(!box) return;
    const html=`<div class="news-admin-form"><h3>News slider agenti</h3><form id="adminNewsForm" class="form-grid cols-2"><label>Titolo news <input id="adminNewsTitle" placeholder="Es. Scadenza 730"></label><label>Livello <select id="adminNewsLevel"><option>Info</option><option>Importante</option><option>Urgente</option><option>Credito</option></select></label><label class="form-span">Messaggio <textarea id="adminNewsMessage" placeholder="Testo visibile nel dashboard agente"></textarea></label><button class="btn orange form-span">Pubblica news agenti</button></form></div>`;
    const list=(STATE.newsSlides||[]).map(n=>`<div class="flat-item"><div><div class="title">${safe(n.title)} · ${safe(n.level)}</div><div class="meta">${safe(n.message)}<br>Target: ${safe(n.targetRole||'agent')} · Data: ${safe(n.date||'--')}</div></div><button class="btn red" data-delete-news="${safe(n.id)}">Elimina</button></div>`).join('');
    box.innerHTML=html+list+box.innerHTML;
  }
  const v9_oldRenderAll = renderAll;
  renderAll = function(){ v9_oldRenderAll(); v9RenderAgentNews(); v9RenderAdminNewsTools(); };
  const v9_oldRenderAgentDashboard = renderAgentDashboard;
  renderAgentDashboard = function(){ v9_oldRenderAgentDashboard(); v9RenderAgentNews(); };

  function v9ServiceFields(service){
    const raw = CATALOG.serviceForms[service.special] || CATALOG.serviceForms[service.key] || CATALOG.serviceForms.default || [];
    return raw.filter(f=>f.name!=='paymentMode').map(f=>({...f, optional: !!f.optional}));
  }
  function v9ExtraRequiredFields(service){
    const a=v9AgencyForService(service).key;
    if(a==='inps') return [
      {name:'protocolloInps',label:'Protocollo INPS se già presente',type:'text',optional:true,help:'Lascia vuoto se nuova domanda'},
      {name:'sedeCompetente',label:'Sede competente / Comune',type:'text'},
      {name:'dataEvento',label:'Data evento/domanda',type:'date'},
      {name:'ibanPagamento',label:'IBAN pagamento/prestazione',type:'text'}
    ];
    if(a==='ade') return [
      {name:'annoFiscale',label:'Anno fiscale',type:'select',options:['2026','2025','2024']},
      {name:'sostitutoPresente',label:'Sostituto / datore presente',type:'select',options:['Sì','No','Da verificare']},
      {name:'rimborsoDebito',label:'Credito/Debito previsto',type:'select',options:['Da calcolare','Credito','Debito','Zero']},
      {name:'rateRichieste',label:'Rate F24 se debito',type:'select',options:['1','2','3','4','5','6','7']}
    ];
    if(a==='imm') return [
      {name:'permessoTipo',label:'Tipo titolo/pratica',type:'text'},
      {name:'numeroPassaporto',label:'Passaporto n.',type:'text'},
      {name:'scadenzaTitolo',label:'Scadenza permesso/ricevuta',type:'date'},
      {name:'questuraPrefettura',label:'Questura / Prefettura',type:'text'}
    ];
    if(a==='academy') return [
      {name:'studentEmail',label:'Email studente',type:'email'},
      {name:'courseOrExam',label:'Corso / Esame',type:'text'},
      {name:'startDate',label:'Data corso/esame',type:'date'},
      {name:'studentPassword',label:'Password / accesso',type:'text',optional:true}
    ];
    return [
      {name:'enteCompetente',label:'Ente/Comune competente',type:'text'},
      {name:'tipoPraticaComune',label:'Tipo pratica',type:'text'},
      {name:'dataRichiesta',label:'Data richiesta/appuntamento',type:'date'},
      {name:'protocolloEsterno',label:'Protocollo esterno',type:'text',optional:true}
    ];
  }
  fieldHtml = function(f){
    const req = f.optional ? '' : 'data-required="1"';
    const cls = f.optional ? '' : 'required-star';
    const help = f.help ? `<div class="field-help">${safe(f.help)}</div>` : '';
    if(f.type==='textarea') return `<label class="form-span ${cls}">${safe(f.label)}<textarea data-service-field="${safe(f.name)}" ${req} placeholder="${safe(f.placeholder||'')}"></textarea>${help}</label>`;
    if(f.type==='select') return `<label class="${cls}">${safe(f.label)}<select data-service-field="${safe(f.name)}" ${req}>${(f.options||[]).map(o=>`<option>${safe(o)}</option>`).join('')}</select>${help}</label>`;
    return `<label class="${cls}">${safe(f.label)}<input data-service-field="${safe(f.name)}" type="${safe(f.type||'text')}" ${req} placeholder="${safe(f.placeholder||'')}" />${help}</label>`;
  };
  function v9BuildGenericFormSections(service){
    const agency=v9AgencyForService(service);
    const specific=[...v9ExtraRequiredFields(service),...v9ServiceFields(service)];
    const docs=(CATALOG.checklists[service.title]||CATALOG.checklists.default||[]);
    return `
      <div class="service-cgn-shell">
        <aside class="service-step-nav">
          <button type="button" class="active" data-service-step="svc-dati"><span>1. Dati domanda</span></button>
          <button type="button" data-service-step="svc-requisiti"><span>2. Requisiti</span></button>
          <button type="button" data-service-step="svc-docs"><span>3. Documenti</span></button>
          <button type="button" data-service-step="svc-delega"><span>4. Delega/Firma</span></button>
          <button type="button" data-service-step="svc-pay"><span>5. Credito agente</span></button>
          <button type="button" data-service-step="svc-preview"><span>6. Anteprima</span></button>
        </aside>
        <div class="service-step-main">
          <div class="service-blue-head"><h3>${safe(service.title)}</h3><span class="cost-badge">${money(service.cost)}</span></div>
          <section id="svc-dati" class="service-step-panel active">
            <div class="agency-band"><span class="agency-badge ${agency.key}"><i class="fa-solid ${agency.icon}"></i>${agency.label}</span><span>Domanda ${safe(service.key)} · solo campi utili per questo servizio</span></div>
            <h3>Dati specifici obbligatori</h3><p class="service-subtitle">Compila solo i dati necessari per questa pratica. I campi con * sono obbligatori.</p>
            <div class="form-grid cols-3">${specific.map(fieldHtml).join('')}</div>
          </section>
          <section id="svc-requisiti" class="service-step-panel">
            <h3>Requisiti e controllo preliminare</h3><p class="service-subtitle">Questa parte aiuta Team Bangla/Italy a capire subito se la domanda è lavorabile.</p>
            <div class="form-grid cols-3">
              ${fieldHtml({name:'requisitiVerificati',label:'Requisiti verificati',type:'select',options:['Da verificare','Sì','No / dubbio']})}
              ${fieldHtml({name:'noteRequisiti',label:'Note requisiti',type:'textarea',placeholder:'Scrivi dubbi, spiegazioni cliente, situazione particolare...'})}
              ${fieldHtml({name:'deadline',label:'Scadenza / appuntamento',type:'date'})}
            </div>
            <div class="cgn-tip">Suggerimento: se mancano dati, invia comunque la pratica solo quando hai almeno cliente, firma, privacy e documenti principali.</div>
          </section>
          <section id="svc-docs" class="service-step-panel">
            <h3>Documenti richiesti</h3><p class="service-subtitle">Checklist base per ${safe(service.title)}. I primi documenti sono trattati come prioritari.</p>
            <div class="doc-mini-info"><b>Documenti previsti:</b> ${docs.map(safe).join(' · ')}</div>
            <div class="receipt-trust-box"><h4>Regola pratica</h4>Carica documenti leggibili. Se il team trova errore o manca qualcosa, l'agente riceve notifica nella pratica e in Avvisi.</div>
          </section>
          <section id="svc-delega" class="service-step-panel">
            <h3>Delega, privacy e firma cliente</h3><p class="service-subtitle">La delega generata è PDF professionale di 2 pagine con firma cliente.</p>
            <div class="form-grid cols-3">
              ${fieldHtml({name:'luogoFirma',label:'Luogo firma',type:'text',placeholder:'Firenze'})}
              ${fieldHtml({name:'dataFirma',label:'Data firma',type:'date'})}
              ${fieldHtml({name:'tipoFirma',label:'Tipo firma',type:'select',options:['Firma su pad','Firma su carta','Firma ricevuta WhatsApp']})}
            </div>
            <div class="two-page-doc-note">Dopo invio, apri la pratica e scarica <b>Delega PDF</b> o <b>Ricevuta PDF</b>.</div>
          </section>
          <section id="svc-pay" class="service-step-panel">
            <h3>Pagamento tramite credito agente</h3><p class="service-subtitle">Nessun altro pagamento nel form agente. Il sistema scala automaticamente il credito.</p>
            <div class="payment-credit-only">
              <div class="paybox"><span>Pagamento</span><strong>Credito agente</strong></div>
              <div class="paybox"><span>Costo servizio</span><strong>${money(service.cost)}</strong></div>
              <div class="paybox"><span>Credito disponibile</span><strong>${money(agentCredit())}</strong></div>
            </div>
            <input type="hidden" data-service-field="paymentMode" value="Credito agente" />
          </section>
          <section id="svc-preview" class="service-step-panel">
            <h3>Anteprima prima dell'invio</h3><div id="genericServicePreview" class="generic-preview-card"></div>
          </section>
          <div class="form-wizard-actions"><button class="btn light" type="button" data-step-prev>Indietro</button><button class="btn blue" type="button" data-step-next>Avanti</button></div>
        </div>
      </div>`;
  }
  renderServiceSpecificForm = function(service){
    const area=$('#serviceSpecificArea'); if(!area) return;
    area.innerHTML = v9BuildGenericFormSections(service);
    v9UpdateServiceStepState();
  };
  renderDocChecklist = function(serviceTitle){
    const list=CATALOG.checklists[serviceTitle]||CATALOG.checklists.default||[];
    $('#docChecklist').innerHTML=list.map((d,idx)=>`<label class="doc-item"><input type="checkbox" data-doc-name="${safe(d)}" ${idx<3?'data-required-doc="1"':''} /><span><b>${safe(d)}</b><br><small>${idx<3?'prioritario':'se applicabile'}</small></span></label>`).join('');
  };
  const v9_oldSelectService = selectService;
  selectService = function(key, openTab=true){
    const service=serviceByKey(key); if(!service) return;
    STATE.selectedService=service;
    $('#agentSelectedServiceLabel').textContent=`${service.group} › ${service.title}`;
    $('#agentFormTitle').textContent=`${service.title} - nuova domanda`;
    $('#agentFormSubtitle').textContent=service.description||'Compila dati cliente, documenti, delega e firma.';
    $('#agentServiceKey').value=service.key; $('#agentServiceTitle').value=service.title; $('#agentServiceGroup').value=service.group;
    $('#agentServiceCost').textContent=money(service.cost); $('#submitCostText').textContent=`Costo pratica: ${money(service.cost)}`; $('#submitCreditText').textContent=`Pagamento: Credito agente · Saldo ${money(agentCredit())}`;
    renderServiceMenu(); renderServiceSpecificForm(service); renderDocChecklist(service.title); updateLivePreview(); enhance730Panels();
    if(openTab){ if(service.special==='730') switchAgentTab('agent-730'); else switchAgentTab('agent-new'); }
  };
  function v9UpdateServiceStepState(){
    $$('.service-step-nav button').forEach(btn=>{
      const panel=$('#'+btn.dataset.serviceStep); if(!panel) return;
      const needed=$$('[data-required="1"]',panel); const ok=needed.length?needed.every(el=>String(el.value||'').trim()):true;
      btn.classList.toggle('done', ok);
    });
    const gp=$('#genericServicePreview'); if(gp) gp.innerHTML=v9PreviewHtml();
  }
  function v9PreviewHtml(){ const s=STATE.selectedService; const agency=v9AgencyForService(s); return `<div class="agency-band"><span class="agency-badge ${agency.key}"><i class="fa-solid ${agency.icon}"></i>${agency.label}</span><span>${safe(s?.title||'--')}</span></div>${previewLine('Cliente',`${safe($('#clientLastName')?.value||'--')} ${safe($('#clientFirstName')?.value||'')}`)}${previewLine('Codice fiscale',safe($('#clientCF')?.value||'--'))}${previewLine('Telefono',safe($('#clientPhone')?.value||'--'))}${previewLine('Email',safe($('#clientEmail')?.value||'--'))}${previewLine('Pagamento','Credito agente')}${previewLine('Costo scalato',s?money(s.cost):money(0))}${previewLine('Credito disponibile',money(agentCredit()))}${previewLine('Delega/Privacy',($('#delegaAccepted')?.checked&&$('#privacyAccepted')?.checked)?'OK':'Da completare')}${previewLine('Firma',STATE.signatureDataUrl?'Firmato':'Non firmato')}`; }
  updateLivePreview = function(){ const box=$('#agentLivePreview'); if(box) box.innerHTML=v9PreviewHtml(); v9UpdateServiceStepState(); };
  validateRequiredServiceFields = function(){ const missing=[]; $$('#serviceSpecificArea [data-required="1"]').forEach(el=>{ if(!String(el.value||'').trim()) missing.push(el.closest('label')?.innerText.replace('*','').trim()||el.dataset.serviceField); }); return missing; };
  collectServiceData = function(){ const data={}; $$('[data-service-field]').forEach(el=>data[el.dataset.serviceField]=el.value); data.paymentMode='Credito agente'; data.agency=v9AgencyForService(STATE.selectedService).label; return data; };
  submitAgentApplication = function(e){
    e.preventDefault(); const s=STATE.selectedService; if(!s) return showToast('Seleziona prima un servizio dal menu laterale.','warning');
    const client=collectBaseClient(); if(!client.cf||!client.lastName||!client.firstName||!client.phone||!client.email) return showToast('Compila cliente: CF, cognome, nome, telefono ed email.','warning');
    const missingFields=validateRequiredServiceFields(); if(missingFields.length) return showToast('Campi obbligatori mancanti: '+missingFields.slice(0,4).join(', '),'warning');
    if(!$('#delegaAccepted').checked||!$('#privacyAccepted').checked) return showToast('Serve delega e privacy accettata.','warning');
    if(!STATE.signatureDataUrl) return showToast('Serve firma cliente sul pad.','warning');
    const editingId=$('#agentEditingPraticaId')?.value||STATE.editingPraticaId; if(!editingId && agentCredit()<s.cost) return showToast(`Credito insufficiente. Saldo ${money(agentCredit())}, costo ${money(s.cost)}.`,'error');
    const docsOk=checkedDocs(); const missingDocs=allDocs().filter(d=>!docsOk.includes(d)); const upload=uploadedFiles();
    const agency=v9AgencyForService(s); const base={source:'agent',group:s.group,serviceKey:s.key,serviceTitle:s.title,client,agentEmail:STATE.session.email,agentName:STATE.session.name,routeTeam:'bangla',assignedTeam:'bangla',status:missingDocs.length?'Documenti mancanti':'Nuova',paymentStatus:'Agent credit',paymentMode:'Credito agente',documentStatus:missingDocs.length?'Documenti mancanti':'Documenti ricevuti',cost:s.cost,commission:s.commission,commissionStatus:'Pending',missingDocs,checkedDocs:docsOk,uploads:upload,teamMessage:missingDocs.length?`Mancano: ${missingDocs.join(', ')}`:'Domanda ricevuta. In controllo Team Bangla.',serviceData:collectServiceData(),agency:agency.label,delega:true,privacy:true,signature:true,signatureDataUrl:STATE.signatureDataUrl,generatedDocs:['delega-pdf','ricevuta-pdf'],deadline:$('[data-service-field="deadline"]')?.value||today(),updatedAt:today()};
    if(editingId){ const p=STATE.pratiche.find(x=>x.id===editingId); if(!p) return showToast('Pratica da modificare non trovata.','error'); Object.assign(p,base,{teamHistory:[{by:STATE.session.name,role:'agent',action:'Pratica modificata e reinviata',date:today()},...(p.teamHistory||[])]}); STATE.editingPraticaId=''; $('#agentEditingPraticaId').value=''; saveState(); renderAll(); switchAgentTab('agent-pratiche'); return showToast('Pratica modificata e reinviata.'); }
    const code=makeCode(s.group,s.key); const pratica={id:`p-${Date.now()}`,code,...base,createdAt:today(),teamHistory:[{by:STATE.session.name,role:'agent',action:`Domanda ${s.title} creata e inviata`,date:today()}]};
    STATE.pratiche.unshift(pratica); upsertAgentClient(client, pratica); addWallet(STATE.session.email,'minus',s.cost,`Creazione ${s.title} ${code}`); saveState(); e.target.reset(); STATE.signatureDataUrl=''; $('#signatureState').textContent='Non firmato'; clearSignatureCanvas(); renderAll(); switchAgentTab('agent-pratiche'); showToast(`Domanda ${code} inviata. Pagamento: credito agente ${money(s.cost)}.`);
  };
  function enhance730Panels(){
    if($('#v9_730_enhanced')) return; const form=$('#agent730Form'); if(!form) return; const flag=document.createElement('input'); flag.type='hidden'; flag.id='v9_730_enhanced'; form.appendChild(flag);
    const front=$('#quad-frontespizio .peach-section'); if(front){ front.insertAdjacentHTML('beforeend',`<div class="cgn-tip">Campi 730 più completi: dati delega, domicilio fiscale, scelta precompilato, senza sostituto e casi particolari.</div><div class="form-grid cols-4"><label>730 senza sostituto <select id="t730_senza_sost"><option>No</option><option>Sì</option></select></label><label>Rappresentante/tutore/erede CF <input id="t730_rep_cf"></label><label>Telefono fisso <input id="t730_tel"></label><label>Uso interno <select id="t730_uso_interno"><option>No</option><option>Sì</option></select></label></div>`); }
    const sost=$('#quad-sostituto'); if(sost && !$('#t730_subAddress')){ sost.insertAdjacentHTML('beforeend',`<div class="peach-section"><b>Dati sostituto completi</b><div class="form-grid cols-4"><label>Codice sede <input id="t730_subCode"></label><label>Comune sostituto <input id="t730_subCity"></label><label>Provincia <input id="t730_subProv"></label><label>CAP <input id="t730_subCap"></label><label>Tipologia <input id="t730_subType" value="VIA"></label><label>Indirizzo <input id="t730_subAddress"></label><label>N. civico <input id="t730_subNo"></label><label>Email/PEC sostituto <input id="t730_subEmail"></label></div></div>`); }
    const qa=$('#quad-quadro-a'); if(qa && !$('#t730_a_note')) qa.insertAdjacentHTML('beforeend',`<div class="cgn-tip">Quadro A: se non ci sono terreni lascia zero/non compilato.</div><div class="form-grid cols-4"><label>Reddito dominicale totale <input id="t730_a_dom" type="number"></label><label>Reddito agrario totale <input id="t730_a_agr" type="number"></label><label>Giorni possesso <input id="t730_a_days" type="number"></label><label>Note terreni <input id="t730_a_note"></label></div>`);
    const qb=$('#quad-quadro-b'); if(qb && !$('#t730_b_rendita')) qb.insertAdjacentHTML('beforeend',`<div class="cgn-tip">Quadro B: fabbricati, rendita, utilizzo, canone e cedolare secca.</div><div class="form-grid cols-4"><label>Rendita totale <input id="t730_b_rendita" type="number"></label><label>Utilizzo immobile <input id="t730_b_utilizzo"></label><label>Canone locazione <input id="t730_b_canone" type="number"></label><label>Cedolare secca <select id="t730_b_cedolare"><option>No</option><option>Sì</option></select></label><label>Codice comune <input id="t730_b_comune"></label><label>Contratto registrato <select id="t730_b_contratto"><option>No</option><option>Sì</option></select></label><label>Codice CIN <input id="t730_b_cin"></label><label>Note fabbricati <input id="t730_b_note"></label></div>`);
    const qd=$('#quad-quadro-d'); if(qd && !$('#t730_d_redditi')) qd.insertAdjacentHTML('beforeend',`<div class="form-grid cols-4"><label>Altri redditi D1-D5 <input id="t730_d_redditi" type="number"></label><label>Ritenute D <input id="t730_d_ritenute" type="number"></label><label>Tipo reddito <input id="t730_d_tipo"></label><label>Note quadro D <input id="t730_d_note"></label></div>`);
    const qe=$('#quad-quadro-e'); if(qe && !$('#t730_e_veterinarie')) qe.insertAdjacentHTML('beforeend',`<div class="peach-section"><b>Altre spese 730</b><div class="form-grid cols-4"><label>Spese veterinarie <input id="t730_e_veterinarie" type="number"></label><label>Funebri <input id="t730_e_funebri" type="number"></label><label>Spese disabili <input id="t730_e_disabili" type="number"></label><label>Previdenza complementare <input id="t730_e_prevcomp" type="number"></label><label>Bonus mobili <input id="t730_e_mobili" type="number"></label><label>Superbonus/edilizia <input id="t730_e_edilizia" type="number"></label><label>Erogazioni liberali <input id="t730_e_erogazioni" type="number"></label><label>Affitto giovani/lavoratori <input id="t730_e_affitto_speciale" type="number"></label></div></div>`);
    $('#submit730FromPanel').textContent='Invia domanda';
  }
  const v9_oldBuild730 = build730;
  build730 = function(){ const d=v9_oldBuild730(); d.client.senzaSostituto=$('#t730_senza_sost')?.value||d.noSub; d.client.representativeCf=$('#t730_rep_cf')?.value||''; d.client.telefono=$('#t730_tel')?.value||''; d.sostituto={...d.sostituto,code:$('#t730_subCode')?.value||'',city:$('#t730_subCity')?.value||'',prov:$('#t730_subProv')?.value||'',cap:$('#t730_subCap')?.value||'',address:[$('#t730_subType')?.value,$('#t730_subAddress')?.value,$('#t730_subNo')?.value].filter(Boolean).join(' '),email:$('#t730_subEmail')?.value||''}; d.quadroA={dominicale:toNum($('#t730_a_dom')?.value),agrario:toNum($('#t730_a_agr')?.value),days:toNum($('#t730_a_days')?.value),note:$('#t730_a_note')?.value||''}; d.quadroB={rendita:toNum($('#t730_b_rendita')?.value),utilizzo:$('#t730_b_utilizzo')?.value||'',canone:toNum($('#t730_b_canone')?.value),cedolare:$('#t730_b_cedolare')?.value||'No',codiceComune:$('#t730_b_comune')?.value||'',contratto:$('#t730_b_contratto')?.value||'No',cin:$('#t730_b_cin')?.value||'',note:$('#t730_b_note')?.value||''}; d.quadroD={redditi:toNum($('#t730_d_redditi')?.value),ritenute:toNum($('#t730_d_ritenute')?.value),tipo:$('#t730_d_tipo')?.value||'',note:$('#t730_d_note')?.value||''}; d.expenses.veterinarie=toNum($('#t730_e_veterinarie')?.value); d.expenses.funebri=toNum($('#t730_e_funebri')?.value); d.expenses.disabili=toNum($('#t730_e_disabili')?.value); d.expenses.prevcomp=toNum($('#t730_e_prevcomp')?.value); d.expenses.mobili=toNum($('#t730_e_mobili')?.value); d.expenses.edilizia=toNum($('#t730_e_edilizia')?.value); d.expenses.erogazioni=toNum($('#t730_e_erogazioni')?.value); d.expenses.affittoSpeciale=toNum($('#t730_e_affitto_speciale')?.value); d.paymentMode='Credito agente'; return d; };
  const v9_oldSubmit730 = submit730Pratica;
  submit730Pratica = function(e){ if(e?.preventDefault)e.preventDefault(); const s=serviceByKey('730'); const data=build730(); const miss=[]; if(!data.client.cf) miss.push('Codice fiscale'); if(!data.client.lastName) miss.push('Cognome'); if(!data.client.firstName) miss.push('Nome'); if(!data.client.phone) miss.push('Cellulare'); if(!data.client.email) miss.push('Email'); if(!(data.cu||[]).length) miss.push('Almeno 1 CU'); if(miss.length) return showToast('730 campi obbligatori mancanti: '+miss.join(', '),'warning'); if(!data.delega||!data.privacy||!$('#t730_firma_elettronica')?.checked) return showToast('Serve delega, privacy e autorizzazione firma elettronica.','warning'); if(!STATE.signature730DataUrl) return showToast('Serve firma cliente 730 sul pad.','warning'); if(agentCredit()<s.cost) return showToast(`Credito insufficiente per 730. Saldo ${money(agentCredit())}.`,'error'); const result=render730Result(); const code=makeCode('CAF','730'); const missingDocs=data.uploads.length?[]:['CU / CUD','Documento identità','Delega firmata','Tessera sanitaria']; const pratica={id:`p-${Date.now()}`,code,source:'agent',group:'CAF',serviceKey:'730',serviceTitle:'Modello 730',client:data.client,agentEmail:STATE.session.email,agentName:STATE.session.name,routeTeam:'bangla',assignedTeam:'bangla',status:missingDocs.length?'Documenti mancanti':'Nuova',paymentStatus:'Agent credit',paymentMode:'Credito agente',documentStatus:missingDocs.length?'Documenti mancanti':'Documenti ricevuti',cost:s.cost,commission:s.commission,commissionStatus:'Pending',missingDocs,uploads:data.uploads,teamMessage:missingDocs.length?'730 creato: attendiamo documenti mancanti.':'730 creato da agente. Controllo Team Bangla.',serviceData:data,internal730:result,delega:true,privacy:true,signature:true,signature730DataUrl:STATE.signature730DataUrl,agency:'Agenzia Entrate / CAF',generatedDocs:['delega-730-pdf','ricevuta-730-pdf','modello-730-auto','f24-bozza'],deadline:$('#t730_f24_due')?.value||today(),teamHistory:[{by:STATE.session.name,role:'agent',action:'730 creato e inviato',date:today()}],createdAt:today(),updatedAt:today()}; STATE.pratiche.unshift(pratica); upsertAgentClient(data.client, pratica); addWallet(STATE.session.email,'minus',s.cost,`Creazione Modello 730 ${code}`); saveState(); renderAll(); switchAgentTab('agent-pratiche'); showToast(`730 ${code} inviato. Credito scalato ${money(s.cost)}.`); };
  function v9DrawWrapped(page,text,x,y,maxWidth,size,font,color,lineGap=13){ const words=String(text||'').split(/\s+/); let line=''; const lines=[]; words.forEach(w=>{ const test=line?line+' '+w:w; if(test.length*size*0.52>maxWidth){lines.push(line); line=w;} else line=test;}); if(line) lines.push(line); lines.forEach((ln,i)=>page.drawText(ln,{x,y:y-(i*lineGap),size,font,color})); return y-lines.length*lineGap; }
  makeSimplePdf = async function(p,kind='ricevuta'){
    if(!window.PDFLib) throw new Error('PDFLib not loaded'); const {PDFDocument,StandardFonts,rgb}=window.PDFLib; const pdf=await PDFDocument.create(); const font=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); const client=p.client||{}; const agency=v9AgencyForService({title:p.serviceTitle,group:p.group,special:p.serviceKey}); const addHead=(page,title)=>{page.drawRectangle({x:0,y:792,width:595,height:50,color:rgb(0.18,0.47,0.67)}); page.drawText('CAF CAE',{x:36,y:810,size:18,font:bold,color:rgb(1,1,1)}); page.drawText(title,{x:220,y:814,size:12,font:bold,color:rgb(1,1,1)}); page.drawText(`Ente riferimento: ${agency.label}`,{x:36,y:780,size:9,font:bold,color:rgb(0.12,0.37,0.55)});};
    const page=pdf.addPage([595,842]); addHead(page, kind==='delega'?'DELEGA E MANDATO DI ASSISTENZA':'RICEVUTA DI PRESENTAZIONE DOMANDA'); let y=745; const line=(a,b)=>{page.drawText(a,{x:42,y,size:9,font:bold}); page.drawText(String(b||'--'),{x:210,y,size:9,font}); y-=20;};
    line('Codice pratica',p.code||'BOZZA'); line('Data generazione',today()); line('Servizio',p.serviceTitle); line('Cliente',fullName(client)); line('Codice fiscale',client.cf); line('Nato/a',`${client.dob||'--'} ${client.birthPlace||''} ${client.birthProvince||''}`); line('Residenza',[client.streetType,client.address,client.streetNo,client.city,client.province,client.cap].filter(Boolean).join(' ')); line('Telefono',client.phone); line('Email',client.email); line('Pagamento','Credito agente'); line('Documenti',(p.uploads||[]).join(', ')||'Da allegare');
    y-=8; page.drawRectangle({x:38,y:y-78,width:520,height:82,borderColor:rgb(.75,.82,.9),borderWidth:1,color:rgb(.97,.99,1)}); y=v9DrawWrapped(page, kind==='delega'?'Il cliente conferisce mandato a CAF CAE e agli incaricati autorizzati per assistenza, raccolta documenti, predisposizione pratica, comunicazioni e gestione delle integrazioni relative al servizio richiesto.':'La pratica è stata ricevuta dalla piattaforma CAF CAE. Il documento non sostituisce ricevute ufficiali degli enti finché il team abilitato non completa la verifica e l’invio.',48,y-20,500,9,font,rgb(0,0,0));
    if(p.internal730){y-=12; page.drawText(`Risultato 730 interno: ${p.internal730.type} ${money(p.internal730.total)} · Giugno ${money(p.internal730.june)} · Novembre ${money(p.internal730.november)}`,{x:42,y,size:10,font:bold,color:rgb(0,.45,.2)}); y-=22;}
    page.drawText('Firma cliente',{x:42,y:168,size:10,font:bold}); page.drawLine({start:{x:42,y:150},end:{x:260,y:150},thickness:1,color:rgb(0,0,0)}); page.drawText('Firma operatore CAF CAE',{x:330,y:168,size:10,font:bold}); page.drawLine({start:{x:330,y:150},end:{x:545,y:150},thickness:1,color:rgb(0,0,0)});
    const sig=p.signature730DataUrl||p.signatureDataUrl||STATE.signature730DataUrl||STATE.signatureDataUrl; if(sig&&/^data:image\/png/.test(sig)){try{const img=await pdf.embedPng(sig); page.drawImage(img,{x:52,y:154,width:160,height:45});}catch(e){}}
    const p2=pdf.addPage([595,842]); addHead(p2,'INFORMATIVA, PRIVACY E RESPONSABILITÀ'); let y2=740;
    y2=v9DrawWrapped(p2,'Il cliente dichiara che i dati forniti sono veri e completi, autorizza il trattamento dei dati personali e particolari necessari per la gestione della pratica, la conservazione documentale, le comunicazioni con il team CAF CAE e con gli enti competenti quando necessario.',42,y2,510,10,font,rgb(0,0,0),15); y2-=15;
    y2=v9DrawWrapped(p2,'Autorizza inoltre CAF CAE / incaricato / agente alla preparazione della pratica, verifica documenti, richiesta integrazioni, generazione ricevute, fascicolo interno e comunicazioni operative. Per pratiche INPS/Patronato, fiscali/730, immigrazione o azienda, i dati verranno usati esclusivamente per il servizio richiesto.',42,y2,510,10,font,rgb(0,0,0),15); y2-=20;
    const bullets=['Documento identità e codice fiscale devono essere leggibili.','La pratica può essere sospesa se mancano documenti o dati obbligatori.','Il cliente riceverà eventuali richieste di integrazione tramite agente/team.','Le ricevute ufficiali degli enti saranno disponibili dopo l’invio/completamento.']; bullets.forEach(b=>{p2.drawText('•',{x:48,y:y2,size:12,font:bold}); y2=v9DrawWrapped(p2,b,65,y2,470,10,font,rgb(0,0,0),14); y2-=6;});
    p2.drawText('Firma cliente per privacy e mandato',{x:42,y:170,size:10,font:bold}); p2.drawLine({start:{x:42,y:150},end:{x:300,y:150},thickness:1,color:rgb(0,0,0)}); if(sig&&/^data:image\/png/.test(sig)){try{const img=await pdf.embedPng(sig); p2.drawImage(img,{x:52,y:154,width:160,height:45});}catch(e){}}
    p2.drawText('Documento generato automaticamente da CAF CAE. Uso interno/cliente.',{x:42,y:70,size:8,font,color:rgb(.35,.35,.35)});
    return pdf.save();
  };
  const v9_oldMake730TemplatePdf = make730TemplatePdf;
  make730TemplatePdf = async function(p){ const bytes=await v9_oldMake730TemplatePdf(p); if(!window.PDFLib) return bytes; const {PDFDocument,StandardFonts,rgb}=window.PDFLib; const pdf=await PDFDocument.load(bytes); const font=await pdf.embedFont(StandardFonts.HelveticaBold); const d=p.serviceData||{}; const draw=(pageIndex,t,x,y,size=8)=>{try{pdf.getPage(pageIndex).drawText(String(t||''),{x,y,size,font,color:rgb(0,0,0)});}catch(e){}}; draw(0,d.client?.senzaSostituto==='Sì'?'X':'',380,735,9); draw(0,d.client?.representativeCf||'',440,735,7); draw(0,d.sostituto?.name||'',135,300,8); draw(0,d.sostituto?.cf||'',80,322,8); draw(0,d.sostituto?.address||'',160,282,7); draw(1,d.quadroB?.rendita||'',80,730,8); draw(1,d.quadroB?.canone||'',265,730,8); draw(1,d.quadroD?.redditi||'',360,230,8); draw(1,d.quadroD?.ritenute||'',470,230,8); draw(2,d.expenses?.veterinarie||'',130,700,8); draw(2,d.expenses?.funebri||'',220,700,8); draw(2,d.expenses?.edilizia||'',430,300,8); return pdf.save(); };
  document.addEventListener('click',e=>{
    const step=e.target.closest('[data-service-step]'); if(step){ $$('.service-step-nav button').forEach(b=>b.classList.remove('active')); step.classList.add('active'); $$('.service-step-panel').forEach(p=>p.classList.remove('active')); $('#'+step.dataset.serviceStep)?.classList.add('active'); v9UpdateServiceStepState(); }
    const next=e.target.closest('[data-step-next]'); if(next){ const btns=$$('.service-step-nav button'); const idx=btns.findIndex(b=>b.classList.contains('active')); (btns[idx+1]||btns[0])?.click(); }
    const prev=e.target.closest('[data-step-prev]'); if(prev){ const btns=$$('.service-step-nav button'); const idx=btns.findIndex(b=>b.classList.contains('active')); (btns[idx-1]||btns[btns.length-1])?.click(); }
    const dot=e.target.closest('[data-news-dot]'); if(dot){ const wrap=$('#agentNewsSlider'); if(wrap){ $$('.agent-news-slide',wrap).forEach(s=>s.classList.remove('active')); $$('.news-dots button',wrap).forEach(s=>s.classList.remove('active')); $(`[data-news-slide="${dot.dataset.newsDot}"]`,wrap)?.classList.add('active'); dot.classList.add('active'); } }
    const del=e.target.closest('[data-delete-news]'); if(del&&STATE.session?.role==='admin'){ STATE.newsSlides=(STATE.newsSlides||[]).filter(n=>n.id!==del.dataset.deleteNews); saveState(); renderAll(); }
  });
  document.addEventListener('submit',e=>{ if(e.target.id==='adminNewsForm'){ e.preventDefault(); const title=$('#adminNewsTitle')?.value; const message=$('#adminNewsMessage')?.value; if(!title||!message) return showToast('Completa titolo e messaggio news.','warning'); STATE.newsSlides||=[]; STATE.newsSlides.unshift({id:`ns-${Date.now()}`,targetRole:'agent',title,message,level:$('#adminNewsLevel')?.value||'Info',icon:'fa-bullhorn',active:true,date:today()}); saveState(); e.target.reset(); renderAll(); showToast('News pubblicata nel dashboard agente.'); } });
  ['input','change'].forEach(ev=>document.addEventListener(ev,e=>{ if(e.target.closest('#serviceSpecificArea')) v9UpdateServiceStepState(); }));



  /* ========================= v10 COMMERCIALISTA-ONLY STRUCTURE OVERRIDES ========================= */
  function commEnsureData(){
    STATE.commSales ||= [
      {id:'sale-demo-1',companyId:'co1',date:today(),card:420,cash:180,other:55,agencyTotal:655,closureNo:'CH-2026-001',status:'Completata',operator:'Studio Commercialista',note:'Chiusura demo corretta',file:'chiusura-demo.pdf'},
      {id:'sale-demo-2',companyId:'co1',date:today(),card:210,cash:90,other:0,agencyTotal:320,closureNo:'CH-2026-002',status:'Differenza rilevata',operator:'Studio Commercialista',note:'Differenza da verificare',file:''}
    ];
    STATE.commF24 ||= [{id:'f24-demo-1',companyId:'co1',type:'INPS',period:'06/2026',amount:380.24,due:'2026-07-16',status:'Da pagare',receipt:'',note:'Contributi trimestrali'}];
    STATE.commEmployees ||= [{id:'emp-demo-1',companyId:'co1',name:'Dipendente Demo',cf:'RSSMRA90A01H501U',contract:'Part-time',start:'2026-01-10',end:'',payroll:'Busta paga giugno',status:'Attivo'}];
    STATE.commDocuments ||= [{id:'doc-demo-1',companyId:'co1',category:'Tax',desc:'Visura camerale e dati P.IVA',visible:'Sì',expiry:'2026-12-31',files:['visura.pdf'],date:today()}];
    STATE.commDeadlines ||= [{id:'dead-demo-1',companyId:'co1',type:'F24',date:'2026-07-16',priority:'Urgente',desc:'Pagamento F24 INPS/IVA'}];
    STATE.commPlans ||= [];
    STATE.commBackups ||= [{id:'bk-demo-1',type:'Giornaliero',companyId:'co1',dest:'Cloudflare R2',status:'Completato',date:today(),note:'Backup demo completato'}];
    STATE.commActivities ||= [{id:'act-demo-1',action:'Cliente sincronizzato',entity:'Almoni Express',date:today(),by:'Sistema'}];
    STATE.commProfileId ||= '';
    (STATE.companies||[]).forEach(c=>{
      c.customerFirst ||= c.owner ? String(c.owner).split(' ')[0] : '';
      c.customerLast ||= c.owner ? String(c.owner).split(' ').slice(1).join(' ') : '';
      c.status ||= 'Attivo'; c.plan ||= c.plan || 'Normal'; c.planPrice ||= c.planPrice || 700; c.paid ||= c.paid || 0; c.remaining ||= c.remaining ?? Math.max(0, Number(c.planPrice||0)-Number(c.paid||0)); c.payStatus ||= c.payStatus || (Number(c.remaining)>0?'Parziale':'Pagato'); c.shopifyStatus ||= c.shopifyStatus || 'Da collegare'; c.version ||= c.version || 1; c.createdAt ||= today(); c.services ||= c.services || ['Accounting','Fatturazione','F24','Document management'];
    });
  }
  function commActivity(action, entity){ STATE.commActivities ||= []; STATE.commActivities.unshift({id:`act-${Date.now()}`,action,entity,date:today(),by:STATE.session?.name||'Sistema'}); }
  function commCompanyName(id){ return (STATE.companies||[]).find(c=>c.id===id)?.name || '--'; }
  function commCompanyOptions(){ return (STATE.companies||[]).map(c=>`<option value="${c.id}">${safe(c.name)}</option>`).join('') || '<option value="">Nessuna ditta</option>'; }
  function commUploads(selector){ const input=$(selector); return input?.files ? Array.from(input.files).map(f=>f.name) : []; }
  function commDaysTo(date){ if(!date) return 9999; const d=new Date(date+'T00:00:00'); const now=new Date(today()+'T00:00:00'); return Math.ceil((d-now)/(1000*60*60*24)); }
  function commStatusBadge(status){ const v=String(status||'--'); const cls=/attivo|pagato|completata|collegato/i.test(v)?'active':(/scad|sosp|errore|differenza|manc/i.test(v)?'red':'warn'); return `<span class="comm-status ${cls}">${safe(v)}</span>`; }
  function commFilePreviewChange(inputSel, targetSel){ const names=commUploads(inputSel); const el=$(targetSel); if(el) el.textContent=names.length?names.join(', '):'Nessun file'; }
  function commUpdateWizardPreview(){ const box=$('#commCreatePreview'); if(!box) return; const price=toNum($('#coPlanPrice')?.value); const paid=toNum($('#coPaid')?.value); const remaining=($('#coRemaining')?.value!=='')?toNum($('#coRemaining')?.value):Math.max(0,price-paid); box.innerHTML=`${previewLine('Cliente',`${safe($('#coCustomerLast')?.value||'--')} ${safe($('#coCustomerFirst')?.value||'')}`)}${previewLine('Email',safe($('#coEmail')?.value||'--'))}${previewLine('Telefono',safe($('#coPhone')?.value||'--'))}${previewLine('Azienda',safe($('#coName')?.value||'--'))}${previewLine('P.IVA',safe($('#coVat')?.value||'--'))}${previewLine('Regime fiscale',safe($('#coRegime')?.value||'--'))}${previewLine('Shopify',`${safe($('#coShopifyStatus')?.value||'--')} · ${safe($('#coShopifyId')?.value||'ID non inserito')}`)}${previewLine('Piano',`${safe($('#coPlan')?.value||'--')} · ${money(price)} · residuo ${money(remaining)}`)}${previewLine('Assegnato a',safe($('#coAssignedCommercialista')?.value||'--'))}${previewLine('Servizi', $$('#coServicesBox input:checked').map(x=>x.value).join(', ')||'--')}`; }
  function commRenderServiceToggles(){ const services=['Accounting','Fatturazione','F24','Payroll','Commercialista support','Firma Digitale','Backup','Document management','Pratiche aziendali','Comunicazioni cliente','Scadenze fiscali','Report mensile']; const box=$('#coServicesBox'); if(box) box.innerHTML=services.map((s,i)=>`<label><input type="checkbox" value="${safe(s)}" ${i<4?'checked':''}>${safe(s)}</label>`).join(''); }
  function commRenderChart(){ const ctx=$('#commSalesChart'); if(!ctx || !window.Chart) return; if(STATE.chartRefs.commSales) STATE.chartRefs.commSales.destroy(); const last=[...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().slice(0,10); }); const sales=last.map(d=>(STATE.commSales||[]).filter(s=>s.date===d).reduce((a,b)=>a+Number(b.card||0)+Number(b.cash||0)+Number(b.other||0),0)); const receipts=last.map(d=>(STATE.invoices||[]).filter(i=>i.due===d && /pagata/i.test(i.status)).reduce((a,b)=>a+Number(b.total||0),0)); STATE.chartRefs.commSales=new Chart(ctx,{type:'line',data:{labels:last.map(x=>x.slice(5)),datasets:[{label:'Vendite',data:sales,borderColor:'#3157E8',backgroundColor:'rgba(49,87,232,.12)',tension:.35,fill:true},{label:'Incassi',data:receipts,borderColor:'#2FB36A',backgroundColor:'rgba(47,179,106,.12)',tension:.35,fill:true}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});
  }
  function commRenderSelects(){
    const ids=['invCompany','saleCompany','f24Company','empCompany','docCompany','msgCompany','deadCompany','backupCompany']; ids.forEach(id=>{ const el=$('#'+id); if(el) el.innerHTML=commCompanyOptions(); });
    if($('#coType')) $('#coType').innerHTML=(CATALOG.commercialista?.companyTypes||['Ditta individuale','SRL','SRLS']).map(x=>`<option>${safe(x)}</option>`).join('');
    if($('#coRegime')) $('#coRegime').innerHTML=(CATALOG.commercialista?.taxRegimes||['Forfettario','Ordinario','Semplificato']).map(x=>`<option>${safe(x)}</option>`).join('');
    if($('#invType')) $('#invType').innerHTML=(CATALOG.commercialista?.invoiceTypes||['Fattura vendita','Fattura acquisto','Nota credito']).map(x=>`<option>${safe(x)}</option>`).join('');
  }
  function renderCommercialista(){
    if(STATE.session?.role!=='commercialista') return; commEnsureData(); commRenderSelects(); commRenderServiceToggles();
    const companies=STATE.companies||[], inv=STATE.invoices||[], sales=STATE.commSales||[], f24=STATE.commF24||[], docs=STATE.commDocuments||[], deadlines=STATE.commDeadlines||[];
    const active=companies.filter(c=>c.status==='Attivo').length; const monthRevenue=inv.reduce((s,i)=>s+Number(i.total||0),0); const received=inv.filter(i=>/pagata/i.test(i.status)).reduce((s,i)=>s+Number(i.total||0),0); const urgent=deadlines.filter(d=>commDaysTo(d.date)<=7 && commDaysTo(d.date)>=0).length + f24.filter(f=>commDaysTo(f.due)<=7 && f.status!=='Pagato').length; const missing=docs.filter(d=>/mancante|richiesta/i.test(d.status||d.desc||'')).length;
    $('#commCompaniesCount') && ($('#commCompaniesCount').textContent=companies.length); $('#commActiveCount') && ($('#commActiveCount').textContent=active); $('#commSideActive') && ($('#commSideActive').textContent=active); $('#commNewMonthCount') && ($('#commNewMonthCount').textContent=companies.filter(c=>String(c.createdAt||'').slice(0,7)===today().slice(0,7)).length); $('#commMonthRevenue') && ($('#commMonthRevenue').textContent=money(monthRevenue)); $('#commMonthReceived') && ($('#commMonthReceived').textContent=money(received)); $('#commMonthBalance') && ($('#commMonthBalance').textContent=money(monthRevenue-received*0.18)); $('#commF24UrgentCount') && ($('#commF24UrgentCount').textContent=urgent); $('#commMissingDocsCount') && ($('#commMissingDocsCount').textContent=missing); $('#commPracticeActiveCount') && ($('#commPracticeActiveCount').textContent=(STATE.pratiche||[]).filter(p=>p.group==='Commercialista'&&p.status!=='Completata').length); $('#commOpenTicketsCount') && ($('#commOpenTicketsCount').textContent=(STATE.tickets||[]).filter(t=>t.creatorRole==='commercialista'&&t.status!=='Solved').length); $('#commInvoicesCount') && ($('#commInvoicesCount').textContent=inv.length); $('#commDeadlineCount') && ($('#commDeadlineCount').textContent=deadlines.length);
    const todaySales=sales.filter(s=>s.date===today()); const card=todaySales.reduce((a,b)=>a+Number(b.card||0),0), cash=todaySales.reduce((a,b)=>a+Number(b.cash||0),0), other=todaySales.reduce((a,b)=>a+Number(b.other||0),0), agency=todaySales.reduce((a,b)=>a+Number(b.agencyTotal||0),0), total=card+cash+other, diff=total-agency;
    $('#commTodaySummary') && ($('#commTodaySummary').innerHTML=[['POS / carta',money(card)],['Contanti',money(cash)],['Altri incassi',money(other)],['Totale vendite',money(total)],['Totale Agenzia Entrate',money(agency)],['Differenza',money(diff),diff===0?'positive':'negative'],['Chiusure completate',todaySales.filter(s=>s.status==='Completata').length],['Chiusure con differenze',todaySales.filter(s=>s.status==='Differenza rilevata'||((Number(s.card)+Number(s.cash)+Number(s.other))-Number(s.agencyTotal))!==0).length]].map(r=>`<div class="summary-row ${r[2]||''}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join(''));
    $('#commUrgentDeadlines') && ($('#commUrgentDeadlines').innerHTML=[...deadlines.map(d=>({title:`${d.type} · ${commCompanyName(d.companyId)}`,meta:`${d.date} · ${d.priority} · ${d.desc||''}`})),...f24.map(f=>({title:`F24 ${f.type} · ${commCompanyName(f.companyId)}`,meta:`${f.due} · ${money(f.amount)} · ${f.status}`}))].slice(0,8).map(x=>`<div class="flat-item"><div><div class="title">${safe(x.title)}</div><div class="meta">${safe(x.meta)}</div></div></div>`).join('')||emptyFlat('Nessuna scadenza urgente','Tutto sotto controllo.'));
    $('#commProblemClients') && ($('#commProblemClients').innerHTML=companies.filter(c=>c.status!=='Attivo'||Number(c.remaining)>0||c.firmaStatus==='Scaduta').slice(0,8).map(c=>`<div class="flat-item"><div><div class="title">${safe(c.name)}</div><div class="meta">${safe(c.status||'Attivo')} · Residuo ${money(c.remaining||0)} · Firma ${safe(c.firmaStatus||'--')}</div></div>${commStatusBadge(c.payStatus||'--')}</div>`).join('')||emptyFlat('Nessun cliente con problema','Non ci sono alert aperti.'));
    $('#commActivityList') && ($('#commActivityList').innerHTML=(STATE.commActivities||[]).slice(0,8).map(a=>`<div class="timeline-item"><span>${safe(a.date)}</span><div><b>${safe(a.action)}</b><div class="meta">${safe(a.entity)} · ${safe(a.by)}</div></div></div>`).join('')||emptyFlat('Nessuna attività','Le azioni appariranno qui.'));
    $('#commHomeList') && ($('#commHomeList').innerHTML=(STATE.communications||[]).filter(c=>c.target==='commercialista'||c.targetRole==='commercialista'||!c.target).slice(0,8).map(c=>`<div class="flat-item"><div><div class="title">${safe(c.title||c.subject)}</div><div class="meta">${safe(c.message||c.body||'')} · ${safe(c.date||today())}</div></div>${c.priority?commStatusBadge(c.priority):''}</div>`).join('')||emptyFlat('Nessuna comunicazione','Qui vedrai messaggi di clienti e team.'));
    $('#commBackupStatus') && ($('#commBackupStatus').innerHTML=`<div class="backup-pill"><span>Ultimo backup</span><b>${safe((STATE.commBackups||[])[0]?.date||'--')}</b></div><div class="backup-pill"><span>Stato</span><b>${safe((STATE.commBackups||[])[0]?.status||'Da configurare')}</b></div><div class="backup-pill"><span>Cloudflare R2</span><b>Ready structure</b></div><div class="backup-pill"><span>Google Drive</span><b>Ready structure</b></div>`);
    renderCommClients(); renderCommLists(); commUpdateWizardPreview(); commRenderChart();
  }
  function renderCommClients(){ const box=$('#commClientTable'); if(!box) return; const q=String($('#commClientSearch')?.value||'').toLowerCase(); const st=$('#commClientStatusFilter')?.value||''; const plan=$('#commPlanFilter')?.value||''; const rows=(STATE.companies||[]).filter(c=>{const hay=[c.name,c.customerFirst,c.customerLast,c.email,c.phone,c.vat,c.cf,c.shopifyId].join(' ').toLowerCase(); return (!q||hay.includes(q))&&(!st||c.status===st)&&(!plan||c.plan===plan);}); box.innerHTML=table(['Azienda','Cliente','Email / telefono','P.IVA','Piano','Stato','Rinnovo','Residuo','Azioni'],rows.map(c=>[`<b>${safe(c.name)}</b><br><small>${safe(c.type||'')}</small>`,`${safe(c.customerLast||'')} ${safe(c.customerFirst||c.owner||'')}`,`${safe(c.email||'--')}<br><small>${safe(c.phone||'--')}</small>`,safe(c.vat||'--'),safe(c.plan||'Normal'),commStatusBadge(c.status||'Attivo'),safe(c.deadline||'--'),money(c.remaining||0),`<button class="btn light" data-comm-profile="${c.id}">Apri</button> <button class="btn light" data-comm-tab="comm-comms">Messaggio</button>`])); renderCommProfile(); }
  function renderCommProfile(id){ if(id) STATE.commProfileId=id; const panel=$('#commClientProfilePanel'); if(!panel) return; const c=(STATE.companies||[]).find(x=>x.id===STATE.commProfileId); if(!c){panel.classList.add('hidden'); return;} panel.classList.remove('hidden'); const inv=(STATE.invoices||[]).filter(i=>i.companyId===c.id), f24=(STATE.commF24||[]).filter(f=>f.companyId===c.id), docs=(STATE.commDocuments||[]).filter(d=>d.companyId===c.id), emp=(STATE.commEmployees||[]).filter(e=>e.companyId===c.id); panel.innerHTML=`<div class="comm-profile-head"><div><span class="section-eyebrow">Profilo cliente</span><h3>${safe(c.name)}</h3><p class="muted">${safe(c.customerLast||'')} ${safe(c.customerFirst||c.owner||'')} · P.IVA ${safe(c.vat||'--')} · Shopify: ${safe(c.shopifyStatus||'--')}</p></div><div class="comm-client-actions"><button class="btn blue" data-comm-tab="comm-vendite">Vendite</button><button class="btn light" data-comm-tab="comm-fattura">Fattura</button><button class="btn light" data-comm-tab="comm-documenti">Documenti</button></div></div><div class="comm-profile-tabs"><span>Panoramica</span><span>Vendite</span><span>Pratiche</span><span>Fatture</span><span>F24</span><span>Dipendenti</span><span>Documenti</span><span>Comunicazioni</span><span>Scadenze</span><span>Backup</span><span>Audit</span></div><div class="grid-2"><div class="document-preview">${previewLine('Cliente',`${safe(c.customerLast||'')} ${safe(c.customerFirst||c.owner||'')}`)}${previewLine('Email',safe(c.email||'--'))}${previewLine('Telefono',safe(c.phone||'--'))}${previewLine('Piano',`${safe(c.plan||'Normal')} · ${money(c.planPrice||0)}`)}${previewLine('Pagamento',`${safe(c.payStatus||'--')} · residuo ${money(c.remaining||0)}`)}${previewLine('Scadenza rinnovo',safe(c.deadline||'--'))}${previewLine('Assegnato',safe(c.assignedCommercialista||'--'))}${previewLine('Versione dashboard',safe(c.version||1))}</div><div class="summary-stack"><div class="summary-row"><span>Fatture</span><b>${inv.length}</b></div><div class="summary-row"><span>F24</span><b>${f24.length}</b></div><div class="summary-row"><span>Dipendenti</span><b>${emp.length}</b></div><div class="summary-row"><span>Documenti</span><b>${docs.length}</b></div></div></div>`; }
  function renderCommLists(){
    $('#commSalesList') && ($('#commSalesList').innerHTML=(STATE.commSales||[]).map(s=>{const tot=Number(s.card||0)+Number(s.cash||0)+Number(s.other||0), diff=tot-Number(s.agencyTotal||0);return `<div class="flat-item"><div><div class="title">${commCompanyName(s.companyId)} · ${safe(s.date)}</div><div class="meta">POS ${money(s.card)} · Contanti ${money(s.cash)} · Altro ${money(s.other)} · Agenzia ${money(s.agencyTotal)} · Diff ${money(diff)}<br>${safe(s.note||'')}</div></div>${commStatusBadge(s.status)}</div>`}).join('')||emptyFlat('Nessuna vendita','Registra la prima chiusura.'));
    $('#commInvoiceList') && ($('#commInvoiceList').innerHTML=(STATE.invoices||[]).map(i=>`<div class="flat-item"><div><div class="title">${safe(i.type)} · ${commCompanyName(i.companyId)}</div><div class="meta">${safe(i.desc||'')} · ${money(i.total)} · scad. ${safe(i.due||'--')}<br>${safe(i.message||'')}</div></div>${commStatusBadge(i.status)}</div>`).join('')||emptyFlat('Nessuna fattura','Crea una fattura.'));
    $('#commF24List') && ($('#commF24List').innerHTML=(STATE.commF24||[]).map(f=>`<div class="flat-item"><div><div class="title">${safe(f.type)} · ${commCompanyName(f.companyId)}</div><div class="meta">Periodo ${safe(f.period)} · Scadenza ${safe(f.due)} · ${money(f.amount)}<br>${safe(f.note||'')}</div></div>${commStatusBadge(f.status)}</div>`).join('')||emptyFlat('Nessun F24','Aggiungi F24 o contributo.'));
    $('#commEmployeesList') && ($('#commEmployeesList').innerHTML=(STATE.commEmployees||[]).map(e=>`<div class="flat-item"><div><div class="title">${safe(e.name)} · ${commCompanyName(e.companyId)}</div><div class="meta">CF ${safe(e.cf)} · ${safe(e.contract)} · assunzione ${safe(e.start||'--')} · ${safe(e.payroll||'')}</div></div>${commStatusBadge(e.status)}</div>`).join('')||emptyFlat('Nessun dipendente','Aggiungi il primo dipendente.'));
    $('#commDocsList') && ($('#commDocsList').innerHTML=(STATE.commDocuments||[]).map(d=>`<div class="flat-item"><div><div class="title">${safe(d.category)} · ${commCompanyName(d.companyId)}</div><div class="meta">${safe(d.desc||'')} · visibile cliente: ${safe(d.visible||'--')} · scadenza ${safe(d.expiry||'--')}<br>${(d.files||[]).map(f=>`<span class="comm-doc-pill"><i class="fa-solid fa-file"></i>${safe(f)}</span>`).join('')}</div></div></div>`).join('')||emptyFlat('Nessun documento','Carica documenti cliente.'));
    $('#commCommsList') && ($('#commCommsList').innerHTML=(STATE.communications||[]).filter(c=>c.target==='commercialista'||c.targetRole==='commercialista'||c.companyId).map(c=>`<div class="flat-item"><div><div class="title">${safe(c.title||c.subject||'Comunicazione')}</div><div class="meta">${c.companyId?commCompanyName(c.companyId)+' · ':''}${safe(c.message||c.body||'')} · ${safe(c.date||today())}</div></div>${c.priority?commStatusBadge(c.priority):''}</div>`).join('')||emptyFlat('Nessuna comunicazione','Scrivi una comunicazione cliente.'));
    $('#commDeadlineList') && ($('#commDeadlineList').innerHTML=(STATE.commDeadlines||[]).map(d=>`<div class="flat-item"><div><div class="title">${safe(d.type)} · ${commCompanyName(d.companyId)}</div><div class="meta">${safe(d.date)} · ${safe(d.priority)} · ${safe(d.desc||'')}</div></div>${commStatusBadge(commDaysTo(d.date)<0?'Scaduta':d.priority)}</div>`).join('')||emptyFlat('Nessuna scadenza','Aggiungi scadenza.'));
    $('#commPlansList') && ($('#commPlansList').innerHTML=(STATE.companies||[]).map(c=>`<div class="flat-item"><div><div class="title">${safe(c.name)} · ${safe(c.plan||'Normal')}</div><div class="meta">Prezzo ${money(c.planPrice||0)} · Rinnovo ${safe(c.deadline||'--')} · Stato ${safe(c.payStatus||'--')}</div></div>${commStatusBadge(c.status||'Attivo')}</div>`).join('')||emptyFlat('Nessun piano','Crea un cliente.'));
    $('#commPaymentsList') && ($('#commPaymentsList').innerHTML=(STATE.companies||[]).filter(c=>Number(c.remaining)>0).map(c=>`<div class="flat-item"><div><div class="title">${safe(c.name)}</div><div class="meta">Residuo ${money(c.remaining)} · metodo ${safe(c.payMethod||'--')} · rinnovo ${safe(c.deadline||'--')}</div></div>${commStatusBadge(c.payStatus||'Da pagare')}</div>`).join('')||emptyFlat('Nessun insoluto','Tutti i pagamenti sono ok.'));
    $('#commReportBox') && ($('#commReportBox').innerHTML=`${previewLine('Clienti totali',(STATE.companies||[]).length)}${previewLine('Fatturato registrato',money((STATE.invoices||[]).reduce((s,i)=>s+Number(i.total||0),0)))}${previewLine('Vendite giornaliere',money((STATE.commSales||[]).reduce((s,i)=>s+Number(i.card||0)+Number(i.cash||0)+Number(i.other||0),0)))}${previewLine('F24 da pagare',money((STATE.commF24||[]).filter(f=>f.status!=='Pagato').reduce((s,f)=>s+Number(f.amount||0),0)))}${previewLine('Documenti caricati',(STATE.commDocuments||[]).reduce((s,d)=>s+(d.files||[]).length,0))}${previewLine('Backup eseguiti',(STATE.commBackups||[]).length)}`);
    $('#commAuditList') && ($('#commAuditList').innerHTML=(STATE.commActivities||[]).map(a=>`<div class="timeline-item"><span>${safe(a.date)}</span><div><b>${safe(a.action)}</b><div class="meta">${safe(a.entity)} · ${safe(a.by)}</div></div></div>`).join('')||emptyFlat('Nessun audit','Le azioni appariranno qui.'));
    $('#commBackupList') && ($('#commBackupList').innerHTML=(STATE.commBackups||[]).map(b=>`<div class="flat-item"><div><div class="title">${safe(b.type)} · ${commCompanyName(b.companyId)}</div><div class="meta">${safe(b.dest)} · ${safe(b.date)} · ${safe(b.note||'')}</div></div>${commStatusBadge(b.status)}</div>`).join('')||emptyFlat('Nessun backup','Avvia il primo backup.'));
    $('#commBioList') && ($('#commBioList').innerHTML=(STATE.companies||[]).map(c=>`<div class="comm-client-card"><h4>${safe(c.name)}</h4><div class="meta">P.IVA ${safe(c.vat||'--')} · ${safe(c.type||'')}<br>Cliente: ${safe(c.customerLast||'')} ${safe(c.customerFirst||c.owner||'')}<br>Email: ${safe(c.email||'--')} · PEC: ${safe(c.pec||'--')}<br>ATECO: ${safe(c.ateco||'--')} · REA: ${safe(c.rea||'--')}</div><div class="comm-mini-stats"><div class="comm-mini-stat"><span>Piano</span><b>${safe(c.plan||'Normal')}</b></div><div class="comm-mini-stat"><span>Residuo</span><b>${money(c.remaining||0)}</b></div><div class="comm-mini-stat"><span>Versione</span><b>${safe(c.version||1)}</b></div></div><div class="comm-client-actions"><button class="btn light" data-comm-profile="${c.id}">Apri profilo</button></div></div>`).join('')||emptyFlat('Nessuna azienda','Crea il primo cliente.'));
  }
  submitCompany = function(e){
    e.preventDefault(); commEnsureData(); const price=toNum($('#coPlanPrice')?.value), paid=toNum($('#coPaid')?.value), remaining=($('#coRemaining')?.value!=='')?toNum($('#coRemaining')?.value):Math.max(0,price-paid); const id=`co-${Date.now()}`;
    const c={id,name:$('#coName')?.value||'',customerFirst:$('#coCustomerFirst')?.value||'',customerLast:$('#coCustomerLast')?.value||'',email:$('#coEmail')?.value||'',phone:$('#coPhone')?.value||'',customerCf:$('#coCustomerCf')?.value||'',customerAddress:$('#coCustomerAddress')?.value||'',city:$('#coCity')?.value||'',province:$('#coProvince')?.value||'',cap:$('#coCap')?.value||'',country:$('#coCountry')?.value||'Italia',whatsapp:$('#coWhatsapp')?.value||'',language:$('#coLanguage')?.value||'Italiano',type:$('#coType')?.value||'',vat:$('#coVat')?.value||'',cf:$('#coCf')?.value||'',ateco:$('#coAteco')?.value||'',regime:$('#coRegime')?.value||'',pec:$('#coPec')?.value||'',sdi:$('#coSdi')?.value||'',cciaa:$('#coCciaa')?.value||'',rea:$('#coRea')?.value||'',startDate:$('#coStartDate')?.value||'',address:$('#coAddress')?.value||'',inps:$('#coInps')?.value||'',inail:$('#coInail')?.value||'',iban:$('#coIban')?.value||'',owner:$('#coOwner')?.value||'',firmaStatus:$('#coFirmaStatus')?.value||'',firmaDeadline:$('#coFirmaDeadline')?.value||'',shopifyId:$('#coShopifyId')?.value||'',shopifyEmail:$('#coShopifyEmail')?.value||'',shopifyStatus:$('#coShopifyStatus')?.value||'Da collegare',shopifyTag:$('#coShopifyTag')?.value||'commercialista',lastSync:$('#coLastSync')?.value||'',version:toNum($('#coVersion')?.value)||1,plan:$('#coPlan')?.value||'Normal',planPrice:price,billing:$('#coBilling')?.value||'Annuale',startPlan:$('#coStartPlan')?.value||today(),deadline:$('#coDeadline')?.value||'',paid,remaining,payMethod:$('#coPayMethod')?.value||'',payStatus:$('#coPayStatus')?.value||'',assignedCommercialista:$('#coAssignedCommercialista')?.value||'',assignedOperator:$('#coAssignedOperator')?.value||'',internalTeam:$('#coInternalTeam')?.value||'',priority:$('#coPriority')?.value||'Normale',status:$('#coStatus')?.value||'Attivo',nextWork:$('#coNextWork')?.value||'',internalNotes:$('#coInternalNotes')?.value||'',services:$$('#coServicesBox input:checked').map(x=>x.value),docs:commUploads('#coDocs'),createdAt:today(),updatedAt:today()};
    if(!c.name||!c.vat||!c.email||!c.phone) return showToast('Compila almeno ragione sociale, P.IVA, email e telefono.', 'warning'); STATE.companies.unshift(c); STATE.commDeadlines.unshift({id:`dead-${Date.now()}`,companyId:id,type:'Rinnovo piano',date:c.deadline,priority:c.priority,desc:`Rinnovo piano ${c.plan}`}); STATE.communications.unshift({id:`c-${Date.now()}`,target:'commercialista',companyId:id,title:'Nuovo cliente creato',message:`${c.name} · piano ${c.plan} · Shopify ${c.shopifyStatus}`,date:today(),priority:'Normale'}); commActivity('Cliente creato',c.name); saveState(); e.target.reset(); STATE.commProfileId=id; commRenderServiceToggles(); renderAll(); switchSimple('comm','comm-clienti'); showToast('Cliente / ditta salvato e profilo creato.');
  };
  submitInvoice = function(e){ e.preventDefault(); commEnsureData(); const net=toNum($('#invNet')?.value), vat=toNum($('#invVatRate')?.value), total=+(net+(net*vat/100)).toFixed(2); const item={id:`inv-${Date.now()}`,companyId:$('#invCompany')?.value,type:$('#invType')?.value,client:$('#invClient')?.value,desc:$('#invDesc')?.value,net,vatRate:vat,total,due:$('#invDue')?.value,status:$('#invStatus')?.value,message:$('#invMessage')?.value,fileLink:$('#invFileLink')?.value,date:today()}; STATE.invoices.unshift(item); STATE.communications.unshift({id:`c-${Date.now()}`,target:'commercialista',companyId:item.companyId,title:'Aggiornamento fattura',message:`${item.desc} · ${money(total)} · ${item.status}`,date:today(),priority:'Normale'}); commActivity('Fattura salvata',`${commCompanyName(item.companyId)} · ${money(total)}`); saveState(); e.target.reset(); renderAll(); showToast('Fattura/comunicazione salvata.'); };
  function commSubmitSales(e){ e.preventDefault(); const card=toNum($('#saleCard')?.value), cash=toNum($('#saleCash')?.value), other=toNum($('#saleOther')?.value), agency=toNum($('#saleAgencyTotal')?.value); const diff=card+cash+other-agency; if(diff!==0&&!$('#saleNote')?.value) return showToast('Differenza rilevata: inserisci una nota/motivazione.', 'warning'); if($('#saleStatus')?.value==='Completata'&&!$('#saleClosureNo')?.value) return showToast('Per completare serve numero chiusura.', 'warning'); const item={id:`sale-${Date.now()}`,companyId:$('#saleCompany')?.value,date:$('#saleDate')?.value||today(),card,cash,other,agencyTotal:agency,closureNo:$('#saleClosureNo')?.value,status:diff!==0?'Differenza rilevata':($('#saleStatus')?.value||'Bozza'),firma:$('#saleFirma')?.value,note:$('#saleNote')?.value,file:commUploads('#saleFile')[0]||'',operator:STATE.session?.name}; STATE.commSales.unshift(item); commActivity('Chiusura giornaliera salvata',commCompanyName(item.companyId)); saveState(); e.target.reset(); renderAll(); showToast('Vendite / chiusura salvata.'); }
  function commSubmitF24(e){ e.preventDefault(); const item={id:`f24-${Date.now()}`,companyId:$('#f24Company')?.value,type:$('#f24Type')?.value,period:$('#f24Period')?.value,amount:toNum($('#f24Amount')?.value),due:$('#f24Due')?.value,status:$('#f24Status')?.value,receipt:$('#f24Receipt')?.value,note:$('#f24Note')?.value}; STATE.commF24.unshift(item); STATE.commDeadlines.unshift({id:`dead-${Date.now()}`,companyId:item.companyId,type:`F24 ${item.type}`,date:item.due,priority:'Alta',desc:`Importo ${money(item.amount)} · ${item.status}`}); commActivity('F24 creato',`${commCompanyName(item.companyId)} · ${money(item.amount)}`); saveState(); e.target.reset(); renderAll(); showToast('F24 salvato.'); }
  function commSubmitEmployee(e){ e.preventDefault(); const item={id:`emp-${Date.now()}`,companyId:$('#empCompany')?.value,name:$('#empName')?.value,cf:$('#empCf')?.value,contract:$('#empContract')?.value,start:$('#empStart')?.value,end:$('#empEnd')?.value,payroll:$('#empPayroll')?.value,status:$('#empStatus')?.value}; STATE.commEmployees.unshift(item); commActivity('Dipendente salvato',`${item.name} · ${commCompanyName(item.companyId)}`); saveState(); e.target.reset(); renderAll(); showToast('Dipendente salvato.'); }
  function commSubmitDocument(e){ e.preventDefault(); const item={id:`doc-${Date.now()}`,companyId:$('#docCompany')?.value,category:$('#docCategory')?.value,visible:$('#docVisible')?.value,expiry:$('#docExpiry')?.value,desc:$('#docDesc')?.value,files:commUploads('#docFile'),date:today(),status:'Caricato'}; STATE.commDocuments.unshift(item); commActivity('Documento caricato',`${commCompanyName(item.companyId)} · ${item.category}`); saveState(); e.target.reset(); commFilePreviewChange('#docFile','#docFilePreview'); renderAll(); showToast('Documento salvato.'); }
  function commSubmitMessage(e){ e.preventDefault(); const item={id:`c-${Date.now()}`,target:'commercialista',companyId:$('#msgCompany')?.value,type:$('#msgType')?.value,priority:$('#msgPriority')?.value,channel:$('#msgChannel')?.value,title:$('#msgSubject')?.value,message:$('#msgBody')?.value,date:today(),status:'Inviato'}; STATE.communications.unshift(item); commActivity('Comunicazione inviata',`${commCompanyName(item.companyId)} · ${item.type}`); saveState(); e.target.reset(); renderAll(); showToast('Comunicazione salvata/inviata.'); }
  function commSubmitDeadline(e){ e.preventDefault(); const item={id:`dead-${Date.now()}`,companyId:$('#deadCompany')?.value,type:$('#deadType')?.value,date:$('#deadDate')?.value,priority:$('#deadPriority')?.value,desc:$('#deadDesc')?.value}; STATE.commDeadlines.unshift(item); commActivity('Scadenza creata',`${commCompanyName(item.companyId)} · ${item.type}`); saveState(); e.target.reset(); renderAll(); showToast('Scadenza salvata.'); }
  function commSubmitBackup(e){ e.preventDefault(); const item={id:`bk-${Date.now()}`,type:$('#backupType')?.value,companyId:$('#backupCompany')?.value,dest:$('#backupDest')?.value,status:'Completato',date:today(),note:$('#backupNote')?.value}; STATE.commBackups.unshift(item); commActivity('Backup creato',`${item.type} · ${commCompanyName(item.companyId)}`); saveState(); e.target.reset(); renderAll(); showToast('Backup registrato.'); }
  document.addEventListener('click',e=>{ const step=e.target.closest('[data-comm-step]'); if(step){ $$('.comm-step-nav button').forEach(b=>b.classList.remove('active')); step.classList.add('active'); $$('.comm-step-panel').forEach(p=>p.classList.remove('active')); $('#'+step.dataset.commStep)?.classList.add('active'); commUpdateWizardPreview(); } const next=e.target.closest('[data-comm-next]'); if(next){ const btns=$$('.comm-step-nav button'); const idx=btns.findIndex(b=>b.classList.contains('active')); (btns[idx+1]||btns[0])?.click(); } const prev=e.target.closest('[data-comm-prev]'); if(prev){ const btns=$$('.comm-step-nav button'); const idx=btns.findIndex(b=>b.classList.contains('active')); (btns[idx-1]||btns[btns.length-1])?.click(); } const prof=e.target.closest('[data-comm-profile]'); if(prof){ renderCommProfile(prof.dataset.commProfile); switchSimple('comm','comm-clienti'); } });
  document.addEventListener('submit',e=>{ if(e.target.id==='commSalesForm') commSubmitSales(e); if(e.target.id==='commF24Form') commSubmitF24(e); if(e.target.id==='commEmployeeForm') commSubmitEmployee(e); if(e.target.id==='commDocumentForm') commSubmitDocument(e); if(e.target.id==='commMessageForm') commSubmitMessage(e); if(e.target.id==='commDeadlineForm') commSubmitDeadline(e); if(e.target.id==='commBackupForm') commSubmitBackup(e); });
  ['input','change'].forEach(ev=>document.addEventListener(ev,e=>{ if(e.target.closest('#companyForm')) commUpdateWizardPreview(); if(e.target.id==='coDocs') commFilePreviewChange('#coDocs','#coDocsPreview'); if(e.target.id==='docFile') commFilePreviewChange('#docFile','#docFilePreview'); if(e.target.id==='commClientSearch'||e.target.id==='commClientStatusFilter'||e.target.id==='commPlanFilter') renderCommClients(); }));



  /* ========================= v16 Agent Pro - CGN-style portal upgrade ========================= */
  function v16AgentStats(){
    const list=agentPratiche();
    const todayStr=today();
    const month=todayStr.slice(0,7);
    const byStatus=list.reduce((a,p)=>{a[p.status]=(a[p.status]||0)+1; return a;},{});
    return {
      list,
      todayCreated:list.filter(p=>(p.createdAt||'').slice(0,10)===todayStr).length,
      monthCreated:list.filter(p=>(p.createdAt||'').slice(0,7)===month).length,
      ready:list.filter(p=>p.documentStatus==='Documenti ricevuti'||p.status==='In verifica').length,
      missing:list.filter(p=>(p.missingDocs||[]).length||p.status==='Documenti mancanti').length,
      completed:list.filter(p=>p.status==='Completata').length,
      pendingCommission:list.reduce((sum,p)=>sum+(p.commissionStatus==='Paid'?0:Number(p.commission||0)),0),
      byStatus
    };
  }
  function v16ServiceShortcutHtml(){
    const keys=['730','isee-ordinario','isee-universita','isee-corrente','naspi','dimissioni','assegno-unico-universale','permesso-rinnovo','carta-soggiorno','cittadinanza-italiana','f24-compilazione','apertura-partita-iva'];
    return keys.map(k=>{
      const s=serviceByKey(k); if(!s||!canUseService(s.key)) return '';
      const ag=v9AgencyForService(s);
      return `<button class="v16-service-tile" data-service-key="${safe(s.key)}"><span class="v16-tile-icon ${ag.key}"><i class="fa-solid ${ag.icon}"></i></span><b>${safe(s.title)}</b><small>${safe(s.group)} · ${money(s.cost)}</small></button>`;
    }).join('');
  }
  function v16EnsureAgentShell(){
    const home=$('#agent-home'); if(!home||STATE.session?.role!=='agent') return;
    if(!$('#agentProHero')){
      home.insertAdjacentHTML('afterbegin',`<section id="agentProHero" class="v16-agent-hero">
        <div class="v16-hero-left"><span class="v16-cgn-chip">CAF CAE AGENT PRO</span><h2>Portale operativo agente</h2><p>Domande CAF, Patronato, Immigrazione, Azienda e Academy con workflow Agent → Team Bangla → Team Italy → ricevuta finale.</p></div>
        <div class="v16-hero-actions"><button class="btn orange" data-service-key="730"><i class="fa-solid fa-file-invoice-dollar"></i> Nuovo 730</button><button class="btn blue" data-service-key="isee-ordinario"><i class="fa-solid fa-calculator"></i> Nuovo ISEE</button><button class="btn light" data-service-key="naspi"><i class="fa-solid fa-building-columns"></i> NASpI</button></div>
      </section>
      <section id="agentProKpi" class="v16-kpi-strip"></section>
      <section class="white-card v16-quick-services"><div class="card-head"><h3>Domande rapide tipo CGN</h3><span class="meta">Seleziona servizio, compila dati, firma delega e invia al team</span></div><div id="agentProServiceTiles" class="v16-service-grid"></div></section>
      <section class="grid-2 v16-agent-workflow"><div class="white-card"><div class="card-head"><h3>Pipeline pratiche</h3><span class="meta">controllo stato live</span></div><div id="agentPipelineBoard" class="v16-pipeline"></div></div><div class="white-card"><div class="card-head"><h3>Ricevute e documenti</h3><button class="link-btn" data-agent-tab="agent-pratiche">apri pratiche</button></div><div id="agentReceiptBoard" class="flat-list compact"></div></div></section>`);
    }
  }
  function v16RenderAgentPro(){
    if(STATE.session?.role!=='agent') return;
    v16EnsureAgentShell();
    const st=v16AgentStats();
    const kpi=$('#agentProKpi'); if(kpi) kpi.innerHTML=`
      <div class="v16-metric"><span>Oggi</span><b>${st.todayCreated}</b><small>domande create</small></div>
      <div class="v16-metric"><span>Mese</span><b>${st.monthCreated}</b><small>domande create</small></div>
      <div class="v16-metric"><span>Pronte</span><b>${st.ready}</b><small>docs ricevuti / Italy</small></div>
      <div class="v16-metric warn"><span>Mancanti</span><b>${st.missing}</b><small>da completare</small></div>
      <div class="v16-metric green"><span>Commissioni</span><b>${money(st.pendingCommission)}</b><small>pending</small></div>`;
    const tiles=$('#agentProServiceTiles'); if(tiles) tiles.innerHTML=v16ServiceShortcutHtml();
    const pipe=$('#agentPipelineBoard'); if(pipe){
      const groups=[['Nuova','Agent'],['Documenti mancanti','Mancanti'],['In verifica','Italy'],['Completata','Completata']];
      pipe.innerHTML=groups.map(([status,label])=>{
        const rows=st.list.filter(p=>p.status===status).slice(0,4);
        return `<div class="v16-pipe-col"><h4>${label}<span>${st.byStatus[status]||0}</span></h4>${rows.map(p=>`<button class="v16-pipe-item" data-detail="${p.id}"><b>${safe(p.code)}</b><small>${safe(fullName(p.client))} · ${safe(p.serviceTitle)}</small></button>`).join('')||'<div class="v16-empty-mini">Nessuna</div>'}</div>`;
      }).join('');
    }
    const rb=$('#agentReceiptBoard'); if(rb){
      const rows=st.list.slice(0,5);
      rb.innerHTML=rows.map(p=>`<div class="flat-item"><div><div class="title">${safe(p.code)} · ${safe(p.serviceTitle)}</div><div class="meta">Ricevuta: ${safe(v16ReceiptNo(p))} · ${safe(p.status)}</div></div><button class="btn light" data-download-doc="ricevuta-${p.id}">Ricevuta</button></div>`).join('')||emptyFlat('Nessuna ricevuta','Crea una domanda per generare ricevuta ufficiale.');
    }
  }
  const v16_oldRenderAgentDashboard = renderAgentDashboard;
  renderAgentDashboard = function(){ v16_oldRenderAgentDashboard(); v16RenderAgentPro(); };

  function v16ReceiptNo(p){
    if(!p) return 'BOZZA';
    if(!p.receiptNo){
      const seq=String((STATE.pratiche||[]).findIndex(x=>x.id===p.id)+1 || (STATE.pratiche||[]).length+1).padStart(5,'0');
      p.receiptNo=`CAFCAE-${(p.createdAt||today()).slice(0,4)}-${seq}`;
    }
    return p.receiptNo;
  }
  function v16DocumentRows(obj){
    return Object.entries(obj||{}).filter(([_,v])=>v!==undefined&&v!==null&&String(v).trim()!=='').map(([k,v])=>`<tr><td>${safe(k)}</td><td>${safe(v)}</td></tr>`).join('');
  }
  function v16OfficialDoc(type, pratica){
    let p=pratica;
    const m=String(type||'').match(/(delega|ricevuta|fascicolo-pratica)-(.+)/);
    if(!p&&m) p=STATE.pratiche.find(x=>x.id===m[2])||STATE.pratiche.find(x=>x.code===m[2]);
    if(!p) return v16_oldDocHtml(type, pratica);
    const client=p.client||{}; const receiptNo=v16ReceiptNo(p); const isReceipt=String(type).includes('ricevuta'); const isDelegation=String(type).includes('delega');
    const title=isReceipt?'RICEVUTA UFFICIALE CONSEGNA DOCUMENTI':isDelegation?'DELEGA E MANDATO PROFESSIONALE':'FASCICOLO PRATICA CAF CAE';
    const docs=(p.uploads||[]).map(x=>`<li>${safe(x)}</li>`).join('')||'<li>Nessun file caricato nel browser; documenti indicati da checklist.</li>';
    const dataRows=v16DocumentRows(p.serviceData);
    const sig=p.signatureDataUrl||p.signature730DataUrl||STATE.signatureDataUrl||STATE.signature730DataUrl||'';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title} ${safe(p.code)}</title><style>
      body{font-family:Arial,Helvetica,sans-serif;color:#0b1b33;margin:0;background:#eef4f8}.page{max-width:900px;margin:22px auto;background:#fff;padding:34px;border:1px solid #d8e2ee}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:5px solid #1f78a8;padding-bottom:14px}.brand{display:flex;gap:14px;align-items:center}.brand img{height:54px}.brand h1{margin:0;color:#1f78a8;font-size:28px}.brand p{margin:2px 0;color:#64748b}.proto{text-align:right}.proto b{display:block;font-size:18px;color:#0b1b33}.stamp{border:2px solid #1f78a8;border-radius:12px;padding:8px 12px;color:#1f78a8;font-weight:800;display:inline-block;margin-top:8px}.bar{height:46px;background:repeating-linear-gradient(90deg,#111 0 3px,#fff 3px 7px,#111 7px 9px,#fff 9px 14px);opacity:.65;border-radius:4px;margin-top:10px}.h{background:#eaf6ff;border-left:5px solid #1f78a8;padding:12px 14px;margin:20px 0 12px;font-size:20px;font-weight:900}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #e5edf5;padding:9px}.row span{color:#64748b}.box{border:1px solid #dce7f2;border-radius:12px;padding:14px;margin:14px 0}.docs li{margin:6px 0}.tbl{width:100%;border-collapse:collapse}.tbl td{border:1px solid #e5edf5;padding:8px}.tbl td:first-child{background:#f8fbfe;font-weight:700;width:36%}.notice{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;color:#7c2d12}.sig{margin-top:26px;display:grid;grid-template-columns:1fr 1fr;gap:25px}.sigbox{height:120px;border-bottom:2px solid #0b1b33;display:flex;align-items:flex-end}.sigbox img{max-height:100px;max-width:330px}.footer{font-size:12px;color:#64748b;margin-top:22px;border-top:1px solid #e5edf5;padding-top:12px}.pill{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800}@media print{body{background:#fff}.page{margin:0;border:0}.no-print{display:none}}
      </style></head><body><div class="page"><div class="top"><div class="brand"><img src="assets/caf-cae-logo.png" alt="CAF CAE"><div><h1>CAF CAE</h1><p>LA TUA PRATICA, LA NOSTRA PRIORITÀ.</p><p>Documento generato dal portale operativo CAF CAE</p></div></div><div class="proto"><span class="pill">${safe(p.agency||'CAF / Patronato')}</span><b>${safe(receiptNo)}</b><small>Data: ${safe(today())}</small><div class="stamp">${isReceipt?'RICEVUTA':'MANDATO'}</div><div class="bar"></div></div></div><div class="h">${title}</div><div class="grid"><div class="box"><div class="row"><span>Codice pratica</span><b>${safe(p.code)}</b></div><div class="row"><span>Servizio</span><b>${safe(p.serviceTitle)}</b></div><div class="row"><span>Stato</span><b>${safe(p.status)}</b></div><div class="row"><span>Pagamento</span><b>${safe(p.paymentMode||p.paymentStatus||'Credito agente')}</b></div></div><div class="box"><div class="row"><span>Cliente</span><b>${safe(fullName(client))}</b></div><div class="row"><span>Codice fiscale</span><b>${safe(client.cf||'--')}</b></div><div class="row"><span>Telefono</span><b>${safe(client.phone||'--')}</b></div><div class="row"><span>Email</span><b>${safe(client.email||'--')}</b></div></div></div><div class="box"><h2>Dati specifici domanda</h2><table class="tbl">${dataRows||'<tr><td>Note</td><td>Nessun dato specifico salvato</td></tr>'}</table></div><div class="box"><h2>Documenti ricevuti / richiesti</h2><ul class="docs">${docs}</ul><p><b>Documenti mancanti:</b> ${safe((p.missingDocs||[]).join(', ')||'Nessuno')}</p></div><div class="notice"><b>Nota operativa:</b> questa ricevuta conferma la consegna/registrazione dei dati nel portale CAF CAE. La lavorazione definitiva, eventuale trasmissione ufficiale e protocolli esterni restano soggetti a controllo del team abilitato e agli esiti dei portali ufficiali.</div><div class="box"><h2>Mandato e privacy</h2><p>Il cliente conferisce mandato a CAF CAE e ai suoi incaricati/autorizzati per raccolta documenti, verifica preliminare, predisposizione pratica, richiesta integrazioni e comunicazioni relative al servizio indicato. Il cliente dichiara di aver letto e accettato informativa privacy e trattamento dati necessari.</p></div><div class="sig"><div><div class="sigbox">${sig?`<img src="${sig}" alt="firma cliente">`:'Firma cliente'}</div><small>Firma cliente / delegante</small></div><div><div class="sigbox">CAF CAE / incaricato</div><small>Firma operatore autorizzato</small></div></div><div class="footer">CAF CAE · www.cafcae.it · WhatsApp +39 353 375 5988 · Documento interno generato automaticamente · ${safe(receiptNo)}</div></div><script>window.print()</script></body></html>`;
  }
  const v16_oldDocHtml = docHtml;
  docHtml = function(type, pratica){
    if(String(type).includes('ricevuta')||String(type).includes('delega')||String(type).includes('fascicolo-pratica')) return v16OfficialDoc(type, pratica);
    return v16_oldDocHtml(type, pratica);
  };
  const v16_oldDownloadPratica = downloadPratica;
  downloadPratica = function(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return v16_oldDownloadPratica(id); downloadHtml(`${p.code}-fascicolo-ufficiale.html`, docHtml('fascicolo-pratica-'+p.id, p)); };


  /* ========================= v17 Agent CGN-style from user recording ========================= */
  function v17CgnServiceSections(){
    const groups = (CATALOG.agentServiceGroups || []).filter(g => (g.services || []).length);
    return groups.map((g, idx) => ({
      title: g.group || `Gruppo ${idx + 1}`,
      color: g.color || ['blue','green','orange','red','purple','cyan'][idx % 6],
      icon: g.icon || 'fa-folder-open',
      items: (g.services || []).map(s => [s.key, s.title, s.icon || g.icon || v19IconForService(s), s.enabled === false ? 'Da attivare' : 'Attivo'])
    }));
  }
  function v17ServiceStatusPill(status){
    const cls = status === 'Attivo' ? 'ok' : status === 'Attivazione in corso' ? 'warn' : 'muted';
    const icon = status === 'Attivo' ? 'fa-circle-check' : status === 'Attivazione in corso' ? 'fa-circle-exclamation' : 'fa-circle-plus';
    return `<span class="v17-status ${cls}"><i class="fa-solid ${icon}"></i>${safe(status)}</span>`;
  }
  function v17AgentServiceStatus(key, fallbackStatus){
    const svc = serviceByKey(key);
    if (!svc || svc.enabled === false) return 'Da attivare';
    return canUseService(key) ? 'Attivo' : 'Da attivare';
  }
  function v17CatalogItem(item){
    const [key,title,icon,status] = item;
    const finalStatus = v17AgentServiceStatus(key, status);
    const usable = finalStatus === 'Attivo';
    return `<button class="v17-cgn-service ${usable ? '' : 'disabled'}" ${usable ? `data-service-key="${safe(key)}"` : `title="Servizio non abilitato per questo agente"`}>
      <span class="v17-cgn-service-icon"><i class="fa-solid ${safe(icon)}"></i></span>
      <span class="v17-cgn-service-main"><b>${safe(title)}</b>${v17ServiceStatusPill(finalStatus)}</span>
    </button>`;
  }
  function v17CgnCatalogHtml(){
    return `<div class="v17-cgn-catalog">${v17CgnServiceSections().map(sec => `<section class="v17-cgn-col ${safe(sec.color)}"><h3>${safe(sec.title)}</h3><div class="v17-cgn-list">${sec.items.map(v17CatalogItem).join('')}</div></section>`).join('')}</div>`;
  }
  function v17ServiceFavouritesHtml(){
    const favs = [
      ['730','730','Dichiarazione 730 con quadri, CU, delega e liquidazione interna','fa-file-invoice-dollar'],
      ['isee-ordinario','ISEE','DSU/ISEE ordinario, università, corrente e minorenni','fa-people-roof'],
      ['naspi','NASpI','Disoccupazione, ultimo lavoro, IBAN e CPI','fa-briefcase'],
      ['f24-compilazione','F24','Compilazione tributi, rate, scadenza e ricevuta','fa-money-check-dollar']
    ];
    return favs.map(([key,title,txt,icon]) => {
      const active = v17AgentServiceStatus(key, 'Da attivare') === 'Attivo';
      return `<button class="v17-fav-card ${active ? '' : 'disabled'}" ${active ? `data-service-key="${safe(key)}"` : `title="Servizio non abilitato per questo agente"`}><i class="fa-solid ${safe(icon)}"></i><b>${safe(title)}</b><span>${safe(txt)}</span>${v17ServiceStatusPill(active ? 'Attivo' : 'Da attivare')}</button>`;
    }).join('');
  }
  function v17EnsureAgentCgnShell(){
    if(STATE.session?.role !== 'agent') return;
    const actionbar = $('#dashboard-agent .cgn-actionbar .actionbar-actions');
    if(actionbar && !$('#agentCgnPlatformBtn')){
      actionbar.insertAdjacentHTML('afterbegin', `<button id="agentCgnPlatformBtn" class="btn light" data-agent-tab="agent-cgn-platform"><i class="fa-solid fa-th-large"></i> Piattaforma</button>`);
    }
    const home = $('#agent-home');
    if(home && !$('#v17AgentWelcome')){
      home.insertAdjacentHTML('afterbegin', `
        <section id="v17AgentWelcome" class="v17-cgn-welcome">
          <div><span class="v17-cgn-kicker">Piattaforma CAF CAE</span><h2>Benvenuto nella tua area operativa</h2><p>Gestisci pratiche, documenti, deleghe, ricevute e comunicazioni con Team Bangla / Team Italy in un flusso stile CGN.</p></div>
          <div class="v17-welcome-illustration"><i class="fa-solid fa-laptop-file"></i></div>
        </section>
        <section class="white-card v17-favourites"><div class="card-head"><h3>I tuoi servizi preferiti</h3><button class="link-btn" data-agent-tab="agent-cgn-platform">Scopri tutti i servizi</button></div><div class="v17-fav-grid">${v17ServiceFavouritesHtml()}</div></section>`);
    }
    if(!$('#agent-cgn-platform')){
      $('#agent-home')?.insertAdjacentHTML('afterend', `
        <div id="agent-cgn-platform" class="agent-tab">
          <section class="v17-cgn-page-head"><div><h2>Piattaforma CAF CAE</h2><p>Catalogo servizi CAF CAE: scegli solo i servizi abilitati dall'admin e compila la domanda guidata.</p></div><div class="v17-head-actions"><button class="btn blue" data-service-key="730"><i class="fa-solid fa-plus"></i> Nuovo 730</button><button class="btn orange" data-service-key="isee-ordinario"><i class="fa-solid fa-plus"></i> Nuovo ISEE</button></div></section>
          ${v17CgnCatalogHtml()}
          <section class="white-card v17-cgn-notes"><div class="card-head"><h3>Struttura servizi CAF CAE</h3><span class="meta">CAF CAE live system</span></div><div class="v17-note-grid"><div class="v17-note"><b>Workflow a scheda cliente</b><span>Prima servizio, poi cliente, dati specifici, documenti, delega e ricevuta.</span></div><div class="v17-note"><b>Catalogo completo CAF CAE</b><span>CAF/Comune, Patronato, Immigrazione, Flussi, Azienda e Academy.</span></div><div class="v17-note"><b>Stati pratica</b><span>Nuova, documenti mancanti, verifica, Italy, completata.</span></div><div class="v17-note"><b>Ricevute ufficiali</b><span>Protocollo CAFCAE, dati cliente e fascicolo.</span></div></div></section>
        </div>`);
    }
    const formCard = $('#agent-new .form-card');
    if(formCard && !$('#v17CgnFlowStrip')){
      formCard.insertAdjacentHTML('afterbegin', `<div id="v17CgnFlowStrip" class="v17-flow-strip"><span class="active"><i class="fa-solid fa-user"></i> Cliente</span><span><i class="fa-solid fa-clipboard-list"></i> Dati servizio</span><span><i class="fa-solid fa-folder-open"></i> Documenti</span><span><i class="fa-solid fa-signature"></i> Delega/Firma</span><span><i class="fa-solid fa-receipt"></i> Ricevuta</span></div>`);
    }
  }
  function v17ApplyCgnFieldHints(){
    const s = STATE.selectedService;
    if(!s) return;
    const box = $('#serviceSpecificArea');
    if(!box || $('#v17AgencyBand')) return;
    const agency = (typeof v9AgencyForService === 'function') ? v9AgencyForService({ title:s.title, group:s.group, special:s.serviceKey || s.key }) : { label:s.group || 'CAF CAE', cls:'' };
    box.insertAdjacentHTML('afterbegin', `<div id="v17AgencyBand" class="v17-agency-band"><span class="agency-badge ${safe(agency.cls||'')}"><i class="fa-solid fa-building-columns"></i>${safe(agency.label || 'CAF CAE')}</span><span class="v17-agency-note">Flusso guidato: dati obbligatori, documenti, delega e ricevuta ufficiale CAF CAE.</span></div>`);
  }
  const v17_oldSelectService = selectService;
  selectService = function(key, openTab = true){ v17_oldSelectService(key, openTab); v17ApplyCgnFieldHints(); };
  const v17_oldRenderAgentDashboard = renderAgentDashboard;
  renderAgentDashboard = function(){ v17_oldRenderAgentDashboard(); v17EnsureAgentCgnShell(); v17ApplyCgnFieldHints(); };




/* v19 CAF CAE own catalogue + appointment system + header/logo polish */
function v19IconForService(s = {}) {
  const key = String(s.key || s.special || '').toLowerCase();
  const title = String(s.title || '').toLowerCase();
  if (key.includes('isee') || title.includes('isee')) return 'fa-people-roof';
  if (key.includes('730') || title.includes('730')) return 'fa-file-invoice-dollar';
  if (key.includes('naspi') || title.includes('disoccup')) return 'fa-briefcase';
  if (key.includes('permesso') || key.includes('cittadinanza') || title.includes('soggiorno')) return 'fa-passport';
  if (key.includes('flussi')) return 'fa-plane-arrival';
  if (key.includes('f24')) return 'fa-money-check-dollar';
  if (key.includes('bonus')) return 'fa-gift';
  if (key.includes('spid') || key.includes('cie')) return 'fa-id-card';
  if (key.includes('firma') || key.includes('pec')) return 'fa-signature';
  if (key.includes('azienda') || key.includes('partita') || title.includes('piva')) return 'fa-building';
  if (key.includes('corso') || key.includes('academy') || key.includes('esame')) return 'fa-graduation-cap';
  if (key.includes('affitto') || key.includes('residenza')) return 'fa-house';
  return 'fa-folder-open';
}

function v19EnsureAppointments() {
  STATE.appointments ||= [];
}

function v19RoleLabel(role){
  return ({ admin:'Admin', agent:'Agente', bangla:'Team Bangla', italy:'Team Italy', commercialista:'Commercialista' })[role] || role || 'Team';
}

function v19AppointmentForm(prefix, role){
  const serviceOptions = allServicesFlat().slice(0, 90).map(s => `<option value="${safe(s.key)}">${safe(s.group)} › ${safe(s.title)}</option>`).join('');
  const assign = role === 'admin'
    ? `<label>Assegna a <select id="${prefix}ApptAssign"><option value="admin">Admin</option><option value="bangla">Team Bangla</option><option value="italy">Team Italy</option><option value="commercialista">Commercialista</option><option value="agent">Agente</option></select></label>`
    : `<input id="${prefix}ApptAssign" type="hidden" value="${safe(role)}" />`;
  return `<section class="white-card v19-appointment-card" id="${prefix}AppointmentCard">
    <div class="card-head"><div><h3><i class="fa-solid fa-calendar-plus"></i> Appuntamenti / chiamate</h3><p class="meta">Crea appuntamento quando chiama un cliente: resta visibile ad Admin, Team Bangla e Team Italy.</p></div><span class="chip green" id="${prefix}ApptCount">0 oggi</span></div>
    <form id="${prefix}AppointmentForm" class="form-grid cols-4 v19-appointment-form" data-appt-prefix="${prefix}" data-appt-role="${safe(role)}">
      <label>Cliente <input id="${prefix}ApptClient" placeholder="Nome cliente" required></label>
      <label>Telefono/WhatsApp <input id="${prefix}ApptPhone" placeholder="+39..." required></label>
      <label>Data <input id="${prefix}ApptDate" type="date" value="${today()}" required></label>
      <label>Ora <input id="${prefix}ApptTime" type="time"></label>
      <label>Servizio <select id="${prefix}ApptService"><option value="">Da decidere</option>${serviceOptions}</select></label>
      ${assign}
      <label>Priorità <select id="${prefix}ApptPriority"><option>Normale</option><option>Urgente</option><option>Richiamare oggi</option></select></label>
      <label>Stato <select id="${prefix}ApptStatus"><option>Programmato</option><option>Da richiamare</option><option>Completato</option><option>Annullato</option></select></label>
      <label class="form-span">Note chiamata / richiesta <textarea id="${prefix}ApptNote" placeholder="Cosa vuole il cliente? Documenti, scadenza, pratica..."></textarea></label>
      <button class="btn orange form-span" type="submit"><i class="fa-solid fa-calendar-check"></i> Salva appuntamento</button>
    </form>
    <div class="v19-appointment-list" id="${prefix}AppointmentList"></div>
  </section>`;
}

function v19AppointmentVisible(list, role){
  if(role === 'admin') return list;
  return list.filter(a => a.assignTo === role || a.createdByRole === role || (role === 'bangla' && a.assignTo === 'team_bangla') || (role === 'italy' && a.assignTo === 'team_italy'));
}

function v19RenderAppointmentList(prefix, role){
  v19EnsureAppointments();
  const box = $(`#${prefix}AppointmentList`);
  if(!box) return;
  const list = v19AppointmentVisible(STATE.appointments || [], role).slice().sort((a,b)=>String(`${a.date} ${a.time||''}`).localeCompare(String(`${b.date} ${b.time||''}`))).slice(0, 12);
  const todayCount = list.filter(a => a.date === today() && a.status !== 'Annullato').length;
  const count = $(`#${prefix}ApptCount`); if(count) count.textContent = `${todayCount} oggi`;
  box.innerHTML = list.map(a => `<div class="flat-item v19-appt-row ${a.priority === 'Urgente' ? 'urgent' : ''}">
    <div><div class="title">${safe(a.date)} ${safe(a.time || '')} · ${safe(a.client)}</div>
    <div class="meta"><b>${safe(a.phone)}</b> · ${safe(a.serviceTitle || 'Da decidere')} · ${safe(v19RoleLabel(a.assignTo))}<br>${safe(a.note || '')}</div></div>
    <div class="v19-appt-actions"><span class="chip ${a.status === 'Completato' ? 'green' : a.priority === 'Urgente' ? 'red' : 'orange'}">${safe(a.status)}</span><button class="btn light" data-appt-done="${safe(a.id)}">Fatto</button></div>
  </div>`).join('') || emptyFlat('Nessun appuntamento', 'Quando ricevi chiamate o WhatsApp, salva qui la richiesta.');
}

function v19SubmitAppointment(e){
  const form = e.target.closest('form[data-appt-prefix]');
  if(!form) return;
  e.preventDefault();
  v19EnsureAppointments();
  const p = form.dataset.apptPrefix;
  const serviceKey = $(`#${p}ApptService`)?.value || '';
  const svc = serviceByKey(serviceKey) || {};
  const item = {
    id:`appt-${Date.now()}`,
    client:$(`#${p}ApptClient`)?.value || '',
    phone:$(`#${p}ApptPhone`)?.value || '',
    date:$(`#${p}ApptDate`)?.value || today(),
    time:$(`#${p}ApptTime`)?.value || '',
    serviceKey,
    serviceTitle: svc.title || 'Da decidere',
    assignTo:$(`#${p}ApptAssign`)?.value || form.dataset.apptRole || STATE.session?.role,
    priority:$(`#${p}ApptPriority`)?.value || 'Normale',
    status:$(`#${p}ApptStatus`)?.value || 'Programmato',
    note:$(`#${p}ApptNote`)?.value || '',
    createdBy: STATE.session?.name,
    createdByRole: STATE.session?.role,
    createdAt: new Date().toISOString()
  };
  if(!item.client || !item.phone) return showToast('Inserisci cliente e telefono.', 'warning');
  STATE.appointments.unshift(item);
  saveState();
  form.reset();
  const date = $(`#${p}ApptDate`); if(date) date.value = today();
  renderAll();
  showToast('Appuntamento salvato.');
}

function v19InjectAppointments(){
  v19EnsureAppointments();
  const inserts = [
    ['admin-home','admin','adminHome'],
    ['bangla-home','bangla','banglaHome'],
    ['italy-home','italy','italyHome'],
    ['agent-home','agent','agentHome']
  ];
  inserts.forEach(([containerId, role, prefix]) => {
    const el = $(`#${containerId}`);
    if(el && !$(`#${prefix}AppointmentCard`)) {
      const target = el.querySelector('.kpi-row') || el.firstElementChild;
      if(target) target.insertAdjacentHTML('afterend', v19AppointmentForm(prefix, role));
      else el.insertAdjacentHTML('afterbegin', v19AppointmentForm(prefix, role));
    }
    v19RenderAppointmentList(prefix, role);
  });
}

document.body.addEventListener('submit', v19SubmitAppointment);
document.body.addEventListener('click', e => {
  const btn = e.target.closest('[data-appt-done]');
  if(btn){
    const a = (STATE.appointments || []).find(x => x.id === btn.dataset.apptDone);
    if(a){ a.status = 'Completato'; a.completedAt = new Date().toISOString(); saveState(); renderAll(); showToast('Appuntamento completato.'); }
  }
});

const v19_oldRenderAgentDashboard = renderAgentDashboard;
renderAgentDashboard = function(){ v19_oldRenderAgentDashboard(); v19InjectAppointments(); };
const v19_oldRenderBangla = renderBangla;
renderBangla = function(){ v19_oldRenderBangla(); v19InjectAppointments(); };
const v19_oldRenderItaly = renderItaly;
renderItaly = function(){ v19_oldRenderItaly(); v19InjectAppointments(); };
const v19_oldRenderAdmin = renderAdmin;
renderAdmin = function(){ v19_oldRenderAdmin(); v19InjectAppointments(); };



/* ========================= v20 Workflow Engine: Owner + Watchers + Timeline ========================= */
function v20RoleName(role){ return ({admin:'Admin', agent:'Agente', bangla:'Team Bangla', italy:'Team Italy', commercialista:'Commercialista'})[role] || role || 'Team'; }
function v20OwnerLabel(owner){ return v20RoleName(owner || 'bangla'); }
function v20OwnerOptions(){ return ['bangla','italy','commercialista','admin'].map(r=>`<option value="${r}">${v20RoleName(r)}</option>`).join(''); }
function v20AddUnique(arr=[], values=[]){ const out=[...(Array.isArray(arr)?arr:[])]; values.filter(Boolean).forEach(v=>{ if(!out.includes(v)) out.push(v); }); return out; }
function v20NormalizePractice(p){
  if(!p) return p;
  const createdRole = p.createdByRole || (p.source === 'agent' ? 'agent' : p.source === 'bangla' ? 'bangla' : p.source === 'admin' ? 'admin' : p.source || 'admin');
  const owner = p.currentOwner || p.workflowOwner || p.assignedTeam || p.routeTeam || 'bangla';
  p.currentOwner = owner;
  p.workflowOwner = owner;
  p.assignedTeam = owner;
  p.routeTeam = owner;
  p.workflowStatus ||= p.status || 'Nuova';
  p.workflowStep ||= p.status || 'Nuova';
  p.progress = Number(p.progress ?? (/completata/i.test(p.status||'') ? 100 : /verifica|processing|lavorazione/i.test(p.status||'') ? 60 : /documenti/i.test(p.status||'') ? 35 : 15));
  p.watchers = v20AddUnique(p.watchers, ['admin', owner, createdRole, p.agentEmail ? 'agent' : '', ...(p.previousOwners||[])]);
  p.previousOwners ||= [];
  p.teamHistory ||= [];
  p.workflowEvents ||= p.teamHistory.map(h=>({ id:`ev-${Date.now()}-${Math.random().toString(16).slice(2)}`, date:h.date||today(), by:h.by||'System', role:h.role||'system', action:h.action||'Update', type:'history' }));
  return p;
}
function v20NormalizeAll(){ STATE.pratiche ||= []; STATE.pratiche.forEach(v20NormalizePractice); STATE.practiceNotifications ||= []; STATE.practiceComments ||= []; }
function v20CanSeePractice(p, role=STATE.session?.role, email=STATE.session?.email){
  v20NormalizePractice(p);
  if(role === 'admin') return true;
  if(role === 'agent') return p.agentEmail === email || p.createdByEmail === email;
  return p.currentOwner === role || p.assignedTeam === role || p.routeTeam === role || (p.watchers||[]).includes(role) || (p.previousOwners||[]).includes(role);
}
function v20CanEditPractice(p, role=STATE.session?.role){ v20NormalizePractice(p); return role === 'admin' || p.currentOwner === role; }
function v20AddEvent(p, action, type='activity', extra={}){
  v20NormalizePractice(p);
  const ev = { id:`ev-${Date.now()}-${Math.random().toString(16).slice(2)}`, date:today(), time:new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}), by:STATE.session?.name||'System', role:STATE.session?.role||'system', action, type, ...extra };
  p.workflowEvents.unshift(ev);
  p.teamHistory.unshift({ by:ev.by, role:ev.role, action, date:today() });
  STATE.teamActions ||= [];
  STATE.teamActions.unshift({ id:`ta-${Date.now()}`, by:ev.by, role:ev.role, action, code:p.code, praticaId:p.id, date:today(), time:ev.time, target:extra.to||p.currentOwner });
  return ev;
}
function v20Notify(targetRole, p, title, message){
  STATE.practiceNotifications ||= [];
  STATE.practiceNotifications.unshift({ id:`nt-${Date.now()}-${Math.random().toString(16).slice(2)}`, targetRole, praticaId:p.id, praticaCode:p.code, title, message, read:false, date:today(), time:new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}), by:STATE.session?.name||'System' });
}
function v20TransferTo(id, target, reason){
  const p = STATE.pratiche.find(x=>x.id===id || x.code===id); if(!p) return showToast('Pratica non trovata.','error');
  v20NormalizePractice(p);
  const from = p.currentOwner || p.assignedTeam || 'bangla';
  const to = target || prompt('Trasferisci a: bangla / italy / commercialista / admin', 'italy');
  if(!to) return;
  const msg = reason || prompt('Motivo trasferimento:', `Trasferita da ${v20RoleName(from)} a ${v20RoleName(to)}`) || `Trasferita a ${v20RoleName(to)}`;
  p.previousOwners = v20AddUnique(p.previousOwners, [from]);
  p.currentOwner = to; p.workflowOwner = to; p.assignedTeam = to; p.routeTeam = to;
  p.status = to === 'commercialista' ? 'In lavorazione Commercialista' : to === 'italy' ? 'In verifica' : 'In lavorazione';
  p.workflowStatus = p.status; p.workflowStep = p.status; p.progress = Math.max(Number(p.progress||0), to === 'commercialista' ? 70 : 55);
  p.teamMessage = msg; p.updatedAt = today();
  p.watchers = v20AddUnique(p.watchers, ['admin', from, to, p.agentEmail ? 'agent' : '']);
  v20AddEvent(p, `Trasferita: ${v20RoleName(from)} → ${v20RoleName(to)}. ${msg}`, 'transfer', { from, to });
  v20Notify(to, p, 'Nuova pratica assegnata', `${p.code} ricevuta da ${v20RoleName(from)}.`);
  v20Notify('admin', p, 'Trasferimento pratica', `${p.code}: ${v20RoleName(from)} → ${v20RoleName(to)}.`);
  if(from !== 'admin') v20Notify(from, p, 'Pratica trasferita', `${p.code} ora è in carico a ${v20RoleName(to)}.`);
  saveState(); renderAll(); showToast(`Pratica inviata a ${v20RoleName(to)}. Rimane tracciabile per ${v20RoleName(from)}.`);
}

const v20_oldMergeOpsState = mergeOpsState;
mergeOpsState = function(shared={}){ v20_oldMergeOpsState(shared); v20NormalizeAll(); };
const v20_oldEnsureState = ensureState;
ensureState = function(){ v20_oldEnsureState(); v20NormalizeAll(); };
banglaPratiche = function(){ v20NormalizeAll(); return STATE.pratiche.filter(p => v20CanSeePractice(p,'bangla')); };
italyPratiche = function(){ v20NormalizeAll(); return STATE.pratiche.filter(p => v20CanSeePractice(p,'italy')); };
function commercialistaPratiche(){ v20NormalizeAll(); return STATE.pratiche.filter(p => v20CanSeePractice(p,'commercialista')); }

sendToItaly = function(id){ v20TransferTo(id, 'italy', 'Pratica controllata da Bangla e inviata a Team Italy.'); };
backToBangla = function(id){ v20TransferTo(id, 'bangla', prompt('Motivo ritorno a Team Bangla:', 'Dati/documenti da ricontrollare') || 'Ritornata a Bangla'); };
completePratica = function(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; v20NormalizePractice(p); p.status='Completata'; p.workflowStatus='Completata'; p.workflowStep='Completata'; p.progress=100; p.documentStatus='Documenti ricevuti'; p.paymentStatus=p.paymentStatus==='In attesa pagamento'?'Pagato':p.paymentStatus; p.teamMessage='Pratica completata.'; p.updatedAt=today(); v20AddEvent(p,'Pratica completata','status'); v20Notify('admin',p,'Pratica completata',`${p.code} completata da ${v20RoleName(STATE.session?.role)}.`); (p.watchers||[]).forEach(r=>r!=='admin'&&v20Notify(r,p,'Pratica completata',`${p.code} è stata completata.`)); saveState(); renderAll(); showToast('Pratica completata e notifiche inviate.'); };
askMissing = function(id, source){ const p=STATE.pratiche.find(x=>x.id===id); if(!p) return; v20NormalizePractice(p); const docs=prompt('Scrivi documenti/dati mancanti separati da virgola:',(p.missingDocs||[]).join(', ')||'Documento identità, Delega firmata'); if(docs===null)return; p.missingDocs=docs.split(',').map(x=>x.trim()).filter(Boolean); p.documentStatus=p.missingDocs.length?'Documenti mancanti':'Documenti ricevuti'; p.status=p.missingDocs.length?'Waiting Customer / Documenti mancanti':'Documenti ricevuti'; p.workflowStatus=p.status; p.teamMessage=`${v20RoleName(STATE.session?.role||source)} richiede: ${p.missingDocs.join(', ')}`; p.updatedAt=today(); v20AddEvent(p,`Richiesti mancanti: ${p.missingDocs.join(', ')}`,'missing_docs'); v20Notify('admin',p,'Documenti mancanti',`${p.code}: ${p.missingDocs.join(', ')}`); if(p.agentEmail) v20Notify('agent',p,'Documenti mancanti',`${p.code}: ${p.missingDocs.join(', ')}`); saveState(); renderAll(); showToast('Richiesta integrazione tracciata.'); };
italyReceiptPrompt = function(id){ const p=STATE.pratiche.find(x=>x.id===id); if(!p)return; const link=prompt('Inserisci link ricevuta/PDF o protocollo finale:',p.receiptLink||''); if(link===null)return; p.receiptLink=link; p.status='Completata'; p.workflowStatus='Completata'; p.progress=100; p.documentStatus='Documenti ricevuti'; p.teamMessage='Ricevuta/protocollo finale caricata.'; p.updatedAt=today(); STATE.receipts.unshift({id:`r-${Date.now()}`,praticaId:id,praticaCode:p.code,link,by:STATE.session.email,date:today()}); v20AddEvent(p,'Ricevuta/protocollo finale caricato','receipt'); v20Notify('admin',p,'Ricevuta caricata',`${p.code}: ricevuta finale disponibile.`); saveState(); renderAll(); openDetail(id); showToast('Ricevuta caricata e pratica completata.'); };

function v20WorkflowPanel(p){ v20NormalizePractice(p); const events=(p.workflowEvents||[]).slice(0,10).map(ev=>`<div class="timeline-item"><span>${safe(ev.time||ev.date||'')}</span><div><b>${safe(ev.action)}</b><div class="meta">${safe(ev.by||'--')} · ${safe(v20RoleName(ev.role))}</div></div></div>`).join('')||'<div class="meta">Nessun evento</div>'; return `<div class="white-card v20-workflow-card"><h3>Workflow CAF CAE v20</h3><div class="v20-workflow-grid"><div><span>Owner attuale</span><b>${v20OwnerLabel(p.currentOwner)}</b></div><div><span>Status</span><b>${safe(p.workflowStatus||p.status)}</b></div><div><span>Progress</span><b>${safe(p.progress||0)}%</b></div><div><span>Watchers</span><b>${(p.watchers||[]).map(v20RoleName).join(', ')}</b></div></div><div class="progress-line"><i style="width:${Math.min(100,Number(p.progress||0))}%"></i></div><h4>Timeline live</h4><div class="timeline-list">${events}</div></div>`; }
const v20_oldOpenDetail = openDetail;
openDetail = function(id){
  const p = STATE.pratiche.find(x=>x.id===id); if(!p) return;
  v20NormalizePractice(p);
  const role=STATE.session?.role;
  const canEdit=v20CanEditPractice(p,role);
  v20_oldOpenDetail(id);
  const body=$('#detailModalBody'); if(!body) return;
  const transferActions = canEdit || role==='admin' ? `<div class="doc-actions v20-transfer-actions"><button class="btn green" data-transfer-team="italy" data-pratica-id="${safe(p.id)}">Invia Team Italy</button><button class="btn blue" data-transfer-team="commercialista" data-pratica-id="${safe(p.id)}">Invia Commercialista</button><button class="btn light" data-transfer-team="bangla" data-pratica-id="${safe(p.id)}">Ritorna Bangla</button><button class="btn orange" data-v20-status="${safe(p.id)}">Aggiorna status</button></div>` : `<div class="status-banner">Solo tracciamento: owner attuale ${v20OwnerLabel(p.currentOwner)}.</div>`;
  body.insertAdjacentHTML('afterbegin', v20WorkflowPanel(p) + transferActions);
};

document.body.addEventListener('click', e=>{
  const tr=e.target.closest('[data-transfer-team]');
  if(tr){ v20TransferTo(tr.dataset.praticaId, tr.dataset.transferTeam); }
  const st=e.target.closest('[data-v20-status]');
  if(st){ const p=STATE.pratiche.find(x=>x.id===st.dataset.v20Status); if(!p)return; const status=prompt('Nuovo status:', p.workflowStatus||p.status||'Processing'); if(!status)return; p.status=status; p.workflowStatus=status; p.workflowStep=status; p.progress=Number(prompt('Progress %:', p.progress||50) || p.progress || 50); p.updatedAt=today(); v20AddEvent(p,`Status aggiornato: ${status}`,'status'); v20Notify('admin',p,'Status aggiornato',`${p.code}: ${status}`); saveState(); renderAll(); openDetail(p.id); showToast('Status aggiornato e tracciato.'); }
});

function v20RenderNotifications(prefix, role){
  const box=$(`#${prefix}V20Notifications`); if(!box) return;
  const list=(STATE.practiceNotifications||[]).filter(n=>n.targetRole===role || (role==='admin'&&n.targetRole==='admin')).slice(0,8);
  box.innerHTML=list.map(n=>`<div class="flat-item ${n.read?'':'agent-permission'}"><div><div class="title">🔔 ${safe(n.title)} · ${safe(n.praticaCode)}</div><div class="meta">${safe(n.time||'')} · ${safe(n.message)}<br>Da: ${safe(n.by||'System')}</div></div><button class="btn light" data-detail="${safe(n.praticaId)}">Apri</button></div>`).join('')||emptyFlat('Nessuna notifica','Le notifiche workflow appariranno qui.');
}
function v20InjectRolePanel(containerId, prefix, role){ const el=$(`#${containerId}`); if(!el || $(`#${prefix}V20Panel`)) return; const html=`<section class="white-card v20-role-panel" id="${prefix}V20Panel"><div class="card-head"><div><h3>Workflow Live v20</h3><p class="meta">Owner, watchers, trasferimenti e notifiche live. Le pratiche non spariscono più.</p></div><span class="chip green">${v20RoleName(role)}</span></div><div id="${prefix}V20Notifications"></div></section>`; (el.querySelector('.kpi-row')||el.firstElementChild||el).insertAdjacentHTML('afterend',html); }
const v20_oldRenderBangla = renderBangla;
renderBangla = function(){ v20NormalizeAll(); v20_oldRenderBangla(); v20InjectRolePanel('bangla-home','bangla','bangla'); v20RenderNotifications('bangla','bangla'); };
const v20_oldRenderItaly = renderItaly;
renderItaly = function(){ v20NormalizeAll(); v20_oldRenderItaly(); v20InjectRolePanel('italy-home','italy','italy'); v20RenderNotifications('italy','italy'); };
const v20_oldRenderCommercialista = renderCommercialista;
renderCommercialista = function(){ v20NormalizeAll(); v20_oldRenderCommercialista(); const home=$('#dashboard-commercialista .content-grid, #dashboard-commercialista'); if(home && !$('#commercialistaV20Queue')){ home.insertAdjacentHTML('afterbegin', `<section class="white-card" id="commercialistaV20Queue"><h3>Pratiche Commercialista v20</h3><div id="commercialistaV20List"></div></section>`); } const box=$('#commercialistaV20List'); if(box){ const rows=commercialistaPratiche(); box.innerHTML=rows.map(p=>`<div class="flat-item"><div><div class="title">${safe(p.code)} · ${safe(p.serviceTitle)}</div><div class="meta">${safe(fullName(p.client))} · ${safe(p.workflowStatus||p.status)} · Da ${safe((p.previousOwners||[]).map(v20RoleName).join(', ')||'--')}</div></div><button class="btn light" data-detail="${safe(p.id)}">Apri</button></div>`).join('')||emptyFlat('Nessuna pratica','Le pratiche inviate a Commercialista appariranno qui.'); } };
const v20_oldRenderAdmin = renderAdmin;
renderAdmin = function(){ v20NormalizeAll(); v20_oldRenderAdmin(); v20InjectRolePanel('admin-home','admin','admin'); v20RenderNotifications('admin','admin'); const tl=$('#adminTeamActions'); if(tl){ const rows=(STATE.teamActions||[]).slice(0,40); tl.innerHTML=rows.map(a=>`<div class="timeline-item"><span>${safe(a.time||a.date||'')}</span><div><b>${safe(a.action)}</b><div class="meta">${safe(a.by||'--')} · ${safe(v20RoleName(a.role))} · ${safe(a.code||'')}</div></div></div>`).join('')||emptyFlat('Nessuna azione team','Trasferimenti e status appariranno qui.'); } };


  async function boot() {
    seed();
    ensureState();
    sanitizeUsers();
    await restoreSession();
    bindEvents();
    initSignaturePad();
    initExtraSignaturePad();
    initBanglaSignaturePad();
    addCuRow({ income: 6632, days: 180, withheld: 274, regional: 67, trattamento: 979 });
    addCuRow({ income: 9510, days: 185, withheld: 274, regional: 68, trattamento: 980 });
    addFamilyRow();
    selectService('730', false);
    if (STATE.session) setRoleDashboard();
    await handleResetTokenFromUrl();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
