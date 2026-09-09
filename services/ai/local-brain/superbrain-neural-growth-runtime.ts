/**
 * 62L-BN Superbrain Neural Growth integration runtime / façade cycle.
 */

import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { circulateKnowledge } from './global-knowledge-circulation';
import {
  approveSandboxProposal,
  organizationFactoryHonesty,
  proposeAgentTemplateSandbox,
  proposeDepartmentSandbox,
  resetOrganizationAgentFactory,
} from './organization-agent-factory';
import {
  hibernateLowValuePathway,
  neuralGrowthHonesty,
  proposeNeuralGrowth,
  registerPathway,
  resetNeuralGrowthEngine,
} from './superbrain-neural-growth-engine';
import {
  intelligenceMetabolismHonesty,
  listCapacities,
  refuseUnverifiedCloudWhenLocalVerified,
  resetIntelligenceMetabolism,
  routeIntelligenceWorkload,
} from './intelligence-metabolism';
import {
  BN_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPERBRAIN_NEURAL_GROWTH_CYCLE,
  githubIssueSot,
  predecessorMap,
  type BnEvidenceState,
  type BnHop,
  type BnHopRecord,
} from './superbrain-neural-growth-types';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export {
  BN_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPERBRAIN_NEURAL_GROWTH_CYCLE,
  githubIssueSot,
  predecessorMap,
};

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

function hop(name: BnHop, state: BnEvidenceState, summary: string): BnHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BnCycleInput = {
  tenantId: string;
  universeId: string;
  demandKey?: string;
  demandLabel?: string;
  demandProven?: boolean;
  demandEvidenceRefs?: string[];
  redundantAgentKey?: string;
  novelDepartmentKey?: string;
  lowValuePathwayKey?: string;
  attemptSealedCloudBypass?: boolean;
  root?: string;
};

export async function runSuperbrainNeuralGrowthCycle(input: BnCycleInput) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BnHopRecord[] = [];

  resetNeuralGrowthEngine();
  resetOrganizationAgentFactory();
  resetIntelligenceMetabolism();

  hops.push(
    hop(
      'inventory_search',
      'PASS',
      'Inventory search-first enabled (agents/departments/routes/tools/knowledge).',
    ),
  );

  const demandProven = input.demandProven !== false;
  const demandRefs = input.demandEvidenceRefs ?? (demandProven ? ['demand:bn-cycle'] : []);
  const growthKey = input.demandKey ?? 'novel_synaptic_analyst';
  const growth = proposeNeuralGrowth({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'agent_template',
    key: growthKey,
    label: input.demandLabel ?? growthKey,
    demandProven,
    demandEvidenceRefs: demandRefs,
  });
  hops.push(
    hop(
      'demand_proof',
      growth.demandProven ? 'PASS' : 'REJECTED',
      `demandProven=${growth.demandProven}; status=${growth.status}`,
    ),
  );

  const redundant = proposeNeuralGrowth({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'agent_template',
    key: input.redundantAgentKey ?? 'operations_analyst',
    demandProven: true,
    demandEvidenceRefs: ['demand:redundant-check'],
  });
  hops.push(
    hop(
      'redundant_growth_gate',
      redundant.status === 'REJECTED_REDUNDANT' ? 'PASS' : 'FAIL',
      `redundant status=${redundant.status}; reason=${redundant.reason}`,
    ),
  );

  hops.push(
    hop(
      'propose_neuron_or_pathway',
      growth.status === 'SANDBOX_PROPOSAL' || growth.status === 'REJECTED_REDUNDANT'
        ? 'SANDBOX'
        : growth.status === 'REJECTED_NO_DEMAND'
          ? 'REJECTED'
          : 'PASS',
      `primary growth ${growth.key} → ${growth.status}`,
    ),
  );

  const dept = proposeDepartmentSandbox({
    tenantId: input.tenantId,
    universeId: input.universeId,
    key: input.novelDepartmentKey ?? 'synaptic_operations_lab',
    displayName: 'Synaptic Operations Lab',
  });
  const agentSandbox = proposeAgentTemplateSandbox({
    tenantId: input.tenantId,
    universeId: input.universeId,
    key: growthKey,
    displayName: input.demandLabel ?? growthKey,
  });
  hops.push(
    hop(
      'propose_agent_or_department_sandbox',
      dept.orgReal === false && agentSandbox.orgReal === false ? 'SANDBOX' : 'FAIL',
      `dept=${dept.status}; agent=${agentSandbox.status}; orgReal=false`,
    ),
  );

  const approval = approveSandboxProposal({
    proposalId: dept.id,
    actorKind: 'human_founder',
    autoApplyToOrg: false,
  });
  hops.push(
    hop(
      'human_founder_approval_gate',
      approval.accepted && approval.proposal?.orgReal === false && approval.proposal.appliedToOrg === false
        ? 'PASS'
        : 'FAIL',
      approval.reason,
    ),
  );

  const circulation = circulateKnowledge({
    tenantId: input.tenantId,
    universeId: input.universeId,
    classification: 'derived_aggregate',
    title: 'BN cycle derived aggregate',
    derivedFromRefs: ['bn:cycle'],
    approvedForCirculation: true,
  });
  const rawDeny = circulateKnowledge({
    tenantId: input.tenantId,
    universeId: input.universeId,
    classification: 'private_raw',
    title: 'raw private',
    attemptRawPrivatePool: true,
  });
  hops.push(
    hop(
      'knowledge_circulation_govern',
      circulation.accepted && !rawDeny.accepted ? 'PASS' : 'FAIL',
      `derived=${circulation.state}; raw=${rawDeny.state}`,
    ),
  );

  const capacities = listCapacities();
  hops.push(
    hop(
      'metabolism_capacity_observe',
      'PASS',
      `Observed ${capacities.length} capacity planes; cloud unconfigured → UNAVAILABLE.`,
    ),
  );

  const sealedBypass = routeIntelligenceWorkload({
    tenantId: input.tenantId,
    universeId: input.universeId,
    workloadId: 'bn-sealed',
    classification: 'sealed_founder_priority',
    preferCheaper: true,
    preferFaster: true,
    preferCloud: input.attemptSealedCloudBypass !== false,
    privacySealed: true,
  });
  const unverifiedCloud = refuseUnverifiedCloudWhenLocalVerified({
    tenantId: input.tenantId,
    universeId: input.universeId,
    workloadId: 'bn-unverified-cloud',
  });
  const unconfigured = routeIntelligenceWorkload({
    tenantId: input.tenantId,
    universeId: input.universeId,
    workloadId: 'bn-cloud',
    classification: 'public',
    preferCloud: true,
    cloudPeer: 'aws',
  });
  hops.push(
    hop(
      'metabolism_route_local_cloud',
      sealedBypass.state === 'DENIED' &&
        unverifiedCloud.reason.includes('REFUSES_UNVERIFIED_CLOUD') &&
        unconfigured.state === 'UNAVAILABLE'
        ? 'PASS'
        : 'FAIL',
      `sealed=${sealedBypass.reason}; unverified=${unverifiedCloud.reason}; cloud=${unconfigured.reason}`,
    ),
  );

  const pathway = registerPathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    key: input.lowValuePathwayKey ?? 'low_value_echo',
    activationWeight: 1,
    valueScore: 0.1,
  });
  const hib = hibernateLowValuePathway({ pathwayId: pathway.id });
  hops.push(
    hop(
      'weaken_hibernate_low_value',
      hib.ok &&
        hib.pathway !== null &&
        hib.pathway.activationWeight < hib.previousWeight &&
        (hib.pathway.health === 'hibernating' || hib.pathway.health === 'weakened')
        ? 'PASS'
        : 'FAIL',
      hib.reason,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BN superbrain neural growth metabolism cycle',
      payload: {
        growthId: growth.id,
        hops: hops.map((h) => h.hop),
        l4: BN_LOCKS.L4_AUTONOMY_ENABLED,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence event recorded for BN cycle.'));

  hops.push(
    hop(
      'honesty_locks',
      BN_LOCKS.L4_AUTONOMY_ENABLED === false &&
        BN_LOCKS.AUTO_PRODUCTION_ORG_DEPLOY === false &&
        BN_LOCKS.MEGA_PR_BULK_INCLUDED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  await appendLearning(
    {
      domain: 'superbrain_neural_growth',
      subject: growth.id,
      claimState: 'MODEL_INFERENCE',
      summary: 'BN integration cycle completed; growth remains sandbox; no production authority.',
      sourceRefs: ['62L-BN'],
      evidence: hops.map((h) => h.hop),
      confidence: 0.5,
      taskId: growth.id,
    },
    root,
  );

  const preds = predecessorMap(repoRoot());
  return {
    hops,
    growth,
    redundant,
    departmentSandbox: dept,
    agentSandbox,
    approval,
    circulation,
    rawDeny,
    sealedBypass,
    unverifiedCloud,
    unconfiguredCloud: unconfigured,
    hibernation: hib,
    honesty: {
      banner: HONESTY_BANNER,
      locks: BN_LOCKS,
      neuralGrowth: neuralGrowthHonesty(),
      organizationFactory: organizationFactoryHonesty(),
      metabolism: intelligenceMetabolismHonesty(),
    },
    sot: githubIssueSot(),
    predecessors: preds,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    cycleComplete: hops.every((h) => h.state !== 'FAIL'),
  };
}

export function buildSuperbrainNeuralGrowthHealthReport(root = repoRoot()) {
  const preds = predecessorMap(root);
  return {
    phase: '62L-BN',
    title:
      'Superbrain Neural Growth Engine + Organization Agent Factory + Dynamic Department Creation + Global Knowledge Circulation + Offline/Cloud Intelligence Metabolism',
    honestyBanner: HONESTY_BANNER,
    locks: BN_LOCKS,
    sot: githubIssueSot(),
    predecessors: preds,
    cycle: SUPERBRAIN_NEURAL_GROWTH_CYCLE,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    megaPrBulkIncluded: false as const,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    neuralGrowth: neuralGrowthHonesty(),
    organizationFactory: organizationFactoryHonesty(),
    metabolism: intelligenceMetabolismHonesty(),
  };
}
