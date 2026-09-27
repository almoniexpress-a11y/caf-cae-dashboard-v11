-- CAF CAE v16 - Shopify membership activation
-- Run once in Supabase SQL Editor before deploying the v16 backend.

create extension if not exists pgcrypto;

create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price numeric(12,2) not null default 0,
  duration_months integer not null default 12,
  practice_credits integer not null default 0,
  discount_percent numeric(5,2) not null default 0,
  max_family_members integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists membership_plan_services (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references membership_plans(id) on delete cascade,
  service_code text not null,
  service_name text not null,
  included_eligible boolean not null default true,
  discount_eligible boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, service_code)
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  branch_code text not null unique,
  branch_name text not null,
  city text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_memberships (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  client_id uuid not null references clients(id) on delete cascade,
  plan_id uuid not null references membership_plans(id),
  branch_id uuid references branches(id),
  shopify_order_id text not null,
  shopify_order_name text,
  shopify_line_item_id text not null,
  shopify_customer_id text,
  sku text not null,
  status text not null default 'Active',
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  practice_credits_total integer not null default 0,
  practice_credits_used integer not null default 0,
  discount_percent numeric(5,2) not null default 0,
  max_family_members integer not null default 1,
  amount_paid numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  source text not null default 'shopify',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shopify_order_id, shopify_line_item_id)
);

create table if not exists membership_family_members (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references customer_memberships(id) on delete cascade,
  full_name text not null,
  fiscal_code text,
  relationship text,
  date_of_birth date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists membership_usage (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references customer_memberships(id) on delete cascade,
  service_code text not null,
  service_name text,
  credits_used integer not null default 1,
  amount_before_discount numeric(12,2),
  discount_amount numeric(12,2),
  pratica_id uuid references pratiche(id) on delete set null,
  note text,
  used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists membership_audit_logs (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references customer_memberships(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  actor text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists membership_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  membership_id uuid not null references customer_memberships(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  shopify_order_id text not null,
  shopify_line_item_id text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  status text not null default 'Paid',
  issued_at timestamptz not null default now(),
  receipt_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shopify_order_id, shopify_line_item_id)
);

create table if not exists shopify_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  webhook_id text not null unique,
  topic text not null,
  shop_domain text,
  shopify_order_id text,
  status text not null default 'Processing',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep this migration compatible with earlier draft versions of the membership tables.
alter table membership_plans add column if not exists duration_months integer not null default 12;
alter table membership_plans add column if not exists name text;
alter table membership_plans add column if not exists price numeric(12,2) not null default 0;
alter table membership_plans add column if not exists practice_credits integer not null default 0;
alter table membership_plans add column if not exists discount_percent numeric(5,2) not null default 0;
alter table membership_plans add column if not exists max_family_members integer not null default 1;
alter table membership_plans add column if not exists active boolean not null default true;

alter table customer_memberships add column if not exists membership_number text;
alter table customer_memberships add column if not exists client_id uuid references clients(id) on delete cascade;
alter table customer_memberships add column if not exists plan_id uuid references membership_plans(id);
alter table customer_memberships add column if not exists branch_id uuid references branches(id);
alter table customer_memberships add column if not exists shopify_order_id text;
alter table customer_memberships add column if not exists shopify_order_name text;
alter table customer_memberships add column if not exists shopify_line_item_id text;
alter table customer_memberships add column if not exists shopify_customer_id text;
alter table customer_memberships add column if not exists sku text;
alter table customer_memberships add column if not exists starts_at timestamptz;
alter table customer_memberships add column if not exists expires_at timestamptz;
alter table customer_memberships add column if not exists practice_credits_total integer not null default 0;
alter table customer_memberships add column if not exists practice_credits_used integer not null default 0;
alter table customer_memberships add column if not exists discount_percent numeric(5,2) not null default 0;
alter table customer_memberships add column if not exists max_family_members integer not null default 1;
alter table customer_memberships add column if not exists amount_paid numeric(12,2) not null default 0;
alter table customer_memberships add column if not exists currency text not null default 'EUR';
alter table customer_memberships add column if not exists source text not null default 'shopify';
alter table customer_memberships add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table membership_receipts add column if not exists receipt_number text;
alter table membership_receipts add column if not exists membership_id uuid references customer_memberships(id) on delete cascade;
alter table membership_receipts add column if not exists client_id uuid references clients(id) on delete cascade;
alter table membership_receipts add column if not exists shopify_order_id text;
alter table membership_receipts add column if not exists shopify_line_item_id text;
alter table membership_receipts add column if not exists amount numeric(12,2) not null default 0;
alter table membership_receipts add column if not exists currency text not null default 'EUR';
alter table membership_receipts add column if not exists status text not null default 'Paid';
alter table membership_receipts add column if not exists issued_at timestamptz not null default now();
alter table membership_receipts add column if not exists receipt_data jsonb not null default '{}'::jsonb;

alter table shopify_webhook_receipts add column if not exists webhook_id text;
alter table shopify_webhook_receipts add column if not exists topic text;
alter table shopify_webhook_receipts add column if not exists shop_domain text;
alter table shopify_webhook_receipts add column if not exists shopify_order_id text;
alter table shopify_webhook_receipts add column if not exists status text not null default 'Processing';
alter table shopify_webhook_receipts add column if not exists error_message text;
alter table shopify_webhook_receipts add column if not exists processed_at timestamptz;

create unique index if not exists uq_customer_memberships_shopify_line on customer_memberships(shopify_order_id, shopify_line_item_id);
create unique index if not exists uq_shopify_webhook_receipts_webhook on shopify_webhook_receipts(webhook_id);
create unique index if not exists uq_membership_receipts_shopify_line on membership_receipts(shopify_order_id, shopify_line_item_id);

create index if not exists idx_customer_memberships_client on customer_memberships(client_id, status);
create index if not exists idx_customer_memberships_expiry on customer_memberships(expires_at);
create index if not exists idx_membership_usage_membership on membership_usage(membership_id, used_at desc);
create index if not exists idx_membership_receipts_client on membership_receipts(client_id, issued_at desc);

insert into membership_plans(code, name, price, duration_months, practice_credits, discount_percent, max_family_members, active)
values
  ('SMART', 'CAF CAE Membership Smart', 39, 12, 1, 10, 1, true),
  ('MAMMA', 'CAF CAE Membership Mamma & Bebè', 89, 12, 5, 10, 5, true),
  ('GOLD', 'CAF CAE Membership Gold', 129, 12, 3, 15, 1, true),
  ('PLATINUM', 'CAF CAE Membership Platinum', 199, 12, 5, 20, 5, true)
on conflict (code) do update set
  name = excluded.name,
  price = excluded.price,
  duration_months = excluded.duration_months,
  practice_credits = excluded.practice_credits,
  discount_percent = excluded.discount_percent,
  max_family_members = excluded.max_family_members,
  active = true,
  updated_at = now();

insert into branches(branch_code, branch_name, city)
values ('ONLINE', 'CAF CAE Online', 'Online')
on conflict (branch_code) do update set branch_name = excluded.branch_name, city = excluded.city, active = true, updated_at = now();

insert into membership_plan_services(plan_id, service_code, service_name, included_eligible, discount_eligible)
select p.id, s.service_code, s.service_name, true, true
from membership_plans p
cross join (values
  ('ISEE', 'ISEE'),
  ('730', 'Modello 730'),
  ('ASSEGNO_UNICO', 'Assegno Unico'),
  ('BONUS_NIDO', 'Bonus Asilo Nido'),
  ('BONUS_NUOVI_NATI', 'Bonus Nuovi Nati'),
  ('CARTA_ACQUISTI', 'Carta Acquisti')
) as s(service_code, service_name)
where p.code = 'MAMMA'
on conflict (plan_id, service_code) do update set service_name = excluded.service_name, active = true, updated_at = now();

alter table membership_plans enable row level security;
alter table membership_plan_services enable row level security;
alter table branches enable row level security;
alter table customer_memberships enable row level security;
alter table membership_family_members enable row level security;
alter table membership_usage enable row level security;
alter table membership_audit_logs enable row level security;
alter table membership_receipts enable row level security;
alter table shopify_webhook_receipts enable row level security;

drop policy if exists membership_plans_public_read on membership_plans;
create policy membership_plans_public_read on membership_plans for select using (active = true);

drop policy if exists membership_plan_services_public_read on membership_plan_services;
create policy membership_plan_services_public_read on membership_plan_services for select using (active = true);
