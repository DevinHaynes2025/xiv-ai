import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CR — XIV Hybrid Supercompute Universe OS + GPU/Quantum Workload Civilization +
 * Multi-Cloud Storage Nervous System + Space/Earth Signal Knowledge Fabric +
 * Digital Genome Evolution Engine + Massive Neural Simulation & Algorithm Discovery Grid.
 *
 * SoT: GitHub #108. GitLab #42 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Truthful scale: logical Universes/qubits/neurons/pathways are SEPARATED from
 * materialized or running counts. Extreme catalog sizes ≠ physical process spawn.
 *
 * GPU/QPU/cloud: verified runtime evidence only; else UNAVAILABLE.
 * Classical baseline required for quantum research routing; no advantage without evidence.
 * AWS/GCP/local storage: configured+authorized only; sealed never silent cloud fallback.
 * Defensive cloud-leak monitoring only; leaked/stolen/restricted intake DENIED.
 * NASA/GPS/satellite/Starlink/Earth-science = knowledge fabrics only;
 * no physical vehicle/ATC/spacecraft control.
 * Digital Genome experiments reversible; no silent secret/sealed/authority copy.
 * Sparse massive neural simulations; pathway miner: correlation ≠ causation;
 * learning ≠ permission.
 * Founder-sealed deny-by-default. L4=false. tip-land=NO. No mega-delta swallow.
 */

export const HYBRID_SUPERCOMPUTE_UNIVERSE_OS_CYCLE = [
  'honesty_locks',
  'hybrid_os_bootstrap',
  'scale_report_logical_vs_materialized',
  'gpu_accelerator_verified_only',
  'quantum_classical_baseline_required',
  'unverified_gpu_qpu_cloud_unavailable',
  'storage_placement_configured_authorized',
  'sealed_no_silent_aws_gcp',
  'leak_monitor_defensive_only',
  'leaked_stolen_restricted_denied',
  'space_fabric_knowledge_only',
  'space_no_physical_control',
  'genome_experiment_reversible',
  'genome_secret_authority_copy_denied',
  'neural_sim_activation_bounded',
  'pathway_miner_no_causation_promotion',
  'evidence',
  'learning',
] as const;

export type CrHop = (typeof HYBRID_SUPERCOMPUTE_UNIVERSE_OS_CYCLE)[number];

export type CrEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
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
  | 'DEFENSIVE_ONLY'
  | 'LOGICAL_ONLY'
  | 'REVERSIBLE'
  | 'CORRELATION_ONLY';

export type CrHopRecord = {
  hop: CrHop;
  state: CrEvidenceState;
  summary: string;
  at: string;
};

export const CR_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  TRUTHFUL_SCALE_REPORTING: true as const,
  LOGICAL_NE_MATERIALIZED: true as const,
  LOGICAL_NE_RUNNING: true as const,
  PHYSICAL_CLAIM_WITHOUT_RUNTIME_EVIDENCE: false as const,
  GPU_REQUIRES_RUNTIME_VERIFICATION: true as const,
  QPU_REQUIRES_RUNTIME_VERIFICATION: true as const,
  UNVERIFIED_ACCELERATOR_LIVE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  STORAGE_REQUIRES_CONFIGURED_AUTHORIZED: true as const,
  UNCONFIGURED_CLOUD_PLACEMENT: false as const,
  SEALED_SILENT_AWS_GCP_FALLBACK: false as const,
  LEAK_MONITOR_DEFENSIVE_ONLY: true as const,
  OFFENSIVE_HARVEST_ALLOWED: false as const,
  LEAKED_STOLEN_RESTRICTED_INTAKE_ALLOWED: false as const,
  SPACE_FABRIC_KNOWLEDGE_ONLY: true as const,
  SPACE_PHYSICAL_VEHICLE_ATC_CONTROL: false as const,
  GENOME_EXPERIMENTS_REVERSIBLE: true as const,
  GENOME_SILENT_COPY_SECRETS: false as const,
  GENOME_SILENT_COPY_SEALED: false as const,
  GENOME_SILENT_COPY_AUTHORITY: false as const,
  NEURAL_SIM_ACTIVATION_BOUNDED: true as const,
  UNBOUNDED_PROCESS_SPAWN: false as const,
  PATHWAY_CORRELATION_EQ_CAUSATION: false as const,
  CAUSATION_WITHOUT_EVIDENCE: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
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
  '62L-CS — XIV Compute Genome OS + Autonomous Algorithm Research Institute + Distributed Model Training Laboratory + Universal Knowledge Storage Grid + Scientific Simulation Universe + Agent Hardware Optimization Foundry + Evidence-Driven Neural Evolution Engine' as const;

export const GITHUB_SOT_ISSUE = 108 as const;
export const GITLAB_COORDINATION_ISSUE = 42 as const;

/** Bounded activation — never spawn unbounded processes from a catalog size. */
export const MAX_ACTIVE_UNIVERSE_NAMESPACES = 64 as const;
export const MAX_ACTIVE_GPU_WORKLOADS = 32 as const;
export const MAX_ACTIVE_QUANTUM_RESEARCH_JOBS = 16 as const;
export const MAX_ACTIVE_NEURAL_SIM_WALKERS = 128 as const;
export const MAX_ACTIVE_GENOME_EXPERIMENTS = 32 as const;
/** Logical catalog ceilings (sparse address bookkeeping — not physical). */
export const LOGICAL_UNIVERSE_CATALOG_CEILING = 10_000_000_000_000 as const;
export const LOGICAL_QUBIT_ADDRESS_CEILING = 1_000_000_000_000 as const;
export const LOGICAL_NEURON_ADDRESS_CEILING = 1_000_000_000_000_000 as const;
export const LOGICAL_PATHWAY_CEILING = 1_000_000_000_000_000 as const;

export const SCALE_LOGICAL_ONLY =
  'LOGICAL_SCALE_IS_SPARSE_ADDRESS_SPACE_NOT_PHYSICAL_PROCESS_SPAWN' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_AMD_NVIDIA_OR_QPU_MARKED_UNAVAILABLE_NOT_LIVE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_PATH_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const UNCONFIGURED_STORAGE_DENIED =
  'STORAGE_PLACEMENT_TO_UNCONFIGURED_CLOUD_DENIED_OR_UNAVAILABLE' as const;
export const SEALED_SILENT_CLOUD_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_AWS_GCP' as const;
export const LEAKED_INTAKE_DENIED =
  'LEAKED_STOLEN_OR_RESTRICTED_SOURCE_INTAKE_DENIED' as const;
export const OFFENSIVE_HARVEST_DENIED =
  'OFFENSIVE_HARVEST_CAPABILITY_DENIED_DEFENSIVE_MONITOR_ONLY' as const;
export const SPACE_PHYSICAL_CONTROL_DENIED =
  'SPACE_EARTH_FABRIC_DOES_NOT_ENABLE_VEHICLE_ATC_OR_SPACECRAFT_CONTROL' as const;
export const GENOME_SECRET_AUTHORITY_DENIED =
  'GENOME_EXPERIMENT_DENIES_SILENT_SECRET_SEALED_OR_AUTHORITY_COPY' as const;
export const GENOME_REVERSIBLE_REQUIRED =
  'GENOME_EXPERIMENT_MUST_BE_REVERSIBLE' as const;
export const NEURAL_UNBOUNDED_SPAWN_DENIED =
  'NEURAL_SIM_ACTIVATION_BOUNDED_UNBOUNDED_PROCESS_SPAWN_DENIED' as const;
export const CORRELATION_TO_CAUSATION_DENIED =
  'PATHWAY_MINER_DOES_NOT_PROMOTE_CORRELATION_TO_VERIFIED_CAUSATION_WITHOUT_EVIDENCE' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;

export type CrActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'hybrid_os_operator'
  | 'gpu_workload_operator'
  | 'quantum_researcher'
  | 'storage_nervous_operator'
  | 'leak_sentinel_defender'
  | 'space_fabric_curator'
  | 'genome_evolution_operator'
  | 'neural_sim_operator'
  | 'pathway_miner'
  | 'ordinary_agent'
  | 'impersonator';

export type CrActor = {
  kind: CrActorKind;
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
    CQ: {
      tipProbe:
        hasMod('offline-universe-quantum-genome-types.ts') ||
        hasMod('offline-universe-quantum-genome-runtime.ts') ||
        has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CQ Offline Universe / Quantum Genome tip + report. Poll with backoff when WAITING_DATA.',
    },
    CP: {
      tipProbe:
        hasMod('knowledge-supply-plugin-foundry-types.ts') ||
        has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CP Knowledge Supply / Plugin Foundry when CQ absent.',
    },
    CO: {
      tipProbe:
        hasMod('global-knowledge-exchange-os-types.ts') ||
        has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CO Global Knowledge Exchange OS preferred fallback @ 29b18b2.',
    },
    CN: {
      tipProbe:
        hasMod('world-knowledge-routing-os-types.ts') ||
        has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CN World Knowledge Routing OS when CP/CO absent.',
    },
    CM: {
      tipProbe:
        hasMod('sovereign-regional-knowledge-clouds-types.ts') ||
        has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CM Sovereign Regional Knowledge Clouds fallback.',
    },
    CL: {
      tipProbe:
        hasMod('global-knowledge-server-constellation-types.ts') ||
        has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CL Global Knowledge Server Constellation fallback.',
    },
    CK: {
      tipProbe:
        hasMod('cognitive-infra-mini-cloud-history-types.ts') ||
        has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CK Cognitive Infra / Mini-Cloud / History (parallel tip may exist).',
    },
    CJ: {
      tipProbe:
        hasMod('intelligence-resource-grid-apprenticeship-types.ts') ||
        has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CJ lineage when CK absent.',
    },
  };
}
