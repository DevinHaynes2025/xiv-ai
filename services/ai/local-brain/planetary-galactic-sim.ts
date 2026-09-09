import { runScenarioSimulation, type ScenarioSimulation } from './simulation-lab';
import { retrieveEvidencePathway } from './cortex-evidence';
import { rememberCortexTrace } from './memory-cortex';
import type { ConsequenceClass } from './decision-gate';
import { PHYSICS_HONESTY } from './physics-domains';

export type SimulatorScale = 'planetary' | 'galactic';

export type PlanetaryGalacticRun = {
  scale: SimulatorScale;
  simulation: ScenarioSimulation;
  isReality: false;
  galacticInfrastructure: 'simulation_research_only';
  controlsPhysicalSystems: false;
  darkMatterAsInfrastructure: false;
  darkEnergyAsInfrastructure: false;
  productionAuthorization: false;
  evidenceRefs: string[];
};

export async function runPlanetaryGalacticSimulator(input: {
  tenantId: string;
  universeId: string;
  scale: SimulatorScale;
  hypothesis: string;
  consequence?: ConsequenceClass;
  root?: string;
}): Promise<PlanetaryGalacticRun> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.hypothesis.trim()) throw new Error('SIMULATOR_HYPOTHESIS_REQUIRED');

  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.hypothesis,
    root: input.root,
  });

  const simulation = await runScenarioSimulation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: `${input.scale} research simulation (not reality): ${input.hypothesis}`,
    consequence: input.consequence ?? 'LOW',
    production: false,
    root: input.root,
  });

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'world',
    kind: 'scenario',
    claimState: 'PREDICTION',
    label: `${input.scale} simulator: ${input.hypothesis.slice(0, 72)}`,
    summary: `isReality=false; galacticInfrastructure=simulation_research_only; controlsPhysicalSystems=false`,
    evidenceRefs: evidence.evidenceRefs,
    sourceRefs: [`sim:${simulation.id}`],
    retentionClass: 'working',
    root: input.root,
  });

  return {
    scale: input.scale,
    simulation,
    isReality: false,
    galacticInfrastructure: 'simulation_research_only',
    controlsPhysicalSystems: false,
    darkMatterAsInfrastructure: PHYSICS_HONESTY.darkMatterUsableAsCompute,
    darkEnergyAsInfrastructure: PHYSICS_HONESTY.darkEnergyUsableAsCompute,
    productionAuthorization: false,
    evidenceRefs: evidence.evidenceRefs,
  };
}
