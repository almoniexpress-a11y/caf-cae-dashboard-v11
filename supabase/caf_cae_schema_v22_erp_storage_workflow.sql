-- CAF CAE ERP v22: backend-first workflow, clients, documents, teams, membership, tickets
-- Run this after v21 SQL. It is safe/idempotent.

create extension if not exists "pgcrypto";

-- Storage bucket for practice/client/company files. Backend uses service role and can create signed URLs.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create table if not exists v22_clients (
  id uuid primary key default gen_random_uuid(),
  owner_role text,
  owner_email text,
  created_by text,
  first_name text,
  last_name text,
  full_name text,
  cf text,
  email text,
  phone text,
  whatsapp text,
  address text,
  city text,
  province text,
  cap text,
  country text default 'Italia',
  language text default 'Italiano',
  agent_email text,
  assigned_team text,
  membership_status text,
  membership_type text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_v22_clients_cf on v22_clients (cf);
create index if not exists idx_v22_clients_email on v22_clients (email);
create index if not exists idx_v22_clients_phone on v22_clients (phone);
create index if not exists idx_v22_clients_agent on v22_clients (agent_email);
create index if not exists idx_v22_clients_updated on v22_clients (updated_at desc);

create table if not exists practice_files (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid,
  pratica_code text,
  client_id uuid,
  company_id uuid,
  category text default 'documento',
  visibility text default 'internal',
  file_name text not null,
  file_path text not null,
  file_url text,
  mime_type text,
  size_bytes bigint default 0,
  uploaded_by_role text,
  uploaded_by_email text,
  uploaded_by_name text,
  note text,
  status text default 'Caricato',
  is_receipt boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_practice_files_pratica on practice_files (pratica_id, pratica_code, created_at desc);
create index if not exists idx_practice_files_client on practice_files (client_id, created_at desc);
create index if not exists idx_practice_files_company on practice_files (company_id, created_at desc);

create table if not exists v22_team_members (
  id uuid primary key default gen_random_uuid(),
  team_role text not null,
  user_email text not null,
  user_name text,
  phone text,
  permissions jsonb default '{}'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(team_role, user_email)
);

create table if not exists v22_daily_work_reports (
  id uuid primary key default gen_random_uuid(),
  team_role text not null,
  employee_email text,
  employee_name text,
  done_count integer default 0,
  pending_count integer default 0,
  issue_count integer default 0,
  note text,
  report_date date default current_date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_v22_daily_reports_team on v22_daily_work_reports (team_role, report_date desc);

create table if not exists v22_agent_credit_requests (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null,
  agent_name text,
  phone text,
  amount numeric default 0,
  payment_method text,
  proof_url text,
  note text,
  status text default 'In attesa',
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_v22_credit_requests_agent on v22_agent_credit_requests (agent_email, created_at desc);

create table if not exists v22_agent_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null,
  agent_name text,
  type text not null,
  amount numeric default 0,
  balance_after numeric,
  pratica_code text,
  reason text,
  created_by text,
  created_at timestamptz default now()
);
create index if not exists idx_v22_credit_ledger_agent on v22_agent_credit_ledger (agent_email, created_at desc);

create table if not exists v22_membership_results (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  pratica_id uuid,
  pratica_code text,
  client_name text,
  cf text,
  membership_type text,
  status text default 'In revisione',
  result text,
  expiry_date date,
  agent_email text,
  assigned_team text,
  note text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_v22_membership_cf on v22_membership_results (cf, updated_at desc);
create index if not exists idx_v22_membership_team on v22_membership_results (assigned_team, status);

create table if not exists v22_tickets (
  id uuid primary key default gen_random_uuid(),
  target_role text default 'admin',
  source_role text,
  source_email text,
  source_name text,
  pratica_id uuid,
  pratica_code text,
  subject text not null,
  message text,
  priority text default 'Normale',
  status text default 'Aperto',
  reply text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_v22_tickets_target on v22_tickets (target_role, status, created_at desc);

create table if not exists v22_commercialista_packages (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  monthly_price numeric default 0,
  included jsonb default '[]'::jsonb,
  excluded jsonb default '[]'::jsonb,
  limits jsonb default '{}'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
insert into v22_commercialista_packages (code, name, monthly_price, included, excluded, limits)
values
  ('base', 'Base', 49, '["Fatture base", "F24", "Archivio documenti"]', '["Buste paga", "Consulenza avanzata"]', '{"ditte":1,"dipendenti":0}'),
  ('professional', 'Professional', 99, '["Fatture", "F24", "Buste paga", "Scadenze", "Report mensile"]', '["Consulenza straordinaria"]', '{"ditte":3,"dipendenti":5}'),
  ('premium', 'Premium', 149, '["Tutto Professional", "Consulenza", "Report avanzato", "Priorità"]', '[]', '{"ditte":10,"dipendenti":20}')
on conflict (code) do nothing;

create table if not exists v22_company_packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  package_code text,
  package_name text,
  status text default 'Attivo',
  start_date date default current_date,
  renewal_date date,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists v22_notifications (
  id uuid primary key default gen_random_uuid(),
  target_role text,
  target_email text,
  title text not null,
  message text,
  type text default 'info',
  entity_type text,
  entity_id text,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_v22_notifications_target on v22_notifications (target_role, target_email, is_read, created_at desc);

-- Optional seed team members based on current known team users.
insert into v22_team_members (team_role, user_email, user_name, permissions)
values
  ('bangla', 'bangla@cafcae.it', 'Team Bangla', '{"view_all":true,"authorize":true,"transfer":true,"upload":true}'::jsonb),
  ('italy', 'italy@cafcae.it', 'Team Italy', '{"view_assigned":true,"complete":true,"upload_receipt":true,"return_bangla":true}'::jsonb),
  ('commercialista', 'commercialista@cafcae.it', 'Commercialista', '{"companies":true,"documents":true,"reports":true}'::jsonb)
on conflict (team_role, user_email) do nothing;
