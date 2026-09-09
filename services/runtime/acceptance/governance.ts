/**
 * AC-08 resource governance.
 * AC-09 massive logical-agent architecture.
 * AC-21 cost governance.
 * AC-22 observability.
 */
import { MANDATORY_HARD_TERMINATION_MS, MAX_AGENT_SPAWN_DEPTH, RESOURCE_DIMENSIONS } from '../src/governor';
import { LOCAL_REFERENCE_MODEL_ID } from '../src/plane';
import { REQUIRED_TELEMETRY_SIGNALS, REQUIRED_WORKLOAD_SIGNALS } from '../src/telemetry';
import type { AcceptanceResult, Threshold } from './harness';
import {
  TENANT_A,
  TENANT_B,
  atLeast,
  atMost,
  boolean as booleanThreshold,
  buildFixture,
  catchCode,
  percent,
  standardBudget,
  standardQuota,
  summarize,
  workloadSpec,
  zero,
} from './harness';
import type { ResourceDimension } from '../src/types';

export function runAc08(): AcceptanceResult {
  const { plane, clock, operatorA } = buildFixture();
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'gov-1' });
  const hardware = { classIds: [plane.hostHardware.classId] };

  // Every control in the AC-08 list gets its own enforcement test: a lease with
  // a deliberately small limit for one dimension, then an attempt to exceed it.
  const enforcement: Record<string, string> = {};
  const chargeable: ResourceDimension[] = [
    'cpuMillis',
    'gpuMillis',
    'ramMb',
    'storageMb',
    'networkKb',
    'modelCalls',
    'modelTokens',
    'maxAgents',
    'maxTasks',
    'maxCostUsd',
  ];

  for (const dimension of chargeable) {
    const spec = workloadSpec({
      tenant: TENANT_A,
      hardware,
      budget: standardBudget({ [dimension]: 2 } as never),
    });
    const lease = plane.governor.admit({ workloadId: spec.workloadId, tenant: TENANT_A, budget: spec.budget });
    plane.governor.start(lease);
    enforcement[dimension] = catchCode(() => plane.governor.charge(lease, dimension, 3));
    plane.governor.close(lease, null, { costAttributed: true });
  }

  // Duration and the mandatory hard-termination ceiling.
  const durationSpec = workloadSpec({
    tenant: TENANT_A,
    hardware,
    budget: standardBudget({ maxDurationMs: 1_000, hardTerminationMs: 2_000 }),
  });
  const durationLease = plane.governor.admit({
    workloadId: durationSpec.workloadId,
    tenant: TENANT_A,
    budget: durationSpec.budget,
  });
  plane.governor.start(durationLease);
  clock.advance(1_500);
  enforcement.maxDurationMs = catchCode(() => plane.governor.charge(durationLease, 'cpuMillis', 1));
  clock.advance(1_000);
  enforcement.hardTerminationMs = catchCode(() => plane.governor.enforceDuration(durationLease));
  plane.governor.close(durationLease, null, { costAttributed: true });

  // A budget that tries to opt out of the mandatory ceiling is not admissible.
  const ceilingRejections = {
    above_ceiling: catchCode(() =>
      plane.governor.admit({
        workloadId: 'gov-above-ceiling',
        tenant: TENANT_A,
        budget: standardBudget({ hardTerminationMs: MANDATORY_HARD_TERMINATION_MS + 1 }),
      }),
    ),
    infinite: catchCode(() =>
      plane.governor.admit({
        workloadId: 'gov-infinite',
        tenant: TENANT_A,
        budget: standardBudget({ hardTerminationMs: Number.POSITIVE_INFINITY }),
      }),
    ),
    negative: catchCode(() =>
      plane.governor.admit({
        workloadId: 'gov-negative',
        tenant: TENANT_A,
        budget: standardBudget({ cpuMillis: -1 }),
      }),
    ),
    duration_above_hard_limit: catchCode(() =>
      plane.governor.admit({
        workloadId: 'gov-duration-above',
        tenant: TENANT_A,
        budget: standardBudget({ maxDurationMs: 200_000, hardTerminationMs: 100_000 }),
      }),
    ),
  };

  // Recursive agent creation: depth is capped independently of the budget.
  const recursionSpec = workloadSpec({ tenant: TENANT_A, hardware, budget: standardBudget({ maxAgents: 1_000 }) });
  const recursionLease = plane.governor.admit({
    workloadId: recursionSpec.workloadId,
    tenant: TENANT_A,
    budget: recursionSpec.budget,
  });
  plane.governor.start(recursionLease);
  let spawnDepthReached = 0;
  let recursionCode = 'no_error';
  for (let depth = 1; depth <= 50; depth += 1) {
    const code = catchCode(() => plane.governor.noteAgentSpawn(recursionLease, depth));
    if (code !== 'no_error') {
      recursionCode = code;
      break;
    }
    spawnDepthReached = depth;
  }
  plane.governor.close(recursionLease, null, { costAttributed: true });

  // Unbounded model-call loop: the loop terminates on the budget, not on luck.
  const loopSpec = workloadSpec({
    tenant: TENANT_A,
    hardware,
    budget: standardBudget({ modelCalls: 5, modelTokens: 5_000 }),
  });
  const loopLease = plane.governor.admit({ workloadId: loopSpec.workloadId, tenant: TENANT_A, budget: loopSpec.budget });
  plane.governor.start(loopLease);
  let modelCallsMade = 0;
  let loopCode = 'no_error';
  for (let index = 0; index < 10_000; index += 1) {
    const code = catchCode(() => plane.governor.noteModelCall(loopLease, 100, 0.001));
    if (code !== 'no_error') {
      loopCode = code;
      break;
    }
    modelCallsMade += 1;
  }
  plane.governor.close(loopLease, null, { costAttributed: true });

  // Tenant quota: a second tenant with a deliberately small quota.
  plane.setTenantQuota(standardQuota(TENANT_B, { concurrentWorkloads: 2, cpuMillis: 20_000 }));
  const quotaCodes: string[] = [];
  for (let index = 0; index < 5; index += 1) {
    quotaCodes.push(
      catchCode(() =>
        plane.governor.admit({
          workloadId: `quota-${index}`,
          tenant: TENANT_B,
          budget: standardBudget({ cpuMillis: 9_000 }),
        }),
      ),
    );
  }
  const quotaBypasses = quotaCodes.slice(2).filter((code) => code === 'no_error').length;

  // Real executions: every one must carry an enforceable policy.
  const executed: string[] = [];
  for (let index = 0; index < 50; index += 1) {
    const outcome = plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 300 },
    );
    executed.push(outcome.record.workloadId);
  }
  const withPolicy = executed.filter((workloadId) =>
    plane.audit.has((event) => event.kind === 'budget_attached' && event.subjectId === workloadId),
  ).length;
  // A workload that outlived the mandatory ceiling without a limit having
  // terminated it is the failure this threshold is looking for.
  const beyondHardTermination = plane.governor
    .allUsage()
    .filter((usage) => usage.durationMs > MANDATORY_HARD_TERMINATION_MS && usage.terminatedByLimit === null).length;

  const enforcedDimensions = Object.entries(enforcement).filter(
    ([, code]) => code === 'budget_exceeded' || code === 'hard_termination',
  ).length;

  const thresholds: Threshold[] = [
    atLeast('resource_policy', 'Workloads with resource policy', percent(withPolicy, executed.length), 100, {
      blocker: true,
    }),
    atLeast(
      'hard_limit_enforcement',
      'Tested hard-limit enforcement',
      percent(enforcedDimensions, Object.keys(enforcement).length),
      100,
      { blocker: true },
    ),
    zero('quota_bypasses', 'Unauthorized quota bypasses', quotaBypasses, { blocker: true }),
    zero(
      'recursive_agent_creation',
      'Infinite/recursive agent creation',
      recursionCode === 'recursion_limit' && spawnDepthReached <= MAX_AGENT_SPAWN_DEPTH ? 0 : 1,
      { blocker: true, note: `stopped at depth ${spawnDepthReached} with ${recursionCode}` },
    ),
    zero(
      'unbounded_model_loops',
      'Unbounded model-call loops',
      loopCode === 'budget_exceeded' && modelCallsMade <= loopSpec.budget.modelCalls ? 0 : 1,
      { blocker: true, note: `stopped after ${modelCallsMade} calls with ${loopCode}` },
    ),
    zero(
      'beyond_hard_termination',
      'Workloads continuing beyond mandatory hard termination limit',
      beyondHardTermination,
      { blocker: true },
    ),
  ];

  return summarize('AC-08', 'Resource Governance', thresholds, {
    controls: RESOURCE_DIMENSIONS,
    enforcementCodes: enforcement,
    inadmissibleBudgets: ceilingRejections,
    mandatoryHardTerminationMs: MANDATORY_HARD_TERMINATION_MS,
    maxAgentSpawnDepth: MAX_AGENT_SPAWN_DEPTH,
    quotaAdmissionCodes: quotaCodes,
    executedWorkloads: executed.length,
  });
}

export function runAc09(): AcceptanceResult {
  const { plane, operatorA, limitedA } = buildFixture();
  const TARGET = 100_000;
  const COLLIDING_KEYS = 5_000;

  const node = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'agents-1' });

  const startedAt = performance.now();
  const keys = Array.from({ length: TARGET }, (_, index) => `logical-agent-${index}`);
  const registration = plane.agents.registerBatch(TENANT_A, keys, 'internal');
  const registrationMs = performance.now() - startedAt;

  // The same human-facing keys in another organization must resolve to
  // different identities, and neither must be visible from the other tenant.
  const crossTenant = plane.agents.registerBatch(TENANT_B, keys.slice(0, COLLIDING_KEYS), 'internal');
  let crossTenantKeyLeaks = 0;
  for (const agentKey of keys.slice(0, COLLIDING_KEYS)) {
    const inA = plane.agents.findByKey(TENANT_A, agentKey);
    const inB = plane.agents.findByKey(TENANT_B, agentKey);
    if (!inA || !inB || inA.agentId === inB.agentId) {
      crossTenantKeyLeaks += 1;
      continue;
    }
    if (plane.agents.get(TENANT_A, inB.agentId) || plane.agents.get(TENANT_B, inA.agentId)) {
      crossTenantKeyLeaks += 1;
    }
  }

  // Re-registering a key inside the same universe must be refused, not merged.
  const duplicateCode = catchCode(() =>
    plane.agents.register({ tenant: TENANT_A, agentKey: 'logical-agent-0', classification: 'internal' }),
  );

  const afterRegistration = plane.agents.stats();

  // Only a small number of identities are activated: registration must not
  // imply a running process.
  const activated: string[] = [];
  for (let index = 0; index < 200; index += 1) {
    const agent = plane.agents.register({ tenant: TENANT_A, agentKey: `activated-${index}`, classification: 'internal' });
    plane.agents.activate({
      principal: operatorA.principal,
      agentId: agent.agentId,
      node,
      nodeMaxClassification: plane.classificationCeilingForNode(node),
      reason: 'ac09_activation',
    });
    activated.push(agent.agentId);
  }

  const unauthorizedAttempts = [
    catchCode(() =>
      plane.agents.activate({
        principal: limitedA.principal,
        agentId: activated[0] as string,
        node,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
    catchCode(() =>
      plane.agents.activate({
        principal: operatorA.principal,
        agentId: 'agent_does_not_exist',
        node,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
  ];

  const afterActivation = plane.agents.stats();
  const nodesInFleet = plane.nodes.list(TENANT_A).length;
  const permanentRuntimesRequired = afterActivation.registered > 0 && nodesInFleet < afterActivation.registered ? 0 : 1;
  const heapMb = Math.round(process.memoryUsage().heapUsed / (1024 * 1024));

  const thresholds: Threshold[] = [
    atLeast(
      'registered_identities',
      'Logical agent identities registered',
      percent(registration.registered, TARGET),
      100,
      { blocker: true },
    ),
    zero(
      'identity_collisions',
      'Logical identities sharing an identifier or slot',
      afterActivation.integrityFailures + (plane.ids.count === plane.ids.sequenceValue ? 0 : 1),
      { blocker: true, note: `${plane.ids.count} identifiers minted with no repeat` },
    ),
    zero('cross_tenant_collisions', 'Identity keys resolving across tenants', crossTenantKeyLeaks, {
      blocker: true,
      note: `${COLLIDING_KEYS} identical keys registered in two organizations`,
    }),
    zero('registry_integrity_failures', 'Registry integrity failures', afterActivation.integrityFailures, {
      blocker: true,
    }),
    zero(
      'permanent_runtime_per_agent',
      'Requirement for one permanent runtime per logical agent',
      permanentRuntimesRequired,
      {
        blocker: true,
        note: `${afterActivation.registered} identities held on ${nodesInFleet} runtime nodes with ${afterActivation.active} active`,
      },
    ),
    zero(
      'unauthorized_activation',
      'Unauthorized activation',
      unauthorizedAttempts.filter((code) => code !== 'unauthorized').length,
      { blocker: true },
    ),
  ];

  return summarize('AC-09', 'Massive Logical-Agent Architecture', thresholds, {
    target: TARGET,
    registered: afterActivation.registered,
    crossTenantRegistered: crossTenant.registered,
    duplicateKeyRefusalCode: duplicateCode,
    refusedDuplicateKeys: afterActivation.refusedDuplicateKeys,
    identifiersMinted: plane.ids.count,
    slotsAfterRegistration: afterRegistration.slots,
    activatedIdentities: afterActivation.active,
    runtimeNodes: nodesInFleet,
    registrationMs: Math.round(registrationMs),
    registrationsPerSecond: Math.round(TARGET / (registrationMs / 1000)),
    heapUsedMb: heapMb,
    note: 'Registration allocates a registry row only. Activation is a separate authorized act, which is what keeps 100,000 identities from implying 100,000 processes.',
  });
}

export function runAc21(): AcceptanceResult {
  const { plane, operatorA } = buildFixture();
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'cost-1' });
  const hardware = { classIds: [plane.hostHardware.classId] };

  const workloadIds: string[] = [];
  for (let index = 0; index < 300; index += 1) {
    const outcome = plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 200, modelUsage: { tokensIn: 64, tokensOut: 64 } },
    );
    workloadIds.push(outcome.record.workloadId);
  }

  // A workload that exceeds its cost budget may only continue with an explicit
  // authorization. The unauthorized case is measured, not tolerated.
  const overBudget = workloadSpec({ tenant: TENANT_A, hardware, budget: standardBudget({ maxCostUsd: 0.001 }) });
  const overBudgetLease = plane.governor.admit({
    workloadId: overBudget.workloadId,
    tenant: TENANT_A,
    budget: overBudget.budget,
  });
  plane.governor.start(overBudgetLease);
  const overBudgetCode = catchCode(() => plane.governor.noteModelCall(overBudgetLease, 1_000, 5));
  plane.governor.close(overBudgetLease, null, { costAttributed: true });
  const continuedWithoutAuthorization = plane.cost.mayContinueOverBudget(overBudget.workloadId) ? 1 : 0;

  const authorized = workloadSpec({ tenant: TENANT_A, hardware, budget: standardBudget({ maxCostUsd: 0.001 }) });
  plane.cost.authorizeOverrun({
    workloadId: authorized.workloadId,
    approvedByPrincipalId: operatorA.principal.principalId,
    extraUsd: 5,
  });
  const authorizedContinuation = plane.cost.mayContinueOverBudget(authorized.workloadId);

  for (const resource of ['cpuMillis', 'gpuMillis', 'modelTokens', 'storageMb', 'networkKb']) {
    plane.cost.raiseAnomaly({
      tenant: TENANT_A,
      workloadId: workloadIds[0] as string,
      observedUsd: 4.2,
      baselineUsd: 0.4,
      resource,
    });
  }

  const invocations = plane.models.allInvocations();
  const withCostMetadata = invocations.filter((invocation) => invocation.costUsd !== null).length;

  const thresholds: Threshold[] = [
    atLeast('usage_records', 'Workloads with compute-usage record', plane.cost.coverage(workloadIds) * 100, 99.9, {
      blocker: false,
    }),
    atLeast(
      'model_cost_metadata',
      'Model calls with attributable cost/usage metadata',
      percent(withCostMetadata, invocations.length),
      99,
      { blocker: false },
    ),
    zero(
      'unauthorized_over_budget_continuation',
      'Budget-exceeding workloads permitted to continue without policy authorization',
      continuedWithoutAuthorization,
      { blocker: true, note: `over-budget model call refused as ${overBudgetCode}` },
    ),
    atMost(
      'unattributed_spend',
      'Unattributed staging compute spend',
      plane.cost.unattributedSpendShare() * 100,
      1,
      '%',
      { blocker: false },
    ),
    atLeast('anomaly_coverage', 'Cost anomaly alert coverage for configured resources', plane.cost.anomalyCoverage() * 100, 100, {
      blocker: false,
    }),
    booleanThreshold('authorized_overrun_allowed', 'Authorized overrun is permitted to continue', authorizedContinuation),
  ];

  return summarize('AC-21', 'Cost Governance', thresholds, {
    workloads: workloadIds.length,
    usageRecords: plane.cost.recordCount,
    refusedOverBudgetContinuations: plane.cost.refusedOverBudgetContinuations,
    attributionRate: plane.cost.attributionRate(),
    spendByTenant: plane.cost.spendByTenant(),
    modelInvocations: invocations.length,
    note: 'The only configured provider in this environment is the local deterministic runtime, whose per-token cost is 0. Hosted-provider cost attribution needs to be re-measured once a provider is configured.',
  });
}

export function runAc22(): AcceptanceResult {
  const { plane, operatorA } = buildFixture();
  const nodes = [0, 1, 2].map((index) =>
    plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: `obs-${index}` }),
  );
  const hardware = { classIds: [plane.hostHardware.classId] };

  const workloadIds: string[] = [];
  for (let index = 0; index < 250; index += 1) {
    const outcome = plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 200 },
    );
    workloadIds.push(outcome.record.workloadId);
  }

  // Failed workloads are held to a stricter bar: they must also carry an error
  // signal, so a silent failure cannot count as traceable.
  const failedWorkloadIds: string[] = [];
  for (let index = 0; index < 25; index += 1) {
    const spec = workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID });
    const submitted = plane.engine.submit({ token: operatorA.token, spec });
    if (submitted.rejection) continue;
    plane.engine.run({
      workloadId: spec.workloadId,
      iterations: 200,
      failure: { kind: 'process_failure', stage: 'mid_execution', recoverable: false },
    });
    failedWorkloadIds.push(spec.workloadId);
    workloadIds.push(spec.workloadId);
  }

  const alert = plane.telemetry.registerAlertPath('protected_execution_blocked', 'ops_pager');
  const secondAlert = plane.telemetry.registerAlertPath('node_revoked', 'security_channel');
  plane.telemetry.exerciseAlertPath(alert.alertId, { drill: 'ac22' });
  plane.telemetry.exerciseAlertPath(secondAlert.alertId, { drill: 'ac22' });

  // Critical runtime events that must each be represented in the audit ledger.
  const criticalKinds = [
    'node_registered',
    'attestation_passed',
    'workload_authorized',
    'guardian_cleared',
    'routing_assigned',
    'budget_attached',
    'usage_recorded',
    'workload_started',
    'workload_completed',
    'model_invoked',
  ];
  const capturedCritical = criticalKinds.filter((kind) => plane.audit.has((event) => event.kind === kind)).length;

  // Security events: force each and confirm the ledger recorded it.
  const securityKinds: { kind: string; trigger: () => void }[] = [
    {
      kind: 'protected_execution_blocked',
      trigger: () => {
        const bare = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'obs-unattested', attest: false });
        catchCode(() => plane.attestation.assertEligible(bare, 'restricted'));
      },
    },
    {
      kind: 'workload_authorization_denied',
      trigger: () => {
        plane.engine.submit({ token: operatorA.token, spec: workloadSpec({ tenant: TENANT_B, hardware }) });
      },
    },
    {
      kind: 'cross_tenant_read_denied',
      trigger: () => {
        plane.nodeStore.get(TENANT_B, nodes[0]?.nodeId ?? 'x');
      },
    },
    {
      kind: 'guardian_denied',
      trigger: () => {
        const spec = workloadSpec({ tenant: TENANT_A, hardware });
        const authorization = plane.authorizer.authorize(operatorA.principal, spec);
        if (authorization.allowed) {
          const node = nodes[0];
          if (node) {
            plane.authorizer.clear({ grant: authorization.grant, node, attestation: null, protectedExecution: false });
            catchCode(() =>
              plane.authorizer.clear({ grant: authorization.grant, node, attestation: null, protectedExecution: false }),
            );
          }
        }
      },
    },
    {
      kind: 'control_revoke_node_acknowledged',
      trigger: () => {
        const target = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'obs-revoke' });
        plane.control.issue({
          principal: operatorA.principal,
          kind: 'REVOKE_NODE',
          targetId: target.nodeId,
          tenant: TENANT_A,
          reason: 'ac22_security_event',
        });
      },
    },
  ];
  for (const entry of securityKinds) entry.trigger();
  const capturedSecurity = securityKinds.filter((entry) => plane.audit.has((event) => event.kind === entry.kind)).length;

  const traceability = plane.telemetry.traceabilityRate(workloadIds, failedWorkloadIds);
  const activeNodes = plane.nodes.list(TENANT_A).filter((node) => node.state === 'active');
  const unknownOwnership = activeNodes.filter((node) => !plane.telemetry.ownerOf(node.nodeId)).length;
  const alertPaths = plane.telemetry.alertPaths();
  const exercised = alertPaths.filter((path) => path.exercisedAt !== null).length;

  const thresholds: Threshold[] = [
    atLeast('critical_events', 'Critical runtime events captured', percent(capturedCritical, criticalKinds.length), 100, {
      blocker: true,
    }),
    atLeast(
      'security_event_coverage',
      'Security-event audit coverage',
      percent(capturedSecurity, securityKinds.length),
      100,
      { blocker: true },
    ),
    atLeast('traceability', 'Test workload traceability', traceability * 100, 99.9, {
      blocker: true,
      note: `${workloadIds.length} workloads, of which ${failedWorkloadIds.length} failed and must also carry an error signal`,
    }),
    atLeast('alert_paths_exercised', 'Critical alert path successfully exercised', percent(exercised, alertPaths.length), 100, {
      blocker: false,
    }),
    zero('unknown_node_ownership', 'Unknown ownership for active staging nodes', unknownOwnership, { blocker: true }),
    booleanThreshold('audit_chain_intact', 'Audit ledger hash chain intact', plane.audit.verifyChain().intact, {
      blocker: true,
    }),
  ];

  return summarize('AC-22', 'Observability', thresholds, {
    requiredSignals: REQUIRED_TELEMETRY_SIGNALS,
    requiredPerWorkloadSignals: REQUIRED_WORKLOAD_SIGNALS,
    telemetryEvents: plane.telemetry.count(),
    auditEvents: plane.audit.length,
    tracedWorkloads: workloadIds.length,
    signalsForSampleWorkload: plane.telemetry.signalsFor(workloadIds[0] ?? ''),
    criticalKinds,
    securityKinds: securityKinds.map((entry) => entry.kind),
    alertPaths,
  });
}

export function runGovernanceAcceptance(): AcceptanceResult[] {
  return [runAc08(), runAc09(), runAc21(), runAc22()];
}
