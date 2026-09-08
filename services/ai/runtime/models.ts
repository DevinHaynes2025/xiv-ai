import { sign, verify } from './crypto';
import type {
  ModelRecord,
  RuntimeNodeRecord,
  TenantScope,
  WorkloadRecord,
} from './types';
import { CLASSIFICATION_RANK } from './types';
import { capabilitySatisfies } from './xhal';

/**
 * Model runtime registry and routing (story sections 20 and 21).
 *
 * Agents should not assume every model can execute everywhere, and unproven
 * models remain unavailable. Selection walks the same ladder as compute: task
 * classification, model requirement, security requirement, evaluation
 * requirement, hardware requirement, cost budget.
 */

export type ModelRejection =
  | 'model_unavailable'
  | 'model_not_evaluated'
  | 'domain_not_approved'
  | 'classification_exceeds_model'
  | 'context_limit_too_small'
  | 'capability_missing'
  | 'hardware_requirement_unmet'
  | 'tenant_mismatch';

export type ModelCandidate = {
  modelId: string;
  eligible: boolean;
  reason: 'eligible' | ModelRejection;
  costUsd: number | null;
};

export function evaluateModel(
  model: ModelRecord,
  workload: WorkloadRecord,
  node: RuntimeNodeRecord,
  scope: TenantScope,
): ModelCandidate {
  const rejectWith = (reason: ModelRejection): ModelCandidate => ({
    modelId: model.modelId,
    eligible: false,
    reason,
    costUsd: null,
  });

  if (model.scope && (model.scope.organizationId !== scope.organizationId || model.scope.universeId !== scope.universeId)) {
    return rejectWith('tenant_mismatch');
  }
  if (model.availability === 'unavailable') return rejectWith('model_unavailable');
  if (model.evaluationState !== 'evaluated') return rejectWith('model_not_evaluated');
  if (!model.approvedDomains.includes(workload.kind)) return rejectWith('domain_not_approved');
  if (CLASSIFICATION_RANK[workload.classification] > CLASSIFICATION_RANK[model.securityClassification]) {
    return rejectWith('classification_exceeds_model');
  }

  const requirement = workload.modelRequirement;
  if (requirement) {
    if (requirement.family && requirement.family !== model.modelFamily) return rejectWith('capability_missing');
    if (requirement.minContext && model.contextLimit < requirement.minContext) {
      return rejectWith('context_limit_too_small');
    }
    for (const wanted of requirement.requiredCapabilities ?? []) {
      if (!model.capabilities.some((offered) => capabilitySatisfies(offered, wanted))) {
        return rejectWith('capability_missing');
      }
    }
  }

  if (!model.capabilities.some((offered) => capabilitySatisfies(offered, workload.requestedCapability))) {
    return rejectWith('capability_missing');
  }

  const acceleratorsNeeded = model.hardwareRequirement.acceleratorSupport;
  const acceleratorMet =
    acceleratorsNeeded.length === 0 ||
    acceleratorsNeeded.some((accelerator) => node.hardware.acceleratorSupport.includes(accelerator));
  if (!acceleratorMet || node.hardware.memoryAvailableMb < model.hardwareRequirement.minMemoryMb) {
    return rejectWith('hardware_requirement_unmet');
  }

  const costUsd =
    (workload.estimate.tokens / 1000) * model.costProfile.perThousandTokensUsd +
    (workload.estimate.runtimeMs / 1000) * model.costProfile.perSecondUsd;

  return { modelId: model.modelId, eligible: true, reason: 'eligible', costUsd: Number(costUsd.toFixed(6)) };
}

export function selectModel(
  models: readonly ModelRecord[],
  workload: WorkloadRecord,
  node: RuntimeNodeRecord,
  scope: TenantScope,
): { model: ModelRecord | null; candidates: ModelCandidate[] } {
  const candidates = models.map((model) => evaluateModel(model, workload, node, scope));
  const eligible = candidates
    .filter((candidate) => candidate.eligible)
    .sort((a, b) => (a.costUsd ?? 0) - (b.costUsd ?? 0) || (a.modelId < b.modelId ? -1 : 1));
  const chosen = eligible[0]
    ? models.find((model) => model.modelId === eligible[0]!.modelId) ?? null
    : null;
  return { model: chosen, candidates };
}

/* ------------------------------------------------------------------ */
/* Substitution control                                                */
/* ------------------------------------------------------------------ */

export type ModelBindingClaim = {
  assignmentId: string;
  modelId: string;
  fingerprint: string;
};

/**
 * The binding is minted by the control plane and echoed back by the runtime on
 * completion. A node that swaps the served weights cannot produce a binding
 * that matches the approved model and fingerprint.
 */
export function mintModelBinding(fabricKey: string, claim: ModelBindingClaim): string {
  return sign(fabricKey, claim);
}

export function verifyModelBinding(fabricKey: string, claim: ModelBindingClaim, binding: string): boolean {
  return verify(fabricKey, claim, binding);
}
