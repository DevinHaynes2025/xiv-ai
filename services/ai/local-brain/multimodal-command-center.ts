/**
 * 62L-DV Module F — Multimodal Command Center.
 * Governed UX; capture defaults honest (OFF); multimodal ≠ covert capture.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COVERT_CAPTURE_DENIED,
  DV_LOCKS,
  MAX_MULTIMODAL_SESSIONS,
  MULTIMODAL_CAPTURE_OFF,
  type DvActor,
} from './universal-data-industry-cortex-types';

export type CaptureModality = 'camera' | 'microphone' | 'screen' | 'vision' | 'voice';

export type MultimodalSession = {
  id: string;
  modality: CaptureModality;
  captureDefaultOn: false;
  optIn: boolean;
  localPreferred: true;
  revocable: true;
  status: 'opted_in_local' | 'disabled' | 'denied';
  reason: string;
  createdAt: string;
};

export type CovertCaptureProbe = {
  id: string;
  modality: CaptureModality;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  sessions: MultimodalSession[];
  covertProbes: CovertCaptureProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multimodal-command-center.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sessions: [], covertProbes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multimodalCommandCenterHonesty() {
  return {
    captureDefaultOn: DV_LOCKS.MULTIMODAL_CAPTURE_DEFAULT_ON,
    cameraDefaultOn: DV_LOCKS.CAMERA_DEFAULT_ON,
    micDefaultOn: DV_LOCKS.MIC_DEFAULT_ON,
    covertCaptureAllowed: DV_LOCKS.COVERT_CAPTURE_ALLOWED,
    localPreferred: true,
    revocable: true,
  };
}

export async function probeMultimodalCaptureDefaults(input: {
  modality: CaptureModality;
  claimDefaultOn?: boolean;
  optIn?: boolean;
  root: string;
  actor: DvActor;
}): Promise<MultimodalSession> {
  const store = await load(input.root);
  void input.actor;
  if (store.sessions.length >= MAX_MULTIMODAL_SESSIONS) {
    throw new Error('MAX_MULTIMODAL_SESSIONS_REACHED');
  }
  const optIn = input.optIn === true;
  const session: MultimodalSession = {
    id: id('dvmm'),
    modality: input.modality,
    captureDefaultOn: false,
    optIn,
    localPreferred: true,
    revocable: true,
    status: optIn ? 'opted_in_local' : 'disabled',
    reason:
      input.claimDefaultOn === true
        ? MULTIMODAL_CAPTURE_OFF
        : optIn
          ? 'MULTIMODAL_OPT_IN_LOCAL_PREFERRED'
          : MULTIMODAL_CAPTURE_OFF,
    createdAt: new Date().toISOString(),
  };
  if (input.claimDefaultOn === true) {
    session.status = 'denied';
    session.optIn = false;
  }
  store.sessions.push(session);
  await save(input.root, store);
  return session;
}

export async function denyCovertCapture(input: {
  modality: CaptureModality;
  root: string;
  actor: DvActor;
}): Promise<CovertCaptureProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: CovertCaptureProbe = {
    id: id('dvcovert'),
    modality: input.modality,
    status: 'denied',
    reason: COVERT_CAPTURE_DENIED,
    at: new Date().toISOString(),
  };
  store.covertProbes.push(probe);
  await save(input.root, store);
  return probe;
}
