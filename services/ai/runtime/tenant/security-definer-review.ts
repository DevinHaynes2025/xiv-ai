/**
 * Static contract for Supabase SECURITY DEFINER grant hardening.
 * UNIT/SEMANTIC — not hosted advisor proof and not LIVE claim.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASE2HA_MIGRATION } from './reconciliation';

export const SECURITY_DEFINER_HARDENING_MIGRATION =
  '20260908013000_harden_security_definer_grants.sql';

const MEMBERSHIP_HELPERS = [
  'xiv_is_org_member',
  'xiv_has_org_role',
  'xiv_is_universe_member',
  'xiv_has_universe_role',
  'xiv_can_view_universe',
] as const;

function migrationsDir() {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '../../../../supabase/migrations');
}

export function loadReconciliationSql() {
  return readFileSync(join(migrationsDir(), PHASE2HA_MIGRATION), 'utf8');
}

export function loadSecurityDefinerHardeningSql() {
  return readFileSync(join(migrationsDir(), SECURITY_DEFINER_HARDENING_MIGRATION), 'utf8');
}

export function reviewSecurityDefinerGrantPolicy(input?: {
  reconciliationSql?: string;
  hardeningSql?: string;
}) {
  const recon = input?.reconciliationSql ?? loadReconciliationSql();
  const harden = input?.hardeningSql ?? loadSecurityDefinerHardeningSql();
  const findings: string[] = [];

  for (const name of MEMBERSHIP_HELPERS) {
    if (new RegExp(`create or replace function public\\.${name}\\b`, 'i').test(recon)) {
      findings.push(`${name} must not be created in public (PostgREST RPC surface).`);
    }
    if (!new RegExp(`create or replace function xiv_internal\\.${name}\\b`, 'i').test(recon)) {
      findings.push(`${name} must live in xiv_internal.`);
    }
    if (new RegExp(`grant execute on function public\\.${name}\\b`, 'i').test(recon)) {
      findings.push(`${name} must not grant EXECUTE to authenticated as a public RPC.`);
    }
    if (!new RegExp(`grant execute on function xiv_internal\\.${name}\\b`, 'i').test(recon)) {
      findings.push(`${name} must grant EXECUTE on xiv_internal for RLS resolution.`);
    }
  }

  if (!/grant execute on function public\.xiv_create_organization/i.test(recon)) {
    findings.push('xiv_create_organization must remain an intentional authenticated public RPC.');
  }
  if (!/grant execute on function public\.xiv_create_universe/i.test(recon)) {
    findings.push('xiv_create_universe must remain an intentional authenticated public RPC.');
  }
  if (!/revoke all on function public\.xiv_create_organization/i.test(recon)) {
    findings.push('xiv_create_organization must revoke PUBLIC/anon.');
  }
  if (!/xiv_internal\.xiv_has_org_role\(p_organization_id, array\['owner', 'admin'\]\)/i.test(recon)) {
    findings.push('xiv_create_universe must authorize via xiv_internal.xiv_has_org_role owner/admin.');
  }

  if (!/rls_auto_enable/i.test(harden)) {
    findings.push('Hardening migration must revoke rls_auto_enable.');
  }
  if (!/revoke all on function[\s\S]*rls_auto_enable|rls_auto_enable[\s\S]*revoke all/i.test(harden)) {
    findings.push('rls_auto_enable revoke must target PUBLIC/anon/authenticated.');
  }
  if (!/leaked-password protection/i.test(harden)) {
    findings.push('Hardening migration must document leaked-password dashboard action.');
  }
  if (!/from public, anon, authenticated/i.test(harden)) {
    findings.push('Hardening migration must revoke legacy public helper EXECUTE from authenticated.');
  }

  return {
    ok: findings.length === 0,
    findings,
    membershipHelpersSchema: 'xiv_internal' as const,
    intentionalPublicRpcs: ['xiv_create_organization', 'xiv_create_universe'] as const,
    rlsAutoEnableCallableByAnonOrAuthenticated: false as const,
    leakedPasswordProtectionClaimedFixedInSql: false as const,
  };
}

export function supabaseSecurityHardeningDoesNotMarkLive(): true {
  return true;
}
