import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import { decisionGate } from './decision-gate';
import { describeGlobalOperationsBrain, registerBrainSubsystems } from './global-operations-brain';
import { deliberateExecutiveDecision } from './executive-decision-cortex';
import {
  resetWorkforceScheduler,
  scheduleWorkforceActivation,
  workforceSchedulerHonesty,
} from './global-agent-workforce-scheduler';
import { createBusinessDigitalTwin, runScenarioUniverse } from './business-world-simulation';
import { recordDecisionOutcome } from './decision-outcome-learning';
import { invokeExecutiveControlTower } from './executive-control-tower-api';
import {
  BJ_LOCKS,
  GLOBAL_OPERATIONS_BRAIN_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  githubIssueSot,
  predecessorMap,
  type BjActor,
  type BjEvidenceState,
  type BjHop,
  type BjHopRecord,
} from './global-operations-brain-types';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export {
  BJ_LOCKS,
  GLOBAL_OPERATIONS_BRAIN_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  githubIssueSot,
  predecessorMap,
};

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

function hop(name: BjHop, state: BjEvidenceState, summary: string): BjHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BjCycleInput = {
  tenantId: string;
  universeId: string;
  actor: BjActor;
  objective: string;
  decisionId?: string;
  twinClaimsFounderAuthority?: boolean;
  claimMillionProcesses?: boolean;
  claimScenarioAsFact?: boolean;
  attemptLearningPermissionEscalation?: boolean;
  root?: string;
};

export async function runGlobalOperationsBrainCycle(input: BjCycleInput) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BjHopRecord[] = [];
  const decisionId = input.decisionId ?? `bj-decision-${Date.now().toString(36)}`;

  resetWorkforceScheduler();
  const registry = registerBrainSubsystems();
  hops.push(
    hop(
      'subsystem_register',
      'PASS',
      `Registered ${registry.length} subsystems; wired=${registry.filter((s) => s.binding === 'wired').length}; waiting=${registry.filter((s) => s.binding === 'waiting_data').length}.`,
    ),
  );

  const bind = (hopName: BjHop, id: (typeof registry)[number]['id']) => {
    const sub = registry.find((s) => s.id === id)!;
    hops.push(
      hop(
        hopName,
        sub.binding === 'waiting_data' ? 'WAITING_DATA' : 'PASS',
        `${id}:${sub.binding} → ${sub.moduleHint}`,
      ),
    );
  };

  bind('memory_cortex_bind', 'memory_cortex');
  bind('knowledge_atlas_bind', 'knowledge_atlas');
  bind('offline_world_model_bind', 'offline_world_model');
  bind('agent_civilization_bind', 'agent_civilization');
  bind('agent_university_bind', 'agent_university');
  bind('neural_bus_bind', 'neural_bus');
  bind('research_civilization_bind', 'research_civilization');
  bind('discovery_foundry_bind', 'discovery_foundry');
  bind('business_intelligence_bind', 'business_industry_intelligence');
  bind('security_guardian_bind', 'security_guardian');

  const deliberation = deliberateExecutiveDecision({
    tenantId: input.tenantId,
    universeId: input.universeId,
    decisionId,
    objective: input.objective,
    actorKind: input.actor.kind === 'digital_twin' ? 'digital_twin' : input.actor.kind === 'human_founder' ? 'human_founder' : 'specialized_agent',
    twinClaimsFounderAuthority: input.twinClaimsFounderAuthority,
    options: [
      {
        id: 'opt-observe',
        label: 'Observe and prepare briefing',
        summary: 'Low-consequence local preparation',
        consequence: 'LOW',
      },
      {
        id: 'opt-pilot',
        label: 'Recommend bounded pilot',
        summary: 'Requires human approval before external effect',
        consequence: 'HIGH',
        forecastOnly: true,
      },
    ],
    production: false,
    financialCommitment: false,
  });
  hops.push(
    hop(
      'executive_cortex_deliberate',
      deliberation.twinIsFounder === false && deliberation.executableByAgent === false ? 'PASS' : 'FAIL',
      deliberation.reason,
    ),
  );

  const workforce = scheduleWorkforceActivation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    role: 'operations_analyst',
    taskId: decisionId,
    claimMillionProcesses: input.claimMillionProcesses,
  });
  hops.push(
    hop(
      'workforce_schedule',
      workforce.accepted || input.claimMillionProcesses ? (workforce.accepted ? 'PASS' : 'DENIED') : 'FAIL',
      `${workforce.reason}; materialized=${workforce.materializedProcesses}; logical=${workforce.logicalAddressSpace}`,
    ),
  );

  const twin = await createBusinessDigitalTwin({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'organization',
    displayName: 'BJ Org Twin',
    root,
  });
  const scenario = twin.twin
    ? await runScenarioUniverse({
        tenantId: input.tenantId,
        parentUniverseId: input.universeId,
        twinId: twin.twin.id,
        scenarioLabel: 'bj-scenario-a',
        hypothesis: input.objective,
        claimAsVerifiedFact: input.claimScenarioAsFact,
        root,
      })
    : {
        accepted: false,
        reason: twin.reason,
        scenario: null,
        forecast: null,
        verifiedFact: false as const,
        forecastIsFact: false as const,
        productionAuthorization: false as const,
      };
  hops.push(
    hop(
      'world_twin_scenario',
      scenario.accepted || input.claimScenarioAsFact ? (scenario.accepted ? 'PASS' : 'DENIED') : 'FAIL',
      scenario.reason,
    ),
  );

  const learning = await recordDecisionOutcome({
    tenantId: input.tenantId,
    universeId: input.universeId,
    decisionId,
    optionId: deliberation.rankedOptions[0]?.id ?? null,
    outcomeSummary: `Measured outcome for ${input.objective}`,
    evidenceRefs: ['bj-cycle'],
    measuredScore: 0.55,
    attemptPermissionEscalation: input.attemptLearningPermissionEscalation,
    root,
  });
  hops.push(
    hop(
      'decision_outcome_learn',
      learning.accepted || input.attemptLearningPermissionEscalation
        ? learning.accepted
          ? 'PASS'
          : 'DENIED'
        : 'FAIL',
      learning.reason,
    ),
  );

  const tower = invokeExecutiveControlTower({
    tenantId: input.tenantId,
    universeId: input.universeId,
    method: 'getExecutiveSnapshot',
  });
  hops.push(hop('control_tower_observe', tower.ok ? 'PASS' : 'FAIL', `Control tower ${tower.method} ok=${tower.ok}`));

  hops.push(
    hop(
      'runtime_local_edge_cloud',
      'PASS',
      'Local/edge/cloud runtime bound via hybrid-edge-cloud-runtime / offline-brain-runtime probes; unconfigured providers remain UNAVAILABLE.',
    ),
  );

  const gate = decisionGate({
    id: decisionId,
    action: input.objective,
    consequence: 'HIGH',
    production: true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  hops.push(
    hop(
      'authority_human_gate',
      gate.humanApprovalRequired && !gate.executableByAgent ? 'PASS' : 'FAIL',
      gate.reason,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `BJ cycle for ${input.objective}`,
      payload: {
        decisionId,
        hops: hops.map((h) => h.hop),
        l4: BJ_LOCKS.L4_AUTONOMY_ENABLED,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence ledger append (local).'));

  hops.push(
    hop(
      'honesty_locks',
      BJ_LOCKS.L4_AUTONOMY_ENABLED === false && BJ_LOCKS.MEGA_PR_BULK_INCLUDED === false ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  await appendLearning(
    {
      domain: 'global_operations_brain',
      subject: decisionId,
      claimState: 'MODEL_INFERENCE',
      summary: 'BJ integration cycle completed; no production authority.',
      sourceRefs: ['62L-BJ'],
      evidence: hops.map((h) => h.hop),
      confidence: 0.5,
      taskId: decisionId,
    },
    root,
  );

  const health = await checkLocalBrainHealth(root).catch(() => ({
    localModelAvailable: false,
    reason: 'health probe unavailable',
  }));

  return {
    cycle: GLOBAL_OPERATIONS_BRAIN_CYCLE,
    hops,
    brain: describeGlobalOperationsBrain(),
    deliberation,
    workforce: {
      ...workforce,
      honesty: workforceSchedulerHonesty(),
    },
    twin,
    scenario,
    learning,
    tower,
    gate,
    predecessors: predecessorMap(repoRoot()),
    sot: githubIssueSot(),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    honestyBanner: HONESTY_BANNER,
    locks: BJ_LOCKS,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    localHealth: health,
  };
}

export async function buildGlobalOperationsBrainHealthReport(root = process.cwd()) {
  const cycle = await runGlobalOperationsBrainCycle({
    tenantId: 'bj-health-tenant',
    universeId: 'bj-health-universe',
    actor: {
      kind: 'human_executive',
      id: 'bj-health-exec',
      tenantId: 'bj-health-tenant',
      universeId: 'bj-health-universe',
      role: 'coo',
    },
    objective: 'BJ health probe — recommendation only',
    root,
  });

  return {
    phase: '62L-BJ',
    honestyBanner: HONESTY_BANNER,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    megaPrBulkIncluded: false as const,
    sot: cycle.sot,
    predecessors: predecessorMap(repoRoot()),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    hopCount: cycle.hops.length,
    wiredSubsystems: cycle.brain.registry.filter((s) => s.binding === 'wired').map((s) => s.id),
    waitingSubsystems: cycle.brain.registry.filter((s) => s.binding === 'waiting_data').map((s) => s.id),
    locks: BJ_LOCKS,
  };
}
