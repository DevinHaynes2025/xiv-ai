import {
  enqueueResearchJob,
  recoverInterruptedResearchJobs,
  listResearchJobs,
} from './offline-resilience';
import { evaluateOfflineTask, type OfflineTaskRequirement } from './offline-policy';

export async function enterOfflineCivilizationMode(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  requirement?: Partial<OfflineTaskRequirement>;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  await recoverInterruptedResearchJobs(input.root);
  const policy = evaluateOfflineTask({
    needsInternet: input.requirement?.needsInternet === true,
    needsCloudProvider: input.requirement?.needsCloudProvider === true,
    needsExternalFreshness: input.requirement?.needsExternalFreshness === true,
    needsProductionWrite: input.requirement?.needsProductionWrite === true,
    needsPermissionChange: input.requirement?.needsPermissionChange === true,
    classification: input.requirement?.classification ?? 'internal',
  });
  const job = await enqueueResearchJob({
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective,
    requirement: input.requirement,
    root: input.root,
  });
  const jobs = await listResearchJobs(input.root);
  return {
    mode: 'OFFLINE_CIVILIZATION' as const,
    preferOffline: true as const,
    policy,
    job,
    recoveredJobs: jobs.length,
    cloudDependentWork: policy.state === 'WAITING_DATA' || policy.state === 'UNAVAILABLE' || policy.state === 'DENIED'
      ? policy.state
      : 'LOCAL_EXECUTABLE',
    inventedFacts: false as const,
    productionAuthorization: false as const,
  };
}
