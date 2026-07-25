-- CAF CAE v12 Secure Auth Migration
-- Run this AFTER the v11 schema. Replace every CHANGE_ME_* password before Run.
-- This removes plain-text password usage and prepares forgot/reset password.

create extension if not exists pgcrypto;

alter table public.dashboard_users
  add column if not exists password_hash text,
  add column if not exists locked_until timestamptz,
  add column if not exists failed_attempts integer default 0,
  add column if not exists last_login_at timestamptz;

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.dashboard_users(id) on delete cascade,
  email text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_hash on public.password_reset_tokens(token_hash);
create index if not exists idx_password_reset_tokens_user on public.password_reset_tokens(user_id, expires_at desc);

-- IMPORTANT: put private passwords here before running.
-- Do NOT use passwords you shared in chat.
update public.dashboard_users
set password_hash = crypt(case username
  when 'admin' then 'CHANGE_ME_ADMIN_PASSWORD'
  when 'agent' then 'CHANGE_ME_AGENT_PASSWORD'
  when 'commercialista' then 'CHANGE_ME_COMMERCIALISTA_PASSWORD'
  when 'bangla' then 'CHANGE_ME_BANGLA_PASSWORD'
  when 'italy' then 'CHANGE_ME_ITALY_PASSWORD'
  else 'CHANGE_ME_DEFAULT_PASSWORD'
end, gen_salt('bf', 12)),
password = null,
failed_attempts = 0,
locked_until = null,
updated_at = now()
where username in ('admin','agent','commercialista','bangla','italy');

-- Optional: create admin if missing. Replace password before running.
insert into public.dashboard_users (username,email,name,role,password_hash,password,office,active)
values ('admin','almoniexpress@gmail.com','Imran Mollah','admin',crypt('CHANGE_ME_ADMIN_PASSWORD', gen_salt('bf', 12)),null,'Admin CAF CAE',true)
on conflict (username) do update
set password_hash = excluded.password_hash,
    password = null,
    active = true,
    updated_at = now();

-- Remove old plaintext password from any user after migration.
update public.dashboard_users
set password = null,
updated_at = now()
where password is not null;

-- Check result. All must be HASH_READY and plain_password_removed=true.
select username, email, role,
  case when password_hash is null then 'MISSING_HASH' else 'HASH_READY' end as auth_status,
  (password is null) as plain_password_removed
from public.dashboard_users
order by role, username;
