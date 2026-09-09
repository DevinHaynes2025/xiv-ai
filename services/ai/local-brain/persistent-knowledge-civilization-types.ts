import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CX — XIV Persistent Knowledge Civilization + Offline Research Colony
 * Network + Multi-Model Evolution Laboratory + Distributed Scientific Memory
 * Fabric + Adaptive Accelerator Grid + Agent-Built Research Tool Ecosystem +
 * Cross-Universe Intelligence Compiler.
 *
 * SoT: GitHub #115. GitLab #49 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Persistent research colonies with truthful heartbeat status;
 * RUNNING_VERIFIED only with evidence.
 * Offline work stops when no authorized node is powered → WAITING_NODE /
 * OFFLINE_STOPPED (reuse CW realism).
 * Raw private data is not globally pooled.
 * Unverified hardware remains UNAVAILABLE.
 * Model/tool improvements cannot promote themselves to production.
 * Multi-model evolution lab = sandboxed; eval+human review before promotion.
 * Scientific/business/technical memory products = signed.
 * Accelerator grid: verified AMD/NVIDIA/NPU/quantum only; classical baseline
 * for quantum.
 * Tool ecosystem: reuse-first; deny-by-default; registration ≠ authority.
 * Cross-Universe Intelligence Compiler: scoped approved knowledge/skills/
 * indexes/models/experiment metadata only.
 * Local-first; sealed never silent cloud fallback; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow.
 */

export const PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE = [
  'honesty_locks',
  'civilization_bootstrap',
  'colony_no_powered_node_waiting_or_stopped',
  'colony_missing_heartbeat_not_running_verified',
  'raw_private_global_pool_denied',
  'model_self_promotion_to_production_denied',
  'unsigned_memory_product_rejected',
  'unverified_gpu_qpu_unavailable',
  'quantum_without_classical_baseline_rejected',
  'tool_reuse_preferred_over_duplicate_sandbox',
  'tool_self_promotion_to_production_denied',
  'compiler_unapproved_cross_universe_denied',
  'compiler_raw_private_cross_universe_denied',
  'sealed_no_silent_cloud_accelerator',
  'evidence',
  'learning',
] as const;

export type CxHop = (typeof PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE)[number];

export type CxEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'STALE'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'SANDBOXED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'LABELED_SIMULATION'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'SEARCHABLE'
  | 'LINEAGED'
  | 'NEGATIVE_KEPT'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'HYPOTHESIS'
  | 'UNPROMOTED'
  | 'REUSED'
  | 'SIGNED'
  | 'UNSIGNED';

export type CxHopRecord = {
  hop: CxHop;
  state: CxEvidenceState;
  summary: string;
  at: string;
};

export const CX_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  RAW_PRIVATE_GLOBAL_POOLING: false as const,
  MODEL_SELF_PROMOTION_TO_PRODUCTION: false as const,
  TOOL_SELF_PROMOTION_TO_PRODUCTION: false as const,
  MODEL_EVOLUTION_SANDBOX_UNTIL_EVAL_REVIEW: true as const,
  MEMORY_PRODUCT_REQUIRES_SIGNATURE: true as const,
  UNSIGNED_MEMORY_PRODUCT_ACCEPTED: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  UNCONFIGURED_TARGET_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  TOOL_REUSE_FIRST: true as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  COMPILER_UNAPPROVED_CROSS_UNIVERSE: false as const,
  COMPILER_RAW_PRIVATE_CROSS_UNIVERSE: false as const,
  SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  OS_IS_COEXISTENCE_LAYER: true as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CY — XIV Knowledge Colony Operating System + Persistent Agent Research Societies + Multi-Model Intelligence Compiler + Distributed Memory/Experiment Nervous System + Adaptive GPU/Quantum Compute Economy + Agent-Built AI Service Foundry + Universe Knowledge Routing Grid' as const;

export const GITHUB_SOT_ISSUE = 115 as const;
export const GITLAB_COORDINATION_ISSUE = 49 as const;

export const ALL_NODES_OFFLINE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'COLONY_WITHOUT_HEARTBEAT_RUNTIME_EVIDENCE_NOT_RUNNING_VERIFIED' as const;
export const RAW_PRIVATE_GLOBAL_POOL_DENIED =
  'RAW_PRIVATE_DATA_GLOBAL_POOL_DENIED' as const;
export const MODEL_SELF_PROMOTION_DENIED =
  'MODEL_CANNOT_SELF_PROMOTE_TO_PRODUCTION' as const;
export const TOOL_SELF_PROMOTION_DENIED =
  'TOOL_CANNOT_SELF_PROMOTE_TO_PRODUCTION' as const;
export const UNSIGNED_MEMORY_PRODUCT_REJECTED =
  'UNSIGNED_SCIENTIFIC_BUSINESS_OR_TECHNICAL_MEMORY_PRODUCT_REJECTED' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_GPU_OR_QPU_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_ROUTE_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const TOOL_REUSE_PREFERRED =
  'REUSE_APPROVED_TOOL_PREFERRED_OVER_DUPLICATE_SANDBOX_BUILD' as const;
export const COMPILER_UNAPPROVED_DENIED =
  'CROSS_UNIVERSE_COMPILER_REJECTS_UNAPPROVED_TRANSFER' as const;
export const COMPILER_RAW_PRIVATE_DENIED =
  'CROSS_UNIVERSE_COMPILER_REJECTS_RAW_PRIVATE_TRANSFER' as const;
export const SEALED_SILENT_CLOUD_ACCELERATOR_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_CLOUD_ACCELERATOR' as const;
export const REGISTRATION_NO_AUTHORITY =
  'TOOL_REGISTRATION_DOES_NOT_GRANT_AUTHORITY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_COLONIES = 256 as const;
export const MAX_EVOLUTION_CANDIDATES = 1024 as const;
export const MAX_MEMORY_PRODUCTS = 2048 as const;
export const MAX_ACCELERATOR_TARGETS = 512 as const;
export const MAX_ECOSYSTEM_TOOLS = 1024 as const;
export const MAX_COMPILER_TRANSFERS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type CxActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'civilization_curator'
  | 'colony_governor'
  | 'evolution_lab_curator'
  | 'memory_fabric_governor'
  | 'accelerator_grid_scheduler'
  | 'tool_ecosystem_governor'
  | 'intelligence_compiler'
  | 'ordinary_agent'
  | 'impersonator';

export type CxActor = {
  kind: CxActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type ColonyStatus =
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type AcceleratorKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type MemoryProductKind = 'scientific' | 'business' | 'technical';

export type CompilerAssetClass =
  | 'approved_knowledge'
  | 'approved_skill'
  | 'approved_index'
  | 'approved_model'
  | 'experiment_metadata'
  | 'raw_private'
  | 'unapproved';

export type PredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA' | 'MISSING';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));

  return {
    CW: {
      tipProbe:
        hasMod('autonomous-research-infrastructure-os-types.ts') ||
        has('62L_CW_AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CW_AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CW Autonomous Research Infrastructure OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    CV: {
      tipProbe:
        hasMod('distributed-intelligence-laboratory-os-types.ts') ||
        has('62L_CV_DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CV_DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CV @ c35e474 fallback when CW absent.',
    },
    CU: {
      tipProbe:
        hasMod('cognitive-research-cloud-types.ts') ||
        has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CU Cognitive Research Cloud lineage.',
    },
    CT: {
      tipProbe:
        hasMod('ai-research-civilization-os-types.ts') ||
        has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CT AI Research Civilization OS lineage.',
    },
    CR: {
      tipProbe:
        hasMod('hybrid-supercompute-universe-os-types.ts') ||
        has('62L_CR_HYBRID_SUPERCOMPUTE_UNIVERSE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CR_HYBRID_SUPERCOMPUTE_UNIVERSE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CR Hybrid Supercompute Universe OS lineage.',
    },
    CQ: {
      tipProbe:
        hasMod('offline-universe-quantum-genome-types.ts') ||
        has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CQ Offline Universe Quantum Genome lineage.',
    },
  };
}
