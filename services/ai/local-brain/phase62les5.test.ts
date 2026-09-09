/**
 * 62L-ES5 — Prototype Architecture Composer denial + honesty tests.
 *
 * Script: npm run test:62les5
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY,
  ARCHITECTURE_CORE_FLOW,
  ARCHITECTURE_FIELDS,
  ARCHITECTURE_VIEWS,
  COMPUTE_HONESTY_STATUSES,
  ES5_AGENT_BOUNDS,
  ES5_DB_CANDIDATES_STATUS,
  ES5_LOCKS,
  ES5_MAY,
  ES5_MUST_NOT,
  ES_LAYER_TITLE,
  EXISTING_SERVICE_CONTRACTS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE,
  USER_FLOW_STEPS,
  AGENT_FLOW_STEPS,
  DATA_FLOW_STEPS,
  COMPUTE_FLOW_STEPS,
  SECURITY_FLOW_STEPS,
  EVIDENCE_FLOW_STEPS,
  assertEs5LocksIntact,
  es5SoftWireSnapshot,
  mayBypassExistingContracts,
  mayClaimPhysicalQpuVerified,
  passesComplexityGate,
  type Es5Actor,
} from './prototype-architecture-composer-types.ts';

import {
  applyComplexityGate,
  attemptAutoProvisionCloud,
  attemptBypassExistingContracts,
  attemptCrossTenantPooling,
  attemptDishonestPhysicalQpu,
  attemptKeepUnnecessaryComponent,
  attemptNewPermissionInheritance,
  attemptProductionDbTouch,
  attemptRecommendAsAct,
  attemptSecretsInSource,
  bootstrapPrototypeArchitectureComposer,
  candidateComponentsForScope,
  composePrototypeArchitecture,
  exampleApprovedScope,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  runPrototypeArchitectureComposerCycle,
} from './prototype-architecture-composer-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es5Actor = {
  kind: 'architecture_composer',
  id: 'pac-1',
  orgId: 'org-es5',
  tenantId: 'ten-es5',
  universeId: 'uni-es5',
  permissions: ['draft'],
};

const human: Es5Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es5',
  tenantId: 'ten-es5',
  universeId: 'uni-es5',
  permissions: ['approve_consequential'],
};

test('SoT label ES5; Prototype Architecture Composer; next ES6 acceptance/evidence', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES5');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Prototype Architecture Composer/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES6/);
  assert.match(NEXT_PHASE_TITLE, /Acceptance Criteria/);
  assert.match(ES_LAYER_TITLE, /Productization Factory/);
});

test('honesty locks: L4 false; security locks; DB NOT_APPLIED; tip-land false', () => {
  assert.equal(assertEs5LocksIntact(), true);
  assert.equal(ES5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES5_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES5_LOCKS.BYPASS_EXISTING_CONTRACTS, false);
  assert.equal(ES5_LOCKS.KEEP_UNNECESSARY_COMPONENT, false);
  assert.equal(ES5_LOCKS.PHYSICAL_QPU_WITHOUT_VERIFICATION, false);
  assert.equal(ES5_LOCKS.CROSS_TENANT_POOLING, false);
  assert.equal(ES5_LOCKS.SECRETS_IN_SOURCE, false);
  assert.equal(ES5_LOCKS.PRODUCTION_DB_TOUCH, false);
  assert.equal(ES5_LOCKS.AUTO_PROVISION_CLOUD, false);
  assert.equal(ES5_LOCKS.TIP_LAND, false);
  assert.equal(ES5_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(mayBypassExistingContracts(), false);
  assert.equal(ES5_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.preferReuseOverNewService,
    true,
  );
});

test('fields + views + core flow + compute honesty + contracts encoded', () => {
  assert.equal(ARCHITECTURE_FIELDS.length, 19);
  assert.ok(ARCHITECTURE_FIELDS.includes('architectureId'));
  assert.ok(ARCHITECTURE_FIELDS.includes('rollbackPath'));
  assert.deepEqual([...ARCHITECTURE_CORE_FLOW], [
    'prototype_scope',
    'component_selection',
    'trust_boundaries',
    'data_flow',
    'compute_routing',
    'failure_paths',
    'verification_plan',
  ]);
  assert.equal(ARCHITECTURE_VIEWS.length, 6);
  assert.deepEqual([...USER_FLOW_STEPS], [
    'user',
    'xiv_ui',
    'agent',
    'decision_result',
  ]);
  assert.deepEqual([...AGENT_FLOW_STEPS], [
    'home_base',
    'bounded_agent_branch',
    'tool_model_compute',
    'evidence',
    'home_base_return',
  ]);
  assert.deepEqual([...DATA_FLOW_STEPS], [
    'source',
    'rights_check',
    'storage_index',
    'retrieval',
    'model_agent',
    'output',
  ]);
  assert.deepEqual([...COMPUTE_FLOW_STEPS], [
    'task_envelope',
    'scheduler',
    'verified_cpu_gpu_npu_etc',
    'receipt',
  ]);
  assert.deepEqual([...SECURITY_FLOW_STEPS], [
    'identity',
    'tenant',
    'universe',
    'data_class',
    'purpose',
    'allowed_action',
  ]);
  assert.deepEqual([...EVIDENCE_FLOW_STEPS], [
    'execution',
    'test_receipt',
    'benchmark_audit',
    'acceptance_decision',
  ]);
  assert.deepEqual([...COMPUTE_HONESTY_STATUSES], [
    'CLASSICAL',
    'QUANTUM_INSPIRED',
    'SIMULATED',
    'PHYSICAL_QPU_VERIFIED',
  ]);
  assert.deepEqual([...EXISTING_SERVICE_CONTRACTS], [
    'auth.ts',
    'policies.ts',
    'agent-router.ts',
    'model-router.ts',
    'audit.ts',
    'persistence.ts',
  ]);
  assert.ok(ES5_MAY.includes(
    'compose_smallest_safe_architecture_from_approved_prototype_scope',
  ));
  assert.ok(ES5_MUST_NOT.includes('bypass_or_replace_existing_xiv_ai_service_contracts'));
  assert.ok(
    PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE.includes('strip_unnecessary_components'),
  );
});

test('complexity gate strips unnecessary components (vanity analytics)', () => {
  const scope = exampleApprovedScope();
  const candidates = candidateComponentsForScope(scope);
  assert.ok(
    candidates.some((c) => c.componentId === 'vanity-analytics-service'),
  );
  const { kept, stripped } = applyComplexityGate({
    components: candidates,
    prototypeQuestion: scope.prototypeQuestion,
  });
  assert.ok(
    stripped.some((c) => c.componentId === 'vanity-analytics-service'),
  );
  assert.ok(!kept.some((c) => c.componentId === 'vanity-analytics-service'));
  assert.equal(
    passesComplexityGate({
      necessityForPrototypeQuestion: '',
      prototypeQuestion: scope.prototypeQuestion,
    }),
    false,
  );
  assert.equal(attemptKeepUnnecessaryComponent().state, 'DENIED');

  const arch = composePrototypeArchitecture({ actor: agent, scope });
  assert.equal('denied' in arch, false);
  if (!('denied' in arch)) {
    assert.ok(
      arch.strippedUnnecessaryComponentIds.includes('vanity-analytics-service'),
    );
    assert.equal(arch.views.length, 6);
    assert.equal(arch.l4AutonomyEnabled, false);
  }
});

test('bypass of existing contracts denied; reuse preferred', () => {
  assert.equal(attemptBypassExistingContracts().state, 'DENIED');
  const arch = composePrototypeArchitecture({
    actor: agent,
    scope: exampleApprovedScope(),
  });
  assert.equal('denied' in arch, false);
  if (!('denied' in arch)) {
    assert.ok(arch.reusedContracts.includes('agent-router.ts'));
    assert.ok(arch.reusedContracts.includes('model-router.ts'));
    assert.ok(arch.reusedContracts.includes('auth.ts'));
    assert.ok(arch.reusedContracts.includes('audit.ts'));
    assert.ok(
      arch.guardianPolicyChecks.includes('policies.ts') ||
        arch.guardianPolicyChecks.includes('guardian_rls'),
    );
  }
});

test('compute status honesty: PHYSICAL_QPU_VERIFIED without evidence DENIED', () => {
  assert.equal(
    mayClaimPhysicalQpuVerified({
      honestyStatus: 'PHYSICAL_QPU_VERIFIED',
      hasPhysicalVerificationEvidence: false,
    }),
    false,
  );
  assert.equal(
    mayClaimPhysicalQpuVerified({
      honestyStatus: 'CLASSICAL',
      hasPhysicalVerificationEvidence: false,
    }),
    true,
  );
  assert.equal(attemptDishonestPhysicalQpu().state, 'DENIED');

  const classical = composePrototypeArchitecture({
    actor: agent,
    scope: exampleApprovedScope(),
    computeRequirements: [
      {
        path: 'CPU',
        honestyStatus: 'CLASSICAL',
        fallbackBehavior: 'retry_local_cpu_then_degrade_gracefully',
        verified: true,
      },
    ],
  });
  assert.equal('denied' in classical, false);
  if (!('denied' in classical)) {
    assert.equal(
      classical.cpuGpuNpuQpuRequirements[0]?.honestyStatus,
      'CLASSICAL',
    );
    assert.ok(classical.failureFallbackPaths[0]?.includes('cpu'));
  }

  const verifiedQpu = composePrototypeArchitecture({
    actor: agent,
    scope: exampleApprovedScope(),
    computeRequirements: [
      {
        path: 'QPU',
        honestyStatus: 'PHYSICAL_QPU_VERIFIED',
        fallbackBehavior: 'fallback_to_CLASSICAL_CPU_on_qpu_unavailable',
        verified: true,
      },
    ],
  });
  assert.equal('denied' in verifiedQpu, false);
});

test('security locks: pooling/secrets/prod DB/cloud/inheritance denied; L4 false', () => {
  assert.equal(attemptCrossTenantPooling().state, 'DENIED');
  assert.equal(attemptSecretsInSource().state, 'DENIED');
  assert.equal(attemptProductionDbTouch().state, 'DENIED');
  assert.equal(attemptAutoProvisionCloud().state, 'DENIED');
  assert.equal(attemptNewPermissionInheritance().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(ES5_LOCKS.L4_AUTONOMY_ENABLED, false);

  const isolationOk = probeGuardianRlsTenantUniverseIsolation({
    actorTenantId: 'ten-es5',
    actorUniverseId: 'uni-es5',
    resourceTenantId: 'ten-es5',
    resourceUniverseId: 'uni-es5',
  });
  assert.equal(isolationOk.isolated, true);
  const isolationBad = probeGuardianRlsTenantUniverseIsolation({
    actorTenantId: 'ten-es5',
    actorUniverseId: 'uni-es5',
    resourceTenantId: 'ten-other',
    resourceUniverseId: 'uni-es5',
  });
  assert.equal(isolationBad.isolated, false);
  assert.equal(isolationBad.state, 'DENIED');

  const humanGate = requireHumanApproval(human);
  assert.equal(humanGate.approved, true);
  const agentGate = requireHumanApproval(agent);
  assert.equal(agentGate.state, 'HUMAN_APPROVAL_REQUIRED');
});

test('soft-wire ES4/ES3/ES2/ES1/ER34/ER35 absent→WAITING_DATA; contracts PRESENT; cycle PASS', () => {
  const boot = bootstrapPrototypeArchitectureComposer(agent);
  assert.equal(boot.ok, true);
  assert.equal(boot.locksIntact, true);

  const soft = es5SoftWireSnapshot(repoRoot);
  // Prior ES tips may be absent on this park branch — WAITING_DATA not FAIL.
  assert.equal(typeof soft.es4PrototypeScopeGenerator.present, 'boolean');
  assert.equal(typeof soft.es3OpportunityScoringEngine.present, 'boolean');
  assert.equal(typeof soft.es1ResearchToProductCandidateGate.present, 'boolean');
  assert.equal(typeof soft.er34CapabilityManifest.present, 'boolean');
  assert.equal(typeof soft.er35ModelDataPackManifest.present, 'boolean');

  // Existing services/ai contracts should be present on this tip.
  assert.equal(soft.authContract.present, true);
  assert.equal(soft.policiesContract.present, true);
  assert.equal(soft.agentRouterContract.present, true);
  assert.equal(soft.modelRouterContract.present, true);
  assert.equal(soft.auditContract.present, true);
  assert.equal(soft.persistenceContract.present, true);

  const cycle = runPrototypeArchitectureComposerCycle({
    actor: agent,
    repoRoot,
  });
  assert.equal(cycle.locksIntact, true);
  assert.ok(cycle.architecture);
  assert.equal(
    cycle.hops.length,
    PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE.length,
  );

  const softHops = cycle.hops.filter((h) => h.hop.endsWith('_soft_wire'));
  for (const h of softHops) {
    assert.ok(
      h.state === 'PASS' || h.state === 'WAITING_DATA',
      `${h.hop} must be PASS or WAITING_DATA, got ${h.state}`,
    );
    assert.notEqual(h.state, 'FAIL');
  }

  const l4 = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.equal(l4?.state, 'PASS');

  if (cycle.architecture) {
    const evidence = returnEvidenceToHomeBase(cycle.architecture);
    assert.equal(evidence.returned, true);
    assert.ok(evidence.evidenceRefs.some((r) => r.startsWith('stripped:')));
  }
});
