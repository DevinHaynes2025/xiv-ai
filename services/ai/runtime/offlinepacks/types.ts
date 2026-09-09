/**
 * 62L-EX14 — Offline Quantum Research Pack contracts.
 * Parent: 62L-EX / GitHub #170 — Offline Quantum-Inspired Agent Brain.
 *
 * Canonical flow:
 * Authorized Source → Rights Check → Provenance → Parse/Normalize → Deduplicate →
 * Classify → Evidence Record → Offline Pack → Local Search/Retrieval →
 * Agent Experiment → New Evidence → XIV Home Base
 *
 * MODE: LOCAL_FIRST / OFFLINE_FIRST. L4_AUTONOMY_ENABLED=false.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Presence ≠ VERIFIED; soft-wire absent → WAITING_DATA (not FAIL).
 * Extends existing knowledge/evidence — not a second knowledge system.
 * No illicit ingest, no dark-web public index, no credential harvest,
 * no fabricated provenance, no unsupported quantum/SI claims, no hidden CoT.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION AUTHORIZED; presence≠VERIFIED; absent→WAITING_DATA; L4=false; historical≠physical QPU' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX14' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX14 — Offline Quantum Research Pack — governed offline knowledge; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE =
  'EX15 — Historical Quantum & Computing Atlas (docs-only next)' as const;

export const CANONICAL_FLOW = [
  'AuthorizedSource',
  'RightsCheck',
  'Provenance',
  'ParseNormalize',
  'Deduplicate',
  'Classify',
  'EvidenceRecord',
  'OfflinePack',
  'LocalSearchRetrieval',
  'AgentExperiment',
  'NewEvidence',
  'XIVHomeBase',
] as const;

export type CanonicalFlowHop = (typeof CANONICAL_FLOW)[number];

export const EX14_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FORCE_PUSH: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  FABRICATE_PROVENANCE: false as const,
  ILLICIT_INGEST: false as const,
  DARK_WEB_PUBLIC_INDEX: false as const,
  CREDENTIAL_HARVEST: false as const,
  PERMISSION_EXPANSION: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  AUTONOMOUS_CLOUD_PURCHASE: false as const,
  UNSUPPORTED_QUANTUM_SI_CLAIMS: false as const,
  AUTO_GLOBAL_PROMOTE_OFFLINE: false as const,
  MIX_TENANT_PRIVATE_WITH_GLOBAL: false as const,
  CROSS_TENANT_RETRIEVAL: false as const,
  CROSS_UNIVERSE_RETRIEVAL: false as const,
  SECOND_KNOWLEDGE_SYSTEM: false as const,
  SECOND_IDENTITY_SYSTEM: false as const,
  SECOND_GUARDIAN: false as const,
  SECOND_AGENT_MESH: false as const,
  WORMHOLE_BYPASS_AUTH: false as const,
  LEARNING_CHANGES_PERMISSIONS: false as const,
} as const;

export type Ex14LockKey = keyof typeof EX14_LOCKS;

export function assertEx14LocksIntact(): boolean {
  return (
    EX14_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX14_LOCKS.TIP_LAND === false &&
    EX14_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    EX14_LOCKS.FABRICATE_PROVENANCE === false &&
    EX14_LOCKS.ILLICIT_INGEST === false &&
    EX14_LOCKS.DARK_WEB_PUBLIC_INDEX === false &&
    EX14_LOCKS.CREDENTIAL_HARVEST === false &&
    EX14_LOCKS.PERMISSION_EXPANSION === false &&
    EX14_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX14_LOCKS.AUTO_GLOBAL_PROMOTE_OFFLINE === false &&
    EX14_LOCKS.MIX_TENANT_PRIVATE_WITH_GLOBAL === false &&
    EX14_LOCKS.CROSS_TENANT_RETRIEVAL === false &&
    EX14_LOCKS.CROSS_UNIVERSE_RETRIEVAL === false &&
    EX14_LOCKS.SECOND_KNOWLEDGE_SYSTEM === false &&
    EX14_LOCKS.WORMHOLE_BYPASS_AUTH === false
  );
}

export function ex14L4AutonomyEnabled(): false {
  return EX14_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx14(): true {
  return true;
}

export const DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

/** Logical pack types — separate packs, not one giant blob. */
export const PACK_TYPES = [
  'XIV_CORE',
  'QUANTUM_RESEARCH',
  'MATHEMATICS',
  'COMPUTER_SCIENCE',
  'ALGORITHMS',
  'SEMICONDUCTORS',
  'AI_ML',
  'OPERATIONS_RESEARCH',
  'SUPPLY_CHAIN',
  'BUSINESS_HISTORY',
  'GOVERNMENT',
  'CYBER_DEFENSE',
  'SCIENCE_ENGINEERING',
] as const;

export type PackType = (typeof PACK_TYPES)[number];

export const ALLOWED_SOURCE_CLASSES = [
  'PUBLIC_OPEN',
  'OFFICIAL',
  'LICENSED',
  'USER_AUTHORIZED',
  'CUSTOMER_AUTHORIZED',
  'PROVIDER_AUTHORIZED',
] as const;

export type AllowedSourceClass = (typeof ALLOWED_SOURCE_CLASSES)[number];

export const DENIED_SOURCE_CLASSES = [
  'STOLEN_DATABASE',
  'LEAKED_CREDENTIALS',
  'MALWARE_COLLECTION',
  'ILLICIT_MARKETPLACE',
  'RESTRICTED_PRIVATE_DATASET',
  'CONFIDENTIAL_VENDOR_DESIGN',
  'PRIVATE_RTL',
  'FIRMWARE_KEYS',
  'TRADE_SECRETS',
  'ACCESS_BYPASS_MATERIAL',
  'DARK_WEB_PUBLIC',
  'UNKNOWN_RESTRICTED',
] as const;

export type DeniedSourceClass = (typeof DENIED_SOURCE_CLASSES)[number];

export const CONTENT_CLASSES = [
  'QUANTUM_RESEARCH_HISTORICAL',
  'MATHEMATICS',
  'ALGORITHMS',
  'PUBLIC_SEMICONDUCTOR',
  'HISTORICAL_CASE_MEMORY',
  'COMPUTER_SCIENCE',
  'AI_ML_PUBLIC',
  'OPERATIONS_RESEARCH',
  'SUPPLY_CHAIN_PUBLIC',
  'GOVERNMENT_PUBLIC',
  'CYBER_DEFENSE_LAWFUL_TI',
  'SCIENCE_ENGINEERING',
  'XIV_CORE_PUBLIC',
] as const;

export type ContentClass = (typeof CONTENT_CLASSES)[number];

export const NORMALIZED_RECORD_KINDS = [
  'Document',
  'Claim',
  'Entity',
  'Concept',
  'Algorithm',
  'Hardware',
  'Benchmark',
  'HistoricalEvent',
  'Failure',
  'Lesson',
] as const;

export type NormalizedRecordKind = (typeof NORMALIZED_RECORD_KINDS)[number];

/** Claim/fact separation — never collapse. */
export const CLAIM_FACT_STATES = [
  'FACT_SUPPORTED',
  'CLAIM_REPORTED',
  'HYPOTHESIS',
  'INTERPRETATION',
  'DISPUTED',
  'OUTDATED',
  'UNKNOWN',
] as const;

export type ClaimFactState = (typeof CLAIM_FACT_STATES)[number];

export const PACK_BUILD_STATES = [
  'QUEUED',
  'SOURCE_VALIDATION',
  'NORMALIZING',
  'INDEXING',
  'VERIFYING',
  'READY',
  'PARTIAL',
  'STALE',
  'REBUILD_REQUIRED',
  'REVOKED',
  'FAILED',
] as const;

export type PackBuildState = (typeof PACK_BUILD_STATES)[number];

export const OFFLINE_USAGE_STATES = [
  'LOCAL_READY',
  'LOCAL_DEGRADED',
  'PACK_MISSING',
  'PACK_STALE',
  'PACK_REVOKED',
  'OFFLINE_STOPPED',
] as const;

export type OfflineUsageState = (typeof OFFLINE_USAGE_STATES)[number];

export const RETENTION_TIERS = [
  'HOT',
  'WARM',
  'COLD',
  'ARCHIVE',
  'REVIEW_FOR_DELETE',
  'REVOKED',
] as const;

export type RetentionTier = (typeof RETENTION_TIERS)[number];

/** Iceberg tiered storage metaphor (logical). */
export const ICEBERG_STORAGE_TIERS = [
  'SURFACE_HOT',
  'SUBSURFACE_WARM',
  'DEEP_COLD',
  'BEDROCK_ARCHIVE',
  'CALVED_REVOKED',
] as const;

export type IcebergStorageTier = (typeof ICEBERG_STORAGE_TIERS)[number];

export const KNOWLEDGE_NODE_KINDS = ['ROOT', 'BRANCH', 'LEAF'] as const;
export type KnowledgeNodeKind = (typeof KNOWLEDGE_NODE_KINDS)[number];

export const FRESHNESS_STATES = [
  'FRESH',
  'AGING',
  'STALE',
  'UNKNOWN',
  'REVOKED',
] as const;
export type FreshnessState = (typeof FRESHNESS_STATES)[number];

export const VERIFICATION_STATES = [
  'UNVERIFIED',
  'MANIFEST_VALID',
  'INTEGRITY_VALID',
  'INDEX_VALID',
  'RIGHTS_VALID',
  'READY_VERIFIED_LOCAL',
  'FAILED',
] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const ENCRYPTION_STATES = [
  'NONE_LOCAL_DEV',
  'AT_REST_CANDIDATE',
  'ENCRYPTED_LOCAL',
  'REVOKED_WIPED',
] as const;
export type EncryptionState = (typeof ENCRYPTION_STATES)[number];

export const REPLICATION_POLICIES = [
  'LOCAL_ONLY',
  'TENANT_SCOPED',
  'UNIVERSE_SCOPED',
  'GLOBAL_PUBLIC_PACK',
  'NO_REPLICATE',
] as const;
export type ReplicationPolicy = (typeof REPLICATION_POLICIES)[number];

export const PLATFORM_COMPAT = [
  'LINUX_X64',
  'LINUX_ARM64',
  'DARWIN_ARM64',
  'WINDOWS_X64',
  'ANY_NODE_LOCAL',
] as const;
export type PlatformCompatibility = (typeof PLATFORM_COMPAT)[number];

export const PACK_STATUS = [
  'DRAFT',
  'BUILDING',
  'READY',
  'PARTIAL',
  'STALE',
  'REVOKED',
  'FAILED',
  'ARCHIVED',
] as const;
export type PackStatus = (typeof PACK_STATUS)[number];

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export type ScaleHonesty =
  | { kind: 'MEASURED'; bytes: number; documentCount: number; recordCount: number; indexCount: number }
  | { kind: 'ENGINEERING_SCALE_TARGET'; note: string };

export type RightsManifest = {
  rightsManifestId: string;
  sourceClass: AllowedSourceClass | DeniedSourceClass;
  licenseId: string | null;
  rightsHolder: string | null;
  allowedUses: readonly string[];
  prohibitedUses: readonly string[];
  darkWebAllowed: false;
  credentialHarvestAllowed: false;
  tenantPrivate: boolean;
  recordedAt: string;
};

export type ProvenanceRecord = {
  provenanceId: string;
  sourceId: string;
  sourceUri: string | null;
  sourceTitle: string;
  capturedAt: string;
  version: string;
  hash: string | null;
  chainOfCustody: readonly string[];
  fabricated: false;
};

export type SourceManifestEntry = {
  sourceId: string;
  sourceClass: AllowedSourceClass | DeniedSourceClass;
  title: string;
  description: string;
  publishedAt: string | null;
  capturedAt: string;
  version: string;
  rightsManifestId: string | null;
  provenanceId: string | null;
  contentClasses: readonly ContentClass[];
  tenantId: string | null;
  universeId: string | null;
  requiresLiveWeb: boolean;
  bytesEstimate: number | null;
};

export type SourceManifest = {
  sourceManifestId: string;
  packType: PackType;
  tenantId: string;
  universeId: string;
  entries: readonly SourceManifestEntry[];
  createdAt: string;
  updatedAt: string;
};

export type HistoricalCaseMemory = {
  caseId: string;
  timePeriod: string;
  sources: readonly string[];
  facts: readonly string[];
  interpretations: readonly string[];
  knownUncertainty: readonly string[];
  lessons: readonly string[];
  /** Historical quantum research ≠ physical QPU evidence. */
  impliesPhysicalQpuEvidence: false;
};

export type NormalizedRecord = {
  recordId: string;
  kind: NormalizedRecordKind;
  title: string;
  body: string;
  claimFactState: ClaimFactState;
  sourceRefs: readonly string[];
  contentClass: ContentClass;
  tenantId: string;
  universeId: string;
  packType: PackType;
  dedupeHash: string;
  historicalCase?: HistoricalCaseMemory;
  bytes: number;
  /** Never stores chain-of-thought transcripts. */
  hiddenCot: false;
};

export type EmbeddingTruth = {
  model: string;
  version: string;
  runtime: string;
  deviceRequested: string;
  deviceActual: string;
  dimension: number;
  sourceHash: string;
  packVersion: string;
  fallbackUsed: boolean;
};

export type LocalIndexEntry = {
  indexId: string;
  recordId: string;
  tokens: readonly string[];
  embedding?: EmbeddingTruth;
  rightsManifestId: string;
  tenantId: string;
  universeId: string;
  revoked: boolean;
};

export type KnowledgeNode = {
  nodeId: string;
  kind: KnowledgeNodeKind;
  label: string;
  parentId: string | null;
  recordIds: readonly string[];
  packId: string;
};

export type SoftwareWormhole = {
  wormholeId: string;
  kind: 'CACHE' | 'INDEX';
  packId: string;
  /** Wormholes never bypass auth/rights/tenant/Universe. */
  bypassesAuth: false;
  bypassesRights: false;
  bypassesTenant: false;
  bypassesUniverse: false;
};

export type BeneficialRetentionScore = {
  recordId: string;
  score: number;
  tier: RetentionTier;
  icebergTier: IcebergStorageTier;
  reasons: readonly string[];
};

export type AgentResearchRole =
  | 'PACK_CURATOR'
  | 'RIGHTS_REVIEWER'
  | 'NORMALIZER'
  | 'INDEXER'
  | 'RETRIEVAL_AGENT'
  | 'EXPERIMENT_AGENT'
  | 'EVIDENCE_SCRIBE';

/** Roles via existing Agent Mesh only — not a second mesh. */
export type PackResearchTeamAssignment = {
  role: AgentResearchRole;
  agentMeshRoleRef: string;
  tenantId: string;
  universeId: string;
};

export type LocalCandidateEvidence = {
  evidenceId: string;
  packId: string;
  tenantId: string;
  universeId: string;
  claimFactState: ClaimFactState;
  promotionState: 'LOCAL_CANDIDATE';
  autoGlobalPromote: false;
  sourceRefs: readonly string[];
  summary: string;
  hiddenCot: false;
  createdAt: string;
};

export type OfflineResearchPack = {
  packId: string;
  packVersion: string;
  packType: PackType;
  tenantId: string;
  universeId: string;
  title: string;
  description: string;
  sourceManifestId: string;
  rightsManifestId: string;
  contentClasses: readonly ContentClass[];
  documentCount: number;
  recordCount: number;
  indexCount: number;
  estimatedBytes: number | null;
  actualBytes: number | null;
  createdAt: string;
  updatedAt: string;
  freshnessState: FreshnessState;
  verificationState: VerificationState;
  encryptionState: EncryptionState;
  replicationPolicy: ReplicationPolicy;
  platformCompatibility: readonly PlatformCompatibility[];
  integrityHash: string | null;
  rollbackVersion: string | null;
  status: PackStatus;
  buildState: PackBuildState;
  scaleHonesty: ScaleHonesty;
  revokedSourceIds: readonly string[];
};

export type SoftWireSnapshot = {
  ex1: SoftWirePresence;
  ex2: SoftWirePresence;
  ex3: SoftWirePresence;
  ex4: SoftWirePresence;
  ex5: SoftWirePresence;
  ex6: SoftWirePresence;
  ex7: SoftWirePresence;
  ex8: SoftWirePresence;
  ex9: SoftWirePresence;
  ex10: SoftWirePresence;
  ex11EvidenceLedger: SoftWirePresence;
  ex12PathwayGraph: SoftWirePresence;
  ex13PathwayPlasticity: SoftWirePresence;
  agentMesh: SoftWirePresence;
  knowledge: SoftWirePresence;
  feedback: SoftWirePresence;
  audit: SoftWirePresence;
  guardian: SoftWirePresence;
  persistence: SoftWirePresence;
};

const HERE = dirname(fileURLToPath(import.meta.url));
const AI_ROOT = join(HERE, '..', '..');
const WORKTREE_ROOT = join(AI_ROOT, '..', '..');
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

function softWire(pathChecked: string, notePresent: string, noteAbsent: string): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

function firstExisting(candidates: string[], notePresent: string, noteAbsent: string): SoftWirePresence {
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: notePresent,
        verified: false,
        disposition: 'PRESENT_UNVERIFIED',
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: noteAbsent,
    verified: false,
    disposition: 'WAITING_DATA',
  };
}

/** Soft-wire EX1–EX13 + mesh/knowledge/feedback/audit/guardian. Presence ≠ VERIFIED. */
export function auditEx14SoftWires(): SoftWireSnapshot {
  const quantum = join(AI_ROOT, 'runtime', 'quantum');
  return {
    ex1: firstExisting(
      [
        join(quantum, 'mission.ts'),
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        '/tmp/62l-ex1-work/services/ai/runtime/quantum/mission.ts',
      ],
      'EX1 mission soft-wired — presence ≠ VERIFIED.',
      'EX1 mission absent → WAITING_DATA.',
    ),
    ex2: firstExisting(
      [
        join(quantum, 'baseline.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        '/tmp/62l-ex2-work/services/ai/runtime/quantum/baseline.ts',
      ],
      'EX2 baseline soft-wired — presence ≠ VERIFIED.',
      'EX2 baseline absent → WAITING_DATA.',
    ),
    ex3: firstExisting(
      [
        join(quantum, 'algorithm-registry.ts'),
        join(WORKSPACE_PARENT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
        '/tmp/62l-ex3-work/services/ai/runtime/quantum/algorithm-registry.ts',
      ],
      'EX3 algorithm lab soft-wired — presence ≠ VERIFIED.',
      'EX3 absent → WAITING_DATA.',
    ),
    ex4: firstExisting(
      [
        join(quantum, 'simulator-registry.ts'),
        '/tmp/62l-ex4-work/services/ai/runtime/quantum/simulator-registry.ts',
      ],
      'EX4 simulator registry soft-wired — presence ≠ VERIFIED.',
      'EX4 absent → WAITING_DATA.',
    ),
    ex5: firstExisting(
      [
        join(quantum, 'qpu-types.ts'),
        '/tmp/62l-ex5-work/services/ai/runtime/quantum/qpu-types.ts',
      ],
      'EX5 QPU registry soft-wired — presence ≠ VERIFIED.',
      'EX5 absent → WAITING_DATA.',
    ),
    ex6: firstExisting(
      [
        join(quantum, 'qpu-receipt.ts'),
        join(WORKSPACE_PARENT, '.wt-ex6', 'services', 'ai', 'runtime', 'quantum', 'qpu-receipt.ts'),
        '/tmp/62l-ex6-work/services/ai/runtime/quantum/qpu-receipt.ts',
      ],
      'EX6 physical receipt soft-wired — presence ≠ VERIFIED.',
      'EX6 absent → WAITING_DATA.',
    ),
    ex7: firstExisting(
      [
        join(quantum, 'hybrid-router.ts'),
        '/tmp/62l-ex7-work/services/ai/runtime/quantum/hybrid-router.ts',
        join(WORKSPACE_PARENT, '.wt-ex8', 'services', 'ai', 'runtime', 'quantum', 'hybrid-router.ts'),
      ],
      'EX7 hybrid router soft-wired — presence ≠ VERIFIED.',
      'EX7 absent → WAITING_DATA.',
    ),
    ex8: firstExisting(
      [
        join(quantum, 'agent-team.ts'),
        join(WORKSPACE_PARENT, '.wt-ex8', 'services', 'ai', 'runtime', 'quantum', 'agent-team.ts'),
        '/tmp/62l-ex8-work/services/ai/runtime/quantum/agent-team.ts',
      ],
      'EX8 offline quantum team soft-wired — presence ≠ VERIFIED.',
      'EX8 absent → WAITING_DATA.',
    ),
    ex9: firstExisting(
      [
        join(quantum, 'workload-genome.ts'),
        join(WORKSPACE_PARENT, '.wt-ex9', 'services', 'ai', 'runtime', 'quantum', 'workload-genome.ts'),
        '/tmp/62l-ex9-work/services/ai/runtime/quantum/workload-genome.ts',
      ],
      'EX9 workload genome soft-wired — presence ≠ VERIFIED.',
      'EX9 absent → WAITING_DATA.',
    ),
    ex10: firstExisting(
      [
        join(quantum, 'benchmark-comparability.ts'),
        join(quantum, 'comparability.ts'),
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/comparability.ts',
      ],
      'EX10 benchmark gate soft-wired — presence ≠ VERIFIED.',
      'EX10 absent → WAITING_DATA.',
    ),
    ex11EvidenceLedger: firstExisting(
      [
        join(quantum, 'evidence-ledger.ts'),
        join(quantum, 'evidence-types.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'EX11 evidence ledger soft-wired — presence ≠ VERIFIED.',
      'EX11 evidence ledger absent → WAITING_DATA.',
    ),
    ex12PathwayGraph: firstExisting(
      [
        join(quantum, 'pathway-graph.ts'),
        join(quantum, 'pathway-types.ts'),
        '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'EX12 pathway graph soft-wired — presence ≠ VERIFIED.',
      'EX12 pathway graph absent → WAITING_DATA.',
    ),
    ex13PathwayPlasticity: firstExisting(
      [
        join(quantum, 'pathway-plasticity.ts'),
        join(quantum, 'plasticity.ts'),
        join(quantum, 'lifecycle-feedback.ts'),
        '/tmp/62l-ex13-work/services/ai/runtime/quantum/pathway-plasticity.ts',
        join(WORKSPACE_PARENT, '.wt-ex13', 'services', 'ai', 'runtime', 'quantum', 'pathway-plasticity.ts'),
        // EQ15 plasticity is a related soft-wire candidate only — still ≠ EX13 VERIFIED.
        join(AI_ROOT, 'local-brain', 'pathway-plasticity.ts'),
        join(WORKSPACE_PARENT, 'services', 'ai', 'local-brain', 'pathway-plasticity.ts'),
      ],
      'EX13 pathway plasticity / lifecycle soft-wired — presence ≠ VERIFIED.',
      'EX13 pathway plasticity absent → WAITING_DATA (do not block forever).',
    ),
    agentMesh: softWire(
      join(AI_ROOT, 'runtime', 'agentmesh', 'types.ts'),
      'Agent Mesh present — pack roles use mesh only.',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    knowledge: softWire(
      join(AI_ROOT, 'runtime', 'knowledge', 'index.ts'),
      'Existing knowledge module present — EX14 extends, does not duplicate.',
      'Knowledge module absent → WAITING_DATA.',
    ),
    feedback: softWire(
      join(AI_ROOT, 'runtime', 'feedback', 'loop.ts'),
      'Feedback loop present — soft-integrate if EX13 lifecycle appears.',
      'Feedback loop absent → WAITING_DATA.',
    ),
    audit: softWire(
      join(AI_ROOT, 'runtime', 'audit.ts'),
      'Audit store present — AUDIT FIRST.',
      'Audit absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(AI_ROOT, 'runtime', 'guardian', 'validate.ts'),
      'Guardian present — EX14 must not weaken Guardian/RLS.',
      'Guardian absent → WAITING_DATA.',
    ),
    persistence: softWire(
      join(AI_ROOT, 'persistence.ts'),
      'Persistence facade present — soft-wire only.',
      'Persistence absent → WAITING_DATA.',
    ),
  };
}

export function summarizeSoftWires(snap: SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [keyof SoftWireSnapshot, SoftWirePresence][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return { waitingData, presentUnverified, anyVerified: false };
}

export function resolveOfflineWebDependency(input: {
  requiresLiveWeb: boolean;
  networkAvailable: boolean;
  dependencyName: string;
}): SoftWirePresence {
  if (input.requiresLiveWeb && !input.networkAvailable) {
    return {
      present: false,
      pathChecked: `web://${input.dependencyName}`,
      note: `Live-web-required "${input.dependencyName}" while offline → WAITING_DATA (not FAIL).`,
      verified: false,
      disposition: 'WAITING_DATA',
    };
  }
  return {
    present: true,
    pathChecked: `web://${input.dependencyName}`,
    note: `Dependency "${input.dependencyName}" reachable or not required live.`,
    verified: false,
    disposition: 'PRESENT_UNVERIFIED',
  };
}

export function nowIso(d = new Date()): string {
  return d.toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${createHash('sha256').update(`${prefix}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 12)}`;
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function measuredBytes(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

export function isAllowedSourceClass(c: string): c is AllowedSourceClass {
  return (ALLOWED_SOURCE_CLASSES as readonly string[]).includes(c);
}

export function isDeniedSourceClass(c: string): c is DeniedSourceClass {
  return (DENIED_SOURCE_CLASSES as readonly string[]).includes(c);
}

export function retentionToIceberg(tier: RetentionTier): IcebergStorageTier {
  switch (tier) {
    case 'HOT':
      return 'SURFACE_HOT';
    case 'WARM':
      return 'SUBSURFACE_WARM';
    case 'COLD':
      return 'DEEP_COLD';
    case 'ARCHIVE':
      return 'BEDROCK_ARCHIVE';
    case 'REVIEW_FOR_DELETE':
      return 'DEEP_COLD';
    case 'REVOKED':
      return 'CALVED_REVOKED';
  }
}
