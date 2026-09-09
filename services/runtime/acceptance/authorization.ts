/**
 * AC-04 workload authorization.
 * AC-14 model authorization.
 * AC-15 information logistics and provenance.
 */
import { REQUIRED_LINEAGE_STAGES } from '../src/lineage';
import { LOCAL_REFERENCE_MODEL_ID } from '../src/plane';
import type { AcceptanceResult, Threshold } from './harness';
import {
  TENANT_A,
  TENANT_B,
  atLeast,
  buildFixture,
  catchCode,
  percent,
  standardBudget,
  summarize,
  workloadSpec,
  zero,
} from './harness';

export function runAc04(): AcceptanceResult {
  const { plane, operatorA, operatorB, agentPrincipalA, limitedA } = buildFixture();
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'auth-1' });
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'auth-2' });
  plane.onboardNode({ token: operatorB.token, tenant: TENANT_B, serial: 'auth-b1' });

  const hardware = { classIds: [plane.hostHardware.classId] };
  const accepted: string[] = [];
  const refused: { reason: string; scenario: string }[] = [];

  // 120 legitimate authorized workloads.
  for (let index = 0; index < 120; index += 1) {
    const outcome = plane.engine.execute(
      {
        token: operatorA.token,
        spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }),
      },
      { iterations: 500 },
    );
    if (!outcome.rejection) accepted.push(outcome.record.workloadId);
  }

  // Negative tests: each must be refused with a policy decision.
  const negativeScenarios: { scenario: string; run: () => string }[] = [
    {
      scenario: 'unauthenticated_requester',
      run: () =>
        plane.engine.submit({ token: 'not-a-token', spec: workloadSpec({ tenant: TENANT_A, hardware }) }).rejection
          ?.reason ?? 'accepted',
    },
    {
      scenario: 'missing_token',
      run: () => plane.engine.submit({ token: '', spec: workloadSpec({ tenant: TENANT_A, hardware }) }).rejection?.reason ?? 'accepted',
    },
    {
      scenario: 'tenant_mismatch',
      run: () =>
        plane.engine.submit({ token: operatorA.token, spec: workloadSpec({ tenant: TENANT_B, hardware }) }).rejection
          ?.reason ?? 'accepted',
    },
    {
      scenario: 'empty_tenant_context',
      run: () =>
        plane.engine.submit({
          token: operatorA.token,
          spec: workloadSpec({ tenant: { organizationId: '', universeId: '' }, hardware }),
        }).rejection?.reason ?? 'accepted',
    },
    {
      scenario: 'capability_escalation_protected',
      run: () =>
        plane.engine.submit({
          token: limitedA.token,
          spec: workloadSpec({
            tenant: TENANT_A,
            classification: 'restricted',
            requiredCapabilities: ['workload.submit', 'workload.submit.protected'],
            hardware,
          }),
        }).rejection?.reason ?? 'accepted',
    },
    {
      scenario: 'capability_escalation_control',
      run: () =>
        plane.engine.submit({
          token: limitedA.token,
          spec: workloadSpec({ tenant: TENANT_A, requiredCapabilities: ['workload.submit', 'node.control'], hardware }),
        }).rejection?.reason ?? 'accepted',
    },
    {
      scenario: 'classification_above_ceiling',
      run: () =>
        plane.engine.submit({
          token: agentPrincipalA.token,
          spec: workloadSpec({
            tenant: TENANT_A,
            classification: 'restricted',
            requiredCapabilities: ['workload.submit'],
            hardware,
          }),
        }).rejection?.reason ?? 'accepted',
    },
    {
      scenario: 'approval_required_but_absent',
      run: () =>
        plane.engine.submit({
          token: operatorA.token,
          spec: workloadSpec({ tenant: TENANT_A, requiresApproval: true, consequential: true, hardware }),
        }).rejection?.reason ?? 'accepted',
    },
    {
      scenario: 'agent_cannot_self_approve',
      run: () => {
        const spec = workloadSpec({ tenant: TENANT_A, requiresApproval: true, consequential: true, hardware });
        const code = catchCode(() => plane.approvals.grant(agentPrincipalA.principal, spec.workloadId, TENANT_A));
        return code === 'unauthorized' ? 'agent_approval_refused' : 'accepted';
      },
    },
    {
      scenario: 'grant_replay_refused',
      run: () => {
        const spec = workloadSpec({ tenant: TENANT_A, hardware });
        const authorization = plane.authorizer.authorize(operatorA.principal, spec);
        if (!authorization.allowed) return 'unexpected_refusal';
        const node = plane.nodes.list(TENANT_A)[0];
        if (!node) return 'no_node';
        plane.authorizer.clear({ grant: authorization.grant, node, attestation: null, protectedExecution: false });
        return catchCode(() =>
          plane.authorizer.clear({ grant: authorization.grant, node, attestation: null, protectedExecution: false }),
        ) === 'grant_invalid'
          ? 'grant_replay_refused'
          : 'accepted';
      },
    },
    {
      scenario: 'forged_grant_refused',
      run: () => {
        const spec = workloadSpec({ tenant: TENANT_A, hardware });
        const authorization = plane.authorizer.authorize(operatorA.principal, spec);
        if (!authorization.allowed) return 'unexpected_refusal';
        const node = plane.nodes.list(TENANT_A)[0];
        if (!node) return 'no_node';
        const forged = { ...authorization.grant, classification: 'restricted' as const };
        return catchCode(() =>
          plane.authorizer.clear({ grant: forged, node, attestation: null, protectedExecution: true }),
        ) === 'grant_invalid'
          ? 'forged_grant_refused'
          : 'accepted';
      },
    },
    {
      scenario: 'grant_repointed_to_other_tenant_node',
      run: () => {
        const spec = workloadSpec({ tenant: TENANT_A, hardware });
        const authorization = plane.authorizer.authorize(operatorA.principal, spec);
        if (!authorization.allowed) return 'unexpected_refusal';
        const foreign = plane.nodes.list(TENANT_B)[0];
        if (!foreign) return 'no_node';
        return catchCode(() =>
          plane.authorizer.clear({ grant: authorization.grant, node: foreign, attestation: null, protectedExecution: false }),
        ) === 'grant_invalid'
          ? 'guardian_refused_foreign_node'
          : 'accepted';
      },
    },
    {
      scenario: 'unbounded_budget_refused',
      run: () =>
        plane.engine.submit({
          token: operatorA.token,
          spec: workloadSpec({
            tenant: TENANT_A,
            hardware,
            budget: standardBudget({ hardTerminationMs: Number.POSITIVE_INFINITY }),
          }),
        }).rejection?.reason ?? 'accepted',
    },
  ];

  for (const negative of negativeScenarios) {
    const reason = negative.run();
    refused.push({ scenario: negative.scenario, reason });
  }

  const escalationSuccesses = refused.filter((entry) => entry.reason === 'accepted').length;
  const allWorkloads = plane.workloadStore.list(TENANT_A);
  const withPolicyDecision = allWorkloads.filter((workload) =>
    plane.audit.has(
      (event) =>
        event.subjectId === workload.workloadId &&
        (event.kind === 'workload_authorized' || event.kind === 'workload_authorization_denied' || event.kind === 'workload_rejected'),
    ),
  ).length;
  const withTenantContext = allWorkloads.filter(
    (workload) => Boolean(workload.tenant.organizationId) && Boolean(workload.tenant.universeId),
  ).length;
  const executed = allWorkloads.filter((workload) => workload.state === 'completed');
  const executedWithGrant = executed.filter((workload) => workload.grantId !== null).length;
  const guardianCleared = executed.filter((workload) =>
    plane.audit.has((event) => event.kind === 'guardian_cleared' && event.subjectId === workload.workloadId),
  ).length;

  const thresholds: Threshold[] = [
    atLeast(
      'authenticated_requester',
      'Workloads with authenticated requester',
      percent(executedWithGrant, executed.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'tenant_context',
      'Workloads with Organization/Universe context',
      percent(withTenantContext, allWorkloads.length),
      100,
      { blocker: true },
    ),
    atLeast('policy_decision', 'Workloads with policy decision', percent(withPolicyDecision, allWorkloads.length), 100, {
      blocker: true,
    }),
    zero(
      'unauthorized_executions',
      'Unauthorized workload executions',
      plane.engine.unauthorizedExecutionCount + (executed.length - guardianCleared),
      { blocker: true },
    ),
    zero('capability_escalations', 'Capability-escalation successes during negative testing', escalationSuccesses, {
      blocker: true,
    }),
    zero(
      'guardian_bypasses',
      'Guardian bypasses',
      executed.filter((workload) => !plane.audit.has((event) => event.kind === 'guardian_cleared' && event.subjectId === workload.workloadId)).length,
      { blocker: true },
    ),
  ];

  return summarize('AC-04', 'Workload Authorization', thresholds, {
    acceptedWorkloads: accepted.length,
    negativeScenarios: refused,
    guardianDeniedAttempts: plane.authorizer.deniedGuardianAttempts,
    auditChainIntact: plane.audit.verifyChain().intact,
  });
}

export function runAc14(): AcceptanceResult {
  const { plane, operatorA } = buildFixture();
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'model-1' });
  const hardware = { classIds: [plane.hostHardware.classId] };

  // Negative fixtures: registered but not approved, approved but ungated,
  // approved and gated but with no configured provider.
  plane.models.register({
    modelId: 'unapproved-model-1',
    provider: 'xiv_local',
    displayName: 'Unapproved local model',
    approved: false,
    providerConfigured: true,
    evaluationGate: { evaluationId: 'eval_x', passed: true, evaluatedAt: 0, evidenceUri: 'n/a' },
    maxTokens: 1_024,
    costPerKTokenUsd: 0,
    classifications: ['internal'],
  });
  plane.models.register({
    modelId: 'ungated-model-1',
    provider: 'xiv_local',
    displayName: 'Approved but ungated local model',
    approved: true,
    providerConfigured: true,
    maxTokens: 1_024,
    costPerKTokenUsd: 0,
    classifications: ['internal'],
  });
  plane.models.register({
    modelId: 'unconfigured-provider-model-1',
    provider: 'gemini',
    displayName: 'Hosted model with no configured credentials',
    approved: true,
    providerConfigured: false,
    evaluationGate: { evaluationId: 'eval_y', passed: true, evaluatedAt: 0, evidenceUri: 'n/a' },
    maxTokens: 1_024,
    costPerKTokenUsd: 0.002,
    classifications: ['internal'],
  });

  const runs = 60;
  for (let index = 0; index < runs; index += 1) {
    plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 400, modelUsage: { tokensIn: 128, tokensOut: 128 } },
    );
  }

  const blocked = {
    unregistered:
      plane.engine.submit({ token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: 'model-does-not-exist' }) })
        .rejection?.reason ?? 'accepted',
    unapproved: '',
    ungated: '',
    unconfiguredProvider: '',
    classificationMismatch: '',
  };

  const runBlocked = (modelId: string, classification: 'internal' | 'restricted' = 'internal') => {
    const outcome = plane.engine.execute(
      {
        token: operatorA.token,
        spec: workloadSpec({
          tenant: TENANT_A,
          hardware,
          modelId,
          classification,
          requiredCapabilities:
            classification === 'restricted' ? ['workload.submit', 'workload.submit.protected'] : ['workload.submit'],
        }),
      },
      { iterations: 200 },
    );
    return outcome.error?.code ?? outcome.rejection?.reason ?? 'executed';
  };

  blocked.unapproved = runBlocked('unapproved-model-1');
  blocked.ungated = runBlocked('ungated-model-1');
  blocked.unconfiguredProvider = runBlocked('unconfigured-provider-model-1');
  blocked.classificationMismatch = runBlocked(LOCAL_REFERENCE_MODEL_ID, 'restricted');

  const substitution = catchCode(() =>
    plane.models.bindToRuntime(
      {
        modelId: 'not-adapter-resolvable',
        provider: 'xiv_local',
        displayName: 'x',
        approved: true,
        providerConfigured: true,
        evaluationGate: { evaluationId: 'e', passed: true, evaluatedAt: 0, evidenceUri: 'n/a' },
        maxTokens: 1,
        costPerKTokenUsd: 0,
        classifications: ['internal'],
      },
      plane.hardware.adapterFor(plane.hostHardware.classId),
    ),
  );

  const invocations = plane.models.allInvocations();
  const attributable = invocations.filter((invocation) => Boolean(invocation.modelId)).length;
  const unregisteredUsage = invocations.filter((invocation) => plane.models.get(invocation.modelId) === undefined).length;
  const unapprovedUsage = invocations.filter((invocation) => {
    const entry = plane.models.get(invocation.modelId);
    return !entry || !entry.approved || !entry.evaluationGate?.passed;
  }).length;
  const availableEntries = plane.models.list().filter((entry) => plane.models.availability(entry.modelId) === 'available');
  const evaluationGatePresent = availableEntries.filter((entry) => entry.evaluationGate?.passed).length;
  const unavailableTreatedAsAvailable = plane.models
    .list()
    .filter((entry) => !entry.providerConfigured && plane.models.availability(entry.modelId) === 'available').length;

  const thresholds: Threshold[] = [
    atLeast('model_calls_attributable', 'Model calls attributable to model_id', percent(attributable, invocations.length), 100, {
      blocker: true,
    }),
    zero('unregistered_model_usage', 'Unregistered model usage', unregisteredUsage, { blocker: true }),
    zero(
      'unapproved_substitution',
      'Unapproved model substitution',
      unapprovedUsage + (substitution === 'model_unavailable' || substitution === 'model_substitution' ? 0 : 1),
      { blocker: true, note: `runtime substitution refused as ${substitution}` },
    ),
    atLeast(
      'evaluation_gate_present',
      'Required evaluation gate present',
      percent(evaluationGatePresent, availableEntries.length),
      100,
      { blocker: true },
    ),
    zero('unavailable_treated_available', 'Model/provider unavailable but treated as available', unavailableTreatedAsAvailable, {
      blocker: true,
    }),
  ];

  return summarize('AC-14', 'Model Authorization', thresholds, {
    invocations: invocations.length,
    blockedScenarios: blocked,
    registryInventory: plane.models.list().map((entry) => ({
      modelId: entry.modelId,
      provider: entry.provider,
      availability: plane.models.availability(entry.modelId),
      approved: entry.approved,
      providerConfigured: entry.providerConfigured,
      evaluationGate: entry.evaluationGate?.evaluationId ?? null,
    })),
    note: 'No hosted provider credentials are configured in this environment, so every hosted entry reports UNAVAILABLE and only the local deterministic runtime is invocable.',
  });
}

export function runAc15(): AcceptanceResult {
  const { plane, operatorA } = buildFixture();
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'prov-1' });
  const hardware = { classIds: [plane.hostHardware.classId] };

  const consequential: string[] = [];
  const reconstructions: ReturnType<typeof plane.lineage.reconstruct>[] = [];

  for (let index = 0; index < 50; index += 1) {
    const agent = plane.agents.register({ tenant: TENANT_A, agentKey: `prov-agent-${index}`, classification: 'internal' });
    const spec = workloadSpec({
      tenant: TENANT_A,
      hardware,
      modelId: LOCAL_REFERENCE_MODEL_ID,
      agentId: agent.agentId,
      consequential: true,
      requiresApproval: true,
      sourceId: `evidence_source_${index}`,
    });
    plane.approvals.grant(operatorA.principal, spec.workloadId, TENANT_A);
    const outcome = plane.engine.execute(
      { token: operatorA.token, spec },
      {
        iterations: 400,
        externalActionKey: `prov-action-${index}`,
        transformation: `normalize_and_summarize_${index}`,
        meetingOrTaskRef: `task_board_${index}`,
        recommendation: `recommendation_${index}`,
      },
    );
    if (outcome.record.state === 'completed') consequential.push(spec.workloadId);
    reconstructions.push(plane.lineage.reconstruct(spec.workloadId, { approvalMandatory: true }));
  }

  const complete = reconstructions.filter((entry) => entry.complete && entry.chainIntact).length;
  const orphans = reconstructions.filter((entry) => !entry.complete).length;
  const unknownModel = reconstructions.filter((entry) => entry.unknownModel).length;
  const unknownRuntime = reconstructions.filter((entry) => entry.unknownRuntime).length;
  const missingApproval = reconstructions.filter((entry) => !entry.approvalPresent).length;
  const fieldCoverage = reconstructions.length
    ? reconstructions.reduce((sum, entry) => sum + entry.fieldCoverage, 0) / reconstructions.length
    : 0;

  const thresholds: Threshold[] = [
    atLeast('lineage_fields_populated', 'Required lineage fields populated', fieldCoverage * 100, 100, { blocker: true }),
    zero('orphan_consequential_results', 'Orphan consequential results', orphans, { blocker: true }),
    zero('unknown_model', 'Unknown model for consequential result', unknownModel, { blocker: true }),
    zero('unknown_runtime', 'Unknown runtime for consequential result', unknownRuntime, { blocker: true }),
    zero('missing_approval', 'Missing approval record where approval is mandatory', missingApproval, { blocker: true }),
    atLeast(
      'reconstructable_chain',
      'Consequential results with an intact reconstructable chain',
      percent(complete, reconstructions.length),
      100,
      { blocker: true },
    ),
  ];

  const sample = reconstructions[0];

  return summarize('AC-15', 'Information Logistics & Provenance', thresholds, {
    consequentialResults: consequential.length,
    requiredStages: REQUIRED_LINEAGE_STAGES,
    sampleChain: sample?.chain.map((entry) => ({ stage: entry.stage, reference: entry.reference })) ?? [],
    lineageChainsRecorded: plane.lineage.workloadCount,
  });
}

export function runAuthorizationAcceptance(): AcceptanceResult[] {
  return [runAc04(), runAc14(), runAc15()];
}
