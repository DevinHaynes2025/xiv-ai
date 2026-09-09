import { LocalCheckpointStore } from './checkpoint-store';
import { deliverAgentSkill } from './agent-skill-delivery';
import { appendAppNetworkLog, bumpTelemetry } from './edge-package-cache';
import {
  authorizeAppNetworkNode,
  configureAppNetworkNode,
  getAppNetworkNode,
  markInstallOrSync,
  quarantineCompromisedNode,
  registerAppNetworkNode,
  setAppNetworkNodeOnline,
  verifyAppNetworkNode,
} from './compromised-node-quarantine';
import { scanXivLocalForToken } from './content-addressed-store';
import { relayFailureFallback, relaySlots, resetCloudRelays, routeToOptionalRelay, unconfiguredRelaysHonesty } from './cloud-relay-adapters';
import { resetCloudPeerAdapters } from './cloud-peer-adapters';
import { CEO_SEALED_VAULT_FILE, SEALED_REDACTION, sealCeoRecord, sealedVaultStats } from './ceo-sealed-vault';
import { xivLocalPath } from './durable-json';
import {
  DISTRIBUTED_APP_NETWORK_ARCHITECTURE,
  DISTRIBUTED_APP_NETWORK_LOCKS,
  type RelayId,
} from './distributed-app-network-types';
import { appendEvidenceEvent } from './evidence-ledger';
import { readIsolationMode } from './emergency-isolation';
import { checkLocalBrainHealth } from './health-check';
import { knowledgeLakeStats } from './knowledge-lake';
import { deliverKnowledgePack } from './knowledge-pack-delivery';
import { appendLearning } from './learning-ledger';
import { cloneLogicalUniverse, ensureLogicalUniverse, federateLogicalUniverses } from './logical-universe-graph';
import { evaluateOfflineTask } from './offline-policy';
import { profileLimits } from './bandwidth-resource-governor';
import { syncPeerUniverseRecord } from './peer-universe-sync';
import {
  activateVerifiedTransfer,
  getTransfer,
  resumeTransfer,
  startResumableTransfer,
} from './resumable-package-transfer';
import { setDeviceNodeOnline } from './device-node-runtime';
import { enqueueStoreAndForward, flushStoreAndForward } from './store-and-forward';
import { runDecisionCouncil } from './workcells';
import { cortexMemoryStats } from './memory-cortex';
import type { SealedActor } from './hybrid-edge-cloud-types';

export { DISTRIBUTED_APP_NETWORK_ARCHITECTURE, DISTRIBUTED_APP_NETWORK_LOCKS };

async function readyPeer(input: {
  tenantId: string;
  universeId: string;
  profile: 'mobile' | 'desktop';
  online?: boolean;
  root: string;
}) {
  const node = await registerAppNetworkNode(input);
  await configureAppNetworkNode({
    nodeId: node.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    note: `${input.profile} local profile`,
    root: input.root,
  });
  await authorizeAppNetworkNode({
    nodeId: node.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    explicit: true,
    root: input.root,
  });
  await verifyAppNetworkNode({
    nodeId: node.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    evidenceRef: `local:${input.profile}:sandbox`,
    root: input.root,
  });
  return (await getAppNetworkNode({ nodeId: node.id, tenantId: input.tenantId, universeId: input.universeId, root: input.root }))!;
}

export async function runDistributedAppNetworkCycle(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  intent: string;
  packageBytes?: string;
  sealedPayload?: string;
  isolatePeer?: boolean;
  tamperResume?: boolean;
  destinationOffline?: boolean;
  federateClone?: boolean;
  actor?: SealedActor;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.storyId || !input.intent.trim()) {
    throw new Error('APP_NETWORK_CYCLE_SCOPE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const hops = [...DISTRIBUTED_APP_NETWORK_ARCHITECTURE];
  resetCloudRelays();
  resetCloudPeerAdapters();

  const universe = await ensureLogicalUniverse({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.universeId,
    root,
  });

  const desktop = await readyPeer({ tenantId: input.tenantId, universeId: input.universeId, profile: 'desktop', root });
  const mobile = await readyPeer({
    tenantId: input.tenantId,
    universeId: input.universeId,
    profile: 'mobile',
    online: input.destinationOffline ? false : true,
    root,
  });

  const ceo: SealedActor = input.actor ?? { kind: 'ceo_principal', id: 'ceo-principal-sim' };
  let sealed = null;
  if (input.sealedPayload) {
    sealed = await sealCeoRecord({
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: `intent:${input.storyId}`,
      payload: input.sealedPayload,
      actor: ceo,
      root,
    });
  }

  const offline = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: false,
    needsExternalFreshness: false,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: input.sealedPayload ? 'restricted' : 'internal',
  });

  const workcell = await runDecisionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    action: input.intent,
    consequence: 'LOW',
    approved: true,
    root,
  });

  const sealedAttempt = await startResumableTransfer({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    kind: 'app_package',
    bytes: input.sealedPayload ?? 'not-used',
    classification: 'sealed_founder_priority',
    sealed: true,
    root,
  });

  const packageBytes = input.packageBytes ?? `package:${input.storyId}:${input.intent}`.repeat(4);
  const transfer = await startResumableTransfer({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    kind: 'app_package',
    bytes: packageBytes,
    classification: 'internal',
    destinationOnline: !input.destinationOffline,
    chunkChars: 8,
    root,
  });

  const forwarded = await enqueueStoreAndForward({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.deviceNodeId,
    toNodeId: mobile.deviceNodeId,
    envelope: {
      id: transfer.accepted ? transfer.envelope.id : 'none',
      body: transfer.accepted ? transfer.envelope.bodyPreview : SEALED_REDACTION,
    },
    root,
  });

  let resumed = null;
  let activated = null;
  if (transfer.accepted && (transfer.transfer.state === 'held_offline' || input.destinationOffline)) {
    await setAppNetworkNodeOnline({
      nodeId: mobile.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      online: true,
      root,
    });
    await setDeviceNodeOnline({
      nodeId: mobile.deviceNodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      online: true,
      root,
    });
  }
  if (transfer.accepted) {
    const first = await resumeTransfer({
      transferId: transfer.transfer.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      maxChunks: 1,
      root,
    });
    resumed = await resumeTransfer({
      transferId: transfer.transfer.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      tamperBytes: input.tamperResume ? `${packageBytes}::tampered` : undefined,
      root,
    });
    if (first.ok && resumed.ok) {
      resumed = { ...resumed, transfer: resumed.transfer, received: (first.received ?? 0) + (resumed.received ?? 0) };
    }
  }
  if (transfer.accepted && resumed?.ok && resumed.transfer.integrity === 'PASS') {
    activated = await activateVerifiedTransfer({
      transferId: transfer.transfer.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
    });
  }

  const flushed = await flushStoreAndForward({
    tenantId: input.tenantId,
    universeId: input.universeId,
    toNodeId: mobile.deviceNodeId,
    root,
  });

  const skill = await deliverAgentSkill({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    skillName: `skill-${input.storyId}`,
    source: 'local-only skill source; no cloud required',
    root,
  });
  const sealedSkill = await deliverAgentSkill({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    skillName: 'sealed-skill',
    source: input.sealedPayload ?? 'n/a',
    sealed: true,
    root,
  });

  const knowledge = await deliverKnowledgePack({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    title: input.storyId,
    body: `Knowledge pack for ${input.intent}`,
    root,
  });
  const sealedPack = await deliverKnowledgePack({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    title: 'sealed',
    body: input.sealedPayload ?? 'n/a',
    sealed: true,
    root,
  });

  const duplicate = await startResumableTransfer({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: desktop.id,
    toNodeId: mobile.id,
    kind: 'app_package',
    bytes: packageBytes,
    classification: 'internal',
    root,
  });

  let clone = null;
  if (input.federateClone) {
    clone = await cloneLogicalUniverse({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      label: `${input.universeId}-peer`,
      root,
    });
    await federateLogicalUniverses({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toUniverseId: clone.id,
      root,
    });
  }

  const syncA = transfer.accepted
    ? await syncPeerUniverseRecord({
        tenantId: input.tenantId,
        fromUniverseId: input.universeId,
        toUniverseId: clone?.id ?? input.universeId,
        address: transfer.transfer.address,
        kind: 'app_package',
        version: 1,
        nodeId: desktop.id,
        root,
      })
    : null;
  const syncConflict = transfer.accepted
    ? await syncPeerUniverseRecord({
        tenantId: input.tenantId,
        fromUniverseId: input.universeId,
        toUniverseId: clone?.id ?? input.universeId,
        address: transfer.transfer.address,
        kind: 'app_package',
        version: 2,
        nodeId: desktop.id,
        root,
      })
    : null;
  const sealedSync = await syncPeerUniverseRecord({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: clone?.id ?? input.universeId,
    address: 'sealed-not-an-address',
    kind: 'app_package',
    version: 1,
    sealed: true,
    root,
  });

  const relays = (['aws', 'azure', 'gcp', 'cisco'] as const).map((relay: RelayId) => ({
    relay,
    route: routeToOptionalRelay({
      relay,
      classification: 'internal',
      sealedRedacted: true,
      isolation: false,
    }),
    sealedDenied: routeToOptionalRelay({
      relay,
      classification: 'sealed_founder_priority',
      sealedRedacted: true,
      isolation: false,
    }),
    fallback: relayFailureFallback(relay),
  }));

  let quarantine = null;
  if (input.isolatePeer) {
    quarantine = await quarantineCompromisedNode({
      nodeId: mobile.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      reason: 'simulated compromise for 62L-AL tests',
      isolate: true,
      root,
    });
  }
  const postQuarantine = input.isolatePeer
    ? await startResumableTransfer({
        tenantId: input.tenantId,
        universeId: input.universeId,
        fromNodeId: desktop.id,
        toNodeId: mobile.id,
        kind: 'app_package',
        bytes: `after-quarantine:${input.storyId}`,
        classification: 'internal',
        root,
      })
    : null;

  await appendAppNetworkLog({
    root,
    event: 'cycle',
    detail: `story:${input.storyId}`,
    nodeId: desktop.id,
  });
  await bumpTelemetry({ root, counter: 'cycles', note: `story:${input.storyId}` });
  if (input.sealedPayload) {
    await appendAppNetworkLog({
      root,
      event: 'sealed_attempt',
      detail: `blocked:${input.sealedPayload}`,
      nodeId: desktop.id,
    });
    await bumpTelemetry({ root, counter: 'sealed_blocked', note: `blocked:${input.sealedPayload}` });
  }

  const leakScan = input.sealedPayload
    ? await scanXivLocalForToken({ root, token: input.sealedPayload, allowFiles: [CEO_SEALED_VAULT_FILE] })
    : { scanned: 0, leaks: [], leaked: false as const };

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      storyId: input.storyId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `Distributed app network cycle ${input.storyId}`,
      payload: {
        hops,
        transferState: transfer.accepted ? transfer.transfer.state : 'denied',
        leakScan: leakScan.leaked ? 'FAIL' : 'PASS',
        relays: relays.map((item) => ({ relay: item.relay, state: item.route.state })),
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
    summary: `62L-AL cycle ${input.storyId}`,
    nextAction: '62L-AM',
    evidence: [evidence.id],
  });

  const learning = await appendLearning(
    {
      domain: 'operations',
      subject: `app-network:${input.storyId}`,
      claimState: 'MODEL_INFERENCE',
      summary: `Local app-network cycle completed. leaks=${leakScan.leaked} cloudRequired=false`,
      sourceRefs: [evidence.id],
      evidence: [evidence.id],
      taskId: input.storyId,
    },
    root,
  );

  const installLock = await markInstallOrSync({
    nodeId: desktop.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'install',
    root,
  });

  return {
    hops,
    universe,
    nodes: { desktop, mobile },
    profiles: { desktop: profileLimits('desktop'), mobile: profileLimits('mobile') },
    sealedAccepted: sealed?.accepted ?? false,
    sealedAttemptDenied: sealedAttempt.accepted === false,
    sealedSkillDenied: sealedSkill.delivered === false,
    sealedPackDenied: sealedPack.delivered === false,
    sealedSyncDenied: sealedSync.synced === false,
    transfer: transfer.accepted
      ? (await getTransfer({
          transferId: transfer.transfer.id,
          tenantId: input.tenantId,
          universeId: input.universeId,
          root,
        }))
      : null,
    envelope: transfer.accepted ? transfer.envelope : null,
    duplicate: duplicate.accepted ? duplicate.duplicate : false,
    resumed,
    activated,
    skill,
    knowledge,
    forwarded,
    flushed,
    syncA,
    syncConflict,
    relays,
    relayHonesty: unconfiguredRelaysHonesty(),
    quarantine,
    postQuarantineDenied: postQuarantine ? postQuarantine.accepted === false : null,
    isolation: await readIsolationMode(root),
    offline,
    workcell: {
      recommendation: workcell.recommendation,
      productionAuthorization: workcell.productionAuthorization,
    },
    leakScan,
    installLock,
    evidenceId: evidence.id,
    learningId: learning.id,
    locks: DISTRIBUTED_APP_NETWORK_LOCKS,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    founderImpersonation: false as const,
    next: '62L-AM — XIV Distributed Data Fabric + Offline Vector/Graph Database Federation + Global Knowledge Synchronization',
  };
}

export async function buildDistributedAppNetworkHealthReport(root = process.cwd()) {
  const [health, lake, cortex, sealed, isolation] = await Promise.all([
    checkLocalBrainHealth(root),
    knowledgeLakeStats(root),
    cortexMemoryStats(root),
    sealedVaultStats(root),
    readIsolationMode(root),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    architecture: DISTRIBUTED_APP_NETWORK_ARCHITECTURE,
    localHealth: health,
    lake,
    memoryCortex: cortex,
    sealedVault: sealed,
    isolation,
    relays: relaySlots().map((slot) => ({ relay: slot.relay, state: slot.state, optional: slot.optional })),
    honesty: unconfiguredRelaysHonesty(),
    predecessors: {
      '62L-AK': 'WAITING_DATA' as const,
      '62L-AJ': 'WAITING_DATA' as const,
      '62L-AI': 'WAITING_DATA' as const,
      '62L-AH': 'WAITING_DATA' as const,
      '62L-AG': 'WAITING_DATA' as const,
      '62L-AF': 'WAITING_DATA' as const,
      '62L-AE': 'PRESENT' as const,
      '62L-AD': 'WAITING_DATA' as const,
      '62L-AC': 'WAITING_DATA' as const,
      '62L-AB': 'PRESENT' as const,
    },
    githubIssue50: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    aws: 'UNAVAILABLE' as const,
    azure: 'UNAVAILABLE' as const,
    gcp: 'UNAVAILABLE' as const,
    cisco: 'UNAVAILABLE' as const,
    locks: DISTRIBUTED_APP_NETWORK_LOCKS,
    productionAuthorization: false as const,
    inventedPass: false as const,
    tipLand: false as const,
    next: '62L-AM — XIV Distributed Data Fabric + Offline Vector/Graph Database Federation + Global Knowledge Synchronization',
  };
}
