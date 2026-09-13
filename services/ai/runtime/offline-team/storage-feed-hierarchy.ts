/**
 * 12D-110: Governed storage feed hierarchy — the LOCAL / OFFLINE-CARRIER / CLOUD tier contract.
 *
 * HONEST STATE: this module decides where XIV artifacts (story records, reports, social
 * archive entries, receipts) MAY live; it does not itself store, export, or upload anything.
 * There is no file I/O, no network call, and no cloud call — routing is a pure gate over
 * caller-supplied descriptors, and the only side effect is an in-memory decision ledger.
 *
 * Hard classification rules: TOP_SECRET is LOCAL-only (it never leaves the local plane —
 * an explicit routing attempt to OFFLINE-CARRIER or CLOUD throws, fail closed);
 * CONFIDENTIAL may be LOCAL or contract-registered CLOUD with an operator receipt
 * (never OFFLINE-CARRIER exportable); ORDINARY may use all three tiers by contract.
 * CLOUD is CONTRACT-ONLY: `registerCloudContract` records an authorization posture
 * (region, retention class, operator authorization ref) and never accepts credentials
 * or calls an endpoint; the returned packet states `cloudTransferPerformed: false` and
 * execution stays with a future, separately audited operator layer.
 */
export type SecurityClass = 'ORDINARY' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type StorageTier = 'LOCAL' | 'OFFLINE_CARRIER' | 'CLOUD';
export type StorageArtifactKind = 'STORY_RECORD' | 'REPORT' | 'SOCIAL_ARCHIVE_ENTRY' | 'RECEIPT';

export interface TierPolicy {
  readonly maxItemBytes: number;
  readonly maxBatchItems: number;
  readonly retentionHint: string;
  readonly permittedClasses: readonly SecurityClass[];
}

export interface ClassificationRule {
  readonly permittedTiers: readonly StorageTier[];
  readonly cloudRequiresRegisteredContract: boolean;
  readonly cloudRequiresOperatorReceipt: boolean;
  readonly exportableOffLocalPlane: boolean;
}

export const STORAGE_TIER_POLICY = Object.freeze({
  LOCAL: Object.freeze({
    maxItemBytes: 2_000_000,
    maxBatchItems: 1_000,
    retentionHint: 'tenant-controlled local retention; this contract performs no deletion and no I/O',
    permittedClasses: Object.freeze(['ORDINARY', 'CONFIDENTIAL', 'TOP_SECRET'] as const),
  }) satisfies TierPolicy,
  OFFLINE_CARRIER: Object.freeze({
    maxItemBytes: 512_000,
    maxBatchItems: 200,
    retentionHint: 'portable export snapshot; retention is the responsibility of the carrier holder',
    permittedClasses: Object.freeze(['ORDINARY'] as const),
  }) satisfies TierPolicy,
  CLOUD: Object.freeze({
    maxItemBytes: 256_000,
    maxBatchItems: 100,
    retentionHint: 'retention class is fixed by the registered cloud contract only',
    permittedClasses: Object.freeze(['ORDINARY', 'CONFIDENTIAL'] as const),
  }) satisfies TierPolicy,
  classificationRules: Object.freeze({
    TOP_SECRET: Object.freeze({
      permittedTiers: Object.freeze(['LOCAL'] as const),
      cloudRequiresRegisteredContract: false,
      cloudRequiresOperatorReceipt: false,
      exportableOffLocalPlane: false,
    }) satisfies ClassificationRule,
    CONFIDENTIAL: Object.freeze({
      permittedTiers: Object.freeze(['LOCAL', 'CLOUD'] as const),
      cloudRequiresRegisteredContract: true,
      cloudRequiresOperatorReceipt: true,
      exportableOffLocalPlane: false,
    }) satisfies ClassificationRule,
    ORDINARY: Object.freeze({
      permittedTiers: Object.freeze(['LOCAL', 'OFFLINE_CARRIER', 'CLOUD'] as const),
      cloudRequiresRegisteredContract: true,
      cloudRequiresOperatorReceipt: false,
      exportableOffLocalPlane: true,
    }) satisfies ClassificationRule,
  }),
});

export const STORAGE_FEED_GUARDRAILS = Object.freeze({
  performsNoIO: true,
  remoteCallsAllowed: false,
  cloudIsContractOnly: true,
  topSecretNeverLeavesLocalPlane: true,
  humanDecision: 'REQUIRED' as const,
});

export interface ArtifactDescriptor {
  kind: StorageArtifactKind;
  securityClass: SecurityClass;
  sizeBytes: number;
  /** sha256 hex digest of the artifact content, computed by the caller; never the content itself. */
  contentHash: string;
  tenantId: string;
  evidenceRefs: readonly string[];
  /** Explicit routing attempt. A TOP_SECRET attempt above LOCAL throws; an attempt on a tier the contract forbids throws. */
  requestedTier?: StorageTier;
}

export interface TierDecision {
  tier: StorageTier;
  allowed: boolean;
  reason: string;
}

export interface RoutingPacket {
  kind: StorageArtifactKind;
  securityClass: SecurityClass;
  sizeBytes: number;
  contentHash: string;
  tenantId: string;
  decisions: Readonly<Record<StorageTier, TierDecision>>;
  realArtifactsStored: 0;
  ioPerformed: false;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
}

export interface CloudContractInput {
  tenantId: string;
  /** Coarse deployment region label, e.g. 'EU-CENTRAL'. No endpoint, no hostname, no credentials. */
  region: string;
  retentionClass: string;
  operatorAuthorizationRef: string;
  purposeRef?: string;
  evidenceRefs?: readonly string[];
}

export interface CloudContractPacket {
  contractId: string;
  tenantId: string;
  region: string;
  retentionClass: string;
  operatorAuthorizationRef: string;
  cloudTransferPerformed: false;
  contractOnly: true;
  endpointsCalled: 0;
  credentialsAccepted: false;
  requiresAuditedOperatorLayerForExecution: true;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
}

const TIERS: readonly StorageTier[] = ['LOCAL', 'OFFLINE_CARRIER', 'CLOUD'];
const CLASSES: readonly SecurityClass[] = ['ORDINARY', 'CONFIDENTIAL', 'TOP_SECRET'];
const KINDS: readonly StorageArtifactKind[] = ['STORY_RECORD', 'REPORT', 'SOCIAL_ARCHIVE_ENTRY', 'RECEIPT'];

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const ref = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 256;
const regionOk = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9-]{2,64}$/.test(v);
const sha256hex = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);

interface TenantLedger {
  routedTotal: number;
  byTier: Record<StorageTier, number>;
  byClass: Record<SecurityClass, number>;
}
const ledgers = new Map<string, TenantLedger>();
const cloudContracts = new Map<string, CloudContractPacket>();
const contractKey = (tenantId: string, region: string, retentionClass: string) => `${tenantId}|${region}|${retentionClass}`;

function validateDescriptor(input: ArtifactDescriptor): void {
  if (!input) throw new Error('artifact descriptor required');
  if (!KINDS.includes(input.kind)) throw new Error(`unknown artifact kind: ${String(input.kind)}`);
  if (!CLASSES.includes(input.securityClass)) throw new Error(`unknown security class: ${String(input.securityClass)}`);
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1) throw new Error('sizeBytes must be a positive integer');
  if (input.sizeBytes > STORAGE_TIER_POLICY.LOCAL.maxItemBytes) throw new Error('artifact exceeds the LOCAL tier item ceiling; nothing may be oversized on any tier');
  if (!sha256hex(input.contentHash)) throw new Error('contentHash must be a lowercase sha256 hex digest (64 hex chars)');
  if (!id(input.tenantId)) throw new Error('tenant identity required');
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.length > 16 || !input.evidenceRefs.every(r => ref(r)))
    throw new Error('bounded evidence refs required');
  if (input.requestedTier !== undefined && !TIERS.includes(input.requestedTier)) throw new Error(`unknown storage tier: ${String(input.requestedTier)}`);
}

function decideTier(tier: StorageTier, securityClass: SecurityClass, sizeBytes: number, tenantHasCloudContract: boolean): TierDecision {
  const policy = STORAGE_TIER_POLICY[tier];
  const rule = STORAGE_TIER_POLICY.classificationRules[securityClass];
  if (!(policy.permittedClasses as readonly SecurityClass[]).includes(securityClass)) {
    if (securityClass === 'TOP_SECRET')
      return { tier, allowed: false, reason: 'TOP_SECRET is LOCAL-only; it never leaves the local plane' };
    if (tier === 'OFFLINE_CARRIER')
      return { tier, allowed: false, reason: 'CONFIDENTIAL is LOCAL or contract-registered CLOUD with an operator receipt; never OFFLINE-CARRIER exportable' };
  }
  if (sizeBytes > policy.maxItemBytes)
    return { tier, allowed: false, reason: `artifact exceeds the ${tier} tier item ceiling of ${policy.maxItemBytes} bytes` };
  if (tier === 'CLOUD' && rule.cloudRequiresRegisteredContract && !tenantHasCloudContract)
    return { tier, allowed: false, reason: 'no operator-authorized cloud contract registered for this tenant; CLOUD is contract-only' };
  return { tier, allowed: true, reason: 'permitted by the storage tier contract' };
}

/**
 * Pure routing gate over a caller-supplied descriptor: no I/O, no network, no cloud call.
 * Records the decision in the in-memory ledger so `feedSnapshot` can summarize honestly.
 */
export function routeArtifactToTiers(input: ArtifactDescriptor): Readonly<RoutingPacket> {
  validateDescriptor(input);
  const tenantHasCloudContract = cloudContracts.size > 0 && [...cloudContracts.keys()].some(k => k.startsWith(`${input.tenantId}|`));
  const decisions = {} as Record<StorageTier, TierDecision>;
  for (const tier of TIERS) decisions[tier] = decideTier(tier, input.securityClass, input.sizeBytes, tenantHasCloudContract);
  if (input.requestedTier !== undefined) {
    const d = decisions[input.requestedTier];
    if (input.securityClass === 'TOP_SECRET' && input.requestedTier !== 'LOCAL')
      throw new Error(`TOP_SECRET may not be routed above the LOCAL plane (${input.requestedTier} attempt refused; fail closed)`);
    if (!d.allowed) throw new Error(`routing attempt refused by contract for tier ${input.requestedTier}: ${d.reason}`);
  }
  let ledger = ledgers.get(input.tenantId);
  if (!ledger) {
    ledger = { routedTotal: 0, byTier: { LOCAL: 0, OFFLINE_CARRIER: 0, CLOUD: 0 }, byClass: { ORDINARY: 0, CONFIDENTIAL: 0, TOP_SECRET: 0 } };
    ledgers.set(input.tenantId, ledger);
  }
  ledger.routedTotal += 1;
  ledger.byClass[input.securityClass] += 1;
  for (const tier of TIERS) if (decisions[tier].allowed) ledger.byTier[tier] += 1;
  return Object.freeze({
    kind: input.kind, securityClass: input.securityClass, sizeBytes: input.sizeBytes,
    contentHash: input.contentHash, tenantId: input.tenantId,
    decisions: Object.freeze({
      LOCAL: Object.freeze(decisions.LOCAL),
      OFFLINE_CARRIER: Object.freeze(decisions.OFFLINE_CARRIER),
      CLOUD: Object.freeze(decisions.CLOUD),
    }),
    realArtifactsStored: 0 as const, ioPerformed: false as const,
    humanDecision: 'REQUIRED' as const, learningPromoted: false as const,
  });
}

/**
 * Record a contract-only cloud registration. Nothing is sent anywhere: no endpoint is
 * contacted, no credential is accepted (credential-shaped fields throw), and the packet
 * states `cloudTransferPerformed: false`. Executing such a contract belongs to a future,
 * separately audited operator layer with its own human decision.
 */
export function registerCloudContract(input: CloudContractInput): Readonly<CloudContractPacket> {
  if (!input) throw new Error('cloud contract input required');
  for (const forbidden of ['credentials', 'apiKey', 'secret', 'endpoint', 'endpointUrl'] as const)
    if (forbidden in input) throw new Error(`cloud contracts accept no ${forbidden}; CLOUD is contract-only in this module`);
  if (!id(input.tenantId)) throw new Error('tenant identity required');
  if (!regionOk(input.region)) throw new Error('bounded region label required (letters, digits, dashes; 2-64 chars; no endpoint)');
  if (!ref(input.retentionClass) || !/^[A-Za-z0-9_.:-]{1,64}$/.test(input.retentionClass)) throw new Error('bounded retention class required');
  if (!ref(input.operatorAuthorizationRef)) throw new Error('operatorAuthorizationRef required; a cloud contract without a human operator receipt is not registrable');
  if (input.purposeRef !== undefined && !ref(input.purposeRef)) throw new Error('bounded purpose ref required');
  if (input.evidenceRefs !== undefined && (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.length > 16 || !input.evidenceRefs.every(r => ref(r))))
    throw new Error('bounded evidence refs required');
  const key = contractKey(input.tenantId, input.region, input.retentionClass);
  if (cloudContracts.has(key)) throw new Error('cloud contract already registered for this tenant, region, and retention class');
  const contractId = `cloud-contract:${input.tenantId}:${input.region}:${input.retentionClass}`.slice(0, 128);
  const packet: CloudContractPacket = {
    contractId, tenantId: input.tenantId, region: input.region, retentionClass: input.retentionClass,
    operatorAuthorizationRef: input.operatorAuthorizationRef,
    cloudTransferPerformed: false, contractOnly: true, endpointsCalled: 0, credentialsAccepted: false,
    requiresAuditedOperatorLayerForExecution: true, humanDecision: 'REQUIRED', learningPromoted: false,
  };
  cloudContracts.set(key, packet);
  return Object.freeze(packet);
}

function tenantCloudContractCount(tenantId: string): number {
  let n = 0;
  for (const k of cloudContracts.keys()) if (k.startsWith(`${tenantId}|`)) n += 1;
  return n;
}

/** Honest summary of routing decisions recorded for a tenant. Never claims stored content. */
export function feedSnapshot(tenantId: string): Readonly<{
  tenantId: string;
  routed: { total: number; byTier: Readonly<Record<StorageTier, number>>; byClass: Readonly<Record<SecurityClass, number>> };
  cloudContractsRegistered: number;
  realArtifactsStored: 0;
  cloudTransferPerformed: false;
  remoteCallsPerformed: 0;
  ioPerformed: false;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
  guardrails: typeof STORAGE_FEED_GUARDRAILS;
}> {
  if (!id(tenantId)) throw new Error('tenant identity required');
  const ledger = ledgers.get(tenantId);
  const empty = { LOCAL: 0, OFFLINE_CARRIER: 0, CLOUD: 0 } as Record<StorageTier, number>;
  const emptyClass = { ORDINARY: 0, CONFIDENTIAL: 0, TOP_SECRET: 0 } as Record<SecurityClass, number>;
  return Object.freeze({
    tenantId,
    routed: Object.freeze({
      total: ledger?.routedTotal ?? 0,
      byTier: Object.freeze(ledger ? { ...ledger.byTier } : empty),
      byClass: Object.freeze(ledger ? { ...ledger.byClass } : emptyClass),
    }),
    cloudContractsRegistered: tenantCloudContractCount(tenantId),
    realArtifactsStored: 0 as const,
    cloudTransferPerformed: false as const,
    remoteCallsPerformed: 0 as const,
    ioPerformed: false as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    guardrails: STORAGE_FEED_GUARDRAILS,
  });
}