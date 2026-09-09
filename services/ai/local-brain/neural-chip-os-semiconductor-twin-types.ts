import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BX — XIV Neural Chip OS Abstraction + Global Semiconductor Digital Twin +
 * Device Intelligence Marketplace + Quantum Workload Compiler +
 * Business Knowledge Broadcasting Network + Planetary Superbrain Routing Cortex.
 *
 * SoT: GitHub #88. GitLab #22 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * HAL covers verified CPU/GPU/NPU/DSP/accelerator families only.
 * Twin inventory ≠ physical-verified unless evidence says so.
 * Quantum: classical baseline required; QPU/simulator separate; no advantage claim without evidence.
 * Marketplace: install ≠ authority; authorized+configured only.
 * Knowledge broadcast: provenance-aware; unverified DENIED; external publish needs human gate.
 * Trillion scale = logical/simulated addressing unless real benchmarks prove capacity.
 * Sparse Superbrain routes: trust/latency/cost/freshness/policy — speed never overrides sealed/trust.
 * Founder-avatar / sealed denies from BW still hold when present; learning ≠ permission.
 */

export const NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE = [
  'honesty_locks',
  'hal_verified_family_gate',
  'unverified_chip_family_unavailable',
  'semiconductor_twin_model',
  'twin_inventory_honesty_label',
  'classical_baseline_required',
  'quantum_plan_compile',
  'unconfigured_qpu_unavailable',
  'marketplace_authorized_install',
  'install_no_production_authority',
  'knowledge_broadcast_provenance_gate',
  'external_publish_human_gate',
  'sparse_superbrain_route_score',
  'sealed_trust_beats_speed',
  'trillion_logical_addressing',
  'founder_avatar_sealed_deny_probe',
  'evidence',
  'learning',
] as const;

export type BxHop = (typeof NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE)[number];

export type BxEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
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
  | 'SIMULATED'
  | 'LOGICAL'
  | 'MODEL_ONLY'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'RECOMMENDATION_ONLY';

export type BxHopRecord = {
  hop: BxHop;
  state: BxEvidenceState;
  summary: string;
  at: string;
};

export const BX_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  UNVERIFIED_CHIP_FAMILY_LABELED_VERIFIED: false as const,
  HAL_COVERS_UNVERIFIED_FAMILIES: false as const,
  TWIN_INVENTORY_IS_PHYSICAL_VERIFIED_BY_DEFAULT: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_ADVANTAGE_CLAIM_WITHOUT_EVIDENCE: false as const,
  UNCONFIGURED_QPU_TREATED_AVAILABLE: false as const,
  MARKETPLACE_INSTALL_GRANTS_AUTHORITY: false as const,
  SILENT_ARBITRARY_DEVICE_ENROLL: false as const,
  UNVERIFIED_KNOWLEDGE_BROADCAST: false as const,
  EXTERNAL_PUBLISH_WITHOUT_HUMAN_GATE: false as const,
  RAW_PRIVATE_KNOWLEDGE_POOLING_DEFAULT: false as const,
  SPEED_OVERRIDES_SEALED_TRUST: false as const,
  TRILLION_ADDRESSING_IS_PHYSICAL_CAPACITY: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  FOUNDER_AVATAR_IMPERSONATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  PROVENANCE_REQUIRED_FOR_BROADCAST: true as const,
  CLASSICAL_BASELINE_REQUIRED: true as const,
  SPARSE_ROUTING_WEIGHTED: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BY — Universal Hardware Knowledge Cortex + Semiconductor Innovation Laboratory + Multi-Device Agent Runtime + Economic Compute Scheduler + Verified Global Business Intelligence Stream + Superbrain Synapse Compiler' as const;

export const GITHUB_SOT_ISSUE = 88 as const;
export const GITLAB_COORDINATION_ISSUE = 22 as const;

export const UNVERIFIED_CHIP_FAMILY_UNAVAILABLE =
  'UNVERIFIED_CHIP_FAMILY_HAL_UNAVAILABLE' as const;
export const UNVERIFIED_NOT_LABELED_VERIFIED =
  'UNVERIFIED_CHIP_FAMILY_NOT_LABELED_VERIFIED_IN_HAL' as const;
export const TWIN_NOT_PHYSICAL_VERIFIED =
  'TWIN_INVENTORY_WITHOUT_EVIDENCE_NOT_PHYSICAL_VERIFIED' as const;
export const QUANTUM_CLASSICAL_BASELINE_REQUIRED =
  'QUANTUM_PLAN_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const UNCONFIGURED_QPU_UNAVAILABLE =
  'UNCONFIGURED_QPU_OR_SIMULATOR_UNAVAILABLE' as const;
export const NO_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE =
  'NO_QUANTUM_ADVANTAGE_CLAIM_WITHOUT_EVIDENCE' as const;
export const INSTALL_NO_PRODUCTION_AUTHORITY =
  'MARKETPLACE_INSTALL_DOES_NOT_GRANT_PRODUCTION_AUTHORITY' as const;
export const UNAUTHORIZED_DEVICE_ENROLL_DENIED =
  'UNAUTHORIZED_OR_UNCONFIGURED_DEVICE_ENROLL_DENIED' as const;
export const BROADCAST_NO_PROVENANCE_DENIED =
  'BROADCAST_UNVERIFIED_OR_NO_PROVENANCE_KNOWLEDGE_DENIED' as const;
export const EXTERNAL_PUBLISH_NEEDS_HUMAN_GATE =
  'EXTERNAL_PUBLISH_DENIED_WITHOUT_HUMAN_GATE' as const;
export const SEALED_TRUST_BEATS_SPEED =
  'FASTER_LOW_TRUST_ROUTE_LOSES_TO_SEALED_POLICY_WEIGHT' as const;
export const TRILLION_LOGICAL_ONLY =
  'TRILLION_ADDRESSING_REMAINS_LOGICAL_UNLESS_BENCHMARK_PROVES_CAPACITY' as const;
export const FOUNDER_AVATAR_SEALED_DENY =
  'FOUNDER_AVATAR_OR_SEALED_DENY_FROM_BW_STILL_HOLDS' as const;
export const LEARNING_NOT_PERMISSION =
  'LEARNING_IS_NOT_PERMISSION_GRANT' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type HardwareFamilyKind = 'cpu' | 'gpu' | 'npu' | 'dsp' | 'accelerator';

export type CompatibilityLabel =
  | 'DOCUMENTED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'VERIFIED'
  | 'TARGET'
  | 'SIMULATED'
  | 'MODEL_ONLY'
  | 'LOGICAL';

export type InventoryHonestyLabel =
  | 'MODEL_ONLY'
  | 'SIMULATED'
  | 'LOGICAL'
  | 'EVIDENCE_BACKED'
  | 'PHYSICAL_VERIFIED';

export type ConfidenceLabel =
  | 'low'
  | 'medium'
  | 'high'
  | 'unverified'
  | 'evidence_backed';

export type RouteEndpointKind =
  | 'chip'
  | 'device'
  | 'agent'
  | 'tool'
  | 'workflow'
  | 'knowledge'
  | 'universe';

export type BxActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'hal_agent'
  | 'twin_agent'
  | 'quantum_planner'
  | 'marketplace_curator'
  | 'broadcast_agent'
  | 'routing_cortex'
  | 'ordinary_agent'
  | 'impersonator'
  | 'founder_avatar';

export type BxActor = {
  kind: BxActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type PredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA' | 'MISSING';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));

  return {
    BW: {
      tipProbe:
        hasMod('planetary-chip-founder-avatar-ethics-types.ts') ||
        hasMod('planetary-chip-intelligence-fabric.ts') ||
        hasMod('founder-avatar-delegate-universe.ts') ||
        hasMod('law-ethics-governance.ts') ||
        has('62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred BW Planetary Chip / Founder Avatar / Ethics tip + report. Founder-avatar/sealed denies still hold when present. Report may still be landing.',
    },
    BV: {
      tipProbe:
        has('62L_BV_AI_SYSTEMS_ARCHITECTURE_INSTITUTE_REPORT.md') ||
        hasMod('ai-systems-architecture-institute.ts')
          ? has('62L_BV_AI_SYSTEMS_ARCHITECTURE_INSTITUTE_REPORT.md')
            ? 'PRESENT'
            : 'WAITING_DATA'
          : 'WAITING_DATA',
      report: has('62L_BV_AI_SYSTEMS_ARCHITECTURE_INSTITUTE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BV AI Systems Architecture Institute — fallback if BW absent.',
    },
    BU: {
      tipProbe:
        has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md') ||
        hasMod('code-research-benchmark-strategy-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BU Code Research / Benchmark / Strategy tip used as BX scaffold base while BW landing.',
    },
    BT: {
      tipProbe:
        has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md') ||
        hasMod('apprenticeship-experiment-evolution-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BT Apprenticeship / Experiment / Evolution Graph ancestor.',
    },
    BS: {
      tipProbe:
        has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md') ||
        hasMod('software-engineering-university.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BS Engineering University / Memory Cortex ancestor.',
    },
    BR: {
      tipProbe: hasMod('structured-code-memory.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_BR_STRUCTURED_CODE_MEMORY_DEBUG_ACADEMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BR Structured Code Memory / Debug Academy ancestor.',
    },
    BQ: {
      tipProbe:
        has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md') ||
        hasMod('polyglot-language-registry.ts')
          ? has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md')
            ? 'PRESENT'
            : 'WAITING_DATA'
          : 'WAITING_DATA',
      report: has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BQ polyglot honesty reused conceptually.',
    },
    BP: {
      tipProbe: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BP Cognitive Homeostasis ancestor.',
    },
    BD: {
      tipProbe:
        has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md') ||
        hasMod('cognitive-memory-chip.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BD Cognitive Memory Chip layers extended where present.',
    },
  };
}

export function containsForbiddenPrivateFields(payload?: Record<string, unknown>): boolean {
  if (!payload) return false;
  const keys = Object.keys(payload).map((k) => k.toLowerCase());
  return keys.some((k) =>
    (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).some(
      (f) => k === f || k.includes(f) || k.includes('hidden_reasoning') || k.includes('private_cot'),
    ),
  );
}

/** Probe BW founder-avatar / sealed ethics modules when present on the tree. */
export function probeBwFounderAvatarEthics(root = repoRootFromHere()): {
  present: boolean;
  modules: string[];
  sealedDenyHolds: true;
  learningIsPermission: false;
  status: 'PRESENT' | 'WAITING_DATA';
} {
  const localBrain = join(root, 'services/ai/local-brain');
  const candidates = [
    'planetary-chip-founder-avatar-ethics-types.ts',
    'founder-avatar-ethics.ts',
    'planetary-chip-os.ts',
    'founder-avatar-runtime.ts',
  ];
  const modules = candidates.filter((f) => existsSync(join(localBrain, f)));
  const reportPresent = existsSync(
    join(root, 'docs/operations/62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md'),
  );
  return {
    present: modules.length > 0 || reportPresent,
    modules,
    sealedDenyHolds: true,
    learningIsPermission: false,
    status: reportPresent || modules.length > 0 ? (reportPresent ? 'PRESENT' : 'WAITING_DATA') : 'WAITING_DATA',
  };
}
