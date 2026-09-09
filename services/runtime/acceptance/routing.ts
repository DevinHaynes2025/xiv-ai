/**
 * AC-05 compute routing.
 * AC-06 hardware portability.
 * AC-07 agent runtime assignment.
 */
import { runAdapterContractTests, runReferenceWorkload, ALL_HARDWARE_CLASS_IDS } from '../src/hardware';
import type { NodeLoad } from '../src/router';
import type { AcceptanceResult, Threshold } from './harness';
import {
  TENANT_A,
  TENANT_A_ALT_UNIVERSE,
  TENANT_B,
  atLeast,
  buildFixture,
  catchCode,
  percent,
  standardBudget,
  summarize,
  unconfigured,
  workloadSpec,
  zero,
} from './harness';
import type { HardwareClassId, RoutingDecision, RuntimeNode, WorkloadClassification } from '../src/types';

const EMPTY_LOAD: NodeLoad = { activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 };

type RoutingScenario =
  | 'cpu_eligible'
  | 'gpu_requested'
  | 'edge_requested'
  | 'all_nodes_unavailable'
  | 'tenant_mismatch'
  | 'universe_mismatch'
  | 'degraded_only'
  | 'budget_exhausted'
  | 'attestation_required'
  | 'capacity_exhausted';

type ScenarioEvaluation = {
  scenario: RoutingScenario;
  expected: 'assigned' | 'rejected';
  actual: 'assigned' | 'rejected';
  reason: string;
  policyCorrect: boolean;
  securityInvalid: boolean;
  tenantInvalid: boolean;
  unsupportedHardware: boolean;
};

export function runAc05(): AcceptanceResult {
  const { plane, clock, operatorA, operatorB, operatorAltUniverse } = buildFixture();
  const hostClass = plane.hostHardware.classId;

  const eligible = [0, 1, 2].map((index) =>
    plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: `route-ok-${index}` }),
  );
  const degraded = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'route-degraded' });
  plane.nodes.markDegraded(TENANT_A, degraded.nodeId, true);
  const paused = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'route-paused' });
  plane.nodes.setState(TENANT_A, paused.nodeId, 'paused', 'route_test');
  const staleAttestation = plane.onboardNode({
    token: operatorA.token,
    tenant: TENANT_A,
    serial: 'route-stale',
    attestationValidForMs: 500,
  });
  const foreign = plane.onboardNode({ token: operatorB.token, tenant: TENANT_B, serial: 'route-foreign' });
  const otherUniverse = plane.onboardNode({
    token: operatorAltUniverse.token,
    tenant: TENANT_A_ALT_UNIVERSE,
    serial: 'route-other-universe',
  });
  const gpuClaim = plane.onboardNode({
    token: operatorA.token,
    tenant: TENANT_A,
    serial: 'route-gpu',
    hardware: { classId: 'gpu_nvidia', vendor: 'declared-nvidia', cores: 8, ramMb: 16_384, accelerators: ['cuda'] },
  });
  const edgeClaim = plane.onboardNode({
    token: operatorA.token,
    tenant: TENANT_A,
    serial: 'route-edge',
    hardware: { classId: 'edge_arm32', vendor: 'declared-arm32', cores: 2, ramMb: 512, accelerators: ['neon'] },
  });
  const tinyCapacity = plane.onboardNode({
    token: operatorA.token,
    tenant: TENANT_A,
    serial: 'route-tiny',
    capacity: { cpuMillis: 1_000, gpuMillis: 0, ramMb: 128, concurrentWorkloads: 1 },
  });

  clock.advance(2_000);

  // Node records are immutable, so a state change produces a new row. Routing
  // must see the current row: re-reading here is what makes the paused and
  // degraded scenarios test the router rather than a stale local snapshot.
  const fresh = (node: RuntimeNode): RuntimeNode => plane.nodes.require(node.tenant, node.nodeId);

  const scenarios: RoutingScenario[] = [
    'cpu_eligible',
    'gpu_requested',
    'edge_requested',
    'all_nodes_unavailable',
    'tenant_mismatch',
    'universe_mismatch',
    'degraded_only',
    'budget_exhausted',
    'attestation_required',
    'capacity_exhausted',
  ];

  const evaluations: ScenarioEvaluation[] = [];
  const decisionMicros: number[] = [];
  const TOTAL_DECISIONS = 1_000;

  for (let index = 0; index < TOTAL_DECISIONS; index += 1) {
    const scenario = scenarios[index % scenarios.length] as RoutingScenario;
    let candidates: RuntimeNode[] = [];
    let classification: WorkloadClassification = 'internal';
    let hardware: { classIds?: readonly HardwareClassId[]; accelerator?: 'cuda' | 'neon' } = { classIds: [hostClass] };
    let tenantBudgetAvailable = true;
    let expected: 'assigned' | 'rejected' = 'assigned';
    let load: (nodeId: string) => NodeLoad = () => EMPTY_LOAD;
    let tenant = TENANT_A;

    switch (scenario) {
      case 'cpu_eligible':
        candidates = eligible.map(fresh);
        break;
      case 'gpu_requested':
        candidates = [...eligible, gpuClaim].map(fresh);
        hardware = { classIds: ['gpu_nvidia'], accelerator: 'cuda' };
        expected = 'rejected';
        break;
      case 'edge_requested':
        candidates = [...eligible, edgeClaim].map(fresh);
        hardware = { classIds: ['edge_arm32'] };
        expected = 'rejected';
        break;
      case 'all_nodes_unavailable':
        candidates = [fresh(paused)];
        expected = 'rejected';
        break;
      case 'tenant_mismatch':
        candidates = [fresh(foreign)];
        expected = 'rejected';
        break;
      case 'universe_mismatch':
        candidates = [fresh(otherUniverse)];
        expected = 'rejected';
        break;
      case 'degraded_only':
        candidates = [fresh(degraded)];
        expected = 'rejected';
        break;
      case 'budget_exhausted':
        candidates = eligible.map(fresh);
        tenantBudgetAvailable = false;
        expected = 'rejected';
        break;
      case 'attestation_required':
        candidates = [fresh(staleAttestation)];
        classification = 'restricted';
        expected = 'rejected';
        break;
      case 'capacity_exhausted':
        candidates = [fresh(tinyCapacity)];
        load = () => ({ activeWorkloads: 1, cpuMillisCommitted: 900, gpuMillisCommitted: 0, ramMbCommitted: 120 });
        expected = 'rejected';
        break;
    }

    const spec = workloadSpec({
      tenant,
      classification,
      hardware,
      requiredCapabilities:
        classification === 'restricted' ? ['workload.submit', 'workload.submit.protected'] : ['workload.submit'],
      budget: standardBudget({ cpuMillis: 5_000, ramMb: 512 }),
    });

    const decision: RoutingDecision = plane.router.route({ spec, candidates, load, tenantBudgetAvailable });
    decisionMicros.push(decision.decisionMicros);

    const actual = decision.outcome === 'assigned' ? 'assigned' : 'rejected';
    let securityInvalid = false;
    let tenantInvalid = false;
    let unsupportedHardware = false;

    if (decision.outcome === 'assigned') {
      const chosen = candidates.find((node) => node.nodeId === decision.nodeId);
      if (!chosen) {
        securityInvalid = true;
      } else {
        if (chosen.tenant.organizationId !== spec.tenant.organizationId) {
          tenantInvalid = true;
          securityInvalid = true;
        }
        if (chosen.tenant.universeId !== spec.tenant.universeId) {
          tenantInvalid = true;
          securityInvalid = true;
        }
        if (chosen.state !== 'active') securityInvalid = true;
        if (!plane.hardware.isConfigured(chosen.hardware.classId)) unsupportedHardware = true;
        if (hardware.classIds && !hardware.classIds.includes(chosen.hardware.classId)) unsupportedHardware = true;
        if (
          classification === 'restricted' &&
          plane.attestation.evaluate(chosen.nodeId).status !== 'required_pass'
        ) {
          securityInvalid = true;
        }
      }
    }

    evaluations.push({
      scenario,
      expected,
      actual,
      reason: decision.outcome === 'rejected' ? decision.reason : `assigned:${decision.nodeId}`,
      policyCorrect: expected === actual,
      securityInvalid,
      tenantInvalid,
      unsupportedHardware,
    });
  }

  const rejectionScenarios = evaluations.filter((entry) => entry.expected === 'rejected');
  const correctRejections = rejectionScenarios.filter((entry) => entry.actual === 'rejected').length;
  const byScenario = Object.fromEntries(
    scenarios.map((scenario) => {
      const subset = evaluations.filter((entry) => entry.scenario === scenario);
      return [
        scenario,
        {
          decisions: subset.length,
          policyCorrect: subset.filter((entry) => entry.policyCorrect).length,
          reasons: [...new Set(subset.map((entry) => entry.reason.replace(/assigned:.*/, 'assigned')))],
        },
      ];
    }),
  );

  const thresholds: Threshold[] = [
    atLeast(
      'policy_correct_routing',
      'Policy-correct routing',
      percent(evaluations.filter((entry) => entry.policyCorrect).length, evaluations.length),
      99.9,
      { blocker: true },
    ),
    zero('security_invalid_routing', 'Security-invalid routing', evaluations.filter((entry) => entry.securityInvalid).length, {
      blocker: true,
    }),
    zero('tenant_invalid_routing', 'Tenant-invalid routing', evaluations.filter((entry) => entry.tenantInvalid).length, {
      blocker: true,
    }),
    zero(
      'unsupported_hardware_execution',
      'Unsupported-hardware execution',
      evaluations.filter((entry) => entry.unsupportedHardware).length,
      { blocker: true },
    ),
    atLeast(
      'correct_rejection',
      'Correct rejection when no eligible runtime exists',
      percent(correctRejections, rejectionScenarios.length),
      100,
      { blocker: true },
    ),
  ];

  return summarize('AC-05', 'Compute Routing', thresholds, {
    decisions: evaluations.length,
    scenarioBreakdown: byScenario,
    decisionMicrosP95: percentile(decisionMicros, 95),
    decisionMicrosP50: percentile(decisionMicros, 50),
  });
}

function percentile(values: number[], target: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((target / 100) * sorted.length) - 1));
  return sorted[index] as number;
}

export function runAc06(): AcceptanceResult {
  const { plane, operatorA } = buildFixture();
  const configured = plane.hardware.configuredClasses();
  const unavailable = plane.hardware.unavailableClasses();

  const perClass: Record<string, unknown> = {};
  const contractResults: { classId: string; name: string; passed: boolean; detail: string }[] = [];
  let completions = 0;
  let attempts = 0;
  let toleranceViolations = 0;
  let policyInconsistencies = 0;
  let silentSubstitutions = 0;

  for (const hardwareClass of configured) {
    const adapter = plane.hardware.adapterFor(hardwareClass.classId);
    for (const result of runAdapterContractTests(adapter)) {
      contractResults.push({ classId: hardwareClass.classId, ...result });
    }

    const node = plane.onboardNode({
      token: operatorA.token,
      tenant: TENANT_A,
      serial: `portability-${hardwareClass.classId}`,
      hardware: plane.hostHardware.profile,
    });

    // Baseline computed outside the plane, then compared with what the runtime
    // adapter actually produced for the same bounded workload.
    const baseline = runReferenceWorkload(hardwareClass.classId, { seed: 11, iterations: 5_000 });
    const results: number[] = [];
    const runsPerClass = 100;
    for (let index = 0; index < runsPerClass; index += 1) {
      attempts += 1;
      const outcome = plane.engine.execute(
        {
          token: operatorA.token,
          spec: workloadSpec({
            tenant: TENANT_A,
            hardware: { classIds: [hardwareClass.classId] },
            modelId: 'xiv-local-reference-1',
          }),
        },
        { iterations: 5_000 },
      );
      if (outcome.record.state === 'completed') completions += 1;
      const direct = adapter.runReference({ seed: 11, iterations: 5_000 });
      results.push(direct.value);
      if (Math.abs(direct.value - baseline.value) > hardwareClass.resultTolerance) toleranceViolations += 1;
      if (direct.checksum !== baseline.checksum) toleranceViolations += 1;
    }

    // The same protected-workload policy must resolve identically on this class.
    const protectedDecision = plane.engine.submit({
      token: operatorA.token,
      spec: workloadSpec({
        tenant: TENANT_A,
        classification: 'restricted',
        requiredCapabilities: ['workload.submit', 'workload.submit.protected'],
        hardware: { classIds: [hardwareClass.classId] },
      }),
    });
    const unattestedDecision = (() => {
      const bare = plane.onboardNode({
        token: operatorA.token,
        tenant: TENANT_A,
        serial: `portability-unattested-${hardwareClass.classId}`,
        attest: false,
      });
      return catchCode(() => plane.attestation.assertEligible(bare, 'restricted'));
    })();
    if (protectedDecision.rejection !== null) policyInconsistencies += 1;
    if (unattestedDecision !== 'attestation_required') policyInconsistencies += 1;

    if (catchCode(() => adapter.resolveModel('some-other-model')) !== 'model_unavailable') silentSubstitutions += 1;

    perClass[hardwareClass.classId] = {
      label: hardwareClass.label,
      configured: true,
      nodeId: node.nodeId,
      vendor: plane.hostHardware.profile.vendor,
      cores: plane.hostHardware.profile.cores,
      accelerators: hardwareClass.accelerators,
      runs: runsPerClass,
      referenceValue: baseline.value,
      referenceChecksum: baseline.checksum,
      distinctResults: new Set(results).size,
      resultTolerance: hardwareClass.resultTolerance,
    };
  }

  for (const hardwareClass of unavailable) {
    perClass[hardwareClass.classId] = {
      label: hardwareClass.label,
      configured: false,
      status: 'UNAVAILABLE',
      reason: hardwareClass.unavailableReason,
      executionAttemptCode: catchCode(() => plane.hardware.adapterFor(hardwareClass.classId)),
    };
  }

  const thresholds: Threshold[] = [
    atLeast('completion_rate', 'Supported-runtime completion rate', percent(completions, attempts), 99, {
      note: `${completions}/${attempts} bounded reference workloads completed on ${configured.length} configured class(es)`,
    }),
    atLeast(
      'contract_tests',
      'Contract-test pass rate',
      percent(contractResults.filter((entry) => entry.passed).length, contractResults.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'security_policy_consistency',
      'Security-policy consistency across configured classes',
      policyInconsistencies === 0 ? 100 : 0,
      100,
      { blocker: true },
    ),
    zero('silent_substitution', 'Silent model/runtime substitution', silentSubstitutions, { blocker: true }),
    zero('tolerance_violations', 'Result differences outside defined workload tolerance', toleranceViolations, {
      blocker: true,
    }),
    unconfigured(
      'unconfigured_classes',
      'Hardware classes with no configured runtime',
      'explicitly UNAVAILABLE',
      `${unavailable.map((entry) => entry.classId).join(', ')} — no runtime adapter exists for these classes in this release, so they are reported UNAVAILABLE and cannot be scheduled. Intel/AMD/NVIDIA/Apple/mobile coverage needs those runtimes to be configured and re-measured.`,
    ),
  ];

  return summarize('AC-06', 'Hardware Portability', thresholds, {
    hostDetection: plane.hostHardware,
    configuredClasses: configured.map((entry) => entry.classId),
    unavailableClasses: unavailable.map((entry) => entry.classId),
    allKnownClasses: ALL_HARDWARE_CLASS_IDS,
    perClass,
    contractResults,
    referenceWorkloadExecutions: attempts,
  });
}

export function runAc07(): AcceptanceResult {
  const { plane, clock, operatorA, operatorB, agentPrincipalA, limitedA } = buildFixture();
  const nodeA1 = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'assign-a1' });
  const nodeA2 = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'assign-a2' });
  const nodeB1 = plane.onboardNode({ token: operatorB.token, tenant: TENANT_B, serial: 'assign-b1' });
  const unattested = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'assign-unattested', attest: false });

  const validAssignments: string[] = [];
  const agentIds: string[] = [];
  for (let index = 0; index < 60; index += 1) {
    const agent = plane.agents.register({
      tenant: TENANT_A,
      agentKey: `assign-agent-${index}`,
      classification: index % 3 === 0 ? 'confidential' : 'internal',
    });
    agentIds.push(agent.agentId);
    const node = index % 2 === 0 ? nodeA1 : nodeA2;
    const assignment = plane.agents.activate({
      principal: operatorA.principal,
      agentId: agent.agentId,
      node,
      nodeMaxClassification: plane.classificationCeilingForNode(node),
      reason: 'ac07_valid_assignment',
    });
    validAssignments.push(assignment.assignmentId);
  }

  const restrictedAgent = plane.agents.register({
    tenant: TENANT_A,
    agentKey: 'assign-restricted',
    classification: 'restricted',
  });

  const negatives = {
    unauthorized_principal: catchCode(() =>
      plane.agents.activate({
        principal: limitedA.principal,
        agentId: agentIds[0] as string,
        node: nodeA1,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
    cross_tenant_node: catchCode(() =>
      plane.agents.activate({
        principal: operatorA.principal,
        agentId: agentIds[1] as string,
        node: nodeB1,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
    cross_tenant_agent: catchCode(() =>
      plane.agents.activate({
        principal: operatorB.principal,
        agentId: agentIds[2] as string,
        node: nodeB1,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
    classification_above_node_policy: catchCode(() =>
      plane.agents.activate({
        principal: operatorA.principal,
        agentId: restrictedAgent.agentId,
        node: nodeA1,
        nodeMaxClassification: 'internal',
        reason: 'negative',
      }),
    ),
    protected_agent_on_unattested_node: catchCode(() =>
      plane.agents.activate({
        principal: operatorA.principal,
        agentId: restrictedAgent.agentId,
        node: unattested,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
    revoked_node: catchCode(() => {
      plane.control.issue({
        principal: operatorA.principal,
        kind: 'REVOKE_NODE',
        targetId: nodeA2.nodeId,
        tenant: TENANT_A,
        reason: 'ac07_revoke',
      });
      return plane.agents.activate({
        principal: operatorA.principal,
        agentId: restrictedAgent.agentId,
        node: plane.nodes.require(TENANT_A, nodeA2.nodeId),
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      });
    }),
    agent_principal_without_capability: catchCode(() =>
      plane.agents.activate({
        principal: { ...agentPrincipalA.principal, capabilities: [] },
        agentId: agentIds[3] as string,
        node: nodeA1,
        nodeMaxClassification: 'restricted',
        reason: 'negative',
      }),
    ),
  };

  clock.advance(1_000);

  // Legitimate movement between nodes must preserve the agent identity.
  const nodeA3 = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'assign-a3' });
  const movements = agentIds.slice(0, 20).map((agentId) =>
    plane.agents.move({
      principal: operatorA.principal,
      agentId,
      node: nodeA3,
      nodeMaxClassification: plane.classificationCeilingForNode(nodeA3),
      reason: 'ac07_planned_migration',
    }),
  );

  const assignedOutsideTenant = plane.agents
    .assignmentHistory(agentIds[0] as string)
    .filter((assignment) => assignment.tenant.organizationId !== TENANT_A.organizationId).length;
  const lineageRecorded = validAssignments.filter((assignmentId) =>
    plane.audit.has((event) => event.kind === 'agent_assigned' && event.detail.assignmentId === assignmentId),
  ).length;
  const negativeCodes = Object.values(negatives);
  const negativesRefused = negativeCodes.filter((code) => code === 'unauthorized').length;

  const thresholds: Threshold[] = [
    atLeast(
      'valid_assignments',
      'Valid agent/runtime assignments',
      percent(validAssignments.length, 60),
      100,
      { blocker: true },
    ),
    zero(
      'unauthorized_node_assignment',
      'Assignment to unauthorized node',
      negativeCodes.length - negativesRefused,
      { blocker: true, note: JSON.stringify(negatives) },
    ),
    zero('assignment_outside_tenant', 'Assignment outside tenant/Universe', assignedOutsideTenant, { blocker: true }),
    zero(
      'assignment_above_classification',
      'Assignment exceeding classification policy',
      negatives.classification_above_node_policy === 'unauthorized' ? 0 : 1,
      { blocker: true },
    ),
    atLeast(
      'identity_retained',
      'Agent identity retained across legitimate runtime movement',
      percent(movements.filter((movement) => movement.identityRetained).length, movements.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'assignment_lineage',
      'Runtime assignment lineage recorded',
      percent(lineageRecorded, validAssignments.length),
      100,
      { blocker: true },
    ),
  ];

  return summarize('AC-07', 'Agent Runtime Assignment', thresholds, {
    validAssignments: validAssignments.length,
    movements: movements.length,
    negativeScenarios: negatives,
    unauthorizedActivationCount: plane.agents.unauthorizedActivationCount,
    rejectedAssignmentCount: plane.agents.rejectedAssignmentCount,
  });
}

export function runRoutingAcceptance(): AcceptanceResult[] {
  return [runAc05(), runAc06(), runAc07()];
}
