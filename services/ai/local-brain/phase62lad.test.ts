import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentBus } from './agent-bus';
import { registerKnowledgePack } from './knowledge-packs';
import {
  DISTRIBUTED_MESH_CYCLE,
  MESH_HONESTY,
} from './distributed-mesh-types';
import {
  authorizeMeshNode,
  configureMeshNode,
  detectMeshNode,
  discoverNodeCapabilities,
  expireNodeCapabilities,
  getMeshNode,
  isRoutingEligible,
  quarantineMeshNode,
  revokeMeshNode,
} from './mesh-node-registry';
import { advertisePeer, discoverPeers, ingestUntrustedDetection } from './safe-peer-discovery';
import {
  drainMeshBus,
  inboxForNode,
  listMeshEnvelopes,
  publishMeshEnvelope,
  setMeshPartition,
} from './partition-safe-bus';
import { routeLocalFirst } from './local-first-router';
import { selectFederatedModel } from './local-model-federation';
import { listPackTransfers, transferKnowledgePack } from './knowledge-pack-exchange';
import { reconnectAndReconcile } from './mesh-reconciliation';
import { consumeNodeResource, expandOwnBudget } from './distributed-resource-governance';
import { enterEdgeAgentMode } from './edge-agent-mode';
import { runDistributedWorkcell } from './distributed-workcell-runtime';
import { provisionVerifiedNode, runDistributedMeshCycle } from './distributed-mesh-runtime';
import { buildFleetHealthReport, buildFounderDistributedBrainBrief } from './fleet-health';

resetAgentBus();
const root = await mkdtemp(join(tmpdir(), 'xiv-62lad-'));
const tenantId = '62lad-tenant';
const universeId = '62lad-universe';
const failures: string[] = [];
const t0 = 1_700_000_000_000;

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-AD-cycle',
    DISTRIBUTED_MESH_CYCLE.join(' → ') === 'founder_approved_story → local_xiv_node → capability_policy_check → local_execution_first → authorized_peer_only_when_needed → distributed_agent_workcell → evidence_result → durable_checkpoint → network_partition_queue → reconnect → reconciliation → learning_ledger → neural_pathway_update → founder_distributed_brain_brief',
    'Architecture cycle is recorded in order.',
  );
  check('US-AD-locks', MESH_HONESTY.l4AutonomyEnabled === false && MESH_HONESTY.autoTrustRegisteredNode === false && MESH_HONESTY.founderImpersonation === false && MESH_HONESTY.physicalSatelliteControl === false && MESH_HONESTY.tipLand === false, 'Honesty locks are false.');

  // US-AD1 registered ≠ trusted
  const raw = await detectMeshNode({
    tenantId,
    universeId,
    kind: 'computer',
    displayName: 'untrusted laptop',
    root,
    now: t0,
  });
  check('US-AD1', raw.lifecycle === 'detected' && raw.trustedForRouting === false && raw.authorized === false && raw.verified === false, 'Detected node is not trusted for routing.');
  const configuredOnly = await configureMeshNode({
    nodeId: raw.id,
    tenantId,
    universeId,
    configNote: 'local sandbox adapter',
    root,
    now: t0,
  });
  check('US-AD1', configuredOnly.lifecycle === 'configured' && configuredOnly.trustedForRouting === false, 'Configured node is still not trusted.');
  const unapproved = await authorizeMeshNode({
    nodeId: raw.id,
    tenantId,
    universeId,
    approved: false,
    root,
    now: t0,
  });
  check('US-AD1', unapproved.authorized === false && unapproved.trustedForRouting === false, 'Authorization without approval does not trust the node.');

  const local = await provisionVerifiedNode({
    tenantId,
    universeId,
    kind: 'computer',
    displayName: 'local XIV node',
    evidenceRefs: ['probe:hostname:local-sandbox'],
    root,
    now: t0,
    ttlMs: 60_000,
  });
  check('US-AD1', local.lifecycle === 'verified' && local.trustedForRouting === true && isRoutingEligible(local, t0) === true, 'Verified node is routing-eligible only after detect→configure→authorize→verify.');

  // US-AD2 capability discovery
  check('US-AD2', local.capabilities.some((item) => item.kind === 'cpu' && item.availability === 'AVAILABLE'), 'CPU capability was discovered from the host probe.');
  check('US-AD2', local.capabilities.some((item) => item.kind === 'local_model' && item.availability === 'UNAVAILABLE'), 'Unconfigured local model remains UNAVAILABLE.');

  const peer = await provisionVerifiedNode({
    tenantId,
    universeId,
    kind: 'node',
    displayName: 'authorized peer node',
    evidenceRefs: ['probe:hostname:peer-sandbox'],
    root,
    now: t0 + 1,
    ttlMs: 60_000,
  });

  // US-AD3 safe peer discovery
  const advertised = await advertisePeer({
    fromNodeId: local.id,
    advertisedNodeId: peer.id,
    tenantId,
    universeId,
    root,
    now: t0,
  });
  const discovered = await discoverPeers({ fromNodeId: local.id, tenantId, universeId, root });
  check('US-AD3', advertised.autoTrusted === false && discovered.autoTrustRegisteredNode === false, 'Peer discovery never auto-trusts.');
  const stray = await ingestUntrustedDetection({
    observerNodeId: local.id,
    tenantId,
    universeId,
    kind: 'computer',
    displayName: 'wifi stranger',
    root,
    now: t0,
  });
  check('US-AD3', stray.trustedForRouting === false && stray.lifecycle === 'detected', 'A newly discovered peer stays untrusted until authorized and verified.');

  // US-AD4 local-first routing
  const localRoute = await routeLocalFirst({
    localNodeId: local.id,
    tenantId,
    universeId,
    requiredCapability: 'research',
    root,
    now: t0 + 2,
  });
  check('US-AD4', localRoute.mode === 'local' && localRoute.targetNodeId === local.id && localRoute.localFirst === true, 'Verified local node with a fresh capability is preferred.');
  const untrustedRoute = await routeLocalFirst({
    localNodeId: raw.id,
    tenantId,
    universeId,
    requiredCapability: 'research',
    root,
    now: t0 + 2,
  });
  check('US-AD4', untrustedRoute.mode === 'none' && untrustedRoute.state === 'UNAVAILABLE', 'Unverified local node cannot be used as a router.');

  // US-AD5 delayed / duplicate / partition messages
  const delayed = await publishMeshEnvelope({
    idempotencyKey: 'delay-1',
    fromNodeId: local.id,
    toNodeId: peer.id,
    tenantId,
    universeId,
    kind: 'status',
    body: 'delayed hello',
    evidenceRefs: ['bus:delay'],
    delayMs: 10_000,
    root,
    now: t0,
  });
  check('US-AD5', delayed.status === 'queued' && delayed.deliverAt !== delayed.createdAt, 'Delayed message stays queued until deliverAt.');
  const earlyDrain = await drainMeshBus({ tenantId, universeId, root, now: t0 + 1_000 });
  const stillDelayed = (await listMeshEnvelopes({ tenantId, universeId, root })).find((item) => item.idempotencyKey === 'delay-1');
  check('US-AD5', earlyDrain.delivered === 0 && stillDelayed?.status === 'queued', 'Drain before deliverAt does not deliver delayed messages.');
  const lateDrain = await drainMeshBus({ tenantId, universeId, root, now: t0 + 11_000 });
  check('US-AD5', lateDrain.delivered >= 1, 'Delayed message delivers after deliverAt.');

  const first = await publishMeshEnvelope({
    idempotencyKey: 'dup-1',
    fromNodeId: local.id,
    toNodeId: peer.id,
    tenantId,
    universeId,
    kind: 'task',
    body: 'do work once',
    evidenceRefs: ['bus:dup'],
    root,
    now: t0 + 12_000,
  });
  const duplicate = await publishMeshEnvelope({
    idempotencyKey: 'dup-1',
    fromNodeId: local.id,
    toNodeId: peer.id,
    tenantId,
    universeId,
    kind: 'task',
    body: 'do work once again',
    evidenceRefs: ['bus:dup'],
    root,
    now: t0 + 12_100,
  });
  check('US-AD5', first.status === 'delivered' && duplicate.status === 'duplicate_dropped' && duplicate.id === first.id, 'Duplicate idempotencyKey is dropped.');

  await setMeshPartition({
    nodeA: local.id,
    nodeB: peer.id,
    partitioned: true,
    tenantId,
    universeId,
    root,
  });
  const partitioned = await publishMeshEnvelope({
    idempotencyKey: 'part-1',
    fromNodeId: local.id,
    toNodeId: peer.id,
    tenantId,
    universeId,
    kind: 'task',
    body: 'queued across partition',
    evidenceRefs: ['bus:part'],
    workId: 'part-work-1',
    root,
    now: t0 + 13_000,
  });
  const partitionedInbox = await inboxForNode({ nodeId: peer.id, tenantId, universeId, root, now: t0 + 13_000 });
  check('US-AD5', partitioned.status === 'partition_queued' && partitionedInbox.every((item) => item.idempotencyKey !== 'part-1'), 'Partition queues the message and does not deliver it.');

  // US-AD9 reconnect recovery
  const recovered = await reconnectAndReconcile({
    localNodeId: local.id,
    peerNodeId: peer.id,
    tenantId,
    universeId,
    root,
    now: t0 + 14_000,
  });
  const recoveredInbox = await inboxForNode({ nodeId: peer.id, tenantId, universeId, root, now: t0 + 14_000 });
  check('US-AD9', recovered.drained.delivered >= 1 && recoveredInbox.some((item) => item.idempotencyKey === 'part-1'), 'Reconnect drains the partition queue and delivers the message.');
  check('US-AD9', recovered.remainingPartitioned === 0 && recovered.learningId.startsWith('learn_'), 'Reconciliation writes a learning entry and leaves no partition-queued messages.');

  // US-AD8 knowledge pack exchange + failed transfer + partition queue
  const pack = await registerKnowledgePack({
    tenantId,
    universeId,
    partition: 'world',
    domain: 'technology',
    title: 'Mesh sandbox pack',
    claims: [{
      id: 'mesh-pack-claim-1',
      label: 'Local-first routing',
      summary: 'A sourced sandbox claim: local execution is preferred.',
      claimState: 'VERIFIED_FACT',
      sourceRefs: ['synthetic:62lad-pack'],
    }],
    root,
  });
  await setMeshPartition({ nodeA: local.id, nodeB: peer.id, partitioned: true, tenantId, universeId, root });
  const queuedPack = await transferKnowledgePack({
    packId: pack.id,
    fromNodeId: local.id,
    toNodeId: peer.id,
    tenantId,
    universeId,
    root,
    now: t0 + 15_000,
  });
  check('US-AD8', queuedPack.transfer.state === 'queued' && queuedPack.transfer.ingestedOnDestination === false, 'Partitioned pack transfer is queued and not ingested.');
  const afterReconnectPack = await reconnectAndReconcile({
    localNodeId: local.id,
    peerNodeId: peer.id,
    tenantId,
    universeId,
    root,
    now: t0 + 16_000,
  });
  check('US-AD8', afterReconnectPack.packs.retried.some((item) => item.ingestedOnDestination && item.packId === pack.id), 'Reconnect retries queued pack transfers.');
  const failPack = await registerKnowledgePack({
    tenantId,
    universeId,
    partition: 'world',
    domain: 'technology',
    title: 'Mesh fail-transfer pack',
    claims: [{
      id: 'mesh-pack-claim-fail',
      label: 'Failed transfer must not ingest',
      summary: 'A sourced sandbox claim used only for the failed-transfer path.',
      claimState: 'VERIFIED_FACT',
      sourceRefs: ['synthetic:62lad-pack-fail'],
    }],
    root,
  });
  const failedPack = await transferKnowledgePack({
    packId: failPack.id,
    fromNodeId: local.id,
    toNodeId: peer.id,
    tenantId,
    universeId,
    failTransfer: true,
    root,
    now: t0 + 17_000,
  });
  check('US-AD8', failedPack.transfer.state === 'FAIL' && failedPack.transfer.ingestedOnDestination === false, 'Failed transfer is not marked ingested.');
  const transfers = await listPackTransfers(root);
  check('US-AD8', transfers.some((item) => item.state === 'FAIL' && item.packId === failPack.id), 'Pack exchange records terminal failure without silent success.');

  // US-AD7 local-model federation
  const federation = await selectFederatedModel({
    localNodeId: local.id,
    tenantId,
    universeId,
    root,
    now: t0 + 18_000,
  });
  check('US-AD7', federation.mode === 'none' && federation.state === 'UNAVAILABLE', 'Unconfigured federated models remain UNAVAILABLE.');

  // US-AD6 / US-AD12 workcells
  const researchCell = await runDistributedWorkcell({
    workId: 'research-1',
    kind: 'research',
    localNodeId: local.id,
    tenantId,
    universeId,
    action: 'Compare local routing evidence',
    root,
    now: t0 + 19_000,
  });
  check('US-AD6', researchCell.mode === 'local' && researchCell.state === 'PASS' && researchCell.duplicatePrevented === false, 'Multi-node workcell executes locally first when the local node is eligible.');
  const codingCell = await runDistributedWorkcell({
    workId: 'coding-1',
    kind: 'coding',
    localNodeId: local.id,
    tenantId,
    universeId,
    action: 'Propose a sandbox README note',
    coding: {
      summary: 'Document mesh local-first routing',
      files: [{
        path: 'services/ai/local-brain/README.md',
        action: 'modify',
        unifiedDiff: '--- a/services/ai/local-brain/README.md\n+++ b/services/ai/local-brain/README.md\n@@ mesh @@\n',
      }],
      cwd: process.cwd(),
      runGitStatus: true,
    },
    root,
    now: t0 + 19_500,
  });
  check('US-AD12', codingCell.state === 'PASS' && codingCell.productionAuthorization === false && codingCell.evidenceRefs.some((item) => item.startsWith('git_status:')), 'Distributed coding workcell emits a structured patch and an allowlisted git_status.');
  const quantCell = await runDistributedWorkcell({
    workId: 'quant-1',
    kind: 'quant',
    localNodeId: local.id,
    tenantId,
    universeId,
    action: 'Score sandbox signals',
    quantSignals: [{ id: 'q1', weight: 1, confidence: 0.8, direction: 1, evidenceRefs: ['synthetic:quant'] }],
    root,
    now: t0 + 20_000,
  });
  check('US-AD12', quantCell.state === 'PASS' && quantCell.tradingAuthorized === false, 'Distributed quant workcell is classical and does not authorize trading.');
  const duplicateWork = await runDistributedWorkcell({
    workId: 'research-1',
    kind: 'research',
    localNodeId: local.id,
    tenantId,
    universeId,
    action: 'Compare local routing evidence again',
    root,
    now: t0 + 20_500,
  });
  check('US-AD12', duplicateWork.duplicatePrevented === true && duplicateWork.mode === 'duplicate', 'Duplicate consequential workId is not re-executed.');

  // US-AD11 edge-agent mode
  const edgeNode = await provisionVerifiedNode({
    tenantId,
    universeId,
    kind: 'edge',
    displayName: 'edge tablet',
    evidenceRefs: ['probe:edge-sandbox'],
    root,
    now: t0 + 21_000,
    ttlMs: 60_000,
  });
  const edge = await enterEdgeAgentMode({
    nodeId: edgeNode.id,
    tenantId,
    universeId,
    root,
    now: t0 + 21_000,
  });
  check('US-AD11', edge.localOnly === true && edge.peerRouting === false && edge.physicalDeviceControl === false && edge.satelliteControl === false, 'Edge-agent mode is local-only and does not control physical devices.');
  await expireNodeCapabilities({
    nodeId: edgeNode.id,
    tenantId,
    universeId,
    root,
    observedAt: t0,
  });
  const edgeWork = await runDistributedWorkcell({
    workId: 'edge-1',
    kind: 'research',
    localNodeId: edgeNode.id,
    tenantId,
    universeId,
    action: 'Edge local note',
    edgeMode: true,
    root,
    now: t0 + 80_000,
  });
  check('US-AD11', edgeWork.edgeLocalOnly === true && edgeWork.mode !== 'authorized_peer', 'Edge workcells never route to peers.');

  // US-AD2 stale capabilities — expire local, keep peer fresh
  await expireNodeCapabilities({
    nodeId: local.id,
    tenantId,
    universeId,
    root,
    observedAt: t0,
  });
  await discoverNodeCapabilities({
    nodeId: peer.id,
    tenantId,
    universeId,
    root,
    now: t0 + 89_000,
    ttlMs: 60_000,
  });
  const staleRoute = await routeLocalFirst({
    localNodeId: local.id,
    tenantId,
    universeId,
    requiredCapability: 'research',
    root,
    now: t0 + 90_000,
  });
  check('US-AD2', staleRoute.mode === 'authorized_peer' && staleRoute.targetNodeId === peer.id, 'Stale local capabilities do not keep routing local; a fresh authorized peer may be used.');
  await discoverNodeCapabilities({
    nodeId: local.id,
    tenantId,
    universeId,
    root,
    now: t0 + 91_000,
    ttlMs: 60_000,
  });

  // US-AD10 resource governance
  const allowed = await consumeNodeResource({
    nodeId: local.id,
    tenantId,
    universeId,
    kind: 'cpu_slots',
    units: 1,
    root,
  });
  check('US-AD10', allowed.allowed === true, 'In-budget resource consumption is allowed.');
  const overflow = await consumeNodeResource({
    nodeId: local.id,
    tenantId,
    universeId,
    kind: 'cpu_slots',
    units: 10_000,
    root,
  });
  check('US-AD10', overflow.allowed === false && overflow.state === 'DENIED', 'Over-budget consumption is DENIED.');
  const selfExpand = await expandOwnBudget({ nodeId: local.id });
  check('US-AD10', selfExpand.allowed === false && selfExpand.state === 'DENIED', 'Nodes cannot expand their own resource limits.');

  // US-AD13 quarantine / revocation
  const quarantined = await quarantineMeshNode({
    nodeId: peer.id,
    tenantId,
    universeId,
    reason: 'stale attestation',
    root,
    now: t0 + 92_000,
  });
  const quarantinedRoute = await routeLocalFirst({
    localNodeId: local.id,
    tenantId,
    universeId,
    requiredCapability: 'research',
    root,
    now: t0 + 92_000,
  });
  check('US-AD13', quarantined.lifecycle === 'quarantined' && quarantined.trustedForRouting === false, 'Quarantine immediately removes routing trust.');
  check('US-AD13', quarantinedRoute.mode === 'local' || quarantinedRoute.targetNodeId !== peer.id, 'Quarantined peer is not selected for routing.');
  const revoked = await revokeMeshNode({
    nodeId: peer.id,
    tenantId,
    universeId,
    reason: 'founder revocation',
    root,
    now: t0 + 93_000,
  });
  let reenterDenied = false;
  try {
    await detectMeshNode({
      tenantId,
      universeId,
      kind: 'node',
      displayName: 'authorized peer node',
      nodeId: peer.id,
      root,
      now: t0 + 93_000,
    });
  } catch (error) {
    reenterDenied = error instanceof Error && error.message === 'REVOKED_NODE_CANNOT_REENTER';
  }
  check('US-AD13', revoked.lifecycle === 'revoked' && reenterDenied, 'Revoked node identity cannot re-enter routing.');

  // US-AD14 fleet health + founder brief
  const cycle = await runDistributedMeshCycle({
    tenantId,
    universeId,
    story: 'Keep distributed work local-first after peer revocation.',
    localNodeId: local.id,
    workId: 'cycle-1',
    root,
    now: t0 + 94_000,
  });
  check('US-AD-cycle', cycle.hops.join(' → ') === DISTRIBUTED_MESH_CYCLE.join(' → ') && cycle.productionAuthorization === false, 'Cycle runner walks the recorded hops.');
  check('US-AD14', cycle.brief.impersonatesFounder === false && cycle.brief.executableByAgent === false, 'Founder distributed brief does not impersonate the founder.');
  const health = await buildFleetHealthReport({ tenantId, universeId, root, now: t0 + 94_000 });
  check('US-AD14', health.honesty.l4AutonomyEnabled === false && health.honesty.inventedPass === false && health.honesty.windowsNodeVerification === 'NOT_TESTED', 'Fleet health does not invent a Windows-node PASS.');
  check('US-AD14', health.localModel.availability === 'UNAVAILABLE' && health.providers.every((slot) => slot.configured || slot.state === 'UNAVAILABLE'), 'Unconfigured providers remain UNAVAILABLE.');
  check('US-AD14', health.predecessor.acWorkcells === 'PASS' && health.predecessor.yResearchCivilization === 'PASS', 'AC workcells and Y research civilization are recorded present on this parent.');
  const brief = await buildFounderDistributedBrainBrief({ tenantId, universeId, root, now: t0 + 94_000 });
  check('US-AD14', brief.honesty.physicalSatelliteControl === false && brief.fleet.nodes.some((node) => node.nodeId === local.id), 'Fleet brief includes the local node and denies satellite control.');

  const refreshed = await getMeshNode(local.id, tenantId, universeId, root);
  check('US-AD1', refreshed?.physicalDeviceControl === false && refreshed?.l4AutonomyEnabled === false, 'Verified nodes still cannot control physical devices or enable L4.');

  if (failures.length) {
    console.error('62L-AD tests FAIL');
    for (const failure of failures) console.error(` - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AD safety tests PASS');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
