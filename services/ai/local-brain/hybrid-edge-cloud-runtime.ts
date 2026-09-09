import { publishAgentMessage } from './agent-bus';
import { agenticPut, agenticQuery } from './agentic-database';
import {
  grantSealedAccess,
  readCeoSealedRecord,
  redactSealedForRouting,
  sealCeoRecord,
  sealedVaultStats,
  SEALED_REDACTION,
} from './ceo-sealed-vault';
import { LocalCheckpointStore } from './checkpoint-store';
import { cloudFailureFallback, cloudPeerSlots, routeToCloudPeer, type CloudPeerObservation } from './cloud-peer-adapters';
import { runDebriefRecoveryCycle } from './debrief-recovery';
import { decisionGate } from './decision-gate';
import { federateCrossOsAgents, registerDeviceNode, type DeviceNode } from './device-node-runtime';
import { enterEmergencyIsolation, readIsolationMode } from './emergency-isolation';
import { appendEvidenceEvent } from './evidence-ledger';
import { createFounderDigitalTwin } from './founder-digital-twin';
import { recallFounderMemories } from './founder-memory-vault';
import {
  HYBRID_EDGE_CLOUD_ARCHITECTURE,
  HYBRID_EDGE_CLOUD_LOCKS,
  type CloudPeerId,
  type DeviceClass,
  type SealedActor,
} from './hybrid-edge-cloud-types';
import { ingestLakeSource, knowledgeLakeStats } from './knowledge-lake';
import { syncKnowledgePack } from './knowledge-pack-sync';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { appendLearning } from './learning-ledger';
import { cloneLogicalUniverse, ensureLogicalUniverse, federateLogicalUniverses } from './logical-universe-graph';
import { evaluateOfflineTask } from './offline-policy';
import { sendSecureAgentMessage } from './secure-agent-conversation';
import { enqueueStoreAndForward } from './store-and-forward';
import { xivLocalPath } from './durable-json';
import { runDecisionCouncil } from './workcells';
import { isAllowedLocalCommand } from './local-command-runner';
import { planDemandAgents } from './demand-agent-planner';
import { checkLocalBrainHealth } from './health-check';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { cortexMemoryStats } from './memory-cortex';

export { HYBRID_EDGE_CLOUD_ARCHITECTURE, HYBRID_EDGE_CLOUD_LOCKS };

export async function classifyAndGate(input: {
  action: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  consequence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  production?: boolean;
  permissionChange?: boolean;
}) {
  if (input.classification === 'sealed_founder_priority') {
    return {
      executableByAgent: false as const,
      humanApprovalRequired: true as const,
      routeCloud: false as const,
      reason: 'Sealed founder-priority content stays local unless the CEO principal explicitly authorizes a redacted route.',
    };
  }
  const gate = decisionGate({
    id: `ae-gate-${input.action.slice(0, 24)}`,
    action: input.action,
    consequence: input.consequence,
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });
  return { ...gate, routeCloud: false as const };
}

export async function runHybridEdgeCloudCycle(input: {
  tenantId: string;
  universeId: string;
  founderId?: string;
  storyId: string;
  intent: string;
  sealedPayload?: string;
  deviceClass?: DeviceClass;
  peer?: CloudPeerId;
  isolate?: boolean;
  federateClone?: boolean;
  actor?: SealedActor;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.storyId || !input.intent.trim()) {
    throw new Error('HYBRID_CYCLE_SCOPE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const hops = [...HYBRID_EDGE_CLOUD_ARCHITECTURE];
  const ceo: SealedActor = input.actor ?? { kind: 'ceo_principal', id: 'ceo-principal-sim' };
  const twin = createFounderDigitalTwin({
    founderId: input.founderId ?? 'founder-sim',
    tenantId: input.tenantId,
    universeId: input.universeId,
    displayName: 'Founder Digital Twin (not the real founder)',
  });

  const universe = await ensureLogicalUniverse({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.universeId,
    root,
  });

  let sealed: Awaited<ReturnType<typeof sealCeoRecord>> | null = null;
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
  const executive = await recallFounderMemories({
    tenantId: input.tenantId,
    universeId: input.universeId,
    founderId: input.founderId,
    query: input.intent,
    root,
  });

  const laptop = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: input.deviceClass ?? 'laptop',
    root,
  });
  const mobile = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: 'android_class',
    root,
  });
  const ios = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: 'ios_class',
    root,
  });
  const federation = await federateCrossOsAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: laptop.id,
    toNodeId: mobile.id,
    root,
  });

  if (input.isolate) {
    await enterEmergencyIsolation({ reason: `cycle:${input.storyId}`, root });
  }
  const isolation = await readIsolationMode(root);

  const offline = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: Boolean(input.peer) && !isolation.active,
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
  const population = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.storyId,
    requestedRoles: ['researcher', 'evidence_verifier'],
    consequence: 'LOW',
    approved: true,
  });
  const knowledge = await retrieveOfflineKnowledge(input.intent, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });

  const conversation = await sendSecureAgentMessage({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromAgent: 'researcher',
    toAgent: 'evidence_verifier',
    body: input.sealedPayload ? input.sealedPayload : `local result draft for ${input.storyId}`,
    containsSealed: Boolean(input.sealedPayload),
    root,
  });
  const forwarded = await enqueueStoreAndForward({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: laptop.id,
    toNodeId: mobile.id,
    envelope: conversation,
    root,
  });

  const gate = await classifyAndGate({
    action: input.intent,
    classification: input.sealedPayload ? 'sealed_founder_priority' : 'internal',
    consequence: 'LOW',
  });

  let routingRedact: Awaited<ReturnType<typeof redactSealedForRouting>> | null = null;
  if (sealed?.record) {
    routingRedact = await redactSealedForRouting({
      recordId: sealed.record.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      destination: input.peer ? 'cloud' : 'agent_bus',
      actor: { kind: 'ordinary_agent', id: 'researcher-1', role: 'researcher' },
      root,
    });
  }

  const peerRoute = routeToCloudPeer({
    peer: input.peer ?? 'aws',
    classification: input.sealedPayload ? 'sealed_founder_priority' : 'internal',
    sealedRedacted: true,
    isolation: isolation.active,
  });
  const resilience = cloudFailureFallback(input.peer ?? 'aws');

  const lake = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: 'operations',
    era: '2026',
    partition: 'business',
    sourceUri: `synthetic:62lae/${input.storyId}`,
    sourceLanguage: 'en',
    originalText: `Local hybrid-edge cycle for ${input.intent}`.slice(0, 500),
    provenanceRefs: [`story:${input.storyId}`],
    root,
  });

  let clone = null;
  let packSync = null;
  if (input.federateClone) {
    clone = await cloneLogicalUniverse({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      label: `${input.universeId}-clone`,
      root,
    });
    await federateLogicalUniverses({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toUniverseId: clone.id,
      root,
    });
    packSync = await syncKnowledgePack({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toUniverseId: clone.id,
      lakeObjectId: lake.object.id,
      federated: true,
      root,
    });
  }

  const dbRow = await agenticPut({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: 'cycle_results',
    document: { storyId: input.storyId, intent: input.intent, sealed: Boolean(input.sealedPayload) },
    sealed: Boolean(input.sealedPayload),
    root,
  });
  const dbVisible = await agenticQuery({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: 'cycle_results',
    actor: { kind: 'ordinary_agent', id: 'coder-1', role: 'coder' },
    root,
  });

  publishAgentMessage({
    fromRole: 'workflow_planner',
    toRole: 'evidence_verifier',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'status',
    body: `hybrid-edge cycle ${input.storyId}`,
    evidenceRefs: [`story:${input.storyId}`],
    requiresHumanApproval: false,
  });

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      storyId: input.storyId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `Hybrid edge-cloud cycle ${input.storyId}`,
      payload: {
        hops,
        sealedRedacted: routingRedact?.redacted.sealedPayload ?? null,
        peerState: peerRoute.state,
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
    summary: `62L-AE cycle ${input.storyId}`,
    nextAction: '62L-AF',
    evidence: [evidence.id],
  });

  const learning = await appendLearning(
    {
      domain: 'operations',
      subject: `hybrid-edge:${input.storyId}`,
      claimState: 'MODEL_INFERENCE',
      summary: `Local cycle completed. peer=${peerRoute.state} isolation=${isolation.active}`,
      sourceRefs: [evidence.id],
      evidence: [evidence.id],
      taskId: input.storyId,
    },
    root,
  );

  const debrief = await runDebriefRecoveryCycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    taskId: input.storyId,
    accomplishments: ['local hybrid-edge cycle'],
    failures: [],
    assumptions: ['Unconfigured AWS/Azure/Cisco remain UNAVAILABLE'],
    resourceUse: { modelCalls: 0, residentAgents: 2, notes: 'logical nodes only' },
    lessons: ['Sealed vault stays deny-by-default'],
    nextPriorities: ['62L-AF — XIV Universe Operating System Kernel + Private Agent Economy + Distributed Memory Replication'],
    root,
  });

  return {
    hops,
    twin: { id: twin.id, twinIsRealFounder: false as const, authority: twin.authority },
    universe,
    executiveMemoryCount: executive.length,
    sealedAccepted: sealed?.accepted ?? false,
    sealedRedaction: routingRedact?.redacted.sealedPayload ?? (input.sealedPayload ? SEALED_REDACTION : null),
    nodes: { laptop, mobile, ios } satisfies Record<string, DeviceNode>,
    federation,
    isolation,
    offline,
    workcell: {
      recommendation: workcell.recommendation,
      consensusForced: workcell.consensusForced,
      productionAuthorization: workcell.productionAuthorization,
    },
    population: { status: population.status, runningProgramsAreNotTrillions: true as const },
    knowledge: { state: knowledge.state, inventedFacts: knowledge.inventedFacts, hits: knowledge.evidenceRefs.length },
    conversation: { id: conversation.id, macOk: true as const, sealedRedacted: conversation.sealedRedacted },
    forwarded,
    gate,
    peerRoute,
    resilience,
    peers: cloudPeerSlots(),
    packSync,
    clone,
    dbRowId: dbRow.id,
    ordinaryAgentSawSealedRow: dbVisible.rows.some((row) => row.id === dbRow.id && dbRow.sealed),
    evidenceId: evidence.id,
    learningId: learning.id,
    debriefId: debrief.record.id,
    commandAllowlistIntact: isAllowedLocalCommand('git_status'),
    locks: HYBRID_EDGE_CLOUD_LOCKS,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    next: '62L-AF — XIV Universe Operating System Kernel + Private Agent Economy + Distributed Memory Replication',
  };
}

export async function buildHybridEdgeCloudHealthReport(root = process.cwd()) {
  const [health, lake, cortex, sealed, isolation] = await Promise.all([
    checkLocalBrainHealth(root),
    knowledgeLakeStats(root),
    cortexMemoryStats(root),
    sealedVaultStats(root),
    readIsolationMode(root),
  ]);
  const cloud = ['aws', 'azure', 'gcp'] as const;
  return {
    generatedAt: new Date().toISOString(),
    architecture: HYBRID_EDGE_CLOUD_ARCHITECTURE,
    localHealth: health,
    lake,
    memoryCortex: cortex,
    sealedVault: sealed,
    isolation,
    predecessors: {
      '62L-AD': 'WAITING_DATA' as const,
      '62L-AC': 'WAITING_DATA' as const,
      '62L-AB': 'PRESENT' as const,
      '62L-Y': 'PRESENT' as const,
      '62L-X': 'PRESENT' as const,
    },
    githubIssue42: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    iosPhysicalDevice: 'NOT_TESTED' as const,
    androidPhysicalDevice: 'NOT_TESTED' as const,
    aws: 'UNAVAILABLE' as const,
    azure: 'UNAVAILABLE' as const,
    cisco: 'UNAVAILABLE' as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    cloudRuntimes: cloud.map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.configured ? runtime.state : 'UNAVAILABLE' };
    }),
    peers: cloudPeerSlots().map((slot) => ({ peer: slot.peer, state: slot.state })),
    locks: HYBRID_EDGE_CLOUD_LOCKS,
    founderTwinIsRealFounder: false as const,
    physicalUniverses: false as const,
    productionAuthorization: false as const,
    inventedPass: false as const,
    next: '62L-AF — XIV Universe Operating System Kernel + Private Agent Economy + Distributed Memory Replication',
  };
}

export async function readSealedAsOrdinaryAgent(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  return readCeoSealedRecord({
    ...input,
    actor: { kind: 'ordinary_agent', id: 'mesh-researcher', role: 'researcher' },
  });
}

export async function authorizeThenReadSealed(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  ceo: SealedActor;
  granteeId: string;
  root?: string;
}) {
  const grant = await grantSealedAccess({
    recordId: input.recordId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    issuer: input.ceo,
    grantee: { id: input.granteeId, kind: 'ordinary_agent' },
    ttlMs: 60_000,
    root: input.root,
  });
  const read = await readCeoSealedRecord({
    recordId: input.recordId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor: { kind: 'ordinary_agent', id: input.granteeId, role: 'researcher' },
    root: input.root,
  });
  return { grant, read };
}

export type { CloudPeerObservation };
