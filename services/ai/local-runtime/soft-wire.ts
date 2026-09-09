/**
 * 62L-EL — Soft-wire to existing Agent Brain policy / model-router / predecessors.
 */

import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canAutoExecute, requiresHumanApproval, authorizeTool } from '../policies';
import { EXECUTIVE_SUPPLIER_SIMULATION } from '../model-router';
import { getAgentTool, HIGH_RISK_TOOLS } from '../tools';
import {
  EL_LOCKS,
  GITHUB_SOT_ISSUE,
  HONESTY_BANNER,
  MAY_TREAT_AS_EXISTING_IN_REPO,
  NOT_TESTED_UNTIL_LOCAL_EVIDENCE,
} from './types';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const ops = join(repoRoot, 'docs/operations');

export type SoftWireProbe = {
  githubSot: typeof GITHUB_SOT_ISSUE;
  honestyBanner: typeof HONESTY_BANNER;
  l4AutonomyEnabled: false;
  policy: {
    canAutoExecuteAlwaysFalse: boolean;
    mediumRiskRequiresApproval: boolean;
    highRiskBlocked: boolean;
    sampleAuthorizeMediumRequiresApproval: boolean;
  };
  modelRouter: {
    supplierReallocationRequiresApproval: boolean;
    supplierReallocationIsProposalNotExecute: boolean;
  };
  diagnosticsRedactionPresent: boolean;
  predecessors: {
    ekReport: 'PRESENT' | 'ABSENT';
    eiReport: 'PRESENT' | 'ABSENT';
    ekTypesModule: 'PRESENT' | 'ABSENT';
  };
  mayTreatAsExisting: typeof MAY_TREAT_AS_EXISTING_IN_REPO;
  notTestedUntilLocalEvidence: typeof NOT_TESTED_UNTIL_LOCAL_EVIDENCE;
};

function opsPresent(prefix: string): 'PRESENT' | 'ABSENT' {
  try {
    const files = readdirSync(ops);
    return files.some((f) => f.startsWith(prefix)) ? 'PRESENT' : 'ABSENT';
  } catch {
    return 'ABSENT';
  }
}

export function probeSoftWires(): SoftWireProbe {
  const mediumTool = getAgentTool('simulate_supplier_reallocation');
  const mediumAuth = authorizeTool({
    agentType: 'executive_agent',
    toolId: 'simulate_supplier_reallocation',
    approved: false,
  });

  const highRiskBlocked =
    HIGH_RISK_TOOLS.length > 0 &&
    HIGH_RISK_TOOLS.every((toolId) => {
      const decision = authorizeTool({
        agentType: 'executive_agent',
        toolId,
        approved: true,
      });
      return decision.allowed === false;
    });

  const diagnosticsPath = join(here, '../diagnostics.ts');
  const ekTypes = join(here, '../local-brain/windows-amd-local-cognitive-os-types.ts');

  return {
    githubSot: GITHUB_SOT_ISSUE,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: EL_LOCKS.L4_AUTONOMY_ENABLED,
    policy: {
      canAutoExecuteAlwaysFalse: canAutoExecute(mediumTool) === false,
      mediumRiskRequiresApproval: requiresHumanApproval(mediumTool) === true,
      highRiskBlocked,
      sampleAuthorizeMediumRequiresApproval:
        mediumAuth.allowed === true && mediumAuth.requiresApproval === true,
    },
    modelRouter: {
      supplierReallocationRequiresApproval: EXECUTIVE_SUPPLIER_SIMULATION.requiresApproval === true,
      supplierReallocationIsProposalNotExecute: EXECUTIVE_SUPPLIER_SIMULATION.riskLevel === 'medium',
    },
    diagnosticsRedactionPresent: existsSync(diagnosticsPath),
    predecessors: {
      ekReport: opsPresent('62L_EK_'),
      eiReport: opsPresent('62L_EI_'),
      ekTypesModule: existsSync(ekTypes) ? 'PRESENT' : 'ABSENT',
    },
    mayTreatAsExisting: MAY_TREAT_AS_EXISTING_IN_REPO,
    notTestedUntilLocalEvidence: NOT_TESTED_UNTIL_LOCAL_EVIDENCE,
  };
}
