export interface LeadershipGene { geneId: string; trait: string; weight: number; evidenceRefs: readonly string[]; }
export interface LeadershipGenome { version: number; genes: readonly LeadershipGene[]; inheritedByAgents: readonly string[]; }
export const LEADERSHIP_GENOME_GUARDRAILS = { biologicalDNA:false, maxGenes:128, evidenceRequired:true, autonomousAuthority:false } as const;
export function compileLeadershipGenome(genes: readonly LeadershipGene[], inheritedByAgents: readonly string[] = []): LeadershipGenome {
  const valid = genes.filter((g) => g.geneId && g.trait.trim() && g.weight >= 0 && g.weight <= 1 && g.evidenceRefs.length > 0)
    .slice(0, LEADERSHIP_GENOME_GUARDRAILS.maxGenes);
  return Object.freeze({ version:1, genes:Object.freeze(valid), inheritedByAgents:Object.freeze([...new Set(inheritedByAgents)]) });
}
