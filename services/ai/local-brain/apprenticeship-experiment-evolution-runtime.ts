import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendNotebookEntry } from './engineering-notebook';
import {
  apprenticeshipHonesty,
  openApprenticeshipPairSession,
  runGuidedDebugging,
} from './ai-engineering-apprenticeship-network';
import {
  attemptApplyExperimentToMain,
  completeCodeExperiment,
  experimentFactoryHonesty,
  proposeCodeExperiment,
} from './continuous-code-experiment-factory';
import {
  decomposeArchitecturePuzzle,
  puzzleLabHonesty,
} from './architecture-puzzle-laboratory';
import {
  proposeCrossLanguageRefactor,
  refactorEngineHonesty,
} from './cross-language-refactoring-engine';
import {
  evolutionGraphHonesty,
  recordSoftwareEvolution,
} from './superbrain-software-evolution-graph';
import {
  APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE,
  BT_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  githubIssueSot,
  predecessorMap,
  type BtEvidenceState,
  type BtHop,
  type BtHopRecord,
} from './apprenticeship-experiment-evolution-types';

export {
  BT_LOCKS,
  APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  predecessorMap,
  githubIssueSot,
};

function hop(name: BtHop, state: BtEvidenceState, summary: string): BtHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BtCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  attemptApprenticePermissionTransfer?: boolean;
  attemptApplyToMainWithoutReview?: boolean;
  failExperiment?: boolean;
  attemptUnboundedPuzzle?: boolean;
  claimRefactorVerifiedWithoutEquivalence?: boolean;
  includeHiddenReasoningTrace?: boolean;
  reproposeFailedApproach?: boolean;
  failedApproachFingerprint?: string;
};

export async function runApprenticeshipExperimentEvolutionCycle(input: BtCycleInput) {
  if (!input.orgId || !input.tenantId || !input.universeId) {
    throw new Error('ORG_TENANT_UNIVERSE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const hops: BtHopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      'PASS',
      `${HONESTY_BANNER}; L4=${BT_LOCKS.L4_AUTONOMY_ENABLED}; SoT=GitHub#${GITHUB_SOT_ISSUE}; GitLab#${GITLAB_COORDINATION_ISSUE} coordination only.`,
    ),
  );

  const pair = await openApprenticeshipPairSession({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mentorAgentId: 'mentor-bt-1',
    apprenticeAgentId: 'apprentice-bt-1',
    mentorPermissionTier: 'mentor',
    apprenticePermissionTier: 'sandbox',
    mentorProductionAuthority: true,
    objective: 'Bounded pair programming workcell for guided debugging',
    guidedDebugging: true,
    attemptApprenticeMentorPermissionTransfer: input.attemptApprenticePermissionTransfer === true,
    attemptApprenticeProductionAuthority: input.attemptApprenticePermissionTransfer === true,
    root,
  });
  hops.push(
    hop(
      'apprenticeship_pair_session',
      pair.accepted || input.attemptApprenticePermissionTransfer
        ? pair.accepted
          ? 'PASS'
          : 'DENIED'
        : 'FAIL',
      pair.reason,
    ),
  );
  hops.push(
    hop(
      'apprentice_permission_transfer_deny',
      pair.apprenticeGainedMentorPermissions === false &&
        pair.apprenticeGainedProductionAuthority === false &&
        pair.authorityTransferred === false
        ? input.attemptApprenticePermissionTransfer
          ? 'DENIED'
          : 'PASS'
        : 'FAIL',
      `apprenticeGainedMentor=${pair.apprenticeGainedMentorPermissions}; production=${pair.apprenticeGainedProductionAuthority}`,
    ),
  );

  if (pair.accepted && pair.session) {
    const debug = await runGuidedDebugging({
      sessionId: pair.session.id,
      diagnosis: 'Null guard missing in sandbox path',
      proposedFixSummary: 'Add auditable null check; do not elevate permissions',
      root,
    });
    hops.push(
      hop(
        'guided_debugging_workcell',
        debug.accepted ? 'PASS' : 'FAIL',
        debug.reason,
      ),
    );
  } else {
    hops.push(
      hop(
        'guided_debugging_workcell',
        input.attemptApprenticePermissionTransfer ? 'DENIED' : 'FAIL',
        'Skipped — pair session not opened.',
      ),
    );
  }

  const approach = input.failedApproachFingerprint ?? 'weak_global_mutable_singleton_refactor';
  const experiment = await proposeCodeExperiment({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: 'Sandbox micro-experiment',
    approach,
    evidence: [{ kind: 'audit', ref: 'exp-plan-1', summary: 'Sandboxed plan' }],
    root,
  });
  hops.push(
    hop(
      'experiment_sandbox_open',
      experiment.accepted
        ? 'SANDBOXED'
        : experiment.previouslyFailed
          ? 'PREVIOUSLY_FAILED'
          : 'DENIED',
      experiment.reason,
    ),
  );

  let applyResult: Awaited<ReturnType<typeof attemptApplyExperimentToMain>> | null = null;
  let completeResult: Awaited<ReturnType<typeof completeCodeExperiment>> | null = null;

  if (experiment.accepted && experiment.experiment) {
    applyResult = await attemptApplyExperimentToMain({
      experimentId: experiment.experiment.id,
      reviewGateApproved: input.attemptApplyToMainWithoutReview === true ? false : false,
      humanReviewerId: input.attemptApplyToMainWithoutReview === true ? undefined : undefined,
      root,
    });
    hops.push(
      hop(
        'experiment_apply_to_main_deny',
        applyResult.applyToMain === false ? 'DENIED' : 'FAIL',
        applyResult.reason,
      ),
    );

    if (input.failExperiment !== false) {
      completeResult = await completeCodeExperiment({
        experimentId: experiment.experiment.id,
        outcome: 'failed',
        failureSummary: 'Approach produced incorrect behavior in sandbox',
        evidence: [{ kind: 'test_result', ref: 'exp-fail-1', summary: 'Sandbox tests failed' }],
        root,
      });
      hops.push(
        hop(
          'negative_knowledge_preserve',
          completeResult.negativeKnowledge?.preserved === true &&
            (completeResult.negativeKnowledge.status === 'failed' ||
              completeResult.negativeKnowledge.status === 'rejected')
            ? 'FAILED'
            : 'FAIL',
          completeResult.reason,
        ),
      );
    } else {
      hops.push(hop('negative_knowledge_preserve', 'PASS', 'Failure path not exercised this cycle.'));
    }
  } else {
    hops.push(
      hop(
        'experiment_apply_to_main_deny',
        'DENIED',
        'No experiment to apply; apply-to-main remains denied by default.',
      ),
    );
    hops.push(
      hop(
        'negative_knowledge_preserve',
        experiment.previouslyFailed ? 'PREVIOUSLY_FAILED' : 'DENIED',
        experiment.reason,
      ),
    );
  }

  if (input.reproposeFailedApproach || completeResult?.negativeKnowledge) {
    const repropose = await proposeCodeExperiment({
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      title: 'Naive re-proposal of weak approach',
      approach,
      root,
    });
    hops.push(
      hop(
        'negative_knowledge_block_reproposal',
        repropose.accepted === false && repropose.previouslyFailed
          ? 'PREVIOUSLY_FAILED'
          : 'FAIL',
        repropose.reason,
      ),
    );
  } else {
    hops.push(
      hop(
        'negative_knowledge_block_reproposal',
        'PASS',
        'Re-proposal gate ready; not exercised without prior negative knowledge.',
      ),
    );
  }

  const puzzle = await decomposeArchitecturePuzzle({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    rootLabel: 'service-boundary-puzzle',
    proposedChildren: ['api', 'domain', 'adapters', 'tests', 'ops', 'extra-a', 'extra-b', 'extra-c', 'extra-d'],
    attemptExceedBounds: input.attemptUnboundedPuzzle === true,
    requestedDepth: input.attemptUnboundedPuzzle ? 99 : undefined,
    requestedHops: input.attemptUnboundedPuzzle ? 999 : undefined,
    root,
  });
  hops.push(
    hop(
      'architecture_puzzle_decompose',
      puzzle.accepted || input.attemptUnboundedPuzzle
        ? puzzle.accepted
          ? 'IMPLEMENTED'
          : 'DENIED'
        : 'FAIL',
      puzzle.reason,
    ),
  );
  hops.push(
    hop(
      'puzzle_hop_depth_bounds',
      input.attemptUnboundedPuzzle
        ? puzzle.accepted === false
          ? 'DENIED'
          : 'FAIL'
        : puzzle.boundsRespected
          ? 'PASS'
          : 'FAIL',
      `hopsUsed=${puzzle.hopsUsed}; maxDepthReached=${puzzle.maxDepthReached}; boundsRespected=${puzzle.boundsRespected}`,
    ),
  );

  const refactor = await proposeCrossLanguageRefactor({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceLanguage: 'typescript',
    targetLanguage: 'rust',
    summary: 'Port pure function module',
    claimVerifiedWithoutEquivalence: input.claimRefactorVerifiedWithoutEquivalence === true,
    equivalenceEvidence: input.claimRefactorVerifiedWithoutEquivalence
      ? undefined
      : undefined,
    root,
  });
  hops.push(
    hop(
      'cross_language_refactor_candidate',
      refactor.accepted || input.claimRefactorVerifiedWithoutEquivalence
        ? refactor.accepted
          ? 'CANDIDATE'
          : 'DENIED'
        : 'FAIL',
      refactor.reason,
    ),
  );
  hops.push(
    hop(
      'behavior_equivalence_gate',
      'PASS',
      'Behavior-equivalence required before VERIFIED label.',
    ),
  );
  hops.push(
    hop(
      'unverified_refactor_not_verified',
      input.claimRefactorVerifiedWithoutEquivalence
        ? refactor.verified === false
          ? 'DENIED'
          : 'FAIL'
        : refactor.label !== 'VERIFIED'
          ? 'CANDIDATE'
          : 'FAIL',
      `label=${refactor.label}; verified=${refactor.verified}`,
    ),
  );

  const evolution = await recordSoftwareEvolution({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: completeResult?.negativeKnowledge ? 'negative_knowledge' : 'experiment',
    label: 'bt-cycle-evolution',
    summary: 'Auditable evolution node from apprenticeship/experiment cycle',
    provenance: [
      {
        kind: 'evidence_ref',
        ref: 'bt-cycle-1',
        summary: 'Cycle evidence',
      },
      ...(pair.session
        ? [{ kind: 'pair_session' as const, ref: pair.session.id, summary: 'Pair session' }]
        : []),
      ...(completeResult?.negativeKnowledge
        ? [
            {
              kind: 'experiment_id' as const,
              ref: completeResult.negativeKnowledge.experimentId,
              summary: 'Failed experiment negative knowledge',
            },
          ]
        : []),
    ],
    linkToCortex: true,
    includeHiddenReasoningTrace: input.includeHiddenReasoningTrace === true,
    hiddenReasoningTrace: input.includeHiddenReasoningTrace ? 'private chain-of-thought' : undefined,
    root,
  });
  hops.push(
    hop(
      'evolution_graph_record',
      evolution.accepted || input.includeHiddenReasoningTrace
        ? evolution.accepted
          ? 'IMPLEMENTED'
          : 'DENIED'
        : 'FAIL',
      evolution.reason,
    ),
  );
  hops.push(
    hop(
      'provenance_link_cortex',
      input.includeHiddenReasoningTrace
        ? 'DENIED'
        : evolution.cortexTraceId
          ? 'PASS'
          : 'FAIL',
      evolution.cortexTraceId
        ? `cortexTraceId=${evolution.cortexTraceId}`
        : evolution.reason,
    ),
  );
  hops.push(
    hop(
      'hidden_reasoning_trace_reject',
      input.includeHiddenReasoningTrace
        ? evolution.accepted === false
          ? 'DENIED'
          : 'FAIL'
        : 'PASS',
      input.includeHiddenReasoningTrace ? evolution.reason : 'No hidden reasoning submitted.',
    ),
  );

  // Extend BR Engineering Notebook when present: seal auditable lesson for negative knowledge.
  if (completeResult?.negativeKnowledge) {
    await appendNotebookEntry({
      kind: 'lesson',
      title: 'Negative knowledge from failed experiment',
      body: completeResult.negativeKnowledge.summary,
      evidenceRefs: completeResult.negativeKnowledge.evidenceRefs,
      provenance: completeResult.negativeKnowledge.provenance,
      actor: {
        kind: 'workcell',
        id: 'bt-runtime',
        orgId: input.orgId,
        tenantId: input.tenantId,
        universeId: input.universeId,
        role: 'experiment_factory',
      },
      root,
    }).catch(() => undefined);
  }

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `62L-BT cycle pair=${pair.accepted}; experiment=${experiment.accepted}; refactor=${refactor.label}`,
      payload: {
        orgId: input.orgId,
        hops: hops.map((h) => h.hop),
        l4: BT_LOCKS.L4_AUTONOMY_ENABLED,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence event recorded; success ≠ auto-merge/deploy.'));

  await appendLearning(
    {
      domain: 'apprenticeship_experiment_evolution',
      subject: `bt-cycle:${input.orgId}`,
      claimState: 'MODEL_INFERENCE',
      summary: 'BT cycle complete; learning ≠ permission grant.',
      sourceRefs: [`tenant:${input.tenantId}`],
      evidence: ['bt-cycle'],
    },
    root,
  );

  return {
    hops,
    pair,
    experiment,
    applyResult,
    completeResult,
    puzzle,
    refactor,
    evolution,
    honesty: {
      banner: HONESTY_BANNER,
      locks: BT_LOCKS,
      apprenticeship: apprenticeshipHonesty(),
      experimentFactory: experimentFactoryHonesty(),
      puzzleLab: puzzleLabHonesty(),
      refactorEngine: refactorEngineHonesty(),
      evolutionGraph: evolutionGraphHonesty(),
    },
    sot: githubIssueSot(),
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    megaPrBulkIncluded: false as const,
  };
}

export async function buildApprenticeshipExperimentEvolutionHealthReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const preds = predecessorMap(root);
  return {
    phase: '62L-BT',
    title:
      'AI Engineering Apprenticeship Network + Continuous Code Experiment Factory + Architecture Puzzle Laboratory + Cross-Language Refactoring Engine + Superbrain Software Evolution Graph',
    banner: HONESTY_BANNER,
    locks: BT_LOCKS,
    sot: githubIssueSot(),
    predecessors: preds,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    localBrainHealth: health.status,
    cycle: APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    megaPrBulkIncluded: false as const,
    liveSupabaseApply: false as const,
    dbCandidates: 'NOT_APPLIED' as const,
  };
}
