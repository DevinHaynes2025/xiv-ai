import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BD — Cognitive Memory Chip + Agent Neural Bus + Universe Knowledge Router
 * + Persistent Offline Brain Fabric.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Portable software-defined architecture for ordinary CPUs/GPUs/NPUs/DRAM/NAND —
 * custom silicon is NOT required. No consciousness/sentience claims.
 */

export const COGNITIVE_MEMORY_CYCLE = [
  'substrate_declare',
  'context_allocate',
  'agent_model_memory',
  'intelligent_cache',
  'brain_snapshot',
  'neural_bus_bind',
  'authority_non_transfer',
  'evidence_exchange',
  'task_result_exchange',
  'universe_isolation',
  'knowledge_route_declare',
  'permission_check',
  'logical_wormhole',
  'founder_sealed_deny',
  'offline_boot',
  'snapshot_restore',
  'degraded_operation',
  'provider_honesty',
  'evidence',
  'learning',
] as const;

export type BdHop = (typeof COGNITIVE_MEMORY_CYCLE)[number];

export type BdEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED';

export type BdHopRecord = {
  hop: BdHop;
  state: BdEvidenceState;
  summary: string;
  at: string;
};

export const BD_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  CONSCIOUSNESS_CLAIM: false as const,
  SENTIENCE_CLAIM: false as const,
  AUTHORITY_TRANSFER_VIA_NEURAL_BUS: false as const,
  TRUST_AUTH_BYPASS_VIA_WORMHOLE: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  CUSTOM_HARDWARE_REQUIRED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  RECOMMENDATION_IS_DEPLOY: false as const,
  LABEL_IS_ACCESS: false as const,
  SIM_IS_VERIFIED_FACT: false as const,
});

export const MEMORY_SUBSTRATES = [
  'cpu',
  'gpu',
  'npu',
  'dram',
  'nand_ssd',
  'future_verified_hardware',
] as const;

export type MemorySubstrate = (typeof MEMORY_SUBSTRATES)[number];

export type SubstrateCapability = {
  substrate: MemorySubstrate;
  softwareDefined: true;
  customHardwareRequired: false;
  verified: boolean;
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_TESTED';
  note: string;
};

export const NEURAL_BUS_KINDS = [
  'evidence',
  'task',
  'result',
  'status',
  'challenge',
] as const;

export type NeuralBusKind = (typeof NEURAL_BUS_KINDS)[number];

export const AUTHORITY_TRANSFER_DENIED = 'AUTHORITY_TRANSFER_DENIED';
export const FOUNDER_SEALED_DENY_DEFAULT = 'FOUNDER_SEALED_DENY_BY_DEFAULT';
export const WORMHOLE_NO_TRUST_BYPASS = 'WORMHOLE_NO_TRUST_AUTH_BYPASS';
export const CROSS_UNIVERSE_ISOLATION = 'UNIVERSE_ISOLATION_PRESERVED';
export const OFFLINE_BOOT_OK = 'OFFLINE_BOOT_WITHOUT_LIVE_PROVIDERS';
export const DEGRADED_CONTRACT = 'DEGRADED_OPERATION_CONTRACT';
export const UNVERIFIED_PROVIDER = 'PROVIDER_UNAVAILABLE_UNTIL_VERIFIED';
export const NO_CONSCIOUSNESS = 'NO_CONSCIOUSNESS_OR_SENTIENCE_CLAIM';

export const NEXT_PHASE_TITLE =
  '62L-BE — XIV Digital Nervous System + Event Reflex Engine + Agent Swarm Task Forces + Real-Time Business Control Tower Fabric';

export type PredecessorId = 'BC' | 'BB' | 'BA' | 'AZ' | 'AY' | 'AX' | 'AW' | 'AV';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BC: 'self-optimizing-compiler.ts',
  BB: 'adaptive-compute-fabric.ts',
  BA: 'neural-database-runtime.ts',
  AZ: 'sovereign-identity-kernel.ts',
  AY: 'growth-media-runtime.ts',
  AX: 'sovereign-sealed-runtime.ts',
  AW: 'universal-app-runtime.ts',
  AV: 'universal-runtime.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  BC: '62L_BC_SELF_OPTIMIZING_SOFTWARE_COMPILER_REPORT.md',
  BB: '62L_BB_ADAPTIVE_COMPUTE_FABRIC_SCHEDULER_REPORT.md',
  BA: '62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md',
  AZ: '62L_AZ_SOVEREIGN_IDENTITY_KERNEL_REPORT.md',
  AY: '62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md',
  AX: '62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md',
  AW: '62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md',
  AV: '62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md',
};

/** Park/quantum letter-collision BC tip — never treated as official Self-Optimizing Compiler. */
export const PARK_BC_COLLISION_MODULES = [
  'quantum-agentic-pathway.ts',
  'quantum-memory-universes.ts',
] as const;

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BdEvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id])) ? 'PASS' : 'WAITING_DATA';
}

export function predecessorMap(cwd = process.cwd()) {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        module: predecessorModuleState(id),
        report: predecessorReportState(cwd, id),
        path: PREDECESSOR_MODULES[id],
        reportFile: PREDECESSOR_REPORTS[id],
      },
    ]),
  ) as Record<
    PredecessorId,
    {
      module: 'AVAILABLE' | 'WAITING_DATA';
      report: BdEvidenceState;
      path: string;
      reportFile: string;
    }
  >;
}

export function letterCollisionNote(): {
  parkBcTreatedAsOfficial: false;
  note: string;
} {
  return {
    parkBcTreatedAsOfficial: false,
    note:
      'A park worker may use 62l-bc-* / 62l-park-quantum* for quantum-agentic memory. Official BC is Self-Optimizing Software Compiler. Park tip is never preferred over BB/official BC.',
  };
}

export type BdActorKind =
  | 'ceo_principal'
  | 'ordinary_agent'
  | 'specialized_agent'
  | 'tool'
  | 'human_operator'
  | 'cloud_peer'
  | 'telemetry'
  | 'training_pipeline';

export type BdActor = {
  kind: BdActorKind;
  id: string;
  tenantId: string;
  universeId: string;
  role?: string;
  authorityLevel?: number;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';
