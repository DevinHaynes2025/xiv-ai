export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'licensed' | 'aggregated';

export type BrainLayer = 'personal' | 'company' | 'global';

export type DataOwnership = {
  organizationId: string | null;
  universeId: string | null;
  userId: string | null;
  brain: BrainLayer;
};

export type DataResidency = {
  region: string | null;
  requirement: 'unspecified' | 'requires_legal_review';
};

export type DataFreshness = 'fresh' | 'aging' | 'stale' | 'unknown' | 'historical';

export type DataProvenance = {
  sourceId: string;
  retrievedAt: string;
  license: string | null;
  classification: DataClassification;
};

export type DataAccessPolicy = {
  brain: BrainLayer;
  allowRead: boolean;
  reason: string;
};

export type DataSourceDescriptor = {
  sourceId: string;
  name: string;
  configured: false;
};

export type DataIngestionEvent = {
  eventId: string;
  sourceId: string;
  ingestedAt: string;
  persisted: false;
};

export type DataNormalizationResult = {
  accepted: boolean;
  reason: string;
};

export type DataQualityScore = {
  value: number | 'not_measured';
  evidenceRequired: true;
};

export type GlobalDataCatalogEntry = {
  entryId: string;
  sourceId: string;
  brain: BrainLayer;
  provenanceCategory: GlobalBrainProvenanceCategory | null;
};

export type GlobalBrainProvenanceCategory = 'public' | 'licensed' | 'anonymized_aggregated' | 'explicitly_shared' | 'otherwise_authorized';

export function personalEntersCompanyBrainAutomatically() {
  return false;
}

export function companyEntersGlobalBrainAutomatically() {
  return false;
}

export function globalBrainAllowsProvenance(category: string | null | undefined) {
  const allowed: readonly GlobalBrainProvenanceCategory[] = [
    'public',
    'licensed',
    'anonymized_aggregated',
    'explicitly_shared',
    'otherwise_authorized',
  ];
  if (!category || !(allowed as readonly string[]).includes(category)) {
    return {
      allowed: false as const,
      reason: 'Global Business Brain requires an explicit allowed provenance category.',
    };
  }
  return { allowed: true as const, category: category as GlobalBrainProvenanceCategory };
}

export function evaluateBrainTransfer(input: { from: BrainLayer; to: BrainLayer; explicitShare?: boolean }) {
  if (input.from === input.to) {
    return { allowed: true as const, reason: 'Same brain layer.' };
  }
  if (input.from === 'personal' && input.to === 'company') {
    return { allowed: false as const, reason: 'Personal Brain data must not automatically enter Company Brain.' };
  }
  if (input.from === 'company' && input.to === 'global') {
    if (input.explicitShare === true) {
      return { allowed: false as const, reason: 'Explicit share is recorded in policy but not executed in 2I-A. No Global Brain write.' };
    }
    return { allowed: false as const, reason: 'Company Brain private tenant data must not automatically enter Global Business Brain.' };
  }
  return { allowed: false as const, reason: 'Brain transfer denied by default.' };
}
