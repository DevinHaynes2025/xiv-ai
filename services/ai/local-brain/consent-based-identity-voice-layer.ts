/**
 * 62L-DU Module D — Consent-Based Identity/Voice Layer.
 * Voice interaction; biometric defaults OFF; opt-in; local preferred; revocable.
 * Anti-surveillance / anti-profiling / anti-covert-emotion / anti-cross-context locks.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BIOMETRIC_DEFAULTS_OFF,
  DU_LOCKS,
  MAX_IDENTITY_CONSENTS,
  SURVEILLANCE_PROFILING_DENIED,
  VOICE_OPT_IN_REQUIRED,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type BiometricModality = 'face' | 'voice_identity' | 'gaze';

export type BiometricConsent = {
  id: string;
  modality: BiometricModality;
  enabledByDefault: false;
  optIn: boolean;
  localPreferred: true;
  revocable: true;
  status: 'opted_in' | 'disabled' | 'revoked' | 'denied';
  reason: string;
  createdAt: string;
};

export type SurveillanceProbe = {
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

export type VoiceIdentitySession = {
  id: string;
  optInPresent: boolean;
  status: 'active_local' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  consents: BiometricConsent[];
  surveillanceProbes: SurveillanceProbe[];
  voiceSessions: VoiceIdentitySession[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'consent-based-identity-voice-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    consents: [],
    surveillanceProbes: [],
    voiceSessions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function consentBasedIdentityVoiceHonesty() {
  return {
    biometricDefaultEnabled: DU_LOCKS.BIOMETRIC_DEFAULT_ENABLED,
    faceIdentityDefaultOn: DU_LOCKS.FACE_IDENTITY_DEFAULT_ON,
    voiceIdentityDefaultOn: DU_LOCKS.VOICE_IDENTITY_DEFAULT_ON,
    gazeTrackingDefaultOn: DU_LOCKS.GAZE_TRACKING_DEFAULT_ON,
    publicSurveillanceAllowed: DU_LOCKS.PUBLIC_SURVEILLANCE_ALLOWED,
    demographicProfilingAllowed: DU_LOCKS.DEMOGRAPHIC_PROFILING_ALLOWED,
    covertEmotionDetectionAllowed: DU_LOCKS.COVERT_EMOTION_DETECTION_ALLOWED,
    crossContextBiometricTracking: DU_LOCKS.CROSS_CONTEXT_BIOMETRIC_TRACKING,
    localPreferred: true,
    revocable: true,
  };
}

export async function probeBiometricDefaults(input: {
  modality: BiometricModality;
  claimDefaultEnabled?: boolean;
  root: string;
  actor: DuActor;
}): Promise<BiometricConsent> {
  const store = await load(input.root);
  void input.actor;
  if (store.consents.length >= MAX_IDENTITY_CONSENTS) {
    throw new Error('MAX_IDENTITY_CONSENTS_REACHED');
  }
  const consent: BiometricConsent = {
    id: id('dubio'),
    modality: input.modality,
    enabledByDefault: false,
    optIn: false,
    localPreferred: true,
    revocable: true,
    status: 'disabled',
    reason: BIOMETRIC_DEFAULTS_OFF,
    createdAt: new Date().toISOString(),
  };
  void input.claimDefaultEnabled;
  store.consents.push(consent);
  await save(input.root, store);
  return consent;
}

export async function denySurveillanceOrProfiling(input: {
  kind: SurveillanceProbe['kind'];
  root: string;
  actor: DuActor;
}): Promise<SurveillanceProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: SurveillanceProbe = {
    id: id('dusurv'),
    kind: input.kind,
    status: 'denied',
    reason: SURVEILLANCE_PROFILING_DENIED,
    at: new Date().toISOString(),
  };
  store.surveillanceProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function startVoiceIdentitySession(input: {
  optInPresent: boolean;
  root: string;
  actor: DuActor;
}): Promise<VoiceIdentitySession> {
  const store = await load(input.root);
  void input.actor;
  const session: VoiceIdentitySession = {
    id: id('duvoice'),
    optInPresent: input.optInPresent,
    status: input.optInPresent ? 'active_local' : 'denied',
    reason: input.optInPresent
      ? 'VOICE_IDENTITY_OPT_IN_LOCAL_PREFERRED'
      : VOICE_OPT_IN_REQUIRED,
    at: new Date().toISOString(),
  };
  store.voiceSessions.push(session);
  await save(input.root, store);
  return session;
}

export async function revokeBiometricConsent(input: {
  consentId: string;
  root: string;
  actor: DuActor;
}): Promise<BiometricConsent> {
  const store = await load(input.root);
  void input.actor;
  const existing = store.consents.find((c) => c.id === input.consentId);
  const revoked: BiometricConsent = {
    id: existing?.id ?? id('dubiorev'),
    modality: existing?.modality ?? 'voice_identity',
    enabledByDefault: false,
    optIn: false,
    localPreferred: true,
    revocable: true,
    status: 'revoked',
    reason: 'BIOMETRIC_CONSENT_REVOKED',
    createdAt: new Date().toISOString(),
  };
  store.consents.push(revoked);
  await save(input.root, store);
  return revoked;
}
