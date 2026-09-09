import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BN — Superbrain Neural Growth Engine + Organization Agent Factory +
 * Dynamic Department Creation + Global Knowledge Circulation +
 * Offline/Cloud Intelligence Metabolism contracts.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Growth is proposal/sandbox only — not auto production org/department deploy.
 */

export const SUPERBRAIN_NEURAL_GROWTH_CYCLE = [
  'inventory_search',
  'demand_proof',
  'redundant_growth_gate',
  'propose_neuron_or_pathway',
  'propose_agent_or_department_sandbox',
  'human_founder_approval_gate',
  'knowledge_circulation_govern',
  'metabolism_capacity_observe',
  'metabolism_route_local_cloud',
  'weaken_hibernate_low_value',
  'evidence',
  'honesty_locks',
] as const;

export type BnHop = (typeof SUPERBRAIN_NEURAL_GROWTH_CYCLE)[number];

export type BnEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'SANDBOX'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED';

export type BnHopRecord = {
  hop: BnHop;
  state: BnEvidenceState;
  summary: string;
  at: string;
};

export const BN_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_ORG_DEPLOY: false as const,
  AUTO_PRODUCTION_DEPARTMENT_DEPLOY: false as const,
  AUTO_PRIVILEGE_ESCALATION: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  RAW_PRIVATE_KNOWLEDGE_POOLING: false as const,
  UNCONTROLLED_LIVE_PROCESS_SPAWN: false as const,
  LEARNING_IS_PERMISSION_GRANT: false as const,
  PROPOSAL_IS_AUTHORITY: false as const,
  CHEAPER_FASTER_BYPASSES_SEALED: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  PRIVACY_OVER_SPEED_OR_PRICE: true as const,
  SEARCH_EXISTING_BEFORE_GROWTH: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BO — Superbrain Neuroplasticity Engine + Organization Knowledge DNA + Agent Skill Evolution + Global Intelligence Immune System + Adaptive Offline/Cloud Brain Layers' as const;

export type GrowthKind = 'neuron' | 'pathway' | 'agent_template' | 'department' | 'route' | 'tool' | 'knowledge_node';

export type GrowthProposalStatus =
  | 'REJECTED_REDUNDANT'
  | 'REJECTED_NO_DEMAND'
  | 'SANDBOX_PROPOSAL'
  | 'AWAITING_HUMAN_APPROVAL'
  | 'APPROVED_NOT_DEPLOYED'
  | 'DENIED';

export type PathwayHealth = 'active' | 'weakened' | 'hibernating' | 'retired';

export type MetabolismLocality = 'local' | 'edge' | 'cloud';

export type CapacityKind =
  | 'cpu'
  | 'ram'
  | 'storage'
  | 'local_model'
  | 'cloud_capacity'
  | 'model_calls'
  | 'queue'
  | 'network'
  | 'cost';

export type KnowledgeCirculationClass =
  | 'public_approved'
  | 'derived_aggregate'
  | 'permissioned_schema'
  | 'private_raw'
  | 'founder_sealed';

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()) {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  return {
    BM: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('WAITING_DATA' as const),
      note: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'Preferred BM tip + report present; used as BN base.'
        : 'Preferred BM tip present on origin; report still WAITING_DATA at probe time — BN bases on BM tip SHA.',
    },
    BL: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BL ancestor of BM.',
    },
    BK: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BK ancestor of BL/BM.',
    },
    BJ: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BJ ancestor.',
    },
    BD: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BD ancestor of BJ.',
    },
    BA: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BA ancestor.',
    },
    AY: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AY ancestor.',
    },
    AX: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AX ancestor.',
    },
  };
}

export function githubIssueSot() {
  return {
    githubIssue: 78,
    githubRole: 'implementation_source_of_truth' as const,
    gitlabIssue: 12,
    gitlabRole: 'coordination_only' as const,
    note: 'GitHub #78 is SoT; GitLab #12 is coordination only. Issue API may be unreadable.',
  };
}
