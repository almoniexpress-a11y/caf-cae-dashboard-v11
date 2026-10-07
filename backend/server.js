import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me';
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 12 } });

const allowedOrigins = String(process.env.CORS_ORIGIN || '*').split(',').map(x => x.trim()).filter(Boolean);
const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
};

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 800, standardHeaders: true, legacyHeaders: false }));

// Webhook HMAC needs raw body. Keep this before express.json for webhook route.
app.use('/api/shopify/webhooks', express.raw({ type: '*/*', limit: '10mb' }));
app.use(express.json({ limit: '40mb' }));

const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = hasSupabase ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null;

const memory = new Map();
const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);
const safeNumber = v => Number(v || 0) || 0;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_FIELD_NAMES = new Set(['id', 'client_id', 'company_id', 'pratica_id', 'subscription_id']);
const isUuid = v => typeof v === 'string' && UUID_PATTERN.test(v);
function cleanUuidRecord(record = {}) {
  const out = { ...record };
  for (const key of Object.keys(out)) {
    if (UUID_FIELD_NAMES.has(key) && out[key] && !isUuid(String(out[key]))) {
      // Supabase UUID columns cannot receive frontend nanoid/text IDs.
      // For primary id let Postgres generate; for nullable foreign keys clear it.
      if (key === 'id') delete out[key];
      else out[key] = null;
    }
  }
  return out;
}
function hasInvalidUuidFilter(filter = {}) {
  for (const [key, value] of Object.entries(filter)) {
    if (UUID_FIELD_NAMES.has(key) && value && !isUuid(String(value))) return true;
  }
  return false;
}
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const bad = (res, status, message, details) => res.status(status).json({ ok: false, error: message, details: process.env.NODE_ENV === 'production' ? undefined : details });

const TABLES = [
  'dashboard_snapshots', 'system_versions', 'dashboard_users', 'password_reset_tokens', 'clients', 'business_profiles', 'client_assignments',
  'plans', 'subscriptions', 'subscription_payments', 'pratiche', 'practice_status_history', 'documents', 'generated_documents',
  'agent_clients', 'agent_credit_transactions', 'agent_credit_requests', 'modify_requests', 'companies', 'invoices',
  'comm_sales', 'comm_f24', 'comm_employees', 'comm_documents', 'comm_deadlines', 'comm_backups', 'communications',
  'tickets', 'operational_notices', 'sources', 'team_daily_reports', 'receipts', 'practice_history', 'practice_watchers', 'practice_notifications', 'practice_messages', 'audit_logs', 'client_versions', 'shopify_sync_logs',
  'webhook_events', 'admin_product_prices', 'admin_promotions', 'admin_popups', 'admin_complaints', 'admin_manual_sales', 'salary_payments', 'commission_payments', 'portal_settings',
  'v22_clients', 'practice_files', 'v22_team_members', 'v22_daily_work_reports', 'v22_agent_credit_requests', 'v22_agent_credit_ledger', 'v22_membership_results', 'v22_tickets', 'v22_commercialista_packages', 'v22_company_packages', 'v22_notifications'
];
for (const t of TABLES) memory.set(t, []);

function seedMemory() {
  if (memory.get('dashboard_users').length) return;
  // Local memory fallback only. Production must use Supabase + password_hash.
  const devHash = bcrypt.hashSync(process.env.DEV_ADMIN_PASSWORD || 'ChangeMeNow2026!', 10);
  memory.get('dashboard_users').push(
    { id: 'u-admin', username: 'admin', password_hash: devHash, role: 'admin', name: 'Imran Mollah', email: 'almoniexpress@gmail.com', active: true, created_at: now() },
    { id: 'u-agent', username: 'agent', password_hash: devHash, role: 'agent', name: 'Usman Ali', email: 'agent@cafcae.it', active: true, created_at: now() },
    { id: 'u-comm', username: 'commercialista', password_hash: devHash, role: 'commercialista', name: 'Studio Commercialista', email: 'commercialista@cafcae.it', active: true, created_at: now() },
    { id: 'u-bangla', username: 'bangla', password_hash: devHash, role: 'bangla', name: 'Team Bangla', email: 'bangla@cafcae.it', active: true, created_at: now() },
    { id: 'u-italy', username: 'italy', password_hash: devHash, role: 'italy', name: 'Team Italy', email: 'italy@cafcae.it', active: true, created_at: now() }
  );
}
seedMemory();

function asyncHandler(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
function tokenFor(user) { return jwt.sign({ sub: user.id, id: user.id, username: user.username, role: user.role, email: user.email, name: user.name, office: user.office, phone: user.phone }, SESSION_SECRET, { expiresIn: '12h' }); }
function userFromToken(req) {
  const token = req.cookies?.cafcae_session || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try { return jwt.verify(token, SESSION_SECRET); } catch (_) { return null; }
}
function requireAuth(req, res, next) {
  const u = userFromToken(req);
  if (!u) return bad(res, 401, 'Accesso non autorizzato. Effettua il login.');
  req.user = u; next();
}
function requireRole(...roles) { return (req, res, next) => roles.includes(req.user?.role) ? next() : bad(res, 403, 'Permesso insufficiente.'); }

async function dbSelect(table, filter = {}, opts = {}) {
  if (supabase) {
    if (hasInvalidUuidFilter(filter)) return [];
    let q = supabase.from(table).select(opts.select || '*');
    Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q = q.eq(k, v); });
    if (opts.order) q = q.order(opts.order, { ascending: opts.ascending ?? false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  let rows = [...(memory.get(table) || [])];
  for (const [k, v] of Object.entries(filter)) if (v !== undefined && v !== null && v !== '') rows = rows.filter(r => r[k] === v);
  if (opts.order) rows.sort((a, b) => String(b[opts.order] || '').localeCompare(String(a[opts.order] || '')));
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return rows;
}
async function dbOne(table, filter = {}, opts = {}) { return (await dbSelect(table, filter, { ...opts, limit: 1 }))[0] || null; }
async function dbInsert(table, row = {}) {
  const base = { created_at: row.created_at || now(), updated_at: row.updated_at || now(), ...row };

  if (supabase) {
    const record = cleanUuidRecord(base);
    const { data, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw error;
    return data;
  }

  const record = { id: row.id || nanoid(12), ...base };
  memory.get(table).unshift(record);
  return record;
}
async function dbUpdate(table, id, patch) {
  const update = cleanUuidRecord({ ...patch, updated_at: now() });
  if (supabase) {
    if (!isUuid(String(id))) throw new Error(`${table} invalid uuid id`);
    const { data, error } = await supabase.from(table).update(update).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const rows = memory.get(table) || [];
  const index = rows.findIndex(r => r.id === id || r.code === id);
  if (index < 0) throw new Error(`${table} record not found`);
  rows[index] = { ...rows[index], ...update };
  return rows[index];
}
async function dbUpsert(table, match, row) {
  const old = (await dbSelect(table, match))[0];
  if (old) return dbUpdate(table, old.id, row);
  return dbInsert(table, { ...match, ...row });
}
async function audit(action, entity_type, entity_id, client_id, user, previous_value, new_value, req) {
  return dbInsert('audit_logs', {
    staff_user: user?.email || user?.name || 'system', action, entity_type, entity_id, client_id: client_id || null,
    previous_value: previous_value || null, new_value: new_value || null, ip_address: req?.ip || null,
    user_agent: req?.headers?.['user-agent'] || null
  }).catch(() => null);
}


// CAF CAE ERP v20 workflow helpers: owner + watchers + timeline.
const V20_ROLES = ['admin', 'agent', 'bangla', 'italy', 'commercialista'];
function v20RoleLabel(role) {
  return ({ admin: 'Admin', agent: 'Agente', bangla: 'Team Bangla', italy: 'Team Italy', commercialista: 'Commercialista' })[role] || role || 'Team';
}
function v20Unique(values = []) { return [...new Set((values || []).filter(Boolean))]; }
function v20UserLabel(user) { return user?.name || user?.email || user?.username || 'system'; }
function v20OwnerOf(p = {}) { return p.current_owner || p.assigned_team || p.route_team || 'bangla'; }
function v20WatchersOf(p = {}, extra = []) {
  return v20Unique([...(Array.isArray(p.watchers) ? p.watchers : []), 'admin', v20OwnerOf(p), p.agent_email ? 'agent' : null, ...(Array.isArray(p.previous_owners) ? p.previous_owners : []), ...extra]);
}
async function v20SafeInsert(table, row) { try { return await dbInsert(table, row); } catch (err) { console.warn(`v20 ${table} insert skipped`, err.message); return null; } }
async function v20AddHistory(pratica, action, user, req, payload = {}) {
  const row = await v20SafeInsert('practice_history', {
    pratica_id: pratica.id,
    pratica_code: pratica.code,
    action,
    event_type: payload.event_type || 'activity',
    from_owner: payload.from_owner || null,
    to_owner: payload.to_owner || v20OwnerOf(pratica),
    status: pratica.status,
    workflow_status: pratica.workflow_status || pratica.status,
    progress: safeNumber(pratica.progress),
    actor_role: user?.role || payload.actor_role || 'system',
    actor_email: user?.email || payload.actor_email || null,
    actor_name: v20UserLabel(user),
    metadata: payload.metadata || {},
    created_at: now()
  });
  await audit(action, 'pratica', pratica.id, pratica.client_data?.client_id, user, null, { pratica: pratica.code, ...payload }, req).catch(() => null);
  return row;
}
async function v20Notify(target_role, pratica, title, message, user) {
  return v20SafeInsert('practice_notifications', {
    target_role,
    pratica_id: pratica.id,
    pratica_code: pratica.code,
    title,
    message,
    is_read: false,
    actor_email: user?.email || null,
    actor_name: v20UserLabel(user),
    created_at: now()
  });
}
async function v20SaveWatchers(pratica, watchers) {
  await Promise.all(v20Unique(watchers).map(role => v20SafeInsert('practice_watchers', { pratica_id: pratica.id, pratica_code: pratica.code, role, created_at: now() })));
}
async function v20HydratePractice(pratica) {
  if (!pratica) return pratica;
  const [history, messages, notifications] = await Promise.all([
    dbSelect('practice_history', { pratica_id: pratica.id }, { order: 'created_at', limit: 80 }).catch(() => []),
    dbSelect('practice_messages', { pratica_id: pratica.id }, { order: 'created_at', limit: 80 }).catch(() => []),
    dbSelect('practice_notifications', { pratica_id: pratica.id }, { order: 'created_at', limit: 20 }).catch(() => [])
  ]);
  return { ...pratica, history, messages, notifications, current_owner: v20OwnerOf(pratica), watchers: v20WatchersOf(pratica) };
}

async function incrementVersion(client_id, reason = 'update') {
  if (!client_id || (supabase && !isUuid(String(client_id)))) return null;
  const current = await dbOne('client_versions', { client_id });
  const version = safeNumber(current?.version) + 1 || 1;
  return dbUpsert('client_versions', { client_id }, { version, reason, updated_at: now() });
}
async function bumpSystem(role, email, reason = 'state') {
  const key = `${role || 'all'}:${email || 'all'}`;
  const current = await dbOne('system_versions', { version_key: key });
  const version = safeNumber(current?.version) + 1 || 1;
  return dbUpsert('system_versions', { version_key: key }, { version, reason, updated_at: now() });
}

function praticaPayload(b = {}) {
  return {
    code: b.code || `CAE-${Date.now()}`,
    source: b.source || 'manual',
    service_group: b.group || b.service_group || b.serviceGroup || 'CAF',
    service_key: b.serviceKey || b.service_key || null,
    service_title: b.serviceTitle || b.service_title || 'Pratica',
    client_data: b.client || b.client_data || {},
    agent_email: b.agentEmail || b.agent_email || null,
    agent_name: b.agentName || b.agent_name || null,
    route_team: b.routeTeam || b.route_team || 'bangla',
    assigned_team: b.assignedTeam || b.assigned_team || b.currentOwner || b.current_owner || 'bangla',
    current_owner: b.currentOwner || b.current_owner || b.assignedTeam || b.assigned_team || 'bangla',
    workflow_status: b.workflowStatus || b.workflow_status || b.status || 'Nuova',
    progress: safeNumber(b.progress || 15),
    watchers: b.watchers || ['admin', b.agentEmail || b.agent_email ? 'agent' : null, b.assignedTeam || b.assigned_team || 'bangla'].filter(Boolean),
    previous_owners: b.previousOwners || b.previous_owners || [],
    status: b.status || 'Nuova',
    payment_status: b.paymentStatus || b.payment_status || 'Agent credit',
    payment_mode: b.paymentMode || b.payment_mode || 'Credito agente',
    document_status: b.documentStatus || b.document_status || 'Documenti mancanti',
    cost: safeNumber(b.cost),
    commission: safeNumber(b.commission),
    commission_status: b.commissionStatus || b.commission_status || 'Pending',
    missing_docs: b.missingDocs || b.missing_docs || [],
    checked_docs: b.checkedDocs || b.checked_docs || [],
    uploads: b.uploads || [],
    team_message: b.teamMessage || b.team_message || null,
    service_data: b.serviceData || b.service_data || {},
    internal_730: b.internal730 || b.internal_730 || null,
    delega: !!b.delega,
    privacy: !!b.privacy,
    signature: !!b.signature,
    signature_data_url: b.signatureDataUrl || b.signature_data_url || null,
    deadline: b.deadline || null,
    shopify_order_reference: b.shopifyOrder || b.shopify_order_reference || null,
    receipt_link: b.receiptLink || b.receipt_link || null,
    team_history: b.teamHistory || b.team_history || [],
    updated_at: now()
  };
}

const praticaSchema = z.object({ serviceTitle: z.string().optional(), service_title: z.string().optional(), client: z.any().optional(), client_data: z.any().optional() }).passthrough();
const companySchema = z.object({ name: z.string().min(1), vat: z.string().optional(), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional() }).passthrough();

// Health and live state snapshot for all dashboards.
app.get('/api/health', asyncHandler(async (_req, res) => ok(res, { service: 'CAF CAE full dashboard backend v15 admin pro', database: hasSupabase ? 'supabase' : 'memory-fallback', time: now() })));

app.get('/api/live/version', requireAuth, asyncHandler(async (req, res) => {
  const key = `${req.query.role || 'all'}:${req.query.email || 'all'}`;
  const v = await dbOne('system_versions', { version_key: key });
  ok(res, { version: v?.version || 0, updated_at: v?.updated_at || null });
}));
app.get('/api/live/state', requireAuth, asyncHandler(async (req, res) => {
  const role = req.query.role || 'all'; const email = req.query.email || 'all';
  const exact = await dbOne('dashboard_snapshots', { role, email });
  const global = await dbOne('dashboard_snapshots', { role: 'all', email: 'all' });
  ok(res, { state: exact?.state_data || global?.state_data || null, version: (await dbOne('system_versions', { version_key: `${role}:${email}` }))?.version || 0 });
}));
app.post('/api/live/state', requireAuth, asyncHandler(async (req, res) => {
  const role = req.body.role || 'all'; const email = req.body.email || 'all';
  const saved = await dbUpsert('dashboard_snapshots', { role, email }, { state_data: req.body.state || {}, saved_by: req.body.user || email, updated_at: now() });
  const v = await bumpSystem(role, email, 'dashboard snapshot saved');
  await bumpSystem('all', 'all', 'dashboard snapshot saved');
  ok(res, { snapshot: saved, version: v.version });
}));

function publicUser(user = {}) {
  const { password, password_hash, reset_token_hash, ...safe } = user;
  return safe;
}
function passwordPolicy(password) {
  if (!password || String(password).length < 8) return 'La password deve avere almeno 8 caratteri.';
  if (String(password).toLowerCase() === 'password' || String(password) === '123') return 'Questa password non è sicura.';
  return null;
}
async function findDashboardUser(usernameOrEmail) {
  const needle = String(usernameOrEmail || '').toLowerCase().trim();
  const users = await dbSelect('dashboard_users');
  return users.find(u => u.active !== false && (
    String(u.username || '').toLowerCase() === needle ||
    String(u.email || '').toLowerCase() === needle
  ));
}
async function setUserPassword(userId, password) {
  const policy = passwordPolicy(password);
  if (policy) throw new Error(policy);
  return dbUpdate('dashboard_users', userId, {
    password: null,
    password_hash: await bcrypt.hash(String(password), 12),
    failed_attempts: 0,
    locked_until: null
  });
}
function cookieOptions(req) {
  const prod = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: prod ? 'none' : 'lax',
    secure: prod || req.secure || req.headers['x-forwarded-proto'] === 'https',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/'
  };
}

// Auth.
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return bad(res, 400, 'Username e password sono obbligatori.');
  const user = await findDashboardUser(username);
  if (!user) return bad(res, 401, 'Credenziali non valide.');
  if (user.locked_until && new Date(user.locked_until) > new Date()) return bad(res, 423, 'Account temporaneamente bloccato. Riprova più tardi.');

  let valid = false;
  if (user.password_hash) valid = await bcrypt.compare(String(password), user.password_hash);
  // Legacy plain passwords are blocked by default. Enable only temporarily with ALLOW_LEGACY_PASSWORDS=true.
  if (!valid && process.env.ALLOW_LEGACY_PASSWORDS === 'true' && user.password) valid = String(user.password) === String(password);

  if (!valid) {
    const attempts = safeNumber(user.failed_attempts) + 1;
    const patch = { failed_attempts: attempts };
    if (attempts >= 6) patch.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await dbUpdate('dashboard_users', user.id, patch).catch(() => null);
    return bad(res, 401, 'Credenziali non valide.');
  }

  if (!user.password_hash) await setUserPassword(user.id, password).catch(() => null);
  await dbUpdate('dashboard_users', user.id, { failed_attempts: 0, locked_until: null, last_login_at: now() }).catch(() => null);
  const token = tokenFor(user);
  res.cookie('cafcae_session', token, cookieOptions(req));
  await audit('login', 'dashboard_user', user.id, null, user, null, { role: user.role }, req);
  ok(res, { token, user: publicUser(user) });
}));
app.post('/api/auth/logout', (req, res) => { res.clearCookie('cafcae_session', cookieOptions(req)); ok(res); });
app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await dbOne('dashboard_users', { id: req.user.sub || req.user.id });
  ok(res, { user: publicUser(user || req.user) });
}));
app.post('/api/auth/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const user = await dbOne('dashboard_users', { id: req.user.sub || req.user.id });
  if (!user) return bad(res, 404, 'Utente non trovato.');
  const valid = user.password_hash ? await bcrypt.compare(String(currentPassword || ''), user.password_hash) : false;
  if (!valid) return bad(res, 401, 'Password attuale non corretta.');
  const updated = await setUserPassword(user.id, newPassword);
  await audit('password_changed', 'dashboard_user', user.id, null, req.user, null, { by: 'self' }, req);
  ok(res, { user: publicUser(updated) });
}));
app.post('/api/auth/forgot-password', asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  const user = await findDashboardUser(email);
  // Always return ok to avoid account enumeration.
  if (!user) return ok(res, { message: 'Se esiste un account, riceverai istruzioni.' });
  const token = crypto.randomBytes(32).toString('hex');
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await dbInsert('password_reset_tokens', { user_id: user.id, email: user.email, token_hash, expires_at, used: false }).catch(async () => {
    // Memory fallback table may not exist in old list.
    if (!memory.has('password_reset_tokens')) memory.set('password_reset_tokens', []);
    memory.get('password_reset_tokens').unshift({ id: nanoid(12), user_id: user.id, email: user.email, token_hash, expires_at, used: false, created_at: now(), updated_at: now() });
  });
  const base = process.env.FRONTEND_URL || (String(req.headers.origin || '').replace(/\/$/, '')) || 'https://admin.cafcae.it';
  ok(res, { message: 'Reset password generato.', reset_url: `${base}/?reset_token=${token}` });
}));
app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  if (!token) return bad(res, 400, 'Token reset mancante.');
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');
  const rows = await dbSelect('password_reset_tokens', { token_hash }).catch(() => []);
  const row = rows.find(r => !r.used && new Date(r.expires_at) > new Date());
  if (!row) return bad(res, 400, 'Token reset non valido o scaduto.');
  const updated = await setUserPassword(row.user_id, password);
  await dbUpdate('password_reset_tokens', row.id, { used: true, used_at: now() }).catch(() => null);
  await audit('password_reset', 'dashboard_user', row.user_id, null, publicUser(updated), null, { by: 'reset_token' }, req);
  ok(res, { user: publicUser(updated) });
}));

// Dashboard by role.
app.get('/api/dashboard/:role', asyncHandler(async (req, res) => {
  const role = req.params.role; const email = req.query.email;
  let pratiche = await dbSelect('pratiche', {}, { order: 'updated_at' });
  if (role === 'agent') pratiche = pratiche.filter(p => p.agent_email === email);
  if (role === 'bangla') pratiche = pratiche.filter(p => v20WatchersOf(p).includes('bangla') || v20OwnerOf(p) === 'bangla');
  if (role === 'italy') pratiche = pratiche.filter(p => v20WatchersOf(p).includes('italy') || v20OwnerOf(p) === 'italy');
  if (role === 'commercialista') pratiche = pratiche.filter(p => v20WatchersOf(p).includes('commercialista') || v20OwnerOf(p) === 'commercialista' || p.service_group === 'Commercialista');
  const tickets = role === 'admin' ? await dbSelect('tickets', {}, { order: 'created_at' }) : await dbSelect('tickets', { created_by: email }, { order: 'created_at' });
  ok(res, { pratiche, tickets, stats: buildStats(pratiche) });
}));
function buildStats(pratiche) {
  return {
    total: pratiche.length,
    nuove: pratiche.filter(p => p.status === 'Nuova').length,
    lavorazione: pratiche.filter(p => ['In lavorazione', 'In verifica', 'Documenti mancanti'].includes(p.status)).length,
    complete: pratiche.filter(p => p.status === 'Completata').length,
    missing: pratiche.filter(p => (p.missing_docs || []).length).length,
    value: pratiche.reduce((s, p) => s + safeNumber(p.cost), 0)
  };
}

// Pratiche full workflow.
app.get('/api/pratiche', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.agent_email) filter.agent_email = req.query.agent_email;
  if (req.query.assigned_team) filter.assigned_team = req.query.assigned_team;
  if (req.query.service_group) filter.service_group = req.query.service_group;
  ok(res, { pratiche: await dbSelect('pratiche', filter, { order: 'updated_at' }) });
}));
app.post('/api/pratiche', asyncHandler(async (req, res) => {
  praticaSchema.parse(req.body || {});
  const payload = { ...praticaPayload(req.body), created_at: now() };
  const created = await dbInsert('pratiche', payload);
  await audit('practice_created', 'pratica', created.id, created.client_data?.client_id, req.body.by || { email: created.agent_email }, null, created, req);
  if (created.agent_email && created.cost > 0) await dbInsert('agent_credit_transactions', { agent_email: created.agent_email, type: 'minus', amount: created.cost, reason: `Creazione ${created.service_title} ${created.code}`, pratica_id: created.id });
  created.watchers = v20WatchersOf(created, ['bangla']);
  await v20SaveWatchers(created, created.watchers);
  await v20AddHistory(created, 'Pratica creata', req.user || req.body.by || { email: created.agent_email, role: created.agent_email ? 'agent' : 'system' }, req, { event_type: 'created', to_owner: v20OwnerOf(created) });
  await v20Notify('bangla', created, 'Nuova pratica', `${created.code} assegnata a Team Bangla.`, req.user || {});
  await v20Notify('admin', created, 'Nuova pratica creata', `${created.code} creata e assegnata.`, req.user || {});
  await bumpSystem('all', 'all', 'pratica created');
  ok(res, { pratica: created });
}));
app.post('/api/pratiche/create', asyncHandler(async (req, res) => {
  praticaSchema.parse(req.body || {});
  const payload = { ...praticaPayload(req.body), created_at: now() };
  const created = await dbInsert('pratiche', payload);
  await audit('practice_created', 'pratica', created.id, created.client_data?.client_id, req.body.by || { email: created.agent_email }, null, created, req);
  if (created.agent_email && created.cost > 0) await dbInsert('agent_credit_transactions', { agent_email: created.agent_email, type: 'minus', amount: created.cost, reason: `Creazione ${created.service_title} ${created.code}`, pratica_id: created.id });
  created.watchers = v20WatchersOf(created, ['bangla']);
  await v20SaveWatchers(created, created.watchers);
  await v20AddHistory(created, 'Pratica creata', req.user || req.body.by || { email: created.agent_email, role: created.agent_email ? 'agent' : 'system' }, req, { event_type: 'created', to_owner: v20OwnerOf(created) });
  await v20Notify('bangla', created, 'Nuova pratica', `${created.code} assegnata a Team Bangla.`, req.user || {});
  await v20Notify('admin', created, 'Nuova pratica creata', `${created.code} creata e assegnata.`, req.user || {});
  await bumpSystem('all', 'all', 'pratica created');
  ok(res, { pratica: created });
}));
app.patch('/api/pratiche/:id', asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const updated = await dbUpdate('pratiche', old.id, { ...praticaPayload({ ...old, ...req.body }), team_history: [{ by: req.body.by || 'api', role: req.body.role || 'system', action: 'Pratica aggiornata', date: today() }, ...(old.team_history || [])] });
  await audit('practice_updated', 'pratica', updated.id, updated.client_data?.client_id, req.body.by || null, old, updated, req);
  await bumpSystem('all', 'all', 'pratica updated');
  ok(res, { pratica: updated });
}));
app.post('/api/pratiche/update/:id', asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const updated = await dbUpdate('pratiche', old.id, { ...praticaPayload({ ...old, ...req.body }), team_history: [{ by: req.body.by || 'api', role: req.body.role || 'system', action: 'Pratica aggiornata', date: today() }, ...(old.team_history || [])] });
  await audit('practice_updated', 'pratica', updated.id, updated.client_data?.client_id, req.body.by || null, old, updated, req);
  await bumpSystem('all', 'all', 'pratica updated');
  ok(res, { pratica: updated });
}));
app.post('/api/pratiche/:id/missing-docs', asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const docs = Array.isArray(req.body.missingDocs) ? req.body.missingDocs : [];
  const message = req.body.message || `Documenti mancanti: ${docs.join(', ')}`;
  const updated = await dbUpdate('pratiche', old.id, { missing_docs: docs, document_status: docs.length ? 'Documenti mancanti' : 'Documenti ricevuti', status: docs.length ? 'Documenti mancanti' : 'In lavorazione', team_message: message, team_history: [{ by: req.body.by || 'team', role: req.body.role || 'team', action: message, date: today() }, ...(old.team_history || [])] });
  await dbInsert('communications', { pratica_id: old.id, audience: 'agent_client', title: 'Richiesta integrazione', message, status: 'Inviato' });
  await audit('missing_docs_requested', 'pratica', updated.id, updated.client_data?.client_id, req.body.by || null, old, updated, req);
  ok(res, { pratica: updated });
}));
app.post('/api/pratiche/:id/route', asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const from = v20OwnerOf(old);
  const team = req.body.assigned_team || req.body.team || req.body.toOwner || 'italy';
  const message = req.body.message || `Trasferita da ${v20RoleLabel(from)} a ${v20RoleLabel(team)}`;
  const previous = v20Unique([...(old.previous_owners || []), from]);
  const watchers = v20WatchersOf(old, [from, team, 'admin']);
  const updated = await dbUpdate('pratiche', old.id, {
    route_team: team,
    assigned_team: team,
    current_owner: team,
    previous_owners: previous,
    watchers,
    status: req.body.status || (team === 'commercialista' ? 'In lavorazione Commercialista' : 'In verifica'),
    workflow_status: req.body.status || (team === 'commercialista' ? 'In lavorazione Commercialista' : 'In verifica'),
    progress: safeNumber(req.body.progress || old.progress || (team === 'commercialista' ? 70 : 55)),
    team_message: message,
    team_history: [{ by: req.body.by || v20UserLabel(req.user), role: req.body.role || req.user?.role || 'team', action: message, date: today() }, ...(old.team_history || [])]
  });
  await v20SaveWatchers(updated, watchers);
  await v20AddHistory(updated, message, req.user || { email: req.body.by, role: req.body.role }, req, { event_type: 'transfer', from_owner: from, to_owner: team });
  await v20Notify(team, updated, 'Nuova pratica assegnata', `${updated.code} ricevuta da ${v20RoleLabel(from)}.`, req.user || {});
  await v20Notify('admin', updated, 'Trasferimento pratica', `${updated.code}: ${v20RoleLabel(from)} → ${v20RoleLabel(team)}.`, req.user || {});
  await bumpSystem('all', 'all', 'workflow transfer');
  ok(res, { pratica: updated });
}));
app.post('/api/practices/:id/transfer', asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const from = v20OwnerOf(old);
  const team = req.body.assigned_team || req.body.team || req.body.toOwner || 'italy';
  const message = req.body.message || `Trasferita da ${v20RoleLabel(from)} a ${v20RoleLabel(team)}`;
  const previous = v20Unique([...(old.previous_owners || []), from]);
  const watchers = v20WatchersOf(old, [from, team, 'admin']);
  const updated = await dbUpdate('pratiche', old.id, {
    route_team: team, assigned_team: team, current_owner: team, previous_owners: previous, watchers,
    status: req.body.status || (team === 'commercialista' ? 'In lavorazione Commercialista' : 'In verifica'),
    workflow_status: req.body.status || (team === 'commercialista' ? 'In lavorazione Commercialista' : 'In verifica'),
    progress: safeNumber(req.body.progress || old.progress || (team === 'commercialista' ? 70 : 55)),
    team_message: message,
    team_history: [{ by: req.body.by || v20UserLabel(req.user), role: req.body.role || req.user?.role || 'team', action: message, date: today() }, ...(old.team_history || [])]
  });
  await v20SaveWatchers(updated, watchers);
  await v20AddHistory(updated, message, req.user || { email: req.body.by, role: req.body.role }, req, { event_type: 'transfer', from_owner: from, to_owner: team });
  await v20Notify(team, updated, 'Nuova pratica assegnata', `${updated.code} ricevuta da ${v20RoleLabel(from)}.`, req.user || {});
  await v20Notify('admin', updated, 'Trasferimento pratica', `${updated.code}: ${v20RoleLabel(from)} → ${v20RoleLabel(team)}.`, req.user || {});
  await bumpSystem('all', 'all', 'workflow transfer');
  ok(res, { pratica: updated });
}));

// CAF CAE ERP v21 Shopify-style native practices API.
function v21FilterPracticesForRole(rows = [], role = 'admin', email = '') {
  if (role === 'admin') return rows;
  if (role === 'agent') return rows.filter(p => p.agent_email === email || p.created_by === email);
  if (role === 'bangla') return rows.filter(p => v20WatchersOf(p).includes('bangla') || v20OwnerOf(p) === 'bangla' || p.assigned_team === 'bangla' || p.route_team === 'bangla');
  if (role === 'italy') return rows.filter(p => v20WatchersOf(p).includes('italy') || v20OwnerOf(p) === 'italy' || p.assigned_team === 'italy' || p.route_team === 'italy');
  if (role === 'commercialista') return rows.filter(p => v20WatchersOf(p).includes('commercialista') || v20OwnerOf(p) === 'commercialista' || p.service_group === 'Commercialista');
  return rows;
}

app.get('/api/practices', requireAuth, asyncHandler(async (req, res) => {
  const role = req.query.role || req.user?.role || 'admin';
  const email = req.query.email || req.user?.email || '';
  let rows = await dbSelect('pratiche', {}, { order: 'updated_at' });
  rows = v21FilterPracticesForRole(rows, role, email);
  ok(res, { practices: rows, pratiche: rows, count: rows.length, source: 'supabase-native-v21' });
}));

app.post('/api/practices/bulk-upsert', requireAuth, asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body?.practices) ? req.body.practices : [];
  if (!incoming.length) return ok(res, { practices: [], pratiche: [], count: 0 });
  const savedRows = [];
  for (const raw of incoming) {
    let payload = praticaPayload(raw || {});
    payload = v22SanitizePracticeForAgent(payload, req.user || {});
    payload.created_by = raw.createdBy || raw.created_by || payload.agent_email || req.user?.email || null;
    payload.updated_by = req.user?.email || raw.updatedBy || raw.updated_by || null;
    payload.watchers = v20WatchersOf(payload, [payload.assigned_team, payload.route_team, payload.current_owner]);
    const existing = payload.code ? await dbOne('pratiche', { code: payload.code }).catch(() => null) : null;
    let saved;
    if (existing) {
      saved = await dbUpdate('pratiche', existing.id, { ...payload, created_at: existing.created_at || payload.created_at });
    } else {
      saved = await dbInsert('pratiche', { ...payload, created_at: raw.createdAt || raw.created_at || now() });
      await v20AddHistory(saved, 'Pratica salvata nel database centrale v21', req.user, req, { event_type: 'created', to_owner: v20OwnerOf(saved) });
    }
    await v20SaveWatchers(saved, v20WatchersOf(saved));
    savedRows.push(saved);
  }
  await bumpSystem('all', 'all', 'v21 practices bulk upsert');
  ok(res, { practices: savedRows, pratiche: savedRows, count: savedRows.length, source: 'supabase-native-v21' });
}));

app.post('/api/practices/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const status = req.body.status || old.status || 'In lavorazione';
  const progress = safeNumber(req.body.progress || old.progress || 50);
  const updated = await dbUpdate('pratiche', old.id, {
    status,
    workflow_status: status,
    progress,
    team_message: req.body.message || old.team_message,
    team_history: [{ by: v20UserLabel(req.user), role: req.user?.role || 'team', action: `Status aggiornato: ${status}`, date: today() }, ...(old.team_history || [])]
  });
  await v20AddHistory(updated, `Status aggiornato: ${status}`, req.user, req, { event_type: 'status', to_owner: v20OwnerOf(updated) });
  await v20Notify('admin', updated, 'Status aggiornato', `${updated.code}: ${status}`, req.user || {});
  await bumpSystem('all', 'all', 'v21 status update');
  ok(res, { practice: updated, pratica: updated });
}));

app.get('/api/practices/:id/timeline', asyncHandler(async (req, res) => {
  const p = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!p) return bad(res, 404, 'Pratica non trovata.');
  ok(res, { pratica: await v20HydratePractice(p) });
}));
app.get('/api/practices/notifications/:role', asyncHandler(async (req, res) => {
  const notifications = await dbSelect('practice_notifications', { target_role: req.params.role }, { order: 'created_at', limit: 100 }).catch(() => []);
  ok(res, { notifications });
}));
app.post('/api/practices/:id/comment', asyncHandler(async (req, res) => {
  const p = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!p) return bad(res, 404, 'Pratica non trovata.');
  const message = String(req.body.message || '').trim();
  if (!message) return bad(res, 400, 'Messaggio obbligatorio.');
  const row = await v20SafeInsert('practice_messages', { pratica_id: p.id, pratica_code: p.code, message, actor_role: req.user?.role || req.body.role || 'system', actor_email: req.user?.email || req.body.email || null, actor_name: v20UserLabel(req.user || { name: req.body.name }), created_at: now() });
  await v20AddHistory(p, `Commento interno: ${message.slice(0, 80)}`, req.user || { name: req.body.name, role: req.body.role }, req, { event_type: 'comment' });
  ok(res, { message: row });
}));
app.post('/api/pratiche/:id/complete', asyncHandler(async (req, res) => {
  const old = await dbOne('pratiche', { id: req.params.id }) || await dbOne('pratiche', { code: req.params.id });
  if (!old) return bad(res, 404, 'Pratica non trovata.');
  const updated = await dbUpdate('pratiche', old.id, { status: 'Completata', document_status: 'Documenti ricevuti', receipt_link: req.body.receiptLink || req.body.file_url || old.receipt_link, team_message: req.body.message || 'Pratica completata.', team_history: [{ by: req.body.by || 'team_italy', role: 'italy', action: 'Pratica completata', date: today() }, ...(old.team_history || [])] });
  await dbInsert('receipts', { pratica_id: old.id, pratica_code: old.code, receipt_type: req.body.receipt_type || 'finale', file_url: req.body.file_url || req.body.receiptLink, protocol_no: req.body.protocol_no, note: req.body.message });
  ok(res, { pratica: updated });
}));

// Agent.
app.get('/api/agent/:email/wallet', asyncHandler(async (req, res) => {
  const transactions = await dbSelect('agent_credit_transactions', { agent_email: req.params.email }, { order: 'created_at' });
  const balance = transactions.reduce((s, t) => s + (t.type === 'plus' ? safeNumber(t.amount) : -safeNumber(t.amount)), 0);
  ok(res, { balance, transactions });
}));
app.get('/api/agent/:email/clients', asyncHandler(async (req, res) => ok(res, { clients: await dbSelect('agent_clients', { agent_email: req.params.email }, { order: 'updated_at' }) })));
app.post('/api/agent/client/upsert', asyncHandler(async (req, res) => {
  const client = req.body.client || {}; const agent_email = req.body.agentEmail || req.body.agent_email;
  if (!agent_email || !client.cf) return bad(res, 400, 'Agent email e codice fiscale cliente sono obbligatori.');
  const saved = await dbUpsert('agent_clients', { agent_email, client_cf: String(client.cf).toUpperCase() }, { client_data: client, applications: req.body.applications || [], updated_at: now() });
  ok(res, { client: saved });
}));
app.post('/api/agent/credit-request', asyncHandler(async (req, res) => {
  const request = await dbInsert('agent_credit_requests', { agent_email: req.body.agentEmail || req.body.agent_email, agent_name: req.body.agentName || req.body.agent_name, amount: safeNumber(req.body.amount), status: 'Pending' });
  ok(res, { request });
}));
app.post('/api/admin/credit-request/:id/approve', asyncHandler(async (req, res) => {
  const request = await dbUpdate('agent_credit_requests', req.params.id, { status: 'Approved', admin_note: req.body.adminNote || 'Credito approvato' });
  const tx = await dbInsert('agent_credit_transactions', { agent_email: request.agent_email, type: 'plus', amount: request.amount, reason: `Credito approvato admin richiesta ${request.id}` });
  ok(res, { request, transaction: tx });
}));
app.post('/api/agent/modify-request', asyncHandler(async (req, res) => {
  const request = await dbInsert('modify_requests', { pratica_id: req.body.praticaId || req.body.pratica_id, pratica_code: req.body.praticaCode || req.body.pratica_code, agent_email: req.body.agentEmail, agent_name: req.body.agentName, reason: req.body.reason || 'Richiesta modifica pratica', status: 'Pending' });
  ok(res, { request });
}));
app.post('/api/admin/modify-request/:id/approve', asyncHandler(async (req, res) => ok(res, { request: await dbUpdate('modify_requests', req.params.id, { status: 'Approved', admin_note: req.body.adminNote || 'Permesso concesso' }) })));

// Commercialista full modules.
const moduleMap = {
  companies: 'companies', invoices: 'invoices', sales: 'comm_sales', f24: 'comm_f24', employees: 'comm_employees', documents: 'comm_documents', communications: 'communications', deadlines: 'comm_deadlines', backups: 'comm_backups', subscriptions: 'subscriptions', payments: 'subscription_payments'
};
for (const [route, table] of Object.entries(moduleMap)) {
  app.get(`/api/commercialista/${route}`, asyncHandler(async (req, res) => {
    const filter = req.query.companyId ? { company_id: req.query.companyId } : {};
    ok(res, { [route]: await dbSelect(table, filter, { order: 'updated_at' }) });
  }));
  app.post(`/api/commercialista/${route}`, asyncHandler(async (req, res) => {
    if (route === 'companies') companySchema.parse(req.body || {});
    const item = await dbInsert(table, normalizeCommercialista(table, req.body || {}));
    await audit(`${route}_created`, table, item.id, item.client_id || item.company_id, req.body.by || null, null, item, req);
    if (item.client_id || item.company_id) await incrementVersion(item.client_id || item.company_id, `${route} created`);
    ok(res, { item, [route.slice(0, -1) || 'item']: item });
  }));
  app.patch(`/api/commercialista/${route}/:id`, asyncHandler(async (req, res) => {
    const old = await dbOne(table, { id: req.params.id }); if (!old) return bad(res, 404, 'Record non trovato.');
    const item = await dbUpdate(table, req.params.id, normalizeCommercialista(table, req.body || {}));
    await audit(`${route}_updated`, table, item.id, item.client_id || item.company_id, req.body.by || null, old, item, req);
    if (item.client_id || item.company_id) await incrementVersion(item.client_id || item.company_id, `${route} updated`);
    ok(res, { item });
  }));
}
function normalizeCommercialista(table, b) {
  if (table === 'companies') return {
    name: b.name, owner_name: b.ownerName || b.owner_name, email: b.email, phone: b.phone, vat: b.vat, fiscal_code: b.fiscalCode || b.fiscal_code,
    plan: b.plan || 'Normal', status: b.status || 'Active', shopify_customer_id: b.shopifyCustomerId || b.shopify_customer_id || null,
    assigned_commercialista: b.assignedCommercialista || b.assigned_commercialista, assigned_operator: b.assignedOperator || b.assigned_operator,
    business_data: b.businessData || b.business_data || b, services: b.services || [], deadline: b.deadline || null
  };
  return { ...b, company_id: b.companyId || b.company_id || b.client_id || null, payload: b.payload || b };
}
app.post('/api/companies/create', asyncHandler(async (req, res) => ok(res, { company: await dbInsert('companies', normalizeCommercialista('companies', req.body)) })));
app.post('/api/invoices/create', asyncHandler(async (req, res) => {
  const net = safeNumber(req.body.net); const vat_rate = safeNumber(req.body.vatRate || req.body.vat_rate); const total = req.body.total ?? +(net + net * vat_rate / 100).toFixed(2);
  ok(res, { invoice: await dbInsert('invoices', { ...normalizeCommercialista('invoices', req.body), net, vat_rate, total }) });
}));

// Documents and generated docs.
app.post('/api/documents/upload', upload.array('files'), asyncHandler(async (req, res) => {
  const pratica_id = req.body.praticaId || req.body.pratica_id || null;
  const company_id = req.body.companyId || req.body.company_id || null;
  const uploaded = [];
  for (const file of req.files || []) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storage_path = `${company_id || pratica_id || 'general'}/${Date.now()}-${safeName}`;
    let file_url = `memory://${storage_path}`;
    if (supabase) {
      const { error: upErr } = await supabase.storage.from(bucket).upload(storage_path, file.buffer, { contentType: file.mimetype, upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(storage_path, 60 * 60);
      file_url = signed?.signedUrl || '';
    }
    const row = await dbInsert('documents', { pratica_id, company_id, file_name: file.originalname, file_url, storage_path, mime_type: file.mimetype, uploaded_by: req.body.uploadedBy || 'staff', category: req.body.category || 'Other', visible_to_client: req.body.visibleToClient === 'true' });
    uploaded.push(row);
  }
  ok(res, { uploaded });
}));
app.get('/api/documents/:id/signed-url', asyncHandler(async (req, res) => {
  const doc = await dbOne('documents', { id: req.params.id }); if (!doc) return bad(res, 404, 'Documento non trovato.');
  if (supabase && doc.storage_path) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(doc.storage_path, 60 * 10);
    if (error) throw error;
    return ok(res, { url: data.signedUrl });
  }
  ok(res, { url: doc.file_url });
}));
app.post('/api/documents/generated', asyncHandler(async (req, res) => ok(res, { document: await dbInsert('generated_documents', req.body || {}) })));

// Admin modules.
app.get('/api/admin/users', requireAuth, requireRole('admin'), asyncHandler(async (_req, res) => ok(res, { users: (await dbSelect('dashboard_users', {}, { order: 'created_at' })).map(publicUser) })));
app.post('/api/admin/users/create', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const password = String(req.body.password || '');
  const policy = passwordPolicy(password);
  if (policy) return bad(res, 400, policy);
  if (!req.body.username || !req.body.email || !req.body.name || !req.body.role) return bad(res, 400, 'Nome, email, username e ruolo sono obbligatori.');
  const exists = await findDashboardUser(req.body.username) || await findDashboardUser(req.body.email);
  if (exists) return bad(res, 409, 'Username o email già esistente.');
  const user = await dbInsert('dashboard_users', {
    username: req.body.username,
    email: String(req.body.email).toLowerCase(),
    name: req.body.name,
    role: req.body.role,
    office: req.body.office || req.body.role,
    phone: req.body.phone || '',
    credit: safeNumber(req.body.credit),
    salary: safeNumber(req.body.salary),
    password: null,
    password_hash: await bcrypt.hash(password, 12),
    active: req.body.active ?? true
  });
  await audit('user_created', 'dashboard_user', user.id, null, req.user, null, publicUser(user), req);
  ok(res, { user: publicUser(user) });
}));
app.post('/api/admin/users/:id/password', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const updated = await setUserPassword(req.params.id, req.body.password);
  await audit('admin_password_reset', 'dashboard_user', updated.id, null, req.user, null, { target: updated.email }, req);
  ok(res, { user: publicUser(updated) });
}));
app.patch('/api/admin/users/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const patch = { ...req.body };
  delete patch.password; delete patch.password_hash;
  const updated = await dbUpdate('dashboard_users', req.params.id, patch);
  ok(res, { user: publicUser(updated) });
}));
app.get('/api/admin/dashboard', requireAuth, requireRole('admin'), asyncHandler(async (_req, res) => {
  const [pratiche, companies, tickets, credit, sales] = await Promise.all([dbSelect('pratiche'), dbSelect('companies'), dbSelect('tickets'), dbSelect('agent_credit_transactions'), dbSelect('comm_sales')]);
  ok(res, { stats: { pratiche: pratiche.length, companies: companies.length, tickets: tickets.length, credit: credit.reduce((s, t) => s + (t.type === 'plus' ? safeNumber(t.amount) : -safeNumber(t.amount)), 0), sales: sales.reduce((s, x) => s + safeNumber(x.card || x.cash || x.total || x.payload?.total), 0) } });
}));

// Admin Pro v15 generic data modules (future database-ready storage).
const adminDataTables = {
  products: 'admin_product_prices',
  promotions: 'admin_promotions',
  popups: 'admin_popups',
  complaints: 'admin_complaints',
  sales: 'admin_manual_sales',
  salaries: 'salary_payments',
  commissions: 'commission_payments',
  settings: 'portal_settings'
};
app.get('/api/admin/data/:type', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const table = adminDataTables[req.params.type];
  if (!table) return bad(res, 404, 'Modulo admin non trovato.');
  ok(res, { items: await dbSelect(table, {}, { order: 'updated_at' }) });
}));
app.post('/api/admin/data/:type', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const table = adminDataTables[req.params.type];
  if (!table) return bad(res, 404, 'Modulo admin non trovato.');
  const item = await dbInsert(table, { ...req.body, created_by: req.user.email || req.user.username });
  await audit('admin_data_created', table, item.id, null, req.user, null, item, req);
  ok(res, { item });
}));
app.patch('/api/admin/data/:type/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const table = adminDataTables[req.params.type];
  if (!table) return bad(res, 404, 'Modulo admin non trovato.');
  const item = await dbUpdate(table, req.params.id, req.body || {});
  await audit('admin_data_updated', table, item.id, null, req.user, null, item, req);
  ok(res, { item });
}));

app.get('/api/tickets', asyncHandler(async (req, res) => {
  const filter = req.query.created_by ? { created_by: req.query.created_by } : {};
  ok(res, { tickets: await dbSelect('tickets', filter, { order: 'created_at' }) });
}));
app.post('/api/tickets/create', asyncHandler(async (req, res) => ok(res, { ticket: await dbInsert('tickets', { ...req.body, status: req.body.status || 'Open', progress: req.body.progress || 'Nuovo' }) })));
app.patch('/api/tickets/:id', asyncHandler(async (req, res) => ok(res, { ticket: await dbUpdate('tickets', req.params.id, req.body || {}) })));
app.get('/api/notices', asyncHandler(async (req, res) => {
  const all = await dbSelect('operational_notices', {}, { order: 'created_at' });
  const role = req.query.role || 'all';
  ok(res, { notices: all.filter(n => n.active !== false && (n.target_role === role || n.target_role === 'all' || !n.target_role)) });
}));
app.post('/api/notices/create', asyncHandler(async (req, res) => ok(res, { notice: await dbInsert('operational_notices', { ...req.body, active: req.body.active ?? true }) })));
app.get('/api/sources', asyncHandler(async (_req, res) => ok(res, { sources: await dbSelect('sources', {}, { order: 'created_at' }) })));
app.post('/api/sources/create', asyncHandler(async (req, res) => ok(res, { source: await dbInsert('sources', req.body || {}) })));

// Shopify App Proxy customer dashboard. Verification is enforced if SHOPIFY_API_SECRET is configured.
function verifyAppProxy(req) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return true;
  const query = { ...req.query };
  const signature = query.signature;
  delete query.signature;
  const message = Object.keys(query).sort().map(k => `${k}=${Array.isArray(query[k]) ? query[k].join(',') : query[k]}`).join('');
  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature || '')); } catch { return false; }
}
async function shopifyClientFromProxy(req) {
  if (!verifyAppProxy(req)) return null;
  const shopify_customer_id = req.query.logged_in_customer_id ? String(req.query.logged_in_customer_id) : null;
  if (!shopify_customer_id) return null;
  return await dbOne('companies', { shopify_customer_id }) || await dbOne('clients', { shopify_customer_id });
}
app.get('/apps/cae-commercialista/version', asyncHandler(async (req, res) => {
  const client = await shopifyClientFromProxy(req); if (!client) return bad(res, 401, 'Cliente Shopify non collegato o firma proxy non valida.');
  const v = await dbOne('client_versions', { client_id: client.id });
  ok(res, { client_id: client.id, version: v?.version || 0, updated_at: v?.updated_at || null });
}));
app.get('/apps/cae-commercialista/dashboard', asyncHandler(async (req, res) => {
  const client = await shopifyClientFromProxy(req); if (!client) return bad(res, 401, 'Cliente Shopify non collegato o firma proxy non valida.');
  ok(res, { client_id: client.id, version: (await dbOne('client_versions', { client_id: client.id }))?.version || 0, data: await customerDashboardData(client.id) });
}));
app.get('/apps/cae-commercialista/resources/:kind', asyncHandler(async (req, res) => {
  const client = await shopifyClientFromProxy(req); if (!client) return bad(res, 401, 'Cliente Shopify non collegato o firma proxy non valida.');
  const kind = req.params.kind;
  const table = { pratiche: 'pratiche', fatture: 'invoices', f24: 'comm_f24', dipendenti: 'comm_employees', documenti: 'comm_documents', comunicazioni: 'communications', scadenze: 'comm_deadlines', payments: 'subscription_payments', backups: 'comm_backups' }[kind];
  if (!table) return bad(res, 404, 'Risorsa non supportata.');
  ok(res, { client_id: client.id, data: await dbSelect(table, { company_id: client.id }, { order: 'updated_at' }) });
}));
async function customerDashboardData(client_id) {
  const [company, sales, pratiche, invoices, f24, docs, communications, deadlines] = await Promise.all([
    dbOne('companies', { id: client_id }), dbSelect('comm_sales', { company_id: client_id }, { order: 'date', limit: 60 }), dbSelect('pratiche', {}, { order: 'updated_at' }), dbSelect('invoices', { company_id: client_id }), dbSelect('comm_f24', { company_id: client_id }), dbSelect('comm_documents', { company_id: client_id }), dbSelect('communications', { company_id: client_id }), dbSelect('comm_deadlines', { company_id: client_id })
  ]);
  return { company, sales, pratiche: pratiche.filter(p => p.client_data?.companyId === client_id || p.client_data?.client_id === client_id), invoices, f24, documents: docs, communications, deadlines };
}

// Shopify webhooks.
function verifyShopifyWebhook(req) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return true;
  const hmac = req.get('X-Shopify-Hmac-SHA256') || '';
  const digest = crypto.createHmac('sha256', secret).update(req.body).digest('base64');
  try { return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac)); } catch { return false; }
}
app.post('/api/shopify/webhooks/:topic', asyncHandler(async (req, res) => {
  if (!verifyShopifyWebhook(req)) return bad(res, 401, 'Webhook Shopify non valido.');
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
  let payload = {}; try { payload = JSON.parse(raw); } catch { payload = { raw }; }
  await dbInsert('webhook_events', { provider: 'shopify', event_type: req.params.topic, payload, shopify_shop: req.get('X-Shopify-Shop-Domain') || process.env.SHOPIFY_SHOP });
  ok(res);
}));


/* ========================= CAF CAE ERP v22 core APIs ========================= */
function v22SlugFile(name='file') {
  const cleaned = String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
  return cleaned || `file-${Date.now()}`;
}
async function v22FindPractice(idOrCode) {
  return await dbOne('pratiche', { id: idOrCode }).catch(()=>null) || await dbOne('pratiche', { code: idOrCode }).catch(()=>null);
}
function v22ClientPayload(raw = {}, user = {}) {
  const first = raw.first_name || raw.firstName || raw.first || '';
  const last = raw.last_name || raw.lastName || raw.last || '';
  return {
    owner_role: raw.owner_role || user.role || null,
    owner_email: raw.owner_email || user.email || null,
    created_by: raw.created_by || user.email || null,
    first_name: first,
    last_name: last,
    full_name: raw.full_name || raw.name || `${last} ${first}`.trim(),
    cf: String(raw.cf || raw.codice_fiscale || '').toUpperCase(),
    email: raw.email || '',
    phone: raw.phone || raw.telefono || '',
    whatsapp: raw.whatsapp || raw.phone || '',
    address: raw.address || raw.indirizzo || '',
    city: raw.city || raw.comune || '',
    province: raw.province || raw.provincia || '',
    cap: raw.cap || '',
    country: raw.country || raw.paese || 'Italia',
    language: raw.language || raw.lingua || 'Italiano',
    agent_email: raw.agent_email || raw.agentEmail || (user.role === 'agent' ? user.email : null),
    assigned_team: raw.assigned_team || raw.assignedTeam || null,
    membership_status: raw.membership_status || raw.membershipStatus || null,
    membership_type: raw.membership_type || raw.membershipType || null,
    metadata: raw.metadata || raw
  };
}
function v22FilterClientsForRole(rows = [], user = {}) {
  const role = user.role || 'admin';
  if (role === 'admin' || role === 'bangla') return rows;
  if (role === 'agent') return rows.filter(c => c.agent_email === user.email || c.owner_email === user.email || c.created_by === user.email);
  if (role === 'italy') return rows.filter(c => c.assigned_team === 'italy' || c.owner_role === 'italy');
  if (role === 'commercialista') return rows.filter(c => c.owner_role === 'commercialista' || c.assigned_team === 'commercialista');
  return rows;
}
function v22SanitizePracticeForAgent(raw = {}, user = {}) {
  const p = praticaPayload(raw || {});
  if ((user.role || '') === 'agent') {
    p.agent_email = p.agent_email || user.email;
    p.agent_name = p.agent_name || user.name;
    p.route_team = 'bangla';
    p.assigned_team = 'bangla';
    p.current_owner = 'bangla';
    p.status = p.status || 'Nuova';
    p.workflow_status = p.workflow_status || 'In attesa controllo Team Bangla';
    p.progress = p.progress || 15;
    p.watchers = v20Unique(['admin', 'bangla', 'agent']);
    p.team_message = p.team_message || 'Nuova pratica agente: primo controllo Team Bangla.';
  }
  return p;
}
async function v22Notify(target_role, title, message, user, entity = {}) {
  const row = await dbInsert('v22_notifications', {
    target_role, target_email: entity.target_email || null, title, message, type: entity.type || 'info',
    entity_type: entity.entity_type || 'practice', entity_id: entity.entity_id || entity.id || null,
    created_at: now()
  }).catch(()=>null);
  return row;
}

app.get('/api/v22/clients', requireAuth, asyncHandler(async (req, res) => {
  let rows = await dbSelect('v22_clients', {}, { order: 'updated_at' });
  const q = String(req.query.q || '').toLowerCase().trim();
  rows = v22FilterClientsForRole(rows, req.user);
  if (q) rows = rows.filter(c => JSON.stringify(c).toLowerCase().includes(q));
  ok(res, { clients: rows, count: rows.length, source: 'v22-clients' });
}));
app.post('/api/v22/clients/upsert', requireAuth, asyncHandler(async (req, res) => {
  const payload = v22ClientPayload(req.body.client || req.body || {}, req.user);
  const match = payload.cf ? { cf: payload.cf } : (payload.email ? { email: payload.email } : { phone: payload.phone });
  if (!match.cf && !match.email && !match.phone) return bad(res, 400, 'CF, email o telefono obbligatorio per salvare cliente.');
  const existing = await dbOne('v22_clients', match).catch(()=>null);
  const row = existing ? await dbUpdate('v22_clients', existing.id, { ...payload, created_at: existing.created_at }) : await dbInsert('v22_clients', payload);
  ok(res, { client: row });
}));

app.post('/api/v22/practices', requireAuth, asyncHandler(async (req, res) => {
  const payload = v22SanitizePracticeForAgent(req.body.practice || req.body || {}, req.user);
  if (!payload.code) payload.code = `CAF-${today().slice(0,4)}-${nanoid(6).toUpperCase()}`;
  const saved = await dbUpsert('pratiche', { code: payload.code }, { ...payload, created_by: payload.created_by || req.user.email, updated_by: req.user.email });
  await v20SaveWatchers(saved, v20WatchersOf(saved, ['admin', 'bangla']));
  await v20AddHistory(saved, req.user.role === 'agent' ? 'Pratica creata da agente e inviata a Team Bangla' : 'Pratica creata v22', req.user, req, { event_type: 'created', to_owner: v20OwnerOf(saved) });
  await v22Notify('bangla', 'Nuova pratica da agente', `${saved.code} deve essere controllata e autorizzata.`, req.user, { entity_id: saved.id });
  await v22Notify('admin', 'Nuova pratica creata', `${saved.code} creata da ${v20UserLabel(req.user)}.`, req.user, { entity_id: saved.id });
  ok(res, { practice: saved, pratica: saved });
}));
app.post('/api/v22/practices/:id/authorize', requireAuth, asyncHandler(async (req, res) => {
  if (!['admin','bangla'].includes(req.user.role)) return bad(res, 403, 'Solo Admin o Team Bangla possono autorizzare.');
  const old = await v22FindPractice(req.params.id); if (!old) return bad(res, 404, 'Pratica non trovata.');
  const target = req.body.target || req.body.to || 'italy';
  const message = req.body.message || `Autorizzata da ${v20RoleLabel(req.user.role)} e inviata a ${v20RoleLabel(target)}`;
  const watchers = v20WatchersOf(old, ['admin','bangla',target, old.agent_email ? 'agent' : null]);
  const updated = await dbUpdate('pratiche', old.id, {
    current_owner: target, assigned_team: target, route_team: target, watchers,
    status: target === 'italy' ? 'In verifica Team Italy' : 'In lavorazione',
    workflow_status: target === 'italy' ? 'Autorizzata da Team Bangla' : 'Autorizzata',
    progress: target === 'italy' ? 55 : 45,
    team_message: message,
    team_history: [{ by: v20UserLabel(req.user), role: req.user.role, action: message, date: today(), at: now() }, ...(old.team_history || [])]
  });
  await v20SaveWatchers(updated, watchers);
  await v20AddHistory(updated, message, req.user, req, { event_type: 'authorize', from_owner: v20OwnerOf(old), to_owner: target });
  await v22Notify(target, 'Pratica autorizzata', `${updated.code} ricevuta da Team Bangla.`, req.user, { entity_id: updated.id });
  await v22Notify('admin', 'Pratica autorizzata', `${updated.code}: ${v20RoleLabel(req.user.role)} → ${v20RoleLabel(target)}.`, req.user, { entity_id: updated.id });
  ok(res, { practice: updated, pratica: updated });
}));
app.post('/api/v22/practices/:id/assign', requireAuth, asyncHandler(async (req, res) => {
  if (!['admin','bangla','italy','commercialista'].includes(req.user.role)) return bad(res, 403, 'Permesso insufficiente.');
  const old = await v22FindPractice(req.params.id); if (!old) return bad(res, 404, 'Pratica non trovata.');
  const staff_email = req.body.staff_email || req.body.email || null;
  const staff_name = req.body.staff_name || req.body.name || null;
  const updated = await dbUpdate('pratiche', old.id, { service_data: { ...(old.service_data || {}), assigned_staff_email: staff_email, assigned_staff_name: staff_name }, updated_by: req.user.email });
  await v20AddHistory(updated, `Assegnata a ${staff_name || staff_email || 'staff'}`, req.user, req, { event_type: 'assignment' });
  ok(res, { practice: updated, pratica: updated });
}));

app.get('/api/practices/:id/files', requireAuth, asyncHandler(async (req, res) => {
  const p = await v22FindPractice(req.params.id); if (!p) return bad(res, 404, 'Pratica non trovata.');
  const files = await dbSelect('practice_files', { pratica_id: p.id }, { order: 'created_at' }).catch(()=>[]);
  ok(res, { files, count: files.length });
}));
app.post('/api/practices/:id/files/upload', requireAuth, upload.array('files', 12), asyncHandler(async (req, res) => {
  const p = await v22FindPractice(req.params.id); if (!p) return bad(res, 404, 'Pratica non trovata.');
  const uploaded = [];
  for (const file of (req.files || [])) {
    const path = `practices/${p.id}/${Date.now()}-${nanoid(6)}-${v22SlugFile(file.originalname)}`;
    let signedUrl = null;
    if (supabase) {
      const { error } = await supabase.storage.from(bucket).upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
      if (error) throw error;
      const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
      signedUrl = signed.data?.signedUrl || null;
    }
    const row = await dbInsert('practice_files', {
      pratica_id: p.id, pratica_code: p.code, client_id: p.client_id || null, company_id: p.company_id || null,
      category: req.body.category || (req.body.is_receipt === 'true' ? 'ricevuta' : 'documento'),
      visibility: req.body.visibility || 'internal', file_name: file.originalname, file_path: path, file_url: signedUrl,
      mime_type: file.mimetype, size_bytes: file.size, uploaded_by_role: req.user.role, uploaded_by_email: req.user.email,
      uploaded_by_name: v20UserLabel(req.user), note: req.body.note || '', is_receipt: req.body.is_receipt === 'true'
    });
    uploaded.push(row);
  }
  await v20AddHistory(p, `${uploaded.length} documento/i caricato/i`, req.user, req, { event_type: 'file_upload' });
  await v22Notify('admin', 'Documento caricato', `${p.code}: ${uploaded.length} nuovo/i allegato/i.`, req.user, { entity_id: p.id, type: 'file' });
  ok(res, { files: uploaded, count: uploaded.length });
}));
app.get('/api/files/:id/download', requireAuth, asyncHandler(async (req, res) => {
  const f = await dbOne('practice_files', { id: req.params.id });
  if (!f) return bad(res, 404, 'File non trovato.');
  if (!supabase) return bad(res, 501, 'Storage non configurato.');
  const signed = await supabase.storage.from(bucket).createSignedUrl(f.file_path, 60 * 10, { download: f.file_name });
  if (signed.error) throw signed.error;
  res.redirect(signed.data.signedUrl);
}));
app.get('/api/files/:id/preview', requireAuth, asyncHandler(async (req, res) => {
  const f = await dbOne('practice_files', { id: req.params.id });
  if (!f) return bad(res, 404, 'File non trovato.');
  if (!supabase) return bad(res, 501, 'Storage non configurato.');
  const signed = await supabase.storage.from(bucket).createSignedUrl(f.file_path, 60 * 10);
  if (signed.error) throw signed.error;
  res.redirect(signed.data.signedUrl);
}));

app.get('/api/v22/team-members', requireAuth, asyncHandler(async (req, res) => {
  const role = req.query.team_role || req.query.role;
  const rows = await dbSelect('v22_team_members', role ? { team_role: role } : {}, { order: 'updated_at' }).catch(()=>[]);
  ok(res, { members: rows, count: rows.length });
}));
app.post('/api/v22/team-members', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const row = await dbUpsert('v22_team_members', { team_role: req.body.team_role, user_email: req.body.user_email }, req.body);
  ok(res, { member: row });
}));
app.post('/api/v22/team/daily-report', requireAuth, asyncHandler(async (req, res) => {
  const row = await dbInsert('v22_daily_work_reports', {
    team_role: req.body.team_role || req.user.role,
    employee_email: req.user.email,
    employee_name: v20UserLabel(req.user),
    done_count: safeNumber(req.body.done_count || req.body.done),
    pending_count: safeNumber(req.body.pending_count || req.body.pending),
    issue_count: safeNumber(req.body.issue_count || req.body.issues),
    note: req.body.note || '',
    report_date: req.body.report_date || today(),
    metadata: req.body.metadata || {}
  });
  await v22Notify('admin', 'Report giornaliero team', `${v20UserLabel(req.user)} ha inviato report (${row.team_role}).`, req.user, { entity_id: row.id, type: 'daily_report' });
  ok(res, { report: row });
}));

app.get('/api/v22/membership/results', requireAuth, asyncHandler(async (req, res) => {
  const rows = await dbSelect('v22_membership_results', {}, { order: 'updated_at' }).catch(()=>[]);
  ok(res, { results: rows, count: rows.length });
}));
app.post('/api/v22/membership/results', requireAuth, asyncHandler(async (req, res) => {
  const row = await dbInsert('v22_membership_results', req.body || {});
  ok(res, { result: row });
}));
app.get('/api/v22/agent/:email/credit', requireAuth, asyncHandler(async (req, res) => {
  const ledger = await dbSelect('v22_agent_credit_ledger', { agent_email: req.params.email }, { order: 'created_at' }).catch(()=>[]);
  const balance = ledger.reduce((s,t)=>s + (String(t.type).toLowerCase()==='plus' ? safeNumber(t.amount) : -safeNumber(t.amount)), 0);
  ok(res, { balance, ledger });
}));
app.post('/api/v22/agent/credit-request', requireAuth, asyncHandler(async (req, res) => {
  const row = await dbInsert('v22_agent_credit_requests', {
    agent_email: req.body.agent_email || req.user.email,
    agent_name: req.body.agent_name || v20UserLabel(req.user),
    phone: req.body.phone || req.user.phone || '',
    amount: safeNumber(req.body.amount), payment_method: req.body.payment_method || '', proof_url: req.body.proof_url || '', note: req.body.note || ''
  });
  await v22Notify('admin', 'Richiesta credito agente', `${row.agent_name} richiede credito ${row.amount}€ · ${row.phone || 'telefono non indicato'}.`, req.user, { entity_id: row.id, type: 'credit' });
  ok(res, { request: row });
}));
app.post('/api/v22/agent/credit-request/:id/approve', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const old = await dbOne('v22_agent_credit_requests', { id: req.params.id }); if (!old) return bad(res, 404, 'Richiesta non trovata.');
  const approved = await dbUpdate('v22_agent_credit_requests', old.id, { status: 'Approvata', verified_by: req.user.email, verified_at: now() });
  const current = await dbSelect('v22_agent_credit_ledger', { agent_email: old.agent_email }, { order: 'created_at' }).catch(()=>[]);
  const balance = current.reduce((s,t)=>s + (String(t.type).toLowerCase()==='plus' ? safeNumber(t.amount) : -safeNumber(t.amount)), 0) + safeNumber(old.amount);
  await dbInsert('v22_agent_credit_ledger', { agent_email: old.agent_email, agent_name: old.agent_name, type: 'plus', amount: safeNumber(old.amount), balance_after: balance, reason: 'Credito approvato da admin', created_by: req.user.email });
  await v22Notify('agent', 'Credito approvato', `Credito ${old.amount}€ approvato.`, req.user, { target_email: old.agent_email, entity_id: old.id, type: 'credit' });
  ok(res, { request: approved, balance });
}));
app.get('/api/v22/tickets', requireAuth, asyncHandler(async (req, res) => {
  let rows = await dbSelect('v22_tickets', {}, { order: 'created_at' }).catch(()=>[]);
  if (req.user.role !== 'admin') rows = rows.filter(t => t.source_email === req.user.email || t.target_role === req.user.role);
  ok(res, { tickets: rows, count: rows.length });
}));
app.post('/api/v22/tickets', requireAuth, asyncHandler(async (req, res) => {
  const row = await dbInsert('v22_tickets', { ...req.body, source_role: req.user.role, source_email: req.user.email, source_name: v20UserLabel(req.user) });
  await v22Notify(req.body.target_role || 'admin', 'Nuovo ticket', `${v20UserLabel(req.user)}: ${row.subject}`, req.user, { entity_id: row.id, type: 'ticket' });
  ok(res, { ticket: row });
}));
app.get('/api/v22/commercialista/packages', requireAuth, asyncHandler(async (req, res) => {
  const rows = await dbSelect('v22_commercialista_packages', { active: true }, { order: 'monthly_price', ascending: true }).catch(()=>[]);
  ok(res, { packages: rows });
}));
app.get('/api/v22/notifications', requireAuth, asyncHandler(async (req, res) => {
  const rows = await dbSelect('v22_notifications', {}, { order: 'created_at', limit: 100 }).catch(()=>[]);
  const filtered = rows.filter(n => !n.target_role || n.target_role === req.user.role || n.target_role === 'all' || n.target_email === req.user.email || req.user.role === 'admin');
  ok(res, { notifications: filtered, count: filtered.length });
}));

app.use((err, req, res, _next) => {
  console.error('[CAF CAE API]', err);
  if (err?.name === 'ZodError') return bad(res, 422, 'Controlla i campi obbligatori.', err.errors);
  bad(res, 500, err.message || 'Errore server.');
});

app.listen(PORT, () => console.log(`CAF CAE full dashboard backend v15 admin pro running on port ${PORT} (${hasSupabase ? 'Supabase' : 'memory fallback'})`));
