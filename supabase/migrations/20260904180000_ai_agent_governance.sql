-- XIV governed agent persistence (v0.1)
-- FOUNDER: run this entire file in the hosted Supabase SQL editor.
-- This workspace cannot apply it remotely. Until it is applied, PostgREST
-- returns PGRST205 for public.ai_agent_actions and the mobile client shows
-- that error honestly — it does not invent activity rows.
-- After this file succeeds, also run:
--   NOTIFY pgrst, 'reload schema';
-- Owner-only RLS. No anon policies. No public policies. No organization-wide access.
-- Re-runnable: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS, then recreate
-- owner policies using (auth.uid() = user_id). Grants stay authenticated-only.
-- organization_id is nullable on sessions/actions so a future org membership
-- table can join later. Do not invent org tables in this file.
-- Tables match services/ai/persistence.ts + apps/mobile/src/lib/agent-persistence.ts:
--   ai_agent_sessions, ai_agent_messages, ai_agent_actions,
--   ai_agent_approvals, ai_agent_audit_events

create extension if not exists pgcrypto;

create table if not exists public.ai_agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid null,
  agent_type text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null
);

create table if not exists public.ai_agent_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_agent_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint ai_agent_messages_role_check check (role in ('user', 'agent', 'system'))
);

create table if not exists public.ai_agent_actions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_agent_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid null,
  agent_type text not null,
  tool_id text not null,
  action_type text not null,
  description text not null,
  risk_level text not null,
  status text not null,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint ai_agent_actions_status_check check (
    status in (
      'proposed',
      'awaiting_approval',
      'approved',
      'rejected',
      'executing',
      'completed',
      'failed',
      'cancelled'
    )
  )
);

create table if not exists public.ai_agent_approvals (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.ai_agent_actions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  decision text not null,
  decision_note text null,
  created_at timestamptz not null default now(),
  constraint ai_agent_approvals_decision_check check (decision in ('approved', 'rejected'))
);

create table if not exists public.ai_agent_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid null references public.ai_agent_sessions (id) on delete set null,
  action_id uuid null references public.ai_agent_actions (id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_agent_sessions_user_id_idx
  on public.ai_agent_sessions (user_id, started_at desc);
create index if not exists ai_agent_messages_user_id_idx
  on public.ai_agent_messages (user_id, created_at desc);
create index if not exists ai_agent_messages_session_id_idx
  on public.ai_agent_messages (session_id, created_at);
create index if not exists ai_agent_actions_user_id_idx
  on public.ai_agent_actions (user_id, created_at desc);
create index if not exists ai_agent_actions_session_id_idx
  on public.ai_agent_actions (session_id, created_at desc);
create index if not exists ai_agent_approvals_user_id_idx
  on public.ai_agent_approvals (user_id, created_at desc);
create index if not exists ai_agent_approvals_action_id_idx
  on public.ai_agent_approvals (action_id);
create index if not exists ai_agent_audit_events_user_id_idx
  on public.ai_agent_audit_events (user_id, created_at desc);

alter table public.ai_agent_sessions enable row level security;
alter table public.ai_agent_messages enable row level security;
alter table public.ai_agent_actions enable row level security;
alter table public.ai_agent_approvals enable row level security;
alter table public.ai_agent_audit_events enable row level security;

alter table public.ai_agent_sessions force row level security;
alter table public.ai_agent_messages force row level security;
alter table public.ai_agent_actions force row level security;
alter table public.ai_agent_approvals force row level security;
alter table public.ai_agent_audit_events force row level security;

revoke all on table public.ai_agent_sessions from public, anon;
revoke all on table public.ai_agent_messages from public, anon;
revoke all on table public.ai_agent_actions from public, anon;
revoke all on table public.ai_agent_approvals from public, anon;
revoke all on table public.ai_agent_audit_events from public, anon;

grant select, insert, update on table public.ai_agent_sessions to authenticated;
grant select, insert on table public.ai_agent_messages to authenticated;
grant select, insert, update on table public.ai_agent_actions to authenticated;
grant select, insert on table public.ai_agent_approvals to authenticated;
grant select, insert on table public.ai_agent_audit_events to authenticated;

drop policy if exists ai_agent_sessions_select_own on public.ai_agent_sessions;
drop policy if exists ai_agent_sessions_insert_own on public.ai_agent_sessions;
drop policy if exists ai_agent_sessions_update_own on public.ai_agent_sessions;
drop policy if exists ai_agent_messages_select_own on public.ai_agent_messages;
drop policy if exists ai_agent_messages_insert_own on public.ai_agent_messages;
drop policy if exists ai_agent_actions_select_own on public.ai_agent_actions;
drop policy if exists ai_agent_actions_insert_own on public.ai_agent_actions;
drop policy if exists ai_agent_actions_update_own on public.ai_agent_actions;
drop policy if exists ai_agent_approvals_select_own on public.ai_agent_approvals;
drop policy if exists ai_agent_approvals_insert_own on public.ai_agent_approvals;
drop policy if exists ai_agent_audit_events_select_own on public.ai_agent_audit_events;
drop policy if exists ai_agent_audit_events_insert_own on public.ai_agent_audit_events;

create policy ai_agent_sessions_select_own
  on public.ai_agent_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy ai_agent_sessions_insert_own
  on public.ai_agent_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy ai_agent_sessions_update_own
  on public.ai_agent_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy ai_agent_messages_select_own
  on public.ai_agent_messages
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy ai_agent_messages_insert_own
  on public.ai_agent_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy ai_agent_actions_select_own
  on public.ai_agent_actions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy ai_agent_actions_insert_own
  on public.ai_agent_actions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy ai_agent_actions_update_own
  on public.ai_agent_actions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy ai_agent_approvals_select_own
  on public.ai_agent_approvals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy ai_agent_approvals_insert_own
  on public.ai_agent_approvals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy ai_agent_audit_events_select_own
  on public.ai_agent_audit_events
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy ai_agent_audit_events_insert_own
  on public.ai_agent_audit_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
