-- Phase 2I-LA-03 Mission Control schema (tenant-bound, RLS REQUIRED).
-- PROPOSE → TEST → TENANT ISOLATION → BACKUP/ROLLBACK → APPLY WHEN AUTHORIZED → VERIFY
-- This migration enables RLS-ready tables; no silent production apply assumed.

CREATE TABLE IF NOT EXISTS agent_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  department_id text NOT NULL,
  authority_ceiling text NOT NULL DEFAULT 'L2',
  budget_ceiling numeric NOT NULL DEFAULT 0,
  default_permissions text NOT NULL DEFAULT 'NONE',
  l4_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_shift_definitions (
  id text PRIMARY KEY,
  name text NOT NULL,
  department_id text NOT NULL,
  schedule text NOT NULL,
  authority_ceiling text NOT NULL DEFAULT 'L1',
  concurrency_limit int NOT NULL DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  continuous_autonomy boolean NOT NULL DEFAULT false,
  production_live boolean NOT NULL DEFAULT false,
  l4_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS agent_shift_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id text NOT NULL REFERENCES agent_shift_definitions(id),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  zone text NOT NULL,
  status text NOT NULL DEFAULT 'PLANNED',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  continuous_autonomy boolean NOT NULL DEFAULT false,
  production_live boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS agent_shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES agent_shift_instances(id),
  agent_directory_id text NOT NULL,
  role text NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  default_permissions text NOT NULL DEFAULT 'NONE'
);

CREATE TABLE IF NOT EXISTS agent_task_forces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  problem text NOT NULL,
  department_id text,
  lead_agent_directory_id text,
  status text NOT NULL DEFAULT 'FORMING',
  analysis_round text NOT NULL DEFAULT 'INDEPENDENT_ANALYSIS',
  lead_inherits_extra_permissions boolean NOT NULL DEFAULT false,
  production_live boolean NOT NULL DEFAULT false,
  l4_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS agent_task_force_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_force_id uuid NOT NULL REFERENCES agent_task_forces(id) ON DELETE CASCADE,
  agent_directory_id text NOT NULL,
  role text NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  default_permissions text NOT NULL DEFAULT 'NONE'
);

CREATE TABLE IF NOT EXISTS agent_mc_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  mission_id text NOT NULL,
  sender text NOT NULL,
  receiver text NOT NULL,
  message_type text NOT NULL,
  classification text NOT NULL,
  purpose text NOT NULL,
  trace_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  agenda text NOT NULL,
  stage text NOT NULL DEFAULT 'AGENDA',
  meeting_equals_authority boolean NOT NULL DEFAULT false,
  production_live boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS agent_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  agent_directory_id text NOT NULL,
  task_class text NOT NULL,
  success numeric NOT NULL DEFAULT 0,
  failure numeric NOT NULL DEFAULT 0,
  outcome_quality numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_shift_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_forces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_force_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_mc_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies (auth.uid() / JWT tenant claim patterns follow existing XIV RLS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_departments' AND policyname = 'agent_departments_tenant_isolation'
  ) THEN
    CREATE POLICY agent_departments_tenant_isolation ON agent_departments
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_shift_instances' AND policyname = 'agent_shift_instances_tenant_isolation'
  ) THEN
    CREATE POLICY agent_shift_instances_tenant_isolation ON agent_shift_instances
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_shift_assignments' AND policyname = 'agent_shift_assignments_tenant_isolation'
  ) THEN
    CREATE POLICY agent_shift_assignments_tenant_isolation ON agent_shift_assignments
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_task_forces' AND policyname = 'agent_task_forces_tenant_isolation'
  ) THEN
    CREATE POLICY agent_task_forces_tenant_isolation ON agent_task_forces
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_task_force_members' AND policyname = 'agent_task_force_members_tenant_isolation'
  ) THEN
    CREATE POLICY agent_task_force_members_tenant_isolation ON agent_task_force_members
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_mc_messages' AND policyname = 'agent_mc_messages_tenant_isolation'
  ) THEN
    CREATE POLICY agent_mc_messages_tenant_isolation ON agent_mc_messages
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_meetings' AND policyname = 'agent_meetings_tenant_isolation'
  ) THEN
    CREATE POLICY agent_meetings_tenant_isolation ON agent_meetings
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_performance' AND policyname = 'agent_performance_tenant_isolation'
  ) THEN
    CREATE POLICY agent_performance_tenant_isolation ON agent_performance
      FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
      WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
  END IF;
END $$;
