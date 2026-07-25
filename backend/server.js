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
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const bad = (res, status, message, details) => res.status(status).json({ ok: false, error: message, details: process.env.NODE_ENV === 'production' ? undefined : details });

const TABLES = [
  'dashboard_snapshots', 'system_versions', 'dashboard_users', 'password_reset_tokens', 'clients', 'business_profiles', 'client_assignments',
  'plans', 'subscriptions', 'subscription_payments', 'pratiche', 'practice_status_history', 'documents', 'generated_documents',
  'agent_clients', 'agent_credit_transactions', 'agent_credit_requests', 'modify_requests', 'companies', 'invoices',
  'comm_sales', 'comm_f24', 'comm_employees', 'comm_documents', 'comm_deadlines', 'comm_backups', 'communications',
  'tickets', 'operational_notices', 'sources', 'team_daily_reports', 'receipts', 'audit_logs', 'client_versions', 'shopify_sync_logs',
  'webhook_events'
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
async function dbInsert(table, row) {
  const record = { id: row.id || nanoid(12), created_at: row.created_at || now(), updated_at: row.updated_at || now(), ...row };
  if (supabase) {
    const { data, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw error;
    return data;
  }
  memory.get(table).unshift(record);
  return record;
}
async function dbUpdate(table, id, patch) {
  const update = { ...patch, updated_at: now() };
  if (supabase) {
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
async function incrementVersion(client_id, reason = 'update') {
  if (!client_id) return null;
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
    assigned_team: b.assignedTeam || b.assigned_team || 'bangla',
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
app.get('/api/health', asyncHandler(async (_req, res) => ok(res, { service: 'CAF CAE full dashboard backend v11', database: hasSupabase ? 'supabase' : 'memory-fallback', time: now() })));

app.get('/api/live/version', asyncHandler(async (req, res) => {
  const key = `${req.query.role || 'all'}:${req.query.email || 'all'}`;
  const v = await dbOne('system_versions', { version_key: key });
  ok(res, { version: v?.version || 0, updated_at: v?.updated_at || null });
}));
app.get('/api/live/state', asyncHandler(async (req, res) => {
  const role = req.query.role || 'all'; const email = req.query.email || 'all';
  const exact = await dbOne('dashboard_snapshots', { role, email });
  const global = await dbOne('dashboard_snapshots', { role: 'all', email: 'all' });
  ok(res, { state: exact?.state_data || global?.state_data || null, version: (await dbOne('system_versions', { version_key: `${role}:${email}` }))?.version || 0 });
}));
app.post('/api/live/state', asyncHandler(async (req, res) => {
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
  if (role === 'bangla') pratiche = pratiche.filter(p => ['bangla', 'all'].includes(p.assigned_team) || ['bangla', 'all'].includes(p.route_team));
  if (role === 'italy') pratiche = pratiche.filter(p => p.assigned_team === 'italy' || p.route_team === 'italy');
  if (role === 'commercialista') pratiche = pratiche.filter(p => p.service_group === 'Commercialista' || p.client_data?.email === email);
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
  await bumpSystem('all', 'all', 'pratica created');
  ok(res, { pratica: created });
}));
app.post('/api/pratiche/create', asyncHandler(async (req, res) => {
  praticaSchema.parse(req.body || {});
  const payload = { ...praticaPayload(req.body), created_at: now() };
  const created = await dbInsert('pratiche', payload);
  await audit('practice_created', 'pratica', created.id, created.client_data?.client_id, req.body.by || { email: created.agent_email }, null, created, req);
  if (created.agent_email && created.cost > 0) await dbInsert('agent_credit_transactions', { agent_email: created.agent_email, type: 'minus', amount: created.cost, reason: `Creazione ${created.service_title} ${created.code}`, pratica_id: created.id });
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
  const team = req.body.assigned_team || req.body.team || 'italy';
  const updated = await dbUpdate('pratiche', old.id, { route_team: team, assigned_team: team, status: req.body.status || 'In verifica', team_message: req.body.message || `Invio a ${team}`, team_history: [{ by: req.body.by || 'api', role: req.body.role || 'team', action: req.body.message || `Invio a ${team}`, date: today() }, ...(old.team_history || [])] });
  ok(res, { pratica: updated });
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
app.get('/api/admin/dashboard', asyncHandler(async (_req, res) => {
  const [pratiche, companies, tickets, credit, sales] = await Promise.all([dbSelect('pratiche'), dbSelect('companies'), dbSelect('tickets'), dbSelect('agent_credit_transactions'), dbSelect('comm_sales')]);
  ok(res, { stats: { pratiche: pratiche.length, companies: companies.length, tickets: tickets.length, credit: credit.reduce((s, t) => s + (t.type === 'plus' ? safeNumber(t.amount) : -safeNumber(t.amount)), 0), sales: sales.reduce((s, x) => s + safeNumber(x.card || x.cash || x.total || x.payload?.total), 0) } });
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

app.use((err, req, res, _next) => {
  console.error('[CAF CAE API]', err);
  if (err?.name === 'ZodError') return bad(res, 422, 'Controlla i campi obbligatori.', err.errors);
  bad(res, 500, err.message || 'Errore server.');
});

app.listen(PORT, () => console.log(`CAF CAE full dashboard backend v11 running on port ${PORT} (${hasSupabase ? 'Supabase' : 'memory fallback'})`));
