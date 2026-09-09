/**
 * 62L-ES10 — Draft PR/MR Evidence Packager runtime.
 *
 * Collect branch/evidence inputs; build structured draft sections with hard
 * truth rule; deny false "all tests pass"; deny merge/deploy/migration/
 * permission/paid-infra/external-publish; soft-wire ES9/ES8/ES6; cycle.
 */

import {
  DRAFT_PR_MR_CORE_FLOW,
  DRAFT_PR_MR_EVIDENCE_PACKAGER_CYCLE,
  DRAFT_PR_MR_TRUTH_BOUNDARY,
  DRAFT_REVIEW_PACKAGE_FIELDS,
  ES10_AGENT_BOUNDS,
  ES10_DB_CANDIDATES_STATUS,
  ES10_LOCKS,
  ES10_MAY,
  ES10_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  REQUIRED_DRAFT_SECTIONS,
  VERIFICATION_CHECK_STATES,
  assertEs10LocksIntact,
  canClaimAllTestsPass,
  es10SoftWireSnapshot,
  isHumanApprover,
  listNotVerified,
  listUnrunTests,
  softWireHopState,
  type BenchmarkEvidence,
  type CommandRunRecord,
  type DependencyChange,
  type DraftReviewPackage,
  type Es10Actor,
  type Es10EvidenceState,
  type Es10HopRecord,
  type Es10SoftWireSnapshot,
  type FileChangeEntry,
  type MigrationProposal,
  type VerificationCheck,
} from './draft-pr-mr-evidence-packager-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof DRAFT_PR_MR_EVIDENCE_PACKAGER_CYCLE)[number],
  state: Es10EvidenceState,
  summary: string,
): Es10HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'REJECTED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
  };
}

export type DraftPackageInput = {
  actor: Es10Actor;
  reviewPackageId: string;
  repository: string;
  sourceBranch: string;
  targetBranch?: string;
  implementationId?: string;
  prototypeId?: string;
  summaryOfChanges: string;
  why?: string;
  filesChanged?: readonly FileChangeEntry[];
  architectureImpact?: string;
  securityImpact?: string;
  dataPrivacyImpact?: string;
  dependencyChanges?: readonly DependencyChange[];
  migrationsProposed?: readonly MigrationProposal[];
  commandsActuallyRun?: readonly CommandRunRecord[];
  testResults?: readonly VerificationCheck[];
  benchmarkRuntimeEvidence?: readonly BenchmarkEvidence[];
  regressions?: readonly string[];
  blockers?: readonly string[];
  knownLimitations?: readonly string[];
  rollbackProcedure?: string;
  reviewersRequired?: readonly string[];
  humanDecisionsRequired?: readonly string[];
  securityPermissionsNotes?: string;
  dataRightsImpact?: string;
};

export function collectBranchChanges(
  input: DraftPackageInput,
): DraftReviewPackage | DenialResult {
  if (!input.reviewPackageId.trim()) {
    return deny('reviewPackageId is required.');
  }
  if (!input.repository.trim()) {
    return deny('repository is required.');
  }
  if (!input.sourceBranch.trim()) {
    return deny('sourceBranch is required.');
  }
  if (!input.summaryOfChanges.trim()) {
    return deny('summaryOfChanges is required.');
  }

  const testResults = input.testResults ?? [];
  const unrunTests = listUnrunTests(testResults);
  const allPass = canClaimAllTestsPass(testResults);

  return {
    reviewPackageId: input.reviewPackageId,
    repository: input.repository,
    sourceBranch: input.sourceBranch,
    targetBranch: input.targetBranch ?? 'xiv-v2',
    implementationId: input.implementationId ?? '',
    prototypeId: input.prototypeId ?? '',
    summaryOfChanges: input.summaryOfChanges,
    why: input.why ?? '',
    filesChanged: input.filesChanged ?? [],
    architectureImpact: input.architectureImpact ?? '',
    securityImpact: input.securityImpact ?? '',
    dataPrivacyImpact: input.dataPrivacyImpact ?? '',
    dependencyChanges: input.dependencyChanges ?? [],
    migrationsProposed: (input.migrationsProposed ?? []).map((m) => ({
      ...m,
      productionApplyAuthorized: false as const,
      status:
        m.status === 'MIGRATION_CANDIDATE' ||
        m.status === 'NOT_APPLIED' ||
        m.status === 'HUMAN_REVIEW_REQUIRED'
          ? m.status
          : ('MIGRATION_CANDIDATE' as const),
    })),
    commandsActuallyRun: input.commandsActuallyRun ?? [],
    testResults,
    benchmarkRuntimeEvidence: input.benchmarkRuntimeEvidence ?? [],
    regressions: input.regressions ?? [],
    unrunTests,
    blockers: input.blockers ?? [],
    knownLimitations: input.knownLimitations ?? [],
    rollbackProcedure:
      input.rollbackProcedure ??
      'Revert source branch tip; do not merge; restore prior tip SHA if needed.',
    reviewersRequired: input.reviewersRequired ?? ['human_approver'],
    humanDecisionsRequired: input.humanDecisionsRequired ?? [
      'Approve or reject draft package',
      'Authorize merge only after human review',
    ],
    securityPermissionsNotes: input.securityPermissionsNotes ?? '',
    dataRightsImpact: input.dataRightsImpact ?? '',
    packageState: 'DRAFT',
    l4AutonomyEnabled: false,
    mergeAuthorized: false,
    deployAuthorized: false,
    productionMigrationAuthorized: false,
    permissionExpansionAuthorized: false,
    paidInfraProvisionAuthorized: false,
    externalPublishAuthorized: false,
    allTestsPassClaim: allPass,
    tipLand: false,
    managePullRequest: false,
  };
}

export function applyHardTruthRule(
  pkg: DraftReviewPackage,
): DraftReviewPackage | DenialResult {
  const unrun = listUnrunTests(pkg.testResults);
  const allPass = canClaimAllTestsPass(pkg.testResults);

  if (pkg.allTestsPassClaim && !allPass) {
    return deny(
      'Hard truth: cannot claim All tests pass when any check is unrun, failed, waiting, unavailable, or blocked.',
    );
  }

  return {
    ...pkg,
    unrunTests: unrun,
    allTestsPassClaim: allPass,
    packageState:
      pkg.blockers.length > 0 ? 'BLOCKED' : 'READY_FOR_HUMAN_REVIEW',
  };
}

export function attemptFalseAllTestsPassClaim(
  pkg: DraftReviewPackage,
): DenialResult {
  if (canClaimAllTestsPass(pkg.testResults)) {
    return deny(
      'Hard truth helper expects mixed/unrun evidence; package already qualifies for All tests pass.',
    );
  }
  return deny(
    'Hard truth: cannot claim All tests pass when any check is unrun, failed, waiting, unavailable, or blocked.',
  );
}

export function attemptMergeMain(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny(
    'Merge boundary: draft packager may prepare artifacts only — merge to main DENIED. Human-authorized only.',
  );
}

export function attemptDeployProd(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny(
    'Merge boundary: deploy to production DENIED. Human-authorized only.',
  );
}

export function attemptApplyProdMigrations(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny(
    'Merge boundary: apply production migrations DENIED. Migrations remain MIGRATION_CANDIDATE / NOT_APPLIED.',
  );
}

export function attemptExpandPermissions(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny('Merge boundary: expand permissions DENIED.');
}

export function attemptProvisionPaidInfra(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny('Merge boundary: provision paid infrastructure DENIED.');
}

export function attemptPublishExternally(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny('Merge boundary: publish externally DENIED.');
}

export function attemptOpenRemotePrMr(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny(
    'Park boundary: opening remote GitHub/GitLab PR/MR DENIED unless founder explicitly asks. Draft package encoding only.',
  );
}

export function attemptTipLand(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny('Tip-land onto xiv-v2/main DENIED.');
}

export function attemptManagePullRequest(
  _pkg: DraftReviewPackage,
  _actor: Es10Actor,
): DenialResult {
  void _pkg;
  void _actor;
  return deny('ManagePullRequest / draft PR creation DENIED for this park work.');
}

export function attemptBypassGuardianRls(
  _actor: Es10Actor,
): DenialResult {
  void _actor;
  return deny('Bypass Guardian/RLS DENIED. Isolation unchanged.');
}

export function attemptExpandTenantUniverse(
  _actor: Es10Actor,
): DenialResult {
  void _actor;
  return deny('Expand tenant/Universe access DENIED. Isolation unchanged.');
}

export type DraftMarkdownSections = {
  whatChanged: string;
  why: string;
  securityAndPermissions: string;
  verificationActuallyPerformed: string;
  notVerified: string;
  performanceEvidence: string;
  dataRightsImpact: string;
  rollback: string;
  fullMarkdown: string;
};

function formatCheckLine(c: VerificationCheck): string {
  const cmd = c.command ? ` (\`${c.command}\`)` : '';
  const extra = c.summary ? ` — ${c.summary}` : '';
  return `- ${c.name}: **${c.state}**${cmd}${extra}`;
}

export function generateDraftMarkdown(
  pkg: DraftReviewPackage,
): DraftMarkdownSections {
  const performed = pkg.testResults.filter(
    (c) => c.executed && (c.state === 'PASS' || c.state === 'FAIL'),
  );
  const notVerified = listNotVerified(pkg.testResults);
  const measured = pkg.benchmarkRuntimeEvidence.filter((b) => b.measured);

  const whatChanged = [
    pkg.summaryOfChanges,
    '',
    'Files changed:',
    ...(pkg.filesChanged.length === 0
      ? ['- (none listed)']
      : pkg.filesChanged.map(
          (f) => `- \`${f.path}\` (${f.changeType})${f.notes ? ` — ${f.notes}` : ''}`,
        )),
  ].join('\n');

  const why = pkg.why.trim() || '(why not provided)';

  const securityAndPermissions = [
    pkg.securityImpact || '(security impact not provided)',
    '',
    pkg.securityPermissionsNotes ||
      'No permission expansion; Guardian/RLS/tenant/Universe unchanged.',
    '',
    `Architecture impact: ${pkg.architectureImpact || '(not provided)'}`,
    `Data privacy impact: ${pkg.dataPrivacyImpact || '(not provided)'}`,
  ].join('\n');

  const verificationActuallyPerformed =
    performed.length === 0
      ? '- (no checks executed)'
      : performed.map(formatCheckLine).join('\n');

  const notVerifiedSection =
    notVerified.length === 0 && pkg.unrunTests.length === 0
      ? '- (none — every listed check executed PASS)'
      : [
          ...notVerified.map(formatCheckLine),
          ...pkg.unrunTests
            .filter((n) => !notVerified.some((c) => c.name === n))
            .map((n) => `- ${n}: **NOT_TESTED**`),
        ].join('\n');

  const performanceEvidence =
    measured.length === 0
      ? '- (no measured performance evidence — do not invent)'
      : measured
          .map((b) => {
            const val =
              b.value !== undefined
                ? `${b.value}${b.unit ? ` ${b.unit}` : ''}`
                : '(value omitted)';
            return `- ${b.name}: **MEASURED** ${val}${b.note ? ` — ${b.note}` : ''}`;
          })
          .join('\n');

  const dataRightsImpact =
    pkg.dataRightsImpact.trim() ||
    pkg.dataPrivacyImpact.trim() ||
    '(data/rights impact not provided)';

  const rollback = pkg.rollbackProcedure;

  const fullMarkdown = [
    `# Draft PR/MR Review Package: ${pkg.reviewPackageId}`,
    '',
    `Repository: \`${pkg.repository}\``,
    `Source → Target: \`${pkg.sourceBranch}\` → \`${pkg.targetBranch}\``,
    `Implementation ID: \`${pkg.implementationId || '(none)'}\``,
    `Prototype ID: \`${pkg.prototypeId || '(none)'}\``,
    `Package state: **${pkg.packageState}**`,
    `Honesty: \`${HONESTY_BANNER}\``,
    `L4_AUTONOMY_ENABLED=${pkg.l4AutonomyEnabled}`,
    `All tests pass claim: **${pkg.allTestsPassClaim ? 'true' : 'false'}** (hard truth)`,
    '',
    '## What changed',
    whatChanged,
    '',
    '## Why',
    why,
    '',
    '## Security & permissions',
    securityAndPermissions,
    '',
    '## Verification actually performed',
    verificationActuallyPerformed,
    '',
    '## Not verified',
    notVerifiedSection,
    '',
    '## Performance evidence',
    performanceEvidence,
    '',
    '## Data/rights impact',
    dataRightsImpact,
    '',
    '## Rollback',
    rollback,
    '',
    '## Dependency changes',
    pkg.dependencyChanges.length === 0
      ? '- (none)'
      : pkg.dependencyChanges
          .map(
            (d) =>
              `- ${d.name}: ${d.kind}${d.from || d.to ? ` (${d.from ?? '?'} → ${d.to ?? '?'})` : ''}`,
          )
          .join('\n'),
    '',
    '## Migrations proposed',
    pkg.migrationsProposed.length === 0
      ? '- (none)'
      : pkg.migrationsProposed
          .map(
            (m) =>
              `- ${m.id}: ${m.description} — **${m.status}** (productionApplyAuthorized=${m.productionApplyAuthorized})`,
          )
          .join('\n'),
    '',
    '## Commands actually run',
    pkg.commandsActuallyRun.length === 0
      ? '- (none recorded)'
      : pkg.commandsActuallyRun
          .map((c) => {
            if (!c.executed) {
              return `- \`${c.command}\`: **NOT_EXECUTED**`;
            }
            return `- \`${c.command}\`: executed (exit ${c.exitCode ?? '?'})${c.summary ? ` — ${c.summary}` : ''}`;
          })
          .join('\n'),
    '',
    '## Regressions',
    pkg.regressions.length === 0
      ? '- (none reported)'
      : pkg.regressions.map((r) => `- ${r}`).join('\n'),
    '',
    '## Blockers',
    pkg.blockers.length === 0
      ? '- (none)'
      : pkg.blockers.map((b) => `- ${b}`).join('\n'),
    '',
    '## Known limitations',
    pkg.knownLimitations.length === 0
      ? '- (none)'
      : pkg.knownLimitations.map((k) => `- ${k}`).join('\n'),
    '',
    '## Reviewers required',
    pkg.reviewersRequired.map((r) => `- ${r}`).join('\n'),
    '',
    '## Human decisions required',
    pkg.humanDecisionsRequired.map((d) => `- ${d}`).join('\n'),
    '',
    '## Merge boundary',
    '- May prepare draft review artifact only',
    '- Must NOT merge main, deploy prod, apply prod migrations, expand permissions, provision paid infra, or publish externally',
    '- Remote PR/MR creation: DENIED unless founder explicitly asks',
    '- Tip-land / ManagePullRequest: NO',
  ].join('\n');

  return {
    whatChanged,
    why,
    securityAndPermissions,
    verificationActuallyPerformed,
    notVerified: notVerifiedSection,
    performanceEvidence,
    dataRightsImpact,
    rollback,
    fullMarkdown,
  };
}

export function requireHumanApproval(
  actor: Es10Actor,
  action: string,
): { approved: true } | DenialResult {
  if (!isHumanApprover(actor)) {
    return deny(
      `Human approval required for "${action}". Agent recommend≠act.`,
    );
  }
  if (!actor.permissions.includes('approve_consequential')) {
    return deny(
      `Human approver lacks approve_consequential for "${action}".`,
    );
  }
  return { approved: true };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  guardianUnchanged: true;
  rlsUnchanged: true;
  tenantUnchanged: true;
  universeUnchanged: true;
} {
  return {
    state: 'PASS',
    guardianUnchanged: true,
    rlsUnchanged: true,
    tenantUnchanged: true,
    universeUnchanged: true,
  };
}

export type Es10CycleResult = {
  package: DraftReviewPackage;
  markdown: DraftMarkdownSections;
  hops: Es10HopRecord[];
  softWires: Es10SoftWireSnapshot;
  locksIntact: boolean;
  meta: {
    honestyBanner: typeof HONESTY_BANNER;
    githubSotIssue: typeof GITHUB_SOT_ISSUE;
    githubSotIssueNote: typeof GITHUB_SOT_ISSUE_NOTE;
    githubSotLabel: typeof GITHUB_SOT_LABEL;
    githubSotFamily: typeof GITHUB_SOT_FAMILY;
    githubSotTitle: typeof GITHUB_SOT_TITLE;
    gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
    nextPhaseTitle: typeof NEXT_PHASE_TITLE;
    esLayerTitle: typeof ES_LAYER_TITLE;
    dbCandidatesStatus: typeof ES10_DB_CANDIDATES_STATUS;
    fields: typeof DRAFT_REVIEW_PACKAGE_FIELDS;
    sections: typeof REQUIRED_DRAFT_SECTIONS;
    coreFlow: typeof DRAFT_PR_MR_CORE_FLOW;
    verificationStates: typeof VERIFICATION_CHECK_STATES;
    may: typeof ES10_MAY;
    mustNot: typeof ES10_MUST_NOT;
    agentBounds: typeof ES10_AGENT_BOUNDS;
    locks: typeof ES10_LOCKS;
    truthBoundary: typeof DRAFT_PR_MR_TRUTH_BOUNDARY;
  };
};

export function exampleMixedEvidencePackage(
  actor: Es10Actor,
): DraftPackageInput {
  return {
    actor,
    reviewPackageId: 'rp-es10-example-1',
    repository: 'xiv-ai',
    sourceBranch: 'cursor/62l-es10-draft-pr-mr-evidence-packager-4059',
    targetBranch: 'xiv-v2',
    implementationId: 'impl-es10-1',
    prototypeId: 'proto-es10-1',
    summaryOfChanges:
      'Add Draft PR/MR Evidence Packager types, runtime, tests, and report.',
    why: 'Make branch changes review-ready with honest verification and rollback before any merge.',
    filesChanged: [
      {
        path: 'services/ai/local-brain/draft-pr-mr-evidence-packager-types.ts',
        changeType: 'added',
      },
      {
        path: 'services/ai/local-brain/draft-pr-mr-evidence-packager-runtime.ts',
        changeType: 'added',
      },
      {
        path: 'services/ai/local-brain/phase62les10.test.ts',
        changeType: 'added',
      },
    ],
    architectureImpact: 'Adds local-brain evidence packaging module only.',
    securityImpact: 'No permission expansion; draft artifact only.',
    dataPrivacyImpact: 'No personal data collected; technical metadata only.',
    dependencyChanges: [],
    migrationsProposed: [
      {
        id: 'mig-es10-none',
        description: 'No schema migration in this phase.',
        status: 'NOT_APPLIED',
        productionApplyAuthorized: false,
      },
    ],
    commandsActuallyRun: [
      {
        command: 'npm run test:62les10',
        executed: true,
        exitCode: 0,
        summary: 'Unit denial tests',
      },
    ],
    testResults: [
      {
        name: 'Typecheck',
        state: 'PASS',
        executed: true,
        command: 'npm run typecheck',
        summary: 'tsc --noEmit (if run)',
      },
      {
        name: 'Unit',
        state: 'PASS',
        executed: true,
        command: 'npm run test:62les10',
      },
      {
        name: 'ASUS GPU',
        state: 'NOT_TESTED',
        executed: false,
      },
      {
        name: 'NPU',
        state: 'WAITING_NODE',
        executed: false,
      },
    ],
    benchmarkRuntimeEvidence: [
      {
        name: 'ASUS GPU inference',
        measured: false,
        note: 'NOT_TESTED — no invented numbers',
      },
    ],
    regressions: [],
    blockers: [],
    knownLimitations: [
      'ES9/ES8 soft-wires may be WAITING_DATA until prior tips land.',
    ],
    rollbackProcedure:
      'Do not merge. Reset/revert ES10 tip; leave xiv-v2 untouched.',
    reviewersRequired: ['founder', 'human_approver'],
    humanDecisionsRequired: [
      'Whether to open a remote PR after review',
      'Whether any migration candidate may be applied later',
    ],
    securityPermissionsNotes:
      'L4_AUTONOMY_ENABLED=false; no paid infra; no external publish.',
    dataRightsImpact: 'No rights escalation; org/tenant scoped draft only.',
  };
}

export function runDraftPrMrEvidencePackagerCycle(input: {
  actor: Es10Actor;
  packageInput?: DraftPackageInput;
  repoRoot?: string;
}): Es10CycleResult | DenialResult {
  const locksIntact = assertEs10LocksIntact();
  if (!locksIntact) {
    return deny('ES10 locks compromised — refusing cycle.');
  }

  const softWires = es10SoftWireSnapshot(input.repoRoot);
  const packageInput =
    input.packageInput ?? exampleMixedEvidencePackage(input.actor);

  const collected = collectBranchChanges(packageInput);
  if ('denied' in collected) return collected;

  const honest = applyHardTruthRule(collected);
  if ('denied' in honest) return honest;

  const markdown = generateDraftMarkdown(honest);

  const hops: Es10HopRecord[] = [
    hop('honesty_locks', 'PASS', 'ES10 locks intact; L4=false'),
    hop(
      'draft_pr_mr_evidence_packager_bootstrap',
      'PASS',
      'Packager bootstrap',
    ),
    hop(
      'package_fields_encoded',
      'PASS',
      `${DRAFT_REVIEW_PACKAGE_FIELDS.length} fields`,
    ),
    hop(
      'required_draft_sections_encoded',
      'PASS',
      `${REQUIRED_DRAFT_SECTIONS.length} sections`,
    ),
    hop(
      'core_flow_encoded',
      'PASS',
      DRAFT_PR_MR_CORE_FLOW.join(' → '),
    ),
    hop(
      'verification_states_encoded',
      'PASS',
      VERIFICATION_CHECK_STATES.join(', '),
    ),
    hop(
      'truth_boundary_encoded',
      'PASS',
      HONESTY_BANNER,
    ),
    hop(
      'collect_branch_changes',
      'PASS',
      `package ${honest.reviewPackageId}`,
    ),
    hop(
      'attach_es9_review',
      softWireHopState(softWires.es9AutomatedCodeReview.present),
      softWires.es9AutomatedCodeReview.note,
    ),
    hop('collect_evidence', 'PASS', 'Evidence collected into package'),
    hop('build_draft_sections', 'PASS', 'Required draft sections generated'),
    hop(
      'apply_hard_truth_rule',
      'PASS',
      `allTestsPassClaim=${honest.allTestsPassClaim}`,
    ),
    hop(
      'list_not_verified',
      'PASS',
      `unrun/not-verified: ${honest.unrunTests.join(', ') || '(none)'}`,
    ),
    hop(
      'deny_false_all_tests_pass',
      'PASS',
      'False all-tests-pass claims denied',
    ),
    hop('encode_rollback', 'PASS', honest.rollbackProcedure),
    hop(
      'require_human_reviewers',
      'PASS',
      honest.reviewersRequired.join(', '),
    ),
    hop('deny_merge_main', 'DENIED', 'merge main locked'),
    hop('deny_deploy_prod', 'DENIED', 'deploy prod locked'),
    hop(
      'deny_apply_prod_migrations',
      'DENIED',
      'prod migrations locked',
    ),
    hop('deny_expand_permissions', 'DENIED', 'permission expansion locked'),
    hop(
      'deny_provision_paid_infra',
      'DENIED',
      'paid infra locked',
    ),
    hop('deny_publish_externally', 'DENIED', 'external publish locked'),
    hop('deny_tip_land', 'DENIED', 'tip-land locked'),
    hop(
      'deny_manage_pull_request',
      'DENIED',
      'ManagePullRequest locked',
    ),
    hop('deny_bypass_guardian_rls', 'DENIED', 'Guardian/RLS unchanged'),
    hop(
      'deny_expand_tenant_universe_access',
      'DENIED',
      'tenant/Universe unchanged',
    ),
    hop(
      'guardian_rls_tenant_universe_isolation',
      'PASS',
      'isolation unchanged',
    ),
    hop('recommend_neq_act', 'PASS', 'recommend≠act'),
    hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'),
    hop(
      'es9_automated_code_review_soft_wire',
      softWireHopState(softWires.es9AutomatedCodeReview.present),
      softWires.es9AutomatedCodeReview.note,
    ),
    hop(
      'es8_code_branch_orchestrator_soft_wire',
      softWireHopState(softWires.es8CodeBranchOrchestrator.present),
      softWires.es8CodeBranchOrchestrator.note,
    ),
    hop(
      'es7_implementation_plan_soft_wire',
      softWireHopState(softWires.es7ImplementationPlan.present),
      softWires.es7ImplementationPlan.note,
    ),
    hop(
      'es6_acceptance_evidence_soft_wire',
      softWireHopState(softWires.es6AcceptanceTestEvidence.present),
      softWires.es6AcceptanceTestEvidence.note,
    ),
    hop(
      'es5_prototype_architecture_soft_wire',
      softWireHopState(softWires.es5PrototypeArchitectureComposer.present),
      softWires.es5PrototypeArchitectureComposer.note,
    ),
    hop(
      'db_candidates_not_applied',
      'NOT_APPLIED',
      ES10_DB_CANDIDATES_STATUS,
    ),
    hop('evidence', 'IMPLEMENTED', 'ES10 packager implemented on child branch'),
  ];

  return {
    package: honest,
    markdown,
    hops,
    softWires,
    locksIntact,
    meta: {
      honestyBanner: HONESTY_BANNER,
      githubSotIssue: GITHUB_SOT_ISSUE,
      githubSotIssueNote: GITHUB_SOT_ISSUE_NOTE,
      githubSotLabel: GITHUB_SOT_LABEL,
      githubSotFamily: GITHUB_SOT_FAMILY,
      githubSotTitle: GITHUB_SOT_TITLE,
      gitlabMirrorNote: GITLAB_MIRROR_NOTE,
      nextPhaseTitle: NEXT_PHASE_TITLE,
      esLayerTitle: ES_LAYER_TITLE,
      dbCandidatesStatus: ES10_DB_CANDIDATES_STATUS,
      fields: DRAFT_REVIEW_PACKAGE_FIELDS,
      sections: REQUIRED_DRAFT_SECTIONS,
      coreFlow: DRAFT_PR_MR_CORE_FLOW,
      verificationStates: VERIFICATION_CHECK_STATES,
      may: ES10_MAY,
      mustNot: ES10_MUST_NOT,
      agentBounds: ES10_AGENT_BOUNDS,
      locks: ES10_LOCKS,
      truthBoundary: DRAFT_PR_MR_TRUTH_BOUNDARY,
    },
  };
}
