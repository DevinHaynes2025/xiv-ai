import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sealCeoRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import {
  DEVELOPER_PLATFORM_CYCLE,
  PLATFORM_HONESTY,
} from './developer-platform-types';
import {
  buildDeveloperPlatformHealthReport,
  demoSkillAndPacks,
  runDeveloperPlatformCycle,
} from './developer-platform-runtime';
import { redactPackageExport, redactSealedPackageForRoute } from './export-redaction';
import { federateLogicalUniverses } from './logical-universe-graph';
import { listPrivateCatalog, packageDir } from './local-registry';
import { isAllowedLocalCommand } from './local-command-runner';
import { sharePackageAcrossUniverses } from './marketplace-exchange';
import { parsePackageManifest } from './package-manifest';
import { verifyPackageIntegrity } from './package-integrity';
import { installAuthorityGate, permissionDiff, refusePermissionExpansion } from './permission-classification-gate';
import { quarantinePackage } from './package-install';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lak-'));
const tenantId = '62lak-tenant';
const universeId = '62lak-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-AK30',
    DEVELOPER_PLATFORM_CYCLE.join(' → ') ===
      'verified_candidate → package_manifest → integrity_check → permission_diff → compatibility_resolution → local_install_plan → human_gate → sandboxed_install → health_test → registry_activation → usage_evidence → update_rollback_quarantine',
    'Developer platform cycle is recorded in order.',
  );
  check(
    'US-AK29',
    PLATFORM_HONESTY.l4AutonomyEnabled === false &&
      PLATFORM_HONESTY.founderImpersonation === false &&
      PLATFORM_HONESTY.installationGrantsAuthority === false &&
      PLATFORM_HONESTY.tipLand === false &&
      PLATFORM_HONESTY.ceoSealedReplicating === false &&
      PLATFORM_HONESTY.permissionExpansion === false &&
      PLATFORM_HONESTY.guardianRlsWeakened === false,
    'L4, founder impersonation, authority, tip-land, sealed-replication, and permission-expansion locks are false.',
  );

  const baseline = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'sandbox-notes',
    payload: 'offline notes app candidate',
    humanApprovedInstall: true,
    requestedPermissions: ['local_sandbox_read', 'local_sandbox_write'],
    classification: 'internal',
    kind: 'app',
    root,
  });
  check('US-AK1', Boolean(baseline.manifest.id) && baseline.manifest.name === 'sandbox-notes', 'Package manifest was recorded.');
  check(
    'US-AK20',
    baseline.manifest.verifiedCandidate === true &&
      baseline.manifest.deployed === false &&
      baseline.manifest.published === false &&
      baseline.manifest.customerAuthorized === false,
    'Verified candidate is not deployed, published, or customer-authorized.',
  );
  check('US-AK2', baseline.integrity.state === 'PASS', 'Integrity check passed for the matching digest.');
  check('US-AK3', baseline.deps.state === 'PASS' && baseline.deps.missing.length === 0, 'Dependency resolution succeeded with no missing deps.');
  check('US-AK4', baseline.diff.authorityGranted === false, 'Permission diff never grants authority.');
  check('US-AK5', baseline.classification.cloudRoutable === false, 'Classification gate keeps cloud routing closed.');
  check('US-AK6', baseline.compatibility.state === 'PASS' && baseline.compatibility.hostOs === 'linux', 'Linux host + CPU compatibility resolved.');
  check('US-AK7', baseline.install.state === 'PASS' && baseline.install.authorityGranted === false, 'Transactional sandboxed install completed without granting authority.');
  check('US-AK21', baseline.install.installedAsAuthorized === false, 'Install is not claimed as authorized.');
  check('US-AK22', existsSync(join(packageDir(root, baseline.manifest.id), 'README.txt')), 'Sandbox files were written under .xiv-local/packages.');
  check('US-AK23', baseline.hops.find((hop) => hop.hop === 'health_test')?.state === 'PASS', 'Post-install health/test hop ran.');
  check('US-AK24', baseline.activation?.activated === true && baseline.activation.record.authorityGranted === false, 'Local registry activation does not grant authority.');
  check('US-AK9', (await listPrivateCatalog({ tenantId, universeId, root })).some((item) => item.packageId === baseline.manifest.id), 'Local package registry / private catalog lists the candidate.');
  check(
    'US-AK10',
    (await listPrivateCatalog({ tenantId, universeId, root })).every((item) => item.published === false && item.customerAuthorized === false),
    'Private catalog is not a customer-authorized marketplace publish.',
  );
  check('US-AK18', baseline.usage.productionAnalytics === false && baseline.usage.containsSecrets === false, 'Usage telemetry is local evidence, not production analytics.');
  check(
    'US-AK30-hops',
    DEVELOPER_PLATFORM_CYCLE.every((hop) => baseline.hops.some((item) => item.hop === hop)),
    'Every platform hop executed.',
  );

  const tampered = parsePackageManifest({
    tenantId,
    universeId,
    name: 'tampered-app',
    payload: 'original-bytes',
    digest: 'not-a-real-digest',
  });
  const integrityFail = verifyPackageIntegrity(tampered);
  const integrityCycle = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'tampered-app',
    payload: 'original-bytes',
    digest: 'not-a-real-digest',
    humanApprovedInstall: true,
    root,
  });
  check('US-AK2-fail', integrityFail.state === 'FAIL' && integrityCycle.install.state === 'FAIL', 'Integrity mismatch fails closed and does not install.');
  check('US-AK2-fail-files', existsSync(packageDir(root, integrityCycle.manifest.id)) === false, 'Failed integrity check does not write sandbox files.');

  const gated = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'shell-broker',
    payload: 'requests shell',
    humanApprovedInstall: false,
    requestedPermissions: ['shell_access', 'external_networking', 'production_capabilities', 'restricted_data'],
    classification: 'restricted',
    root,
  });
  const diff = permissionDiff(gated.manifest);
  const gate = installAuthorityGate({ manifest: gated.manifest, humanApprovedInstall: false });
  check('US-AK4-diff', diff.humanGateRequired === true && diff.broader.includes('shell_access'), 'Permission diff flags shell/network/production/restricted as broader.');
  check('US-AK21-gate', gated.install.state === 'HUMAN_GATE' && gate.allowed === false && gate.authorityGranted === false, 'Broader permission requests stop at the human gate.');
  check('US-AK21-no-files', existsSync(packageDir(root, gated.manifest.id)) === false, 'Human-gate stop does not write sandbox files.');
  check(
    'US-AK21-expansion',
    refusePermissionExpansion({ humanApprovedPermissionExpansion: true }).expanded === false,
    'Even an explicit permission-expansion ask does not expand permissions.',
  );

  const sandboxOnly = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'shell-broker-sandbox',
    payload: 'requests shell but install-only',
    humanApprovedInstall: true,
    requestedPermissions: ['shell_access', 'production_capabilities'],
    classification: 'internal',
    root,
  });
  check(
    'US-AK21-sandbox-only',
    sandboxOnly.install.state === 'PASS' &&
      sandboxOnly.install.authorityGranted === false &&
      sandboxOnly.install.installedAsAuthorized === false &&
      sandboxOnly.install.record.grantedPermissions.includes('shell_access') === false &&
      isAllowedLocalCommand('shell_access' as never) === false,
    'Human-approved install of a broader-permission package stays sandbox-only and does not grant shell or production authority.',
  );

  const rollback = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'notes-v1',
    payload: 'version-one-body',
    humanApprovedInstall: true,
    updateAfter: { payload: 'version-two-body', forceHealthFail: true },
    root,
  });
  check('US-AK8', rollback.updateResult?.rolledBack === true && rollback.updateResult.state === 'FAIL', 'Failed update health/test rolled back the transaction.');
  check(
    'US-AK8-restore',
    rollback.updateResult?.record.lifecycle === 'rolled_back' && rollback.updateResult.authorityGranted === false,
    'Rollback does not leave a newer authorized install in place.',
  );
  check('US-AK25', Boolean(rollback.updateResult), 'Update flow ran through the transactional installer.');

  const sealedCycle = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'sealed-pack',
    payload: 'SEALED_MARKETPLACE_SECRET',
    humanApprovedInstall: true,
    classification: 'sealed_founder_priority',
    kind: 'knowledge_pack',
    root,
  });
  const exported = redactPackageExport({ manifest: sealedCycle.manifest });
  check(
    'US-AK13',
    exported.envelope.payload === SEALED_REDACTION &&
      exported.envelope.sealedPayload === SEALED_REDACTION &&
      exported.leakedSealed === false,
    'Sealed/restricted export redacts payload to [REDACTED_SEALED].',
  );
  check('US-AK28', exported.replicating === false && sealedCycle.classification.replicating === false, 'CEO-sealed packages are non-replicating.');
  const sealedShare = await sharePackageAcrossUniverses({
    packageId: sealedCycle.manifest.id,
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: `${universeId}-b`,
    root,
  });
  check('US-AK13-share', sealedShare.state === 'FAIL' && sealedShare.redacted === true, 'Sealed package share is denied and redacted.');

  const ceoSeal = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'marketplace-sealed',
    payload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    actor: { kind: 'ceo_principal', id: 'ceo-principal-sim' },
    root,
  });
  const routed = await redactSealedPackageForRoute({
    recordId: ceoSeal.record!.id,
    tenantId,
    universeId,
    destination: 'cloud',
    root,
  });
  check('US-AK13-vault', routed.redacted.sealedPayload === SEALED_REDACTION && routed.leaked === true, 'Export redaction reuses the CEO Sealed Vault routing redactor.');

  const quarantined = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'suspect-app',
    payload: 'quarantine me',
    humanApprovedInstall: true,
    quarantineAfter: true,
    root,
  });
  check('US-AK26', quarantined.quarantineResult?.quarantined === true && quarantined.quarantineResult.authorityGranted === false, 'Quarantine drops local activation and does not grant authority.');
  check(
    'US-AK26-catalog',
    (await listPrivateCatalog({ tenantId, universeId, root })).every((item) => item.packageId !== quarantined.manifest.id),
    'Quarantined packages are removed from the private catalog.',
  );
  const qShare = await sharePackageAcrossUniverses({
    packageId: quarantined.manifest.id,
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: `${universeId}-b`,
    root,
  });
  check('US-AK26-share', qShare.state === 'FAIL', 'Quarantined packages cannot be shared.');

  await federateLogicalUniverses({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: `${universeId}-peer`,
    root,
  });
  const shared = await sharePackageAcrossUniverses({
    packageId: baseline.manifest.id,
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: `${universeId}-peer`,
    root,
  });
  check('US-AK11', shared.state === 'PASS' && shared.replicating === false, 'Universe-to-Universe share registers a verified candidate replica after federation. Not auto-authorized.');

  const extras = await demoSkillAndPacks({ tenantId, universeId, root });
  check('US-AK14', extras.skill.grantsAgentAuthority === false, 'Agent skill bundles do not grant agent authority.');
  check('US-AK15', extras.pack.state === 'PASS' && extras.pack.object !== null, 'Knowledge-pack management wraps Knowledge Lake rather than duplicating Y packs.');
  check('US-AK16', extras.adapter.availability === 'UNAVAILABLE', 'Unconfigured local model adapter remains UNAVAILABLE.');
  check('US-AK17', extras.connector.availability === 'UNAVAILABLE' && extras.plugin.availability === 'WAITING_DATA', 'Unconfigured AWS connector is UNAVAILABLE; AJ plugin registry is WAITING_DATA.');
  check('US-AK12', extras.bundle.portable === true && extras.bundle.onlineRequired === false, 'Portable offline bundle was written without requiring the network.');
  check('US-AK19', extras.syncOnline.state === 'WAITING_DATA' && extras.syncCloud.state === 'UNAVAILABLE' && extras.syncLocal.state === 'PASS', 'Offline marketplace sync is WAITING_DATA/UNAVAILABLE unless local.');
  check('US-AK11-nofed', extras.shareDenied.state === 'FAIL', 'Share without federation is denied.');

  const nvidia = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'gpu-only',
    payload: 'needs nvidia',
    humanApprovedInstall: true,
    hardware: ['nvidia_gpu'],
    root,
  });
  check(
    'US-AK6-hw',
    nvidia.compatibility.state === 'UNAVAILABLE' || nvidia.install.state === 'UNAVAILABLE',
    'Unverified NVIDIA hardware stays UNAVAILABLE and does not invent compatibility PASS.',
  );

  const iosOnly = await runDeveloperPlatformCycle({
    tenantId,
    universeId,
    name: 'ios-only',
    payload: 'ios package',
    humanApprovedInstall: true,
    os: ['ios'],
    root,
  });
  check('US-AK6-os', iosOnly.compatibility.state === 'FAIL' && iosOnly.install.state === 'FAIL', 'iOS-only package is incompatible with this Linux host.');

  const health = await buildDeveloperPlatformHealthReport({ tenantId, universeId, root });
  check('US-AK27', health.providers.every((slot) => slot.state === 'UNAVAILABLE') && health.peers.every((slot) => slot.state === 'UNAVAILABLE'), 'Unconfigured providers/peers remain UNAVAILABLE.');
  check(
    'US-AK29-health',
    health.honesty.founderImpersonation === false &&
      health.locks.L4_AUTONOMY_ENABLED === false &&
      health.productionAuthorization === false &&
      health.inventedPass === false &&
      health.windowsNodeVerification === 'NOT_TESTED' &&
      health.githubIssue49 === 'UNAVAILABLE',
    'Health report does not invent PASS, Windows verification, or Issue #49 IDs.',
  );
  check('US-AK30-next', health.next.startsWith('62L-AL'), 'Health report names 62L-AL as next only.');
  check('US-AE-reuse', health.predecessors['62L-AE'] === 'PASS' || health.predecessors['62L-AE'] === 'WAITING_DATA', 'AE predecessor is recorded honestly.');

  const q = await quarantinePackage({
    packageId: 'missing',
    tenantId,
    universeId,
    reason: 'not found',
    root,
  });
  check('US-AK26-missing', q.quarantined === false, 'Quarantine of an unknown package does not invent success.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error('62L-AK safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AK safety tests PASS');
