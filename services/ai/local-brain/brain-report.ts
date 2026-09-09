import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import { MESH_AGENT_ROLES } from './agent-mesh';
import { BUSINESS_DEPARTMENTS } from './business-structure';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import { KNOWLEDGE_DOMAINS } from './knowledge-domains';
import { searchLearning } from './learning-ledger';

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function buildBrainReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const learning = await searchLearning('', root);
  // checkpoint-store.ts persists both queue/task and checkpoint state in one atomic file.
  const durableBrainState = await exists(join(root, '.xiv-local', 'brain-state.json'));
  const learningLedger = await exists(join(root, '.xiv-local', 'learning-ledger.json'));

  return {
    generatedAt: new Date().toISOString(),
    status: health.ok ? 'LOCAL_MODEL_AVAILABLE' : 'NOT_VERIFIED_RUNNING',
    logicalAgentRoles: MESH_AGENT_ROLES.length,
    logicalAgentRoleNames: [...MESH_AGENT_ROLES],
    departments: BUSINESS_DEPARTMENTS.length,
    knowledgeDomainsRegistered: KNOWLEDGE_DOMAINS.length,
    recentLearningEntriesVisible: learning.length,
    durableBrainStatePresent: durableBrainState,
    taskAndCheckpointStatePresent: durableBrainState,
    learningLedgerPresent: learningLedger,
    runtimes: ['local', 'gcp', 'azure', 'aws'].map((provider) => getRuntime(provider as 'local' | 'gcp' | 'azure' | 'aws')),
    health,
    authority: {
      l4AutonomyEnabled: false,
      productionSelfDeploy: false,
      permissionSelfExpansion: false,
      consequentialDecisionAuthority: 'HUMAN',
      lowConsequenceSandboxDecisionSupport: true,
    },
    notes: [
      'Logical agent roles are capabilities, not proof of simultaneously running processes.',
      'Learning count reflects locally readable ledger entries, not global knowledge volume.',
      'Durable state presence means a state file exists; it does not prove a worker is currently running.',
      'Code presence is not proof that the Windows node is currently executing offline.',
    ],
  };
}
