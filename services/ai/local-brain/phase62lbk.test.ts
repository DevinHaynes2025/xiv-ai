import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptSwallowSpecializedBranch,
  declareSuperbrainRoot,
  listCoexistenceBranches,
  registerSpecializedBranch,
} from './superbrain-coexistence-fabric';
import {
  attemptAuthorityTransfer,
  collectWorkcellResult,
  createDispatchPlan,
  detectFileConflicts,
  reconcileWorkcellResults,
} from './agent-branching-orchestrator';
import {
  contractAllowsIntegrationCandidate,
  sealExecutionContract,
} from './cross-platform-execution-contracts';
import {
  defaultUnconfiguredMesh,
  probeCodingMeshEnvironment,
  createUniversalWorkEnvelope,
  validateUniversalWorkEnvelope,
} from './universal-work-envelope';
import {
  AUTHORITY_TRANSFER_DENIED,
  BK_LOCKS,
  CONFLICT_DISPATCH_BLOCKED,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NON_FOUNDER_GOAL_DENIED,
  RECONCILE_REQUIRED,
  SPECIALIZED_COEXISTENCE_BRANCHES,
  SUPERBRAIN_COEXISTENCE_CYCLE,
  SWALLOW_DENIED,
  bj191kGateStatus,
  predecessorMap,
  type BkActor,
  type FounderGoal,
} from './superbrain-coexistence-types';
import {
  buildSuperbrainCoexistenceHealthReport,
  runSuperbrainCoexistenceCycle,
} from './superbrain-coexistence-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbk-'));
const tenantId = '62lbk-tenant';
const universeId = '62lbk-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const agentA: BkActor = {
  kind: 'specialized_agent',
  id: 'agent-alpha',
  tenantId,
  universeId,
  role: 'coder',
  authorityLevel: 1,
};

const agentB: BkActor = {
  kind: 'specialized_agent',
  id: 'agent-beta',
  tenantId,
  universeId,
  role: 'tester',
  authorityLevel: 1,
};

try {
  check(
    'US-BK1-cycle',
    SUPERBRAIN_COEXISTENCE_CYCLE.join(' → ') ===
      'superbrain_root_declare → coexistence_registry_bind → specialized_branch_register → swallow_guard → work_envelope_validate → environment_mesh_probe → founder_goal_gate → agent_select → file_conflict_detect → dispatch_or_deny → workcell_collect → reconcile_before_integrate → integration_candidate_gate → authority_non_transfer → universe_isolation → execution_contract_seal → evidence → learning',
    'Superbrain coexistence + coding mesh + orchestrator cycle recorded in order.',
  );

  check(
    'US-BK-locks',
    BK_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BK_LOCKS.TIP_LAND === false &&
      BK_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BK_LOCKS.DRAFT_PR === false &&
      BK_LOCKS.SWALLOW_SPECIALIZED_BRANCHES === false &&
      BK_LOCKS.AUTHORITY_TRANSFER_BETWEEN_AGENTS === false &&
      BK_LOCKS.INTEGRATION_WITHOUT_RECONCILE === false &&
      BK_LOCKS.LIVE_SUPABASE_APPLY === false &&
      BK_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
      HONESTY_BANNER.includes('DOCUMENTED') &&
      GITHUB_SOT_ISSUE === 75 &&
      GITLAB_COORDINATION_ISSUE === 9,
    'Honesty locks + GitHub #75 SoT + GitLab #9 coordination citations hold.',
  );

  // --- Required: Unconfigured environment → UNAVAILABLE ---
  const unconfigured = defaultUnconfiguredMesh();
  check(
    'US-BK-unconfigured-UNAVAILABLE',
    unconfigured.length === 7 &&
      unconfigured.every((p) => p.state === 'UNAVAILABLE' && p.configured === false),
    'All default coding-mesh environments are UNAVAILABLE when unconfigured.',
  );

  const githubConfiguredOnly = probeCodingMeshEnvironment({
    id: 'github',
    configured: true,
    authorized: false,
    verified: false,
  });
  check(
    'US-BK-partial-CAV-UNAVAILABLE',
    githubConfiguredOnly.state === 'UNAVAILABLE',
    'Configured-but-not-authorized/verified environment remains UNAVAILABLE.',
  );

  // --- Required: Conflict detected → dispatch blocked ---
  const conflictScan = detectFileConflicts([
    { agentId: 'agent-alpha', path: 'services/ai/local-brain/a.ts', workcellId: 'wc1' },
    { agentId: 'agent-beta', path: 'services/ai/local-brain/a.ts', workcellId: 'wc2' },
  ]);
  check(
    'US-BK-conflict-blocks-dispatch',
    conflictScan.blocked === true && conflictScan.reason === CONFLICT_DISPATCH_BLOCKED,
    'Overlapping file claims block dispatch before work starts.',
  );

  const probesWithLocal = defaultUnconfiguredMesh().map((p) =>
    p.id === 'cursor_local_workcell'
      ? probeCodingMeshEnvironment({
          id: 'cursor_local_workcell',
          configured: true,
          authorized: true,
          verified: true,
        })
      : p,
  );

  const conflictGoal: FounderGoal = {
    id: 'goal-conflict',
    title: 'Conflict demo',
    description: 'Two agents claim same file',
    founderApproved: true,
    tenantId,
    universeId,
    requestedFiles: ['services/ai/local-brain/shared.ts'],
    preferredEnvironments: ['cursor_local_workcell'],
  };
  const conflictPlan = createDispatchPlan({
    goal: conflictGoal,
    agents: [agentA, agentB],
    probes: probesWithLocal,
    forceOverlappingClaims: true,
  });
  check(
    'US-BK-conflict-plan-denied',
    conflictPlan.plan.dispatched === false &&
      conflictPlan.plan.deniedReason === CONFLICT_DISPATCH_BLOCKED &&
      conflictPlan.conflictScan.blocked === true,
    'Orchestrator refuses dispatch when forced overlapping claims exist.',
  );

  // --- Required: Non–founder-approved goal → DENIED ---
  const deniedGoal: FounderGoal = {
    id: 'goal-denied',
    title: 'Unauthorized',
    description: 'Not founder approved',
    founderApproved: false,
    tenantId,
    universeId,
    requestedFiles: ['x.ts'],
    preferredEnvironments: ['cursor_local_workcell'],
  };
  const deniedPlan = createDispatchPlan({
    goal: deniedGoal,
    agents: [agentA],
    probes: probesWithLocal,
  });
  check(
    'US-BK-non-founder-DENIED',
    deniedPlan.plan.dispatched === false &&
      deniedPlan.plan.deniedReason === NON_FOUNDER_GOAL_DENIED,
    'Non–founder-approved goals are DENIED before dispatch.',
  );

  const envelope = createUniversalWorkEnvelope({
    id: 'env-denied',
    tenantId,
    universeId,
    goalId: 'goal-denied',
    objective: 'nope',
    founderApproved: false,
  });
  const envelopeValidation = validateUniversalWorkEnvelope(envelope);
  check(
    'US-BK-envelope-non-founder',
    envelopeValidation.accepted === false && envelopeValidation.state === 'DENIED',
    'Universal work envelope rejects non–founder-approved goals.',
  );

  // --- Required: Workcell result without reconcile → not integration candidate ---
  const collected = collectWorkcellResult({
    workcellId: 'wc-solo',
    agentId: agentA.id,
    environmentId: 'cursor_local_workcell',
    filesTouched: ['services/ai/local-brain/solo.ts'],
    testsPassed: true,
    evidenceRefs: ['ev-1'],
    codeSummary: 'draft',
  });
  check(
    'US-BK-collect-not-candidate',
    collected.reconciled === false && collected.integrationCandidate === false,
    'Fresh workcell collection is not an integration candidate.',
  );

  const skipped = reconcileWorkcellResults([collected], { skipReconcile: true });
  check(
    'US-BK-without-reconcile-not-candidate',
    skipped.reconciled === false &&
      skipped.integrationCandidate === false &&
      skipped.reason === RECONCILE_REQUIRED &&
      skipped.contracts.every((c) => c.status === 'NOT_INTEGRATION_CANDIDATE') &&
      skipped.contracts.every((c) => !contractAllowsIntegrationCandidate(c)),
    'Skipping reconcile keeps results NOT_INTEGRATION_CANDIDATE.',
  );

  // Forced seal attempt without reconcile flags must collapse to NOT_INTEGRATION_CANDIDATE
  const forced = sealExecutionContract({
    status: 'INTEGRATION_CANDIDATE',
    artifact: { ...collected, reconciled: false, integrationCandidate: true },
    reason: 'attempt forced candidate',
  });
  check(
    'US-BK-forced-candidate-collapsed',
    forced.status === 'NOT_INTEGRATION_CANDIDATE' &&
      !contractAllowsIntegrationCandidate(forced),
    'Execution contract collapses unreconciled INTEGRATION_CANDIDATE attempts.',
  );

  // Happy path: no conflict + reconcile → integration candidate (still ≠ production)
  const happyGoal: FounderGoal = {
    id: 'goal-happy',
    title: 'Happy path',
    description: 'Partitioned files',
    founderApproved: true,
    tenantId,
    universeId,
    requestedFiles: [
      'services/ai/local-brain/alpha.ts',
      'services/ai/local-brain/beta.ts',
    ],
    preferredEnvironments: ['cursor_local_workcell'],
  };
  const happyPlan = createDispatchPlan({
    goal: happyGoal,
    agents: [agentA, agentB],
    probes: probesWithLocal,
  });
  check(
    'US-BK-happy-dispatch',
    happyPlan.plan.dispatched === true && happyPlan.conflictScan.blocked === false,
    'Partitioned file claims allow dispatch.',
  );
  const happyResults = happyPlan.plan.workcells.map((cell) =>
    collectWorkcellResult({
      workcellId: cell.workcellId,
      agentId: cell.agentId,
      environmentId: cell.environmentId,
      filesTouched: cell.files,
      testsPassed: true,
      evidenceRefs: [`ev-${cell.workcellId}`],
      codeSummary: 'ok',
    }),
  );
  const happyReconcile = reconcileWorkcellResults(happyResults);
  check(
    'US-BK-reconcile-candidate',
    happyReconcile.reconciled === true &&
      happyReconcile.integrationCandidate === true &&
      happyReconcile.contracts.every((c) => c.honesty.productionAuthorization === false) &&
      happyReconcile.contracts.every((c) => c.honesty.dbCandidateApplied === false),
    'Reconciled results may become integration candidates; production still unauthorized; DB NOT_APPLIED.',
  );

  // --- Required: Coexistence — specialized branch registered without delete/swallow ---
  await declareSuperbrainRoot(root);
  const reg = await registerSpecializedBranch(root, 'research_civilization');
  const swallow = await attemptSwallowSpecializedBranch(root, 'research_civilization');
  const listed = await listCoexistenceBranches(root);
  const research = listed.find((b) => b.id === 'research_civilization');
  check(
    'US-BK-coexistence-no-swallow',
    reg.accepted === true &&
      swallow.denied === true &&
      swallow.reason === SWALLOW_DENIED &&
      swallow.swallowed === false &&
      swallow.deleted === false &&
      research !== undefined &&
      research.swallowed === false &&
      research.deleted === false &&
      research.adapterOnly === true,
    'Specialized branch remains registered; swallow/delete denied.',
  );

  check(
    'US-BK-all-specialized-ids',
    SPECIALIZED_COEXISTENCE_BRANCHES.length === 9,
    'Nine specialized coexistence branches are declared under Superbrain root.',
  );

  // Authority non-transfer
  const transfer = attemptAuthorityTransfer(agentA, agentB);
  check(
    'US-BK-authority-non-transfer',
    transfer.denied === true &&
      transfer.authorityTransferred === false &&
      transfer.reason === AUTHORITY_TRANSFER_DENIED,
    'Agents cannot transfer authority to one another.',
  );

  // Full cycle: founder approved + configured local + reconcile
  const cycle = await runSuperbrainCoexistenceCycle({
    tenantId,
    universeId,
    actor: agentA,
    peer: agentB,
    configureCursorLocal: true,
    goal: {
      id: 'goal-cycle',
      title: 'Cycle run',
      description: 'Full BK cycle',
      founderApproved: true,
      tenantId,
      universeId,
      requestedFiles: ['a.ts', 'b.ts'],
      preferredEnvironments: ['cursor_local_workcell'],
    },
    root,
  });
  check(
    'US-BK-cycle-hops',
    cycle.hops.length === SUPERBRAIN_COEXISTENCE_CYCLE.length &&
      cycle.productionAuthorization === false &&
      cycle.tipLand === false &&
      cycle.registryBranches.every((b) => b.swallowed === false && b.deleted === false),
    'Full cycle walks all hops; production unauthorized; branches not swallowed.',
  );

  // Cycle: non-founder denied
  const deniedCycle = await runSuperbrainCoexistenceCycle({
    tenantId,
    universeId,
    actor: agentA,
    peer: agentB,
    configureCursorLocal: true,
    goal: {
      id: 'goal-cycle-denied',
      title: 'Denied cycle',
      description: 'Should deny',
      founderApproved: false,
      tenantId,
      universeId,
      requestedFiles: ['z.ts'],
      preferredEnvironments: ['cursor_local_workcell'],
    },
    root,
  });
  const founderHop = deniedCycle.hops.find((h) => h.hop === 'founder_goal_gate');
  check(
    'US-BK-cycle-non-founder',
    founderHop?.state === 'DENIED' && deniedCycle.dispatch.dispatched === false,
    'Cycle DENIES non–founder-approved goals.',
  );

  // Cycle: skip reconcile → not integration candidate
  const skipCycle = await runSuperbrainCoexistenceCycle({
    tenantId,
    universeId,
    actor: agentA,
    peer: agentB,
    configureCursorLocal: true,
    skipReconcile: true,
    goal: {
      id: 'goal-skip-reconcile',
      title: 'Skip reconcile',
      description: 'Collect without reconcile',
      founderApproved: true,
      tenantId,
      universeId,
      requestedFiles: ['only-a.ts'],
      preferredEnvironments: ['cursor_local_workcell'],
      preferredAgents: [agentA.id],
    },
    root,
  });
  const integrateHop = skipCycle.hops.find((h) => h.hop === 'integration_candidate_gate');
  check(
    'US-BK-cycle-skip-reconcile',
    skipCycle.reconcile.integrationCandidate === false &&
      integrateHop?.state === 'DENIED' &&
      skipCycle.contracts.every((c) => c.status === 'NOT_INTEGRATION_CANDIDATE'),
    'Cycle without reconcile does not produce integration candidates.',
  );

  // Unconfigured mesh in cycle: dispatch denied (no AVAILABLE env)
  const unavailCycle = await runSuperbrainCoexistenceCycle({
    tenantId,
    universeId,
    actor: agentA,
    configureCursorLocal: false,
    goal: {
      id: 'goal-unavail',
      title: 'No envs',
      description: 'All unavailable',
      founderApproved: true,
      tenantId,
      universeId,
      requestedFiles: ['x.ts'],
      preferredEnvironments: ['github'],
    },
    root,
  });
  check(
    'US-BK-cycle-unconfigured-dispatch',
    unavailCycle.probes.every((p) => p.state === 'UNAVAILABLE') &&
      unavailCycle.dispatch.dispatched === false,
    'Unconfigured environments stay UNAVAILABLE and block dispatch.',
  );

  const health = await buildSuperbrainCoexistenceHealthReport(repoRoot);
  check(
    'US-BK-health',
    health.productionAuthorization === false &&
      health.tipLand === false &&
      health.draftPr === false &&
      health.githubSotIssue === 75 &&
      health.nextPhaseTitle === NEXT_PHASE_TITLE &&
      health.bj191kGate.swallowUnsafeBulk === false,
    'Health report encodes honesty locks, SoT, BJ gate, and next title BL.',
  );

  const preds = predecessorMap(repoRoot);
  const bj = bj191kGateStatus(repoRoot);
  check(
    'US-BK-predecessors',
    preds.BD.module === 'AVAILABLE' &&
      preds.BD.report === 'PASS' &&
      preds.BJ.module === 'AVAILABLE' &&
      preds.BJ.report === 'PASS' &&
      bj.bjReport === 'PASS' &&
      bj.bjModule === 'AVAILABLE' &&
      bj.megaMergeAllowed === false &&
      bj.megaPrBulkIncluded === false &&
      bj.attributionUnsafeFor191kAsOnePr === true &&
      bj.swallowUnsafeBulk === false,
    'BJ+BD present; 191K mega-bulk excluded; ATTRIBUTION_UNSAFE inherited; coexistence adapters only.',
  );

  check(
    'US-BK-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BL —'),
    'Next queue title is 62L-BL (title only).',
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`FAIL phase62lbk (${failures.length})`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('OK phase62lbk');
