import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as ts from 'typescript';
import { generateAgentIdentityProfiles, XVI_CORE_VALUES } from './xvi-agent-identity-registry';
import { generateHumanCollaborationTeamDefinition, XVI_HUMAN_COLLABORATION_CONTRACT } from './xvi-human-collaboration-team';

test('six distinct collaboration roles reference exact existing registry identities', () => {
  const team = generateHumanCollaborationTeamDefinition();
  assert.equal(team.id, 'xvi-human-collaboration-team-v1');
  assert.equal(team.members.length, 6);
  assert.deepEqual(team.members.map(member => [member.agentId, member.role, member.outputContract.kind]), [
    ['xvi-agent-0001', 'CLARIFICATION', 'CLARIFICATION_PROPOSAL'],
    ['xvi-agent-0423', 'EVIDENCE_REVIEW', 'EVIDENCE_REVIEW_PROPOSAL'],
    ['xvi-agent-0100', 'FEEDBACK_ANALYSIS', 'FEEDBACK_ANALYSIS_PROPOSAL'],
    ['xvi-agent-0742', 'REGRESSION_EVALUATION', 'REGRESSION_EVALUATION_PROPOSAL'],
    ['xvi-agent-0964', 'ACCESSIBILITY', 'ACCESSIBILITY_PROPOSAL'],
    ['xvi-agent-0553', 'INDEPENDENT_SAFETY_REVIEW', 'SAFETY_REVIEW_PROPOSAL'],
  ]);
  assert.equal(new Set(team.members.map(member => member.agentId)).size, 6);
  const profiles = generateAgentIdentityProfiles();
  assert.equal(profiles.length, 1000);
  for (const member of team.members) {
    assert.deepEqual(member.profile, profiles.find(profile => profile.id === member.agentId));
    assert.equal(member.profile.capabilities[0].action, 'PROPOSE_REVIEW_ARTIFACT');
  }
  assert.deepEqual(team.members.map(member => member.profile.specialty), [
    'PRODUCT/REQUIREMENTS/ANALYST', 'AI_EVALUATION/EVIDENCE/REVIEW_PREPARER',
    'PRODUCT/CHANGE_IMPACT/FEEDBACK_ORGANIZER', 'QUALITY/RECOVERY/TEST_DESIGNER',
    'ACCESSIBILITY/LOCALIZATION/EXPLAINER', 'SECURITY/PRIVACY/REVIEW_PREPARER',
  ]);
});

test('all members share the collaboration contract and unchanged core policy', () => {
  const before = generateAgentIdentityProfiles();
  const team = generateHumanCollaborationTeamDefinition();
  assert.strictEqual(team.coreValues, XVI_CORE_VALUES);
  assert.equal(team.coreValuesVersion, 'xvi-core-values-v1');
  assert.strictEqual(team.collaborationContract, XVI_HUMAN_COLLABORATION_CONTRACT);
  for (const member of team.members) {
    assert.equal(member.profile.coreValuesVersion, team.coreValuesVersion);
    assert.strictEqual(member.collaborationContract, team.collaborationContract);
  }
  assert.deepEqual(generateAgentIdentityProfiles(), before);
});

test('team and every member are deeply frozen, disabled, and permissionless', () => {
  const team = generateHumanCollaborationTeamDefinition();
  const checkFrozen = (value: unknown): void => {
    if (value !== null && typeof value === 'object') {
      assert.ok(Object.isFrozen(value));
      for (const child of Object.values(value)) checkFrozen(child);
    }
  };
  checkFrozen(team);
  for (const record of [team, ...team.members]) {
    assert.equal(record.lifecycleState, 'DISABLED');
    assert.equal(record.enabled, false);
    assert.deepEqual(record.toolPermissions, []);
    assert.equal(Reflect.set(record, 'enabled', true), false);
    assert.equal(Reflect.set(record.toolPermissions, '0', 'shell'), false);
    assert.equal(Reflect.set(record, 'activate', () => true), false);
    const prototype = Object.getPrototypeOf(record);
    assert.throws(() => Reflect.set(record, '__proto__', { enabled: true }), TypeError);
    assert.strictEqual(Object.getPrototypeOf(record), prototype);
    assert.equal(record.enabled, false);
  }
  assert.equal(Reflect.deleteProperty(team.members, '0'), false);
  assert.equal(Reflect.set(team.coreValues, 'version', 'bypass'), false);
  assert.equal(Reflect.set(team.collaborationContract.askHumansFor, '0', 'SKIP_APPROVAL'), false);
});

test('human interaction requires goals, constraints, corrections, approval, and concise evidence', () => {
  const contract = generateHumanCollaborationTeamDefinition().collaborationContract;
  assert.equal(contract.version, 'xvi-human-collaboration-v1');
  assert.equal(contract.status, 'DECLARED_REQUIREMENTS_ONLY');
  assert.deepEqual(contract.askHumansFor, ['GOALS', 'CONSTRAINTS', 'CORRECTIONS', 'APPROVAL']);
  assert.equal(contract.explanation.format, 'CONCISE_EVIDENCE_SUMMARY');
  assert.deepEqual(contract.explanation.includes, ['EVIDENCE', 'ASSUMPTIONS', 'UNCERTAINTY', 'PROPOSED_ACTIONS']);
  assert.equal(contract.explanation.hiddenChainOfThoughtDisclosure, false);
});

test('feedback and retrieval remain unavailable with explicit future consent and isolation requirements', () => {
  const contract = generateHumanCollaborationTeamDefinition().collaborationContract;
  assert.equal(contract.feedback.admission, 'UNAVAILABLE_DENY_ALL');
  assert.equal(contract.feedback.storage, 'UNAVAILABLE');
  assert.equal(contract.feedback.futureRecordKind, 'VERSIONED_PROPOSAL');
  assert.deepEqual(contract.feedback.requirements, ['TENANT_ISOLATION', 'VERSION', 'PROVENANCE', 'INFORMED_CONSENT', 'INDEPENDENT_HUMAN_REVIEW']);
  assert.equal(contract.retrieval.admission, 'UNAVAILABLE_DENY_ALL');
  assert.equal(contract.retrieval.futureAuthorization, 'AUTHORIZED_DOCUMENTS_ONLY');
  assert.strictEqual(contract.retrieval.requirements, XVI_CORE_VALUES.documentRequirements);
  assert.deepEqual(contract.retrieval.rejectedDocumentClasses, ['SECRETS', 'PERSONAL_DATA', 'CROSS_TENANT', 'UNLICENSED', 'PROMPT_INJECTION', 'UNAPPROVED']);
});

test('learning means evaluated proposals and cannot change values, permissions, agents, or models', () => {
  const contract = generateHumanCollaborationTeamDefinition().collaborationContract;
  assert.equal(contract.improvement.mode, 'EVALUATED_VERSIONED_PROPOSALS_ONLY');
  assert.deepEqual(contract.improvement.targets, ['PROMPT', 'NON_CORE_POLICY', 'RETRIEVAL', 'WORKFLOW']);
  assert.equal(contract.improvement.review, 'INDEPENDENT_HUMAN_REVIEW_REQUIRED');
  assert.equal(contract.improvement.application, 'UNAVAILABLE');
  for (const forbidden of ['SILENT_MODEL_TRAINING', 'SELF_MODIFYING_CODE', 'CORE_VALUE_CHANGES', 'PERMISSION_GRANTS', 'RECURSIVE_AGENT_CREATION', 'SELF_AUTHORIZATION', 'SELF_APPROVAL', 'CONSEQUENTIAL_ACTION_EXECUTION']) {
    assert.ok((contract.forbiddenActions as readonly string[]).includes(forbidden), forbidden);
  }
  for (const forbidden of XVI_CORE_VALUES.forbiddenActions) assert.ok(contract.forbiddenActions.includes(forbidden));
});

test('human controls and separate authorization gates are prerequisites, not implemented services', () => {
  const contract = generateHumanCollaborationTeamDefinition().collaborationContract;
  assert.deepEqual(contract.humanControls.required, ['PAUSE', 'KILL', 'REVOKE', 'CORRECT', 'EXPORT', 'DELETE']);
  assert.equal(contract.humanControls.status, 'REQUIRED_BEFORE_FUTURE_RUNTIME_OR_STORAGE');
  assert.equal(contract.humanControls.implementation, 'UNAVAILABLE_IN_METADATA_DEFINITION');
  assert.deepEqual(contract.separateAuthorizationGates, ['ACTIVATION', 'ONLINE_ACCESS', 'DURABLE_MEMORY', 'MODEL_TRAINING']);
});

test('every role including safety review produces only a proposed-output contract without authority', () => {
  const team = generateHumanCollaborationTeamDefinition();
  for (const member of team.members) {
    assert.deepEqual(Object.keys(member.outputContract).sort(), ['application', 'disposition', 'kind', 'review', 'selfApproval']);
    assert.equal(member.outputContract.disposition, 'PROPOSAL_ONLY');
    assert.equal(member.outputContract.application, 'UNAVAILABLE');
    assert.equal(member.outputContract.review, 'INDEPENDENT_HUMAN_REVIEW_REQUIRED');
    assert.equal(member.outputContract.selfApproval, false);
    assert.equal(Reflect.set(member.outputContract, 'selfApproval', true), false);
  }
  assert.equal(team.definitionKind, 'UNBOUND_TEAM_METADATA');
  assert.equal(team.competency, 'UNVERIFIED_DESIGN_ASSIGNMENT');
  assert.equal(team.authority, 'NONE');
  for (const field of ['execution', 'activation', 'taskAdmission'] as const) assert.equal(team[field], 'UNAVAILABLE');
  const checkDataOnly = (value: unknown): void => {
    assert.notEqual(typeof value, 'function');
    if (value !== null && typeof value === 'object') for (const child of Object.values(value)) checkDataOnly(child);
  };
  checkDataOnly(team);
});

test('generation is deterministic and independent of clock, randomness, and fetch', t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected network'); });
  t.mock.method(Date, 'now', () => { throw new Error('unexpected clock'); });
  t.mock.method(Math, 'random', () => { throw new Error('unexpected randomness'); });
  const first = generateHumanCollaborationTeamDefinition();
  assert.deepEqual(generateHumanCollaborationTeamDefinition(), first);
  assert.equal(first.mode, 'OFFLINE_ONLY');
  assert.equal(first.ci, 'CI_UNVERIFIED');
});

test('team definition imports only the registry and has no executor or environment access', () => {
  const source = readFileSync(new URL('./xvi-human-collaboration-team.ts', import.meta.url), 'utf8');
  const parsed = ts.createSourceFile('team.ts', source, ts.ScriptTarget.ES2022, true);
  const imports: string[] = [];
  const forbidden = new Set(['process', 'fetch', 'require', 'eval', 'Function', 'Worker', 'WebSocket', 'setTimeout', 'setInterval']);
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      assert.ok(ts.isStringLiteral(node.moduleSpecifier));
      imports.push(node.moduleSpecifier.text);
    }
    assert.ok(!ts.isImportEqualsDeclaration(node));
    if (ts.isCallExpression(node)) assert.notEqual(node.expression.kind, ts.SyntaxKind.ImportKeyword);
    if (ts.isIdentifier(node)) assert.ok(!forbidden.has(node.text), node.text);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.deepEqual(imports, ['./xvi-agent-identity-registry']);
});
