import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { appendNotebookEntry } from './engineering-notebook';
import {
  BR_LOCKS,
  COUNCIL_RECOMMENDATION_ONLY,
  HONESTY_BANNER,
  HYPOTHESIS_UNTIL_VERIFIED,
  type BrActor,
  type CouncilRole,
  type HypothesisStatus,
} from './structured-code-memory-types';

export type BugReproduction = {
  id: string;
  bugId: string;
  steps: string[];
  observed: string;
  expected: string;
  reproducible: boolean;
  evidenceRefs: string[];
  recordedAt: string;
  actorId: string;
};

export type DebugHypothesis = {
  id: string;
  bugId: string;
  statement: string;
  status: HypothesisStatus;
  competingGroupId: string;
  evidenceRefs: string[];
  correlationOnly: boolean;
  isRootCause: boolean;
  recordedAt: string;
  actorId: string;
};

export type CouncilRecommendation = {
  role: CouncilRole;
  text: string;
  autoMerge: false;
  autoDeploy: false;
};

export type DebugCouncilSession = {
  id: string;
  bugId: string;
  topic: string;
  recommendations: CouncilRecommendation[];
  autoMerge: false;
  autoDeploy: false;
  productionAuthorized: false;
  convenedAt: string;
  actorId: string;
};

export type RegressionTestCandidate = {
  id: string;
  bugId: string;
  name: string;
  assertion: string;
  status: 'candidate';
  permissionChange: false;
  recordedAt: string;
};

export type BottleneckNote = {
  id: string;
  bugId: string;
  area: string;
  summary: string;
  evidenceRefs: string[];
  recordedAt: string;
};

export type AcademyStore = {
  reproductions: BugReproduction[];
  hypotheses: DebugHypothesis[];
  councils: DebugCouncilSession[];
  regressionTests: RegressionTestCandidate[];
  bottlenecks: BottleneckNote[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'ai-debugging-academy.json');
}

async function load(root: string): Promise<AcademyStore> {
  return readJsonFile<AcademyStore>(storePath(root), {
    reproductions: [],
    hypotheses: [],
    councils: [],
    regressionTests: [],
    bottlenecks: [],
  });
}

async function save(root: string, store: AcademyStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function reproduceBug(input: {
  bugId: string;
  steps: string[];
  observed: string;
  expected: string;
  reproducible: boolean;
  evidenceRefs?: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const entry: BugReproduction = {
    id: id('repro'),
    bugId: input.bugId,
    steps: input.steps,
    observed: input.observed,
    expected: input.expected,
    reproducible: input.reproducible,
    evidenceRefs: input.evidenceRefs ?? [],
    recordedAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.reproductions.push(entry);
  await save(root, store);
  await appendNotebookEntry({
    kind: 'evidence',
    title: `Bug reproduction ${input.bugId}`,
    body: `observed=${input.observed}; expected=${input.expected}; reproducible=${input.reproducible}`,
    evidenceRefs: entry.evidenceRefs,
    provenance: [`academy:${entry.id}`],
    actor: input.actor,
    root,
  });
  return { accepted: true as const, reproduction: entry };
}

/**
 * Record a competing debugging hypothesis. Remains hypothesis until verified evidence.
 */
export async function proposeDebugHypothesis(input: {
  bugId: string;
  statement: string;
  competingGroupId: string;
  evidenceRefs?: string[];
  correlationOnly?: boolean;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const entry: DebugHypothesis = {
    id: id('hyp'),
    bugId: input.bugId,
    statement: input.statement,
    status: 'hypothesis',
    competingGroupId: input.competingGroupId,
    evidenceRefs: input.evidenceRefs ?? [],
    correlationOnly: input.correlationOnly ?? false,
    isRootCause: false,
    recordedAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.hypotheses.push(entry);
  await save(root, store);
  await appendNotebookEntry({
    kind: 'hypothesis',
    title: `Hypothesis for ${input.bugId}`,
    body: input.statement,
    evidenceRefs: entry.evidenceRefs,
    provenance: [`academy:${entry.id}`],
    hypothesisStatus: 'hypothesis',
    actor: input.actor,
    root,
  });
  return {
    accepted: true as const,
    hypothesis: entry,
    reason: HYPOTHESIS_UNTIL_VERIFIED,
    isRootCause: false as const,
  };
}

/**
 * Promote a hypothesis to verified root cause only with verified evidence.
 * Correlation-only evidence is insufficient.
 */
export async function verifyHypothesis(input: {
  hypothesisId: string;
  verified: boolean;
  evidenceRefs: string[];
  correlationOnly?: boolean;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const hyp = store.hypotheses.find((h) => h.id === input.hypothesisId);
  if (!hyp) {
    return { accepted: false as const, reason: 'HYPOTHESIS_NOT_FOUND' };
  }
  if (!input.verified || input.correlationOnly === true || input.evidenceRefs.length === 0) {
    hyp.status = input.verified === false ? 'refuted' : 'hypothesis';
    hyp.isRootCause = false;
    await save(root, store);
    return {
      accepted: true as const,
      hypothesis: hyp,
      reason: HYPOTHESIS_UNTIL_VERIFIED,
      isRootCause: false as const,
    };
  }
  hyp.status = 'verified_root_cause';
  hyp.isRootCause = true;
  hyp.evidenceRefs = [...new Set([...hyp.evidenceRefs, ...input.evidenceRefs])];
  await save(root, store);
  return { accepted: true as const, hypothesis: hyp, isRootCause: true as const };
}

export async function conveneDebugCouncil(input: {
  bugId: string;
  topic: string;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const roles: CouncilRole[] = ['coder', 'tester', 'security', 'skeptic'];
  const recommendations: CouncilRecommendation[] = roles.map((role) => ({
    role,
    text: `${role} recommendation on ${input.topic}: investigate with evidence; do not auto-merge.`,
    autoMerge: false,
    autoDeploy: false,
  }));
  const session: DebugCouncilSession = {
    id: id('council'),
    bugId: input.bugId,
    topic: input.topic,
    recommendations,
    autoMerge: false,
    autoDeploy: false,
    productionAuthorized: false,
    convenedAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.councils.push(session);
  await save(root, store);
  return {
    accepted: true as const,
    council: session,
    reason: COUNCIL_RECOMMENDATION_ONLY,
    autoMerge: false as const,
    autoDeploy: false as const,
  };
}

/** Attempt to treat council output as auto-merge — always DENIED. */
export async function attemptCouncilAutoMerge(input: {
  councilId: string;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const session = store.councils.find((c) => c.id === input.councilId);
  if (!session) {
    return { allowed: false as const, reason: 'COUNCIL_NOT_FOUND' };
  }
  return {
    allowed: false as const,
    reason: COUNCIL_RECOMMENDATION_ONLY,
    autoMerge: false as const,
    autoDeploy: false as const,
    l4AutonomyEnabled: BR_LOCKS.L4_AUTONOMY_ENABLED,
    councilAutoMergeLock: BR_LOCKS.COUNCIL_AUTO_MERGE,
  };
}

export async function generateRegressionTestCandidate(input: {
  bugId: string;
  name: string;
  assertion: string;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const entry: RegressionTestCandidate = {
    id: id('regtest'),
    bugId: input.bugId,
    name: input.name,
    assertion: input.assertion,
    status: 'candidate',
    permissionChange: false,
    recordedAt: new Date().toISOString(),
  };
  store.regressionTests.push(entry);
  await save(root, store);
  await appendNotebookEntry({
    kind: 'regression_test_candidate',
    title: entry.name,
    body: entry.assertion,
    provenance: [`academy:${entry.id}`],
    actor: input.actor,
    root,
  });
  return { accepted: true as const, test: entry };
}

export async function identifyBottleneck(input: {
  bugId: string;
  area: string;
  summary: string;
  evidenceRefs?: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const entry: BottleneckNote = {
    id: id('bn'),
    bugId: input.bugId,
    area: input.area,
    summary: input.summary,
    evidenceRefs: input.evidenceRefs ?? [],
    recordedAt: new Date().toISOString(),
  };
  store.bottlenecks.push(entry);
  await save(root, store);
  await appendNotebookEntry({
    kind: 'bottleneck_note',
    title: `Bottleneck ${input.area}`,
    body: input.summary,
    evidenceRefs: entry.evidenceRefs,
    provenance: [`academy:${entry.id}`],
    actor: input.actor,
    root,
  });
  return { accepted: true as const, bottleneck: entry };
}

export async function listHypotheses(bugId: string, root?: string) {
  const store = await load(root ?? process.cwd());
  return store.hypotheses.filter((h) => h.bugId === bugId);
}

export function aiDebuggingAcademyHonesty() {
  return {
    banner: HONESTY_BANNER,
    hypothesisEqualsRootCause: BR_LOCKS.HYPOTHESIS_EQUALS_ROOT_CAUSE,
    correlationEqualsCausation: BR_LOCKS.CORRELATION_EQUALS_CAUSATION,
    councilAutoMerge: BR_LOCKS.COUNCIL_AUTO_MERGE,
    councilAutoDeploy: BR_LOCKS.COUNCIL_AUTO_DEPLOY,
    learnFromVerifiedOutcomesOnly: BR_LOCKS.LEARN_FROM_VERIFIED_OUTCOMES_ONLY,
  };
}
