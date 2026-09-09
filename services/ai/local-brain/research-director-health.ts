import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { probeHardware } from './hardware-probe';
import { checkLocalBrainHealth } from './health-check';
import { AUTONOMOUS_RD_CYCLE, RESEARCH_HONESTY } from './autonomous-research-types';
import { predecessorMap, unconfiguredProviderStates } from './research-authority';
import { listNegativeResults } from './negative-result-memory';
import { listExperimentRuns } from './offline-experiment-factory';
import { createResearchDirector } from './research-director';

export async function buildResearchDirectorHealth(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const director = createResearchDirector({ tenantId: input.tenantId, universeId: input.universeId });
  const [health, hardware, negatives, runs] = await Promise.all([
    checkLocalBrainHealth(root),
    probeHardware(),
    listNegativeResults({ tenantId: input.tenantId, universeId: input.universeId, root }),
    listExperimentRuns({ tenantId: input.tenantId, universeId: input.universeId, root }),
  ]);
  const providers = unconfiguredProviderStates();
  return {
    phase: '62L-AI',
    cycle: AUTONOMOUS_RD_CYCLE,
    director,
    predecessors: predecessorMap(),
    negativeResults: negatives.length,
    experimentRuns: runs.length,
    localBrain: health,
    hardware: hardware.map((item) => ({ kind: item.kind, availability: item.availability, evidence: item.evidence })),
    providers: providers.slots,
    runtimes: {
      local: getRuntime('local').state,
      aws: getRuntime('aws').state,
      azure: getRuntime('azure').state,
      gcp: getRuntime('gcp').state,
    },
    providerSlotCount: providerSlots().length,
    honesty: RESEARCH_HONESTY,
    windowsNodeVerification: 'NOT_TESTED' as const,
    productionAuthorization: false as const,
    inventedPass: false as const,
  };
}
