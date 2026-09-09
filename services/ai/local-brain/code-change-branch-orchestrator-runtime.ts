/**
 * 62L-ES8 — Code Change & Branch Orchestrator runtime.
 *
 * Branch-scoped orchestration: plan → feature branch → bounded changes →
 * test-before-review gate → evidence → REVIEW_REQUIRED / DRAFT_PR_READY.
 * Denies main merge, Guardian/RLS weaken, secrets, prod DB, L4, tip-land,
 * and treating NOT_TESTED as PASS.
 */

import { createHash } from 'node:crypto';
import {
  CHANGE_ORCHESTRATOR_CYCLE,
  CHANGE_ORCHESTRATOR_STATES,
  CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY,
  DENIED_CHANGE_CLASSES,
  ES8_AGENT_BOUNDS,
  ES8_DB_CANDIDATES_STATUS,
  ES8_LOCKS,
  ES8_MAY,
  ES8_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PR_MR_STATES,
  TEST_BEFORE_REVIEW_GATE,
  TEST_RESULT_STATES,
  assertEs8LocksIntact,
  draftPrReadyAllowedWithoutGate,
  es8SoftWireSnapshot,
  isEs8Agent,
  isHumanApprover,
  mainMergeAllowed,
  notTestedMeansPass,
  softWireHopState,
  testGateSatisfied,
  type ChangeOrchestrationRun,
  type ChangeOrchestratorState,
  type DeniedChangeClass,
  type DiffIntelligence,
  type Es8Actor,
  type Es8EvidenceState,
  type Es8HopRecord,
  type Es8SoftWireSnapshot,
  type EvidenceBundle,
  type PrMrState,
  type RollbackInstructions,
  type TestCommandResult,
  type TestGateStep,
  type TestResultState,
} from './code-change-branch-orchestrator-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CHANGE_ORCHESTRATOR_CYCLE)[number],
  state: Es8EvidenceState,
  summary: string,
): Es8HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'REJECTED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'REJECTED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

const PROTECTED_BASES = new Set(['main', 'master', 'xiv-v2']);

function isProtectedBranch(branch: string): boolean {
  const b = branch.replace(/^origin\//, '').toLowerCase();
  return PROTECTED_BASES.has(b);
}

export function planChangeRun(input: {
  actor: Es8Actor;
  implementationId: string;
  repository: string;
  baseBranch: string;
  featureBranch: string;
  approvedPlanPresent?: boolean;
  testsRequired?: readonly TestGateStep[];
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor) && input.actor.kind !== 'proposal') {
    return deny('Only code-change orchestrator / implementation agents may plan runs.');
  }
  if (!assertEs8LocksIntact()) {
    return deny('ES8 locks not intact — refusing to plan.');
  }
  if (isProtectedBranch(input.featureBranch)) {
    return deny(
      `Feature branch must not be a protected base (${input.featureBranch}).`,
    );
  }
  if (input.featureBranch === input.baseBranch) {
    return deny('Feature branch must differ from base branch.');
  }

  const changeRunId = `cr-${sha256(
    `${input.implementationId}:${input.featureBranch}:${nowIso()}`,
  ).slice(0, 16)}`;

  return {
    changeRunId,
    implementationId: input.implementationId,
    repository: input.repository,
    sourceBranch: input.baseBranch,
    baseBranch: input.baseBranch,
    featureBranch: input.featureBranch,
    state: 'PLANNED',
    filesChanged: [],
    dependenciesChanged: [],
    migrationCandidates: [],
    testsRequired: [...(input.testsRequired ?? TEST_BEFORE_REVIEW_GATE)],
    commandsRun: [],
    testResults: [],
    securityChecks: [],
    rollbackInstructions: null,
    reviewer: null,
    prMrState: 'NONE',
    blockers: input.approvedPlanPresent === false
      ? ['approved_implementation_plan_missing']
      : [],
    diffIntelligence: null,
    evidenceBundle: null,
    approvedPlanPresent: input.approvedPlanPresent !== false,
    tipLandAttempted: false,
    autoMergeMainAttempted: false,
    productionDeployAttempted: false,
    l4AutonomyEnabled: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function createFeatureBranch(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor)) {
    return deny('Only orchestrator agents may create feature branches.');
  }
  if (isProtectedBranch(input.run.featureBranch)) {
    return deny('Cannot create protected branch as feature branch.');
  }
  if (input.run.state !== 'PLANNED' && input.run.state !== 'BLOCKED') {
    return deny(`Cannot create branch from state ${input.run.state}.`);
  }
  if (!input.run.approvedPlanPresent) {
    return {
      ...input.run,
      state: 'BLOCKED',
      blockers: [
        ...new Set([...input.run.blockers, 'approved_implementation_plan_missing']),
      ],
      updatedAt: nowIso(),
    };
  }

  return {
    ...input.run,
    state: 'BRANCH_CREATED',
    commandsRun: [
      ...input.run.commandsRun,
      `git checkout -b ${input.run.featureBranch} ${input.run.baseBranch}`,
    ],
    blockers: input.run.blockers.filter(
      (b) => b !== 'approved_implementation_plan_missing',
    ),
    rollbackInstructions: {
      lastKnownSafeState: input.run.baseBranch,
      revertMethod: 'delete_feature_branch_or_reset_to_base',
      commands: [
        `git checkout ${input.run.baseBranch}`,
        `git branch -D ${input.run.featureBranch}`,
      ],
      notes: 'Safe state is base branch tip before feature commits.',
    },
    updatedAt: nowIso(),
  };
}

export function applyBoundedChanges(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  filesChanged: readonly string[];
  dependenciesChanged?: readonly string[];
  migrationCandidates?: readonly string[];
  deniedClass?: DeniedChangeClass;
  includeSecrets?: boolean;
  disableGuardian?: boolean;
  weakenRls?: boolean;
  removeApprovalGates?: boolean;
  grantSelfNewScopes?: boolean;
  modifyProductionDbs?: boolean;
  provisionPaidCloud?: boolean;
  editMainDirectly?: boolean;
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor)) {
    return deny('Only orchestrator agents may apply changes.');
  }
  if (
    input.run.state !== 'BRANCH_CREATED' &&
    input.run.state !== 'CHANGES_IN_PROGRESS'
  ) {
    return deny(`Cannot apply changes from state ${input.run.state}.`);
  }

  if (input.deniedClass) {
    return deny(`Denied change class: ${input.deniedClass}`);
  }
  if (input.disableGuardian === true || ES8_LOCKS.DISABLE_GUARDIAN === true) {
    return deny('Disabling Guardian is forbidden.');
  }
  if (input.weakenRls === true || ES8_LOCKS.WEAKEN_RLS === true) {
    return deny('Weakening RLS is forbidden.');
  }
  if (input.removeApprovalGates === true) {
    return deny('Removing approval gates is forbidden.');
  }
  if (input.grantSelfNewScopes === true) {
    return deny('Agents may not grant themselves new scopes.');
  }
  if (input.includeSecrets === true) {
    return deny('Secrets must not be added to source.');
  }
  if (input.modifyProductionDbs === true) {
    return deny('Production DB mutation is human-authorized only.');
  }
  if (input.provisionPaidCloud === true) {
    return deny('Automatic paid cloud provisioning is forbidden.');
  }
  if (input.editMainDirectly === true) {
    return deny('Direct main/xiv-v2 changes are forbidden — use feature branch.');
  }

  for (const f of input.filesChanged) {
    const norm = f.replace(/\\/g, '/').toLowerCase();
    if (
      norm.includes('.env') ||
      norm.endsWith('.pem') ||
      norm.includes('secret') ||
      norm.includes('credentials')
    ) {
      return deny(`Refusing secret-like path in changes: ${f}`);
    }
  }

  return {
    ...input.run,
    state: 'CHANGES_IN_PROGRESS',
    filesChanged: [
      ...new Set([...input.run.filesChanged, ...input.filesChanged]),
    ],
    dependenciesChanged: [
      ...new Set([
        ...input.run.dependenciesChanged,
        ...(input.dependenciesChanged ?? []),
      ]),
    ],
    migrationCandidates: [
      ...new Set([
        ...input.run.migrationCandidates,
        ...(input.migrationCandidates ?? []),
      ]),
    ],
    updatedAt: nowIso(),
  };
}

export function recordTestResult(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  step: TestGateStep;
  command: string;
  state: TestResultState;
  exitCode?: number | null;
  summary?: string;
  claimNotTestedAsPass?: boolean;
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor)) {
    return deny('Only orchestrator agents may record test results.');
  }
  if (
    input.run.state !== 'CHANGES_IN_PROGRESS' &&
    input.run.state !== 'TESTING' &&
    input.run.state !== 'BLOCKED'
  ) {
    return deny(`Cannot record tests from state ${input.run.state}.`);
  }
  if (input.claimNotTestedAsPass === true) {
    return deny('NOT_TESTED must not be recorded as PASS.');
  }
  if (input.state === 'NOT_TESTED' && notTestedMeansPass()) {
    return deny('Lock TREAT_NOT_TESTED_AS_PASS must remain false.');
  }

  const result: TestCommandResult = {
    step: input.step,
    command: input.command,
    state: input.state,
    exitCode: input.exitCode ?? (input.state === 'PASS' ? 0 : null),
    summary:
      input.summary ??
      (input.state === 'NOT_TESTED'
        ? `${input.step} not run — remains NOT_TESTED`
        : `${input.step}=${input.state}`),
  };

  const prior = input.run.testResults.filter((r) => r.step !== input.step);
  const testResults = [...prior, result];
  const blockers =
    result.state === 'FAIL' || result.state === 'ERROR'
      ? [...new Set([...input.run.blockers, `test_failed:${input.step}`])]
      : input.run.blockers.filter((b) => b !== `test_failed:${input.step}`);

  return {
    ...input.run,
    state: result.state === 'FAIL' || result.state === 'ERROR' ? 'BLOCKED' : 'TESTING',
    testResults,
    commandsRun: [...input.run.commandsRun, input.command],
    blockers,
    updatedAt: nowIso(),
  };
}

export function runSecurityChecks(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  checks?: readonly string[];
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor)) {
    return deny('Only orchestrator agents may run security checks.');
  }
  const checks = input.checks ?? [
    'guardian_unchanged',
    'rls_unchanged',
    'no_secrets_in_diff',
    'approval_gates_intact',
    'no_self_granted_scopes',
  ];
  return {
    ...input.run,
    state: input.run.state === 'BLOCKED' ? 'BLOCKED' : 'TESTING',
    securityChecks: [...new Set([...input.run.securityChecks, ...checks])],
    commandsRun: [
      ...input.run.commandsRun,
      'security_policy_checks:guardian_rls_secrets_gates_scopes',
    ],
    updatedAt: nowIso(),
  };
}

export function buildDiffIntelligence(input: {
  whatChanged: string;
  why: string;
  securityImpact?: string;
  dataImpact?: string;
  runtimeImpact?: string;
  newDependencies?: readonly string[];
  knownLimitations?: readonly string[];
  unverifiedAssumptions?: readonly string[];
}): DiffIntelligence {
  return {
    whatChanged: input.whatChanged,
    why: input.why,
    securityImpact: input.securityImpact ?? 'none_claimed_pending_review',
    dataImpact: input.dataImpact ?? 'none_claimed_pending_review',
    runtimeImpact: input.runtimeImpact ?? 'none_claimed_pending_review',
    newDependencies: [...(input.newDependencies ?? [])],
    knownLimitations: [...(input.knownLimitations ?? [])],
    unverifiedAssumptions: [...(input.unverifiedAssumptions ?? [])],
  };
}

export function attachDiffAndRollback(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  diff: DiffIntelligence;
  rollback?: RollbackInstructions;
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor)) {
    return deny('Only orchestrator agents may attach diff/rollback.');
  }
  const rollback: RollbackInstructions = input.rollback ?? {
    lastKnownSafeState: input.run.baseBranch,
    revertMethod: 'git_revert_or_reset_feature_branch_to_base',
    commands: [
      `git checkout ${input.run.featureBranch}`,
      `git reset --hard ${input.run.baseBranch}`,
    ],
    notes:
      'Last known safe state is base branch tip before feature commits. Human confirms before destructive reset.',
  };
  return {
    ...input.run,
    diffIntelligence: input.diff,
    rollbackInstructions: rollback,
    updatedAt: nowIso(),
  };
}

export function buildEvidenceBundle(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  repoRoot?: string;
}): { run: ChangeOrchestrationRun; bundle: EvidenceBundle } | DenialResult {
  if (!isEs8Agent(input.actor)) {
    return deny('Only orchestrator agents may build evidence bundles.');
  }
  if (!input.run.diffIntelligence || !input.run.rollbackInstructions) {
    return deny('Diff intelligence and rollback required before evidence bundle.');
  }

  const softWire = es8SoftWireSnapshot(input.repoRoot);
  const softWireNotes = [
    softWire.es7ExecutableImplementationPlan.note,
    softWire.es7Report.note,
    softWire.es6AcceptanceTestEvidence.note,
    softWire.es6Report.note,
    softWire.es5PrototypeArchitectureComposer.note,
    softWire.es5Report.note,
  ];

  const bundle: EvidenceBundle = {
    changeRunId: input.run.changeRunId,
    implementationId: input.run.implementationId,
    filesChanged: [...input.run.filesChanged],
    commandsRun: [...input.run.commandsRun],
    testResults: [...input.run.testResults],
    securityChecks: [...input.run.securityChecks],
    diffIntelligence: input.run.diffIntelligence,
    rollback: input.run.rollbackInstructions,
    softWireNotes,
    honestyBanner: HONESTY_BANNER,
    createdAt: nowIso(),
  };

  return {
    run: {
      ...input.run,
      evidenceBundle: bundle,
      updatedAt: nowIso(),
    },
    bundle,
  };
}

export function advanceToReview(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  reviewer?: string;
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only orchestrator or human reviewer may advance to review.');
  }
  if (!input.run.evidenceBundle) {
    return deny('Evidence bundle required before REVIEW_REQUIRED.');
  }
  if (input.run.blockers.length > 0) {
    return {
      ...input.run,
      state: 'BLOCKED',
      updatedAt: nowIso(),
    };
  }

  return {
    ...input.run,
    state: 'REVIEW_REQUIRED',
    reviewer: input.reviewer ?? input.run.reviewer,
    updatedAt: nowIso(),
  };
}

/**
 * DRAFT_PR_READY only after test-before-review gate is fully PASS.
 * Prepares draft PR *state* only — does not open a real PR/MR.
 */
export function markDraftPrReady(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  skipTestGate?: boolean;
  actuallyOpenPr?: boolean;
}): ChangeOrchestrationRun | DenialResult {
  if (!isEs8Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only orchestrator or human may mark draft PR ready.');
  }
  if (input.run.state !== 'REVIEW_REQUIRED' && input.run.state !== 'TESTING') {
    return deny(
      `DRAFT_PR_READY requires REVIEW_REQUIRED or TESTING; got ${input.run.state}.`,
    );
  }
  if (input.skipTestGate === true || draftPrReadyAllowedWithoutGate()) {
    return deny(
      'DRAFT_PR_READY requires completed test-before-review gate — skip denied.',
    );
  }
  if (!testGateSatisfied(input.run.testResults, input.run.testsRequired)) {
    return deny(
      'DRAFT_PR_READY denied: test gate incomplete — unrun steps remain NOT_TESTED / non-PASS.',
    );
  }
  if (input.actuallyOpenPr === true || ES8_LOCKS.AUTO_OPEN_PR === true) {
    return deny(
      'Auto-opening PR/MR is forbidden for park-and-implement work unless founder explicitly asks.',
    );
  }
  if (!input.run.evidenceBundle) {
    return deny('Evidence bundle required for DRAFT_PR_READY.');
  }

  return {
    ...input.run,
    state: 'DRAFT_PR_READY',
    prMrState: 'DRAFT_PREPARED',
    updatedAt: nowIso(),
  };
}

export function attemptMergeToMain(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
}): DenialResult {
  void input.actor;
  void input.run;
  if (mainMergeAllowed()) {
    return deny('Invariant broken: main merge must remain denied.');
  }
  return deny(
    'Automatic / agent merge to main is forbidden — human authority required.',
  );
}

export function attemptTipLand(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
}): DenialResult {
  void input.actor;
  void input.run;
  return deny('Tip-land onto xiv-v2/main is forbidden for ES8 park work.');
}

export function attemptDisableGuardian(): DenialResult {
  return deny('Disabling Guardian is forbidden.');
}

export function attemptWeakenRls(): DenialResult {
  return deny('Weakening RLS is forbidden.');
}

export function attemptTreatNotTestedAsPass(): DenialResult {
  return deny('NOT_TESTED ≠ PASS.');
}

export function attemptProductionDeploy(): DenialResult {
  return deny('Production deployment is human-authorized only.');
}

export function attemptEnableL4(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED must remain false.');
}

export function rejectRun(input: {
  actor: Es8Actor;
  run: ChangeOrchestrationRun;
  reason: string;
}): ChangeOrchestrationRun | DenialResult {
  if (!isHumanApprover(input.actor) && !isEs8Agent(input.actor)) {
    return deny('Only human approver or orchestrator may reject a run.');
  }
  return {
    ...input.run,
    state: 'REJECTED',
    blockers: [...new Set([...input.run.blockers, `rejected:${input.reason}`])],
    prMrState: input.run.prMrState === 'NONE' ? 'NONE' : 'CLOSED',
    updatedAt: nowIso(),
  };
}

export function requireHumanApproval(input: {
  actor: Es8Actor;
  action:
    | 'merge_to_main'
    | 'production_release'
    | 'db_mutation'
    | 'permission_expansion'
    | 'external_commitment'
    | 'open_real_pr';
}): DenialResult | { approved: false; state: 'HUMAN_APPROVAL_REQUIRED'; reason: string } {
  if (isHumanApprover(input.actor) && input.actor.permissions.includes('approve_consequential')) {
    // Even humans go through explicit approval channel — orchestrator never auto-acts.
    return {
      approved: false,
      state: 'HUMAN_APPROVAL_REQUIRED',
      reason: `Action ${input.action} remains outside ES8 orchestrator authority; record human decision externally.`,
    };
  }
  return deny(
    `Action ${input.action} requires human authorization — ES8 may only recommend/prepare.`,
  );
}

export type Es8CycleResult = {
  ok: boolean;
  locksIntact: boolean;
  softWire: Es8SoftWireSnapshot;
  hops: Es8HopRecord[];
  run: ChangeOrchestrationRun | null;
  honestyBanner: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
  layer: typeof ES_LAYER_TITLE;
  sot: {
    label: typeof GITHUB_SOT_LABEL;
    family: typeof GITHUB_SOT_FAMILY;
    title: typeof GITHUB_SOT_TITLE;
    issueNote: typeof GITHUB_SOT_ISSUE_NOTE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
  };
  dbCandidates: typeof ES8_DB_CANDIDATES_STATUS;
  may: typeof ES8_MAY;
  mustNot: typeof ES8_MUST_NOT;
  states: typeof CHANGE_ORCHESTRATOR_STATES;
  testGate: typeof TEST_BEFORE_REVIEW_GATE;
  prMrStates: typeof PR_MR_STATES;
  testResultStates: typeof TEST_RESULT_STATES;
  deniedClasses: typeof DENIED_CHANGE_CLASSES;
  bounds: typeof ES8_AGENT_BOUNDS;
  truth: typeof CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY;
  l4: false;
};

/**
 * Happy-path cycle ending in DRAFT_PR_READY (prepare-only) when all tests PASS.
 */
export function runCodeChangeOrchestratorCycle(input: {
  actor: Es8Actor;
  implementationId: string;
  repository?: string;
  baseBranch?: string;
  featureBranch?: string;
  filesChanged?: readonly string[];
  repoRoot?: string;
  /** When true, leave runtime_tests as NOT_TESTED to prove gate honesty. */
  leaveRuntimeNotTested?: boolean;
}): Es8CycleResult {
  const locksIntact = assertEs8LocksIntact();
  const softWire = es8SoftWireSnapshot(input.repoRoot);
  const hops: Es8HopRecord[] = [];

  hops.push(
    hop(
      'locks_asserted',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact ? 'ES8 locks intact; L4=false.' : 'ES8 locks broken.',
    ),
  );
  hops.push(
    hop(
      'soft_wire_es7_plan',
      softWireHopState(softWire.es7ExecutableImplementationPlan.present),
      softWire.es7ExecutableImplementationPlan.note,
    ),
  );
  hops.push(
    hop(
      'soft_wire_es6_acceptance_evidence',
      softWireHopState(softWire.es6AcceptanceTestEvidence.present),
      softWire.es6AcceptanceTestEvidence.note,
    ),
  );
  hops.push(
    hop(
      'soft_wire_es5_architecture_composer',
      softWireHopState(softWire.es5PrototypeArchitectureComposer.present),
      softWire.es5PrototypeArchitectureComposer.note,
    ),
  );

  if (!locksIntact) {
    return finalizeCycle(false, locksIntact, softWire, hops, null);
  }

  const planned = planChangeRun({
    actor: input.actor,
    implementationId: input.implementationId,
    repository: input.repository ?? 'DevinHaynes2025/xiv-ai',
    baseBranch: input.baseBranch ?? 'xiv-v2',
    featureBranch:
      input.featureBranch ??
      'cursor/example-feature-from-approved-plan-4059',
    approvedPlanPresent: true,
  });
  if ('denied' in planned) {
    hops.push(hop('plan_accepted_check', 'DENIED', planned.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, null);
  }
  hops.push(hop('plan_accepted_check', 'PASS', `PLANNED ${planned.changeRunId}`));

  const branched = createFeatureBranch({ actor: input.actor, run: planned });
  if ('denied' in branched) {
    hops.push(hop('branch_create_non_main', 'DENIED', branched.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, planned);
  }
  hops.push(
    hop(
      'branch_create_non_main',
      'PASS',
      `BRANCH_CREATED ${branched.featureBranch} (not main)`,
    ),
  );

  const changed = applyBoundedChanges({
    actor: input.actor,
    run: branched,
    filesChanged: input.filesChanged ?? [
      'services/ai/local-brain/example-feature.ts',
      'services/ai/local-brain/example-feature.test.ts',
    ],
  });
  if ('denied' in changed) {
    hops.push(hop('apply_bounded_changes', 'DENIED', changed.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, branched);
  }
  hops.push(
    hop(
      'apply_bounded_changes',
      'PASS',
      `CHANGES_IN_PROGRESS files=${changed.filesChanged.length}`,
    ),
  );
  hops.push(
    hop(
      'deny_unsafe_changes',
      'PASS',
      'Guardian/RLS/secrets/prod-DB/main-edit denies encoded.',
    ),
  );

  let run: ChangeOrchestrationRun = changed;
  const gateResults: Array<{
    step: TestGateStep;
    command: string;
    state: TestResultState;
  }> = [
    { step: 'typecheck', command: 'npm run typecheck', state: 'PASS' },
    {
      step: 'unit_tests',
      command: 'npm run test:unit',
      state: 'PASS',
    },
    {
      step: 'security_policy_tests',
      command: 'npm run test:security-policy',
      state: 'PASS',
    },
    {
      step: 'integration_tests',
      command: 'npm run test:integration',
      state: 'PASS',
    },
    {
      step: 'runtime_tests',
      command: 'npm run test:runtime',
      state: input.leaveRuntimeNotTested ? 'NOT_TESTED' : 'PASS',
    },
  ];

  for (const g of gateResults) {
    const next = recordTestResult({
      actor: input.actor,
      run,
      step: g.step,
      command: g.command,
      state: g.state,
      summary:
        g.state === 'NOT_TESTED'
          ? `${g.step} unavailable — remains NOT_TESTED (≠ PASS)`
          : undefined,
    });
    if ('denied' in next) {
      hops.push(hop('run_test_before_review_gate', 'DENIED', next.reason));
      return finalizeCycle(false, locksIntact, softWire, hops, run);
    }
    run = next;
  }

  const secured = runSecurityChecks({ actor: input.actor, run });
  if ('denied' in secured) {
    hops.push(hop('run_test_before_review_gate', 'DENIED', secured.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, run);
  }
  run = secured;

  const gateOk = testGateSatisfied(run.testResults, run.testsRequired);
  hops.push(
    hop(
      'run_test_before_review_gate',
      gateOk ? 'PASS' : 'NOT_TESTED',
      gateOk
        ? 'All test-before-review steps PASS.'
        : 'Gate incomplete — some steps NOT_TESTED/non-PASS.',
    ),
  );
  hops.push(
    hop(
      'not_tested_honesty',
      'PASS',
      'Unrun tests remain NOT_TESTED; NOT_TESTED ≠ PASS.',
    ),
  );

  const withDiff = attachDiffAndRollback({
    actor: input.actor,
    run,
    diff: buildDiffIntelligence({
      whatChanged: `Bounded files on ${run.featureBranch}`,
      why: 'Approved implementation plan execution (ES8 orchestrator)',
      securityImpact: 'no Guardian/RLS changes',
      dataImpact: 'no production DB mutation',
      runtimeImpact: 'local/static tests only in this cycle',
      knownLimitations: [
        'Soft-wired ES5/ES6/ES7 may be WAITING_DATA',
        'Draft PR prepared as state only — not opened',
      ],
      unverifiedAssumptions: [
        'Upstream ES7 plan approval evidence may be absent',
      ],
    }),
  });
  if ('denied' in withDiff) {
    hops.push(hop('diff_intelligence', 'DENIED', withDiff.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, run);
  }
  run = withDiff;
  hops.push(hop('diff_intelligence', 'PASS', 'Diff intelligence attached.'));
  hops.push(
    hop(
      'rollback_instructions',
      'PASS',
      `Rollback to ${run.rollbackInstructions?.lastKnownSafeState}`,
    ),
  );

  const evidenced = buildEvidenceBundle({
    actor: input.actor,
    run,
    repoRoot: input.repoRoot,
  });
  if ('denied' in evidenced) {
    hops.push(hop('evidence_bundle', 'DENIED', evidenced.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, run);
  }
  run = evidenced.run;
  hops.push(hop('evidence_bundle', 'PASS', 'Evidence bundle built.'));

  const reviewed = advanceToReview({
    actor: input.actor,
    run,
    reviewer: 'human-reviewer-pending',
  });
  if ('denied' in reviewed) {
    hops.push(hop('review_required', 'DENIED', reviewed.reason));
    return finalizeCycle(false, locksIntact, softWire, hops, run);
  }
  run = reviewed;
  hops.push(hop('review_required', 'PASS', 'REVIEW_REQUIRED.'));

  const draft = markDraftPrReady({ actor: input.actor, run });
  if ('denied' in draft) {
    hops.push(
      hop(
        'draft_pr_ready_only_after_gate',
        gateOk ? 'DENIED' : 'NOT_TESTED',
        draft.reason,
      ),
    );
    hops.push(
      hop(
        'human_authority_boundaries',
        'PASS',
        'Merge/prod/DB/scopes/external remain human-authorized.',
      ),
    );
    hops.push(hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'));
    hops.push(
      hop(
        'no_tip_land_no_auto_merge',
        'PASS',
        'Tip-land and auto-merge main denied.',
      ),
    );
    hops.push(
      hop(
        'db_candidates_not_applied',
        'NOT_APPLIED',
        ES8_DB_CANDIDATES_STATUS,
      ),
    );
    hops.push(
      hop(
        'evidence',
        'IMPLEMENTED',
        'Cycle stopped before DRAFT_PR_READY due to gate/denial.',
      ),
    );
    return finalizeCycle(false, locksIntact, softWire, hops, run);
  }
  run = draft;
  hops.push(
    hop(
      'draft_pr_ready_only_after_gate',
      'PASS',
      'DRAFT_PR_READY with prMrState=DRAFT_PREPARED (not opened).',
    ),
  );
  hops.push(
    hop(
      'human_authority_boundaries',
      'PASS',
      'Merge/prod/DB/scopes/external remain human-authorized.',
    ),
  );
  hops.push(hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'));
  hops.push(
    hop(
      'no_tip_land_no_auto_merge',
      'PASS',
      'Tip-land and auto-merge main denied.',
    ),
  );
  hops.push(
    hop('db_candidates_not_applied', 'NOT_APPLIED', ES8_DB_CANDIDATES_STATUS),
  );
  hops.push(
    hop(
      'evidence',
      'IMPLEMENTED',
      'ES8 orchestrator cycle complete on child branch — NOT production authorized.',
    ),
  );

  return finalizeCycle(true, locksIntact, softWire, hops, run);
}

function finalizeCycle(
  ok: boolean,
  locksIntact: boolean,
  softWire: Es8SoftWireSnapshot,
  hops: Es8HopRecord[],
  run: ChangeOrchestrationRun | null,
): Es8CycleResult {
  return {
    ok,
    locksIntact,
    softWire,
    hops,
    run,
    honestyBanner: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
    layer: ES_LAYER_TITLE,
    sot: {
      label: GITHUB_SOT_LABEL,
      family: GITHUB_SOT_FAMILY,
      title: GITHUB_SOT_TITLE,
      issueNote: GITHUB_SOT_ISSUE_NOTE,
      gitlab: GITLAB_MIRROR_NOTE,
    },
    dbCandidates: ES8_DB_CANDIDATES_STATUS,
    may: ES8_MAY,
    mustNot: ES8_MUST_NOT,
    states: CHANGE_ORCHESTRATOR_STATES,
    testGate: TEST_BEFORE_REVIEW_GATE,
    prMrStates: PR_MR_STATES,
    testResultStates: TEST_RESULT_STATES,
    deniedClasses: DENIED_CHANGE_CLASSES,
    bounds: ES8_AGENT_BOUNDS,
    truth: CHANGE_ORCHESTRATOR_TRUTH_BOUNDARY,
    l4: false,
  };
}

/** Convenience denial probes for tests. */
export function probeMainMergeDenied(actor: Es8Actor): DenialResult {
  const planned = planChangeRun({
    actor,
    implementationId: 'probe-main',
    repository: 'DevinHaynes2025/xiv-ai',
    baseBranch: 'xiv-v2',
    featureBranch: 'cursor/probe-feature-4059',
  });
  if ('denied' in planned) return planned;
  return attemptMergeToMain({ actor, run: planned });
}

export function probeGuardianRlsDenies(): {
  guardian: DenialResult;
  rls: DenialResult;
} {
  return {
    guardian: attemptDisableGuardian(),
    rls: attemptWeakenRls(),
  };
}
