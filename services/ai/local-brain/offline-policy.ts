export type OfflineTaskRequirement = {
  needsInternet: boolean;
  needsCloudProvider: boolean;
  needsExternalFreshness: boolean;
  needsProductionWrite: boolean;
  needsPermissionChange: boolean;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
};

export type OfflineDecision =
  | { allowed: true; state: 'LOCAL_EXECUTABLE'; reason: string }
  | { allowed: false; state: 'WAITING_DATA' | 'UNAVAILABLE' | 'DENIED'; reason: string };

export function evaluateOfflineTask(requirement: OfflineTaskRequirement): OfflineDecision {
  if (requirement.needsProductionWrite) {
    return { allowed: false, state: 'DENIED', reason: 'Offline agents cannot perform production writes.' };
  }
  if (requirement.needsPermissionChange) {
    return { allowed: false, state: 'DENIED', reason: 'Offline agents cannot expand or modify permissions.' };
  }
  if (requirement.needsInternet || requirement.needsExternalFreshness) {
    return { allowed: false, state: 'WAITING_DATA', reason: 'Task requires current external information.' };
  }
  if (requirement.needsCloudProvider) {
    return { allowed: false, state: 'UNAVAILABLE', reason: 'Cloud-only work is unavailable while offline.' };
  }
  return { allowed: true, state: 'LOCAL_EXECUTABLE', reason: 'Task is eligible for bounded local execution.' };
}
