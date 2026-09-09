import { PHASE2FA_MIGRATION_DO_NOT_APPLY, PHASE2HA_MIGRATION } from './reconciliation';

const PRIVILEGED_ENV_NAMES = [
  'DATABASE_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_SERVICE_ROLE_KEY',
  'POSTGRES_URL',
  'DIRECT_URL',
] as const;

export function privilegedApplyCredentialNamesPresent() {
  return PRIVILEGED_ENV_NAMES.filter((name) => Boolean(process.env[name] && String(process.env[name]).trim()));
}

export function hostedApplyGate() {
  const privilegedNames = privilegedApplyCredentialNamesPresent();
  const explicit = process.env.XIV_APPLY_XIV_TENANT_RECONCILIATION === '1';
  return {
    migration: PHASE2HA_MIGRATION,
    phase2fMigration: PHASE2FA_MIGRATION_DO_NOT_APPLY,
    phase2fMustNotApply: true,
    explicitApplyFlag: explicit,
    privilegedCredentialPresent: privilegedNames.length > 0,
    privilegedCredentialNames: privilegedNames,
    applied: false,
    postgrestReloaded: false,
    reason:
      !explicit || privilegedNames.length === 0
        ? 'Hosted apply is blocked. The publishable/anon key cannot apply DDL. Privileged database credentials and XIV_APPLY_XIV_TENANT_RECONCILIATION=1 are required. Phase 2F must not be applied.'
        : 'Apply flag is present, but this process does not auto-apply SQL. A human must run only the reconciliation file.',
  };
}

export function phase2fMustRemainUnapplied() {
  return {
    file: PHASE2FA_MIGRATION_DO_NOT_APPLY,
    applied: false,
    reason: 'Phase 2F would create public.organizations and collide with the hosted table.',
  };
}
