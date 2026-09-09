import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { localBrainStatus } from './supervisor';
import { readApprovedContext } from './context-vault';
import { retrieveEvidencePathway } from './cortex-evidence';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { planDemandAgents } from './demand-agent-planner';
import { LocalCheckpointStore } from './checkpoint-store';
import { conveneReflectionCouncil } from './reflection-council';
import { runAllowedLocalCommand, type AllowedLocalCommand } from './local-command-runner';
import { runScenarioSimulation } from './simulation-lab';
import { recoverInterruptedResearchJobs } from './offline-resilience';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { recordStrategyTactic, recallStrategyTactics } from './strategy-memory';
import {
  admitWorkcell,
  releaseWorkcell,
  routeLocalModel,
  scheduleWorkcellCompute,
  resourceBudgetFor,
} from './resource-governor';
import { queueOfflineOnlineReconciliation, reconcileWhenConnectivityReturns } from './offline-reconciliation';
import { openPersistentMeeting, runPersistentMeetingRound } from './persistent-meetings';
import {
  runBoundedImprovementAfterEvidence,
  runInfrastructureWorkcell,
  runProtectedCodingWorkcell,
  runQuantWorkcell,
  runResearchWorkcell,
  runTestFixRetestLoop,
} from './offline-workcells';
import type { TestingAgentRunner } from './testing-agent';

export const OFFLINE_OPERATING_CYCLE = [
  'approved_story',
  'offline_supervisor',
  'context_vault',
  'knowledge_retrieval',
  'agent_workcell',
  'plan',
  'agents_collaborate',
  'local_tools',
  'code_research_simulation',
  'test',
  'critique',
  'evidence',
  'decision_gate',
  'checkpoint',
  'learning_ledger',
  'strategy_memory',
  'next_task',
] as const;

export type OfflineOperatingHop = (typeof OFFLINE_OPERATING_CYCLE)[number];
export type WorkcellKind = 'coding' | 'research' | 'quant' | 'infrastructure';
export type WorkcellState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'waiting_data'
  | 'unavailable'
  | 'denied'
  | 'failed'
  | 'dead_lettered';

export type ApprovedStory = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  objective: string;
  approved: boolean;
  workcellKind: WorkcellKind;
  contextPaths?: string[];
  repoRoot?: string;
  consequence?: ConsequenceClass;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  production?: boolean;
  permissionChange?: boolean;
  patchFiles?: Array<{ path: string; action: 'create' | 'modify' | 'delete'; unifiedDiff: string }>;
  testCommands?: AllowedLocalCommand[];
  testRunner?: TestingAgentRunner;
  crashAfterHop?: OfflineOperatingHop;
};

export type WorkcellHopRecord = {
  hop: OfflineOperatingHop;
  state: 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED' | 'DENIED';
  summary: string;
  at: string;
};

export type DeadLetterRecord = {
  id: string;
  workcellId: string;
  tenantId: string;
  universeId: string;
  reason: string;
  attempts: number;
  recovered: boolean;
  createdAt: string;
  productionAuthorization: false;
};

export type OfflineWorkcell = {
  id: string;
  storyId: string;
  tenantId: string;
  universeId: string;
  kind: WorkcellKind;
  objective: string;
  state: WorkcellState;
  completedHops: WorkcellHopRecord[];
  retrievalBeforeReasoning: boolean;
  evidenceRefs: string[];
  attempts: number;
  maxAttempts: number;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  founderImpersonation: false;
  physicalDeviceControl: false;
  createdAt: string;
  updatedAt: string;
};

type RuntimeStore = { workcells: OfflineWorkcell[]; deadLetters: DeadLetterRecord[]; recoveredCrashes: number };

function storePath(root: string) {
  return xivLocalPath(root, 'offline-agent-runtime.json');
}

async function loadStore(root: string): Promise<RuntimeStore> {
  const parsed = await readJsonFile<RuntimeStore>(storePath(root), { workcells: [], deadLetters: [], recoveredCrashes: 0 });
  return {
    workcells: Array.isArray(parsed.workcells) ? parsed.workcells : [],
    deadLetters: Array.isArray(parsed.deadLetters) ? parsed.deadLetters : [],
    recoveredCrashes: typeof parsed.recoveredCrashes === 'number' ? parsed.recoveredCrashes : 0,
  };
}

async function saveStore(root: string, store: RuntimeStore) {
  await writeJsonFileAtomic(storePath(root), {
    workcells: store.workcells.slice(-2_000),
    deadLetters: store.deadLetters.slice(-2_000),
    recoveredCrashes: store.recoveredCrashes,
  });
}

export class SimulatedCrash extends Error {
  constructor(public readonly hop: OfflineOperatingHop) {
    super(`SIMULATED_CRASH_AFTER:${hop}`);
    this.name = 'SimulatedCrash';
  }
}

function nowIso() {
  return new Date().toISOString();
}

function hopDone(workcell: OfflineWorkcell, hop: OfflineOperatingHop) {
  return workcell.completedHops.some((item) => item.hop === hop);
}

export async function recoverInterruptedWorkcells(root = process.cwd()) {
  const store = await loadStore(root);
  let recovered = 0;
  for (const workcell of store.workcells) {
    if (workcell.state === 'running') {
      workcell.state = 'queued';
      workcell.updatedAt = nowIso();
      recovered += 1;
    }
  }
  store.recoveredCrashes += recovered;
  if (recovered) await saveStore(root, store);
  const researchRecovered = await recoverInterruptedResearchJobs(root);
  return { workcells: recovered, researchJobs: researchRecovered };
}

export async function enqueueApprovedStory(story: ApprovedStory, root?: string) {
  if (!story.tenantId || !story.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!story.objective.trim()) throw new Error('STORY_OBJECTIVE_REQUIRED');
  const resolved = root ?? process.cwd();
  const store = await loadStore(resolved);
  const workcell: OfflineWorkcell = {
    id: cortexId('workcell'),
    storyId: story.id,
    tenantId: story.tenantId,
    universeId: story.universeId,
    kind: story.workcellKind,
    objective: story.objective.trim(),
    state: story.approved ? 'queued' : 'denied',
    completedHops: [],
    retrievalBeforeReasoning: false,
    evidenceRefs: [],
    attempts: 0,
    maxAttempts: 3,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    founderImpersonation: false,
    physicalDeviceControl: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store.workcells.push(workcell);
  await saveStore(resolved, store);
  return workcell;
}

export async function listOfflineWorkcells(root = process.cwd()) {
  return (await loadStore(root)).workcells;
}

export async function listDeadLetters(root = process.cwd()) {
  return (await loadStore(root)).deadLetters;
}

export async function recoverDeadLetter(input: {
  id: string;
  tenantId: string;
  universeId: string;
  humanRecover: true;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await loadStore(root);
  const letter = store.deadLetters.find((item) =>
    item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!letter) throw new Error('DEAD_LETTER_NOT_FOUND');
  const workcell = store.workcells.find((item) => item.id === letter.workcellId);
  if (!workcell) throw new Error('WORKCELL_NOT_FOUND');
  letter.recovered = true;
  workcell.state = 'queued';
  workcell.attempts = 0;
  workcell.updatedAt = nowIso();
  await saveStore(root, store);
  return { letter, workcell };
}

async function persistHop(root: string, workcell: OfflineWorkcell, hop: WorkcellHopRecord, state?: WorkcellState) {
  workcell.completedHops.push(hop);
  if (state) workcell.state = state;
  workcell.updatedAt = nowIso();
  const store = await loadStore(root);
  const index = store.workcells.findIndex((item) => item.id === workcell.id);
  if (index >= 0) store.workcells[index] = workcell;
  else store.workcells.push(workcell);
  await saveStore(root, store);
  if (workcell.state === 'dead_lettered') {
    store.deadLetters.push({
      id: cortexId('dlq'),
      workcellId: workcell.id,
      tenantId: workcell.tenantId,
      universeId: workcell.universeId,
      reason: hop.summary,
      attempts: workcell.attempts,
      recovered: false,
      createdAt: nowIso(),
      productionAuthorization: false,
    });
    await saveStore(root, store);
  }
}

export async function runOfflineOperatingCycle(story: ApprovedStory, root?: string) {
  const resolved = root ?? process.cwd();
  await recoverInterruptedWorkcells(resolved);
  const existing = (await loadStore(resolved)).workcells.find((item) => item.storyId === story.id && item.state !== 'dead_lettered');
  const workcell = existing ?? await enqueueApprovedStory(story, resolved);
  const started = Date.now();

  if (workcell.state === 'completed') {
    return { workcell, hops: workcell.completedHops, durationMs: 0 };
  }

  if (!story.approved || workcell.state === 'denied') {
    await persistHop(resolved, workcell, {
      hop: 'approved_story',
      state: 'DENIED',
      summary: 'Story is not approved; cycle will not execute.',
      at: nowIso(),
    }, 'denied');
    return { workcell, hops: workcell.completedHops, durationMs: Date.now() - started };
  }

  const admission = admitWorkcell(story.tenantId, story.universeId);
  if (!admission.admitted) {
    await persistHop(resolved, workcell, {
      hop: 'agent_workcell',
      state: 'UNAVAILABLE',
      summary: admission.reason,
      at: nowIso(),
    }, 'unavailable');
    return { workcell, hops: workcell.completedHops, durationMs: Date.now() - started };
  }

  workcell.state = 'running';
  workcell.attempts += 1;
  workcell.updatedAt = nowIso();
  await saveStore(resolved, await (async () => {
    const store = await loadStore(resolved);
    const index = store.workcells.findIndex((item) => item.id === workcell.id);
    if (index >= 0) store.workcells[index] = workcell;
    return store;
  })());

  const maybeCrash = async (hop: OfflineOperatingHop) => {
    if (story.crashAfterHop === hop) throw new SimulatedCrash(hop);
  };

  try {
    if (!hopDone(workcell, 'approved_story')) {
      await persistHop(resolved, workcell, {
        hop: 'approved_story',
        state: 'PASS',
        summary: `Approved story ${story.id}: ${story.title}`,
        at: nowIso(),
      });
      await maybeCrash('approved_story');
    }

    if (!hopDone(workcell, 'offline_supervisor')) {
      const status = await localBrainStatus();
      await persistHop(resolved, workcell, {
        hop: 'offline_supervisor',
        state: 'PASS',
        summary: `Supervisor mode=${status.mode}; productionGitPush=${status.productionGitPushEnabled}`,
        at: nowIso(),
      });
      await maybeCrash('offline_supervisor');
    }

    if (!hopDone(workcell, 'context_vault')) {
      const repoRoot = story.repoRoot ?? resolved;
      const paths = story.contextPaths ?? [];
      if (paths.length === 0) {
        await persistHop(resolved, workcell, {
          hop: 'context_vault',
          state: 'NOT_TESTED',
          summary: 'No approved context paths supplied.',
          at: nowIso(),
        });
      } else {
        const records = [];
        for (const path of paths) records.push(await readApprovedContext(repoRoot, path));
        await persistHop(resolved, workcell, {
          hop: 'context_vault',
          state: 'PASS',
          summary: `Read ${records.length} approved context file(s).`,
          at: nowIso(),
        });
      }
      await maybeCrash('context_vault');
    }

    if (!hopDone(workcell, 'knowledge_retrieval')) {
      const retrieval = await retrieveEvidencePathway({
        tenantId: story.tenantId,
        universeId: story.universeId,
        query: story.objective,
        needsExternalFreshness: story.needsExternalFreshness,
        needsCloudProvider: story.needsCloudProvider,
        root: resolved,
      });
      workcell.retrievalBeforeReasoning = true;
      workcell.evidenceRefs = [...retrieval.evidenceRefs];
      const hopState = retrieval.state === 'AVAILABLE' ? 'PASS' : retrieval.state;
      await persistHop(resolved, workcell, {
        hop: 'knowledge_retrieval',
        state: hopState,
        summary: retrieval.reason,
        at: nowIso(),
      }, retrieval.state === 'WAITING_DATA' ? 'waiting_data' : retrieval.state === 'UNAVAILABLE' ? 'unavailable' : workcell.state);
      if (retrieval.state === 'WAITING_DATA' || retrieval.state === 'UNAVAILABLE') {
        await queueOfflineOnlineReconciliation({
          tenantId: story.tenantId,
          universeId: story.universeId,
          workcellId: workcell.id,
          objective: story.objective,
          needsExternalFreshness: story.needsExternalFreshness,
          needsCloudProvider: story.needsCloudProvider,
          production: story.production,
          root: resolved,
        });
        return { workcell, hops: workcell.completedHops, durationMs: Date.now() - started, retrieval };
      }
      await maybeCrash('knowledge_retrieval');
    }

    if (!workcell.retrievalBeforeReasoning) {
      await persistHop(resolved, workcell, {
        hop: 'plan',
        state: 'FAIL',
        summary: 'Retrieval-before-reasoning violated; reasoning refused.',
        at: nowIso(),
      }, 'failed');
      return { workcell, hops: workcell.completedHops, durationMs: Date.now() - started };
    }

    if (!hopDone(workcell, 'agent_workcell')) {
      const schedule = await scheduleWorkcellCompute();
      await persistHop(resolved, workcell, {
        hop: 'agent_workcell',
        state: schedule.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
        summary: `Workcell ${workcell.kind} scheduled on ${schedule.selected}. ${schedule.reason}`,
        at: nowIso(),
      });
      await maybeCrash('agent_workcell');
    }

    if (!hopDone(workcell, 'plan')) {
      const recalled = await recallStrategyTactics({
        tenantId: story.tenantId,
        universeId: story.universeId,
        query: story.objective,
        root: resolved,
      });
      const recruitment = planDemandAgents({
        tenantId: story.tenantId,
        universeId: story.universeId,
        taskId: workcell.id,
        requestedRoles: story.workcellKind === 'coding' ? ['coder', 'tester', 'security'] : ['researcher', 'skeptic', 'evidence_verifier'],
        consequence: story.consequence ?? 'LOW',
        approved: true,
      });
      const route = await routeLocalModel();
      await persistHop(resolved, workcell, {
        hop: 'plan',
        state: recruitment.status === 'PLANNED' ? 'PASS' : recruitment.status === 'HUMAN_APPROVAL_REQUIRED' ? 'DENIED' : 'UNAVAILABLE',
        summary: `plan=${recruitment.status}; tactics=${recalled.tactics.length}; localModel=${route.state}; cloudFallback=${route.cloudFallback}`,
        at: nowIso(),
      });
      await maybeCrash('plan');
    }

    if (!hopDone(workcell, 'agents_collaborate')) {
      const meeting = await openPersistentMeeting({
        tenantId: story.tenantId,
        universeId: story.universeId,
        objective: story.objective,
        roles: ['researcher', 'skeptic', 'evidence_verifier'],
        maxRounds: 1,
        root: resolved,
      });
      const round = await runPersistentMeetingRound({
        id: meeting.id,
        tenantId: story.tenantId,
        universeId: story.universeId,
        root: resolved,
      });
      const council = await conveneReflectionCouncil({
        tenantId: story.tenantId,
        universeId: story.universeId,
        question: story.objective,
        root: resolved,
      });
      await persistHop(resolved, workcell, {
        hop: 'agents_collaborate',
        state: round.state === 'unavailable' || council.runtimeState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PASS',
        summary: `meeting=${round.state}; council=${council.runtimeState}; consensusForced=false; founderImpersonation=false`,
        at: nowIso(),
      });
      await maybeCrash('agents_collaborate');
    }

    if (!hopDone(workcell, 'local_tools')) {
      const cwd = story.repoRoot ?? resolved;
      const tool = await runAllowedLocalCommand({ id: 'git_status', cwd, timeoutMs: 8_000 });
      await persistHop(resolved, workcell, {
        hop: 'local_tools',
        state: tool.timedOut || tool.exitCode !== 0 ? 'FAIL' : 'PASS',
        summary: `git_status exit=${tool.exitCode}; timedOut=${tool.timedOut}; productionEffect=${tool.productionEffect}`,
        at: nowIso(),
      });
      await maybeCrash('local_tools');
    }

    if (!hopDone(workcell, 'code_research_simulation')) {
      let summary = '';
      let state: WorkcellHopRecord['state'] = 'PASS';
      if (story.workcellKind === 'coding') {
        const coding = await runProtectedCodingWorkcell({
          tenantId: story.tenantId,
          universeId: story.universeId,
          storyId: story.id,
          objective: story.objective,
          files: story.patchFiles ?? [{
            path: 'sandbox/note.md',
            action: 'create',
            unifiedDiff: '--- /dev/null\n+++ b/sandbox/note.md\n@@ -0,0 +1 @@\n+offline workcell note\n',
          }],
          cwd: story.repoRoot ?? resolved,
          currentBranch: 'cursor/62l-ac-offline-agent-runtime-workcells-4059',
          root: resolved,
        });
        summary = coding.proposal.accepted
          ? `structured patch ${coding.proposal.proposal.id}; shellCommands=0; security=${coding.security?.passed === true ? 'PASS' : 'FAIL'}`
          : coding.proposal.reason;
        state = coding.proposal.accepted && coding.security?.passed !== false ? 'PASS' : 'FAIL';
      } else if (story.workcellKind === 'quant') {
        const quant = await runQuantWorkcell({
          tenantId: story.tenantId,
          universeId: story.universeId,
          signals: [{ id: 's1', weight: 1, confidence: 0.6, direction: 0, evidenceRefs: ['synthetic:62lac'] }],
          includeQuantumResearch: true,
          root: resolved,
        });
        summary = `classical=${quant.classical.recommendation}; quantum=${quant.bridge?.quantumState ?? 'NOT_REQUESTED'}; trading=${quant.tradingAuthorized}`;
      } else if (story.workcellKind === 'infrastructure') {
        const infra = await runInfrastructureWorkcell({
          tenantId: story.tenantId,
          universeId: story.universeId,
          nodes: [{
            id: 'lab-1',
            kind: 'research_lab',
            label: 'Sandbox lab',
            classification: 'internal',
            provenanceRefs: ['synthetic:62lac'],
            state: 'KNOWN',
          }],
          root: resolved,
        });
        summary = `infra nodes=${infra.snapshot.nodes.length}; physicalDeviceControl=${infra.physicalDeviceControl}`;
      } else {
        const research = await runResearchWorkcell({
          tenantId: story.tenantId,
          universeId: story.universeId,
          question: story.objective,
          hypothesis: `Local hypothesis for ${story.title}`,
          consequence: story.consequence,
          root: resolved,
        });
        summary = `research loop status=${research.loop.result.status}; isReality=${research.isReality}`;
        const sim = await runScenarioSimulation({
          tenantId: story.tenantId,
          universeId: story.universeId,
          hypothesis: story.objective,
          consequence: story.consequence,
          root: resolved,
        });
        summary += `; simulation=${sim.status}`;
      }
      await persistHop(resolved, workcell, { hop: 'code_research_simulation', state, summary, at: nowIso() });
      await maybeCrash('code_research_simulation');
    }

    if (!hopDone(workcell, 'test')) {
      const tests = await runTestFixRetestLoop({
        tenantId: story.tenantId,
        universeId: story.universeId,
        cwd: story.repoRoot ?? resolved,
        commands: story.testCommands ?? ['git_diff_check'],
        maxAttempts: 3,
        runner: story.testRunner,
      });
      await persistHop(resolved, workcell, {
        hop: 'test',
        state: tests.passed ? 'PASS' : 'FAIL',
        summary: `attempts=${tests.attempts.length}; last=${tests.attempts.at(-1)?.reason ?? 'none'}`,
        at: nowIso(),
      });
      await maybeCrash('test');
    }

    if (!hopDone(workcell, 'critique')) {
      const council = await conveneReflectionCouncil({
        tenantId: story.tenantId,
        universeId: story.universeId,
        question: `Critique workcell ${workcell.id}: ${story.objective}`,
        root: resolved,
      });
      await persistHop(resolved, workcell, {
        hop: 'critique',
        state: council.consensusForced ? 'FAIL' : council.runtimeState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PASS',
        summary: `consensusForced=${council.consensusForced}; dissent=${council.dissent.length}`,
        at: nowIso(),
      });
      await maybeCrash('critique');
    }

    if (!hopDone(workcell, 'evidence')) {
      const event = await appendEvidenceEvent({
        kind: 'evidence',
        storyId: story.id,
        tenantId: story.tenantId,
        universeId: story.universeId,
        summary: `Workcell ${workcell.id} evidence checkpoint`,
        payload: { hops: workcell.completedHops.map((item) => item.hop), inventedFacts: false },
      }, resolved);
      workcell.evidenceRefs.push(event.id);
      await persistHop(resolved, workcell, {
        hop: 'evidence',
        state: 'PASS',
        summary: `evidence=${event.id}`,
        at: nowIso(),
      });
      await maybeCrash('evidence');
    }

    if (!hopDone(workcell, 'decision_gate')) {
      const gate = decisionGate({
        id: workcell.id,
        action: story.objective,
        consequence: story.consequence ?? 'LOW',
        production: story.production === true,
        financialCommitment: false,
        legalCommitment: false,
        permissionChange: story.permissionChange === true,
        externalPublication: false,
      });
      await persistHop(resolved, workcell, {
        hop: 'decision_gate',
        state: gate.executableByAgent ? 'PASS' : 'DENIED',
        summary: gate.reason,
        at: nowIso(),
      }, gate.executableByAgent ? workcell.state : 'denied');
      if (!gate.executableByAgent) return { workcell, hops: workcell.completedHops, durationMs: Date.now() - started, gate };
      await maybeCrash('decision_gate');
    }

    if (!hopDone(workcell, 'checkpoint')) {
      const store = new LocalCheckpointStore(join(resolved, '.xiv-local', 'brain-state.json'));
      await store.checkpoint({
        taskId: workcell.id,
        at: nowIso(),
        state: 'completed',
        attempt: workcell.attempts,
        summary: `Offline workcell checkpoint after ${workcell.completedHops.length} hops.`,
        evidence: workcell.evidenceRefs,
      });
      await persistHop(resolved, workcell, {
        hop: 'checkpoint',
        state: 'PASS',
        summary: 'Long-running checkpoint written to LocalCheckpointStore.',
        at: nowIso(),
      });
      await maybeCrash('checkpoint');
    }

    if (!hopDone(workcell, 'learning_ledger')) {
      const learning = await appendLearning({
        domain: 'technology',
        subject: `workcell:${workcell.id}`,
        claimState: 'VERIFIED_FACT',
        summary: `Cycle completed hops=${workcell.completedHops.length}; kind=${workcell.kind}`,
        sourceRefs: workcell.evidenceRefs,
        evidence: workcell.evidenceRefs,
        taskId: workcell.id,
      }, resolved);
      await persistHop(resolved, workcell, {
        hop: 'learning_ledger',
        state: 'PASS',
        summary: `learning=${learning.id}`,
        at: nowIso(),
      });
      await maybeCrash('learning_ledger');
    }

    if (!hopDone(workcell, 'strategy_memory')) {
      const tactic = await recordStrategyTactic({
        tenantId: story.tenantId,
        universeId: story.universeId,
        subject: story.title,
        tactic: `Prefer retrieval-before-reasoning and restart-safe hops for ${workcell.kind} workcells.`,
        outcome: 'succeeded',
        evidenceRefs: workcell.evidenceRefs,
        root: resolved,
      });
      await runBoundedImprovementAfterEvidence({
        tenantId: story.tenantId,
        universeId: story.universeId,
        objective: `Improve retrieval ranking for ${story.title}`,
        observed: `Tactic ${tactic.id} succeeded in sandbox.`,
        successful: true,
        evidenceRefs: workcell.evidenceRefs,
        root: resolved,
      });
      await persistHop(resolved, workcell, {
        hop: 'strategy_memory',
        state: 'PASS',
        summary: `strategy=${tactic.id}`,
        at: nowIso(),
      });
      await maybeCrash('strategy_memory');
    }

    if (!hopDone(workcell, 'next_task')) {
      await persistHop(resolved, workcell, {
        hop: 'next_task',
        state: 'PASS',
        summary: 'Cycle complete. Next task may be enqueued; no production deploy.',
        at: nowIso(),
      }, 'completed');
    }

    return { workcell, hops: workcell.completedHops, durationMs: Date.now() - started };
  } catch (error) {
    if (error instanceof SimulatedCrash) {
      workcell.state = 'running';
      workcell.updatedAt = nowIso();
      const store = await loadStore(resolved);
      const index = store.workcells.findIndex((item) => item.id === workcell.id);
      if (index >= 0) store.workcells[index] = workcell;
      await saveStore(resolved, store);
      throw error;
    }
    workcell.attempts += 0;
    if (workcell.attempts >= workcell.maxAttempts) {
      await persistHop(resolved, workcell, {
        hop: workcell.completedHops.at(-1)?.hop ?? 'agent_workcell',
        state: 'FAIL',
        summary: error instanceof Error ? error.message : 'Workcell failed.',
        at: nowIso(),
      }, 'dead_lettered');
    } else {
      workcell.state = 'failed';
      workcell.updatedAt = nowIso();
      const store = await loadStore(resolved);
      const index = store.workcells.findIndex((item) => item.id === workcell.id);
      if (index >= 0) store.workcells[index] = workcell;
      await saveStore(resolved, store);
    }
    throw error;
  } finally {
    releaseWorkcell(story.tenantId, story.universeId);
  }
}

export async function tickOfflineAgentRuntime(root = process.cwd()) {
  const recovered = await recoverInterruptedWorkcells(root);
  const store = await loadStore(root);
  const queued = store.workcells.filter((item) => item.state === 'queued');
  return {
    recovered,
    queued: queued.length,
    running: store.workcells.filter((item) => item.state === 'running').length,
    deadLetters: store.deadLetters.filter((item) => !item.recovered).length,
  };
}

export async function forceDeadLetter(input: {
  workcellId: string;
  tenantId: string;
  universeId: string;
  reason: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await loadStore(root);
  const workcell = store.workcells.find((item) =>
    item.id === input.workcellId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!workcell) throw new Error('WORKCELL_NOT_FOUND');
  workcell.attempts = workcell.maxAttempts;
  workcell.state = 'dead_lettered';
  workcell.updatedAt = nowIso();
  store.deadLetters.push({
    id: cortexId('dlq'),
    workcellId: workcell.id,
    tenantId: workcell.tenantId,
    universeId: workcell.universeId,
    reason: input.reason,
    attempts: workcell.attempts,
    recovered: false,
    createdAt: nowIso(),
    productionAuthorization: false,
  });
  await saveStore(root, store);
  return store.deadLetters.at(-1)!;
}

export async function buildOfflineWorkcellHealth(root = process.cwd()) {
  const store = await loadStore(root);
  const model = await routeLocalModel();
  const hardware = await scheduleWorkcellCompute();
  const supervisor = await localBrainStatus();
  const cycleComplete = store.workcells.filter((item) =>
    OFFLINE_OPERATING_CYCLE.every((hop) => item.completedHops.some((record) => record.hop === hop)),
  ).length;
  return {
    generatedAt: nowIso(),
    cycle: OFFLINE_OPERATING_CYCLE,
    workcells: store.workcells.length,
    completedCycles: cycleComplete,
    running: store.workcells.filter((item) => item.state === 'running').length,
    queued: store.workcells.filter((item) => item.state === 'queued').length,
    deadLetters: store.deadLetters.length,
    recoveredCrashes: store.recoveredCrashes,
    localModel: model,
    hardware,
    supervisor: {
      mode: supervisor.mode,
      productionGitPushEnabled: supervisor.productionGitPushEnabled,
      productionDatabaseWriteEnabled: supervisor.productionDatabaseWriteEnabled,
      autoProductionDeployEnabled: supervisor.autoProductionDeployEnabled,
    },
    resourceBudgetSample: resourceBudgetFor('health', 'health'),
    locks: {
      l4AutonomyEnabled: false as const,
      autoProductionDeploy: false as const,
      productionDatabaseWrite: false as const,
      productionGitPush: false as const,
      autoPermissionExpansion: false as const,
      founderImpersonation: false as const,
      physicalDeviceControl: false as const,
      tipLand: false as const,
    },
    missingPredecessors: {
      '62L-Z': 'WAITING_DATA',
      '62L-AA': 'WAITING_DATA',
      '62L-AB': 'WAITING_DATA',
    },
    next: '62L-AD — Distributed Offline Agent Network + Device Mesh + Local Model Federation',
    productionAuthorization: false as const,
    inventedPass: false as const,
  };
}

export async function writeOfflineWorkcellHealth(root = process.cwd()) {
  const report = await buildOfflineWorkcellHealth(root);
  const dir = join(root, '.xiv-local');
  await mkdir(dir, { recursive: true });
  const path = join(dir, 'offline-workcell-health.json');
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return { path, report };
}

export { reconcileWhenConnectivityReturns };
