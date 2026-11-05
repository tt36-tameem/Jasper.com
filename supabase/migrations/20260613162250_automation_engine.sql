-- Automation engine — Phase 1.
-- Durable workflow runs + a scheduled-jobs table that the /api/automation/tick
-- endpoint drains to resume delayed runs. Workflow definitions and lead context
-- are snapshotted into each run so a run can resume independently of the client.
--
-- These tables are written only by server routes using the service_role key
-- (which bypasses RLS). RLS is enabled with no anon/authenticated policies, so
-- the tables are not reachable through the public Data API.

-- ── Runs ────────────────────────────────────────────────────────────────────
create table if not exists public.automation_runs (
  id            uuid primary key default gen_random_uuid(),
  workflow_id   text not null,
  workflow_name text not null default '',
  nodes         jsonb not null,            -- snapshot of the workflow node tree
  context       jsonb not null default '{}'::jsonb,  -- merge data: name, email, company, booking_link, …
  status        text not null default 'running'
                  check (status in ('running','waiting','completed','failed')),
  cursor        jsonb not null default '[]'::jsonb,  -- serialized executor frame stack
  log           jsonb not null default '[]'::jsonb,  -- executed steps, newest last
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Scheduled jobs (the durable timer for delay nodes) ───────────────────────
create table if not exists public.automation_jobs (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid not null references public.automation_runs(id) on delete cascade,
  run_at     timestamptz not null,
  status     text not null default 'pending'
               check (status in ('pending','claimed','done')),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists automation_jobs_due_idx
  on public.automation_jobs (status, run_at);

create index if not exists automation_runs_status_idx
  on public.automation_runs (status, updated_at desc);

-- ── Lock down: server-only access via service_role ───────────────────────────
alter table public.automation_runs enable row level security;
alter table public.automation_jobs enable row level security;
-- No policies for anon/authenticated → tables are not exposed via the Data API.
-- service_role bypasses RLS, which is how the server routes read/write them.
