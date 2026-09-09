import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  mapCodebaseStructure,
  recordArchitectureDecision,
  retainFailedApproach,
  structuredCodeMemoryHonesty,
} from './structured-code-memory';
import {
  appendNotebookEntry,
  engineeringNotebookHonesty,
} from './engineering-notebook';
import {
  aiDebuggingAcademyHonesty,
  attemptCouncilAutoMerge,
  conveneDebugCouncil,
  generateRegressionTestCandidate,
  identifyBottleneck,
  proposeDebugHypothesis,
  reproduceBug,
  verifyHypothesis,
} from './ai-debugging-academy';
import {
  attemptWorkcellAuthorityExpansion,
  declareSelfLearningWorkcell,
  selfLearningWorkcellHonesty,
  updateWorkcellFromVerifiedOutcome,
} from './self-learning-workcells';
import {
  attemptPromoteCompilerToProduction,
  attemptSkillPermissionEscalation,
  compileSoftwareKnowledge,
  softwareKnowledgeCompilerHonesty,
} from './superbrain-software-knowledge-compiler';
import {
  BR_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  STRUCTURED_CODE_MEMORY_CYCLE,
  predecessorMap,
  type BrActor,
  type BrEvidenceState,
  type BrHop,
  type BrHopRecord,
} from './structured-code-memory-types';

export {
  BR_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  STRUCTURED_CODE_MEMORY_CYCLE,
  predecessorMap,
};

function hop(name: BrHop, state: BrEvidenceState, summary: string): BrHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BrCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: BrActor;
  bugId?: string;
  mapRoot?: string;
  root?: string;
};

export async function runStructuredCodeMemoryCycle(input: BrCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BrHopRecord[] = [];
  const bugId = input.bugId ?? `bug_${Date.now().toString(36)}`;
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  const mapped = await mapCodebaseStructure({
    root,
    mapRoot: input.mapRoot ?? root,
    maxDepth: 2,
    maxNodes: 80,
    actor,
  });
  hops.push(
    hop(
      'codebase_map',
      mapped.accepted ? 'PASS' : 'FAIL',
      mapped.accepted ? `modules=${mapped.moduleCount}` : mapped.reason,
    ),
  );

  const adr = await recordArchitectureDecision({
    title: 'Bounded code memory under Founder deny-by-default',
    decision: 'Retain ADRs and failed approaches with provenance; no hidden CoT.',
    rationale: 'Auditable engineering memory for debugging academy and compiler.',
    alternativesConsidered: ['Discard failed approaches', 'Store private CoT'],
    provenance: ['62L-BR'],
    actor,
    root,
  });
  hops.push(hop('architecture_decision_record', adr.accepted ? 'PASS' : 'FAIL', adr.decision.id));

  const failed = await retainFailedApproach({
    title: 'Naive auto-merge of council fix',
    summary: 'Rejected: council recommendation must not auto-merge.',
    status: 'rejected',
    evidenceRefs: ['policy:council_recommend_only'],
    provenance: ['62L-BR'],
    actor,
    root,
  });
  hops.push(
    hop(
      'failed_approach_retain',
      failed.accepted && failed.approach.retained && !failed.approach.discarded ? 'PASS' : 'FAIL',
      failed.reason,
    ),
  );

  const repro = await reproduceBug({
    bugId,
    steps: ['run failing test', 'observe assertion'],
    observed: 'assertion failed',
    expected: 'assertion passes',
    reproducible: true,
    evidenceRefs: ['test:repro'],
    actor,
    root,
  });
  hops.push(hop('bug_reproduce', repro.accepted ? 'PASS' : 'FAIL', repro.reproduction.id));

  const hypA = await proposeDebugHypothesis({
    bugId,
    statement: 'Null guard missing in parser',
    competingGroupId: `group_${bugId}`,
    evidenceRefs: ['log:null'],
    actor,
    root,
  });
  const hypB = await proposeDebugHypothesis({
    bugId,
    statement: 'Race in async flush',
    competingGroupId: `group_${bugId}`,
    correlationOnly: true,
    evidenceRefs: ['metric:timing'],
    actor,
    root,
  });
  hops.push(
    hop(
      'competing_hypotheses',
      hypA.accepted && hypB.accepted && !hypA.isRootCause && !hypB.isRootCause ? 'HYPOTHESIS' : 'FAIL',
      'competing hypotheses remain hypotheses',
    ),
  );

  const council = await conveneDebugCouncil({
    bugId,
    topic: `Debug ${bugId}`,
    actor,
    root,
  });
  const autoMerge = await attemptCouncilAutoMerge({
    councilId: council.accepted ? council.council.id : 'missing',
    actor,
    root,
  });
  hops.push(
    hop(
      'debug_council_convene',
      council.accepted && autoMerge.allowed === false ? 'PASS' : 'FAIL',
      autoMerge.reason,
    ),
  );

  const reg = await generateRegressionTestCandidate({
    bugId,
    name: `regression_${bugId}`,
    assertion: 'reproduced failure no longer occurs under verified fix',
    actor,
    root,
  });
  hops.push(hop('regression_test_generate', reg.accepted ? 'PASS' : 'FAIL', reg.test.id));

  const bn = await identifyBottleneck({
    bugId,
    area: 'parser_hot_path',
    summary: 'Repeated reparsing without cache',
    evidenceRefs: ['profile:cpu'],
    actor,
    root,
  });
  hops.push(hop('bottleneck_identify', bn.accepted ? 'PASS' : 'FAIL', bn.bottleneck.id));

  const note = await appendNotebookEntry({
    kind: 'decision',
    title: 'Prefer verified evidence over correlation',
    body: 'Do not promote correlation-only hypothesis to root cause.',
    evidenceRefs: ['policy:causation'],
    actor,
    root,
  });
  hops.push(hop('notebook_artifact_seal', note.accepted ? 'PASS' : 'FAIL', note.accepted ? note.entry.id : note.reason));

  const hidden = await appendNotebookEntry({
    kind: 'lesson',
    title: 'Attempt hidden trace',
    body: 'should deny',
    payload: { hidden_reasoning_trace: 'PRIVATE_COT_DO_NOT_STORE' },
    mode: 'deny',
    actor,
    root,
  });
  hops.push(
    hop(
      'hidden_trace_reject',
      hidden.accepted === false && hidden.reason === 'HIDDEN_REASONING_TRACE_DENIED' ? 'DENIED' : 'FAIL',
      hidden.accepted === false ? hidden.reason : 'UNEXPECTED_ACCEPT',
    ),
  );

  const verifiedHyp = await verifyHypothesis({
    hypothesisId: hypA.accepted ? hypA.hypothesis.id : 'missing',
    verified: true,
    evidenceRefs: ['test:fix_confirmed', 'diff:null_guard'],
    actor,
    root,
  });
  hops.push(
    hop(
      'verified_outcome_gate',
      verifiedHyp.accepted && verifiedHyp.isRootCause === true ? 'VERIFIED' : 'FAIL',
      verifiedHyp.accepted ? verifiedHyp.hypothesis.status : verifiedHyp.reason,
    ),
  );

  const workcell = await declareSelfLearningWorkcell({
    name: 'debug-academy-workcell',
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor,
    root,
  });
  const wcUpdate = workcell.accepted
    ? await updateWorkcellFromVerifiedOutcome({
        workcellId: workcell.workcell.id,
        subject: `fix:${bugId}`,
        summary: 'Null guard verified; regression candidate recorded.',
        verified: true,
        evidenceRefs: ['test:fix_confirmed'],
        actor,
        root,
      })
    : { accepted: false as const, reason: 'WORKCELL_MISSING' };
  const wcExpand = workcell.accepted
    ? await attemptWorkcellAuthorityExpansion({
        workcellId: workcell.workcell.id,
        newPermissions: ['production_deploy'],
        actor,
        root,
      })
    : { allowed: false as const, reason: 'WORKCELL_MISSING' };
  hops.push(
    hop(
      'workcell_bounded_update',
      wcUpdate.accepted && wcExpand.allowed === false ? 'PASS' : 'FAIL',
      wcExpand.reason,
    ),
  );

  const compiled = await compileSoftwareKnowledge({
    kind: 'skill',
    title: 'Null-guard debugging pattern',
    body: 'When parser NPE: add guard + regression; retain failed auto-merge approach.',
    sourceRefs: ['test:fix_confirmed', 'adr:bounded_memory'],
    verifiedSource: true,
    actor,
    root,
  });
  const unverified = await compileSoftwareKnowledge({
    kind: 'knowledge',
    title: 'Unverified speculative fix',
    body: 'Maybe restart the service',
    verifiedSource: false,
    actor,
    root,
  });
  hops.push(
    hop(
      'knowledge_compile_candidate',
      compiled.accepted &&
        compiled.trust === 'candidate_under_review' &&
        unverified.accepted === false
        ? 'CANDIDATE_UNDER_REVIEW'
        : 'FAIL',
      compiled.accepted ? compiled.reason : 'COMPILE_FAIL',
    ),
  );

  const skillEsc = compiled.accepted
    ? await attemptSkillPermissionEscalation({
        artifactId: compiled.artifact.id,
        newPermissions: ['admin_override'],
        actor,
        root,
      })
    : { allowed: false as const, reason: 'NO_ARTIFACT' };
  const prodPromote = compiled.accepted
    ? await attemptPromoteCompilerToProduction({
        artifactId: compiled.artifact.id,
        actor,
        root,
      })
    : { allowed: false as const, reason: 'NO_ARTIFACT' };
  hops.push(
    hop(
      'permission_non_escalation',
      skillEsc.allowed === false && prodPromote.allowed === false ? 'PASS' : 'FAIL',
      skillEsc.reason,
    ),
  );

  hops.push(
    hop(
      'council_recommend_only',
      autoMerge.allowed === false && BR_LOCKS.COUNCIL_AUTO_MERGE === false ? 'PASS' : 'FAIL',
      'council recommendation ≠ auto-merge',
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `62L-BR structured code memory cycle hops=${hops.length}`,
      payload: {
        hops: hops.map((item) => item.hop),
        bugId,
        productionAuthorization: false,
        permissionChange: false,
      },
    },
    root,
  );

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-BR structured code memory cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; bug=${bugId}`,
      sourceRefs: [`bug:${bugId}`],
      evidence: [`bug:${bugId}`],
    },
    root,
  );

  hops.push(hop('evidence', 'PASS', 'evidence + learning recorded'));
  hops.push(hop('learning', 'PASS', 'verified-outcome learning only; no permission grant'));

  const gate = decisionGate({
    id: `br_gate_${Date.now().toString(36)}`,
    action: 'structured_code_memory_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  return {
    accepted: true as const,
    bugId,
    hops,
    cycle: STRUCTURED_CODE_MEMORY_CYCLE,
    honesty: HONESTY_BANNER,
    locks: BR_LOCKS,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    decisionGate: gate,
    nextPhaseTitle: NEXT_PHASE_TITLE,
  };
}

export async function buildStructuredCodeMemoryHealthReport(cwd = process.cwd()) {
  let brainHealth: unknown = null;
  try {
    brainHealth = await checkLocalBrainHealth(cwd);
  } catch {
    brainHealth = { status: 'UNAVAILABLE' };
  }

  return {
    phase: '62L-BR',
    title:
      'Structured Code Memory + AI Debugging Academy + Engineering Notebook + Self-Learning Workcells + Superbrain Software Knowledge Compiler',
    honesty: HONESTY_BANNER,
    locks: BR_LOCKS,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    tipLand: false,
    auditableMemoryPolicy: engineeringNotebookHonesty().policy,
    subsystems: {
      structuredCodeMemory: structuredCodeMemoryHonesty(),
      engineeringNotebook: engineeringNotebookHonesty(),
      aiDebuggingAcademy: aiDebuggingAcademyHonesty(),
      selfLearningWorkcells: selfLearningWorkcellHonesty(),
      softwareKnowledgeCompiler: softwareKnowledgeCompilerHonesty(),
    },
    cycle: STRUCTURED_CODE_MEMORY_CYCLE,
    predecessors: predecessorMap(cwd),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    brainHealth,
    githubIssue: 82,
    gitlabIssue: 16,
    dbCandidates: 'NOT_APPLIED',
    generatedAt: new Date().toISOString(),
  };
}
