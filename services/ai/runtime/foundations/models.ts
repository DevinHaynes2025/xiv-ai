import { foundrySelfGrantPermissions } from '../knowledge/foundry';
import { defaultDenyUnknownHandoff } from '../security/firewall';

export type ModelRegistry = { registryId: string; selfAuthoritative: false };
export type ModelProvider = { providerId: string; proven: boolean };
export type ModelVersion = { version: string; production: boolean };
export type ModelCapability = { capability: string; grantsAuthority: false };
export type ModelEvaluation = { score: number | null; certainty: false };
export type ModelRisk = { level: 'low' | 'medium' | 'high'; selfApproved: false };
export type ModelPolicy = { guardianRequired: true };
export type ModelDeployment = { production: boolean; humanApproved: boolean };
export type ModelRollback = { available: true };
export type ModelAudit = { eventId: string };
export type PromptPolicy = { injectionIsolated: true };
export type ToolPolicy = { defaultDeny: true };
export type InferencePolicy = { resultValidationRequired: true };
export type EmbeddingPolicy = { classificationBound: true };
export type TrainingDataPolicy = { tenantPrivateExcludedByDefault: true };

export function modelGrantsOwnPermissions(): false {
  void foundrySelfGrantPermissions({
    specId: 'model-1',
    role: 'Model',
    toolsRequested: [],
    permissionsRequested: ['*'],
    state: 'PROPOSED',
    autonomousProduction: false,
  });
  return false;
}

export function scheduleAiWorkload(input: { guardianAuthorized: boolean; modelPolicyAllows: boolean }) {
  if (input.guardianAuthorized !== true || input.modelPolicyAllows !== true) {
    void defaultDenyUnknownHandoff();
    return { allowed: false as const, reason: 'ai_workload_requires_guardian_and_model_policy' };
  }
  return { allowed: true as const, validated: true as const, audited: true as const };
}

export function modelIsOwnAuthority(): false {
  return false;
}
