export type DurableIdKind =
  | 'Entity'
  | 'Relationship'
  | 'Source'
  | 'Evidence'
  | 'Event'
  | 'Version'
  | 'Organization'
  | 'Universe';

export type RootRelationship = {
  relationshipId: string;
  from: string;
  to: string;
  kind: string;
  active: boolean;
  historicalRetention: true;
  evidence: { source: string; retrievedAt: string; reference: string };
};

export function retainHistoricalRelationship(input: {
  from: string;
  to: string;
  kind: string;
  disappeared: boolean;
  evidence?: { source: string; retrievedAt: string; reference: string } | null;
}): RootRelationship | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: 'root_relationship_requires_provenance' };
  }
  return {
    relationshipId: `rel:${input.from}:${input.kind}:${input.to}`,
    from: input.from,
    to: input.to,
    kind: input.kind,
    active: !input.disappeared,
    historicalRetention: true,
    evidence: input.evidence,
  };
}

export const ROOT_GRAPH_LAYERS = ['ROOTS', 'TRUNK', 'BRANCHES', 'LEAVES'] as const;
