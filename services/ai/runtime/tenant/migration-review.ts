import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASE2FA_MIGRATION = '20260906220000_persistent_organizations_and_universes.sql';

export function loadPhase2FaMigrationSql() {
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(here, '../../../../supabase/migrations', PHASE2FA_MIGRATION), 'utf8');
}

const TENANT_POLICY = /create policy[\s\S]*?;/gi;

export function reviewPhase2FaMigration(sql = loadPhase2FaMigrationSql()) {
  const policies = sql.match(TENANT_POLICY) ?? [];
  const policyText = policies.join('\n');
  const findings: string[] = [];

  if (/using\s*\(\s*true\s*\)/i.test(policyText)) findings.push('USING (true) is forbidden on tenant tables.');
  if (/with check\s*\(\s*true\s*\)/i.test(policyText)) findings.push('WITH CHECK (true) is forbidden on tenant tables.');
  if (/grant\s+\w+.*\s+to\s+anon/i.test(sql)) findings.push('anon grants are forbidden.');
  if (/grant\s+all\s+on table public\.(organizations|universes)/i.test(sql)) {
    findings.push('Broad ALL grant on tenant tables.');
  }
  if (/service_role/i.test(sql)) findings.push('service_role must not appear in this migration.');
  if (/security definer/i.test(sql) && !/set search_path = public/i.test(sql)) {
    findings.push('SECURITY DEFINER without search_path.');
  }
  for (const name of [
    'xiv_is_org_member',
    'xiv_has_org_role',
    'xiv_is_universe_member',
    'xiv_has_universe_role',
    'xiv_create_organization',
    'xiv_create_universe',
  ]) {
    if (!sql.includes(`revoke all on function public.${name}`)) {
      findings.push(`PUBLIC execute not revoked for ${name}.`);
    }
  }
  if (!/enable row level security/i.test(sql)) findings.push('RLS enablement missing.');
  if (!/force row level security/i.test(sql)) findings.push('FORCE RLS missing.');
  if (!/references public\.organizations \(id\) on delete restrict/i.test(sql)) {
    findings.push('Universe → organization FK ON DELETE RESTRICT missing.');
  }
  if (!/organization_memberships_user_org_unique/i.test(sql)) {
    findings.push('organization membership uniqueness missing.');
  }
  if (!/universe_memberships_user_universe_unique/i.test(sql)) {
    findings.push('Universe membership uniqueness missing.');
  }
  if (!/user_id <> auth\.uid\(\)/i.test(sql)) findings.push('Self-promotion guard missing.');
  if (policies.length < 8) findings.push('Expected tenant policies are missing.');

  return {
    ok: findings.length === 0,
    findings,
    policyCount: policies.length,
    hasUsingTrue: /using\s*\(\s*true\s*\)/i.test(policyText),
    hasWithCheckTrue: /with check\s*\(\s*true\s*\)/i.test(policyText),
  };
}
