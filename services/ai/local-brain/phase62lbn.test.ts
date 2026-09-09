import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  approveSandboxProposal,
  organizationFactoryHonesty,
  proposeAgentTemplateSandbox,
  proposeDepartmentSandbox,
  resetOrganizationAgentFactory,
} from './organization-agent-factory';
import {
  circulateKnowledge,
  knowledgeCirculationHonesty,
  resetKnowledgeCirculation,
} from './global-knowledge-circulation';
import {
  hibernateLowValuePathway,
  neuralGrowthHonesty,
  proposeNeuralGrowth,
  registerPathway,
  resetNeuralGrowthEngine,
  searchExistingInventory,
} from './superbrain-neural-growth-engine';
import {
  intelligenceMetabolismHonesty,
  refuseUnverifiedCloudWhenLocalVerified,
  resetIntelligenceMetabolism,
  routeIntelligenceWorkload,
} from './intelligence-metabolism';
import {
  BN_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  githubIssueSot,
  predecessorMap,
} from './superbrain-neural-growth-types';
import {
  buildSuperbrainNeuralGrowthHealthReport,
  runSuperbrainNeuralGrowthCycle,
} from './superbrain-neural-growth-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbn-'));
const tenantId = '62lbn-tenant';
const universeId = '62lbn-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetNeuralGrowthEngine();
  resetOrganizationAgentFactory();
  resetKnowledgeCirculation();
  resetIntelligenceMetabolism();

  check(
    'US-BN-HONESTY',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      BN_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BN_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BN_LOCKS.AUTO_PRODUCTION_ORG_DEPLOY === false &&
      BN_LOCKS.AUTO_PRODUCTION_DEPARTMENT_DEPLOY === false &&
      BN_LOCKS.PROPOSAL_IS_AUTHORITY === false &&
      BN_LOCKS.LEARNING_IS_PERMISSION_GRANT === false &&
      BN_LOCKS.CHEAPER_FASTER_BYPASSES_SEALED === false &&
      BN_LOCKS.RAW_PRIVATE_KNOWLEDGE_POOLING === false &&
      BN_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      BN_LOCKS.PRIVACY_OVER_SPEED_OR_PRICE === true &&
      BN_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true,
    'Honesty locks: L4 false; growth sandbox-only; privacy over speed/price; mega-PR excluded.',
  );

  const sot = githubIssueSot();
  check(
    'US-BN-SOT',
    sot.githubIssue === 78 &&
      sot.gitlabIssue === 12 &&
      sot.githubRole === 'implementation_source_of_truth' &&
      sot.gitlabRole === 'coordination_only',
    'GitHub #78 SoT; GitLab #12 coordination only.',
  );

  check(
    'US-BN-NEXT',
    NEXT_PHASE_TITLE.startsWith('62L-BO'),
    `Next queue title recorded: ${NEXT_PHASE_TITLE}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BN-BASE',
    preds.BM.tipProbe === 'PRESENT' &&
      preds.BJ.tipProbe === 'PRESENT' &&
      preds.BJ.report === 'PRESENT' &&
      (preds.BM.report === 'PRESENT' || preds.BM.report === 'WAITING_DATA'),
    `BM tip present (report=${preds.BM.report}); BL=${preds.BL.tipProbe}; BK=${preds.BK.tipProbe}; BJ=${preds.BJ.tipProbe}.`,
  );

  // Required: redundant growth REJECTED when equivalent agent/route exists
  const inventory = searchExistingInventory({
    tenantId,
    universeId,
    kind: 'agent_template',
    key: 'operations_analyst',
  });
  const redundant = proposeNeuralGrowth({
    tenantId,
    universeId,
    kind: 'agent_template',
    key: 'operations_analyst',
    demandProven: true,
    demandEvidenceRefs: ['demand:ops'],
  });
  check(
    'US-BN-REDUNDANT-REJECT',
    inventory.length > 0 &&
      redundant.status === 'REJECTED_REDUNDANT' &&
      redundant.orgReal === false &&
      redundant.autoDeployed === false &&
      redundant.productionAuthorization === false,
    `Redundant growth rejected; hits=${inventory.length}; reason=${redundant.reason}`,
  );

  const redundantRoute = proposeNeuralGrowth({
    tenantId,
    universeId,
    kind: 'route',
    key: 'hybrid_edge_cloud',
    demandProven: true,
    demandEvidenceRefs: ['demand:route'],
  });
  check(
    'US-BN-REDUNDANT-ROUTE',
    redundantRoute.status === 'REJECTED_REDUNDANT',
    `Redundant route rejected: ${redundantRoute.reason}`,
  );

  // Required: new department/agent remains sandbox until approval (not auto-applied)
  const novelAgent = proposeAgentTemplateSandbox({
    tenantId,
    universeId,
    key: 'synaptic_growth_curator',
    displayName: 'Synaptic Growth Curator',
  });
  const novelDept = proposeDepartmentSandbox({
    tenantId,
    universeId,
    key: 'neural_growth_bureau',
    displayName: 'Neural Growth Bureau',
  });
  const approved = approveSandboxProposal({
    proposalId: novelDept.id,
    actorKind: 'human_founder',
    autoApplyToOrg: false,
  });
  const autoApplyDenied = approveSandboxProposal({
    proposalId: novelAgent.id,
    actorKind: 'human_founder',
    autoApplyToOrg: true,
  });
  check(
    'US-BN-SANDBOX-UNTIL-APPROVAL',
    novelAgent.status === 'SANDBOX_ISOLATED' &&
      novelAgent.orgReal === false &&
      novelAgent.appliedToOrg === false &&
      novelDept.orgReal === false &&
      approved.accepted === true &&
      approved.proposal?.status === 'APPROVED_NOT_DEPLOYED' &&
      approved.proposal.orgReal === false &&
      approved.proposal.appliedToOrg === false &&
      autoApplyDenied.accepted === false &&
      organizationFactoryHonesty().autoProductionOrgDeploy === false,
    'Department/agent remain sandbox; approval does not auto-apply org-real.',
  );

  // Required: low-value pathway hibernation weakens activation weight
  const pathway = registerPathway({
    tenantId,
    universeId,
    key: 'echo_noise_pathway',
    activationWeight: 1,
    valueScore: 0.05,
  });
  const hib = hibernateLowValuePathway({ pathwayId: pathway.id, valueThreshold: 0.35 });
  check(
    'US-BN-HIBERNATE-WEAKEN',
    hib.ok === true &&
      hib.pathway !== null &&
      hib.pathway.activationWeight < hib.previousWeight &&
      (hib.pathway.health === 'hibernating' || hib.pathway.health === 'weakened') &&
      hib.previousWeight === 1,
    `Pathway weight ${hib.previousWeight} → ${hib.pathway?.activationWeight}; health=${hib.pathway?.health}`,
  );

  // Required: metabolism refuses unverified cloud when only local verified
  const unverified = refuseUnverifiedCloudWhenLocalVerified({
    tenantId,
    universeId,
    workloadId: 'w-unverified',
    cloudPeer: 'aws',
  });
  check(
    'US-BN-REFUSE-UNVERIFIED-CLOUD',
    unverified.state === 'DENIED' &&
      unverified.reason === 'REFUSES_UNVERIFIED_CLOUD_WHEN_ONLY_LOCAL_VERIFIED' &&
      unverified.routedTo === 'local',
    unverified.reason,
  );

  // Required: cheaper/faster cannot bypass sealed/privacy deny
  const sealedBypass = routeIntelligenceWorkload({
    tenantId,
    universeId,
    workloadId: 'w-sealed',
    classification: 'sealed_founder_priority',
    preferCheaper: true,
    preferFaster: true,
    preferCloud: true,
    privacySealed: true,
  });
  check(
    'US-BN-SEALED-BEATS-CHEAPER',
    sealedBypass.state === 'DENIED' &&
      sealedBypass.cheaperFasterBypassAttempted === true &&
      sealedBypass.privacyOverSpeedOrPrice === true &&
      sealedBypass.reason.includes('SEALED_OR_PRIVACY_DENY') &&
      intelligenceMetabolismHonesty().cheaperFasterBypassesSealed === false,
    sealedBypass.reason,
  );

  // Required: unconfigured cloud capacity → UNAVAILABLE
  const unconfigured = routeIntelligenceWorkload({
    tenantId,
    universeId,
    workloadId: 'w-cloud',
    classification: 'public',
    preferCloud: true,
    cloudPeer: 'azure',
  });
  check(
    'US-BN-CLOUD-UNAVAILABLE',
    unconfigured.state === 'UNAVAILABLE' &&
      unconfigured.reason === 'UNCONFIGURED_CLOUD_CAPACITY_UNAVAILABLE' &&
      intelligenceMetabolismHonesty().unconfiguredCloud === 'UNAVAILABLE',
    unconfigured.reason,
  );

  // Knowledge circulation: raw private denied; approved derived ok
  const raw = circulateKnowledge({
    tenantId,
    universeId,
    classification: 'private_raw',
    title: 'raw secrets',
    attemptRawPrivatePool: true,
  });
  const derived = circulateKnowledge({
    tenantId,
    universeId,
    classification: 'derived_aggregate',
    title: 'approved aggregate',
    derivedFromRefs: ['lake:1'],
    approvedForCirculation: true,
  });
  check(
    'US-BN-KNOWLEDGE-CIRCULATION',
    raw.accepted === false &&
      raw.state === 'DENIED' &&
      derived.accepted === true &&
      knowledgeCirculationHonesty().rawPrivateKnowledgePooling === false,
    `raw=${raw.reason}; derived=${derived.reason}`,
  );

  const noDemand = proposeNeuralGrowth({
    tenantId,
    universeId,
    kind: 'neuron',
    key: 'speculative_neuron',
    demandProven: false,
  });
  check(
    'US-BN-NO-DEMAND',
    noDemand.status === 'REJECTED_NO_DEMAND',
    'Growth without proven demand is rejected.',
  );

  const privilege = proposeAgentTemplateSandbox({
    tenantId,
    universeId,
    key: 'shadow_admin',
    attemptPrivilegeEscalation: true,
  });
  check(
    'US-BN-NO-PRIVILEGE-ESCALATION',
    privilege.status === 'DENIED' && privilege.reason === 'SILENT_PRIVILEGE_ESCALATION_DENIED',
    'Silent privilege escalation denied.',
  );

  check(
    'US-BN-GROWTH-HONESTY',
    neuralGrowthHonesty().searchExistingBeforeGrowth === true &&
      neuralGrowthHonesty().proposalIsAuthority === false &&
      neuralGrowthHonesty().megaPrBulkIncluded === false,
    'Growth honesty: search-first; proposal≠authority; mega-PR excluded.',
  );

  const cycle = await runSuperbrainNeuralGrowthCycle({
    tenantId,
    universeId,
    demandKey: 'cycle_novel_curator',
    novelDepartmentKey: 'cycle_growth_dept',
    root,
  });
  check(
    'US-BN-CYCLE',
    cycle.cycleComplete === true &&
      cycle.productionAuthorization === false &&
      cycle.l4AutonomyEnabled === false &&
      cycle.redundant.status === 'REJECTED_REDUNDANT' &&
      cycle.departmentSandbox.orgReal === false &&
      cycle.hibernation.ok === true,
    `Full BN cycle complete; hops=${cycle.hops.length}.`,
  );

  const health = buildSuperbrainNeuralGrowthHealthReport(repoRoot);
  check(
    'US-BN-HEALTH',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.tipLand === false &&
      health.megaPrBulkIncluded === false &&
      health.sot.githubIssue === 78,
    'Health report encodes honesty + SoT.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} BN checks:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('All 62L-BN Superbrain Neural Growth / Metabolism safety tests passed.');
