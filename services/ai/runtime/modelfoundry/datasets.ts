/**
 * Training / Evaluation Dataset Governance.
 * No cross-tenant training. No automatic private company data use.
 * No raw secrets. No hidden biometric training. No unlicensed copyrighted corpus copying.
 * Explicit opt-in for personal memory. Synthetic data OK for testing.
 */

import type {
  DataClass,
  DatasetClassification,
  DatasetConsentState,
  DatasetRightsState,
  DatasetSourceKind,
} from './types';

export type DatasetTenantScope = {
  tenantId: string;
  sharedTraining: false;
};

export type DatasetUniverseScope = {
  universeId: string;
  crossUniverseTraining: false;
};

export type DatasetRetention = {
  expiresAt: string | null;
  indefinite: false;
};

export type DatasetRedaction = {
  piiRedacted: boolean;
  secretsRedacted: boolean;
  biometricsRemoved: boolean;
};

export type DatasetProvenance = {
  sourceIds: readonly string[];
  complete: boolean;
  audited: boolean;
};

export type DatasetQuality = {
  score: number | null;
  passedGate: boolean;
};

export type DatasetAudit = {
  eventId: string;
  datasetId: string;
  action: string;
  actor: string;
  at: string;
};

export type DatasetSource = {
  kind: DatasetSourceKind;
  label: string;
};

export type DatasetConsent = {
  state: DatasetConsentState;
  subjectId: string | null;
};

export type DatasetRights = {
  state: DatasetRightsState;
  licenseId: string | null;
};

export type TrainingDataset = {
  datasetId: string;
  kind: 'TRAINING';
  source: DatasetSource;
  consent: DatasetConsent;
  rights: DatasetRights;
  classification: DatasetClassification;
  tenantScope: DatasetTenantScope;
  universeScope: DatasetUniverseScope;
  retention: DatasetRetention;
  redaction: DatasetRedaction;
  provenance: DatasetProvenance;
  quality: DatasetQuality;
  allowedDataClasses: readonly DataClass[];
  approvedForTraining: boolean;
  containsRawSecrets: false;
  hiddenBiometricTraining: false;
};

export type EvaluationDataset = Omit<TrainingDataset, 'kind'> & { kind: 'EVALUATION' };

export type DatasetRecord = TrainingDataset | EvaluationDataset;

export function createDataset(input: {
  datasetId: string;
  kind: 'TRAINING' | 'EVALUATION';
  sourceKind: DatasetSourceKind;
  tenantId: string;
  universeId: string;
  consent?: DatasetConsentState;
  rights?: DatasetRightsState;
  classification?: DatasetClassification;
  provenanceComplete?: boolean;
  qualityPassed?: boolean;
  approvedForTraining?: boolean;
  personalOptIn?: boolean;
}): DatasetRecord {
  const sourceKind = input.sourceKind;
  const consentState =
    input.consent ??
    (sourceKind === 'SYNTHETIC'
      ? 'N_A_SYNTHETIC'
      : sourceKind === 'OPT_IN_PERSONAL'
        ? input.personalOptIn
          ? 'EXPLICIT_OPT_IN'
          : 'NONE'
        : 'NONE');

  return {
    datasetId: input.datasetId,
    kind: input.kind,
    source: { kind: sourceKind, label: sourceKind },
    consent: { state: consentState, subjectId: sourceKind === 'OPT_IN_PERSONAL' ? 'subject' : null },
    rights: {
      state: input.rights ?? (sourceKind === 'SYNTHETIC' ? 'SYNTHETIC_OK' : 'UNKNOWN'),
      licenseId: null,
    },
    classification: input.classification ?? 'TENANT_SCOPED',
    tenantScope: { tenantId: input.tenantId, sharedTraining: false },
    universeScope: { universeId: input.universeId, crossUniverseTraining: false },
    retention: { expiresAt: null, indefinite: false },
    redaction: {
      piiRedacted: true,
      secretsRedacted: true,
      biometricsRemoved: true,
    },
    provenance: {
      sourceIds: [`src_${input.datasetId}`],
      complete: input.provenanceComplete ?? false,
      audited: false,
    },
    quality: {
      score: input.qualityPassed ? 1 : null,
      passedGate: input.qualityPassed ?? false,
    },
    allowedDataClasses: sourceKind === 'SYNTHETIC' ? ['SYNTHETIC'] : ['TENANT_PRIVATE'],
    approvedForTraining: input.approvedForTraining ?? false,
    containsRawSecrets: false,
    hiddenBiometricTraining: false,
  };
}

export function privateDataMayEnterSharedTraining(_dataset?: DatasetRecord): false {
  return false;
}

export function crossTenantDatasetDenied(input: {
  dataset: DatasetRecord;
  requestingTenantId: string;
}): { allowed: false; reason: string } | { allowed: true } {
  if (input.dataset.tenantScope.tenantId !== input.requestingTenantId) {
    return { allowed: false, reason: 'cross_tenant_dataset_denied' };
  }
  if (input.dataset.tenantScope.sharedTraining) {
    return { allowed: false, reason: 'shared_training_forbidden' };
  }
  return { allowed: true };
}

export function admitDatasetToTraining(input: {
  dataset: DatasetRecord;
  requestingTenantId: string;
  targetSharedCorpus?: boolean;
  crossUniverse?: boolean;
}) {
  if (input.targetSharedCorpus === true) {
    return { allowed: false as const, reason: 'private_data_cannot_enter_shared_training' };
  }
  const tenantGate = crossTenantDatasetDenied({
    dataset: input.dataset,
    requestingTenantId: input.requestingTenantId,
  });
  if (!tenantGate.allowed) {
    return { allowed: false as const, reason: tenantGate.reason };
  }
  if (input.crossUniverse === true || input.dataset.universeScope.crossUniverseTraining) {
    return { allowed: false as const, reason: 'cross_universe_training_denied' };
  }
  if (!input.dataset.approvedForTraining) {
    return { allowed: false as const, reason: 'unapproved_dataset_cannot_train' };
  }
  if (!input.dataset.provenance.complete) {
    return { allowed: false as const, reason: 'training_data_lineage_required' };
  }
  if (input.dataset.source.kind === 'RAW_SECRET') {
    return { allowed: false as const, reason: 'raw_secrets_forbidden' };
  }
  if (input.dataset.source.kind === 'BIOMETRIC_RAW') {
    return { allowed: false as const, reason: 'hidden_biometric_training_forbidden' };
  }
  if (input.dataset.source.kind === 'UNLICENSED_COPYRIGHT') {
    return { allowed: false as const, reason: 'unlicensed_copyright_corpus_forbidden' };
  }
  if (input.dataset.source.kind === 'PRIVATE_COMPANY' && !input.dataset.approvedForTraining) {
    return { allowed: false as const, reason: 'no_automatic_private_company_data_use' };
  }
  if (input.dataset.source.kind === 'OPT_IN_PERSONAL' && input.dataset.consent.state !== 'EXPLICIT_OPT_IN') {
    return { allowed: false as const, reason: 'personal_memory_requires_explicit_opt_in' };
  }
  if (
    input.dataset.rights.state === 'DENIED' ||
    input.dataset.rights.state === 'UNKNOWN'
  ) {
    if (input.dataset.source.kind !== 'SYNTHETIC') {
      return { allowed: false as const, reason: 'dataset_rights_insufficient' };
    }
  }
  if (!input.dataset.quality.passedGate) {
    return { allowed: false as const, reason: 'data_quality_gate_failed' };
  }
  return {
    allowed: true as const,
    datasetId: input.dataset.datasetId,
    sharedTraining: false as const,
    lineageRequired: true as const,
  };
}

export function syntheticDataAllowedForTesting(dataset: DatasetRecord): boolean {
  return dataset.source.kind === 'SYNTHETIC' && dataset.rights.state === 'SYNTHETIC_OK';
}

export function openDatasetAudit(dataset: DatasetRecord, action: string, actor: string): DatasetAudit {
  return {
    eventId: `dsaudit_${dataset.datasetId}`,
    datasetId: dataset.datasetId,
    action,
    actor,
    at: 'deterministic',
  };
}
