import { reapExpiredAgents } from './agent-population';
import { planDemandAgents } from './demand-agent-planner';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { listAllMeetingRooms, openMeetingRoom, runMeetingRoomRound } from './meeting-rooms';
import { runNightShift, type NightShiftTask } from './night-shift';
import { runLocalBrainOnce } from './supervisor';
import {
  runCodingTestingWorkcell,
  runDecisionCouncil,
  runQuantWorkcell,
  runQuantumResearchWorkcell,
  type GovernedCodingProposal,
} from './workcells';
import { MESH_AGENT_ROLES, type MeshAgentRole } from './agent-mesh';
import type { ConsequenceClass } from './decision-gate';
import type { QuantSignal } from './quant-logic';
import type { QuantOptimizationProblem } from './quantum-research';

export const OFFLINE_BRAIN_TRANSITION = [
  'defined',
  'recruited',
  'communicating',
  'meeting',
  'retrieving_knowledge',
  'debating_decisions',
  'coding_testing',
  'recording_outcomes',
  'xiv_learning',
] as const;

export type OfflineBrainJobKind =
  | 'meeting'
  | 'knowledge_retrieval'
  | 'decision_council'
  | 'quant'
  | 'quantum_research'
  | 'coding_test'
  | 'night_shift'
  | 'recruitment'
  | 'founder_report';

export type OfflineBrainJobState =
  | 'queued'
  | 'running'
  | 'waiting_data'
  | 'unavailable'
  | 'denied'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'paused';

export type OfflineBrainJob = {
  id: string;
  kind: OfflineBrainJobKind;
  tenantId: string;
  universeId: string;
  objective: string;
  payload: Record<string, unknown>;
  state: OfflineBrainJobState;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  attempts: number;
  maxAttempts: number;
  productionAuthorized: false;
};

export type OfflineBrainHeartbeat = {
  pid: number;
  startedAt: string;
  lastBeatAt: string;
  jobsProcessed: number;
  localOnly: boolean;
  productionGitPushEnabled: false;
  productionDatabaseWriteEnabled: false;
  autoProductionDeployEnabled: false;
  l4AutonomyEnabled: false;
  permissionSelfExpansion: false;
};

type JobStore = { jobs: OfflineBrainJob[] };

function jobsPath(root: string) {
  return xivLocalPath(root, 'offline-brain-jobs.json');
}

function heartbeatPath(root: string) {
  return xivLocalPath(root, 'offline-brain-heartbeat.json');
}

async function loadJobs(root: string) {
  const parsed = await readJsonFile<JobStore>(jobsPath(root), { jobs: [] });
  return Array.isArray(parsed.jobs) ? parsed.jobs : [];
}

async function saveJobs(root: string, jobs: OfflineBrainJob[]) {
  await writeJsonFileAtomic(jobsPath(root), { jobs: jobs.slice(-2_000) });
}

function nowIso() {
  return new Date().toISOString();
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

let stopped = false;
let loopStartedAt = nowIso();
let jobsProcessed = 0;

export async function recoverInterruptedJobs(root = process.cwd()) {
  const jobs = await loadJobs(root);
  let recovered = 0;
  for (const job of jobs) {
    if (job.state === 'running') {
      job.state = 'queued';
      job.updatedAt = nowIso();
      recovered += 1;
    }
  }
  if (recovered) await saveJobs(root, jobs);
  return recovered;
}

export async function enqueueOfflineBrainJob(input: {
  kind: OfflineBrainJobKind;
  tenantId: string;
  universeId: string;
  objective: string;
  payload?: Record<string, unknown>;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.objective.trim()) throw new Error('JOB_OBJECTIVE_REQUIRED');
  const root = input.root ?? process.cwd();
  const at = nowIso();
  const job: OfflineBrainJob = {
    id: `ob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective.trim(),
    payload: input.payload ?? {},
    state: 'queued',
    evidenceRefs: [],
    createdAt: at,
    updatedAt: at,
    attempts: 0,
    maxAttempts: 3,
    productionAuthorized: false,
  };
  const jobs = await loadJobs(root);
  jobs.push(job);
  await saveJobs(root, jobs);
  return job;
}

export async function listOfflineBrainJobs(root = process.cwd()) {
  return loadJobs(root);
}

export async function readHeartbeat(root = process.cwd()) {
  return readJsonFile<OfflineBrainHeartbeat | null>(heartbeatPath(root), null);
}

export async function writeHeartbeat(root: string, extra?: Partial<OfflineBrainHeartbeat>) {
  const previous = await readHeartbeat(root);
  const beat: OfflineBrainHeartbeat = {
    pid: process.pid,
    startedAt: extra?.startedAt ?? previous?.startedAt ?? loopStartedAt,
    lastBeatAt: nowIso(),
    jobsProcessed: extra?.jobsProcessed ?? jobsProcessed,
    localOnly: process.env.XIV_LOCAL_ONLY === 'true',
    productionGitPushEnabled: false,
    productionDatabaseWriteEnabled: false,
    autoProductionDeployEnabled: false,
    l4AutonomyEnabled: false,
    permissionSelfExpansion: false,
  };
  await writeJsonFileAtomic(heartbeatPath(root), beat);
  return beat;
}

function asRoles(value: unknown, fallback: MeshAgentRole[]): MeshAgentRole[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((role): role is MeshAgentRole => typeof role === 'string' && (MESH_AGENT_ROLES as readonly string[]).includes(role));
}

async function dispatch(job: OfflineBrainJob, root: string): Promise<Pick<OfflineBrainJob, 'state' | 'evidenceRefs'>> {
  switch (job.kind) {
    case 'recruitment': {
      reapExpiredAgents();
      const roles = asRoles(job.payload.roles, ['workflow_planner']);
      const consequence = (asString(job.payload.consequence, 'LOW') || 'LOW') as ConsequenceClass;
      const result = planDemandAgents({
        tenantId: job.tenantId,
        universeId: job.universeId,
        taskId: job.id,
        requestedRoles: roles,
        consequence,
        approved: asBoolean(job.payload.approved, false),
      });
      if (result.status === 'HUMAN_APPROVAL_REQUIRED') return { state: 'blocked', evidenceRefs: [] };
      if (result.status !== 'PLANNED') return { state: 'denied', evidenceRefs: [] };
      return {
        state: 'completed',
        evidenceRefs: result.agents.map((item) => ('instance' in item && item.instance ? item.instance.id : result.status)),
      };
    }
    case 'knowledge_retrieval': {
      const result = await retrieveOfflineKnowledge(job.objective, {
        tenantId: job.tenantId,
        universeId: job.universeId,
        root,
        needsExternalFreshness: asBoolean(job.payload.needsExternalFreshness, false),
      });
      return { state: result.state === 'WAITING_DATA' ? 'waiting_data' : 'completed', evidenceRefs: result.evidenceRefs };
    }
    case 'meeting': {
      const roles = asRoles(job.payload.roles, ['architect', 'skeptic']);
      const existingId = asString(job.payload.roomId);
      const room = existingId
        ? { id: existingId }
        : await openMeetingRoom({
            tenantId: job.tenantId,
            universeId: job.universeId,
            objective: job.objective,
            roles,
            maxRounds: typeof job.payload.maxRounds === 'number' ? job.payload.maxRounds : 1,
            root,
          });
      const updated = await runMeetingRoomRound({
        roomId: room.id,
        tenantId: job.tenantId,
        universeId: job.universeId,
        root,
      });
      job.payload.roomId = room.id;
      if (updated.state === 'unavailable') return { state: 'unavailable', evidenceRefs: updated.knowledgeRefs };
      if (updated.state === 'completed') return { state: 'completed', evidenceRefs: updated.knowledgeRefs };
      return { state: 'paused', evidenceRefs: updated.knowledgeRefs };
    }
    case 'decision_council': {
      const consequence = (asString(job.payload.consequence, 'LOW') || 'LOW') as ConsequenceClass;
      const result = await runDecisionCouncil({
        tenantId: job.tenantId,
        universeId: job.universeId,
        action: job.objective,
        consequence,
        production: asBoolean(job.payload.production, false),
        financialCommitment: asBoolean(job.payload.financialCommitment, false),
        legalCommitment: asBoolean(job.payload.legalCommitment, false),
        permissionChange: asBoolean(job.payload.permissionChange, false),
        externalPublication: asBoolean(job.payload.externalPublication, false),
        approved: asBoolean(job.payload.approved, inputApprovedDefault(consequence)),
        root,
      });
      if (result.recommendation === 'HUMAN_APPROVAL_REQUIRED') {
        return { state: 'blocked', evidenceRefs: result.knowledge.evidenceRefs };
      }
      return { state: 'completed', evidenceRefs: result.knowledge.evidenceRefs };
    }
    case 'quant': {
      const signals = Array.isArray(job.payload.signals) ? job.payload.signals as QuantSignal[] : [];
      const result = await runQuantWorkcell({
        tenantId: job.tenantId,
        universeId: job.universeId,
        signals,
        approved: asBoolean(job.payload.approved, true),
        root,
      });
      return { state: 'completed', evidenceRefs: [`quant:${result.decision.recommendation}`] };
    }
    case 'quantum_research': {
      const qubitCount = typeof job.payload.qubitCount === 'number' ? job.payload.qubitCount : 4;
      const result = await runQuantumResearchWorkcell({
        tenantId: job.tenantId,
        universeId: job.universeId,
        experiment: {
          id: asString(job.payload.experimentId, job.id),
          objective: job.objective,
          algorithm: 'qaoa',
          backend: job.payload.backend === 'quantum_qpu' ? 'quantum_qpu' : 'classical_simulator',
          qubitCount,
          backendVerified: asBoolean(job.payload.backendVerified, false),
        },
        problem: job.payload.problem as QuantOptimizationProblem | undefined,
        approved: asBoolean(job.payload.approved, true),
        root,
      });
      if (result.experiment.state === 'UNAVAILABLE') {
        return { state: 'unavailable', evidenceRefs: [`experiment:${result.experiment.id}`] };
      }
      return { state: 'completed', evidenceRefs: [`experiment:${result.experiment.id}`] };
    }
    case 'coding_test': {
      const proposal = (job.payload.proposal ?? {
        summary: job.objective,
        files: [],
        testsExpected: [],
      }) as GovernedCodingProposal;
      const result = await runCodingTestingWorkcell({
        tenantId: job.tenantId,
        universeId: job.universeId,
        proposal,
        currentBranch: asString(job.payload.currentBranch) || undefined,
        cwd: asString(job.payload.cwd) || undefined,
        runTests: asBoolean(job.payload.runTests, false),
        approved: asBoolean(job.payload.approved, true),
        storyId: asString(job.payload.storyId, '62L-U'),
        root,
      });
      if (!result.accepted) return { state: 'denied', evidenceRefs: [result.reason] };
      return { state: 'completed', evidenceRefs: result.testResults.map((item) => `${item.id}:${item.exitCode}`) };
    }
    case 'night_shift': {
      const tasks = Array.isArray(job.payload.tasks) ? job.payload.tasks as NightShiftTask[] : [];
      const report = await runNightShift(tasks, { root, resume: asBoolean(job.payload.resume, true) });
      return {
        state: report.tasksBlocked > 0 && report.tasksCompleted === 0 ? 'blocked' : 'completed',
        evidenceRefs: report.results.map((item) => item.meetingId ?? item.taskId),
      };
    }
    case 'founder_report': {
      const rooms = await listAllMeetingRooms(root);
      return { state: 'completed', evidenceRefs: rooms.slice(-5).map((room) => room.id) };
    }
    default:
      return { state: 'failed', evidenceRefs: [] };
  }
}

function inputApprovedDefault(consequence: ConsequenceClass) {
  return consequence === 'LOW';
}

export async function runOfflineBrainOnce(root = process.cwd()) {
  await recoverInterruptedJobs(root);
  reapExpiredAgents();
  await writeHeartbeat(root);

  const jobs = await loadJobs(root);
  const job = jobs.find((item) => item.state === 'queued' || item.state === 'paused');
  if (!job) {
    await runLocalBrainOnce();
    await writeHeartbeat(root);
    return false;
  }

  if (job.attempts >= job.maxAttempts) {
    job.state = 'blocked';
    job.updatedAt = nowIso();
    await saveJobs(root, jobs);
    return true;
  }

  job.state = 'running';
  job.attempts += 1;
  job.updatedAt = nowIso();
  await saveJobs(root, jobs);

  try {
    const result = await dispatch(job, root);
    job.state = result.state;
    job.evidenceRefs = result.evidenceRefs;
    job.updatedAt = nowIso();
    jobsProcessed += 1;
  } catch (error) {
    job.state = job.attempts >= job.maxAttempts ? 'failed' : 'queued';
    job.updatedAt = nowIso();
    job.evidenceRefs = [`error:${(error as Error).message}`];
  }

  await saveJobs(root, jobs);
  await writeHeartbeat(root);
  return true;
}

export async function runOfflineBrainLoop(intervalMs = Number(process.env.XIV_LOCAL_POLL_MS ?? 5000), root = process.cwd()) {
  stopped = false;
  loopStartedAt = nowIso();
  jobsProcessed = 0;
  await recoverInterruptedJobs(root);
  await writeHeartbeat(root, { startedAt: loopStartedAt, jobsProcessed: 0 });
  while (!stopped) {
    const worked = await runOfflineBrainOnce(root);
    await new Promise((resolve) => setTimeout(resolve, worked ? 25 : Math.max(1000, intervalMs)));
  }
}

export function stopOfflineBrainLoop() {
  stopped = true;
}

export async function offlineBrainStats(root = process.cwd()) {
  const jobs = await loadJobs(root);
  const rooms = await listAllMeetingRooms(root);
  const heartbeat = await readHeartbeat(root);
  return {
    transition: OFFLINE_BRAIN_TRANSITION,
    jobs: {
      total: jobs.length,
      queued: jobs.filter((job) => job.state === 'queued' || job.state === 'paused').length,
      completed: jobs.filter((job) => job.state === 'completed').length,
      blocked: jobs.filter((job) => job.state === 'blocked' || job.state === 'denied').length,
      unavailable: jobs.filter((job) => job.state === 'unavailable' || job.state === 'waiting_data').length,
    },
    rooms: {
      total: rooms.length,
      open: rooms.filter((room) => room.state === 'open' || room.state === 'paused').length,
    },
    heartbeat,
    productionGitPushEnabled: false as const,
    productionDatabaseWriteEnabled: false as const,
    autoProductionDeployEnabled: false as const,
    l4AutonomyEnabled: false as const,
  };
}
