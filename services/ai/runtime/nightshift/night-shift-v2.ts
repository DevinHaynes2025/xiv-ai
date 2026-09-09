/**
 * Night Shift V2 — scheduled research / QA / data quality / sandbox patches / Founder Brief.
 * NO silent production deploy. NO self-grant credentials or authority.
 */
import type { NightShiftJobKind } from './types';
import { NIGHT_SHIFT_JOB_KINDS } from './types';

export type NightShiftV2Job = {
  jobId: string;
  kind: NightShiftJobKind;
  mayDeployProduction: false;
  maySelfGrantCredentials: false;
  maySelfGrantAuthority: false;
  mayChangeSecurityPolicy: false;
  mayRecommend: true;
  mayProposeSandboxPatch: boolean;
  silentProductionDeploy: false;
};

export type FounderBriefV2 = {
  security: string;
  research: string;
  dataQuality: string;
  qa: string;
  recommendations: readonly string[];
  productionDeployed: false;
};

export function openNightShiftV2(kind: NightShiftJobKind = 'RESEARCH'): NightShiftV2Job {
  void NIGHT_SHIFT_JOB_KINDS;
  return {
    jobId: `night-shift-v2:${kind}`,
    kind,
    mayDeployProduction: false,
    maySelfGrantCredentials: false,
    maySelfGrantAuthority: false,
    mayChangeSecurityPolicy: false,
    mayRecommend: true,
    mayProposeSandboxPatch: kind === 'SANDBOX_PATCH',
    silentProductionDeploy: false,
  };
}

export function nightShiftV2DeploysProduction(_job?: NightShiftV2Job): false {
  return false;
}

export function nightShiftV2SilentProductionDeploy(): false {
  return false;
}

export function nightShiftV2SelfGrantsCredentials(): false {
  return false;
}

export function nightShiftV2SelfGrantsAuthority(): false {
  return false;
}

export function nightShiftV2ChangesSecurityPolicy(): false {
  return false;
}

export function nightShiftV2MayRecommend(job: NightShiftV2Job): boolean {
  return job.mayRecommend === true;
}

export function applySandboxPatch(input: {
  job: NightShiftV2Job;
  humanApproved: boolean;
  targetsProduction: boolean;
}) {
  if (input.targetsProduction) {
    return { allowed: false as const, reason: 'night_shift_cannot_deploy_production' };
  }
  if (!input.job.mayProposeSandboxPatch) {
    return { allowed: false as const, reason: 'job_kind_cannot_propose_sandbox_patch' };
  }
  if (!input.humanApproved) {
    return { allowed: false as const, reason: 'sandbox_patch_requires_human_approval' };
  }
  return { allowed: true as const, deployedToProduction: false as const };
}

export function composeFounderBriefV2(): FounderBriefV2 {
  return {
    security: 'Night Shift reviewed anomalies. Confirmed incidents need human verification.',
    research: 'Public/licensed research proposals only. No classified acquisition.',
    dataQuality: 'Quality findings are recommendations until steward-approved.',
    qa: 'QA results stay in sandbox until human promote.',
    recommendations: [
      'Review Founder Brief proposals.',
      'No autonomous production deploy.',
      'No self-grant of credentials or authority.',
    ],
    productionDeployed: false,
  };
}
