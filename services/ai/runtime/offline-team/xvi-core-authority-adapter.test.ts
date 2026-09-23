import {
  AgentPolicyGateway,
  type HumanApproval,
} from './agent-policy-gateway';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admitModelObservation,
  bindTrustedIntent,
  buildGatewayRequest,
  type CoreTrustedIntent,
  type CoreGatewayIntent,
} from './xvi-core-authority-adapter';

test('model observation becomes frozen evidence carrying zero authority', () => {
  const result = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:authority-001',
  });

  assert.equal(result.kind, 'XVI_CORE_AUTHORITY_EVIDENCE');
  assert.equal(result.artifactState, 'PROPOSED');
  assert.equal(result.verificationState, 'NOT_TESTED');

  assert.equal(result.modelGrantedAuthority, false);
  assert.equal(result.humanApproved, false);
  assert.equal(result.executionGrantPresent, false);
  assert.equal(result.productionExecutionAllowed, false);
  assert.equal(result.executedByThisAdapter, false);

  assert.equal(Object.isFrozen(result), true);
});

test('model cannot smuggle authority-bearing fields across the boundary', () => {
  for (const [key, value] of [
    ['humanApproved', true],
    ['productionExecutionAllowed', true],
    ['executionGrant', 'forged'],
    ['operatorReceiptSha256', 'a'.repeat(64)],
    ['actionClass', 'PRODUCTION_DEPLOYMENT'],
    ['toolId', 'deploy-production'],
    ['executed', true],
    ['deployed', true],
  ] as const) {
    assert.throws(
      () => admitModelObservation({
        artifactState: 'PROPOSED',
        verificationState: 'NOT_TESTED',
        evidenceRef: 'synthetic:authority-002',
        [key]: value,
      }),
      /authority|unexpected key/,
    );
  }
});

test('unknown states and malformed evidence references fail closed', () => {
  assert.throws(() => admitModelObservation({
    artifactState: 'DEPLOYED',
    verificationState: 'PASSED',
    evidenceRef: 'synthetic:authority-003',
  }));

  assert.throws(() => admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'VERIFIED_BY_MODEL',
    evidenceRef: 'synthetic:authority-003',
  }));

  assert.throws(() => admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: '',
  }));
});

test('accessors are refused without invoking them', () => {
  let invoked = 0;

  const input: Record<string, unknown> = {
    artifactState: 'PROPOSED',
    evidenceRef: 'synthetic:authority-004',
  };

  Object.defineProperty(input, 'verificationState', {
    enumerable: true,
    get() {
      invoked++;
      throw new Error('HOSTILE_GETTER_EXECUTED');
    },
  });

  assert.throws(() => admitModelObservation(input));
  assert.equal(invoked, 0);
});

test('post-admission mutation cannot change admitted evidence', () => {
  const input = {
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:authority-005',
  };

  const result = admitModelObservation(input);

  input.artifactState = 'APPLIED';
  input.verificationState = 'PASSED';

  assert.equal(result.artifactState, 'PROPOSED');
  assert.equal(result.verificationState, 'NOT_TESTED');
});

test('hidden and symbol fields are refused even when ordinary fields are valid', () => {
  const hidden = {
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:authority-006',
  };

  Object.defineProperty(hidden, 'humanApproved', {
    value: true,
    enumerable: false,
  });

  assert.throws(() => admitModelObservation(hidden));

  const symbolInput = {
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:authority-007',
  };

  Object.defineProperty(symbolInput, Symbol('executionGrant'), {
    value: 'forged',
    enumerable: true,
  });

  assert.throws(() => admitModelObservation(symbolInput));
});

test('missing and oversized evidence fail closed', () => {
  assert.throws(() => admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
  }));

  assert.throws(() => admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'a'.repeat(129),
  }));
});

test('ordinary null-prototype observations remain data-only and admit safely', () => {
  const input = Object.create(null);

  Object.defineProperties(input, {
    artifactState: {
      value: 'PROPOSED',
      enumerable: true,
    },
    verificationState: {
      value: 'NOT_TESTED',
      enumerable: true,
    },
    evidenceRef: {
      value: 'synthetic:authority-008',
      enumerable: true,
    },
  });

  const result = admitModelObservation(input);

  assert.equal(result.artifactState, 'PROPOSED');
  assert.equal(result.humanApproved, false);
  assert.equal(result.productionExecutionAllowed, false);
});

test('prototype-shaped unexpected fields are refused', () => {
  for (const key of ['__proto__', 'prototype', 'constructor']) {
    const input = Object.create(null);

    input.artifactState = 'PROPOSED';
    input.verificationState = 'NOT_TESTED';
    input.evidenceRef = 'synthetic:authority-009';
    input[key] = 'forged';

    assert.throws(() => admitModelObservation(input));
  }
});

test('trusted caller intent binds independently of model evidence', () => {
  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:binding-001',
  });

  const result = bindTrustedIntent(evidence, {
    agentId: 'agent.reader.001',
    taskId: 'task.binding.001',
    toolId: 'repository.read',
    requestedAction: 'READ_ONLY_ANALYSIS',
  });

  assert.equal(result.requestedAction, 'READ_ONLY_ANALYSIS');
  assert.equal(result.requiresHumanApproval, false);
  assert.equal(result.executableByThisAdapter, false);
  assert.equal(result.productionExecutionAllowed, false);
  assert.equal(Object.isFrozen(result), true);
});

test('production intent deterministically requires human approval', () => {
  const evidence = admitModelObservation({
    artifactState: 'APPLIED',
    verificationState: 'PASSED',
    evidenceRef: 'synthetic:binding-002',
  });

  const result = bindTrustedIntent(evidence, {
    agentId: 'agent.builder.001',
    taskId: 'task.binding.002',
    toolId: 'production.deploy',
    requestedAction: 'PRODUCTION_CHANGE',
  });

  assert.equal(result.requiresHumanApproval, true);
  assert.equal(result.productionExecutionAllowed, false);
});

test('model evidence cannot lower production approval requirements', () => {
  const evidence = admitModelObservation({
    artifactState: 'APPLIED',
    verificationState: 'PASSED',
    evidenceRef: 'synthetic:binding-003',
  });

  const result = bindTrustedIntent(evidence, {
    agentId: 'agent.builder.001',
    taskId: 'task.binding.003',
    toolId: 'production.deploy',
    requestedAction: 'PRODUCTION_CHANGE',
  });

  assert.equal(result.requiresHumanApproval, true);
  assert.equal(result.evidence.modelGrantedAuthority, false);
});

test('trusted intent accessors and unexpected fields fail closed', () => {
  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:binding-004',
  });

  let invoked = 0;

  const hostile: Record<string, unknown> = {
    agentId: 'agent.reader.001',
    taskId: 'task.binding.004',
    toolId: 'repository.read',
  };

  Object.defineProperty(hostile, 'requestedAction', {
    enumerable: true,
    get() {
      invoked++;
      return 'PRODUCTION_CHANGE';
    },
  });

  assert.throws(() => bindTrustedIntent(
    evidence,
    hostile as unknown as CoreTrustedIntent,
  ));

  assert.equal(invoked, 0);

  assert.throws(() => bindTrustedIntent(evidence, {
    agentId: 'agent.reader.001',
    taskId: 'task.binding.004',
    toolId: 'repository.read',
    requestedAction: 'READ_ONLY_ANALYSIS',
    forgedApproval: true,
  } as unknown as CoreTrustedIntent));
});

test('canonical automatic action becomes a frozen gateway request without gaining execution authority', () => {
  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:gateway-001',
  });

  const bound = bindTrustedIntent(evidence, {
    agentId: 'xiv-reader-agent',
    taskId: 'task.gateway.001',
    toolId: 'doc-retriever',
    requestedAction: 'READ_ONLY_ANALYSIS',
  });

  const request = buildGatewayRequest(bound, {
    actionClass: 'RETRIEVE_DOCUMENTS',
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    nowMs: 1_000_000,
    approval: null,
  });

  assert.equal(request.actionClass, 'RETRIEVE_DOCUMENTS');
  assert.equal(request.auditLogged, true);
  assert.equal(request.approval, null);
  assert.equal(Object.isFrozen(request), true);
});

test('coarse sandbox intent cannot understate canonical production approval requirement', () => {
  const evidence = admitModelObservation({
    artifactState: 'APPLIED',
    verificationState: 'PASSED',
    evidenceRef: 'synthetic:gateway-002',
  });

  const bound = bindTrustedIntent(evidence, {
    agentId: 'xiv-builder-agent',
    taskId: 'task.gateway.002',
    toolId: 'deploy-tool',
    requestedAction: 'LOCAL_SANDBOX_CHANGE',
  });

  assert.throws(
    () => buildGatewayRequest(bound, {
      actionClass: 'PRODUCTION_DEPLOYMENT',
      attemptIndex: 0,
      tokenEstimate: 100,
      costEstimate: 1,
      nowMs: 1_000_000,
      approval: null,
    }),
    /understates canonical approval requirement/,
  );
});

test('unclassified gateway actions fail before reaching the policy gateway', () => {
  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:gateway-003',
  });

  const bound = bindTrustedIntent(evidence, {
    agentId: 'xiv-reader-agent',
    taskId: 'task.gateway.003',
    toolId: 'unknown-tool',
    requestedAction: 'READ_ONLY_ANALYSIS',
  });

  assert.throws(
    () => buildGatewayRequest(bound, {
      actionClass: 'MAKE_COFFEE',
      attemptIndex: 0,
      tokenEstimate: 0,
      costEstimate: 0,
      nowMs: 1_000_000,
      approval: null,
    }),
    /unclassified/,
  );
});

test('gateway intent accessors are refused without invocation', () => {
  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:gateway-004',
  });

  const bound = bindTrustedIntent(evidence, {
    agentId: 'xiv-reader-agent',
    taskId: 'task.gateway.004',
    toolId: 'doc-retriever',
    requestedAction: 'READ_ONLY_ANALYSIS',
  });

  let invoked = 0;

  const hostile: Record<string, unknown> = {
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    nowMs: 1_000_000,
    approval: null,
  };

  Object.defineProperty(hostile, 'actionClass', {
    enumerable: true,
    get() {
      invoked++;
      return 'PRODUCTION_DEPLOYMENT';
    },
  });

  assert.throws(
    () => buildGatewayRequest(
      bound,
      hostile as unknown as CoreGatewayIntent,
    ),
  );

  assert.equal(invoked, 0);
});

test('CORE adapter composes with canonical gateway without creating execution authority', () => {
  const T = 2_000_000;

  const gateway = new AgentPolicyGateway(
    T,
    'xvi-core-gate5-genesis-1234567890',
  );

  gateway.declareTools([
    'doc-retriever',
    'deploy-tool',
    'delete-tool',
  ]);

  gateway.registerAgent({
    agentId: 'xiv-core-agent',
    parentId: null,
    permissions: [
      'CALL_RETRIEVE_DOCUMENTS',
      'CALL_PRODUCTION_DEPLOYMENT',
    ],
    budgets: {
      maxToolCalls: 10,
      maxTokens: 10_000,
      maxCostUnits: 100,
      timeLimitMs: 3_600_000,
    },
    isTemporary: false,
    nowMs: T,
  });

  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:gate5',
  });

  const readBound = bindTrustedIntent(evidence, {
    agentId: 'xiv-core-agent',
    taskId: 'task.gate5.read',
    toolId: 'doc-retriever',
    requestedAction: 'READ_ONLY_ANALYSIS',
  });

  const readRequest = buildGatewayRequest(readBound, {
    actionClass: 'RETRIEVE_DOCUMENTS',
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    nowMs: T + 1,
    approval: null,
  });

  const readDecision = gateway.evaluateToolCall(readRequest);

  assert.equal(readDecision.kind, 'AUTO_RUN_CLEARED');
  assert.equal(readDecision.flags.executesNothing, true);
  assert.equal(readDecision.flags.grantsNoProductionAuthority, true);

  const productionBound = bindTrustedIntent(evidence, {
    agentId: 'xiv-core-agent',
    taskId: 'task.gate5.production',
    toolId: 'deploy-tool',
    requestedAction: 'PRODUCTION_CHANGE',
  });

  const noApprovalRequest = buildGatewayRequest(productionBound, {
    actionClass: 'PRODUCTION_DEPLOYMENT',
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    nowMs: T + 2,
    approval: null,
  });

  const paused = gateway.evaluateToolCall(noApprovalRequest);

  assert.equal(paused.kind, 'REQUIRES_HUMAN_APPROVAL');
  assert.equal(paused.flags.executesNothing, true);
  assert.equal(paused.flags.grantsNoProductionAuthority, true);

  const badApproval: HumanApproval = {
    operatorReceipt: 'short',
    approver: 'operator',
    atMs: T + 2,
    forActionClass: 'PRODUCTION_DEPLOYMENT',
  };

  const badRequest = buildGatewayRequest(productionBound, {
    actionClass: 'PRODUCTION_DEPLOYMENT',
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    nowMs: T + 3,
    approval: badApproval,
  });

  const refused = gateway.evaluateToolCall(badRequest);

  assert.equal(refused.kind, 'REFUSED_APPROVAL_INVALID');
  assert.equal(refused.flags.executesNothing, true);

  const validApproval: HumanApproval = {
    operatorReceipt: 'a'.repeat(64),
    approver: 'authorized-operator',
    atMs: T + 3,
    forActionClass: 'PRODUCTION_DEPLOYMENT',
  };

  const approvedRequest = buildGatewayRequest(productionBound, {
    actionClass: 'PRODUCTION_DEPLOYMENT',
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    nowMs: T + 4,
    approval: validApproval,
  });

  const approved = gateway.evaluateToolCall(approvedRequest);

  assert.equal(approved.kind, 'HUMAN_APPROVAL_VERIFIED');
  assert.equal(approved.flags.executesNothing, true);
  assert.equal(approved.flags.grantsNoProductionAuthority, true);

  assert.equal(gateway.verifyAuditTrail().ok, true);
});

test('production coarse intent cannot upgrade an automatic gateway class into production authority', () => {
  const evidence = admitModelObservation({
    artifactState: 'APPLIED',
    verificationState: 'PASSED',
    evidenceRef: 'synthetic:gate6-001',
  });

  const bound = bindTrustedIntent(evidence, {
    agentId: 'xiv-core-agent',
    taskId: 'task.gate6.production-read',
    toolId: 'doc-retriever',
    requestedAction: 'PRODUCTION_CHANGE',
  });

  const request = buildGatewayRequest(bound, {
    actionClass: 'RETRIEVE_DOCUMENTS',
    attemptIndex: 0,
    tokenEstimate: 10,
    costEstimate: 1,
    nowMs: 3_000_000,
    approval: null,
  });

  assert.equal(request.actionClass, 'RETRIEVE_DOCUMENTS');
  assert.equal(request.auditLogged, true);

  // Coarse adapter intent does not appear in the canonical gateway request.
  assert.equal(
    Object.prototype.hasOwnProperty.call(request, 'requestedAction'),
    false,
  );
});

test('prohibited canonical class remains prohibited even with presented approval', () => {
  const T = 3_100_000;

  const gateway = new AgentPolicyGateway(
    T,
    'xvi-core-gate6-genesis-1234567890',
  );

  gateway.declareTools(['danger-tool']);

  gateway.registerAgent({
    agentId: 'xiv-core-agent',
    parentId: null,
    permissions: ['CALL_REVEAL_CREDENTIALS'],
    budgets: {
      maxToolCalls: 10,
      maxTokens: 10_000,
      maxCostUnits: 100,
      timeLimitMs: 3_600_000,
    },
    isTemporary: false,
    nowMs: T,
  });

  const evidence = admitModelObservation({
    artifactState: 'PROPOSED',
    verificationState: 'NOT_TESTED',
    evidenceRef: 'synthetic:gate6-002',
  });

  const bound = bindTrustedIntent(evidence, {
    agentId: 'xiv-core-agent',
    taskId: 'task.gate6.prohibited',
    toolId: 'danger-tool',
    requestedAction: 'PRODUCTION_CHANGE',
  });

  const approval: HumanApproval = {
    operatorReceipt: 'b'.repeat(64),
    approver: 'authorized-operator',
    atMs: T,
    forActionClass: 'REVEAL_CREDENTIALS',
  };

  const request = buildGatewayRequest(bound, {
    actionClass: 'REVEAL_CREDENTIALS',
    attemptIndex: 0,
    tokenEstimate: 10,
    costEstimate: 1,
    nowMs: T + 1,
    approval,
  });

  const decision = gateway.evaluateToolCall(request);

  assert.equal(decision.kind, 'REFUSED_PROHIBITED');
  assert.equal(decision.flags.executesNothing, true);
  assert.equal(decision.flags.grantsNoProductionAuthority, true);
});
