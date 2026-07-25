-- CAF CAE Full Dashboard v11 Supabase/PostgreSQL schema
-- Run this in Supabase SQL Editor. Safe for new project.

create extension if not exists pgcrypto;

create table if not exists dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'all',
  email text not null default 'all',
  state_data jsonb not null default '{}'::jsonb,
  saved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(role,email)
);

create table if not exists system_versions (
  id uuid primary key default gen_random_uuid(),
  version_key text not null unique,
  version integer not null default 0,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dashboard_users (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  email text unique,
  name text not null,
  role text not null check (role in ('admin','agent','commercialista','bangla','italy','support','readonly')),
  password_hash text,
  password text,
  phone text,
  office text,
  credit numeric(12,2) default 0,
  salary numeric(12,2) default 0,
  active boolean default true,
  locked_until timestamptz,
  failed_attempts integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text unique,
  customer_first_name text,
  customer_last_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  cap text,
  country text default 'Italia',
  status text default 'Active',
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  shopify_customer_id text unique,
  name text not null,
  owner_name text,
  email text,
  phone text,
  vat text,
  fiscal_code text,
  plan text default 'Normal',
  status text default 'Active',
  assigned_commercialista text,
  assigned_operator text,
  business_data jsonb default '{}'::jsonb,
  services jsonb default '[]'::jsonb,
  deadline date,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists business_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  partita_iva text,
  codice_fiscale text,
  business_type text,
  ateco_code text,
  chamber_number text,
  rea_number text,
  pec text,
  sdi_code text,
  business_start_date date,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_monthly numeric(12,2) default 0,
  price_yearly numeric(12,2) default 0,
  included_services jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  plan text not null,
  price numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  remaining_amount numeric(12,2) default 0,
  billing_frequency text default 'Yearly',
  start_date date,
  renewal_date date,
  payment_status text default 'Pending',
  payment_method text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscription_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount numeric(12,2) default 0,
  method text,
  status text default 'Paid',
  paid_at timestamptz default now(),
  note text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pratiche (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  source text default 'manual',
  service_group text,
  service_key text,
  service_title text,
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  client_data jsonb default '{}'::jsonb,
  agent_email text,
  agent_name text,
  route_team text default 'bangla',
  assigned_team text default 'bangla',
  status text default 'Nuova',
  payment_status text default 'Agent credit',
  payment_mode text default 'Credito agente',
  document_status text default 'Documenti mancanti',
  cost numeric(12,2) default 0,
  commission numeric(12,2) default 0,
  commission_status text default 'Pending',
  missing_docs jsonb default '[]'::jsonb,
  checked_docs jsonb default '[]'::jsonb,
  uploads jsonb default '[]'::jsonb,
  team_message text,
  service_data jsonb default '{}'::jsonb,
  internal_730 jsonb,
  delega boolean default false,
  privacy boolean default false,
  signature boolean default false,
  signature_data_url text,
  deadline date,
  shopify_order_reference text,
  receipt_link text,
  team_history jsonb default '[]'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists practice_status_history (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid references pratiche(id) on delete cascade,
  previous_status text,
  new_status text,
  note text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agent_clients (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null,
  client_cf text not null,
  client_data jsonb default '{}'::jsonb,
  applications jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(agent_email, client_cf)
);

create table if not exists agent_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null,
  type text not null check (type in ('plus','minus')),
  amount numeric(12,2) not null default 0,
  reason text,
  pratica_id uuid references pratiche(id) on delete set null,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agent_credit_requests (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null,
  agent_name text,
  amount numeric(12,2) not null default 0,
  status text default 'Pending',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists modify_requests (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid references pratiche(id) on delete set null,
  pratica_code text,
  agent_email text,
  agent_name text,
  reason text,
  status text default 'Pending',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete cascade,
  invoice_number text,
  type text,
  client_name text,
  description text,
  net numeric(12,2) default 0,
  vat_rate numeric(5,2) default 0,
  total numeric(12,2) default 0,
  status text default 'Draft',
  due date,
  file_url text,
  xml_url text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comm_sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete cascade,
  date date not null default current_date,
  card numeric(12,2) default 0,
  cash numeric(12,2) default 0,
  other numeric(12,2) default 0,
  agency_total numeric(12,2) default 0,
  difference numeric(12,2) generated always as ((coalesce(card,0)+coalesce(cash,0)+coalesce(other,0))-coalesce(agency_total,0)) stored,
  closure_no text,
  status text default 'Bozza',
  firma_digitale_status text,
  note text,
  attachment_url text,
  operator text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comm_f24 (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete cascade,
  type text,
  period text,
  amount numeric(12,2) default 0,
  due date,
  status text default 'Pending',
  receipt text,
  note text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comm_employees (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete cascade,
  name text,
  cf text,
  contract text,
  start_date date,
  end_date date,
  payroll text,
  status text default 'Active',
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  pratica_id uuid references pratiche(id) on delete set null,
  file_name text not null,
  file_url text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  category text default 'Other',
  visible_to_client boolean default false,
  internal_only boolean default false,
  approval_status text default 'Pending',
  expiry_date date,
  description text,
  version integer default 1,
  uploaded_by text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comm_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  pratica_id uuid references pratiche(id) on delete set null,
  file_name text,
  file_url text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  category text default 'Other',
  visible_to_client boolean default false,
  internal_only boolean default false,
  approval_status text default 'Pending',
  expiry_date date,
  description text,
  version integer default 1,
  payload jsonb default '{}'::jsonb,
  uploaded_by text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists generated_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  pratica_id uuid references pratiche(id) on delete set null,
  document_type text,
  file_url text,
  storage_path text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  pratica_id uuid references pratiche(id) on delete set null,
  audience text,
  title text,
  subject text,
  message text,
  type text,
  priority text default 'Normale',
  channel text default 'Dashboard',
  status text default 'Inviato',
  read_at timestamptz,
  email_status text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comm_deadlines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete cascade,
  type text,
  date date,
  priority text default 'Normale',
  description text,
  status text default 'Open',
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comm_backups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  type text,
  status text default 'Pending',
  destination text,
  file_size bigint,
  r2_path text,
  google_drive_file_id text,
  checksum text,
  error_message text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  title text,
  subject text,
  message text,
  role text,
  created_by text,
  pratica_id uuid references pratiche(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  status text default 'Open',
  progress text default 'Nuovo',
  priority text default 'Normale',
  solved_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists operational_notices (
  id uuid primary key default gen_random_uuid(),
  target_role text default 'all',
  title text not null,
  message text,
  level text default 'Info',
  image_url text,
  link_url text,
  active boolean default true,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  category text,
  note text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists team_daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  role text,
  done integer default 0,
  issues integer default 0,
  note text,
  report_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid references pratiche(id) on delete cascade,
  pratica_code text,
  receipt_type text,
  file_url text,
  protocol_no text,
  note text,
  uploaded_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists client_versions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  version integer not null default 0,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  staff_user text,
  action text not null,
  entity_type text,
  entity_id text,
  client_id uuid,
  previous_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shopify_sync_logs (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text,
  action text,
  status text default 'Pending',
  request jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text,
  event_type text,
  shopify_shop text,
  payload jsonb,
  processed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pratiche_agent on pratiche(agent_email);
create index if not exists idx_pratiche_team on pratiche(assigned_team, route_team);
create index if not exists idx_pratiche_status on pratiche(status);
create index if not exists idx_companies_shopify on companies(shopify_customer_id);
create index if not exists idx_sales_company_date on comm_sales(company_id, date desc);
create index if not exists idx_documents_company on documents(company_id);
create index if not exists idx_documents_pratica on documents(pratica_id);
create index if not exists idx_audit_client on audit_logs(client_id, created_at desc);
create index if not exists idx_client_versions_client on client_versions(client_id);

-- v12 security: demo plaintext password seed removed.
-- Create/update users with hashed passwords by running:
-- supabase/caf_cae_schema_v12_secure_auth.sql
