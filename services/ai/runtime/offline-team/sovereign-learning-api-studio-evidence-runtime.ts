export type Classification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type SensitiveDataClass = 'GENERAL' | 'HEALTH' | 'FINANCIAL' | 'GENETIC' | 'COMMUNICATIONS' | 'SOCIAL_ACCOUNT';
export type ApiPlane = 'LOCAL' | 'PRIVATE' | 'HYBRID';
export type VendorState = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type ComputeBackend = 'CPU' | 'GPU';

export interface EvidenceReceipt {
  receiptRef: string;
  subjectId: string;
  observedAt: string;
  expiresAt?: string;
  revoked?: boolean;
}

export interface ComputeEvidence {
  cpuRuntime?: EvidenceReceipt;
  gpuHardware?: EvidenceReceipt;
  gpuRuntime?: EvidenceReceipt;
  gpuBenchmark?: EvidenceReceipt;
  gpuExecution?: EvidenceReceipt;
}

export interface ComputePlan {
  backend: ComputeBackend;
  cpuVerified: boolean;
  gpuEligible: boolean;
  gpuExecutionVerified: boolean;
  evidenceRefs: string[];
  reason: string;
}

function current(receipt: EvidenceReceipt | undefined, now: string): boolean {
  if (!receipt || receipt.revoked) return false;
  if (!receipt.receiptRef || !receipt.subjectId || !receipt.observedAt) return false;
  return !receipt.expiresAt || Date.parse(receipt.expiresAt) > Date.parse(now);
}

export function chooseComputePlan(
  subjectId: string,
  requested: ComputeBackend,
  evidence: ComputeEvidence,
  now = new Date().toISOString(),
): ComputePlan {
  const cpuVerified = current(evidence.cpuRuntime, now) && evidence.cpuRuntime?.subjectId === subjectId;
  const gpuReceipts = [evidence.gpuHardware, evidence.gpuRuntime, evidence.gpuBenchmark];
  const gpuEligible = gpuReceipts.every(r => current(r, now) && r?.subjectId === subjectId);
  const gpuExecutionVerified = gpuEligible && current(evidence.gpuExecution, now) && evidence.gpuExecution?.subjectId === subjectId;
  const evidenceRefs = [evidence.cpuRuntime, ...gpuReceipts, evidence.gpuExecution]
    .filter((r): r is EvidenceReceipt => !!r && current(r, now) && r.subjectId === subjectId)
    .map(r => r.receiptRef);

  if (requested === 'GPU' && gpuEligible) {
    return {
      backend: 'GPU',
      cpuVerified,
      gpuEligible: true,
      gpuExecutionVerified,
      evidenceRefs,
      reason: gpuExecutionVerified ? 'GPU_ELIGIBLE_AND_EXECUTION_EVIDENCED' : 'GPU_ELIGIBLE_EXECUTION_NOT_YET_EVIDENCED',
    };
  }

  return {
    backend: 'CPU',
    cpuVerified,
    gpuEligible,
    gpuExecutionVerified,
    evidenceRefs,
    reason: requested === 'GPU' ? 'GPU_EVIDENCE_INCOMPLETE_CPU_FALLBACK' : 'CPU_FIRST_BASELINE',
  };
}

export interface AuthorizationReceipt {
  authorizationRef: string;
  tenantId: string;
  userId: string;
  explicitUserAuthorization: boolean;
  scopes: string[];
  dataClasses: SensitiveDataClass[];
  jurisdiction: string;
  jurisdictionPolicyRef: string;
  legalReviewRef: string;
  externalRoutingAllowed: boolean;
  observedAt: string;
  expiresAt?: string;
  revoked?: boolean;
}

export interface PartnerAdapterReceipt {
  vendorId: string;
  state: VendorState;
  apiReceiptRef?: string;
  agreementReceiptRef?: string;
  verificationReceiptRef?: string;
  expiresAt?: string;
  revoked?: boolean;
}

export interface ApiStudioRoute {
  routeId: string;
  tenantId: string;
  plane: ApiPlane;
  classification: Classification;
  dataClass: SensitiveDataClass;
  requiredScopes: string[];
  jurisdiction: string;
  vendorId?: string;
}

export interface ApiRouteDecision {
  allowed: boolean;
  reason: string;
  plane: ApiPlane;
  externalRoute: boolean;
  evidenceRefs: string[];
  financialAuthority: {
    unrestrictedBankAccess: false;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
  };
}

function authorizationCurrent(auth: AuthorizationReceipt, route: ApiStudioRoute, now: string): boolean {
  if (auth.revoked || !auth.explicitUserAuthorization) return false;
  if (auth.tenantId !== route.tenantId || auth.jurisdiction !== route.jurisdiction) return false;
  if (!auth.authorizationRef || !auth.jurisdictionPolicyRef || !auth.legalReviewRef) return false;
  if (auth.expiresAt && Date.parse(auth.expiresAt) <= Date.parse(now)) return false;
  if (!route.requiredScopes.every(scope => auth.scopes.includes(scope))) return false;
  return auth.dataClasses.includes(route.dataClass) || route.dataClass === 'GENERAL';
}

function verifiedPartner(adapter: PartnerAdapterReceipt | undefined, now: string): boolean {
  if (!adapter || adapter.revoked || adapter.state !== 'VERIFIED_PARTNER') return false;
  if (!adapter.apiReceiptRef || !adapter.agreementReceiptRef || !adapter.verificationReceiptRef) return false;
  return !adapter.expiresAt || Date.parse(adapter.expiresAt) > Date.parse(now);
}

export function authorizeApiStudioRoute(
  route: ApiStudioRoute,
  auth: AuthorizationReceipt,
  adapter?: PartnerAdapterReceipt,
  now = new Date().toISOString(),
): ApiRouteDecision {
  const financialAuthority = {
    unrestrictedBankAccess: false,
    canMoveMoney: false,
    canOpenAccounts: false,
    canSignContracts: false,
  } as const;

  if (!authorizationCurrent(auth, route, now)) {
    return { allowed: false, reason: 'AUTHORIZATION_OR_POLICY_INVALID', plane: route.plane, externalRoute: false, evidenceRefs: [], financialAuthority };
  }

  const baseEvidence = [auth.authorizationRef, auth.jurisdictionPolicyRef, auth.legalReviewRef];

  if (route.classification === 'TOP_SECRET' && route.plane !== 'LOCAL') {
    return { allowed: false, reason: 'TOP_SECRET_LOCAL_ONLY', plane: route.plane, externalRoute: false, evidenceRefs: baseEvidence, financialAuthority };
  }

  if (route.plane === 'HYBRID') {
    if (!auth.externalRoutingAllowed) {
      return { allowed: false, reason: 'USER_DID_NOT_AUTHORIZE_EXTERNAL_ROUTING', plane: route.plane, externalRoute: false, evidenceRefs: baseEvidence, financialAuthority };
    }
    if (!route.vendorId || adapter?.vendorId !== route.vendorId || !verifiedPartner(adapter, now)) {
      return { allowed: false, reason: 'VERIFIED_PARTNER_EVIDENCE_REQUIRED', plane: route.plane, externalRoute: false, evidenceRefs: baseEvidence, financialAuthority };
    }
    return {
      allowed: true,
      reason: 'AUTHORIZED_VERIFIED_PARTNER_ROUTE',
      plane: route.plane,
      externalRoute: true,
      evidenceRefs: [...baseEvidence, adapter.apiReceiptRef!, adapter.agreementReceiptRef!, adapter.verificationReceiptRef!],
      financialAuthority,
    };
  }

  return { allowed: true, reason: 'AUTHORIZED_SOVEREIGN_ROUTE', plane: route.plane, externalRoute: false, evidenceRefs: baseEvidence, financialAuthority };
}

export interface VaultAccessAttestation {
  tenantId: string;
  secretId: string;
  actorId: string;
  accessMode: 'CEO' | 'DELEGATED';
  delegatedScopes?: string[];
  requestedScopes: string[];
  auditReceiptRef: string;
  expiresAt?: string;
  revoked?: boolean;
}

export function validateVaultAccess(attestation: VaultAccessAttestation, now = new Date().toISOString()) {
  if (attestation.revoked || !attestation.auditReceiptRef) return false;
  if (attestation.expiresAt && Date.parse(attestation.expiresAt) <= Date.parse(now)) return false;
  if (attestation.accessMode === 'DELEGATED') {
    const granted = attestation.delegatedScopes ?? [];
    return attestation.requestedScopes.every(scope => granted.includes(scope));
  }
  return true;
}

export const VAULT_OUTPUT_POLICY = {
  plaintextSecretInLogs: false,
  plaintextSecretInEmbeddings: false,
  plaintextSecretInClientRendering: false,
  opaqueHandlePreferred: true,
} as const;

export interface GovernedAgentProfile {
  agentId: string;
  role: string;
  memoryNamespace: string;
  goals: string[];
  policies: string[];
  consciousnessClaim: false;
  freeWillClaim: false;
  independentLegalAuthority: false;
}

export function validateAgentTeam(agents: GovernedAgentProfile[]): boolean {
  if (agents.length < 2 || agents.length > 8) return false;
  const ids = new Set(agents.map(a => a.agentId));
  const namespaces = new Set(agents.map(a => a.memoryNamespace));
  if (ids.size !== agents.length || namespaces.size !== agents.length) return false;
  return agents.every(a => !!a.role && a.goals.length > 0 && a.policies.length > 0 && !a.consciousnessClaim && !a.freeWillClaim && !a.independentLegalAuthority);
}

export interface LearningCandidate {
  candidateId: string;
  tenantId: string;
  agentId: string;
  memoryNamespace: string;
  classification: Classification;
  dataClass: SensitiveDataClass;
  sourceRefs: string[];
  evaluationRefs: string[];
  evaluationScore: number;
  authorizationRef?: string;
  privacyReviewRef: string;
  securityReviewRef: string;
  modelWeightMutationRequested: boolean;
}

export interface LearningPromotionReceipt {
  candidateId: string;
  decision: 'REJECT' | 'SANDBOX' | 'PROMOTE_PRIVATE_MEMORY';
  lineageKind: 'CONFIGURATION_CAPABILITY_PROVENANCE';
  evidenceRefs: string[];
  ordinaryEmbeddingEligible: boolean;
  modelWeightsMutated: false;
  graphEdgeIsFact: false;
  correlationIsCausation: false;
}

export function evaluateLearningCandidate(candidate: LearningCandidate): LearningPromotionReceipt {
  const evidenceRefs = [...candidate.sourceRefs, ...candidate.evaluationRefs, candidate.privacyReviewRef, candidate.securityReviewRef]
    .filter(Boolean);
  const sensitive = candidate.dataClass !== 'GENERAL';
  const complete = candidate.sourceRefs.length > 0 && candidate.evaluationRefs.length > 0 && !!candidate.privacyReviewRef && !!candidate.securityReviewRef;

  let decision: LearningPromotionReceipt['decision'] = 'SANDBOX';
  if (candidate.modelWeightMutationRequested || !complete || (sensitive && !candidate.authorizationRef)) decision = 'REJECT';
  else if (candidate.evaluationScore >= 0.9) decision = 'PROMOTE_PRIVATE_MEMORY';

  if (candidate.authorizationRef) evidenceRefs.push(candidate.authorizationRef);

  return {
    candidateId: candidate.candidateId,
    decision,
    lineageKind: 'CONFIGURATION_CAPABILITY_PROVENANCE',
    evidenceRefs,
    ordinaryEmbeddingEligible: candidate.classification !== 'TOP_SECRET',
    modelWeightsMutated: false,
    graphEdgeIsFact: false,
    correlationIsCausation: false,
  };
}

export interface SharedLearningSignal {
  signalId: string;
  cohortSize: number;
  minimized: boolean;
  anonymized: boolean;
  aggregated: boolean;
  containsRawPrivateRecords: boolean;
  containsDirectIdentifiers: boolean;
  classification: Classification;
  policyReceiptRef: string;
  evidenceRefs: string[];
}

export function sharedLearningAllowed(signal: SharedLearningSignal): boolean {
  return signal.cohortSize >= 5
    && signal.minimized
    && signal.anonymized
    && signal.aggregated
    && !signal.containsRawPrivateRecords
    && !signal.containsDirectIdentifiers
    && signal.classification !== 'TOP_SECRET'
    && !!signal.policyReceiptRef
    && signal.evidenceRefs.length > 0;
}

export interface ContentFreeUsageEvent {
  tenantId: string;
  pseudonymousUserId: string;
  sessionId: string;
  feature: string;
  surface: string;
  kind: 'VIEW' | 'FEATURE_USE';
  evidenceRef: string;
}

export function summarizeUsage(events: ContentFreeUsageEvent[]) {
  const uniqueUsers = new Set(events.map(e => e.pseudonymousUserId)).size;
  const sessions = new Set(events.map(e => e.sessionId)).size;
  const views = events.filter(e => e.kind === 'VIEW').length;
  const featureUses = events.filter(e => e.kind === 'FEATURE_USE').length;
  const features: Record<string, number> = {};
  for (const event of events.filter(e => e.kind === 'FEATURE_USE')) features[event.feature] = (features[event.feature] ?? 0) + 1;
  return { views, uniqueUsers, sessions, featureUses, features, contentLogged: false as const };
}

export const SOVEREIGN_RUNTIME_GROUNDING = {
  twelveDMeans: 'SEMANTIC_COMPUTATIONAL_DIMENSIONS',
  parallelUniversesMean: 'DETERMINISTIC_SIMULATIONS_DIGITAL_TWINS',
  quantumDefault: 'SIMULATOR_ADAPTER_RESEARCH_UNLESS_QPU_AND_BENCHMARK_EVIDENCE',
  dataGenomeMeans: 'VERSIONED_CONFIGURATION_CAPABILITY_PROVENANCE',
  historicalPeople: 'SOURCE_BACKED_PROFILES_NOT_REVIVED_PERSONS',
  offlineImpliesAuthorization: false,
  graphEdgesAreFacts: false,
  correlationIsCausation: false,
  defensiveSecurityOnly: true,
  autonomousCounterattacksAllowed: false,
  topSecretExternalRoutingAllowed: false,
  topSecretOrdinaryEmbeddingsAllowed: false,
  rawPrivateDataCentralizedByDefault: false,
} as const;
