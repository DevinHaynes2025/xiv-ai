import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deliberateExecutiveDecision, executiveCortexHonesty } from './executive-decision-cortex';
import {
  hibernateWorkforceAgent,
  resetWorkforceScheduler,
  scheduleWorkforceActivation,
  WORKFORCE_HARD_CAPS,
  workforceSchedulerHonesty,
} from './global-agent-workforce-scheduler';
import {
  businessWorldHonesty,
  createBusinessDigitalTwin,
  runScenarioUniverse,
} from './business-world-simulation';
import { decisionOutcomeHonesty, recordDecisionOutcome } from './decision-outcome-learning';
import { invokeExecutiveControlTower } from './executive-control-tower-api';
import { describeGlobalOperationsBrain, registerBrainSubsystems } from './global-operations-brain';
import {
  BJ_LOCKS,
  GLOBAL_OPERATIONS_BRAIN_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  githubIssueSot,
  predecessorMap,
} from './global-operations-brain-types';
import {
  buildGlobalOperationsBrainHealthReport,
  runGlobalOperationsBrainCycle,
} from './global-operations-brain-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbj-'));
const tenantId = '62lbj-tenant';
const universeId = '62lbj-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-BJ-HONESTY',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      BJ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BJ_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BJ_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      BJ_LOCKS.DIGITAL_TWIN_IS_FOUNDER === false &&
      BJ_LOCKS.LEARNING_IS_PERMISSION_GRANT === false &&
      BJ_LOCKS.SIMULATION_IS_VERIFIED_FACT === false &&
      BJ_LOCKS.FORECAST_IS_FACT === false,
    'Honesty locks encode DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; L4 false; mega-PR bulk excluded.',
  );

  const sot = githubIssueSot();
  check(
    'US-BJ-SOT',
    sot.githubIssue === 74 && sot.gitlabIssue === 8 && sot.githubRole === 'implementation_source_of_truth',
    'GitHub #74 SoT; GitLab #8 coordination only.',
  );

  check(
    'US-BJ-NEXT',
    NEXT_PHASE_TITLE.startsWith('62L-BK'),
    `Next queue title recorded: ${NEXT_PHASE_TITLE}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BJ-BASE',
    preds.BD.tipProbe === 'PRESENT' && preds.BD.report === 'PRESENT' && preds.BI.tipProbe === 'WAITING_DATA',
    `BD present as base; BI=${preds.BI.tipProbe}; BH=${preds.BH.tipProbe}.`,
  );

  const registry = registerBrainSubsystems();
  check(
    'US-BJ-REGISTRY',
    registry.length === 16 &&
      registry.every((s) => s.productionAuthorization === false) &&
      registry.some((s) => s.id === 'executive_cortex' && s.binding === 'wired') &&
      registry.some((s) => s.id === 'discovery_foundry' && s.binding === 'waiting_data'),
    `Brain registry has ${registry.length} subsystems; discovery_foundry waiting; no prod auth.`,
  );

  const brain = describeGlobalOperationsBrain();
  check(
    'US-BJ-FACADE',
    brain.role === 'architectural_root_facade' && brain.honesty.megaPrBulkIncluded === false,
    'Global Operations Brain is façade/registry, not mega-PR bulk.',
  );

  const twinClaim = deliberateExecutiveDecision({
    tenantId,
    universeId,
    decisionId: 'd1',
    objective: 'Market entry',
    actorKind: 'digital_twin',
    twinClaimsFounderAuthority: true,
    options: [
      { id: 'a', label: 'Wait', summary: 'Observe', consequence: 'LOW' },
      { id: 'b', label: 'Spend', summary: 'Capex', consequence: 'CRITICAL' },
    ],
  });
  check(
    'US-BJ-TWIN',
    twinClaim.twinIsFounder === false &&
      twinClaim.executableByAgent === false &&
      twinClaim.productionAuthorization === false &&
      twinClaim.reason === 'DIGITAL_TWIN_IS_NOT_FOUNDER' &&
      twinClaim.selectedOptionId === null,
    'Digital Twin ≠ founder; options ranked only; human authority required.',
  );

  const exec = deliberateExecutiveDecision({
    tenantId,
    universeId,
    decisionId: 'd2',
    objective: 'Pilot',
    actorKind: 'human_executive',
    options: [
      { id: 'low', label: 'Brief', summary: 'Prep', consequence: 'LOW' },
      { id: 'high', label: 'Launch', summary: 'External', consequence: 'HIGH', forecastOnly: true },
    ],
  });
  check(
    'US-BJ-EXEC',
    exec.humanAuthorityRequired === true &&
      exec.recommendationIsDeploy === false &&
      exec.forecastIsFact === false &&
      exec.rankedOptions.length === 2 &&
      executiveCortexHonesty().L4_AUTONOMY_ENABLED === false,
    'Executive cortex returns bounded ranked options; forecast ≠ fact.',
  );

  resetWorkforceScheduler();
  const deniedMillions = scheduleWorkforceActivation({
    tenantId,
    universeId,
    role: 'researcher',
    claimMillionProcesses: true,
  });
  check(
    'US-BJ-WORKFORCE-DENY',
    deniedMillions.accepted === false &&
      deniedMillions.reason.includes('DENIED_MILLION_PROCESS_CLAIM') &&
      WORKFORCE_HARD_CAPS.materializeAllSlots === false,
    'Million-process claim denied; sparse activation only.',
  );

  const activation = scheduleWorkforceActivation({
    tenantId,
    universeId,
    role: 'operations_analyst',
    taskId: 'task-1',
  });
  check(
    'US-BJ-WORKFORCE',
    activation.accepted === true &&
      activation.sparseActivation === true &&
      activation.materializedProcesses <= WORKFORCE_HARD_CAPS.maxActiveActivations &&
      activation.logicalAddressSpace === WORKFORCE_HARD_CAPS.maxLogicalAddressSpace &&
      workforceSchedulerHonesty().millionProcessesRunning === false,
    `Sparse activation ok; materialized=${activation.materializedProcesses}.`,
  );

  if (activation.activation) {
    const hib = hibernateWorkforceAgent(activation.activation.id);
    check('US-BJ-HIBERNATE', hib.ok === true, 'Workforce agent can hibernate after activation.');
  } else {
    check('US-BJ-HIBERNATE', false, 'Missing activation instance.');
  }

  const founderClaimTwin = await createBusinessDigitalTwin({
    tenantId,
    universeId,
    kind: 'organization',
    displayName: 'Bad Twin',
    claimIsFounder: true,
    root,
  });
  check(
    'US-BJ-ORG-TWIN-DENY',
    founderClaimTwin.accepted === false && founderClaimTwin.reason === 'DIGITAL_TWIN_IS_NOT_FOUNDER',
    'Business twin cannot claim founder identity.',
  );

  const orgTwin = await createBusinessDigitalTwin({
    tenantId,
    universeId,
    kind: 'organization',
    displayName: 'Acme Twin',
    root,
  });
  check(
    'US-BJ-ORG-TWIN',
    orgTwin.accepted === true &&
      orgTwin.twin?.isFounder === false &&
      orgTwin.twin?.authority === 'SIMULATED_ONLY',
    'Persistent org twin is simulated-only.',
  );

  const factClaim = await runScenarioUniverse({
    tenantId,
    parentUniverseId: universeId,
    twinId: orgTwin.twin!.id,
    scenarioLabel: 'bad-fact',
    hypothesis: 'Revenue doubles',
    claimAsVerifiedFact: true,
    root,
  });
  check(
    'US-BJ-SCENARIO-DENY',
    factClaim.accepted === false && factClaim.reason === 'SIMULATION_IS_NOT_VERIFIED_FACT',
    'Scenario cannot be claimed as verified fact.',
  );

  const scenario = await runScenarioUniverse({
    tenantId,
    parentUniverseId: universeId,
    twinId: orgTwin.twin!.id,
    scenarioLabel: 'scenario-a',
    hypothesis: 'Modest growth',
    root,
  });
  check(
    'US-BJ-SCENARIO',
    scenario.accepted === true &&
      scenario.verifiedFact === false &&
      scenario.forecastIsFact === false &&
      scenario.scenario?.isolated === true &&
      businessWorldHonesty().simulationIsVerifiedFact === false,
    'Scenario Universe isolated; forecast ≠ fact.',
  );

  const escalate = await recordDecisionOutcome({
    tenantId,
    universeId,
    decisionId: 'd-esc',
    optionId: 'a',
    outcomeSummary: 'try escalate',
    evidenceRefs: ['e1'],
    attemptPermissionEscalation: true,
    root,
  });
  check(
    'US-BJ-LEARN-DENY',
    escalate.accepted === false &&
      escalate.permissionEscalated === false &&
      escalate.reason.includes('LEARNING_IS_NOT_PERMISSION_GRANT'),
    'Learning cannot escalate permissions.',
  );

  const learned = await recordDecisionOutcome({
    tenantId,
    universeId,
    decisionId: 'd-ok',
    optionId: 'low',
    outcomeSummary: 'Pilot prepared; human deferred launch',
    evidenceRefs: ['brief-1'],
    measuredScore: 0.7,
    root,
  });
  check(
    'US-BJ-LEARN',
    learned.accepted === true &&
      learned.learningIsPermissionGrant === false &&
      learned.productionChange === false &&
      decisionOutcomeHonesty().learningIsPermissionGrant === false,
    'Decision-to-outcome learning recorded without authority escalation.',
  );

  const tower = invokeExecutiveControlTower({
    tenantId,
    universeId,
    method: 'getHonestyLocks',
  });
  check(
    'US-BJ-TOWER',
    tower.ok === true &&
      tower.productionAuthorization === false &&
      tower.l4AutonomyEnabled === false &&
      tower.tipLand === false,
    'Unified Executive Control Tower API returns honesty locks; no tip-land.',
  );

  const towerReg = invokeExecutiveControlTower({
    tenantId,
    universeId,
    method: 'getBrainRegistry',
  });
  check('US-BJ-TOWER-REG', towerReg.ok === true && towerReg.status === 'IMPLEMENTED', 'Control tower exposes brain registry.');

  const cycle = await runGlobalOperationsBrainCycle({
    tenantId,
    universeId,
    actor: {
      kind: 'human_executive',
      id: 'exec-1',
      tenantId,
      universeId,
      role: 'coo',
    },
    objective: 'Integrate offline intelligence OS',
    claimMillionProcesses: true,
    claimScenarioAsFact: true,
    attemptLearningPermissionEscalation: true,
    twinClaimsFounderAuthority: true,
    root,
  });
  check(
    'US-BJ-CYCLE',
    cycle.hops.length === GLOBAL_OPERATIONS_BRAIN_CYCLE.length &&
      cycle.productionAuthorization === false &&
      cycle.l4AutonomyEnabled === false &&
      cycle.tipLand === false &&
      cycle.deliberation.reason === 'DIGITAL_TWIN_IS_NOT_FOUNDER' &&
      cycle.workforce.accepted === false &&
      cycle.scenario.accepted === false &&
      cycle.learning.accepted === false,
    `Full BJ cycle walked ${cycle.hops.length} hops; deny paths held.`,
  );

  const happy = await runGlobalOperationsBrainCycle({
    tenantId,
    universeId,
    actor: {
      kind: 'human_founder',
      id: 'founder-1',
      tenantId,
      universeId,
    },
    objective: 'Bounded briefing',
    root,
  });
  check(
    'US-BJ-CYCLE-OK',
    happy.workforce.accepted === true &&
      happy.scenario.accepted === true &&
      happy.learning.accepted === true &&
      happy.gate.humanApprovalRequired === true,
    'Happy-path cycle activates sparse workforce, scenario, and measured learning under human gate.',
  );

  const health = await buildGlobalOperationsBrainHealthReport(root);
  check(
    'US-BJ-HEALTH',
    health.productionAuthorization === false &&
      health.megaPrBulkIncluded === false &&
      health.sot.githubIssue === 74,
    'Health report keeps production auth false and mega-PR bulk excluded.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BJ');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('PASS 62L-BJ — Offline Intelligence OS + Executive Decision Cortex + Workforce Scheduler + World Simulation');
process.exit(0);
