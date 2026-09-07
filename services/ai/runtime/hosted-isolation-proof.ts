/**
 * Execute Phase 2H-C hosted two-user isolation proof, then record
 * human-verified hosted catalog evidence and evaluate activation.
 *
 * Run with: npx tsx runtime/hosted-isolation-proof.ts
 */
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluateTenantActivation } from './tenant/activation-gate';
import {
  PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG,
  hostedCatalogRecord,
  recordHumanVerifiedHostedCatalog,
} from './tenant/hosted-catalog-evidence';
import {
  hostedIsolationCredentialStatus,
  runHostedIsolationProof,
} from './tenant/hosted-isolation-harness';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');

loadEnv({ path: join(here, '../.env.hosted-isolation') });
loadEnv({ path: join(here, '../.env') });
loadEnv({ path: join(repoRoot, 'apps/mobile/.env.local') });

const creds = hostedIsolationCredentialStatus();
console.log('credential presence (names only):');
console.log(`  supabaseUrl=${creds.supabaseUrl}`);
console.log(`  publishableKey=${creds.publishableKey}`);
console.log(`  userAEmail=${creds.userAEmail}`);
console.log(`  userAPassword=${creds.userAPassword}`);
console.log(`  userBEmail=${creds.userBEmail}`);
console.log(`  userBPassword=${creds.userBPassword}`);
console.log(`  serviceRoleKeyPresent=${creds.serviceRoleKeyPresent}`);
console.log(`  privilegedDbNames=${creds.privilegedDbNames.join(',') || 'none'}`);

const result = await runHostedIsolationProof();

const catalog = recordHumanVerifiedHostedCatalog({
  observation: PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG,
  humanReportedAt: '2026-09-07T11:32:00.000Z',
});
const activation = evaluateTenantActivation();

console.log('');
console.log(`HOSTED TENANT ISOLATION: ${result.isolation}`);
console.log(
  activation.tenantPersistence === 'live' && result.isolation === 'PASS' && catalog.validated
    ? 'PHASE 2H-C ACTIVATION: PASS'
    : 'PHASE 2H-C ACTIVATION: BLOCKED',
);
console.log(`tenantPersistence = ${activation.tenantPersistence}`);
console.log(`businessModulesTenantReady = ${activation.businessModulesTenantReady}`);
console.log(`reason: ${activation.reason}`);
console.log('');
console.log('evidence kinds consumed:');
console.log(`  isolationEvidenceKind=${activation.isolationEvidenceKind}`);
console.log(`  catalogEvidenceKind=${activation.catalogEvidenceKind}`);
console.log(`  isolationValidated=${activation.isolationValidated}`);
console.log(`  catalogValidated=${catalog.validated}`);
console.log(`  isolationRecordedAt=${activation.isolationRecordedAt}`);
console.log(`  catalogRecordedAt=${catalog.recordedAt}`);
console.log(`  humanReportedAt=${catalog.humanReportedAt}`);
console.log('');
console.log('identities (non-secret UUIDs):');
console.log(`  userAId=${result.identities.userAId ?? 'null'}`);
console.log(`  userBId=${result.identities.userBId ?? 'null'}`);
console.log(`  orgAId=${result.identities.orgAId ?? 'null'}`);
console.log(`  orgBId=${result.identities.orgBId ?? 'null'}`);
console.log(`  universeAId=${result.identities.universeAId ?? 'null'}`);
console.log(`  universeBId=${result.identities.universeBId ?? 'null'}`);
console.log('');
console.log('role_version:');
console.log(`  before=${result.roleVersion.before}`);
console.log(`  after=${result.roleVersion.after}`);
console.log(`  incremented=${result.roleVersion.incremented}`);
console.log(`  staleContextDenied=${result.roleVersion.staleContextDenied}`);
console.log('');
console.log('assertion matrix:');
for (const row of result.assertions) {
  console.log(
    [
      row.result,
      row.testName,
      `actor=${row.actorUserId ?? 'n/a'}`,
      `org=${row.organizationId ?? 'n/a'}`,
      `universe=${row.universeId ?? 'n/a'}`,
      `op=${row.operation}`,
      `expected=${row.expected}`,
      `actual=${row.actual}`,
      row.timestamp,
    ].join(' | '),
  );
}

const tmpDir = join(repoRoot, 'tmp');
mkdirSync(tmpDir, { recursive: true });
const evidencePath = join(tmpDir, 'hosted-isolation-evidence.json');
writeFileSync(
  evidencePath,
  `${JSON.stringify(
    {
      isolation: result.isolation,
      activation: activation.tenantPersistence === 'live' ? 'PASS' : 'BLOCKED',
      tenantPersistence: activation.tenantPersistence,
      businessModulesTenantReady: activation.businessModulesTenantReady,
      reason: activation.reason,
      evidenceKinds: {
        isolationEvidenceKind: activation.isolationEvidenceKind,
        catalogEvidenceKind: activation.catalogEvidenceKind,
        isolationValidated: activation.isolationValidated,
        catalogValidated: catalog.validated,
        isolationRecordedAt: activation.isolationRecordedAt,
        catalogRecordedAt: catalog.recordedAt,
        humanReportedAt: catalog.humanReportedAt,
      },
      catalogFindings: catalog.findings,
      identities: result.identities,
      roleVersion: result.roleVersion,
      assertions: result.assertions,
      privilegedCredentialsUnused: result.privilegedCredentialsUnused,
      serviceRoleUnused: result.serviceRoleUnused,
      migrationFileUnchanged: result.migrationFileUnchanged,
      rlsUnchanged: result.rlsUnchanged,
    },
    null,
    2,
  )}\n`,
  'utf8',
);
console.log('');
console.log(`sanitized evidence written: ${evidencePath}`);
console.log('DO NOT COMMIT. DO NOT PUSH. DO NOT START 2I-A.');
