import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentBus } from './agent-bus';
import { resetAgentPopulation } from './agent-population';
import { resetAgentHandshakes, acceptAgentHandshake, offerAgentHandshake } from './agent-handshake';
import { inspectBrainTransitHealth } from './brain-transit-health';
import { completeTransit, congestionStats, enqueueTransit, listDeadLetters, resetTransitCongestion } from './congestion-deadletter';
import { sendDepartmentMessage } from './department-communication';
import { sendOnEvidenceHighway } from './evidence-highways';
import { GlobalBrainHighways } from './global-brain-highways';
import { returnLearningToBrain } from './learning-return';
import { routeLocalOrCloud, unconfiguredCloudSlots } from './local-cloud-routing';
import { createNeuralTransitEnvelope, NEURAL_TRANSIT_PIPELINE } from './neural-transit-envelope';
import { runNeuralTransitCycle } from './neural-transit';
import { assignEnvelopePartition, describeTransitPartitions, isolatePartition } from './offline-partition';
import { scheduleDebriefCycle, tickScheduledDebriefs } from './scheduled-debrief';
import { SparseRoutingTable } from './sparse-routing-tables';
import { cloudModelsRemainUnavailable, listToolModelRegistry, resolveToolOrModel } from './tool-model-registry';
import { resetFounderDigitalTwins } from './founder-digital-twin';
import { resetVirtualPopulation } from './virtual-population';

const failures: string[] = [];
function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const root = await mkdtemp(join(tmpdir(), 'xiv-62lw-'));
const tenantId = '62lw-tenant';
const universeId = '62lw-universe';

try {
  resetAgentBus();
  resetAgentPopulation();
  resetAgentHandshakes();
  resetTransitCongestion();
  resetFounderDigitalTwins();
  resetVirtualPopulation();

  const localEnvelope = createNeuralTransitEnvelope({
    tenantId,
    universeId,
    from: { kind: 'twin', id: 'twin-1' },
    to: { kind: 'department', id: 'engineering' },
    topic: '62L-W',
    body: 'Universal neural-transit envelope for a local hop.',
  });
  const cloudEnvelope = createNeuralTransitEnvelope({
    tenantId,
    universeId,
    from: { kind: 'twin', id: 'twin-1' },
    to: { kind: 'model', id: 'aws' },
    topic: '62L-W-cloud',
    body: 'Should not silently take the cloud partition.',
    partition: 'cloud',
  });
  const highEnvelope = createNeuralTransitEnvelope({
    tenantId,
    universeId,
    from: { kind: 'agent', id: 'a' },
    to: { kind: 'agent', id: 'b' },
    topic: 'critical cutover',
    body: 'High consequence transit requires a human.',
    consequence: 'CRITICAL',
  });
  check('US-W1', localEnvelope.accepted === true && localEnvelope.accepted && localEnvelope.envelope.productionAuthorized === false && localEnvelope.envelope.partition === 'local', 'Universal neural-transit envelope is created for local hops.');
  check('US-W1-cloud', cloudEnvelope.accepted === false && cloudEnvelope.state === 'UNAVAILABLE', 'Cloud partition envelopes stay UNAVAILABLE until configured.');
  check('US-W1-high', highEnvelope.accepted === false && highEnvelope.state === 'HUMAN_APPROVAL_REQUIRED', 'High-consequence transit envelopes require human approval.');
  check('US-W1-pipeline', NEURAL_TRANSIT_PIPELINE[0] === 'Devin' && NEURAL_TRANSIT_PIPELINE.at(-1) === 'Brain improvement', 'Transit pipeline is recorded.');

  const table = new SparseRoutingTable();
  table.register({ fromId: 'twin-1', toId: 'dept:engineering', nextHop: 'founder_twin', tenantId, universeId, weight: 0.7 });
  const hit = table.lookup({ tenantId, universeId, fromId: 'twin-1', toId: 'dept:engineering' });
  const miss = table.lookup({ tenantId, universeId: 'other', fromId: 'twin-1', toId: 'dept:engineering' });
  check('US-W2', hit?.nextHop === 'founder_twin' && miss === null && table.stats().materializedFullMesh === false, 'Sparse routing tables do not materialize a full mesh and stay Universe-scoped.');

  const registry = listToolModelRegistry();
  const localModel = resolveToolOrModel('local_model');
  const aws = registry.find((entry) => entry.id === 'provider:aws');
  check('US-W3', localModel.state === 'UNAVAILABLE' && aws?.state === 'UNAVAILABLE' && aws.locality === 'cloud' && cloudModelsRemainUnavailable(), 'Tool/model registry keeps unconfigured cloud/models UNAVAILABLE.');

  const offered = offerAgentHandshake({
    tenantId,
    universeId,
    fromRole: 'architect',
    toRole: 'coder',
    purpose: 'Hand a local patch proposal',
    evidenceRefs: ['story:62L-W'],
  });
  const cross = offerAgentHandshake({
    tenantId,
    universeId,
    fromRole: 'architect',
    toRole: 'coder',
    purpose: 'cross',
    peerUniverseId: 'other-u',
  });
  const criticalHs = offerAgentHandshake({
    tenantId,
    universeId,
    fromRole: 'architect',
    toRole: 'coder',
    purpose: 'production cut',
    consequence: 'CRITICAL',
  });
  check('US-W4', offered.accepted === true && cross.accepted === false && criticalHs.accepted === false, 'Agent-to-agent handshakes are scoped and refuse cross-Universe / critical auto-accept.');
  if (offered.accepted) {
    const accepted = acceptAgentHandshake(offered.handshake.id, tenantId, universeId);
    const wrongScope = acceptAgentHandshake(offered.handshake.id, tenantId, 'other');
    check('US-W4-accept', accepted.accepted === true && wrongScope.accepted === false && accepted.handshake.state === 'accepted', 'Handshake accept is tenant/Universe bound.');
  }

  if (!localEnvelope.accepted) throw new Error('expected local envelope');
  const highways = new GlobalBrainHighways();
  const evidence = await sendOnEvidenceHighway({
    highways,
    envelope: localEnvelope.envelope,
    summary: 'Evidence hop recorded',
    root,
  });
  check('US-W5', evidence.accepted === true && evidence.event.productionAuthorization === false, 'Evidence highways persist scoped evidence without production authorization.');

  const dept = await sendDepartmentMessage({
    highways,
    routes: table,
    tenantId,
    universeId,
    from: 'engineering',
    to: 'marketing',
    body: 'Share a local research note. Do not publish externally.',
    root,
  });
  check('US-W6', dept.accepted === true && dept.productionAuthorization === false, 'Department-to-department communication uses highways + Agent Bus.');

  const localRoute = routeLocalOrCloud({ tenantId, universeId, topic: 'local hop', body: 'prefer local', prefer: 'local' });
  const cloudRoute = routeLocalOrCloud({ tenantId, universeId, topic: 'cloud hop', body: 'prefer cloud', prefer: 'cloud' });
  check('US-W7', localRoute.selected === 'local' && localRoute.preferLocal === true && cloudRoute.selected === 'none' && cloudRoute.cloud === 'UNAVAILABLE' && unconfiguredCloudSlots().length >= 1, 'Local/cloud routing prefers local/offline; cloud is UNAVAILABLE until configured.');

  resetTransitCongestion();
  const firstQueue = await enqueueTransit(localEnvelope.envelope, { knownRoute: true, root });
  check('US-W8-queue', firstQueue.accepted === true, 'Transit enqueue accepts a known local route.');
  completeTransit(localEnvelope.envelope.id);
  const unknown = await enqueueTransit(localEnvelope.envelope, { knownRoute: false, root });
  check('US-W8-unknown', unknown.accepted === false && 'deadLetter' in unknown && unknown.deadLetter.reason === 'UNKNOWN_ROUTE', 'Unknown routes become dead letters.');
  const expired = createNeuralTransitEnvelope({
    tenantId,
    universeId,
    from: { kind: 'agent', id: 'a' },
    to: { kind: 'agent', id: 'b' },
    topic: 'expired',
    body: 'ttl elapsed',
    ttlMs: 1000,
    now: 1,
  });
  if (!expired.accepted) throw new Error('expected expired envelope');
  const expiredQ = await enqueueTransit(expired.envelope, { knownRoute: true, now: 50_000, root });
  check('US-W8-expired', expiredQ.accepted === false && 'deadLetter' in expiredQ && expiredQ.deadLetter.reason === 'EXPIRED', 'Expired envelopes become dead letters.');
  resetTransitCongestion();
  for (let index = 0; index < 32; index += 1) {
    const extra = createNeuralTransitEnvelope({
      tenantId,
      universeId,
      from: { kind: 'agent', id: `a${index}` },
      to: { kind: 'agent', id: 'b' },
      topic: `fill-${index}`,
      body: `fill ${index}`,
    });
    if (!extra.accepted) throw new Error('expected fill envelope');
    const queued = await enqueueTransit(extra.envelope, { knownRoute: true });
    if (!queued.accepted) throw new Error('expected congestion fill to accept');
  }
  const overflow = createNeuralTransitEnvelope({
    tenantId,
    universeId,
    from: { kind: 'agent', id: 'overflow' },
    to: { kind: 'agent', id: 'b' },
    topic: 'overflow',
    body: 'should dead-letter as congested',
  });
  if (!overflow.accepted) throw new Error('expected overflow envelope');
  const congested = await enqueueTransit(overflow.envelope, { knownRoute: true, root });
  check('US-W8', congested.accepted === false && 'deadLetter' in congested && congested.deadLetter.reason === 'CONGESTED' && congestionStats().congested === true, 'Congestion overflow goes to dead letters.');
  check('US-W8-list', listDeadLetters(tenantId, universeId).length >= 1, 'Dead letters are tenant/Universe listed.');

  const learning = await returnLearningToBrain({
    highways,
    envelope: localEnvelope.envelope,
    summary: 'Learning returned to Global Brain after local transit.',
    root,
  });
  check('US-W9', learning.routed === true && learning.productionChange === false && learning.learning.productionChange === false, 'Learning return pathways write the ledger and route back to debrief.');

  const health = inspectBrainTransitHealth({ highways, routes: table, tenantId, universeId });
  check('US-W10', health.productionAuthorization === false && health.localModel === 'UNAVAILABLE' && health.cloudUnavailable.some((id) => id.includes('aws')), 'Brain Transit health maps do not claim unconfigured providers AVAILABLE.');

  const partitions = describeTransitPartitions();
  const assigned = assignEnvelopePartition(localEnvelope.envelope);
  const isolated = isolatePartition(localEnvelope.envelope, tenantId, 'other');
  check('US-W11', partitions.local.open === true && partitions.cloud.open === false && assigned.partition === 'local' && isolated.allowed === false, 'Offline partitioning keeps the local partition open and the cloud partition closed.');

  const schedule = await scheduleDebriefCycle({
    tenantId,
    universeId,
    storyId: '62L-W',
    intervalMs: 5_000,
    now: 10_000,
    root,
  });
  const notDue = await tickScheduledDebriefs({ tenantId, universeId, now: 11_000, root });
  const due = await tickScheduledDebriefs({ tenantId, universeId, now: 16_000, root, accomplishments: ['checkpoint'] });
  check('US-W12', schedule.enabled === true && notDue.due === 0 && due.due === 1 && due.ran[0]?.suspended === true, 'Scheduled debrief/checkpoint cycles fire only when due and remain recommendation-grade.');

  resetTransitCongestion();
  resetAgentPopulation();
  resetFounderDigitalTwins();
  const cycle = await runNeuralTransitCycle({
    founderId: 'founder-devin',
    tenantId,
    universeId,
    storyId: '62L-W',
    objective: 'Carry a governed local transit cycle from Devin through debrief.',
    root,
    now: 100_000,
  });
  check('US-W-pipeline', cycle.status === 'COMPLETED' && cycle.pipeline.join(' → ') === NEURAL_TRANSIT_PIPELINE.join(' → ') && cycle.productionAuthorization === false && cycle.localCloud.cloud === 'UNAVAILABLE' && cycle.twin.canFabricateApproval === false, 'Orchestrator preserves Devin → Twin → Global Brain → … → Brain improvement without fabricated approval or live cloud.');

  if (failures.length) {
    console.error(failures.join('\n'));
    throw new Error(`62L-W tests failed: ${failures.length}`);
  }
  console.log('62L-W safety tests PASS');
} finally {
  await rm(root, { recursive: true, force: true });
}
