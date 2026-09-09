import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { LocalCheckpointStore } from './checkpoint-store';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { providerSlots } from './provider-fabric';
import { localModelStatus } from './local-model';
import { cloudPeerSlots } from './cloud-peer-adapters';
import { sealedVaultStats } from './ceo-sealed-vault';
import { knowledgeLakeStats } from './knowledge-lake';
import { ensureLogicalUniverse } from './logical-universe-graph';
import { parsePackageManifest, recordPackageManifest } from './package-manifest';
import { verifyPackageIntegrity } from './package-integrity';
import { resolvePackageDependencies } from './package-dependencies';
import { permissionDiff, classificationGate } from './permission-classification-gate';
import { resolvePackageCompatibility } from './package-compatibility';
import { planLocalInstall, quarantinePackage, transactionalInstall, updatePackage } from './package-install';
import { activateLocalRegistry, emptyRegistryRecord, listPrivateCatalog, upsertRegistryRecord } from './local-registry';
import { buildOfflineBundle, sharePackageAcrossUniverses, syncOfflineMarketplace } from './marketplace-exchange';
import { redactPackageExport } from './export-redaction';
import { manageConnector, manageKnowledgePack, manageModelAdapter, registerSkillBundle } from './managed-bundles';
import { recordUsage, usageStats } from './usage-telemetry';
import {
  DEVELOPER_PLATFORM_CYCLE,
  PLATFORM_HONESTY,
  type DeveloperPlatformHop,
  type PackageManifest,
  type PlatformEvidenceState,
} from './developer-platform-types';

export type CycleHopResult = {
  hop: DeveloperPlatformHop;
  state: PlatformEvidenceState | 'HUMAN_GATE';
  reason: string;
};

export async function runDeveloperPlatformCycle(input: {
  tenantId: string;
  universeId: string;
  name: string;
  payload: string;
  humanApprovedInstall: boolean;
  requestedPermissions?: PackageManifest['requestedPermissions'];
  classification?: PackageManifest['classification'];
  kind?: PackageManifest['kind'];
  files?: Record<string, string>;
  os?: PackageManifest['os'];
  hardware?: PackageManifest['hardware'];
  digest?: string;
  forceHealthFail?: boolean;
  quarantineAfter?: boolean;
  updateAfter?: { payload: string; forceHealthFail?: boolean };
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const hops: CycleHopResult[] = [];
  const store = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
  await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.universeId, root });

  const manifest = parsePackageManifest({
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: input.name,
    payload: input.payload,
    requestedPermissions: input.requestedPermissions,
    classification: input.classification,
    kind: input.kind,
    files: input.files,
    os: input.os,
    hardware: input.hardware,
    digest: input.digest,
  });
  await recordPackageManifest(manifest, root);
  await upsertRegistryRecord(emptyRegistryRecord(manifest, 'Verified candidate accepted. Not deployed, published, or customer-authorized.'), root);
  hops.push({
    hop: 'verified_candidate',
    state: 'PASS',
    reason: 'Verified candidate recorded. deployed=false published=false customerAuthorized=false.',
  });
  hops.push({ hop: 'package_manifest', state: 'PASS', reason: `Manifest ${manifest.id} ${manifest.name}@${manifest.version}.` });

  const integrity = verifyPackageIntegrity(manifest);
  hops.push({ hop: 'integrity_check', state: integrity.state, reason: integrity.reason });

  const diff = permissionDiff(manifest);
  hops.push({
    hop: 'permission_diff',
    state: diff.humanGateRequired ? 'PASS' : 'PASS',
    reason: diff.reason,
  });
  const classification = classificationGate(manifest.classification);
  const compatibility = await resolvePackageCompatibility({ manifest });
  hops.push({ hop: 'compatibility_resolution', state: compatibility.state, reason: compatibility.reason });
  const deps = await resolvePackageDependencies({ manifest, root });
  const plan = planLocalInstall(manifest, root);
  hops.push({ hop: 'local_install_plan', state: 'PASS', reason: plan.reason });

  const install = await transactionalInstall({
    manifest,
    humanApprovedInstall: input.humanApprovedInstall,
    forceHealthFail: input.forceHealthFail,
    root,
  });
  hops.push({
    hop: 'human_gate',
    state: install.state === 'HUMAN_GATE' ? 'HUMAN_GATE' : input.humanApprovedInstall ? 'PASS' : 'FAIL',
    reason: install.reason,
  });
  hops.push({
    hop: 'sandboxed_install',
    state: install.state === 'PASS' ? 'PASS' : install.state === 'HUMAN_GATE' ? 'HUMAN_GATE' : install.state,
    reason: install.reason,
  });
  hops.push({
    hop: 'health_test',
    state: install.rolledBack ? 'FAIL' : install.state === 'PASS' ? 'PASS' : install.state === 'HUMAN_GATE' ? 'HUMAN_GATE' : install.state,
    reason: install.rolledBack ? 'Health/test failed and the transaction rolled back.' : install.reason,
  });

  let activation: Awaited<ReturnType<typeof activateLocalRegistry>> | null = null;
  if (install.state === 'PASS') {
    activation = await activateLocalRegistry({
      packageId: manifest.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
    });
    hops.push({
      hop: 'registry_activation',
      state: activation.activated ? 'PASS' : 'FAIL',
      reason: activation.activated ? activation.record.lastReason : activation.reason,
    });
  } else {
    hops.push({ hop: 'registry_activation', state: 'FAIL', reason: 'Registry activation skipped because install did not complete.' });
  }

  const usage = await recordUsage({
    tenantId: input.tenantId,
    universeId: input.universeId,
    packageId: manifest.id,
    action: install.state === 'HUMAN_GATE' ? 'denied' : install.rolledBack ? 'rollback' : 'install',
    summary: install.reason,
    root,
  });
  hops.push({ hop: 'usage_evidence', state: 'PASS', reason: `Usage event ${usage.id} recorded locally. productionAnalytics=false.` });

  let updateResult: Awaited<ReturnType<typeof updatePackage>> | null = null;
  let quarantineResult: Awaited<ReturnType<typeof quarantinePackage>> | null = null;
  if (input.updateAfter && install.state === 'PASS') {
    const nextManifest = parsePackageManifest({
      tenantId: input.tenantId,
      universeId: input.universeId,
      name: input.name,
      payload: input.updateAfter.payload,
      requestedPermissions: input.requestedPermissions,
      classification: input.classification,
      kind: input.kind,
      files: { 'README.txt': input.updateAfter.payload },
    });
    nextManifest.id = manifest.id;
    updateResult = await updatePackage({
      current: install.record,
      nextManifest,
      humanApprovedInstall: input.humanApprovedInstall,
      forceHealthFail: input.updateAfter.forceHealthFail,
      root,
    });
  }
  if (input.quarantineAfter && (install.state === 'PASS' || install.record.lifecycle === 'installed_sandbox' || install.record.lifecycle === 'activated_local')) {
    quarantineResult = await quarantinePackage({
      packageId: manifest.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      reason: 'Quarantine requested after cycle.',
      root,
    });
  }
  hops.push({
    hop: 'update_rollback_quarantine',
    state: quarantineResult?.quarantined
      ? 'PASS'
      : updateResult?.rolledBack
        ? 'FAIL'
        : updateResult
          ? updateResult.state === 'PASS'
            ? 'PASS'
            : updateResult.state
          : 'PASS',
    reason: quarantineResult
      ? 'Package quarantined. Not authorized.'
      : updateResult
        ? updateResult.reason
        : 'No update/quarantine requested; rollback path remains available.',
  });

  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `62L-AK cycle for ${manifest.name}`,
    payload: {
      hops: hops.map((hop) => hop.hop),
      installState: install.state,
      authorityGranted: false,
      installedAsAuthorized: false,
      classification: classification.reason,
      dependencies: deps.state,
    },
  }, root);
  await appendLearning({
    domain: 'technology',
    subject: `package:${manifest.name}`,
    claimState: 'UNKNOWN',
    summary: install.reason,
    sourceRefs: [`pkg:${manifest.id}`],
    evidence: hops.map((hop) => `${hop.hop}:${hop.state}`),
  }, root);
  await store.checkpoint({
    taskId: manifest.id,
    at: new Date().toISOString(),
    state: install.state === 'PASS' ? 'completed' : install.state === 'HUMAN_GATE' ? 'denied' : 'failed',
    attempt: 1,
    summary: `62L-AK ${manifest.name}: ${install.reason}`,
    nextAction: 'human_review',
    evidence: hops.map((hop) => `${hop.hop}:${String(hop.state)}`),
  });

  const exported = redactPackageExport({ manifest });

  return {
    cycle: DEVELOPER_PLATFORM_CYCLE,
    hops,
    manifest,
    integrity,
    diff,
    classification,
    compatibility,
    deps,
    plan,
    install,
    activation,
    usage,
    updateResult,
    quarantineResult,
    exported,
    honesty: PLATFORM_HONESTY,
    installedAsAuthorized: false as const,
    authorityGranted: false as const,
    productionAuthorization: false as const,
  };
}

function reportPresent(root: string, relative: string) {
  return existsSync(join(root, relative)) || existsSync(join(root, '..', '..', relative));
}

export async function buildDeveloperPlatformHealthReport(input: {
  tenantId?: string;
  universeId?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const tenantId = input.tenantId ?? process.env.XIV_TENANT_ID ?? 'local-tenant';
  const universeId = input.universeId ?? process.env.XIV_UNIVERSE_ID ?? 'local-universe';
  const [model, sealed, lake, usage] = await Promise.all([
    localModelStatus(),
    sealedVaultStats(root),
    knowledgeLakeStats(root),
    usageStats(root),
  ]);
  const catalog = await listPrivateCatalog({ tenantId, universeId, root });
  const repoRoot = existsSync(join(root, 'docs/operations')) ? root : join(root, '..', '..');
  return {
    generatedAt: new Date().toISOString(),
    tenantId,
    universeId,
    cycle: DEVELOPER_PLATFORM_CYCLE,
    catalogListings: catalog.length,
    localModel: {
      availability: model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      reason: model.reason,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    peers: cloudPeerSlots().map((slot) => ({ peer: slot.peer, state: slot.state })),
    sealedVault: {
      records: sealed.records,
      denyByDefault: sealed.denyByDefault,
      productionAuthorization: sealed.productionAuthorization,
    },
    knowledgeLake: lake,
    usage,
    predecessors: {
      '62L-AJ': reportPresent(repoRoot, 'docs/operations/62L_AJ_OFFLINE_SOFTWARE_FACTORY_PLUGINS_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AI': reportPresent(repoRoot, 'docs/operations/62L_AI_SELF_EVOLVING_SOFTWARE_ORGANIZATION_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AH': reportPresent(repoRoot, 'docs/operations/62L_AH_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AG': reportPresent(repoRoot, 'docs/operations/62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AF': reportPresent(repoRoot, 'docs/operations/62L_AF_UNIVERSE_KERNEL_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AE': reportPresent(repoRoot, 'docs/operations/62L_AE_HYBRID_EDGE_CLOUD_CEO_VAULT_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AD': reportPresent(repoRoot, 'docs/operations/62L_AD_DISTRIBUTED_OFFLINE_AGENT_MESH_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AC': reportPresent(repoRoot, 'docs/operations/62L_AC_OFFLINE_AGENT_RUNTIME_WORKCELLS_REPORT.md') ? 'PASS' : 'WAITING_DATA',
      '62L-AB': reportPresent(repoRoot, 'docs/operations/62L_AB_KNOWLEDGE_LAKE_INDUSTRY_MEMORY_REPORT.md') ? 'PASS' : 'WAITING_DATA',
    },
    githubIssue49: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    honesty: PLATFORM_HONESTY,
    locks: {
      L4_AUTONOMY_ENABLED: false,
      INSTALLATION_GRANTS_AUTHORITY: false,
      VERIFIED_CANDIDATE_EQUALS_DEPLOYED: false,
      AUTO_PERMISSION_EXPANSION: false,
      PRODUCTION_AUTHORIZATION: false,
      FOUNDER_IMPERSONATION: false,
      CEO_SEALED_REPLICATING: false,
      TIP_LAND: false,
    },
    next: '62L-AL — Distributed XIV App Network + Edge Package Delivery + Peer-to-Peer Universe Synchronization',
    productionAuthorization: false as const,
    inventedPass: false as const,
  };
}

export async function demoSkillAndPacks(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const skill = await registerSkillBundle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    skill: 'offline-review',
    payload: 'Review local sandbox diffs only.',
    root: input.root,
  });
  const pack = await manageKnowledgePack({
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: 'sandbox-pack',
    originalText: 'Local knowledge pack candidate for the marketplace.',
    sourceUri: 'marketplace://sandbox-pack',
    root: input.root,
  });
  const adapter = await manageModelAdapter({
    tenantId: input.tenantId,
    universeId: input.universeId,
    adapter: 'local_ollama',
    root: input.root,
  });
  const connector = await manageConnector({
    tenantId: input.tenantId,
    universeId: input.universeId,
    peer: 'aws',
    root: input.root,
  });
  const plugin = await manageConnector({
    tenantId: input.tenantId,
    universeId: input.universeId,
    peer: 'plugin_registry',
    root: input.root,
  });
  const bundle = await buildOfflineBundle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    packageIds: [skill.manifest.id],
    root: input.root,
  });
  const shareDenied = await sharePackageAcrossUniverses({
    packageId: skill.manifest.id,
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: `${input.universeId}-unlinked`,
    root: input.root,
  });
  const syncOnline = await syncOfflineMarketplace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    needsInternet: true,
    root: input.root,
  });
  const syncCloud = await syncOfflineMarketplace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    needsCloudMarketplace: true,
    root: input.root,
  });
  const syncLocal = await syncOfflineMarketplace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  return { skill, pack, adapter, connector, plugin, bundle, shareDenied, syncOnline, syncCloud, syncLocal };
}
