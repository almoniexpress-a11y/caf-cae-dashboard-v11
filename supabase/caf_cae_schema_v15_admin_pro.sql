-- CAF CAE v15 Admin Pro optional database tables
-- Safe to run after v12 secure auth and v14 role base.
create extension if not exists pgcrypto;

alter table if exists public.dashboard_users add column if not exists service_access jsonb default '[]'::jsonb;
alter table if exists public.dashboard_users add column if not exists block_status text default 'Active';
alter table if exists public.dashboard_users add column if not exists block_reason text;

create table if not exists public.admin_product_prices (
  id uuid primary key default gen_random_uuid(),
  service_key text unique not null,
  title text,
  category text,
  cost numeric(12,2) default 0,
  commission numeric(12,2) default 0,
  enabled boolean default true,
  note text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  target_role text default 'all',
  level text default 'info',
  start_date date default current_date,
  end_date date,
  active boolean default true,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  target_role text default 'all',
  active boolean default true,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_complaints (
  id uuid primary key default gen_random_uuid(),
  source text default 'Admin',
  pratica_code text,
  subject text not null,
  message text,
  status text default 'Open',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_manual_sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date default current_date,
  title text,
  source text default 'Admin',
  amount numeric(12,2) default 0,
  note text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_email text,
  role text,
  amount numeric(12,2) default 0,
  status text default 'Paid',
  paid_by text,
  paid_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.commission_payments (
  id uuid primary key default gen_random_uuid(),
  pratica_id text,
  pratica_code text,
  agent_email text,
  amount numeric(12,2) default 0,
  status text default 'Paid',
  paid_by text,
  paid_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.portal_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_data jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
