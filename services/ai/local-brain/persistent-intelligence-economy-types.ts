import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CI — XIV Persistent Intelligence Economy + Agent Workforce Operating Ledger +
 * World Knowledge Simulation Engine + Autonomous Database Research Lab +
 * Local Model Evolution Academy + Global Edge Knowledge Exchange.
 *
 * SoT: GitHub #99. GitLab #33 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Resource accounting ≠ purchasing/billing authority — no autonomous spending.
 * RUNNING_VERIFIED requires heartbeat/runtime evidence.
 * Simulation ≠ verified fact; world/business sim labeled.
 * DB research lab = sandbox only; no production schema/migration apply.
 * Model evolution eval-driven; learning ≠ permission grant.
 * Edge knowledge exchange: approved deltas only, revocable, enrolled nodes only.
 * No hidden device deployment; deploy without enrollment DENIED.
 * Local-first; sealed never silent cloud fallback; Founder-sealed deny-by-default.
 * L4=false. tip-land=NO.
 */

export const PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE = [
  'honesty_locks',
  'economy_account_resources',
  'economy_spend_purchase_bill_denied',
  'workforce_register_agent',
  'workforce_running_verified_requires_heartbeat',
  'workforce_no_heartbeat_not_running_verified',
  'simulation_run_labeled',
  'simulation_not_verified_fact',
  'db_lab_propose_sandbox',
  'db_lab_production_apply_denied',
  'model_academy_eval_candidate',
  'model_academy_no_permission_escalation',
  'edge_enroll_node',
  'edge_unenrolled_exchange_denied',
  'edge_approve_delta',
  'edge_unapproved_delta_denied',
  'edge_revoke_delta',
  'edge_revoked_import_rejected',
  'hidden_device_deploy_denied',
  'evidence',
  'learning',
] as const;

export type CiHop = (typeof PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE)[number];

export type CiEvidenceState =
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
  | 'RUNNING_VERIFIED'
  | 'REGISTERED'
  | 'HEARTBEAT_STALE'
  | 'REVOKED'
  | 'ENROLLED';

export type CiHopRecord = {
  hop: CiHop;
  state: CiEvidenceState;
  summary: string;
  at: string;
};

export const CI_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  AUTONOMOUS_SPENDING: false as const,
  PURCHASE_AUTHORITY: false as const,
  BILLING_AUTHORITY: false as const,
  RESOURCE_ACCOUNTING_IS_SPEND: false as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  SIMULATION_IS_VERIFIED_FACT: false as const,
  SIMULATION_MUST_BE_LABELED: true as const,
  DB_LAB_PRODUCTION_APPLY: false as const,
  DB_LAB_SANDBOX_ONLY: true as const,
  MODEL_EVOLUTION_GRANTS_PERMISSION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  EDGE_EXCHANGE_UNENROLLED: false as const,
  EDGE_EXCHANGE_UNAPPROVED_DELTA: false as const,
  EDGE_EXCHANGE_REVOKED_DELTA: false as const,
  HIDDEN_DEVICE_DEPLOY: false as const,
  DEVICE_DEPLOY_REQUIRES_ENROLLMENT: true as const,
  LOCAL_FIRST: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CJ — XIV Intelligence Resource Grid + Autonomous Agent Apprenticeship Network + Historical Knowledge Reconstruction Engine + Self-Optimizing Retrieval/Memory Lab + Local/Cloud Model Federation + Universal Edge Runtime Mesh' as const;

export const GITHUB_SOT_ISSUE = 99 as const;
export const GITLAB_COORDINATION_ISSUE = 33 as const;

export const ECONOMY_SPEND_DENIED =
  'INTELLIGENCE_ECONOMY_CANNOT_SPEND_PURCHASE_OR_BILL' as const;
export const RUNNING_VERIFIED_REQUIRES_HEARTBEAT =
  'RUNNING_VERIFIED_REQUIRES_HEARTBEAT_RUNTIME_EVIDENCE' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'AGENT_WITHOUT_HEARTBEAT_CANNOT_BE_RUNNING_VERIFIED' as const;
export const SIMULATION_LABELED_NOT_FACT =
  'SIMULATION_OUTPUT_LABELED_NOT_VERIFIED_FACT' as const;
export const DB_LAB_PRODUCTION_APPLY_DENIED =
  'DB_RESEARCH_LAB_CANNOT_APPLY_PRODUCTION_SCHEMA_OR_MIGRATION' as const;
export const MODEL_EVOLUTION_NO_PERMISSION =
  'MODEL_EVOLUTION_DOES_NOT_ESCALATE_PERMISSIONS' as const;
export const UNENROLLED_EDGE_EXCHANGE_DENIED =
  'UNENROLLED_EDGE_KNOWLEDGE_EXCHANGE_DENIED' as const;
export const UNAPPROVED_DELTA_EXCHANGE_DENIED =
  'UNAPPROVED_KNOWLEDGE_DELTA_CANNOT_EXCHANGE' as const;
export const REVOKED_DELTA_IMPORT_REJECTED =
  'REVOKED_KNOWLEDGE_DELTA_REJECTED_ON_IMPORT' as const;
export const HIDDEN_DEVICE_DEPLOY_DENIED =
  'DEPLOY_WITHOUT_ENROLLMENT_DENIED_NO_HIDDEN_DEVICE_PATH' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type ResourceKind = 'compute' | 'memory' | 'storage' | 'model_calls';

export type WorkforceStatus =
  | 'REGISTERED'
  | 'IDLE'
  | 'SCHEDULED'
  | 'HEARTBEAT_STALE'
  | 'STOPPED'
  | 'RUNNING_VERIFIED'
  | 'DENIED';

export type CiActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'economy_ledger_agent'
  | 'workforce_ledger_agent'
  | 'simulation_engine'
  | 'db_research_lab'
  | 'model_evolution_academy'
  | 'edge_exchange_agent'
  | 'ordinary_agent'
  | 'impersonator';

export type CiActor = {
  kind: CiActorKind;
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
    CH: {
      tipProbe: hasMod('knowledge-civilization-dept-universities-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CH Knowledge Civilization / Dept Universities tip + report.',
    },
    CG: {
      tipProbe: hasMod('deep-knowledge-refinery-os-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS when CH absent.',
    },
    CF: {
      tipProbe: hasMod('data-refinery-compression-replication-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication when CG/CH absent.',
    },
    CE: {
      tipProbe: hasMod('knowledge-excavation-memory-lake-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CE Knowledge Excavation / Memory Lake fallback.',
    },
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CD Data-Root / Local LLM / Archive Mesh fallback.',
    },
  };
}

export function selectPreferredPredecessor(
  root = repoRootFromHere(),
): { key: string; probe: PredecessorProbe } {
  const map = predecessorMap(root);
  for (const key of ['CH', 'CG', 'CF', 'CE', 'CD'] as const) {
    const probe = map[key];
    if (probe.tipProbe === 'PRESENT') return { key, probe };
  }
  return { key: 'NONE', probe: { tipProbe: 'WAITING_DATA', report: 'MISSING', note: 'No predecessor tip modules found.' } };
}
