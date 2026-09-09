/**
 * 62L-BX Provenance-aware Business Knowledge Broadcasting Network.
 * Broadcast derived/authorized knowledge with provenance; not raw private pooling by default.
 * Unverified/no-provenance → DENIED; external publish → DENIED without human gate.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BX_LOCKS,
  BROADCAST_NO_PROVENANCE_DENIED,
  EXTERNAL_PUBLISH_NEEDS_HUMAN_GATE,
  HONESTY_BANNER,
  containsForbiddenPrivateFields,
  type BxActor,
  type ConfidenceLabel,
} from './neural-chip-os-semiconductor-twin-types';

export type KnowledgePacket = {
  id: string;
  title: string;
  summary: string;
  provenance: string[];
  confidence: ConfidenceLabel;
  verified: boolean;
  sealed: boolean;
  scope: 'internal' | 'external';
  status: 'BROADCAST_OK' | 'DENIED' | 'PENDING_HUMAN_GATE';
  reason: string | null;
  humanGateApproved: boolean;
  productionAuthorized: false;
  createdAt: string;
  actorId: string;
};

type Store = {
  packets: KnowledgePacket[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'business-knowledge-broadcast.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packets: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Broadcast knowledge — requires provenance; unverified denied; external needs human gate. */
export async function broadcastKnowledge(input: {
  title: string;
  summary: string;
  provenance?: string[];
  confidence?: ConfidenceLabel;
  verified?: boolean;
  sealed?: boolean;
  scope?: 'internal' | 'external';
  humanGateApproved?: boolean;
  privateFields?: Record<string, unknown>;
  actor: BxActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const provenance = input.provenance ?? [];
  const scope = input.scope ?? 'internal';
  const verified = Boolean(input.verified);
  const humanGate = Boolean(input.humanGateApproved);

  if (containsForbiddenPrivateFields(input.privateFields)) {
    const packet: KnowledgePacket = {
      id: id('bcast'),
      title: input.title.trim(),
      summary: input.summary.trim(),
      provenance,
      confidence: input.confidence ?? 'unverified',
      verified: false,
      sealed: Boolean(input.sealed),
      scope,
      status: 'DENIED',
      reason: 'HIDDEN_REASONING_TRACE_REJECTED',
      humanGateApproved: false,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.packets.push(packet);
    await save(root, store);
    return { accepted: false as const, packet, reason: packet.reason };
  }

  if (provenance.length === 0 || !verified) {
    const packet: KnowledgePacket = {
      id: id('bcast'),
      title: input.title.trim(),
      summary: input.summary.trim(),
      provenance,
      confidence: input.confidence ?? 'unverified',
      verified: false,
      sealed: Boolean(input.sealed),
      scope,
      status: 'DENIED',
      reason: BROADCAST_NO_PROVENANCE_DENIED,
      humanGateApproved: false,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.packets.push(packet);
    await save(root, store);
    return { accepted: false as const, packet, reason: packet.reason };
  }

  if (input.sealed && input.actor.kind !== 'ceo_principal' && input.actor.kind !== 'human_operator') {
    const packet: KnowledgePacket = {
      id: id('bcast'),
      title: input.title.trim(),
      summary: input.summary.trim(),
      provenance,
      confidence: input.confidence ?? 'evidence_backed',
      verified,
      sealed: true,
      scope,
      status: 'DENIED',
      reason: 'SEALED_KNOWLEDGE_BROADCAST_DENIED',
      humanGateApproved: false,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.packets.push(packet);
    await save(root, store);
    return { accepted: false as const, packet, reason: packet.reason };
  }

  if (scope === 'external' && !humanGate) {
    const packet: KnowledgePacket = {
      id: id('bcast'),
      title: input.title.trim(),
      summary: input.summary.trim(),
      provenance,
      confidence: input.confidence ?? 'evidence_backed',
      verified,
      sealed: Boolean(input.sealed),
      scope: 'external',
      status: 'DENIED',
      reason: EXTERNAL_PUBLISH_NEEDS_HUMAN_GATE,
      humanGateApproved: false,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.packets.push(packet);
    await save(root, store);
    return { accepted: false as const, packet, reason: packet.reason };
  }

  const packet: KnowledgePacket = {
    id: id('bcast'),
    title: input.title.trim(),
    summary: input.summary.trim(),
    provenance,
    confidence: input.confidence ?? 'evidence_backed',
    verified,
    sealed: Boolean(input.sealed),
    scope,
    status: scope === 'external' ? 'PENDING_HUMAN_GATE' : 'BROADCAST_OK',
    reason: null,
    humanGateApproved: humanGate,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };

  // External with human gate is OK to mark BROADCAST_OK after gate.
  if (scope === 'external' && humanGate) {
    packet.status = 'BROADCAST_OK';
  }

  store.packets.push(packet);
  if (store.packets.length > 5_000) store.packets = store.packets.slice(-5_000);
  await save(root, store);
  return { accepted: true as const, packet, reason: null };
}

export async function listBroadcastPackets(root = process.cwd()) {
  const store = await load(root);
  return store.packets;
}

export function broadcastHonesty() {
  return {
    banner: HONESTY_BANNER,
    L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
    unverifiedBroadcast: BX_LOCKS.UNVERIFIED_KNOWLEDGE_BROADCAST,
    externalWithoutGate: BX_LOCKS.EXTERNAL_PUBLISH_WITHOUT_HUMAN_GATE,
    rawPrivatePoolingDefault: BX_LOCKS.RAW_PRIVATE_KNOWLEDGE_POOLING_DEFAULT,
    provenanceRequired: BX_LOCKS.PROVENANCE_REQUIRED_FOR_BROADCAST,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
