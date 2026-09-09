/**
 * 62L-BN Global Knowledge Circulation.
 * Reuses BM federation rules from org-neural-federation / cross-universe-knowledge-exchange:
 * no default raw private pooling; approved derived / permissioned only.
 */

import {
  BM_LOCKS,
  FOUNDER_SEALED_DENIED,
  RAW_PRIVATE_EXCHANGE_DENIED,
} from './org-neural-federation-types';
import { cortexId } from './cortex-store';
import {
  BN_LOCKS,
  type KnowledgeCirculationClass,
} from './superbrain-neural-growth-types';

export type KnowledgeCirculationPacket = {
  id: string;
  tenantId: string;
  universeId: string;
  classification: KnowledgeCirculationClass;
  title: string;
  derivedFromRefs: string[];
  approvedForCirculation: boolean;
  rawPrivate: boolean;
  circulated: boolean;
  reason: string;
  createdAt: string;
};

export type CirculationResult = {
  accepted: boolean;
  packet: KnowledgeCirculationPacket | null;
  state: 'CIRCULATED' | 'DENIED' | 'UNAVAILABLE' | 'WAITING_DATA';
  reason: string;
};

const packets: KnowledgeCirculationPacket[] = [];

function nowIso() {
  return new Date().toISOString();
}

export function resetKnowledgeCirculation() {
  packets.length = 0;
}

export function circulateKnowledge(input: {
  tenantId: string;
  universeId: string;
  classification: KnowledgeCirculationClass;
  title: string;
  derivedFromRefs?: string[];
  approvedForCirculation?: boolean;
  attemptRawPrivatePool?: boolean;
}): CirculationResult {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');

  if (input.attemptRawPrivatePool === true || input.classification === 'private_raw') {
    const packet: KnowledgeCirculationPacket = {
      id: cortexId('bn_know'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      classification: 'private_raw',
      title: input.title,
      derivedFromRefs: input.derivedFromRefs ?? [],
      approvedForCirculation: false,
      rawPrivate: true,
      circulated: false,
      reason: RAW_PRIVATE_EXCHANGE_DENIED,
      createdAt: nowIso(),
    };
    packets.push(packet);
    return {
      accepted: false,
      packet,
      state: 'DENIED',
      reason: RAW_PRIVATE_EXCHANGE_DENIED,
    };
  }

  if (input.classification === 'founder_sealed') {
    const packet: KnowledgeCirculationPacket = {
      id: cortexId('bn_know'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      classification: 'founder_sealed',
      title: input.title,
      derivedFromRefs: input.derivedFromRefs ?? [],
      approvedForCirculation: false,
      rawPrivate: false,
      circulated: false,
      reason: FOUNDER_SEALED_DENIED,
      createdAt: nowIso(),
    };
    packets.push(packet);
    return {
      accepted: false,
      packet,
      state: 'DENIED',
      reason: FOUNDER_SEALED_DENIED,
    };
  }

  const approved =
    input.approvedForCirculation === true &&
    (input.classification === 'public_approved' ||
      input.classification === 'derived_aggregate' ||
      input.classification === 'permissioned_schema');

  if (!approved) {
    const packet: KnowledgeCirculationPacket = {
      id: cortexId('bn_know'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      classification: input.classification,
      title: input.title,
      derivedFromRefs: input.derivedFromRefs ?? [],
      approvedForCirculation: false,
      rawPrivate: false,
      circulated: false,
      reason: 'CIRCULATION_REQUIRES_APPROVED_DERIVED_OR_PERMISSIONED',
      createdAt: nowIso(),
    };
    packets.push(packet);
    return {
      accepted: false,
      packet,
      state: 'DENIED',
      reason: packet.reason,
    };
  }

  if (BN_LOCKS.RAW_PRIVATE_KNOWLEDGE_POOLING || BM_LOCKS.RAW_PRIVATE_GLOBAL_POOL_DEFAULT) {
    return {
      accepted: false,
      packet: null,
      state: 'DENIED',
      reason: 'LOCK_VIOLATION_RAW_PRIVATE_POOLING',
    };
  }

  const packet: KnowledgeCirculationPacket = {
    id: cortexId('bn_know'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    classification: input.classification,
    title: input.title,
    derivedFromRefs: input.derivedFromRefs ?? [],
    approvedForCirculation: true,
    rawPrivate: false,
    circulated: true,
    reason: 'GOVERNED_APPROVED_DERIVED_CIRCULATION',
    createdAt: nowIso(),
  };
  packets.push(packet);
  return {
    accepted: true,
    packet,
    state: 'CIRCULATED',
    reason: packet.reason,
  };
}

export function listCirculationPackets() {
  return [...packets];
}

export function knowledgeCirculationHonesty() {
  return {
    rawPrivateKnowledgePooling: BN_LOCKS.RAW_PRIVATE_KNOWLEDGE_POOLING,
    bmRawPrivateGlobalPoolDefault: BM_LOCKS.RAW_PRIVATE_GLOBAL_POOL_DEFAULT,
    bmRawPrivateExchangeDefault: BM_LOCKS.RAW_PRIVATE_EXCHANGE_DEFAULT,
    founderSealedDenyByDefault: BN_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    privacyOverSpeedOrPrice: BN_LOCKS.PRIVACY_OVER_SPEED_OR_PRICE,
    productionAuthorization: false as const,
    note: 'Reuses BM federation posture (org-neural-federation-types): no default raw private pooling; approved derived only.',
  };
}
