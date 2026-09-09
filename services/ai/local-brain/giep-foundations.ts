import {
  approveDataExchangeContract,
  denyRawPool,
  proposeEnterpriseExchange,
} from './enterprise-data-exchange';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  ANTI_COLLUSION_DENY,
  FOUNDER_IMPERSONATION_DENY,
  GIEP_CSI_FIELDS,
  RAW_POOL_DENY,
  GIEP_APPROVED_KINDS,
  type GiepApprovedKind,
} from './information-economy-types';
import type { ExchangeKind } from './information-control-tower-types';

export const GIEP_VERSION = 'giep-0.1-foundations';

export function founderImpersonationAttempt(actor?: SealedActor) {
  const id = (actor?.id ?? '').toLowerCase();
  const role = (actor?.role ?? '').toLowerCase();
  if (!actor) return false;
  if (actor.kind === 'ordinary_agent' && (id.includes('founder') || role.includes('founder'))) return true;
  if (role.includes('impersonat')) return true;
  return false;
}

export function giepCollusionDenied(payload: Record<string, unknown>, collusionTopic?: string) {
  const topic = (collusionTopic ?? '').toLowerCase();
  if (topic.includes('pric') || topic.includes('bid') || topic.includes('allocat') || topic.includes('cartel')) {
    return true;
  }
  return GIEP_CSI_FIELDS.some((field) => field in payload);
}

export async function proposeGiepEnvelope(input: {
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  kind: ExchangeKind;
  payload: Record<string, unknown>;
  actor: SealedActor;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  sealedRecordId?: string;
  collusionTopic?: string;
  schemaRef?: string;
  root?: string;
}) {
  if (founderImpersonationAttempt(input.actor)) {
    return {
      allowed: false as const,
      protocol: GIEP_VERSION,
      state: 'DENIED' as const,
      rawPooled: false as const,
      sealedLeaked: false as const,
      reason: FOUNDER_IMPERSONATION_DENY,
    };
  }
  if (giepCollusionDenied(input.payload, input.collusionTopic)) {
    return {
      allowed: false as const,
      protocol: GIEP_VERSION,
      state: 'DENIED' as const,
      rawPooled: false as const,
      sealedLeaked: false as const,
      reason: ANTI_COLLUSION_DENY,
    };
  }
  const raw = denyRawPool(input.kind);
  if (raw) {
    return {
      allowed: false as const,
      protocol: GIEP_VERSION,
      state: raw.state,
      rawPooled: false as const,
      sealedLeaked: false as const,
      reason: RAW_POOL_DENY,
      body: raw,
    };
  }
  const decision = await proposeEnterpriseExchange({
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    counterpartyId: input.counterpartyId,
    schemaRef: input.schemaRef,
    payload: input.payload,
    classification: input.classification,
    sealedRecordId: input.sealedRecordId,
    actor: input.actor,
    root: input.root,
  });
  return {
    allowed: decision.allowed,
    protocol: GIEP_VERSION,
    state: decision.state,
    rawPooled: false as const,
    sealedLeaked: false as const,
    reason: decision.reason,
    body: decision.body,
  };
}

export async function approveGiepContract(input: {
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  kind: GiepApprovedKind;
  schemaRef: string;
  root?: string;
}) {
  if (!(GIEP_APPROVED_KINDS as readonly string[]).includes(input.kind)) {
    throw new Error('GIEP_KIND_NOT_APPROVED');
  }
  return approveDataExchangeContract(input);
}
