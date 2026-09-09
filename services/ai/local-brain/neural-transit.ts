import { createFounderDigitalTwin } from './founder-digital-twin';
import { GlobalBrainHighways } from './global-brain-highways';
import { SparseRoutingTable } from './sparse-routing-tables';
import { createNeuralTransitEnvelope, NEURAL_TRANSIT_PIPELINE } from './neural-transit-envelope';
import { offerAgentHandshake, acceptAgentHandshake } from './agent-handshake';
import { sendOnEvidenceHighway } from './evidence-highways';
import { sendDepartmentMessage } from './department-communication';
import { routeLocalOrCloud } from './local-cloud-routing';
import { completeTransit, enqueueTransit } from './congestion-deadletter';
import { returnLearningToBrain } from './learning-return';
import { inspectBrainTransitHealth } from './brain-transit-health';
import { assignEnvelopePartition, describeTransitPartitions } from './offline-partition';
import { scheduleDebriefCycle, tickScheduledDebriefs } from './scheduled-debrief';
import { listToolModelRegistry } from './tool-model-registry';
import { simulateVirtualPopulation } from './virtual-population';

export { NEURAL_TRANSIT_PIPELINE };

export async function runNeuralTransitCycle(input: {
  founderId: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  objective: string;
  root: string;
  now?: number;
}) {
  const twin = createFounderDigitalTwin({
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
  const highways = new GlobalBrainHighways();
  const routes = new SparseRoutingTable();
  highways.ensureScope(input.tenantId, input.universeId);

  const now = input.now ?? Date.now();
  const envelopeResult = createNeuralTransitEnvelope({
    tenantId: input.tenantId,
    universeId: input.universeId,
    from: { kind: 'twin', id: twin.id },
    to: { kind: 'department', id: 'engineering' },
    topic: input.storyId,
    body: input.objective,
    evidenceRefs: ['62L-W:transit-cycle'],
    now,
  });
  if (!envelopeResult.accepted) {
    return {
      pipeline: NEURAL_TRANSIT_PIPELINE,
      status: 'DENIED' as const,
      reason: envelopeResult.reason,
      productionAuthorization: false as const,
    };
  }

  const partition = assignEnvelopePartition(envelopeResult.envelope);
  routes.register({
    fromId: `twin:${twin.id}`,
    toId: 'dept:engineering',
    nextHop: 'founder_twin',
    tenantId: input.tenantId,
    universeId: input.universeId,
    weight: 0.8,
  });

  const queued = await enqueueTransit(envelopeResult.envelope, { knownRoute: true, now, root: input.root });
  const handshake = offerAgentHandshake({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromRole: 'architect',
    toRole: 'coder',
    purpose: input.objective,
    evidenceRefs: [envelopeResult.envelope.id],
  });
  if (handshake.accepted) {
    acceptAgentHandshake(handshake.handshake.id, input.tenantId, input.universeId);
  }

  const department = await sendDepartmentMessage({
    highways,
    routes,
    tenantId: input.tenantId,
    universeId: input.universeId,
    from: 'engineering',
    to: 'rd',
    body: `Transit objective: ${input.objective}`,
    root: input.root,
  });

  const localCloud = routeLocalOrCloud({
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: input.storyId,
    body: input.objective,
    prefer: 'local',
    modelId: 'local_model',
  });

  const evidence = queued.accepted
    ? await sendOnEvidenceHighway({
        highways,
        envelope: envelopeResult.envelope,
        summary: `Neural transit cycle for ${input.storyId}`,
        payload: { partition: partition.partition, handshakeAccepted: handshake.accepted },
        root: input.root,
      })
    : { accepted: false as const, reason: 'not queued' };

  const learning = queued.accepted
    ? await returnLearningToBrain({
        highways,
        envelope: envelopeResult.envelope,
        summary: `Transit learning for ${input.storyId}: local preferred; cloud UNAVAILABLE.`,
        root: input.root,
      })
    : null;

  if (queued.accepted) completeTransit(envelopeResult.envelope.id);

  await scheduleDebriefCycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    intervalMs: 1_000,
    now: now - 1_000,
    root: input.root,
  });
  const debrief = await tickScheduledDebriefs({
    tenantId: input.tenantId,
    universeId: input.universeId,
    now,
    root: input.root,
    accomplishments: ['Neural transit cycle completed locally'],
    failures: localCloud.cloud === 'UNAVAILABLE' ? ['Cloud routing UNAVAILABLE'] : [],
  });

  const health = inspectBrainTransitHealth({
    highways,
    routes,
    tenantId: input.tenantId,
    universeId: input.universeId,
  });

  return {
    pipeline: NEURAL_TRANSIT_PIPELINE,
    twin,
    envelope: envelopeResult.envelope,
    partition,
    partitions: describeTransitPartitions(),
    queued,
    handshake,
    department,
    localCloud,
    registry: listToolModelRegistry(),
    evidence,
    learning,
    debrief,
    health,
    population: simulateVirtualPopulation(highways.fabric),
    status: 'COMPLETED' as const,
    productionAuthorization: false as const,
  };
}
