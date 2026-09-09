/**
 * 62L-DV Module G — Adult Trust-Circle Social Fabric.
 * 18+ consent / privacy / age / moderation locks.
 * No minors; no non-consensual imagery; no surveillance / profiling /
 * covert emotion detection / cross-context tracking.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_AGE_GATE_REQUIRED,
  MAX_TRUST_CIRCLE_EVENTS,
  MINOR_TRUST_DENIED,
  NON_CONSENSUAL_DENIED,
  TRUST_SURVEILLANCE_DENIED,
  type DvActor,
} from './universal-data-industry-cortex-types';

export type TrustCircleJoin = {
  id: string;
  subjectId: string;
  ageVerifiedAdult: boolean;
  status: 'joined_candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type ImageryModeration = {
  id: string;
  consensual: boolean;
  status: 'allowed_candidate' | 'denied';
  reason: string;
  at: string;
};

export type TrustSurveillanceProbe = {
  id: string;
  kind:
    | 'public_surveillance'
    | 'demographic_profiling'
    | 'covert_emotion_detection'
    | 'cross_context_tracking';
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  joins: TrustCircleJoin[];
  imagery: ImageryModeration[];
  surveillance: TrustSurveillanceProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adult-trust-circle-social-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    joins: [],
    imagery: [],
    surveillance: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function adultTrustCircleHonesty() {
  return {
    minorsAllowed: false,
    nonConsensualImageryAllowed: false,
    ageGateRequired: true,
    publicSurveillanceAllowed: false,
    demographicProfilingAllowed: false,
    covertEmotionDetectionAllowed: false,
    crossContextTrackingAllowed: false,
  };
}

export async function joinTrustCircle(input: {
  subjectId: string;
  ageVerifiedAdult: boolean;
  claimMinorAllowed?: boolean;
  root: string;
  actor: DvActor;
}): Promise<TrustCircleJoin> {
  const store = await load(input.root);
  void input.actor;
  if (store.joins.length >= MAX_TRUST_CIRCLE_EVENTS) {
    throw new Error('MAX_TRUST_CIRCLE_EVENTS_REACHED');
  }
  let status: TrustCircleJoin['status'];
  let reason: string;
  if (input.claimMinorAllowed === true || !input.ageVerifiedAdult) {
    status = 'denied';
    reason = input.claimMinorAllowed === true ? MINOR_TRUST_DENIED : ADULT_AGE_GATE_REQUIRED;
  } else {
    status = 'joined_candidate';
    reason = 'ADULT_AGE_VERIFIED_TRUST_CIRCLE_CANDIDATE';
  }
  const join: TrustCircleJoin = {
    id: id('dvtc'),
    subjectId: input.subjectId.trim(),
    ageVerifiedAdult: input.ageVerifiedAdult,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.joins.push(join);
  await save(input.root, store);
  return join;
}

export async function moderateImagery(input: {
  consensual: boolean;
  root: string;
  actor: DvActor;
}): Promise<ImageryModeration> {
  const store = await load(input.root);
  void input.actor;
  const mod: ImageryModeration = {
    id: id('dvimg'),
    consensual: input.consensual,
    status: input.consensual ? 'allowed_candidate' : 'denied',
    reason: input.consensual
      ? 'CONSENSUAL_IMAGERY_CANDIDATE'
      : NON_CONSENSUAL_DENIED,
    at: new Date().toISOString(),
  };
  store.imagery.push(mod);
  await save(input.root, store);
  return mod;
}

export async function denyTrustCircleSurveillance(input: {
  kind: TrustSurveillanceProbe['kind'];
  root: string;
  actor: DvActor;
}): Promise<TrustSurveillanceProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: TrustSurveillanceProbe = {
    id: id('dvtsurv'),
    kind: input.kind,
    status: 'denied',
    reason: TRUST_SURVEILLANCE_DENIED,
    at: new Date().toISOString(),
  };
  store.surveillance.push(probe);
  await save(input.root, store);
  return probe;
}
