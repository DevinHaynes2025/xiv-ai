import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { conveneReflectionCouncil } from './reflection-council';
import { departmentByKey } from './business-structure';
import { ANTI_COLLUSION_DENY, type OpsDepartment, type OpsEvidenceState } from './enterprise-ops-types';

export type WorkcellKind = 'finance' | 'sales' | 'procurement' | 'it' | 'people' | 'security' | 'research' | 'customer' | 'supply_chain' | 'executive';

export type WorkcellResult = {
  kind: WorkcellKind;
  department: OpsDepartment;
  recommendation: string;
  productionAuthorization: false;
  spendingAuthorized: false;
  deployAuthorized: false;
  customerContactAuthorized: false;
  hiringAuthorized: false;
  purchaseAuthorized: false;
};

export type ConnectorProbe = {
  name: string;
  module: string;
  report: string;
  state: OpsEvidenceState;
};

const CONNECTORS: Array<{ name: string; module: string; report: string }> = [
  { name: 'supply_chain_ao', module: 'supply-chain-network.ts', report: 'docs/operations/62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md' },
  { name: 'control_tower_an', module: 'control-tower.ts', report: 'docs/operations/62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md' },
  { name: 'causal_twins_ah', module: 'causal-world-types.ts', report: 'docs/operations/62L_AH_CAUSAL_WORLD_MODEL_DIGITAL_TWINS_REPORT.md' },
  { name: 'agent_society_ag', module: 'agent-society-runtime.ts', report: 'docs/operations/62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md' },
  { name: 'universe_kernel_af', module: 'universe-os-kernel.ts', report: 'docs/operations/62L_AF_UNIVERSE_OS_KERNEL_MEMORY_REPLICATION_REPORT.md' },
];

export function probePredecessorConnectors(root: string): ConnectorProbe[] {
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const brain = existsSync(join(root, 'local-brain')) ? join(root, 'local-brain') : join(root, 'services', 'ai', 'local-brain');
  return CONNECTORS.map((item) => {
    const modulePresent = existsSync(join(brain, item.module));
    const reportPresent = existsSync(join(repoRoot, item.report));
    let state: OpsEvidenceState = 'WAITING_DATA';
    if (reportPresent && modulePresent) state = 'PASS';
    else if (!reportPresent && !modulePresent) state = 'WAITING_DATA';
    else if (modulePresent && !reportPresent) state = 'WAITING_DATA';
    return { name: item.name, module: item.module, report: item.report, state };
  });
}

export function departmentContext(department: OpsDepartment) {
  const known = departmentByKey(department === 'it' ? 'engineering' : department === 'people' ? 'executive' : department);
  return {
    department,
    reusedBusinessStructure: Boolean(known),
    responsibilities: known?.responsibilities ?? [`${department} operations planning (local AP catalog)`],
    productionAuthorization: false as const,
  };
}

export function runDepartmentWorkcell(kind: WorkcellKind, need: string): WorkcellResult {
  const department: OpsDepartment = kind === 'it' ? 'it' : kind;
  return {
    kind,
    department,
    recommendation: `${kind} workcell recommendation for "${need}": prepare a governed plan. Do not spend, deploy, hire, purchase, or contact customers.`,
    productionAuthorization: false,
    spendingAuthorized: false,
    deployAuthorized: false,
    customerContactAuthorized: false,
    hiringAuthorized: false,
    purchaseAuthorized: false,
  };
}

export function businessContinuityPlan(need: string) {
  return {
    mode: 'business_continuity_recommendation' as const,
    need,
    automaticFailover: false as const,
    productionFailoverAuthorized: false as const,
    recommendation: 'Document a continuity plan. Do not fail over production systems from this planner.',
  };
}

export function enterWarRoomMode(input: { tenantId: string; sealed?: boolean }) {
  return {
    mode: 'war_room' as const,
    tenantId: input.tenantId,
    elevatedCoordination: true as const,
    l4AutonomyEnabled: false as const,
    autoExecution: false as const,
    ceoSealedCompartmentalized: true as const,
    sealedPayload: input.sealed ? '[REDACTED_SEALED]' : null,
    productionAuthorization: false as const,
  };
}

export async function conveneOpsAgentCouncil(input: {
  tenantId: string;
  universeId: string;
  question: string;
  enterpriseIds?: string[];
  collusionTopic?: 'pricing' | 'bids' | 'customer_targeting' | 'planning';
  root?: string;
}) {
  const enterprises = [...new Set(input.enterpriseIds ?? [])];
  const collusive = Boolean(
    enterprises.length > 1
      && input.collusionTopic
      && input.collusionTopic !== 'planning',
  );
  if (collusive) {
    return {
      allowed: false as const,
      reason: ANTI_COLLUSION_DENY,
      consensusForced: false as const,
      productionAuthorized: false as const,
      council: null,
    };
  }
  const council = await conveneReflectionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    root: input.root,
  });
  return {
    allowed: true as const,
    reason: 'Local reflection council reused. AG agent society remains WAITING_DATA unless its report/module is on this tree.',
    consensusForced: false as const,
    productionAuthorized: false as const,
    council,
  };
}
