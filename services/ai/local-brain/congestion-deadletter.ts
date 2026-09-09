import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { NeuralTransitEnvelope } from './neural-transit-envelope';

export type DeadLetterReason =
  | 'CONGESTED'
  | 'UNKNOWN_ROUTE'
  | 'EXPIRED'
  | 'CLOUD_UNAVAILABLE'
  | 'CROSS_UNIVERSE'
  | 'POLICY_DENIED';

export type DeadLetterRecord = {
  id: string;
  envelopeId: string;
  tenantId: string;
  universeId: string;
  reason: DeadLetterReason;
  topic: string;
  createdAt: string;
  productionAuthorization: false;
};

export type TransitQueueStats = {
  inflight: number;
  maxInflight: number;
  deadLetters: number;
  congested: boolean;
};

const DEFAULT_MAX_INFLIGHT = 32;
const inflight = new Map<string, NeuralTransitEnvelope>();
const deadLetters: DeadLetterRecord[] = [];

function deadLetterPath(root: string) {
  return xivLocalPath(root, 'neural-transit-dead-letters.json');
}

export function resetTransitCongestion() {
  inflight.clear();
  deadLetters.length = 0;
}

export function congestionStats(): TransitQueueStats {
  return {
    inflight: inflight.size,
    maxInflight: DEFAULT_MAX_INFLIGHT,
    deadLetters: deadLetters.length,
    congested: inflight.size >= DEFAULT_MAX_INFLIGHT,
  };
}

export async function enqueueTransit(envelope: NeuralTransitEnvelope, input?: {
  knownRoute?: boolean;
  now?: number;
  root?: string;
}) {
  const now = input?.now ?? Date.now();
  if (Date.parse(envelope.expiresAt) <= now) {
    return deadLetter(envelope, 'EXPIRED', input?.root);
  }
  if (input?.knownRoute === false) {
    return deadLetter(envelope, 'UNKNOWN_ROUTE', input?.root);
  }
  if (envelope.partition === 'cloud') {
    return deadLetter(envelope, 'CLOUD_UNAVAILABLE', input?.root);
  }
  if (inflight.size >= DEFAULT_MAX_INFLIGHT) {
    return deadLetter(envelope, 'CONGESTED', input?.root);
  }
  inflight.set(envelope.id, envelope);
  return { accepted: true as const, envelope, congestion: congestionStats() };
}

export function completeTransit(envelopeId: string) {
  inflight.delete(envelopeId);
  return congestionStats();
}

async function deadLetter(envelope: NeuralTransitEnvelope, reason: DeadLetterReason, root?: string) {
  const record: DeadLetterRecord = {
    id: `dl_${envelope.id}`,
    envelopeId: envelope.id,
    tenantId: envelope.tenantId,
    universeId: envelope.universeId,
    reason,
    topic: envelope.topic,
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  deadLetters.push(record);
  if (root) {
    const existing = await readJsonFile<{ records: DeadLetterRecord[] }>(deadLetterPath(root), { records: [] });
    const records = Array.isArray(existing.records) ? existing.records : [];
    records.push(record);
    await writeJsonFileAtomic(deadLetterPath(root), { records: records.slice(-2_000) });
  }
  return { accepted: false as const, deadLetter: record, congestion: congestionStats() };
}

export function listDeadLetters(tenantId: string, universeId: string) {
  return deadLetters.filter((item) => item.tenantId === tenantId && item.universeId === universeId);
}
