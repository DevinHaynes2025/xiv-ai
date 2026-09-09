import { buildBrainReport } from './brain-report';
import { knowledgeGraphStats } from './knowledge-graph';
import { populationStats } from './agent-population';
import { searchLearning } from './learning-ledger';
import { listAllMeetingRooms, meetingRoomStats } from './meeting-rooms';
import { loadNightShiftCheckpoint } from './night-shift';
import { providerSlots } from './provider-fabric';
import { OFFLINE_BRAIN_TRANSITION, readHeartbeat, listOfflineBrainJobs } from './offline-brain-runtime';

export type FounderReport = {
  generatedAt: string;
  headline: string;
  brain: Awaited<ReturnType<typeof buildBrainReport>>;
  knowledgeGraph: Awaited<ReturnType<typeof knowledgeGraphStats>>;
  population: ReturnType<typeof populationStats>;
  recentLearning: Awaited<ReturnType<typeof searchLearning>>;
  decisionsNeeded: string[];
  blockers: string[];
  operational: {
    transition: typeof OFFLINE_BRAIN_TRANSITION;
    workerHeartbeat: Awaited<ReturnType<typeof readHeartbeat>>;
    jobs: { total: number; queued: number; completed: number; blocked: number };
    meetings: ReturnType<typeof meetingRoomStats>;
    nightShift: Awaited<ReturnType<typeof loadNightShiftCheckpoint>>;
    providers: ReturnType<typeof providerSlots>;
  };
  safety: {
    l4AutonomyEnabled: false;
    productionSelfDeploy: false;
    permissionSelfExpansion: false;
  };
};

export async function buildFounderReport(root = process.cwd()): Promise<FounderReport> {
  const [brain, graph, recentLearning, heartbeat, jobs, rooms, nightShift] = await Promise.all([
    buildBrainReport(root),
    knowledgeGraphStats(root),
    searchLearning('', root),
    readHeartbeat(root),
    listOfflineBrainJobs(root),
    listAllMeetingRooms(root),
    loadNightShiftCheckpoint(root),
  ]);
  const population = populationStats();
  const providers = providerSlots();

  const blockers: string[] = [];
  if (!brain.health.ok) blockers.push('Local model is not verified AVAILABLE on this node.');
  if (!brain.durableBrainStatePresent) blockers.push('Checkpoint/task store has not been observed on this node.');
  if (!heartbeat) blockers.push('Persistent offline worker heartbeat has not been observed on this node.');
  if (providers.some((slot) => slot.provider !== 'local' && slot.state !== 'UNAVAILABLE' && !slot.configured)) {
    blockers.push('A non-local provider is marked usable without configuration evidence.');
  }

  const decisionsNeeded: string[] = [];
  if (!brain.health.ok) decisionsNeeded.push('Choose/install an approved local model and run offline verification.');
  if (graph.nodes === 0) decisionsNeeded.push('Ingest a small approved provenance-rich knowledge pack before scaling graph volume.');
  if (jobs.some((job) => job.state === 'blocked' || job.state === 'denied')) {
    decisionsNeeded.push('Review blocked/denied offline-brain jobs; consequential actions remain human-authorized.');
  }

  const workerRunning = Boolean(heartbeat && Date.parse(heartbeat.lastBeatAt) > Date.now() - 60_000);
  return {
    generatedAt: new Date().toISOString(),
    headline: workerRunning
      ? 'XIV Local Brain worker is operating; review meetings, jobs, and human decisions.'
      : brain.health.ok
        ? 'XIV Local Brain is reachable; continue bounded verification.'
        : 'XIV Local Brain code is present but the persistent worker is not verified running.',
    brain,
    knowledgeGraph: graph,
    population,
    recentLearning: recentLearning.slice(-20),
    decisionsNeeded,
    blockers,
    operational: {
      transition: OFFLINE_BRAIN_TRANSITION,
      workerHeartbeat: heartbeat,
      jobs: {
        total: jobs.length,
        queued: jobs.filter((job) => job.state === 'queued' || job.state === 'paused').length,
        completed: jobs.filter((job) => job.state === 'completed').length,
        blocked: jobs.filter((job) => job.state === 'blocked' || job.state === 'denied').length,
      },
      meetings: meetingRoomStats(rooms),
      nightShift,
      providers,
    },
    safety: {
      l4AutonomyEnabled: false,
      productionSelfDeploy: false,
      permissionSelfExpansion: false,
    },
  };
}
