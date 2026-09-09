/**
 * CloudAgentRuntime abstraction + first deployment target honesty.
 * No fabricated cloud resources. Unconfigured → NOT_CONFIGURED / BLOCKED.
 */

import type {
  CloudProviderKind,
  CloudProviderStatus,
  CloudWorkerEvidence,
  DeploymentTargetHonesty,
  WorkerIdentity,
  WorkerProcessState,
} from './types';
import { detectCloudDeployment } from './deployment';
import { createWorkerIdentity } from './identity';
import { transitionWorkerProcess } from './lifecycle';

export type CloudAgentRuntime = {
  runtimeId: string;
  phase: '2I-LA-02';
  deployment: DeploymentTargetHonesty;
  workers: Map<string, { identity: WorkerIdentity; state: WorkerProcessState }>;
  l4Enabled: false;
  defaultPermissions: 'NONE';
  runs247Live: false;
  indefinite247Claimed: false;
};

export function openCloudAgentRuntime(input?: {
  runtimeId?: string;
  preferredProvider?: CloudProviderKind;
}): CloudAgentRuntime {
  const deployment = detectCloudDeployment(input?.preferredProvider ?? 'LOCAL_PROCESS');
  return {
    runtimeId: input?.runtimeId ?? 'cloud-agent-runtime-v1',
    phase: '2I-LA-02',
    deployment,
    workers: new Map(),
    l4Enabled: false,
    defaultPermissions: 'NONE',
    runs247Live: false,
    indefinite247Claimed: false,
  };
}

export function registerRuntimeWorker(
  runtime: CloudAgentRuntime,
  input: {
    workerId: string;
    instanceId: string;
    role: WorkerIdentity['agentRole'];
    tenantId: string;
    universeId: string;
    capabilities: readonly string[];
  },
): WorkerIdentity {
  const identity = createWorkerIdentity(input);
  runtime.workers.set(identity.workerId, { identity, state: 'CREATED' });
  return identity;
}

export function startRuntimeWorker(
  runtime: CloudAgentRuntime,
  workerId: string,
): { ok: true; state: WorkerProcessState } | { ok: false; reason: string } {
  const row = runtime.workers.get(workerId);
  if (!row) return { ok: false, reason: 'worker_not_found' };
  if (runtime.deployment.cloudDeployment === 'BLOCKED' && runtime.deployment.provider !== 'LOCAL_PROCESS') {
    return { ok: false, reason: 'cloud_deployment_blocked' };
  }
  const next = transitionWorkerProcess(row.state, 'START');
  if (!next.ok) return next;
  row.state = next.state;
  const healthy = transitionWorkerProcess(row.state, 'MARK_HEALTHY');
  if (healthy.ok) row.state = healthy.state;
  return { ok: true, state: row.state };
}

export function providerStatusLabel(status: CloudProviderStatus): CloudProviderStatus {
  return status;
}

export function openPhase2ilbGrounding(evidence?: Partial<CloudWorkerEvidence>) {
  const deployment = detectCloudDeployment('LOCAL_PROCESS');
  return {
    phase: '2I-LA-02' as const,
    title: 'Cloud Worker Deployment + Scheduler',
    l4Enabled: false as const,
    defaultPermissions: 'NONE' as const,
    architectureExistsIsNotLive247: true as const,
    productionLive: false as const,
    unconfiguredAdapters: 'NOT_CONFIGURED' as const,
    founderBriefEmail: 'devinhaynes2025@gmail.com' as const,
    gmailDelivery: 'NOT_CONFIGURED' as const,
    cloudDeployment: deployment.cloudDeployment,
    cloudDeploymentBlocker: deployment.blocker,
    providerStatus: deployment.status,
    runs247Live: false as const,
    indefinite247Claimed: false as const,
    cloudWorkerVerified: evidence?.cloudWorkerVerified ?? false,
    ...evidence,
  };
}
