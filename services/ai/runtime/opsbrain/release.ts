import { learningMayRewriteSecurityOrProductionPolicy } from '../knowledge/loop';
import type { ReleaseStage } from './types';

export type FeatureFlag = {
  flag: string;
  audience?: string;
  platform?: 'ios' | 'android' | 'web';
  minimumVersion?: string;
  region?: string;
  tenantId?: string;
  universeId?: string;
  rolloutPercentage: number;
  killSwitch: boolean;
  highRiskSecurity: boolean;
};

export const RELEASE_PIPELINE: readonly ReleaseStage[] = [
  'DEVELOPMENT',
  'AUTOMATED_TESTS',
  'SECURITY_CHECKS',
  'BETA_INTERNAL',
  'STAGED_ROLLOUT',
  'PRODUCTION',
  'HEALTH_MONITORING',
  'ROLLBACK',
];

export function evaluateFeatureFlag(flag: FeatureFlag) {
  if (flag.killSwitch) {
    return { allowed: false as const, reason: 'kill_switch_engaged' };
  }
  if (flag.highRiskSecurity) {
    return { allowed: false as const, reason: 'high_risk_security_not_remotely_configurable' };
  }
  if (flag.rolloutPercentage <= 0) {
    return { allowed: false as const, reason: 'rollout_disabled' };
  }
  return { allowed: true as const, remotelyConfigurable: true as const };
}

export function featureFlagMayChangeSecurityPolicy(): false {
  return learningMayRewriteSecurityOrProductionPolicy();
}

export function releasePipelineIsLiveInStores(): false {
  return false;
}
