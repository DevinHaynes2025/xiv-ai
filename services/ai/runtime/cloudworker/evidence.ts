/**
 * Honest evidence fields for LA-02 completion gate.
 */

import type { ComputeGovernorLevel } from '../cloudworkforce/types';
import type { CloudWorkerEvidence } from './types';
import { detectCloudDeployment, deployMinimalCloudWorker } from './deployment';
import { runOfflineFounderTest } from './offline-founder';
import { runCrashRecoveryAgainstLa01 } from './recovery';
import { mappedLa01AgentIds } from './specialty-workers';

export function collectCloudWorkerEvidence(input?: {
  computePressure?: ComputeGovernorLevel;
}): CloudWorkerEvidence {
  const deployment = detectCloudDeployment('AWS_ECS');
  const local = detectCloudDeployment('LOCAL_PROCESS');
  const minimal = deployMinimalCloudWorker({ preferredProvider: 'AWS_ECS' });
  const offline = runOfflineFounderTest();
  const crash = runCrashRecoveryAgainstLa01();

  return {
    phase: '2I-LA-02',
    cloudDeployment: minimal.deployed ? 'MINIMAL_WORKER_DEPLOYED' : deployment.cloudDeployment === 'BLOCKED' ? 'BLOCKED' : local.cloudDeployment,
    cloudDeploymentBlocker: minimal.deployed
      ? null
      : deployment.blocker ?? 'No verified cloud; local process only',
    providerStatus: minimal.deployed
      ? 'DEPLOYED_MINIMAL'
      : deployment.status === 'NOT_CONFIGURED'
        ? 'NOT_CONFIGURED'
        : local.status,
    cloudWorkerVerified:
      offline.cloudWorkerVerified &&
      (minimal.deployed || deployment.cloudDeployment !== 'BLOCKED'),
    offlineFounderTestPassed: offline.passed,
    crashRecoveryTestPassed: crash.passed && crash.resumedFromCheckpoint,
    runs247Live: false,
    indefinite247Claimed: false,
    l4Enabled: false,
    defaultPermissions: 'NONE',
    unconfiguredAdapters: 'NOT_CONFIGURED',
    founderBriefEmail: 'devinhaynes2025@gmail.com',
    computePressure: input?.computePressure ?? 'NORMAL',
    mappedLa01Agents: mappedLa01AgentIds(),
  };
}
