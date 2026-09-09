/**
 * 62L-EX13 — XIV_DATA_PIPE hooks (software stages; EY #173 soft-wire).
 * 24/7 only with powered runtime + scheduler + storage + authorized source.
 * 6TB Google Cloud = CAPACITY_TARGET_NOT_PROVISIONED (no purchase/allocate).
 */

import {
  DATA_PIPE_STAGES,
  cloudSixTbTarget,
  type CloudCapacityTarget,
  type DataPipeSourceClass,
  type DataPipeStage,
} from './types.ts';

export type DataPipeRuntimeEvidence = {
  poweredRuntime: boolean;
  schedulerPresent: boolean;
  storagePresent: boolean;
  authorizedSource: boolean;
};

export type ContinuousOpsClaim = {
  claimed24x7: boolean;
  allowed: boolean;
  reason: string;
};

export function dataPipeStages(): readonly DataPipeStage[] {
  return DATA_PIPE_STAGES;
}

export function assertSourceClassAllowed(
  sourceClass: DataPipeSourceClass,
): { allowed: boolean; disposition: 'OK' | 'DENIED' | 'QUARANTINED'; reason: string } {
  if (sourceClass === 'RESTRICTED') {
    return { allowed: false, disposition: 'DENIED', reason: 'RESTRICTED_DATA_DENIED' };
  }
  if (sourceClass === 'QUARANTINE') {
    return {
      allowed: false,
      disposition: 'QUARANTINED',
      reason: 'QUARANTINE_BLACK_HOLE_NOT_AUTO_TRUSTED',
    };
  }
  return { allowed: true, disposition: 'OK', reason: 'SOURCE_CLASS_ADMISSIBLE_FOR_PIPE' };
}

/** 24/7 claim only when powered runtime + scheduler + storage + authorized source. */
export function evaluateContinuousOps(evidence: DataPipeRuntimeEvidence): ContinuousOpsClaim {
  const ready =
    evidence.poweredRuntime &&
    evidence.schedulerPresent &&
    evidence.storagePresent &&
    evidence.authorizedSource;
  if (!ready) {
    return {
      claimed24x7: false,
      allowed: false,
      reason: '24_7_REQUIRES_POWERED_RUNTIME_SCHEDULER_STORAGE_AUTHORIZED_SOURCE',
    };
  }
  return {
    claimed24x7: true,
    allowed: true,
    reason: 'CONTINUOUS_OPS_EVIDENCE_PRESENT',
  };
}

export function sixTbCloudCapacityTarget(): CloudCapacityTarget {
  return cloudSixTbTarget();
}

export type PlatformTestMatrixRow = {
  platform: 'DESKTOP_LINUX' | 'DESKTOP_MAC' | 'DESKTOP_WINDOWS' | 'ANDROID' | 'IOS';
  verifiedInThisEnv: boolean;
  disposition: 'DOCUMENTED' | 'WAITING_COMPATIBLE_ENV' | 'VERIFIED_LOCAL';
};

/** Desktop + mobile matrices — do not claim Android/iOS verification without compatible env. */
export function platformTestMatrix(env: {
  isLinux?: boolean;
  hasAndroidSdk?: boolean;
  hasIosSdk?: boolean;
}): readonly PlatformTestMatrixRow[] {
  const linux = env.isLinux === true;
  return [
    {
      platform: 'DESKTOP_LINUX',
      verifiedInThisEnv: linux,
      disposition: linux ? 'VERIFIED_LOCAL' : 'WAITING_COMPATIBLE_ENV',
    },
    {
      platform: 'DESKTOP_MAC',
      verifiedInThisEnv: false,
      disposition: 'WAITING_COMPATIBLE_ENV',
    },
    {
      platform: 'DESKTOP_WINDOWS',
      verifiedInThisEnv: false,
      disposition: 'WAITING_COMPATIBLE_ENV',
    },
    {
      platform: 'ANDROID',
      verifiedInThisEnv: false,
      disposition: env.hasAndroidSdk ? 'DOCUMENTED' : 'WAITING_COMPATIBLE_ENV',
    },
    {
      platform: 'IOS',
      verifiedInThisEnv: false,
      disposition: env.hasIosSdk ? 'DOCUMENTED' : 'WAITING_COMPATIBLE_ENV',
    },
  ];
}
