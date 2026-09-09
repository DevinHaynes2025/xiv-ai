import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CQ — XIV Offline Agent Universe Fabric + Accelerator/Cloud Collaboration +
 * Defensive Data Leak Sentinel + Quantum Research Pathways + Space/Earth Knowledge
 * Graph + Digital Genome & Trillion-Path Neural Infrastructure.
 *
 * SoT: GitHub #107. GitLab #41 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Extreme scale ("trillions of qubits/nodes/neurons", "10000 trillion universes") =
 * sparse logical address spaces / simulation structures / isolated namespace
 * architecture — NOT claims that many environments or qubits are physically running
 * unless real hardware evidence exists.
 *
 * Quantum: classical baseline required; simulator vs QPU separate; no quantum
 * advantage without evidence; unconfigured → UNAVAILABLE.
 * Accelerator adapters (AMD/NVIDIA) and cloud (AWS/GCP) / Cisco-compatible
 * contracts: configured+authorized+verified only.
 * Defensive leak detection only on authorized systems; leaked/stolen/restricted
 * data explicitly blocked from XIV (never offensive harvesting).
 * Local-first / offline agent shifts; sealed never silent cloud fallback.
 * Space/Earth/NASA/GPS/Starlink packs: authorized scientific knowledge only;
 * no control of real vehicles/ATC/physical systems.
 * Digital Genome branching: approved templates; no silent copy of
 * secrets/sealed/authority (reuse BP patterns).
 * Founder-sealed deny-by-default; learning ≠ permission.
 * L4=false. tip-land=NO. No mega-delta swallow.
 */

export const OFFLINE_UNIVERSE_QUANTUM_GENOME_CYCLE = [
  'honesty_locks',
  'offline_agent_universe_fabric_bootstrap',
  'trillion_scale_logical_catalog_bounded_activation',
  'accelerator_adapter_configured_gate',
  'cloud_collaboration_configured_gate',
  'cisco_compatible_contract_gate',
  'defensive_leak_sentinel_scan',
  'leaked_stolen_restricted_intake_denied',
  'offensive_harvest_capability_denied',
  'quantum_classical_baseline_required',
  'quantum_simulator_vs_qpu_evidence_gate',
  'space_earth_knowledge_pack_only',
  'space_pack_no_vehicle_atc_control',
  'digital_genome_branch_strip_secrets',
  'trillion_path_neural_sparse_logical',
  'sealed_no_silent_aws_gcp_model',
  'offline_shift_freshness_stale_waiting',
  'evidence',
  'learning',
] as const;

export type CqHop = (typeof OFFLINE_UNIVERSE_QUANTUM_GENOME_CYCLE)[number];

export type CqEvidenceState =
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
  | 'LOGICAL_ONLY'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'DEFENSIVE_ONLY';

export type CqHopRecord = {
  hop: CqHop;
  state: CqEvidenceState;
  summary: string;
  at: string;
};

export const CQ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  OFFLINE_AGENT_SHIFTS: true as const,
  TRILLION_SCALE_IS_LOGICAL_ADDRESS_SPACE: true as const,
  PHYSICAL_TRILLION_PROCESSES_CLAIMED: false as const,
  PHYSICAL_QUBIT_COUNT_WITHOUT_HARDWARE_EVIDENCE_VERIFIED: false as const,
  PHYSICAL_UNIVERSE_COUNT_WITHOUT_HARDWARE_EVIDENCE_VERIFIED: false as const,
  ACTIVATION_BOUNDED: true as const,
  ACCELERATOR_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED: true as const,
  CLOUD_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED: true as const,
  CISCO_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED: true as const,
  UNCONFIGURED_ADAPTER_AVAILABLE: false as const,
  DEFENSIVE_LEAK_SENTINEL_ONLY: true as const,
  OFFENSIVE_HARVEST_ALLOWED: false as const,
  LEAKED_STOLEN_RESTRICTED_INTAKE_ALLOWED: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  QUANTUM_SIMULATOR_EQ_QPU: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  UNCONFIGURED_QPU_AVAILABLE: false as const,
  SPACE_PACK_KNOWLEDGE_ONLY: true as const,
  SPACE_PACK_VEHICLE_ATC_PHYSICAL_CONTROL: false as const,
  GENOME_APPROVED_TEMPLATES_ONLY: true as const,
  GENOME_SILENT_COPY_SECRETS: false as const,
  GENOME_SILENT_COPY_SEALED: false as const,
  GENOME_SILENT_COPY_AUTHORITY: false as const,
  SEALED_SILENT_AWS_GCP_MODEL_FALLBACK: false as const,
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
  '62L-CR — XIV Hybrid Supercompute Universe OS + GPU/Quantum Workload Civilization + Multi-Cloud Storage Nervous System + Space/Earth Signal Knowledge Fabric + Digital Genome Evolution Engine + Massive Neural Simulation & Algorithm Discovery Grid' as const;

export const GITHUB_SOT_ISSUE = 107 as const;
export const GITLAB_COORDINATION_ISSUE = 41 as const;

/** Bounded activation — never spawn trillion processes from a catalog size. */
export const MAX_ACTIVE_UNIVERSE_NAMESPACES = 64 as const;
export const MAX_ACTIVE_OFFLINE_AGENTS = 256 as const;
export const MAX_ACTIVE_NEURAL_PATH_WALKERS = 128 as const;
/** Logical catalog ceiling for sparse address bookkeeping (not physical). */
export const LOGICAL_UNIVERSE_CATALOG_CEILING = 10_000_000_000_000 as const; // 10 trillion logical slots
export const LOGICAL_NEURAL_PATH_CEILING = 1_000_000_000_000_000 as const; // 1e15 logical paths

export const TRILLION_SCALE_LOGICAL_ONLY =
  'TRILLION_SCALE_IS_SPARSE_LOGICAL_ADDRESS_SPACE_NOT_PHYSICAL_PROCESS_SPAWN' as const;
export const PHYSICAL_CLAIM_NOT_VERIFIED =
  'PHYSICAL_QUBIT_OR_UNIVERSE_COUNT_CLAIM_WITHOUT_HARDWARE_EVIDENCE_NOT_VERIFIED' as const;
export const UNCONFIGURED_ADAPTER_UNAVAILABLE =
  'UNCONFIGURED_AMD_NVIDIA_AWS_GCP_CISCO_OR_QPU_UNAVAILABLE' as const;
export const LEAKED_INTAKE_DENIED =
  'LEAKED_STOLEN_OR_RESTRICTED_SOURCE_INTAKE_DENIED' as const;
export const OFFENSIVE_HARVEST_DENIED =
  'OFFENSIVE_HARVEST_CAPABILITY_DENIED_DEFENSIVE_SENTINEL_ONLY' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_PATH_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const SPACE_PHYSICAL_CONTROL_DENIED =
  'SPACE_EARTH_PACK_DOES_NOT_ENABLE_VEHICLE_ATC_OR_PHYSICAL_CONTROL' as const;
export const GENOME_STRIP_SECRETS_SEALED_AUTHORITY =
  'GENOME_BRANCH_STRIPS_SECRETS_SEALED_AND_AUTHORITY' as const;
export const SEALED_SILENT_CLOUD_MODEL_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_AWS_GCP_MODEL' as const;
export const OFFLINE_FRESHNESS_STALE_OR_WAITING =
  'OFFLINE_SHIFT_FRESHNESS_SENSITIVE_STALE_OR_WAITING_DATA' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;

export type CqActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'offline_shift_curator'
  | 'accelerator_operator'
  | 'cloud_collaborator'
  | 'sentinel_defender'
  | 'quantum_researcher'
  | 'space_knowledge_curator'
  | 'genome_brancher'
  | 'neural_infra_operator'
  | 'ordinary_agent'
  | 'impersonator';

export type CqActor = {
  kind: CqActorKind;
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
    CP: {
      tipProbe:
        hasMod('knowledge-supply-plugin-foundry-types.ts') ||
        has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CP Knowledge Supply / Plugin Foundry tip + report. Poll with backoff when WAITING_DATA.',
    },
    CO: {
      tipProbe:
        hasMod('global-knowledge-exchange-os-types.ts') ||
        has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CO Global Knowledge Exchange OS when CP absent. Preferred fallback @ 29b18b2.',
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
      note: 'CM Sovereign Regional Knowledge Clouds when CN/CO/CP absent.',
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
      note: 'CJ @ 478feb1 lineage when CK absent.',
    },
  };
}
