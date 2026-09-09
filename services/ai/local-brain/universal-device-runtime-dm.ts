/**
 * 62L-DM Universal Device Runtime —
 * iOS/Android/web/desktop profiles; unverified → UNAVAILABLE/NOT_TESTED;
 * cross-device continuity requires enrollment.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CROSS_DEVICE_WITHOUT_ENROLLMENT_DENIED,
  DM_LOCKS,
  HONESTY_BANNER,
  MAX_DEVICE_PROFILES,
  UNVERIFIED_PLATFORM_UNAVAILABLE_OR_NOT_TESTED,
  type DevicePlatform,
  type DmActor,
  type DmEvidenceState,
} from './global-neural-transit-civilization-atlas-types';

export type UniversalDeviceRuntime = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type DeviceRuntimeProfile = {
  id: string;
  runtimeId: string;
  platform: DevicePlatform;
  enrolled: boolean;
  verified: boolean;
  tested: boolean;
  status: DmEvidenceState;
  reason: string;
  createdAt: string;
};

export type CrossDeviceContinuityAttempt = {
  id: string;
  runtimeId: string;
  fromDeviceId: string;
  toDeviceId: string;
  enrollmentPresent: boolean;
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = {
  runtimes: UniversalDeviceRuntime[];
  profiles: DeviceRuntimeProfile[];
  continuity: CrossDeviceContinuityAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-device-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { runtimes: [], profiles: [], continuity: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalDeviceRuntimeHonesty() {
  return {
    banner: HONESTY_BANNER,
    platforms: ['ios', 'android', 'web', 'desktop'] as const,
    unverifiedPlatformCycleHonest: DM_LOCKS.UNVERIFIED_PLATFORM_CYCLE_HONEST,
    crossDeviceContinuityRequiresEnrollment: DM_LOCKS.CROSS_DEVICE_CONTINUITY_REQUIRES_ENROLLMENT,
    crossDeviceWithoutEnrollment: DM_LOCKS.CROSS_DEVICE_WITHOUT_ENROLLMENT,
  };
}

export async function bootstrapUniversalDeviceRuntime(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
}): Promise<UniversalDeviceRuntime> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.runtimes.find(
    (r) => r.orgId === input.orgId && r.tenantId === input.tenantId && r.universeId === input.universeId,
  );
  if (existing) return existing;
  const runtime: UniversalDeviceRuntime = {
    id: id('dmdev'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.runtimes.push(runtime);
  await save(input.root, store);
  return runtime;
}

export async function registerDeviceRuntimeProfile(input: {
  runtimeId: string;
  platform: DevicePlatform;
  enrolled: boolean;
  verified: boolean;
  tested: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; profile?: DeviceRuntimeProfile; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const runtime = store.runtimes.find((r) => r.id === input.runtimeId);
  if (!runtime) return { accepted: false, reason: 'RUNTIME_NOT_FOUND', at: now };
  if (store.profiles.length >= MAX_DEVICE_PROFILES) {
    return { accepted: false, reason: 'MAX_DEVICE_PROFILES_REACHED', at: now };
  }

  let status: DmEvidenceState = 'AVAILABLE';
  let reason = 'DEVICE_RUNTIME_PROFILE_ENROLLED_VERIFIED_TESTED';
  let accepted = true;

  if (!input.verified || !input.tested) {
    status = input.tested === false && input.verified === false ? 'NOT_TESTED' : 'UNAVAILABLE';
    reason = UNVERIFIED_PLATFORM_UNAVAILABLE_OR_NOT_TESTED;
    accepted = false;
  } else if (!input.enrolled) {
    status = 'UNAVAILABLE';
    reason = 'DEVICE_NOT_ENROLLED_UNAVAILABLE';
    accepted = false;
  }

  const profile: DeviceRuntimeProfile = {
    id: id('dmprof'),
    runtimeId: input.runtimeId,
    platform: input.platform,
    enrolled: input.enrolled === true,
    verified: input.verified === true,
    tested: input.tested === true,
    status,
    reason,
    createdAt: now,
  };
  store.profiles.push(profile);
  await save(input.root, store);
  return { accepted, reason, profile, at: now };
}

export async function requestCrossDeviceContinuity(input: {
  runtimeId: string;
  fromDeviceId: string;
  toDeviceId: string;
  enrollmentPresent: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: CrossDeviceContinuityAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const runtime = store.runtimes.find((r) => r.id === input.runtimeId);
  if (!runtime) return { accepted: false, reason: 'RUNTIME_NOT_FOUND', at: now };

  if (input.enrollmentPresent !== true) {
    const attempt: CrossDeviceContinuityAttempt = {
      id: id('dmcont'),
      runtimeId: input.runtimeId,
      fromDeviceId: input.fromDeviceId,
      toDeviceId: input.toDeviceId,
      enrollmentPresent: false,
      status: 'DENIED',
      reason: CROSS_DEVICE_WITHOUT_ENROLLMENT_DENIED,
      createdAt: now,
    };
    store.continuity.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: CROSS_DEVICE_WITHOUT_ENROLLMENT_DENIED, attempt, at: now };
  }

  const attempt: CrossDeviceContinuityAttempt = {
    id: id('dmcont'),
    runtimeId: input.runtimeId,
    fromDeviceId: input.fromDeviceId,
    toDeviceId: input.toDeviceId,
    enrollmentPresent: true,
    status: 'ALLOWED',
    reason: 'CROSS_DEVICE_CONTINUITY_ALLOWED_WITH_ENROLLMENT',
    createdAt: now,
  };
  store.continuity.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
