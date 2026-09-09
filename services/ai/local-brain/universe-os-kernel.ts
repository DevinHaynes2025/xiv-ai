import { publishAgentMessage } from './agent-bus';
import { sendSecureAgentMessage } from './secure-agent-conversation';
import { LocalCheckpointStore } from './checkpoint-store';
import { cloudPeerSlots, routeToCloudPeer } from './cloud-peer-adapters';
import { sealCeoRecord, sealedVaultStats, SEALED_REDACTION } from './ceo-sealed-vault';
import { decisionGate } from './decision-gate';
import { planDemandAgents } from './demand-agent-planner';
import { registerDeviceNode, listDeviceNodes } from './device-node-runtime';
import { enterEmergencyIsolation, readIsolationMode, resumeFromEmergencyIsolation } from './emergency-isolation';
import { appendEvidenceEvent } from './evidence-ledger';
import { createFounderDigitalTwin } from './founder-digital-twin';
import { recallFounderMemories } from './founder-memory-vault';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { appendLearning } from './learning-ledger';
import { isAllowedLocalCommand } from './local-command-runner';
import { localModelStatus } from './local-model';
import { evaluateOfflineTask } from './offline-policy';
import { providerSlots } from './provider-fabric';
import { ensureLogicalUniverse, listLogicalUniverses } from './logical-universe-graph';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { runDecisionCouncil } from './workcells';
import {
  cloudExtensionsRemainUnavailable,
  installCapabilityPackages,
  kernelProfile,
  scheduleHardwareAware,
  superviseServices,
  type KernelProfileKind,
} from './offline-service-fabric';
import {
  appendMemoryJournal,
  listConflicts,
  listJournal,
  listReplicationReceipts,
  replicateJournalToNode,
  resolveJournalConflict,
  routeLocalDatabase,
  upsertVectorRetrievalIndex,
} from './distributed-memory-replication';
import { restoreUniverse, snapshotUniverse } from './universe-snapshot-restore';
import {
  UNIVERSE_OS_KERNEL_CYCLE,
  UNIVERSE_OS_LOCKS,
  type EvidenceState,
  type KernelServiceName,
  type UniverseLifecycle,
} from './universe-os-types';

export { UNIVERSE_OS_KERNEL_CYCLE, UNIVERSE_OS_LOCKS };

export type UniverseKernelRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  lifecycle: UniverseLifecycle;
  profile: KernelProfileKind;
  cloudRequired: false;
  physicalAlternateUniverse: false;
  productionAuthorization: false;
  bootedAt?: string;
  updatedAt: string;
};

type KernelStore = {
  universes: UniverseKernelRecord[];
  jobs: Array<{
    id: string;
    tenantId: string;
    universeId: string;
    role: string;
    state: 'queued' | 'allocated' | 'denied';
    createdAt: string;
  }>;
};

function kernelPath(root: string) {
  return xivLocalPath(root, 'universe-os-kernel.json');
}

async function loadKernel(root: string): Promise<KernelStore> {
  const parsed = await readJsonFile<KernelStore>(kernelPath(root), { universes: [], jobs: [] });
  return {
    universes: Array.isArray(parsed.universes) ? parsed.universes : [],
    jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
  };
}

async function saveKernel(root: string, store: KernelStore) {
  await writeJsonFileAtomic(kernelPath(root), {
    universes: store.universes.slice(-1_000),
    jobs: store.jobs.slice(-2_000),
  });
}

export async function createUniverseLifecycle(input: {
  tenantId: string;
  universeId: string;
  profile?: KernelProfileKind;
  root?: string;
}): Promise<UniverseKernelRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  await ensureLogicalUniverse({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.universeId,
    root,
  });
  const store = await loadKernel(root);
  let record = store.universes.find(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) {
    record = {
      id: `ukern_${input.universeId}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      lifecycle: 'created',
      profile: input.profile ?? 'desktop',
      cloudRequired: false,
      physicalAlternateUniverse: false,
      productionAuthorization: false,
      updatedAt: new Date().toISOString(),
    };
    store.universes.push(record);
    await saveKernel(root, store);
  }
  return record;
}

export async function transitionUniverseLifecycle(input: {
  tenantId: string;
  universeId: string;
  lifecycle: UniverseLifecycle;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await loadKernel(root);
  const record = store.universes.find(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) throw new Error('UNIVERSE_KERNEL_NOT_FOUND');
  record.lifecycle = input.lifecycle;
  record.updatedAt = new Date().toISOString();
  await saveKernel(root, store);
  return record;
}

export async function registerKernelServices(input: {
  profile: KernelProfileKind;
  quarantine?: boolean;
  root?: string;
}): Promise<{ name: KernelServiceName; registered: true; state: string }[]> {
  const services = await superviseServices({
    profile: input.profile,
    quarantine: input.quarantine,
    root: input.root,
  });
  return services.map((service) => ({ name: service.name, registered: true as const, state: service.state }));
}

export async function allocateAgentJobs(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  approved: boolean;
  root?: string;
}) {
  const planned = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.storyId,
    requestedRoles: ['researcher', 'evidence_verifier', 'coder'],
    consequence: 'LOW',
    approved: input.approved,
  });
  const root = input.root ?? process.cwd();
  const store = await loadKernel(root);
  for (const agent of planned.agents) {
    const instance = 'instance' in agent ? agent.instance : 'id' in agent && 'role' in agent ? agent : null;
    if (!instance || !('id' in instance) || !('role' in instance)) continue;
    store.jobs.push({
      id: instance.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      role: instance.role,
      state: planned.status === 'PLANNED' ? 'allocated' : 'denied',
      createdAt: new Date().toISOString(),
    });
  }
  await saveKernel(root, store);
  return {
    status: planned.status,
    allocated: store.jobs.filter((job) => job.universeId === input.universeId && job.state === 'allocated').length,
    productionAuthorization: false as const,
    canCreateAgents: false as const,
    canExpandPermissions: false as const,
  };
}

export async function attachCeoPolicy(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  sealedPayload?: string;
  root?: string;
}) {
  const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
  let sealed = null;
  if (input.sealedPayload) {
    sealed = await sealCeoRecord({
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: `kernel-policy:${input.storyId}`,
      payload: input.sealedPayload,
      actor: ceo,
      root: input.root,
    });
  }
  const gate = decisionGate({
    id: `af-policy-${input.storyId}`,
    action: 'universe-os-cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const vault = await sealedVaultStats(input.root ?? process.cwd());
  return {
    gate,
    sealedAccepted: sealed?.accepted ?? false,
    sealedRedaction: sealed?.record?.sealedPayload ?? (input.sealedPayload ? SEALED_REDACTION : null),
    denyByDefault: vault.denyByDefault,
    autoReplicateSealed: UNIVERSE_OS_LOCKS.CEO_SEALED_AUTO_REPLICATE,
  };
}

export async function bootUniverseOs(input: {
  tenantId: string;
  universeId: string;
  profile?: KernelProfileKind;
  onlineCloud?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const profile = input.profile ?? 'desktop';
  const record = await createUniverseLifecycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    profile,
    root,
  });

  const isolation = await readIsolationMode(root);
  const offline = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: input.onlineCloud === true,
    needsExternalFreshness: false,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });

  const peers = cloudPeerSlots();
  const cloudNeeded = peers.some((slot) => slot.state === 'AVAILABLE');
  if (input.onlineCloud && !cloudNeeded) {
    // Boot continues locally; unconfigured cloud is not a prerequisite.
  }

  await installCapabilityPackages({ profile, root });
  const services = await registerKernelServices({ profile, quarantine: isolation.active, root });
  const hardware = await scheduleHardwareAware({ root });
  const laptop = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: 'laptop',
    root,
  });
  const mobile = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: profile === 'mobile_microkernel' ? 'android_class' : 'ios_class',
    root,
  });

  const booted = await transitionUniverseLifecycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    lifecycle: isolation.active ? 'safe_mode' : 'booted',
    root,
  });
  booted.bootedAt = new Date().toISOString();
  const store = await loadKernel(root);
  const saved = store.universes.find((item) => item.id === booted.id);
  if (saved) {
    saved.bootedAt = booted.bootedAt;
    saved.lifecycle = 'running';
    await saveKernel(root, store);
  }

  const model = await localModelStatus();
  return {
    record: { ...record, ...booted, lifecycle: 'running' as const, bootedAt: booted.bootedAt },
    profile: kernelProfile(profile),
    services,
    hardware,
    nodes: { laptop, mobile },
    offline,
    peers: cloudExtensionsRemainUnavailable(),
    localModel: model.availability,
    cloudRequired: false as const,
    bootedWithoutCloud: peers.every((slot) => slot.state === 'UNAVAILABLE') || !cloudNeeded,
    isolation: isolation.active,
    physicalAlternateUniverse: false as const,
    productionAuthorization: false as const,
  };
}

export async function enterKernelQuarantine(input: { reason: string; tenantId: string; universeId: string; root?: string }) {
  const root = input.root ?? process.cwd();
  const isolation = await enterEmergencyIsolation({ reason: input.reason, root });
  await transitionUniverseLifecycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    lifecycle: 'quarantined',
    root,
  });
  const services = await superviseServices({
    profile: 'desktop',
    quarantine: true,
    root,
  });
  const peerRoute = routeToCloudPeer({
    peer: 'aws',
    classification: 'internal',
    sealedRedacted: true,
    isolation: true,
  });
  return {
    isolation: isolation.mode,
    services,
    peerRoute,
    safeMode: true as const,
    autoResume: false as const,
  };
}

export async function resumeKernelFromSafeMode(input: {
  tenantId: string;
  universeId: string;
  explicit: boolean;
  root?: string;
}) {
  const resumed = await resumeFromEmergencyIsolation({ explicit: input.explicit, root: input.root });
  if (!resumed.resumed) return resumed;
  await transitionUniverseLifecycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    lifecycle: 'running',
    root: input.root,
  });
  await superviseServices({ profile: 'desktop', quarantine: false, root: input.root });
  return resumed;
}

export async function runUniverseOsCycle(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  intent: string;
  profile?: KernelProfileKind;
  sealedPayload?: string;
  replicateOrdinary?: boolean;
  conflict?: boolean;
  isolate?: boolean;
  snapshot?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.storyId || !input.intent.trim()) {
    throw new Error('UNIVERSE_OS_CYCLE_SCOPE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const hops = [...UNIVERSE_OS_KERNEL_CYCLE];
  const twin = createFounderDigitalTwin({
    founderId: 'founder-sim',
    tenantId: input.tenantId,
    universeId: input.universeId,
    displayName: 'Founder Digital Twin (not the real founder)',
  });

  const policy = await attachCeoPolicy({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    sealedPayload: input.sealedPayload,
    root,
  });

  const boot = await bootUniverseOs({
    tenantId: input.tenantId,
    universeId: input.universeId,
    profile: input.profile ?? 'desktop',
    root,
  });

  if (input.isolate) {
    await enterKernelQuarantine({
      reason: `cycle:${input.storyId}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
    });
  }

  const registry = await registerKernelServices({
    profile: input.profile ?? 'desktop',
    quarantine: input.isolate === true,
    root,
  });

  const jobs = await allocateAgentJobs({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    approved: true,
    root,
  });

  const packages = await installCapabilityPackages({ profile: input.profile ?? 'desktop', root });
  const hardware = boot.hardware;

  const ceoMemory = await recallFounderMemories({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.intent,
    root,
  });

  const router = await routeLocalDatabase({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: 'kernel_cycle',
    document: { storyId: input.storyId, intent: input.intent },
    actor: { kind: 'ordinary_agent', id: 'coder-1', role: 'coder' },
    root,
  });
  const cloudDb = await routeLocalDatabase({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: 'kernel_cycle',
    document: { storyId: input.storyId },
    actor: { kind: 'ordinary_agent', id: 'coder-1', role: 'coder' },
    preferCloud: true,
    root,
  });

  const workcell = await runDecisionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    action: input.intent,
    consequence: 'LOW',
    approved: true,
    root,
  });

  const model = await localModelStatus();
  const knowledge = await retrieveOfflineKnowledge(input.intent, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  const vectors = await upsertVectorRetrievalIndex({
    tenantId: input.tenantId,
    universeId: input.universeId,
    text: input.intent,
    root,
  });

  const ipc = await sendSecureAgentMessage({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromAgent: 'researcher',
    toAgent: 'evidence_verifier',
    body: input.sealedPayload ? input.sealedPayload : `kernel cycle ${input.storyId}`,
    containsSealed: Boolean(input.sealedPayload),
    root,
  });
  publishAgentMessage({
    fromRole: 'workflow_planner',
    toRole: 'evidence_verifier',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'status',
    body: `universe-os cycle ${input.storyId}`,
    evidenceRefs: [`story:${input.storyId}`],
    requiresHumanApproval: false,
  });

  const ordinary = await appendMemoryJournal({
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceNodeId: boot.nodes.laptop.id,
    key: `cycle:${input.storyId}`,
    payload: `ordinary memory for ${input.intent}`,
    classification: 'internal',
    root,
  });
  const sealedJournal = await appendMemoryJournal({
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceNodeId: boot.nodes.laptop.id,
    key: `sealed:${input.storyId}`,
    payload: input.sealedPayload ?? 'SEALED_FOUNDER_PRIORITY_TOKEN',
    classification: 'sealed_founder_priority',
    root,
  });

  let ordinaryReplication = null;
  let sealedReplication = null;
  if (ordinary.accepted) {
    ordinaryReplication = await replicateJournalToNode({
      tenantId: input.tenantId,
      universeId: input.universeId,
      fromNodeId: boot.nodes.laptop.id,
      toNodeId: boot.nodes.mobile.id,
      entryId: ordinary.entry.id,
      root,
    });
  }
  if (sealedJournal.accepted) {
    sealedReplication = await replicateJournalToNode({
      tenantId: input.tenantId,
      universeId: input.universeId,
      fromNodeId: boot.nodes.laptop.id,
      toNodeId: boot.nodes.mobile.id,
      entryId: sealedJournal.entry.id,
      root,
    });
  }

  let conflict = null;
  if (input.conflict && ordinary.accepted) {
    const other = await appendMemoryJournal({
      tenantId: input.tenantId,
      universeId: input.universeId,
      sourceNodeId: boot.nodes.mobile.id,
      key: `cycle:${input.storyId}`,
      payload: `conflicting memory for ${input.intent}`,
      classification: 'internal',
      root,
    });
    if (other.accepted) {
      conflict = await resolveJournalConflict({
        tenantId: input.tenantId,
        universeId: input.universeId,
        key: `cycle:${input.storyId}`,
        leftId: ordinary.entry.id,
        rightId: other.entry.id,
        root,
      });
    }
  }

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      storyId: input.storyId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `Universe OS kernel cycle ${input.storyId}`,
      payload: {
        hops,
        sealedReplication: sealedReplication?.state ?? null,
        ordinaryReplication: ordinaryReplication?.state ?? null,
        localModel: model.availability,
      },
    },
    root,
  );

  const store = new LocalCheckpointStore(xivLocalPath(root, 'brain-state.json'));
  await store.checkpoint({
    taskId: input.storyId,
    at: new Date().toISOString(),
    state: 'completed',
    attempt: 1,
    summary: `62L-AF cycle ${input.storyId}`,
    nextAction: '62L-AG',
    evidence: [evidence.id],
  });

  const learning = await appendLearning(
    {
      domain: 'operations',
      subject: `universe-os:${input.storyId}`,
      claimState: 'MODEL_INFERENCE',
      summary: `Kernel cycle completed. sealedReplication=${sealedReplication?.state ?? 'n/a'} bootCloudRequired=false`,
      sourceRefs: [evidence.id],
      evidence: [evidence.id],
      taskId: input.storyId,
    },
    root,
  );

  let snap = null;
  let restored = null;
  if (input.snapshot) {
    snap = await snapshotUniverse({
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'distributable',
      root,
    });
    restored = await restoreUniverse({
      snapshotId: snap.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
    });
  }

  const universes = await listLogicalUniverses({ tenantId: input.tenantId, root });
  const health = await buildUniverseOsHealthReport(root);

  return {
    hops,
    twin: { id: twin.id, twinIsRealFounder: false as const, authority: twin.authority },
    policy,
    boot: {
      cloudRequired: boot.cloudRequired,
      bootedWithoutCloud: boot.bootedWithoutCloud,
      localModel: boot.localModel,
      lifecycle: boot.record.lifecycle,
    },
    registry,
    jobs,
    packages: packages.map((item) => ({ id: item.id, state: item.state, cloudRequired: item.cloudRequired })),
    hardware,
    ceoMemoryCount: ceoMemory.length,
    router,
    cloudDb,
    workcell: {
      recommendation: workcell.recommendation,
      consensusForced: workcell.consensusForced,
      productionAuthorization: workcell.productionAuthorization,
    },
    knowledge: { state: knowledge.state, inventedFacts: knowledge.inventedFacts },
    vectors,
    ipc: { id: ipc.id, sealedRedacted: ipc.sealedRedacted, body: ipc.body },
    ordinaryReplication,
    sealedReplication,
    sealedJournal: sealedJournal.accepted ? { replicable: sealedJournal.entry.replicable, payload: sealedJournal.entry.payload } : null,
    conflict,
    snapshot: snap,
    restored,
    evidenceId: evidence.id,
    learningId: learning.id,
    universes: universes.map((item) => ({ id: item.id, physicalAlternateUniverse: item.physicalAlternateUniverse })),
    commandAllowlistIntact: isAllowedLocalCommand('git_status'),
    locks: UNIVERSE_OS_LOCKS,
    healthScore: health.offlineContinuity,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    next: '62L-AG — Persistent Offline Agent Society + Measured Feedback Improvement',
  };
}

export function scoreOfflineContinuity(components: Array<{ name: string; result: EvidenceState }>) {
  const counted = components.filter((item) => item.result === 'PASS' || item.result === 'FAIL');
  const passed = counted.filter((item) => item.result === 'PASS').length;
  const score = counted.length === 0 ? 0 : Math.round((passed / counted.length) * 100);
  return {
    score,
    passed,
    failed: counted.length - passed,
    unavailable: components.filter((item) => item.result === 'UNAVAILABLE').length,
    notTested: components.filter((item) => item.result === 'NOT_TESTED').length,
    waitingData: components.filter((item) => item.result === 'WAITING_DATA').length,
    inventedPass: false as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    components,
  };
}

export async function buildUniverseOsHealthReport(root = process.cwd()) {
  const [health, sealed, isolation, journal, receipts, conflicts, nodes] = await Promise.all([
    checkLocalBrainHealth(root),
    sealedVaultStats(root),
    readIsolationMode(root),
    listJournal({ tenantId: 'health', universeId: 'health', root }).catch(() => []),
    listReplicationReceipts({ root }),
    listConflicts({ tenantId: 'health', universeId: 'health', root }),
    listDeviceNodes({ tenantId: 'health', universeId: 'health', root }).catch(() => []),
  ]);
  void journal;
  void conflicts;
  void nodes;

  const sealedSkipped = receipts.filter((item) => item.state === 'skipped_sealed').length;
  const components: Array<{ name: string; result: EvidenceState }> = [
    { name: 'offline_boot_without_cloud', result: 'UNKNOWN' },
    { name: 'sealed_non_replication', result: sealedSkipped > 0 ? 'PASS' : 'UNKNOWN' },
    { name: 'conflict_resolution', result: 'UNKNOWN' },
    { name: 'quarantine_safe_mode', result: isolation.active ? 'PASS' : 'UNKNOWN' },
    { name: 'local_model', result: health.model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE' },
    { name: 'aws', result: 'UNAVAILABLE' },
    { name: 'azure', result: 'UNAVAILABLE' },
    { name: 'cisco', result: 'UNAVAILABLE' },
    { name: 'github_issue_43', result: 'UNAVAILABLE' },
    { name: 'windows_node_verification', result: 'NOT_TESTED' },
    { name: 'physical_mobile_devices', result: 'NOT_TESTED' },
    { name: '62L-AD_mesh_on_parent', result: 'WAITING_DATA' },
    { name: '62L-AC_workcells_on_parent', result: 'WAITING_DATA' },
  ];

  return {
    generatedAt: new Date().toISOString(),
    architecture: UNIVERSE_OS_KERNEL_CYCLE,
    localHealth: health,
    sealedVault: sealed,
    isolation,
    predecessors: {
      '62L-AE': 'PRESENT' as const,
      '62L-AD': 'WAITING_DATA' as const,
      '62L-AC': 'WAITING_DATA' as const,
      '62L-AB': 'PRESENT' as const,
      '62L-Y': 'WAITING_DATA' as const,
      '62L-X': 'PRESENT' as const,
      '62L-V': 'PRESENT' as const,
      '62L-U': 'PRESENT' as const,
    },
    githubIssue43: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    aws: 'UNAVAILABLE' as const,
    azure: 'UNAVAILABLE' as const,
    cisco: 'UNAVAILABLE' as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    cloudRuntimes: (['aws', 'azure', 'gcp'] as const).map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.configured ? runtime.state : 'UNAVAILABLE' };
    }),
    peers: cloudPeerSlots().map((slot) => ({ peer: slot.peer, state: slot.state })),
    offlineContinuity: scoreOfflineContinuity(components),
    locks: UNIVERSE_OS_LOCKS,
    founderTwinIsRealFounder: false as const,
    physicalUniverses: false as const,
    productionAuthorization: false as const,
    inventedPass: false as const,
    next: '62L-AG — Persistent Offline Agent Society + Measured Feedback Improvement',
  };
}
