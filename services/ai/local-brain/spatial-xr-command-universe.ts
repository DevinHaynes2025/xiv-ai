/**
 * 62L-EB Module G — Spatial/XR Command Universe.
 * XR/spatial views; honest capture defaults.
 * ≠ covert capture; biometric defaults OFF; spatial commands governed.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BIOMETRIC_DEFAULTS_OFF,
  MAX_XR_EVENTS,
  SPATIAL_COMMAND_GOVERNED,
  XR_NEQ_COVERT_CAPTURE,
  type EbActor,
} from './multi-model-superbrain-federation-types';

export type XrSpatialSession = {
  id: string;
  sessionId: string;
  covertCaptureAttempted: boolean;
  biometricEnabled: boolean;
  status: 'ok' | 'denied';
  reason: string;
  biometricDefault: false;
  at: string;
};

export type SpatialCommand = {
  id: string;
  commandId: string;
  authorized: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  sessions: XrSpatialSession[];
  commands: SpatialCommand[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'spatial-xr-command-universe.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    sessions: [],
    commands: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function spatialXrCommandUniverseHonesty() {
  return {
    xrSpatialNeqCovertCapture: true,
    biometricDefaultsOff: true,
    spatialCommandGoverned: true,
    researchInterfaceLayer: true,
  };
}

export async function openXrSpatialSession(input: {
  sessionId: string;
  covertCaptureAttempted?: boolean;
  biometricEnabled?: boolean;
  root: string;
  actor: EbActor;
}): Promise<XrSpatialSession> {
  const store = await load(input.root);
  void input.actor;
  if (store.sessions.length >= MAX_XR_EVENTS) {
    throw new Error('MAX_XR_EVENTS_REACHED');
  }
  const covert = Boolean(input.covertCaptureAttempted);
  const biometric = Boolean(input.biometricEnabled);
  let status: 'ok' | 'denied' = 'ok';
  let reason = 'XR_SPATIAL_SESSION_OK';
  if (covert) {
    status = 'denied';
    reason = XR_NEQ_COVERT_CAPTURE;
  } else if (biometric) {
    status = 'denied';
    reason = BIOMETRIC_DEFAULTS_OFF;
  }
  const session: XrSpatialSession = {
    id: id('ebxr'),
    sessionId: input.sessionId.trim(),
    covertCaptureAttempted: covert,
    biometricEnabled: biometric,
    status,
    reason,
    biometricDefault: false,
    at: new Date().toISOString(),
  };
  store.sessions.push(session);
  await save(input.root, store);
  return session;
}

export async function issueSpatialCommand(input: {
  commandId: string;
  authorized: boolean;
  root: string;
  actor: EbActor;
}): Promise<SpatialCommand> {
  const store = await load(input.root);
  void input.actor;
  const command: SpatialCommand = {
    id: id('ebsc'),
    commandId: input.commandId.trim(),
    authorized: input.authorized,
    status: input.authorized ? 'ok' : 'denied',
    reason: input.authorized
      ? 'SPATIAL_COMMAND_AUTHORIZED'
      : SPATIAL_COMMAND_GOVERNED,
    at: new Date().toISOString(),
  };
  store.commands.push(command);
  await save(input.root, store);
  return command;
}
