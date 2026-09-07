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
  if (/service_role/i.test(sql)) findings.push('service_role must not appear.');
  if (!/create table public\.xiv_organizations/i.test(sql)) findings.push('xiv_organizations missing.');
  if (!/create table public\.xiv_universes/i.test(sql)) findings.push('xiv_universes missing.');
  if (!/force row level security/i.test(sql)) findings.push('FORCE RLS missing.');
  if (!/set search_path = public/i.test(sql)) findings.push('SECURITY DEFINER search_path missing.');
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
  return {
    ok: findings.length === 0,
    findings,
    renamesHostedTable: /alter table\s+public\.organizations\s+rename/i.test(uncommented),
    dropsHostedTable: /drop table\s+(if exists\s+)?public\.organizations/i.test(uncommented),
    grantsAnon: /grant\s+\w+.*\s+to\s+anon/i.test(uncommented),
  };
}
