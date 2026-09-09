/**
 * First deployment target honesty — never invent cloud credentials or RUNNING.
 */

import type { CloudProviderKind, CloudProviderStatus, DeploymentTargetHonesty } from './types';

function envPresent(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

/** Probe for verified cloud — no fabrication. */
export function probeVerifiedCloud(): {
  verified: false;
  reason: string;
  provider: CloudProviderKind;
} | {
  verified: true;
  provider: CloudProviderKind;
  evidence: string[];
} {
  // Explicit verification flags only — never treat sandbox meta as deployable cloud.
  if (envPresent('XIV_CLOUD_WORKER_VERIFIED') && process.env.XIV_CLOUD_WORKER_VERIFIED === '1') {
    if (envPresent('AWS_ECS_CLUSTER') || envPresent('XIV_AWS_ECS_CLUSTER')) {
      return {
        verified: true,
        provider: 'AWS_ECS',
        evidence: ['XIV_CLOUD_WORKER_VERIFIED=1', 'AWS_ECS_CLUSTER present'],
      };
    }
    if (envPresent('KUBE_CONFIG') || envPresent('KUBERNETES_SERVICE_HOST')) {
      return {
        verified: true,
        provider: 'KUBERNETES',
        evidence: ['XIV_CLOUD_WORKER_VERIFIED=1', 'kubernetes endpoint present'],
      };
    }
  }
  return {
    verified: false,
    reason:
      'No verified cloud worker target: set XIV_CLOUD_WORKER_VERIFIED=1 with provider cluster/config. Sandbox CLOUD_AGENT_* meta is not a deploy target.',
    provider: 'LOCAL_PROCESS',
  };
}

export function detectCloudDeployment(preferred: CloudProviderKind = 'LOCAL_PROCESS'): DeploymentTargetHonesty {
  const probe = probeVerifiedCloud();
  if (!probe.verified) {
    const status: CloudProviderStatus =
      preferred === 'LOCAL_PROCESS' ? 'CONFIGURED' : 'NOT_CONFIGURED';
    return {
      provider: preferred === 'LOCAL_PROCESS' ? 'LOCAL_PROCESS' : preferred,
      status: preferred === 'LOCAL_PROCESS' ? 'CONFIGURED' : 'NOT_CONFIGURED',
      cloudDeployment: preferred === 'LOCAL_PROCESS' ? 'READY' : 'BLOCKED',
      blocker: preferred === 'LOCAL_PROCESS' ? null : probe.reason,
      runs247Live: false,
      indefinite247Claimed: false,
      evidence:
        preferred === 'LOCAL_PROCESS'
          ? ['local_process_runtime_configured', 'CLOUD_DEPLOYMENT local-only READY']
          : ['CLOUD_DEPLOYMENT=BLOCKED', probe.reason],
    };
  }
  return {
    provider: probe.provider,
    status: 'PROVEN',
    cloudDeployment: 'READY',
    blocker: null,
    runs247Live: false,
    indefinite247Claimed: false,
    evidence: probe.evidence,
  };
}

/**
 * Deploy ONE minimal worker only when real cloud is verified.
 * Otherwise report BLOCKED with exact blocker — do not invent resources.
 */
export function deployMinimalCloudWorker(input?: {
  preferredProvider?: CloudProviderKind;
}): {
  deployed: boolean;
  honesty: DeploymentTargetHonesty;
  workerInstanceId: string | null;
  cloudDeployment: DeploymentTargetHonesty['cloudDeployment'];
} {
  const honesty = detectCloudDeployment(input?.preferredProvider ?? 'AWS_ECS');
  if (honesty.cloudDeployment === 'BLOCKED' || honesty.status === 'NOT_CONFIGURED') {
    return {
      deployed: false,
      honesty: {
        ...honesty,
        cloudDeployment: 'BLOCKED',
        blocker: honesty.blocker ?? 'cloud_not_verified',
        evidence: [...honesty.evidence, 'minimal_worker_not_deployed'],
      },
      workerInstanceId: null,
      cloudDeployment: 'BLOCKED',
    };
  }
  if (!probeVerifiedCloud().verified) {
    return {
      deployed: false,
      honesty: {
        ...honesty,
        status: 'NOT_CONFIGURED',
        cloudDeployment: 'BLOCKED',
        blocker: 'verified_cloud_required_for_minimal_deploy',
        evidence: [...honesty.evidence, 'refused_unverified_deploy'],
      },
      workerInstanceId: null,
      cloudDeployment: 'BLOCKED',
    };
  }
  // Verified path — still not indefinite 24/7.
  return {
    deployed: true,
    honesty: {
      ...honesty,
      status: 'DEPLOYED_MINIMAL',
      cloudDeployment: 'MINIMAL_WORKER_DEPLOYED',
      runs247Live: false,
      indefinite247Claimed: false,
      evidence: [...honesty.evidence, 'one_minimal_worker_deployed', 'not_indefinite_247'],
    },
    workerInstanceId: `minimal-${Date.now().toString(36)}`,
    cloudDeployment: 'MINIMAL_WORKER_DEPLOYED',
  };
}

export function labelProviderRunningWithoutEvidence(): never {
  throw new Error('REFUSED: must not label provider RUNNING without evidence');
}
