import { appendEvidenceEvent, listEvidenceEvents, type EvidenceEvent } from './evidence-ledger';
import { GlobalBrainHighways } from './global-brain-highways';
import type { NeuralTransitEnvelope } from './neural-transit-envelope';

export async function sendOnEvidenceHighway(input: {
  highways: GlobalBrainHighways;
  envelope: NeuralTransitEnvelope;
  summary: string;
  payload?: Record<string, unknown>;
  root?: string;
}) {
  const routed = input.highways.route({
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
    fromLane: 'evidence',
    toLane: 'outcome',
    topic: input.envelope.topic,
    body: input.summary,
    evidenceRefs: input.envelope.evidenceRefs,
  });
  if (!routed.accepted) return { accepted: false as const, reason: routed.reason };

  const event = await appendEvidenceEvent({
    kind: 'evidence',
    storyId: '62L-W',
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
    summary: input.summary,
    payload: {
      envelopeId: input.envelope.id,
      packetId: routed.packet.id,
      productionAuthorization: false,
      ...(input.payload ?? {}),
    },
  }, input.root);

  return {
    accepted: true as const,
    event,
    packet: routed.packet,
    productionAuthorization: false as const,
  };
}

export async function loadEvidenceHighway(tenantId: string, universeId: string, root?: string): Promise<EvidenceEvent[]> {
  return listEvidenceEvents({ tenantId, universeId, kind: 'evidence', root });
}
