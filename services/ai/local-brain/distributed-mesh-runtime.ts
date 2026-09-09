import { NeuralFabric } from './neural-fabric';
import { appendLearning } from './learning-ledger';
import { LocalCheckpointStore } from './checkpoint-store';
import { join } from 'node:path';
import {
  authorizeMeshNode,
  configureMeshNode,
  detectMeshNode,
  discoverNodeCapabilities,
  verifyMeshNode,
  type MeshNodeRecord,
} from './mesh-node-registry';
import { advertisePeer } from './safe-peer-discovery';
import { routeLocalFirst } from './local-first-router';
import { publishMeshEnvelope, drainMeshBus } from './partition-safe-bus';
import { runDistributedWorkcell } from './distributed-workcell-runtime';
import { reconnectAndReconcile } from './mesh-reconciliation';
import { buildFleetHealthReport, buildFounderDistributedBrainBrief } from './fleet-health';
import { DISTRIBUTED_MESH_CYCLE, MESH_HONESTY, type DistributedMeshHop } from './distributed-mesh-types';
import { cortexId } from './cortex-store';

export { DISTRIBUTED_MESH_CYCLE };

export async function provisionVerifiedNode(input: {
  tenantId: string;
  universeId: string;
  kind: MeshNodeRecord['kind'];
  displayName: string;
  nodeId?: string;
  evidenceRefs: string[];
  root?: string;
  now?: number;
  ttlMs?: number;
}) {
  const detected = await detectMeshNode(input);
  const configured = await configureMeshNode({
    nodeId: detected.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    configNote: `sandbox config for ${input.displayName}`,
    root: input.root,
    now: input.now,
  });
  const authorized = await authorizeMeshNode({
    nodeId: configured.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    approved: true,
    root: input.root,
    now: input.now,
  });
  const verified = await verifyMeshNode({
    nodeId: authorized.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    evidenceRefs: input.evidenceRefs,
    root: input.root,
    now: input.now,
  });
  const discovery = await discoverNodeCapabilities({
    nodeId: verified.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
    now: input.now,
    ttlMs: input.ttlMs,
  });
  return discovery.node;
}

export async function runDistributedMeshCycle(input: {
  tenantId: string;
  universeId: string;
  story: string;
  localNodeId: string;
  peerNodeId?: string;
  workId?: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const now = input.now ?? Date.now();
  const hops: DistributedMeshHop[] = [...DISTRIBUTED_MESH_CYCLE];
  const evidence: string[] = [];

  const localRoute = await routeLocalFirst({
    localNodeId: input.localNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    requiredCapability: 'research',
    root,
    now,
  });
  evidence.push(`route:${localRoute.mode}:${localRoute.state}`);

  if (input.peerNodeId) {
    await advertisePeer({
      fromNodeId: input.localNodeId,
      advertisedNodeId: input.peerNodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
      now,
    });
  }

  const work = await runDistributedWorkcell({
    workId: input.workId ?? cortexId('meshwork'),
    kind: 'research',
    localNodeId: input.localNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    action: input.story,
    root,
    now,
  });
  evidence.push(`workcell:${work.state}:${work.mode}`);

  await publishMeshEnvelope({
    idempotencyKey: `cycle-evidence:${work.workId}`,
    fromNodeId: input.localNodeId,
    toNodeId: input.localNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'evidence',
    body: `cycle evidence for ${input.story}`,
    evidenceRefs: work.evidenceRefs,
    workId: work.workId,
    root,
    now,
  });

  const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
  await checkpoints.checkpoint({
    taskId: work.workId,
    at: new Date(now).toISOString(),
    state: work.state === 'PASS' ? 'completed' : 'waiting_data',
    attempt: 1,
    summary: `Distributed mesh cycle checkpoint for ${input.story}`,
    evidence: work.evidenceRefs,
  });

  const drained = await drainMeshBus({ tenantId: input.tenantId, universeId: input.universeId, root, now });
  let reconciliation = null;
  if (input.peerNodeId) {
    reconciliation = await reconnectAndReconcile({
      localNodeId: input.localNodeId,
      peerNodeId: input.peerNodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
      now,
    });
  }

  const learning = await appendLearning({
    domain: 'operations',
    subject: `distributed-mesh-cycle:${input.story.slice(0, 80)}`,
    claimState: 'MODEL_INFERENCE',
    summary: `hops=${hops.length}; work=${work.state}; drained=${drained.delivered}`,
    sourceRefs: work.evidenceRefs,
    evidence: [...work.evidenceRefs, ...evidence],
    taskId: work.workId,
  }, root);

  const fabric = new NeuralFabric();
  fabric.registerNode({
    id: `node:${input.localNodeId}`,
    kind: 'compute',
    label: 'Local XIV node',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'VERIFIED',
    provenanceRefs: work.evidenceRefs.length ? work.evidenceRefs : ['mesh:cycle'],
  });
  fabric.registerNode({
    id: `brief:${work.workId}`,
    kind: 'evidence',
    label: 'Founder distributed brain brief',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'VERIFIED',
    provenanceRefs: [`learn:${learning.id}`],
  });
  fabric.connect({
    from: `node:${input.localNodeId}`,
    to: `brief:${work.workId}`,
    relation: 'distributed_mesh_cycle',
    weight: 0.4,
    confidence: 0.7,
    evidenceRefs: [`learn:${learning.id}`],
  });

  const health = await buildFleetHealthReport({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    now,
  });
  const brief = await buildFounderDistributedBrainBrief({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    now,
  });

  return {
    hops,
    story: input.story,
    route: localRoute,
    work,
    drained,
    reconcilation: reconciliation,
    learningId: learning.id,
    neural: fabric.stats(),
    health,
    brief,
    honesty: MESH_HONESTY,
    next: '62L-AE — not implemented in this slice',
    productionAuthorization: false as const,
  };
}
