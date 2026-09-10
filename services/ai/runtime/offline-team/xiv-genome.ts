export type GenomeStage = 'SEED' | 'LEARNING' | 'SPECIALIZED' | 'MATURE';
export type GenomeCapability = 'REASONING' | 'CODING' | 'DATABASE' | 'SECURITY' | 'LOGISTICS' | 'FINANCE' | 'HISTORY' | 'DATA_MINING' | 'SIMULATION' | 'HARDWARE';

export interface XivAgentGenome {
  genomeId: string;
  tenantId: string;
  generation: number;
  stage: GenomeStage;
  capabilities: Readonly<Record<GenomeCapability, number>>;
  evidenceRefs: readonly string[];
  parentGenomeId?: string;
  immutableBaseHash: string;
}

export const XIV_GENOME_GUARDRAILS = {
  biologicalGenomeClaim: false,
  biologicalCloningAllowed: false,
  modelWeightMutationAllowed: false,
  capabilityPromotionRequiresEvidence: true,
  maxGeneration: 1_000_000,
} as const;

export function matureGenome(input: XivAgentGenome, evidenceRefs: readonly string[]): XivAgentGenome {
  if (!input.genomeId || !input.tenantId || !input.immutableBaseHash) throw new Error('genome identity required');
  if (evidenceRefs.length === 0) throw new Error('capability growth requires evidence');
  const nextStage: GenomeStage = input.stage === 'SEED' ? 'LEARNING' : input.stage === 'LEARNING' ? 'SPECIALIZED' : 'MATURE';
  return Object.freeze({
    ...input,
    stage: nextStage,
    generation: Math.min(input.generation + 1, XIV_GENOME_GUARDRAILS.maxGeneration),
    evidenceRefs: Object.freeze([...input.evidenceRefs, ...evidenceRefs]),
    parentGenomeId: input.genomeId,
  });
}
