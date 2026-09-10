import { createHash } from 'node:crypto';

export interface CivilizationNode {
  id: string;
  label: string;
  period?: string;
  region?: string;
  kind: 'CIVILIZATION' | 'PERSON' | 'IDEA' | 'INVENTION' | 'EVENT' | 'DOCUMENT' | 'INSTITUTION';
  evidenceRefs: string[];
  confidence: number;
}

export interface CivilizationEdge {
  id: string;
  from: string;
  to: string;
  relation: 'INFLUENCED' | 'PRECEDED' | 'DOCUMENTED_BY' | 'CREATED' | 'CHALLENGED' | 'TRADED_WITH' | 'LEARNED_FROM';
  evidenceRefs: string[];
  confidence: number;
}

export function createCivilizationNode(input: Omit<CivilizationNode, 'id'>): CivilizationNode {
  if (!input.evidenceRefs.length) throw new Error('historical knowledge requires evidence');
  if (input.confidence < 0 || input.confidence > 1) throw new Error('invalid confidence');
  const id = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return { ...input, id };
}

export function createCivilizationEdge(input: Omit<CivilizationEdge, 'id'>): CivilizationEdge {
  if (!input.evidenceRefs.length) throw new Error('historical relationship requires evidence');
  const id = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return { ...input, id };
}

export const CIVILIZATION_GRAPH_GUARDRAILS = {
  literalSoulCapture: false,
  literalConsciousnessReconstruction: false,
  historicalPersonaIsEvidenceProfile: true,
  correlationIsCausation: false,
  contestedClaimsPreserveUncertainty: true,
  provenanceRequired: true,
};
