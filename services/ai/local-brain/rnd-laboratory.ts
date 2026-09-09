import { createResearchCivilization, runResearchFeedbackLoop } from './research-civilization';
import type { ConsequenceClass } from './decision-gate';
import type { SimulatorScale } from './planetary-galactic-sim';

export async function createOfflineRndLaboratory(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const controller = await createResearchCivilization(input);
  return {
    labId: controller.id,
    mode: 'offline_rnd_laboratory' as const,
    controller,
    claimsConsciousness: false as const,
    l4AutonomyEnabled: false as const,
    productionAuthorization: false as const,
  };
}

export async function runOfflineRndExperiment(input: {
  tenantId: string;
  universeId: string;
  question: string;
  hypothesis: string;
  simulatorScale?: SimulatorScale;
  includeQuantumLab?: boolean;
  humanCorrection?: string;
  consequence?: ConsequenceClass;
  memoryIds?: string[];
  root?: string;
}) {
  const lab = await createOfflineRndLaboratory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const loop = await runResearchFeedbackLoop(input);
  return {
    lab,
    loop,
    isReality: false as const,
    productionAuthorization: false as const,
  };
}
