import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASE2HA_MIGRATION } from './reconciliation';

export function loadPhase2HaMigrationSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(here, '../../../../supabase/migrations', PHASE2HA_MIGRATION), 'utf8');
}

export function reviewPhase2HaReconciliation(sql = loadPhase2HaMigrationSql()) {
  const findings: string[] = [];
  if (/drop table\s+public\.organizations/i.test(sql)) findings.push('Must not drop hosted organizations.');
  if (/alter table\s+public\.organizations\s+rename/i.test(sql)) findings.push('Must not rename hosted organizations.');
  if (/drop table\s+if exists\s+public\.organizations/i.test(sql)) findings.push('Must not drop hosted organizations.');
  if (/grant\s+\w+.*\s+to\s+anon/i.test(sql)) findings.push('anon grants are forbidden.');
  const uncommented = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  if (/using\s*\(\s*true\s*\)/i.test(uncommented)) findings.push('USING (true) is forbidden.');
  if (/with check\s*\(\s*true\s*\)/i.test(uncommented)) findings.push('WITH CHECK (true) is forbidden.');
  if (/service_role/i.test(uncommented)) findings.push('service_role must not appear.');
  if (!/create table public\.xiv_organizations/i.test(sql)) findings.push('xiv_organizations missing.');
  if (!/create table public\.xiv_universes/i.test(sql)) findings.push('xiv_universes missing.');
  if (!/force row level security/i.test(sql)) findings.push('FORCE RLS missing.');
  if (!/set search_path = pg_catalog, public/i.test(sql)) findings.push('SECURITY DEFINER search_path must include pg_catalog.');
  if (/set search_path = public\s*$/m.test(sql.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n'))) {
    findings.push('Unhardened search_path = public is forbidden.');
  }
  if (!/user_id <> auth\.uid\(\)/i.test(sql)) findings.push('Self-promotion guard missing.');
  if (!/revoke all on table public\.xiv_organizations from public, anon/i.test(sql)) {
    findings.push('xiv_organizations anon revoke missing.');
  }
  if (/create table public\.organizations\s*\(/i.test(sql)) {
    findings.push('Reconciliation must not create public.organizations.');
  }
  if (!/alter table public\.xiv_organizations\s+public\.organizations/i.test(sql) && /alter table\s+public\.organizations\b/i.test(uncommented)) {
    findings.push('Must not ALTER hosted organizations.');
  }
  if (!/role_version/i.test(sql)) findings.push('role_version missing.');
  if (!/xiv_organizations_slug_unique/i.test(sql)) findings.push('organization slug uniqueness missing.');
  if (!/references public\.xiv_organizations \(id\) on delete restrict/i.test(sql)) {
    findings.push('Universe → xiv_organizations FK ON DELETE RESTRICT missing.');
  }
  if (!/xiv_organization_memberships_user_org_unique/i.test(sql)) findings.push('org membership uniqueness missing.');
  if (!/create index xiv_organizations_status_idx/i.test(sql)) findings.push('organization status index missing.');
  if ((sql.match(/enable row level security/gi) ?? []).length < 4) findings.push('RLS enablement incomplete.');
  if ((sql.match(/force row level security/gi) ?? []).length < 4) findings.push('FORCE RLS incomplete.');
  if (!/revoke all on function public\.xiv_create_organization/i.test(sql)) {
    findings.push('PUBLIC execute not revoked for bootstrap.');
  }
  if (/xiv_has_org_role\(p_organization_id, array\['owner', 'admin', 'executive'\]\)/i.test(sql)) {
    findings.push('xiv_create_universe must not allow executive.');
  }
  if (!/xiv_internal\.xiv_has_org_role\(p_organization_id, array\['owner', 'admin'\]\)/i.test(sql)) {
    findings.push('xiv_create_universe must require owner or admin via xiv_internal.');
  }
  if (!/create schema if not exists xiv_internal/i.test(sql)) findings.push('xiv_internal schema missing.');
  if (/create or replace function public\.xiv_is_org_member\b/i.test(sql)) {
    findings.push('xiv_is_org_member must not be a public RPC.');
  }
  if (/create or replace function public\.xiv_has_org_role\b/i.test(sql)) {
    findings.push('xiv_has_org_role must not be a public RPC.');
  }
  if (/create or replace function public\.xiv_can_view_universe\b/i.test(sql)) {
    findings.push('xiv_can_view_universe must not be a public RPC.');
  }
  if (/grant execute on function public\.xiv_is_org_member\b/i.test(sql)) {
    findings.push('xiv_is_org_member must not grant public EXECUTE.');
  }
  if (/grant execute on function public\.xiv_user_is_org_member/i.test(sql)) {
    findings.push('xiv_user_is_org_member must not be a public RPC.');
  }
  if (/grant execute on function public\.xiv_universe_org_id/i.test(sql)) {
    findings.push('xiv_universe_org_id must not be a public RPC.');
  }
  if (/grant execute on function public\.xiv_universe_belongs_to_org/i.test(sql)) {
    findings.push('xiv_universe_belongs_to_org must not be a public RPC.');
  }
  if (!/role_version := old\.role_version \+ 1/i.test(sql)) findings.push('role_version increment trigger missing.');
  if (!/cannot remove final active owner/i.test(sql)) findings.push('Final owner protection missing.');
  if (!/for update/i.test(sql)) findings.push('Final-owner serialization (FOR UPDATE) missing.');
  if (!/one PostgreSQL transaction/i.test(sql)) findings.push('Apply-time atomicity contract missing.');
  if (!/Do NOT add xiv_internal to db-schemas/i.test(sql)) {
    findings.push('PostgREST non-exposure contract for xiv_internal missing.');
  }
  if (!/organization membership relationship is immutable/i.test(sql)) {
    findings.push('Immutable organization membership guard missing.');
  }
  if (!/Universe organization_id cannot be retargeted/i.test(sql)) {
    findings.push('Universe organization_id immutability missing.');
  }
  if (!/intentionally one-time and atomic/i.test(sql)) findings.push('Rerun class A statement missing.');
  return {
    ok: findings.length === 0,
    findings,
    renamesHostedTable: /alter table\s+public\.organizations\s+rename/i.test(uncommented),
    dropsHostedTable: /drop table\s+(if exists\s+)?public\.organizations/i.test(uncommented),
    grantsAnon: /grant\s+\w+.*\s+to\s+anon/i.test(uncommented),
  };
}
