-- CAF CAE ERP v20 - Workflow Engine
-- Run this in Supabase SQL editor BEFORE deploying v20 backend/frontend.

alter table if exists pratiche
  add column if not exists current_owner text default 'bangla',
  add column if not exists workflow_status text default 'Nuova',
  add column if not exists progress numeric default 15,
  add column if not exists watchers jsonb default '[]'::jsonb,
  add column if not exists previous_owners jsonb default '[]'::jsonb;

update pratiche
set current_owner = coalesce(current_owner, assigned_team, route_team, 'bangla'),
    workflow_status = coalesce(workflow_status, status, 'Nuova'),
    progress = coalesce(progress, case when status ilike '%complet%' then 100 when status ilike '%verifica%' then 60 else 15 end),
    watchers = case
      when watchers is null or jsonb_typeof(watchers) <> 'array' then jsonb_build_array('admin', coalesce(assigned_team, route_team, 'bangla'))
      else watchers
    end,
    previous_owners = case
      when previous_owners is null or jsonb_typeof(previous_owners) <> 'array' then '[]'::jsonb
      else previous_owners
    end;

create table if not exists practice_history (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid references pratiche(id) on delete cascade,
  pratica_code text,
  event_type text default 'activity',
  action text not null,
  from_owner text,
  to_owner text,
  status text,
  workflow_status text,
  progress numeric default 0,
  actor_role text,
  actor_email text,
  actor_name text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists practice_watchers (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid references pratiche(id) on delete cascade,
  pratica_code text,
  role text not null,
  user_email text,
  can_edit boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(pratica_id, role, user_email)
);

create table if not exists practice_notifications (
  id uuid primary key default gen_random_uuid(),
  target_role text,
  target_email text,
  pratica_id uuid references pratiche(id) on delete cascade,
  pratica_code text,
  title text not null,
  message text,
  is_read boolean default false,
  actor_email text,
  actor_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists practice_messages (
  id uuid primary key default gen_random_uuid(),
  pratica_id uuid references pratiche(id) on delete cascade,
  pratica_code text,
  message text not null,
  actor_role text,
  actor_email text,
  actor_name text,
  visibility text default 'internal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pratiche_current_owner on pratiche(current_owner);
create index if not exists idx_pratiche_workflow_status on pratiche(workflow_status);
create index if not exists idx_practice_history_pratica on practice_history(pratica_id, created_at desc);
create index if not exists idx_practice_notifications_role on practice_notifications(target_role, is_read, created_at desc);
create index if not exists idx_practice_watchers_role on practice_watchers(role, pratica_id);
create index if not exists idx_practice_messages_pratica on practice_messages(pratica_id, created_at desc);
