import { sign, verify } from './crypto';
import type { OfflineGrant, OfflineTaskResult, OfflineWorkPackage, SecurityClassification } from './types';
import { CLASSIFICATION_RANK } from './types';
import { capabilitySatisfies } from './xhal';

/**
 * Offline XIV (story sections 11 and 12).
 *
 * A disconnected node may only replay authority it was granted while online.
 * Offline mode never adds authority: `allowConsequentialActions` is typed as
 * `false`, so an offline package cannot even express permission to touch an
 * external system.
 */

export type OfflinePackageBody = Omit<OfflineWorkPackage, 'signature'>;

export function packageBody(pkg: OfflineWorkPackage): OfflinePackageBody {
  const { signature: _signature, ...body } = pkg;
  return body;
}

export function signOfflinePackage(fabricKey: string, body: OfflinePackageBody): string {
  return sign(fabricKey, body);
}

export function verifyOfflinePackage(fabricKey: string, pkg: OfflineWorkPackage): boolean {
  return verify(fabricKey, packageBody(pkg), pkg.signature);
}

/**
 * Narrows a requested grant to what the issuer is allowed to hand out. The
 * ceiling is applied here rather than at the call site so a caller cannot widen
 * a package by passing a larger request.
 */
export function boundGrant(requested: Partial<OfflineGrant>, ceiling: OfflineGrant): OfflineGrant {
  const classificationCeiling: SecurityClassification =
    requested.classificationCeiling &&
    CLASSIFICATION_RANK[requested.classificationCeiling] < CLASSIFICATION_RANK[ceiling.classificationCeiling]
      ? requested.classificationCeiling
      : ceiling.classificationCeiling;

  return {
    capabilities: (requested.capabilities ?? ceiling.capabilities).filter((capability) =>
      ceiling.capabilities.some((allowed) => capabilitySatisfies(allowed, capability)),
    ),
    allowedModels: (requested.allowedModels ?? ceiling.allowedModels).filter((modelId) =>
      ceiling.allowedModels.includes(modelId),
    ),
    allowedWorkloads: (requested.allowedWorkloads ?? ceiling.allowedWorkloads).filter((kind) =>
      ceiling.allowedWorkloads.includes(kind),
    ),
    classificationCeiling,
    maxTasks: Math.min(requested.maxTasks ?? ceiling.maxTasks, ceiling.maxTasks),
    maxTokens: Math.min(requested.maxTokens ?? ceiling.maxTokens, ceiling.maxTokens),
    maxDurationMs: Math.min(requested.maxDurationMs ?? ceiling.maxDurationMs, ceiling.maxDurationMs),
    allowConsequentialActions: false,
  };
}

export type GrantAudit = {
  violations: string[];
  acceptedTaskIds: string[];
  rejectedTaskIds: string[];
  tokensUsed: number;
  durationMs: number;
};

export function auditOfflineResults(
  pkg: OfflineWorkPackage,
  results: readonly OfflineTaskResult[],
): GrantAudit {
  const violations: string[] = [];
  const accepted: string[] = [];
  const rejected: string[] = [];
  const grant = pkg.grant;

  let tokensUsed = 0;
  let durationMs = 0;

  if (results.length > grant.maxTasks) {
    violations.push(`task_count_exceeded:${results.length}>${grant.maxTasks}`);
  }

  for (const result of results) {
    const taskViolations: string[] = [];

    if (result.consequentialAttempted) taskViolations.push('consequential_action_attempted');
    if (!grant.allowedWorkloads.includes(result.workloadKind)) {
      taskViolations.push(`workload_kind_not_granted:${result.workloadKind}`);
    }
    if (!grant.allowedModels.includes(result.modelId)) {
      taskViolations.push(`model_not_granted:${result.modelId}`);
    }
    if (!grant.capabilities.some((allowed) => capabilitySatisfies(allowed, result.capability))) {
      taskViolations.push(`capability_not_granted:${result.capability}`);
    }
    if (CLASSIFICATION_RANK[result.classification] > CLASSIFICATION_RANK[grant.classificationCeiling]) {
      taskViolations.push(`classification_exceeded:${result.classification}`);
    }

    tokensUsed += result.tokensUsed;
    durationMs += result.durationMs;

    if (taskViolations.length > 0) {
      rejected.push(result.taskId);
      violations.push(...taskViolations.map((violation) => `${result.taskId}:${violation}`));
    } else {
      accepted.push(result.taskId);
    }
  }

  if (tokensUsed > grant.maxTokens) violations.push(`token_budget_exceeded:${tokensUsed}>${grant.maxTokens}`);
  if (durationMs > grant.maxDurationMs) {
    violations.push(`duration_budget_exceeded:${durationMs}>${grant.maxDurationMs}`);
  }

  return { violations, acceptedTaskIds: accepted, rejectedTaskIds: rejected, tokensUsed, durationMs };
}
