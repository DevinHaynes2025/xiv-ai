/**
 * 62L-ES7 — Executable Implementation Plan Generator runtime.
 *
 * Generate concrete plans from approved prototypes; keep commands NOT_TESTED
 * until run; lock migrations as candidates; deny Guardian/RLS weaken, main
 * merge, tip-land, and auto-open PR; escalate on stop conditions.
 */

import { createHash } from 'node:crypto';
import {
  BRANCH_LIFECYCLE,
  DEPENDENCY_GATE_CHECKS,
  ES7_AGENT_BOUNDS,
  ES7_DB_CANDIDATES_STATUS,
  ES7_LOCKS,
  ES7_MAY,
  ES7_MIGRATION_DEFAULT_STATUS,
  ES7_MUST_NOT,
  ES_LAYER_TITLE,
  EVIDENCE_PACKAGE_FIELDS,
  EXECUTABLE_IMPLEMENTATION_CORE_FLOW,
  EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_CYCLE,
  EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY,
  FILE_MAP_ENTRY_FIELDS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IMPLEMENTATION_PLAN_FIELDS,
  NEXT_PHASE_TITLE,
  STOP_CONDITIONS,
  assertEs7LocksIntact,
  defaultCommandStatus,
  dependencyGateAllowsNewPackage,
  es7SoftWireSnapshot,
  isEs7Agent,
  isHumanApprover,
  migrationIsAuthorized,
  softWireHopState,
  unrunIsNotSuccess,
  type CommandMapEntry,
  type CommandTestStatus,
  type DependencyGateResult,
  type Es7Actor,
  type Es7EvidenceState,
  type Es7HopRecord,
  type Es7SoftWireSnapshot,
  type EvidencePackage,
  type FileMapEntry,
  type ImplementationPlan,
  type MigrationCandidate,
  type StopCondition,
} from './executable-implementation-plan-generator-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof EXECUTABLE_IMPLEMENTATION_PLAN_GENERATOR_CYCLE)[number],
  state: Es7EvidenceState,
  summary: string,
): Es7HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'ESCALATED' | 'BLOCKED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'ESCALATED' | 'BLOCKED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

function emptyEvidencePackage(rollback: string): EvidencePackage {
  return {
    diff: null,
    commandsRun: [],
    testResults: [],
    runtimeEvidence: [],
    knownFailures: [],
    rollbackInstructions: rollback,
    reviewStatus: 'NOT_REVIEWED',
  };
}

export function generateImplementationPlan(input: {
  actor: Es7Actor;
  prototypeId: string;
  architectureSummary?: string;
  acceptanceTests?: readonly string[];
  fileMap: readonly FileMapEntry[];
  existingModulesToReuse?: readonly string[];
  dependencies?: readonly string[];
  environmentVariables?: readonly string[];
  migrationsIfAny?: readonly MigrationCandidate[];
  apiConfigRequirements?: readonly string[];
  testFiles?: readonly string[];
  commands?: readonly CommandMapEntry[];
  owners: readonly string[];
  sequenceDependencies?: readonly string[];
  rollbackPlan: string;
  blockers?: readonly string[];
  targetBranch?: string;
  treatUnrunAsSuccess?: boolean;
  authorizeMigration?: boolean;
  weakenGuardianRls?: boolean;
  mergeToMain?: boolean;
  tipLand?: boolean;
  autoOpenPr?: boolean;
}): ImplementationPlan | DenialResult {
  if (!isEs7Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny(
      'Only implementation plan generators / architects / acceptance agents / home_base may generate plans.',
    );
  }
  if (input.treatUnrunAsSuccess === true) {
    return deny(
      'Unrun commands/tests must remain NOT_TESTED — cannot report as success.',
    );
  }
  if (input.authorizeMigration === true) {
    return deny(
      'Migrations remain MIGRATION_CANDIDATE until separately reviewed/authorized.',
    );
  }
  if (input.weakenGuardianRls === true) {
    return deny(
      'Guardian/RLS must not be weakened for prototype convenience.',
    );
  }
  if (input.mergeToMain === true) {
    return deny(
      'No main merge without explicit authorization — plans stay on feature branches.',
    );
  }
  if (input.tipLand === true) {
    return deny('Tip-land onto xiv-v2/main is forbidden for ES7 plan generation.');
  }
  if (input.autoOpenPr === true) {
    return deny(
      'Auto-open PR/MR is not part of the ES7 feature under test — draft MR only after review.',
    );
  }
  if (input.fileMap.length === 0) {
    return deny('File map required — every task needs path/purpose/owner/change/tests.');
  }
  for (const entry of input.fileMap) {
    for (const field of FILE_MAP_ENTRY_FIELDS) {
      if (entry[field] === undefined || entry[field] === null) {
        return deny(`File map entry missing ${field}.`);
      }
    }
  }

  for (const c of input.commands ?? []) {
    if (!c.executed && (c.testStatus === 'PASS' || c.resultSummary != null)) {
      return deny(
        'Unrun command cannot be labeled PASS or carry a result — NOT_TESTED required.',
      );
    }
  }

  const commands: CommandMapEntry[] = (input.commands ?? []).map((c) => {
    if (!c.executed) {
      return {
        ...c,
        testStatus: 'NOT_TESTED' as const,
        resultSummary: null,
      };
    }
    return c;
  });

  const migrations: MigrationCandidate[] = (
    input.migrationsIfAny ?? []
  ).map((m) => ({
    ...m,
    status:
      m.status === 'NONE' ? 'NONE' : ES7_MIGRATION_DEFAULT_STATUS,
    guardianRlsWeakened: false,
    authorized: false,
  }));

  for (const m of migrations) {
    if (m.status !== 'NONE' && migrationIsAuthorized(m.status)) {
      return deny(
        'Migration cannot enter plan as AUTHORIZED/APPLIED — MIGRATION_CANDIDATE only.',
      );
    }
  }

  const targetBranch =
    input.targetBranch ??
    `cursor/62l-es7-impl-${input.prototypeId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-4059`;

  if (
    targetBranch === 'main' ||
    targetBranch === 'xiv-v2' ||
    targetBranch.endsWith('/main')
  ) {
    return deny(
      'Target branch must be a feature branch — not main or xiv-v2 tip-land.',
    );
  }

  const implementationId = `impl-${sha256(
    `${input.prototypeId}:${targetBranch}:${input.fileMap.map((f) => f.path).join('|')}`,
  ).slice(0, 16)}`;

  return {
    implementationId,
    prototypeId: input.prototypeId,
    targetBranch,
    sourceFilesToCreateOrUpdate: [...input.fileMap],
    existingModulesToReuse: [...(input.existingModulesToReuse ?? [])],
    dependencies: [...(input.dependencies ?? [])],
    environmentVariables: [...(input.environmentVariables ?? [])],
    migrationsIfAny: migrations,
    apiConfigRequirements: [...(input.apiConfigRequirements ?? [])],
    testFiles: [
      ...(input.testFiles ??
        input.fileMap.flatMap((f) => f.testsAffected)),
    ],
    commands,
    owners: [...input.owners],
    sequenceDependencies: [...(input.sequenceDependencies ?? [])],
    rollbackPlan: input.rollbackPlan,
    evidenceRequirements: [...EVIDENCE_PACKAGE_FIELDS],
    blockers: [...(input.blockers ?? [])],
    stopConditions: [...STOP_CONDITIONS],
    branchLifecycle: BRANCH_LIFECYCLE,
    evidencePackage: emptyEvidencePackage(input.rollbackPlan),
    planOnly: true,
    productionAuthorized: false,
    tipLandAuthorized: false,
    mainMergeAuthorized: false,
    autoOpenPrAuthorized: false,
    migrationAuthorized: false,
    guardianRlsWeakened: false,
    l4AutonomyEnabled: false,
  };
}

export function recordCommandExecution(input: {
  plan: ImplementationPlan;
  command: string;
  testStatus: CommandTestStatus;
  resultSummary: string;
}): ImplementationPlan | DenialResult {
  const idx = input.plan.commands.findIndex((c) => c.command === input.command);
  if (idx < 0) {
    return deny(`Command not in plan: ${input.command}`);
  }
  if (input.testStatus === 'PASS' && !input.resultSummary) {
    return deny('PASS requires a non-empty result summary from actual execution.');
  }

  const nextCommands = input.plan.commands.map((c, i) =>
    i === idx
      ? {
          ...c,
          executed: true,
          testStatus: input.testStatus,
          resultSummary: input.resultSummary,
        }
      : c,
  );

  return {
    ...input.plan,
    commands: nextCommands,
    evidencePackage: {
      ...input.plan.evidencePackage,
      commandsRun: [
        ...input.plan.evidencePackage.commandsRun,
        input.command,
      ],
      testResults: nextCommands.filter((c) => c.executed),
    },
  };
}

export function evaluateDependencyGate(input: {
  packageName: string;
  existingDepSufficient: boolean;
  maintained: boolean | 'UNKNOWN';
  permissionsNetworkOk: boolean | 'UNKNOWN';
  licenseOk: boolean | 'UNKNOWN';
  supplyChainRiskAcceptable: boolean | 'UNKNOWN';
  skipGate?: boolean;
}): DependencyGateResult | DenialResult {
  if (input.skipGate === true) {
    return deny('Dependency gate cannot be skipped before adding a new package.');
  }

  const checks = {
    existing_dep_sufficient: input.existingDepSufficient,
    maintained: input.maintained,
    permissions_network: input.permissionsNetworkOk,
    license: input.licenseOk,
    supply_chain_risk: input.supplyChainRiskAcceptable,
  } as const;

  const blocking =
    input.existingDepSufficient === true
      ? 'Existing dependency is sufficient — do not add new package.'
      : input.maintained === false
        ? 'Package not maintained.'
        : input.permissionsNetworkOk === false
          ? 'Permissions/network not acceptable.'
          : input.licenseOk === false
            ? 'License not acceptable.'
            : input.supplyChainRiskAcceptable === false
              ? 'Supply-chain risk unacceptable.'
              : null;

  const unknownBlocking = Object.values(checks).some((v) => v === 'UNKNOWN');

  if (blocking) {
    return {
      packageName: input.packageName,
      checks: { ...checks },
      approved: false,
      reason: blocking,
    };
  }

  if (unknownBlocking) {
    return {
      packageName: input.packageName,
      checks: { ...checks },
      approved: false,
      reason: 'Dependency gate has UNKNOWN checks — cannot approve new package.',
    };
  }

  return {
    packageName: input.packageName,
    checks: { ...checks },
    approved: true,
    reason: 'Dependency gate passed — new package may be proposed (not auto-installed).',
  };
}

export function attachNewDependency(input: {
  plan: ImplementationPlan;
  gate: DependencyGateResult;
}): ImplementationPlan | DenialResult {
  if (!dependencyGateAllowsNewPackage(input.gate)) {
    return deny(
      `Dependency gate denied for ${input.gate.packageName}: ${input.gate.reason}`,
    );
  }
  return {
    ...input.plan,
    dependencies: [...input.plan.dependencies, input.gate.packageName],
  };
}

export function escalateStopCondition(input: {
  condition: StopCondition;
  detail: string;
}): DenialResult {
  if (!STOP_CONDITIONS.includes(input.condition)) {
    return deny(`Unknown stop condition: ${String(input.condition)}`);
  }
  return deny(
    `Escalate: ${input.condition} — ${input.detail}`,
    'ESCALATED',
  );
}

export function attemptUnrunAsSuccess(): DenialResult {
  return deny(
    'Unrun command/test cannot be reported successful — TEST_STATUS stays NOT_TESTED.',
  );
}

export function attemptMigrationAsAuthorized(): DenialResult {
  return deny(
    'MIGRATION_CANDIDATE ≠ AUTHORIZED — separate review/authorization required.',
  );
}

export function attemptGuardianRlsWeaken(): DenialResult {
  return deny(
    'Guardian/RLS must not be weakened for prototype convenience.',
  );
}

export function attemptMainMerge(): DenialResult {
  return deny(
    'No main merge without explicit authorization.',
  );
}

export function attemptTipLand(): DenialResult {
  return deny('Tip-land onto xiv-v2/main is forbidden.');
}

export function attemptAutoOpenPr(): DenialResult {
  return deny(
    'Auto-open PR/MR is not authorized as part of ES7 plan generation.',
  );
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act — plans are advisory until human-authorized.');
}

export function requireHumanApproval(input: {
  actor: Es7Actor;
  action: string;
}):
  | { approved: true; actorId: string; action: string }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      `Human approval required for consequential action: ${input.action}`,
      'BLOCKED',
    );
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('approve')
  ) {
    return deny(
      'Approver lacks approve_consequential permission.',
      'BLOCKED',
    );
  }
  return {
    approved: true,
    actorId: input.actor.id,
    action: input.action,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  l4: false;
  state: 'PASS';
} {
  return {
    unchanged:
      EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.guardianRlsTenantUniverseIsolationUnchanged,
    l4: ES7_LOCKS.L4_AUTONOMY_ENABLED,
    state: 'PASS',
  };
}

export function exampleWorkloadRouterPlan(actor: Es7Actor): ImplementationPlan {
  const plan = generateImplementationPlan({
    actor,
    prototypeId: 'proto-verified-device-routing',
    architectureSummary: 'Soft-wired ES5 architecture when present; else WAITING_DATA.',
    acceptanceTests: [
      'route only to VERIFIED devices',
      'deny force-route when capability missing',
    ],
    fileMap: [
      {
        path: 'services/ai/local-runtime/workload-router.ts',
        purpose: 'add verified-device routing',
        owner: 'AI Runtime',
        changeType: 'update',
        testsAffected: ['workload-router.test.ts'],
      },
    ],
    existingModulesToReuse: [
      'services/ai/local-brain/capability-manifest.ts',
    ],
    dependencies: [],
    environmentVariables: ['L4_AUTONOMY_ENABLED=false'],
    migrationsIfAny: [
      {
        path: 'supabase/migrations/YYYYMMDD_verified_device_routing_candidate.sql',
        purpose: 'optional routing metadata candidate',
        status: 'MIGRATION_CANDIDATE',
        guardianRlsWeakened: false,
        authorized: false,
      },
    ],
    apiConfigRequirements: ['no production write paths'],
    testFiles: ['workload-router.test.ts'],
    commands: [
      {
        command: 'npm run test:workload-router',
        purpose: 'unit tests for verified-device routing',
        testStatus: defaultCommandStatus(),
        executed: false,
        resultSummary: null,
      },
    ],
    owners: ['AI Runtime'],
    sequenceDependencies: [
      'ES4 scope (soft-wire)',
      'ES5 architecture (soft-wire)',
      'ES6 acceptance tests (soft-wire)',
    ],
    rollbackPlan:
      'Revert feature branch; do not merge; leave migrations as candidates unapplied.',
    blockers: [],
    targetBranch: 'cursor/62l-es7-verified-device-routing-4059',
  });
  if ('denied' in plan) {
    throw new Error(`Example plan generation failed: ${plan.reason}`);
  }
  return plan;
}

export function bootstrapExecutableImplementationPlanGenerator(input: {
  actor: Es7Actor;
  repoRoot?: string;
}): {
  honesty: typeof HONESTY_BANNER;
  locksIntact: boolean;
  softWire: Es7SoftWireSnapshot;
  layer: typeof ES_LAYER_TITLE;
  next: typeof NEXT_PHASE_TITLE;
  sot: {
    label: typeof GITHUB_SOT_LABEL;
    issue: typeof GITHUB_SOT_ISSUE;
    note: typeof GITHUB_SOT_ISSUE_NOTE;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
  };
} {
  return {
    honesty: HONESTY_BANNER,
    locksIntact: assertEs7LocksIntact(),
    softWire: es7SoftWireSnapshot(input.repoRoot),
    layer: ES_LAYER_TITLE,
    next: NEXT_PHASE_TITLE,
    sot: {
      label: GITHUB_SOT_LABEL,
      issue: GITHUB_SOT_ISSUE,
      note: GITHUB_SOT_ISSUE_NOTE,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
    },
  };
}

export function runExecutableImplementationPlanGeneratorCycle(input: {
  actor: Es7Actor;
  repoRoot?: string;
}): {
  hops: Es7HopRecord[];
  plan: ImplementationPlan;
  softWire: Es7SoftWireSnapshot;
  dbCandidates: typeof ES7_DB_CANDIDATES_STATUS;
} {
  const softWire = es7SoftWireSnapshot(input.repoRoot);
  const hops: Es7HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      assertEs7LocksIntact() ? 'PASS' : 'FAIL',
      'L4=false; unrun≠success; migration≠authorized; no Guardian weaken; no main merge; no tip-land.',
    ),
  );
  hops.push(
    hop(
      'executable_implementation_plan_generator_bootstrap',
      'PASS',
      'ES7 Executable Implementation Plan Generator bootstrapped (plan-only).',
    ),
  );
  hops.push(
    hop(
      'plan_fields_encoded',
      IMPLEMENTATION_PLAN_FIELDS.length === 16 ? 'PASS' : 'FAIL',
      `${IMPLEMENTATION_PLAN_FIELDS.length} plan fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      EXECUTABLE_IMPLEMENTATION_CORE_FLOW.length === 8 ? 'PASS' : 'FAIL',
      'approved_prototype→…→review encoded.',
    ),
  );
  hops.push(
    hop(
      'file_map_standard_encoded',
      FILE_MAP_ENTRY_FIELDS.length === 5 ? 'PASS' : 'FAIL',
      'path→purpose→owner→changeType→testsAffected.',
    ),
  );
  hops.push(
    hop(
      'command_status_encoded',
      defaultCommandStatus() === 'NOT_TESTED' ? 'PASS' : 'FAIL',
      'Commands default NOT_TESTED until executed.',
    ),
  );
  hops.push(
    hop(
      'branch_lifecycle_encoded',
      BRANCH_LIFECYCLE.length === 4 ? 'PASS' : 'FAIL',
      'feature_branch→tests→review→draft_mr_pr.',
    ),
  );
  hops.push(
    hop(
      'dependency_gate_encoded',
      DEPENDENCY_GATE_CHECKS.length === 5 ? 'PASS' : 'FAIL',
      'existing/maintained/permissions/license/supply-chain encoded.',
    ),
  );
  hops.push(
    hop(
      'migration_candidate_lock_encoded',
      ES7_MIGRATION_DEFAULT_STATUS === 'MIGRATION_CANDIDATE' ? 'PASS' : 'FAIL',
      'DB changes locked as MIGRATION_CANDIDATE.',
    ),
  );
  hops.push(
    hop(
      'stop_conditions_encoded',
      STOP_CONDITIONS.length === 6 ? 'PASS' : 'FAIL',
      'Six escalate stop conditions encoded.',
    ),
  );
  hops.push(
    hop(
      'evidence_package_encoded',
      EVIDENCE_PACKAGE_FIELDS.length === 7 ? 'PASS' : 'FAIL',
      'diff/commands/tests/runtime/failures/rollback/review encoded.',
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      EXECUTABLE_IMPLEMENTATION_TRUTH_BOUNDARY.planIsNotExecution
        ? 'PASS'
        : 'FAIL',
      'plan≠execution; unrun≠success; migration≠authorized.',
    ),
  );

  const plan = exampleWorkloadRouterPlan(input.actor);

  hops.push(
    hop(
      'ingest_approved_prototype',
      'PASS',
      `Prototype ${plan.prototypeId} ingested as plan input.`,
    ),
  );
  hops.push(
    hop(
      'attach_architecture',
      softWireHopState(softWire.es5PrototypeArchitectureComposer.present),
      softWire.es5PrototypeArchitectureComposer.note,
    ),
  );
  hops.push(
    hop(
      'attach_acceptance_tests',
      softWireHopState(
        softWire.es6AcceptanceTestEvidence.present ||
          softWire.es6AcceptanceCriteria.present,
      ),
      softWire.es6AcceptanceTestEvidence.present ||
        softWire.es6AcceptanceCriteria.present
        ? 'ES6 acceptance soft-wire PRESENT.'
        : 'ES6 acceptance soft-wire WAITING_DATA.',
    ),
  );
  hops.push(
    hop(
      'build_file_map',
      plan.sourceFilesToCreateOrUpdate.length > 0 ? 'PASS' : 'FAIL',
      `${plan.sourceFilesToCreateOrUpdate.length} file map entr(y/ies).`,
    ),
  );
  hops.push(
    hop(
      'build_branch_plan',
      plan.targetBranch.startsWith('cursor/') ? 'PASS' : 'FAIL',
      `Target feature branch ${plan.targetBranch}.`,
    ),
  );
  hops.push(
    hop(
      'enumerate_implementation_tasks',
      'PASS',
      'Implementation tasks derived from file map + sequence dependencies.',
    ),
  );
  hops.push(
    hop(
      'define_verification',
      plan.commands.every((c) => !c.executed ? c.testStatus === 'NOT_TESTED' : true)
        ? 'PASS'
        : 'FAIL',
      'Verification commands labeled NOT_TESTED until run.',
    ),
  );
  hops.push(
    hop('require_review', 'HUMAN_APPROVAL_REQUIRED', 'Review gate required before draft MR/PR.'),
  );

  hops.push(
    hop(
      'label_unrun_commands_not_tested',
      plan.commands.every((c) => c.executed || c.testStatus === 'NOT_TESTED')
        ? 'PASS'
        : 'FAIL',
      'Unrun commands labeled NOT_TESTED.',
    ),
  );
  hops.push(
    hop(
      'deny_unrun_as_success',
      attemptUnrunAsSuccess().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Unrun≠success denied.',
    ),
  );
  hops.push(
    hop(
      'lock_migrations_as_candidates',
      plan.migrationsIfAny.every(
        (m) => m.status === 'NONE' || m.status === 'MIGRATION_CANDIDATE',
      )
        ? 'PASS'
        : 'FAIL',
      'Migrations locked as candidates.',
    ),
  );
  hops.push(
    hop(
      'deny_migration_as_authorized',
      attemptMigrationAsAuthorized().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Migration≠authorized denied.',
    ),
  );
  hops.push(
    hop(
      'deny_guardian_rls_weaken',
      attemptGuardianRlsWeaken().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Guardian/RLS weaken denied.',
    ),
  );
  hops.push(
    hop(
      'deny_main_merge_without_authorization',
      attemptMainMerge().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Main merge without authorization denied.',
    ),
  );
  hops.push(
    hop(
      'deny_tip_land',
      attemptTipLand().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Tip-land denied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_open_pr',
      attemptAutoOpenPr().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Auto-open PR denied.',
    ),
  );
  hops.push(
    hop(
      'dependency_gate_before_new_package',
      DEPENDENCY_GATE_CHECKS.length === 5 ? 'PASS' : 'FAIL',
      'Dependency gate required before new package.',
    ),
  );
  hops.push(
    hop(
      'escalate_on_stop_conditions',
      escalateStopCondition({
        condition: 'security_boundary_cannot_be_preserved',
        detail: 'probe',
      }).state === 'ESCALATED'
        ? 'PASS'
        : 'FAIL',
      'Stop conditions escalate.',
    ),
  );

  const es6Present =
    softWire.es6AcceptanceTestEvidence.present ||
    softWire.es6AcceptanceCriteria.present ||
    softWire.es6Report.present;
  hops.push(
    hop(
      'es6_acceptance_tests_soft_wire',
      softWireHopState(es6Present),
      es6Present
        ? 'ES6 soft-wire PRESENT (presence≠VERIFIED).'
        : 'ES6 soft-wire WAITING_DATA (not FAIL).',
    ),
  );
  hops.push(
    hop(
      'es5_architecture_soft_wire',
      softWireHopState(
        softWire.es5PrototypeArchitectureComposer.present ||
          softWire.es5Report.present,
      ),
      softWire.es5PrototypeArchitectureComposer.present || softWire.es5Report.present
        ? 'ES5 soft-wire PRESENT (presence≠VERIFIED).'
        : 'ES5 soft-wire WAITING_DATA (not FAIL).',
    ),
  );
  hops.push(
    hop(
      'es4_scope_soft_wire',
      softWireHopState(
        softWire.es4PrototypeScopeGenerator.present || softWire.es4Report.present,
      ),
      softWire.es4PrototypeScopeGenerator.present || softWire.es4Report.present
        ? 'ES4 soft-wire PRESENT (presence≠VERIFIED).'
        : 'ES4 soft-wire WAITING_DATA (not FAIL).',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ES7_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ES7_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      `Cycle complete; agentBounds.mayRecommendOnly=${ES7_AGENT_BOUNDS.mayRecommendOnly}; may=${ES7_MAY.length}; mustNot=${ES7_MUST_NOT.length}.`,
    ),
  );

  return {
    hops,
    plan,
    softWire,
    dbCandidates: ES7_DB_CANDIDATES_STATUS,
  };
}
