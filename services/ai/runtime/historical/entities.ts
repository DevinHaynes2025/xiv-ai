export type BusinessEntityIdentifierKind = 'legal_name' | 'sec_cik' | 'lei' | 'ticker' | 'registry_id' | 'domain' | 'country' | 'industry';

export type BusinessEntityIdentifier = {
  kind: BusinessEntityIdentifierKind;
  value: string;
};

export type BusinessEntityAlias = {
  alias: string;
  sourceId: string | null;
};

export type BusinessEntity = {
  entityId: string;
  identifiers: readonly BusinessEntityIdentifier[];
  aliases: readonly BusinessEntityAlias[];
};

export type BusinessEntityResolutionEvidence = {
  evidenceId: string;
  summary: string;
};

export type BusinessEntityResolutionConfidence = 'low' | 'medium' | 'high' | 'unknown';

export type BusinessEntityResolutionCandidate = {
  leftEntityId: string;
  rightEntityId: string;
  merged: false;
  confidence: BusinessEntityResolutionConfidence;
  evidence: readonly BusinessEntityResolutionEvidence[];
};

export function resolveEntitiesByNameOnly(leftName: string, rightName: string) {
  const similar = leftName.trim().toLowerCase() === rightName.trim().toLowerCase();
  return {
    merged: false as const,
    similar,
    reason: 'Entity resolution does not merge solely by similar name. Evidence and confidence are required.',
  };
}

export function resolveEntities(input: {
  left: BusinessEntity;
  right: BusinessEntity;
  evidence: readonly BusinessEntityResolutionEvidence[];
  confidence: BusinessEntityResolutionConfidence;
}) {
  const sharedStrongId = input.left.identifiers.some((left) =>
    input.right.identifiers.some(
      (right) =>
        left.kind === right.kind &&
        left.value === right.value &&
        (left.kind === 'sec_cik' || left.kind === 'lei' || left.kind === 'registry_id'),
    ),
  );
  if (!sharedStrongId || input.evidence.length === 0 || input.confidence === 'unknown') {
    return {
      merged: false as const,
      candidate: {
        leftEntityId: input.left.entityId,
        rightEntityId: input.right.entityId,
        merged: false as const,
        confidence: input.confidence,
        evidence: input.evidence,
      },
      reason: 'Automatic merge denied without authoritative identifier evidence.',
    };
  }
  return {
    merged: false as const,
    candidate: {
      leftEntityId: input.left.entityId,
      rightEntityId: input.right.entityId,
      merged: false as const,
      confidence: input.confidence,
      evidence: input.evidence,
    },
    reason: '2I-D records a candidate only. No automatic merge is executed.',
  };
}
