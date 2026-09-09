/**
 * AC-01 runtime registration and identity.
 * AC-02 runtime attestation.
 * AC-13 kill switch.
 */
import { NodeRegistry } from '../src/nodes';
import type { AcceptanceResult, Threshold } from './harness';
import { TENANT_A, TENANT_B, atLeast, atMost, buildFixture, catchCode, percent, summarize, workloadSpec, zero } from './harness';
import type { ControlCommandKind, RuntimeNode } from '../src/types';

export function runAc01(): AcceptanceResult {
  const { plane, clock, operatorA, operatorB, limitedA } = buildFixture();
  const nodeIds = new Set<string>();
  const registered: string[] = [];

  // 40 authorized nodes across two organizations.
  for (let index = 0; index < 40; index += 1) {
    const tenant = index % 2 === 0 ? TENANT_A : TENANT_B;
    const token = index % 2 === 0 ? operatorA.token : operatorB.token;
    const node = plane.onboardNode({ token, tenant, serial: `serial-${index}` });
    nodeIds.add(node.nodeId);
    registered.push(node.nodeId);
  }

  const correctlyBound = registered.filter((nodeId) => {
    const inA = plane.nodes.get(TENANT_A, nodeId);
    const inB = plane.nodes.get(TENANT_B, nodeId);
    // Exactly one tenant scope may see each node.
    return (Boolean(inA) ? 1 : 0) + (Boolean(inB) ? 1 : 0) === 1;
  }).length;

  // Re-registering the same hardware must not mint a second active identity.
  const duplicateAttempts = 10;
  let duplicateIdentities = 0;
  for (let index = 0; index < duplicateAttempts; index += 1) {
    const before = plane.nodes.identityCount;
    plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: `serial-${index * 2}` });
    if (plane.nodes.identityCount !== before) duplicateIdentities += 1;
  }

  // Unknown / unauthorized enrollment attempts. Each states the code it must
  // be refused with: counting "was refused at all" would pass on a scenario
  // that broke for an unrelated reason.
  const capacity = { cpuMillis: 1_000, gpuMillis: 0, ramMb: 512, concurrentWorkloads: 1 };
  const enrollmentNegatives: { scenario: string; expect: string; run: () => string }[] = [
    {
      scenario: 'presented_fingerprint_does_not_match_ticket',
      expect: 'enrollment_invalid',
      run: () =>
        catchCode(() => {
          const hardware = plane.hostHardware.profile;
          const ticket = plane.nodes.issueEnrollment({
            principal: operatorA.principal,
            tenant: TENANT_A,
            fingerprint: NodeRegistry.nodeFingerprint({ serial: 'rogue-1', platform: hardware.classId, publicKey: 'pk_rogue' }),
            hardware,
            capacity,
          });
          return plane.nodes.register(ticket, { fingerprint: 'fp_not_the_enrolled_device' });
        }),
    },
    {
      scenario: 'enrollment_ticket_signature_tampered',
      expect: 'enrollment_invalid',
      run: () =>
        catchCode(() => {
          const hardware = plane.hostHardware.profile;
          const fingerprint = NodeRegistry.nodeFingerprint({ serial: 'rogue-2', platform: hardware.classId, publicKey: 'pk_rogue2' });
          const ticket = plane.nodes.issueEnrollment({
            principal: operatorA.principal,
            tenant: TENANT_A,
            fingerprint,
            hardware,
            capacity,
          });
          return plane.nodes.register({ ...ticket, signature: `${ticket.signature.slice(0, -1)}0` }, { fingerprint });
        }),
    },
    {
      scenario: 'enrollment_ticket_expired',
      expect: 'enrollment_invalid',
      run: () =>
        catchCode(() => {
          const hardware = plane.hostHardware.profile;
          const fingerprint = NodeRegistry.nodeFingerprint({ serial: 'rogue-3', platform: hardware.classId, publicKey: 'pk_rogue3' });
          const ticket = plane.nodes.issueEnrollment({
            principal: operatorA.principal,
            tenant: TENANT_A,
            fingerprint,
            hardware,
            capacity,
          });
          clock.advance(ticket.expiresAt - clock.now() + 1);
          return plane.nodes.register(ticket, { fingerprint });
        }),
    },
    {
      scenario: 'unauthorized_issuer',
      expect: 'unauthorized',
      run: () =>
        catchCode(() =>
          plane.nodes.issueEnrollment({
            principal: limitedA.principal,
            tenant: TENANT_A,
            fingerprint: 'fp_unauthorized_issuer',
            hardware: plane.hostHardware.profile,
            capacity,
          }),
        ),
    },
    {
      scenario: 'cross_tenant_enrollment',
      expect: 'isolation_violation',
      run: () =>
        catchCode(() =>
          plane.nodes.issueEnrollment({
            principal: operatorA.principal,
            tenant: TENANT_B,
            fingerprint: 'fp_cross_tenant_enrollment',
            hardware: plane.hostHardware.profile,
            capacity,
          }),
        ),
    },
  ];

  const enrollmentResults = enrollmentNegatives.map((negative) => ({
    scenario: negative.scenario,
    expected: negative.expect,
    observed: negative.run(),
  }));
  const wrongEnrollmentRefusals = enrollmentResults.filter((entry) => entry.observed !== entry.expected);
  const unknownNodeRejections = enrollmentResults.map((entry) => entry.observed);

  // An unknown node must never receive a protected workload. A node the
  // registry never enrolled is fabricated here, matching a registered node in
  // every field the router inspects except that no enrollment or attestation
  // exists for it. Asking for a hardware class the host does not have would
  // also be refused, but for the wrong reason, so this uses the host's own
  // class and leaves identity as the only thing missing.
  const genuine = plane.nodes.require(TENANT_A, registered[0] as string);
  const unknownNode: RuntimeNode = {
    ...genuine,
    nodeId: 'node_never_enrolled',
    enrollmentId: 'enr_never_issued',
    enrollmentFingerprint: 'fp_never_enrolled',
  };
  const unknownNodeInRegistry = plane.nodes.get(TENANT_A, unknownNode.nodeId) ? 1 : 0;
  const unknownNodeGateCode = catchCode(() => plane.attestation.assertEligible(unknownNode, 'restricted'));
  const unknownNodeRouting = plane.router.route({
    spec: workloadSpec({
      tenant: TENANT_A,
      classification: 'restricted',
      requiredCapabilities: ['workload.submit', 'workload.submit.protected'],
      hardware: { classIds: [plane.hostHardware.classId] },
    }),
    candidates: [unknownNode],
    load: () => ({ activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 }),
    tenantBudgetAvailable: true,
  });
  // The per-node reason is what matters: the aggregate `no_eligible_runtime`
  // would look the same if the node had been dropped over hardware instead.
  const unknownNodeReason = unknownNodeRouting.rejectedNodes[unknownNode.nodeId] ?? 'not_rejected';
  const unknownNodeProtectedWork =
    unknownNodeInRegistry +
    (unknownNodeGateCode === 'attestation_required' ? 0 : 1) +
    (unknownNodeReason === 'attestation_required' ? 0 : 1);

  // A revoked node must receive no new workloads and must not re-register.
  const revokedNode = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'serial-to-revoke' });
  plane.control.issue({
    principal: operatorA.principal,
    kind: 'REVOKE_NODE',
    targetId: revokedNode.nodeId,
    tenant: TENANT_A,
    reason: 'ac01_revocation_test',
  });
  const revokedReRegistration = catchCode(() =>
    plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'serial-to-revoke' }),
  );
  // Offered as the only candidate, so a refusal cannot be the router quietly
  // preferring one of the 40 healthy nodes.
  const revokedRouting = plane.router.route({
    spec: workloadSpec({ tenant: TENANT_A, hardware: { classIds: [plane.hostHardware.classId] } }),
    candidates: [plane.nodes.require(TENANT_A, revokedNode.nodeId)],
    load: () => ({ activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 }),
    tenantBudgetAvailable: true,
  });
  const revokedReason = revokedRouting.rejectedNodes[revokedNode.nodeId] ?? 'not_rejected';
  const postRevocationWork =
    plane.nodes.list(TENANT_A).filter((node) => node.nodeId === revokedNode.nodeId && node.state === 'active').length +
    (revokedReason === 'node_unavailable' ? 0 : 1);

  const registrationAuditCoverage = registered.filter((nodeId) =>
    plane.audit.has((event) => event.kind === 'node_registered' && event.subjectId === nodeId),
  ).length;

  const thresholds: Threshold[] = [
    atLeast('unique_node_id', 'Unique node_id', percent(nodeIds.size, registered.length), 100, { blocker: true }),
    atLeast(
      'tenant_binding',
      'Organization/Universe binding',
      percent(correctlyBound, registered.length),
      100,
      { blocker: true },
    ),
    zero('duplicate_identities', 'Duplicate active node identities', duplicateIdentities, { blocker: true }),
    zero(
      'unknown_nodes_with_protected_work',
      'Unknown nodes receiving protected workloads',
      unknownNodeProtectedWork,
      {
        blocker: true,
        note: `absent from the registry, trust gate refused as ${unknownNodeGateCode}, router excluded the node as ${unknownNodeReason}`,
      },
    ),
    zero(
      'revoked_nodes_with_new_work',
      'Revoked nodes receiving new workloads',
      postRevocationWork,
      {
        blocker: true,
        note: `re-registration refused as ${revokedReRegistration}; as sole candidate the router excluded the node as ${revokedReason}`,
      },
    ),
    atLeast(
      'registration_audit_coverage',
      'Registration events in audit lineage',
      percent(registrationAuditCoverage, registered.length),
      100,
      { blocker: true },
    ),
    zero(
      'enrollment_negatives_wrongly_refused',
      'Invalid enrollments refused with the wrong reason',
      wrongEnrollmentRefusals.length + (revokedReRegistration === 'node_revoked' ? 0 : 1),
      {
        blocker: true,
        note: wrongEnrollmentRefusals.length
          ? wrongEnrollmentRefusals
              .map((entry) => `${entry.scenario}: expected ${entry.expected}, got ${entry.observed}`)
              .join('; ')
          : `${enrollmentResults.length} invalid enrollments each refused for the reason they test, and a revoked identity refused as ${revokedReRegistration}`,
      },
    ),
  ];

  return summarize('AC-01', 'Runtime Registration & Identity', thresholds, {
    nodesRegistered: registered.length,
    distinctNodeIds: nodeIds.size,
    duplicateRegistrationAttempts: duplicateAttempts,
    enrollmentNegatives: enrollmentResults,
    rejectionCodes: unknownNodeRejections,
    revokedReRegistrationCode: revokedReRegistration,
    auditChainIntact: plane.audit.verifyChain().intact,
  });
}

export function runAc02(): AcceptanceResult {
  const { plane, clock, operatorA } = buildFixture();

  const attested = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'att-fresh' });
  const expiring = plane.onboardNode({
    token: operatorA.token,
    tenant: TENANT_A,
    serial: 'att-expiring',
    attestationValidForMs: 1_000,
  });
  const failing = plane.onboardNode({
    token: operatorA.token,
    tenant: TENANT_A,
    serial: 'att-failing',
    measurements: { boot_chain: 'measured' },
  });
  const quarantined = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'att-quarantine' });

  plane.control.issue({
    principal: operatorA.principal,
    kind: 'QUARANTINE_NODE',
    targetId: quarantined.nodeId,
    tenant: TENANT_A,
    reason: 'ac02_quarantine_test',
  });

  clock.advance(5_000);

  const protectedSpec = (nodeHint: string) =>
    workloadSpec({
      tenant: TENANT_A,
      classification: 'restricted',
      requiredCapabilities: ['workload.submit', 'workload.submit.protected'],
      hardware: { classIds: [plane.hostHardware.classId] },
      sourceId: nodeHint,
    });

  // Only the freshly attested node remains eligible, so 40 protected workloads
  // must all land there and nowhere else.
  const protectedRuns = 40;
  const landedNodes: string[] = [];
  for (let index = 0; index < protectedRuns; index += 1) {
    const outcome = plane.engine.execute(
      { token: operatorA.token, spec: protectedSpec(`protected-${index}`) },
      { iterations: 2_000 },
    );
    if (outcome.record.nodeId) landedNodes.push(outcome.record.nodeId);
  }

  const onAttested = landedNodes.filter((nodeId) => nodeId === attested.nodeId).length;
  const onExpired = landedNodes.filter((nodeId) => nodeId === expiring.nodeId).length;
  const onFailed = landedNodes.filter((nodeId) => nodeId === failing.nodeId).length;
  const onQuarantined = landedNodes.filter((nodeId) => nodeId === quarantined.nodeId).length;

  const expiredState = plane.attestation.evaluate(expiring.nodeId);
  const failedState = plane.attestation.evaluate(failing.nodeId);

  const directAttempts = {
    expired: catchCode(() => plane.attestation.assertEligible(plane.nodes.require(TENANT_A, expiring.nodeId), 'restricted')),
    failed: catchCode(() => plane.attestation.assertEligible(plane.nodes.require(TENANT_A, failing.nodeId), 'restricted')),
    quarantined: catchCode(() =>
      plane.attestation.assertEligible(plane.nodes.require(TENANT_A, quarantined.nodeId), 'restricted'),
    ),
  };

  const protectedWorkloads = plane.workloadStore
    .list(TENANT_A)
    .filter((record) => record.spec.classification === 'restricted' && record.state !== 'rejected');
  const withAttestationLineage = protectedWorkloads.filter((record) => record.attestationId !== null).length;

  // The router filters ineligible nodes out before the trust gate is reached,
  // so the counts above stay at zero even if the gate itself stops refusing.
  // These call the gate directly, which is the check the router relies on.
  const gateRefusals = Object.entries(directAttempts).filter(
    ([, code]) => code === 'attestation_required' || code === 'node_unavailable',
  ).length;

  const thresholds: Threshold[] = [
    atLeast(
      'protected_on_attested',
      'Protected workloads on required-attested nodes',
      percent(onAttested, landedNodes.length),
      100,
      { blocker: true },
    ),
    zero('expired_attestation_executions', 'Expired-attestation protected executions', onExpired, { blocker: true }),
    zero('failed_attestation_executions', 'Failed-attestation protected executions', onFailed, { blocker: true }),
    zero('quarantined_node_executions', 'Quarantined-node protected executions', onQuarantined, { blocker: true }),
    atLeast(
      'attestation_in_lineage',
      'Attestation state recorded with workload lineage',
      percent(withAttestationLineage, protectedWorkloads.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'trust_gate_refuses_directly',
      'Trust gate refuses ineligible nodes when called directly',
      percent(gateRefusals, Object.keys(directAttempts).length),
      100,
      {
        blocker: true,
        note: Object.entries(directAttempts)
          .map(([name, code]) => `${name}=${code}`)
          .join(', '),
      },
    ),
  ];

  return summarize('AC-02', 'Runtime Attestation', thresholds, {
    protectedExecutions: landedNodes.length,
    attestedNodeId: attested.nodeId,
    expiredAttestationStatus: expiredState.status,
    failedAttestationStatus: failedState.status,
    quarantinedNodeState: plane.nodes.require(TENANT_A, quarantined.nodeId).state,
    directAttemptCodes: directAttempts,
    trustPolicy: plane.attestation.trustPolicy,
  });
}

export function runAc13(): AcceptanceResult {
  const { plane, operatorA, agentPrincipalA } = buildFixture();

  const nodeA = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'kill-1' });
  const nodeB = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'kill-2' });
  const nodeC = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'kill-3' });
  const nodeD = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'kill-4' });

  const agent = plane.agents.register({ tenant: TENANT_A, agentKey: 'kill-switch-agent', classification: 'internal' });
  plane.agents.activate({
    principal: operatorA.principal,
    agentId: agent.agentId,
    node: nodeB,
    nodeMaxClassification: plane.classificationCeilingForNode(nodeB),
    reason: 'ac13_setup',
  });

  const meeting = plane.meetings.open({
    principal: operatorA.principal,
    tenant: TENANT_A,
    classification: 'internal',
    participants: [
      { participantId: operatorA.principal.principalId, kind: 'human', tenant: TENANT_A, displayName: 'Operator' },
      { participantId: agentPrincipalA.principal.principalId, kind: 'agent', tenant: TENANT_A, displayName: 'Analyst agent' },
    ],
    offline: false,
  });

  const runningTask = plane.engine.submit({
    token: operatorA.token,
    spec: workloadSpec({ tenant: TENANT_A, hardware: { classIds: [plane.hostHardware.classId] } }),
  });
  const agentTask = plane.engine.submit({
    token: operatorA.token,
    spec: workloadSpec({ tenant: TENANT_A, agentId: agent.agentId, hardware: { classIds: [plane.hostHardware.classId] } }),
  });

  const commands: { kind: ControlCommandKind; effective: boolean; ackMs: number }[] = [];
  const issue = (kind: ControlCommandKind, targetId: string) => {
    const command = plane.control.issue({
      principal: operatorA.principal,
      kind,
      targetId,
      tenant: TENANT_A,
      reason: `ac13_${kind.toLowerCase()}`,
    });
    commands.push({ kind, effective: Boolean(command.effectiveAt), ackMs: command.ackLatencyMs ?? Number.NaN });
    return command;
  };

  issue('STOP_TASK', runningTask.record.workloadId);
  issue('STOP_AGENT', agent.agentId);
  issue('STOP_MEETING', meeting.meetingId);
  issue('PAUSE_NODE', nodeA.nodeId);
  issue('QUARANTINE_NODE', nodeC.nodeId);
  issue('REVOKE_NODE', nodeD.nodeId);

  // Repeat the sequence on more nodes so the p95 has a real sample.
  for (let index = 0; index < 30; index += 1) {
    const node = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: `kill-bulk-${index}` });
    issue(index % 2 === 0 ? 'QUARANTINE_NODE' : 'REVOKE_NODE', node.nodeId);
  }

  // After revocation, protected work must not start on the revoked node. Each
  // revoked node is offered as the router's only candidate: submitting normally
  // would be satisfied by some other healthy node and prove nothing.
  const revokedTargets = plane.nodes
    .list(TENANT_A)
    .filter((node) => node.state === 'revoked')
    .map((node) => node.nodeId);
  const revokedRoutingReasons: string[] = [];
  let protectedStartsOnRevoked = 0;
  for (const nodeId of revokedTargets) {
    const decision = plane.router.route({
      spec: workloadSpec({
        tenant: TENANT_A,
        classification: 'restricted',
        requiredCapabilities: ['workload.submit', 'workload.submit.protected'],
        hardware: { classIds: [plane.hostHardware.classId] },
      }),
      candidates: [plane.nodes.require(TENANT_A, nodeId)],
      load: () => ({ activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 }),
      tenantBudgetAvailable: true,
    });
    const reason = decision.rejectedNodes[nodeId] ?? 'not_rejected';
    revokedRoutingReasons.push(reason);
    if (reason !== 'node_unavailable') protectedStartsOnRevoked += 1;
  }

  const newWorkPrevented =
    revokedTargets.length > 0 && revokedTargets.every((nodeId) => plane.control.isBlocked(nodeId));
  const auditCoverage = commands.length
    ? plane.control
        .list()
        .filter((command) =>
          plane.audit.has(
            (event) => event.category === 'control' && event.detail.commandId === command.commandId,
          ),
        ).length
    : 0;

  const agentAfterStop = plane.agents.require(TENANT_A, agent.agentId);
  const taskAfterStop = plane.workloadStore.get(TENANT_A, runningTask.record.workloadId);
  const agentTaskAfterStop = plane.workloadStore.get(TENANT_A, agentTask.record.workloadId);
  const p95 = plane.control.ackLatencyPercentile(95);

  const thresholds: Threshold[] = [
    atMost('ack_p95', 'Control request acknowledged (p95)', p95, 2_000, 'ms', { blocker: true }),
    atLeast(
      'new_work_prevented',
      'New work prevented after effective revocation',
      newWorkPrevented ? 100 : 0,
      100,
      { blocker: true },
    ),
    zero('protected_started_on_revoked', 'Protected workload started on revoked node', protectedStartsOnRevoked, {
      blocker: true,
      note: `${revokedTargets.length} revoked nodes each offered as the only candidate, excluded as ${[...new Set(revokedRoutingReasons)].join(', ') || 'none refused'}`,
    }),
    atLeast(
      'control_audit_coverage',
      'Kill/quarantine event audit coverage',
      percent(auditCoverage, plane.control.commandCount),
      100,
      { blocker: true },
    ),
    boolThreshold('stop_task_effective', 'STOP TASK terminated the running task', taskAfterStop?.state === 'terminated'),
    boolThreshold('stop_agent_effective', 'STOP AGENT deactivated the agent', agentAfterStop.active === false),
    boolThreshold(
      'stop_agent_stops_work',
      'STOP AGENT terminated the agent workload',
      agentTaskAfterStop?.state === 'terminated',
    ),
    boolThreshold('stop_meeting_effective', 'STOP MEETING closed the meeting', plane.meetings.isOpen(meeting.meetingId) === false),
    boolThreshold(
      'pause_node_effective',
      'PAUSE NODE removed the node from scheduling',
      plane.nodes.require(TENANT_A, nodeA.nodeId).state === 'paused' && plane.control.isBlocked(nodeA.nodeId),
    ),
    boolThreshold(
      'quarantine_node_effective',
      'QUARANTINE NODE blocked the node',
      plane.nodes.require(TENANT_A, nodeC.nodeId).state === 'quarantined' && plane.control.isBlocked(nodeC.nodeId),
    ),
    boolThreshold(
      'revoke_node_irreversible',
      'REVOKE NODE cannot be cleared',
      catchCode(() => plane.control.clearBlock(nodeD.nodeId)) === 'node_revoked',
    ),
  ];

  return summarize('AC-13', 'Kill Switch', thresholds, {
    commandsIssued: plane.control.commandCount,
    ackLatencyP95Ms: p95,
    ackLatencyP50Ms: plane.control.ackLatencyPercentile(50),
    revokedNodes: revokedTargets.length,
    revokedRoutingReasons: [...new Set(revokedRoutingReasons)],
    commandKindsExercised: [...new Set(commands.map((command) => command.kind))],
  });
}

function boolThreshold(id: string, label: string, observed: boolean): Threshold {
  return {
    id,
    label,
    target: 'YES',
    measured: observed ? 'YES' : 'NO',
    status: observed ? 'PASS' : 'FAIL',
    blocker: true,
  };
}

export function runFleetAcceptance(): AcceptanceResult[] {
  return [runAc01(), runAc02(), runAc13()];
}
