export interface FounderPrinciple { key: string; statement: string; evidenceRefs: readonly string[]; }
export interface FounderTwinProfile {
  identity: 'Devin Xavier Haynes';
  role: 'CEO_AND_COFOUNDER';
  principles: readonly FounderPrinciple[];
  decisionStyle: readonly string[];
  authority: 'ADVISORY_ONLY';
  literalMindClone: false;
}

export const FOUNDER_TWIN_GUARDRAILS = {
  advisoryOnly: true,
  literalMindClone: false,
  secretsInSourceAllowed: false,
  decisionsRequireEvidence: true,
  productionAuthority: false,
} as const;

export function buildFounderTwin(input: { principles: readonly FounderPrinciple[]; decisionStyle?: readonly string[] }): FounderTwinProfile {
  if (input.principles.some((p) => p.evidenceRefs.length === 0)) throw new Error('founder principles require evidence');
  return Object.freeze({
    identity: 'Devin Xavier Haynes',
    role: 'CEO_AND_COFOUNDER',
    principles: Object.freeze([...input.principles]),
    decisionStyle: Object.freeze([...(input.decisionStyle ?? ['vision-led','evidence-seeking','lean-iteration','offline-first'])]),
    authority: 'ADVISORY_ONLY',
    literalMindClone: false,
  });
}
