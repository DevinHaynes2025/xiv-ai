export type EventClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type OperationalEventKind = 'USAGE' | 'BOOKKEEPING' | 'TASK' | 'MEETING' | 'HEALTH' | 'LEARNING';

export interface PersistenceCrypto {
  hash(value: string): string;
  seal(plaintext: string, context: { tenantId: string; streamId: string; keyId: string }): string;
}

export interface AppendOperationalEvent {
  eventId: string;
  tenantId: string;
  streamId: string;
  kind: OperationalEventKind;
  occurredAt: string;
  classification: EventClassification;
  keyId: string;
  payload: unknown;
  evidenceRefs?: string[];
}

export interface StoredOperationalEvent {
  eventId: string;
  tenantId: string;
  streamId: string;
  sequence: number;
  kind: OperationalEventKind;
  occurredAt: string;
  classification: EventClassification;
  keyId: string;
  payloadHash: string;
  ciphertext: string;
  evidenceRefs: string[];
  previousHash: string | null;
  envelopeHash: string;
}

export interface ReplicationGate {
  adapterId: string;
  status: 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
  approved: boolean;
}

export class EncryptedLocalEventStore {
  private rows = new Map<string, StoredOperationalEvent[]>();
  private eventIds = new Set<string>();

  constructor(private readonly crypto: PersistenceCrypto) {}

  append(input: AppendOperationalEvent): StoredOperationalEvent {
    if (!input.eventId || !input.tenantId || !input.streamId || !input.keyId || !input.occurredAt) throw new Error('event/tenant/stream/key/time required');
    const dedupeKey = `${input.tenantId}:${input.eventId}`;
    if (this.eventIds.has(dedupeKey)) throw new Error('duplicate event id for tenant');
    if (input.kind === 'BOOKKEEPING' && (!input.evidenceRefs || input.evidenceRefs.length === 0)) throw new Error('bookkeeping persistence requires evidence');

    const key = `${input.tenantId}:${input.streamId}`;
    const stream = this.rows.get(key) ?? [];
    const previousHash = stream.length ? stream[stream.length - 1].envelopeHash : null;
    const payloadJson = JSON.stringify(input.payload);
    const payloadHash = this.crypto.hash(payloadJson);
    const ciphertext = this.crypto.seal(payloadJson, { tenantId: input.tenantId, streamId: input.streamId, keyId: input.keyId });
    const sequence = stream.length + 1;
    const evidenceRefs = [...(input.evidenceRefs ?? [])];
    const envelopeHash = this.crypto.hash([input.eventId, input.tenantId, input.streamId, sequence, input.kind, input.occurredAt, input.classification, input.keyId, payloadHash, ciphertext, previousHash ?? '', ...evidenceRefs].join('|'));

    const envelope: StoredOperationalEvent = {
      eventId: input.eventId,
      tenantId: input.tenantId,
      streamId: input.streamId,
      sequence,
      kind: input.kind,
      occurredAt: input.occurredAt,
      classification: input.classification,
      keyId: input.keyId,
      payloadHash,
      ciphertext,
      evidenceRefs,
      previousHash,
      envelopeHash,
    };
    stream.push(envelope);
    this.rows.set(key, stream);
    this.eventIds.add(dedupeKey);
    return { ...envelope, evidenceRefs: [...envelope.evidenceRefs] };
  }

  readStream(tenantId: string, streamId: string, fromSequence = 1): StoredOperationalEvent[] {
    if (!tenantId || !streamId) throw new Error('tenant/stream required');
    return (this.rows.get(`${tenantId}:${streamId}`) ?? []).filter(row => row.sequence >= fromSequence).map(row => ({ ...row, evidenceRefs: [...row.evidenceRefs] }));
  }

  verifyChain(tenantId: string, streamId: string): boolean {
    const stream = this.readStream(tenantId, streamId);
    return stream.every((row, index) => row.sequence === index + 1 && row.previousHash === (index === 0 ? null : stream[index - 1].envelopeHash));
  }

  exportForReplication(tenantId: string, gate: ReplicationGate): StoredOperationalEvent[] {
    if (gate.status !== 'VERIFIED_PARTNER' || !gate.approved) throw new Error('replication requires approved verified-partner adapter');
    const prefix = `${tenantId}:`;
    return [...this.rows.entries()].filter(([key]) => key.startsWith(prefix)).flatMap(([, rows]) => rows).filter(row => row.classification !== 'TOP_SECRET').map(row => ({ ...row, evidenceRefs: [...row.evidenceRefs] }));
  }
}

export const LOCAL_EVENT_STORE_GUARDRAILS = {
  appendOnly: true,
  encryptionRequired: true,
  tenantIsolationRequired: true,
  topSecretExternalReplicationAllowed: false,
  verifiedPartnerReceiptRequiredForReplication: true,
  bookkeepingEvidenceRequired: true,
};
