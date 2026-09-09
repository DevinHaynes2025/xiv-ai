import { appendLearning } from './learning-ledger';
import { GlobalBrainHighways } from './global-brain-highways';
import type { NeuralTransitEnvelope } from './neural-transit-envelope';

export async function returnLearningToBrain(input: {
  highways: GlobalBrainHighways;
  envelope: NeuralTransitEnvelope;
  summary: string;
  claimState?: 'MODEL_INFERENCE' | 'VERIFIED_FACT' | 'UNKNOWN';
  root?: string;
}) {
  const learning = await appendLearning({
    domain: 'technology',
    subject: `transit:${input.envelope.topic}`,
    claimState: input.claimState ?? 'MODEL_INFERENCE',
    summary: input.summary,
    sourceRefs: [input.envelope.id, ...input.envelope.evidenceRefs],
    evidence: [input.envelope.body.slice(0, 500)],
    confidence: 0.4,
    taskId: input.envelope.id,
  }, input.root);

  const routed = input.highways.route({
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
    fromLane: 'learning',
    toLane: 'debrief',
    topic: 'learning-return',
    body: learning.id,
    evidenceRefs: [learning.id],
  });

  return {
    learning,
    routed: routed.accepted,
    productionAuthorization: false as const,
    productionChange: false as const,
  };
}
