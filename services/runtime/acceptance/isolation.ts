/**
 * AC-03 tenant and universe isolation.
 *
 * Two independent layers are measured:
 *   1. the control plane's in-process tenant stores, exercised adversarially;
 *   2. the PostgreSQL row level security policies in the 62D migration, applied
 *      to a real database and probed as the `authenticated` role.
 *
 * If PostgreSQL is unavailable the database layer reports UNVERIFIED. It is
 * never inferred from reading the SQL.
 */
import { verifyRls, type RlsVerification } from '../tools/rls-verify';
import type { AcceptanceResult, Threshold } from './harness';
import {
  TENANT_A,
  TENANT_A_ALT_UNIVERSE,
  TENANT_B,
  atLeast,
  buildFixture,
  catchCode,
  percent,
  summarize,
  unverified,
  workloadSpec,
  zero,
} from './harness';

type NegativeTest = {
  name: string;
  kind: 'cross_tenant_read' | 'cross_tenant_write' | 'cross_universe_read' | 'cross_universe_write';
  passed: boolean;
  observed: string;
};

export function runAc03(): AcceptanceResult {
  const { plane, operatorA, operatorB, operatorAltUniverse } = buildFixture();
  const tests: NegativeTest[] = [];
  const record = (test: NegativeTest) => tests.push(test);

  const nodeA = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'iso-a' });
  const nodeB = plane.onboardNode({ token: operatorB.token, tenant: TENANT_B, serial: 'iso-b' });
  const nodeAltUniverse = plane.onboardNode({
    token: operatorAltUniverse.token,
    tenant: TENANT_A_ALT_UNIVERSE,
    serial: 'iso-a-alt',
  });

  const agentA = plane.agents.register({ tenant: TENANT_A, agentKey: 'iso-agent', classification: 'confidential' });
  const agentB = plane.agents.register({ tenant: TENANT_B, agentKey: 'iso-agent', classification: 'confidential' });

  const workloadA = plane.engine.execute(
    { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, agentId: agentA.agentId, hardware: { classIds: [plane.hostHardware.classId] } }) },
    { iterations: 1_000 },
  );
  const workloadB = plane.engine.execute(
    { token: operatorB.token, spec: workloadSpec({ tenant: TENANT_B, agentId: agentB.agentId, hardware: { classIds: [plane.hostHardware.classId] } }) },
    { iterations: 1_000 },
  );

  // --- reads across organizations -----------------------------------------
  record({
    name: 'node_of_other_org_not_readable',
    kind: 'cross_tenant_read',
    passed: plane.nodes.get(TENANT_B, nodeA.nodeId) === undefined,
    observed: plane.nodes.get(TENANT_B, nodeA.nodeId) ? 'readable' : 'not_readable',
  });
  record({
    name: 'workload_of_other_org_not_readable',
    kind: 'cross_tenant_read',
    passed: plane.workloadStore.get(TENANT_B, workloadA.record.workloadId) === undefined,
    observed: plane.workloadStore.get(TENANT_B, workloadA.record.workloadId) ? 'readable' : 'not_readable',
  });
  record({
    name: 'agent_of_other_org_not_readable',
    kind: 'cross_tenant_read',
    passed: plane.agents.get(TENANT_B, agentA.agentId) === undefined,
    observed: plane.agents.get(TENANT_B, agentA.agentId) ? 'readable' : 'not_readable',
  });
  record({
    name: 'node_list_scoped_to_own_org',
    kind: 'cross_tenant_read',
    passed: plane.nodes.list(TENANT_A).every((node) => node.tenant.organizationId === TENANT_A.organizationId),
    observed: `${plane.nodes.list(TENANT_A).length} nodes`,
  });
  record({
    name: 'audit_ledger_scoped_to_own_org',
    kind: 'cross_tenant_read',
    passed: plane.audit
      .listForTenant(TENANT_A)
      .every((event) => event.tenant?.organizationId === TENANT_A.organizationId),
    observed: `${plane.audit.listForTenant(TENANT_A).length} events`,
  });
  record({
    name: 'require_of_other_org_node_throws',
    kind: 'cross_tenant_read',
    passed: catchCode(() => plane.nodes.require(TENANT_B, nodeA.nodeId)) === 'unknown_node',
    observed: catchCode(() => plane.nodes.require(TENANT_B, nodeA.nodeId)),
  });
  record({
    name: 'meeting_of_other_org_not_readable',
    kind: 'cross_tenant_read',
    passed: (() => {
      const meeting = plane.meetings.open({
        principal: operatorA.principal,
        tenant: TENANT_A,
        classification: 'confidential',
        participants: [{ participantId: operatorA.principal.principalId, kind: 'human', tenant: TENANT_A, displayName: 'A' }],
        offline: false,
      });
      return catchCode(() => plane.meetings.require(TENANT_B, meeting.meetingId)) === 'not_found';
    })(),
    observed: 'checked',
  });

  // --- writes across organizations ----------------------------------------
  record({
    name: 'write_node_into_other_org_refused',
    kind: 'cross_tenant_write',
    passed: catchCode(() => plane.nodeStore.put(TENANT_B, nodeA.nodeId, nodeA)) === 'isolation_violation',
    observed: catchCode(() => plane.nodeStore.put(TENANT_B, nodeA.nodeId, nodeA)),
  });
  record({
    name: 'enrollment_for_other_org_refused',
    kind: 'cross_tenant_write',
    passed:
      catchCode(() =>
        plane.nodes.issueEnrollment({
          principal: operatorA.principal,
          tenant: TENANT_B,
          fingerprint: 'fp_iso_cross',
          hardware: plane.hostHardware.profile,
          capacity: { cpuMillis: 1_000, gpuMillis: 0, ramMb: 256, concurrentWorkloads: 1 },
        }),
      ) === 'isolation_violation',
    observed: 'checked',
  });
  record({
    name: 'workload_submitted_into_other_org_refused',
    kind: 'cross_tenant_write',
    passed: (() => {
      const outcome = plane.engine.submit({
        token: operatorA.token,
        spec: workloadSpec({ tenant: TENANT_B, hardware: { classIds: [plane.hostHardware.classId] } }),
      });
      return outcome.rejection?.reason === 'tenant_mismatch';
    })(),
    observed: 'checked',
  });
  record({
    name: 'agent_activation_on_other_org_node_refused',
    kind: 'cross_tenant_write',
    passed:
      catchCode(() =>
        plane.agents.activate({
          principal: operatorA.principal,
          agentId: agentA.agentId,
          node: nodeB,
          nodeMaxClassification: 'restricted',
          reason: 'iso_test',
        }),
      ) === 'unauthorized',
    observed: 'checked',
  });
  record({
    name: 'approval_across_org_refused',
    kind: 'cross_tenant_write',
    passed:
      catchCode(() => plane.approvals.grant(operatorA.principal, workloadB.record.workloadId, TENANT_B)) ===
      'isolation_violation',
    observed: 'checked',
  });
  record({
    name: 'offline_package_across_org_refused',
    kind: 'cross_tenant_write',
    passed:
      catchCode(() =>
        plane.offline.issue({
          principal: operatorA.principal,
          agentId: agentA.agentId,
          node: nodeB,
          capabilities: ['workload.submit'],
          classification: 'internal',
          maxTasks: 1,
          budget: workloadSpec({ tenant: TENANT_A }).budget,
          validForMs: 1_000,
        }),
      ) === 'isolation_violation',
    observed: 'checked',
  });
  record({
    name: 'control_command_across_org_rejected',
    kind: 'cross_tenant_write',
    passed:
      plane.control.issue({
        principal: operatorA.principal,
        kind: 'REVOKE_NODE',
        targetId: nodeB.nodeId,
        tenant: TENANT_B,
        reason: 'iso_test',
      }).outcome === 'rejected',
    observed: 'checked',
  });

  // --- universe isolation inside one organization -------------------------
  record({
    name: 'other_universe_node_not_readable',
    kind: 'cross_universe_read',
    passed: plane.nodes.get(TENANT_A, nodeAltUniverse.nodeId) === undefined,
    observed: plane.nodes.get(TENANT_A, nodeAltUniverse.nodeId) ? 'readable' : 'not_readable',
  });
  record({
    name: 'other_universe_workload_not_readable',
    kind: 'cross_universe_read',
    passed: plane.workloadStore.get(TENANT_A_ALT_UNIVERSE, workloadA.record.workloadId) === undefined,
    observed: 'checked',
  });
  record({
    name: 'other_universe_audit_not_readable',
    kind: 'cross_universe_read',
    passed: plane.audit
      .listForTenant(TENANT_A_ALT_UNIVERSE)
      .every((event) => event.tenant?.universeId === TENANT_A_ALT_UNIVERSE.universeId),
    observed: 'checked',
  });
  record({
    name: 'routing_never_selects_other_universe_node',
    kind: 'cross_universe_read',
    passed: (() => {
      const decision = plane.router.route({
        spec: workloadSpec({ tenant: TENANT_A_ALT_UNIVERSE, hardware: { classIds: [plane.hostHardware.classId] } }),
        candidates: [nodeA, nodeB, nodeAltUniverse],
        load: () => ({ activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 }),
        tenantBudgetAvailable: true,
      });
      return decision.outcome === 'assigned' && decision.nodeId === nodeAltUniverse.nodeId;
    })(),
    observed: 'checked',
  });
  record({
    name: 'workload_into_other_universe_refused',
    kind: 'cross_universe_write',
    passed:
      plane.engine.submit({
        token: operatorA.token,
        spec: workloadSpec({ tenant: TENANT_A_ALT_UNIVERSE, hardware: { classIds: [plane.hostHardware.classId] } }),
      }).rejection?.reason === 'tenant_mismatch',
    observed: 'checked',
  });
  record({
    name: 'write_into_other_universe_refused',
    kind: 'cross_universe_write',
    passed: catchCode(() => plane.nodeStore.put(TENANT_A_ALT_UNIVERSE, nodeA.nodeId, nodeA)) === 'isolation_violation',
    observed: 'checked',
  });
  record({
    name: 'agent_key_reuse_across_universes_is_distinct',
    kind: 'cross_universe_write',
    passed: (() => {
      const inAlt = plane.agents.register({
        tenant: TENANT_A_ALT_UNIVERSE,
        agentKey: 'iso-agent',
        classification: 'confidential',
      });
      return inAlt.agentId !== agentA.agentId && plane.agents.get(TENANT_A, inAlt.agentId) === undefined;
    })(),
    observed: 'checked',
  });

  // --- privileged bypass paths --------------------------------------------
  const undocumentedBypass = catchCode(() =>
    plane.nodeStore.listPrivileged(plane.bypass, 'undocumented_admin_path', operatorA.principal.principalId),
  );
  const documentedPaths = plane.bypass.list();
  const undocumentedJustifications = documentedPaths.filter(
    (path) => !path.justification.trim() || !path.approvedByPrincipalId.trim(),
  ).length;

  const crossTenantTests = tests.filter((test) => test.kind.startsWith('cross_tenant'));
  const crossUniverseTests = tests.filter((test) => test.kind.startsWith('cross_universe'));
  const failedReads = tests.filter((test) => test.kind === 'cross_tenant_read' && !test.passed).length;
  const failedWrites = tests.filter((test) => test.kind === 'cross_tenant_write' && !test.passed).length;
  const failedUniverse = crossUniverseTests.filter((test) => !test.passed).length;

  const rls: RlsVerification = verifyRls();
  const rlsVerified = rls.status === 'verified';

  const thresholds: Threshold[] = [
    atLeast(
      'cross_tenant_negative_tests',
      'Cross-tenant negative tests passed (control plane)',
      percent(crossTenantTests.filter((test) => test.passed).length, crossTenantTests.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'cross_universe_negative_tests',
      'Cross-Universe negative tests passed (control plane)',
      percent(crossUniverseTests.filter((test) => test.passed).length, crossUniverseTests.length),
      100,
      { blocker: true },
    ),
    zero('unauthorized_cross_tenant_reads', 'Unauthorized cross-tenant reads', failedReads, { blocker: true }),
    zero('unauthorized_cross_tenant_writes', 'Unauthorized cross-tenant writes', failedWrites, { blocker: true }),
    zero('unauthorized_cross_universe_access', 'Unauthorized cross-Universe reads/writes', failedUniverse, {
      blocker: true,
    }),
    rlsVerified
      ? atLeast(
          'rls_validated_tables',
          'Tenant-bearing tables with validated RLS',
          percent(rls.totals.tablesWithValidatedRls, rls.totals.tablesWithValidatedRls + rls.totals.tablesWithoutValidatedRls),
          100,
          { blocker: true, note: `executed on PostgreSQL ${rls.postgresVersion}` },
        )
      : unverified('rls_validated_tables', 'Tenant-bearing tables with validated RLS', '100%', rls.reason),
    rlsVerified
      ? atLeast(
          'rls_negative_suite',
          'Database cross-tenant/universe negative suite passed',
          percent(rls.totals.passed, rls.totals.total),
          100,
          { blocker: true },
        )
      : unverified('rls_negative_suite', 'Database cross-tenant/universe negative suite passed', '100%', rls.reason),
    zero(
      'undocumented_bypass_paths',
      'Privileged bypass paths without documented justification',
      // Counting only the registered paths would be satisfied by an empty
      // registry, so an undocumented path that was *not* refused counts as one
      // in use.
      undocumentedJustifications + (undocumentedBypass === 'bypass_unjustified' ? 0 : 1),
      {
        blocker: true,
        note: `${documentedPaths.length} registered paths (${documentedPaths.map((path) => path.pathId).join(', ')}) each carry a justification and approver; an unregistered path was refused as ${undocumentedBypass}`,
      },
    ),
  ];

  return summarize('AC-03', 'Tenant & Universe Isolation', thresholds, {
    controlPlaneTests: tests,
    controlPlaneDeniedReads: plane.isolationCounters.deniedReads,
    controlPlaneDeniedWrites: plane.isolationCounters.deniedWrites,
    documentedBypassPaths: documentedPaths,
    undocumentedBypassRefusalCode: undocumentedBypass,
    databaseRls: rls,
  });
}

export function runIsolationAcceptance(): AcceptanceResult[] {
  return [runAc03()];
}
