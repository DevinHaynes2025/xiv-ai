import { buildBrainReport } from './brain-report';
import { knowledgeGraphStats } from './knowledge-graph';
import { populationStats } from './agent-population';
import { searchLearning } from './learning-ledger';

export type FounderReport = {
  generatedAt: string;
  headline: string;
  brain: Awaited<ReturnType<typeof buildBrainReport>>;
  knowledgeGraph: Awaited<ReturnType<typeof knowledgeGraphStats>>;
  population: ReturnType<typeof populationStats>;
  recentLearning: Awaited<ReturnType<typeof searchLearning>>;
  decisionsNeeded: string[];
  blockers: string[];
  safety: {
    l4AutonomyEnabled: false;
    productionSelfDeploy: false;
    permissionSelfExpansion: false;
  };
};

export async function buildFounderReport(root = process.cwd()): Promise<FounderReport> {
  const [brain, graph, recentLearning] = await Promise.all([
    buildBrainReport(root),
    knowledgeGraphStats(root),
    searchLearning('', root),
  ]);
  const population = populationStats();

  const blockers: string[] = [];
  if (!brain.health.ok) blockers.push('Local model is not verified AVAILABLE on this node.');
  if (!brain.durableBrainStatePresent) blockers.push('Checkpoint store has not been observed on this node.');
  if (!brain.taskAndCheckpointStatePresent) blockers.push('Task queue has not been observed on this node.');

  const decisionsNeeded: string[] = [];
  if (!brain.health.ok) decisionsNeeded.push('Choose/install an approved local model and run offline verification.');
  if (graph.nodes === 0) decisionsNeeded.push('Ingest a small approved provenance-rich knowledge pack before scaling graph volume.');

  return {
    generatedAt: new Date().toISOString(),
    headline: brain.health.ok ? 'XIV Local Brain is reachable; continue bounded verification.' : 'XIV Local Brain code is present but local execution is not yet verified.',
    brain,
    knowledgeGraph: graph,
    population,
    recentLearning: recentLearning.slice(-20),
    decisionsNeeded,
    blockers,
    safety: {
      l4AutonomyEnabled: false,
      productionSelfDeploy: false,
      permissionSelfExpansion: false,
    },
  };
}
