/**
 * Model Registry — provider-neutral model lifecycle contracts.
 * No model gains authority because it is "smarter."
 */

import {
  MODEL_LIFECYCLE_STATES,
  MODEL_PROVIDER_KINDS,
  RUNNABLE_MODEL_STATES,
  type CapabilityLifecycle,
  type DataClass,
  type ModelApprovalStatus,
  type ModelLifecycleState,
  type ModelProviderKind,
} from './types';

export type ModelVersion = {
  major: number;
  minor: number;
  patch: number;
  label: string;
};

export type ModelCapability = {
  id: string;
  label: string;
  grantsAuthority: false;
  grantsTools: false;
};

export type ModelPolicy = {
  tenantScope: string;
  universeScope: string | null;
  allowedDataClasses: readonly DataClass[];
  crossUniverseTraining: false;
  bypassGuardian: false;
  grantTools: false;
  selfPromote: false;
  l4Enabled: false;
};

export type ModelEvaluationScores = {
  accuracy: number | null;
  groundedness: number | null;
  hallucinationRate: number | null;
  safetyFailures: number;
  latencyMs: number | null;
  costUnits: number | null;
};

export type ModelBenchmark = {
  benchmarkId: string;
  scores: ModelEvaluationScores;
  passed: boolean;
  humanReviewed: boolean;
};

export type ModelDatasetLineage = {
  datasetIds: readonly string[];
  provenanceComplete: boolean;
  trainingAllowed: boolean;
};

export type ModelExperiment = {
  experimentId: string;
  modelId: string;
  uncontrolledSelfRetrain: false;
  humanApprovalRequired: true;
};

export type ModelFineTuneCandidate = {
  candidateId: string;
  modelId: string;
  datasetLineage: ModelDatasetLineage;
  benchmark: ModelBenchmark | null;
  humanApproved: boolean;
  maySelfPromote: false;
};

export type ModelCanary = {
  canaryId: string;
  modelId: string;
  trafficPercent: number;
  rollbackTargetId: string | null;
};

export type ModelRollback = {
  fromModelId: string;
  toModelId: string;
  reason: string;
  automaticAuthorityGain: false;
};

export type ModelHealth = {
  modelId: string;
  state: ModelLifecycleState;
  healthy: boolean;
  driftDetected: boolean;
  quarantined: boolean;
};

export type ModelAudit = {
  eventId: string;
  modelId: string;
  action: string;
  actor: string;
  at: string;
  guardianBypass: false;
};

export type ModelDeployment = {
  deploymentId: string;
  modelId: string;
  state: ModelLifecycleState;
  approved: boolean;
  rollbackTargetId: string | null;
};

export type ModelRecord = {
  modelId: string;
  provider: ModelProviderKind;
  version: ModelVersion;
  state: ModelLifecycleState;
  tenantScope: string;
  universeScope: string | null;
  allowedDataClasses: readonly DataClass[];
  trainingDataLineage: ModelDatasetLineage;
  evalScores: ModelEvaluationScores;
  hallucinationRate: number | null;
  safetyFailures: number;
  costUnits: number | null;
  latencyMs: number | null;
  rollbackTargetId: string | null;
  approvalStatus: ModelApprovalStatus;
  smarterMeansMoreAuthority: false;
  mayBypassGuardian: false;
  mayGrantTools: false;
  maySelfPromote: false;
  l4Enabled: false;
};

export type ModelProvider = {
  kind: ModelProviderKind;
  state: CapabilityLifecycle;
  authenticated: false;
  tested: false;
  evidence: null;
  productionCredentialsEnabled: false;
};

export type ModelRegistry = {
  models: readonly ModelRecord[];
  providers: readonly ModelProvider[];
  productionLive: false;
  l4Enabled: false;
  uncontrolledSelfRetrain: false;
};

export function listModelLifecycleStates(): readonly ModelLifecycleState[] {
  return MODEL_LIFECYCLE_STATES;
}

export function listModelProviderKinds(): readonly ModelProviderKind[] {
  return MODEL_PROVIDER_KINDS;
}

export function openModelProviders(): readonly ModelProvider[] {
  return MODEL_PROVIDER_KINDS.map((kind) => ({
    kind,
    state: 'NOT_CONFIGURED' as const,
    authenticated: false as const,
    tested: false as const,
    evidence: null,
    productionCredentialsEnabled: false as const,
  }));
}

export function modelProviderState(kind: ModelProviderKind): CapabilityLifecycle {
  return openModelProviders().find((p) => p.kind === kind)?.state ?? 'NOT_CONFIGURED';
}

export function smarterModelMeansMoreAuthority(): false {
  return false;
}

export function modelMayBypassGuardian(_model?: ModelRecord): false {
  return false;
}

export function modelMayGrantTools(_model?: ModelRecord): false {
  return false;
}

export function modelMaySelfPromote(_model?: ModelRecord): false {
  return false;
}

export function modelMayPromoteToL4(): false {
  return false;
}

export function createModelRecord(input: {
  modelId: string;
  provider: ModelProviderKind;
  version: ModelVersion;
  state?: ModelLifecycleState;
  tenantScope: string;
  universeScope?: string | null;
  allowedDataClasses?: readonly DataClass[];
  trainingDataLineage?: ModelDatasetLineage;
  evalScores?: Partial<ModelEvaluationScores>;
  rollbackTargetId?: string | null;
  approvalStatus?: ModelApprovalStatus;
}): ModelRecord {
  const lineage = input.trainingDataLineage ?? {
    datasetIds: [],
    provenanceComplete: false,
    trainingAllowed: false,
  };
  return {
    modelId: input.modelId,
    provider: input.provider,
    version: input.version,
    state: input.state ?? 'BASE_MODEL',
    tenantScope: input.tenantScope,
    universeScope: input.universeScope ?? null,
    allowedDataClasses: input.allowedDataClasses ?? ['PUBLIC', 'SYNTHETIC'],
    trainingDataLineage: lineage,
    evalScores: {
      accuracy: input.evalScores?.accuracy ?? null,
      groundedness: input.evalScores?.groundedness ?? null,
      hallucinationRate: input.evalScores?.hallucinationRate ?? null,
      safetyFailures: input.evalScores?.safetyFailures ?? 0,
      latencyMs: input.evalScores?.latencyMs ?? null,
      costUnits: input.evalScores?.costUnits ?? null,
    },
    hallucinationRate: input.evalScores?.hallucinationRate ?? null,
    safetyFailures: input.evalScores?.safetyFailures ?? 0,
    costUnits: input.evalScores?.costUnits ?? null,
    latencyMs: input.evalScores?.latencyMs ?? null,
    rollbackTargetId: input.rollbackTargetId ?? null,
    approvalStatus: input.approvalStatus ?? 'UNAPPROVED',
    smarterMeansMoreAuthority: false,
    mayBypassGuardian: false,
    mayGrantTools: false,
    maySelfPromote: false,
    l4Enabled: false,
  };
}

export function openModelRegistry(models: readonly ModelRecord[] = []): ModelRegistry {
  return {
    models,
    providers: openModelProviders(),
    productionLive: false,
    l4Enabled: false,
    uncontrolledSelfRetrain: false,
  };
}

export function registerModel(registry: ModelRegistry, model: ModelRecord): ModelRegistry {
  if (model.trainingDataLineage.datasetIds.length > 0 && !model.trainingDataLineage.provenanceComplete) {
    return registry;
  }
  return { ...registry, models: [...registry.models, model] };
}

export type PromoteModelRequest = {
  model: ModelRecord;
  targetState: ModelLifecycleState;
  humanApproved: boolean;
  guardianApproved: boolean;
  selfPromote?: boolean;
  bypassGuardian?: boolean;
  grantTools?: boolean;
  enableL4?: boolean;
};

export function promoteModel(input: PromoteModelRequest) {
  if (input.selfPromote === true || input.model.maySelfPromote) {
    return { allowed: false as const, reason: 'model_cannot_self_promote' };
  }
  if (input.bypassGuardian === true || input.model.mayBypassGuardian) {
    return { allowed: false as const, reason: 'model_cannot_bypass_guardian' };
  }
  if (input.grantTools === true || input.model.mayGrantTools) {
    return { allowed: false as const, reason: 'model_cannot_grant_tools' };
  }
  if (input.enableL4 === true || input.model.l4Enabled) {
    return { allowed: false as const, reason: 'l4_remains_disabled' };
  }
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'guardian_required' };
  }
  if (!input.humanApproved) {
    return { allowed: false as const, reason: 'human_approval_required' };
  }
  if (input.model.state === 'QUARANTINED') {
    return { allowed: false as const, reason: 'quarantined_model_cannot_promote' };
  }
  if (input.targetState === 'PRODUCTION' && input.model.approvalStatus !== 'APPROVED') {
    return { allowed: false as const, reason: 'production_requires_approval' };
  }
  if (
    (input.targetState === 'FINE_TUNED' || input.targetState === 'FINE_TUNE_CANDIDATE') &&
    !input.model.trainingDataLineage.provenanceComplete
  ) {
    return { allowed: false as const, reason: 'training_data_lineage_required' };
  }
  return {
    allowed: true as const,
    modelId: input.model.modelId,
    state: input.targetState,
    grantsAuthority: false as const,
  };
}

export function runModelInference(input: {
  model: ModelRecord;
  bypassGuardian?: boolean;
  grantTools?: boolean;
  enableL4?: boolean;
}) {
  if (input.model.state === 'QUARANTINED') {
    return { allowed: false as const, reason: 'quarantined_model_cannot_run' };
  }
  if (input.model.state === 'RETIRED') {
    return { allowed: false as const, reason: 'retired_model_cannot_run' };
  }
  if (!(RUNNABLE_MODEL_STATES as readonly string[]).includes(input.model.state) && input.model.state !== 'BASE_MODEL') {
    return { allowed: false as const, reason: 'model_state_not_runnable' };
  }
  if (input.bypassGuardian === true) {
    return { allowed: false as const, reason: 'model_cannot_bypass_guardian' };
  }
  if (input.grantTools === true) {
    return { allowed: false as const, reason: 'model_cannot_grant_tools' };
  }
  if (input.enableL4 === true) {
    return { allowed: false as const, reason: 'l4_remains_disabled' };
  }
  if (input.model.state === 'BASE_MODEL' && input.model.approvalStatus === 'UNAPPROVED') {
    return { allowed: true as const, mode: 'evaluation_sandbox' as const, authorityGain: false as const };
  }
  return { allowed: true as const, mode: 'governed' as const, authorityGain: false as const };
}

export function quarantineModel(model: ModelRecord): ModelRecord {
  return { ...model, state: 'QUARANTINED', approvalStatus: 'REVOKED' };
}

export function createFineTuneCandidate(input: {
  modelId: string;
  datasetLineage: ModelDatasetLineage;
  benchmark: ModelBenchmark | null;
  humanApproved: boolean;
}): ModelFineTuneCandidate | { allowed: false; reason: string } {
  if (!input.datasetLineage.provenanceComplete) {
    return { allowed: false, reason: 'training_data_lineage_required' };
  }
  if (!input.datasetLineage.trainingAllowed) {
    return { allowed: false, reason: 'dataset_not_approved_for_training' };
  }
  return {
    candidateId: `ftc_${input.modelId}`,
    modelId: input.modelId,
    datasetLineage: input.datasetLineage,
    benchmark: input.benchmark,
    humanApproved: input.humanApproved,
    maySelfPromote: false,
  };
}

export function openModelHealth(model: ModelRecord): ModelHealth {
  return {
    modelId: model.modelId,
    state: model.state,
    healthy: model.state !== 'DEGRADED' && model.state !== 'QUARANTINED' && model.state !== 'RETIRED',
    driftDetected: false,
    quarantined: model.state === 'QUARANTINED',
  };
}
