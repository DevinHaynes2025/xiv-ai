/**
 * 62L-CJ Universal Edge Runtime Mesh — enrolled devices only.
 * Explicit handoff; no hidden deploy. Freshness-sensitive offline → STALE/WAITING_DATA.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CJ_LOCKS,
  FRESHNESS_STALE_OR_WAITING,
  HIDDEN_EDGE_DEPLOY_DENIED,
  HONESTY_BANNER,
  UNENROLLED_EDGE_HANDOFF_DENIED,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';

export type EdgeDevice = {
  id: string;
  label: string;
  enrolled: boolean;
  online: boolean;
  freshness: 'fresh' | 'stale' | 'waiting_data';
  reason: string;
  enrolledAt: string;
};

export type EdgeHandoff = {
  id: string;
  fromDeviceId: string | null;
  toDeviceId: string | null;
  explicit: boolean;
  accepted: boolean;
  reason: string;
  hiddenDeployAttempted: boolean;
  freshnessState: 'fresh' | 'stale' | 'waiting_data' | 'n/a';
  at: string;
};

type Store = {
  devices: EdgeDevice[];
  handoffs: EdgeHandoff[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-edge-runtime-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    devices: [],
    handoffs: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeRuntimeMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    edgeHandoffUnenrolled: CJ_LOCKS.EDGE_HANDOFF_UNENROLLED,
    edgeHiddenDeploy: CJ_LOCKS.EDGE_HIDDEN_DEPLOY,
    edgeHandoffRequiresExplicit: CJ_LOCKS.EDGE_HANDOFF_REQUIRES_EXPLICIT,
    deviceEnrollmentRequired: CJ_LOCKS.DEVICE_ENROLLMENT_REQUIRED,
  };
}

export async function enrollEdgeDevice(input: {
  label: string;
  online?: boolean;
  freshness?: EdgeDevice['freshness'];
  root: string;
  actor: CjActor;
}): Promise<EdgeDevice> {
  const store = await load(input.root);
  const device: EdgeDevice = {
    id: id('edev'),
    label: input.label,
    enrolled: true,
    online: input.online !== false,
    freshness: input.freshness ?? 'fresh',
    reason: 'DEVICE_ENROLLED',
    enrolledAt: new Date().toISOString(),
  };
  store.devices.push(device);
  await save(input.root, store);
  return device;
}

export async function handoffEdgeRuntime(input: {
  fromDeviceId?: string;
  toDeviceId: string;
  explicit?: boolean;
  freshnessSensitive?: boolean;
  /** Hard-deny: attempt deploy/handoff without enrollment acknowledgment. */
  attemptHiddenDeploy?: boolean;
  root: string;
  actor: CjActor;
}): Promise<EdgeHandoff> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const to = store.devices.find((d) => d.id === input.toDeviceId) ?? null;
  const from = input.fromDeviceId
    ? store.devices.find((d) => d.id === input.fromDeviceId) ?? null
    : null;

  if (input.attemptHiddenDeploy === true) {
    const handoff: EdgeHandoff = {
      id: id('ehand'),
      fromDeviceId: from?.id ?? null,
      toDeviceId: to?.id ?? input.toDeviceId,
      explicit: false,
      accepted: false,
      reason: HIDDEN_EDGE_DEPLOY_DENIED,
      hiddenDeployAttempted: true,
      freshnessState: 'n/a',
      at: now,
    };
    store.handoffs.push(handoff);
    store.denials.push({ id: id('deny'), at: now, reason: HIDDEN_EDGE_DEPLOY_DENIED });
    await save(input.root, store);
    return handoff;
  }

  if (!to || !to.enrolled) {
    const handoff: EdgeHandoff = {
      id: id('ehand'),
      fromDeviceId: from?.id ?? null,
      toDeviceId: input.toDeviceId,
      explicit: input.explicit === true,
      accepted: false,
      reason: UNENROLLED_EDGE_HANDOFF_DENIED,
      hiddenDeployAttempted: false,
      freshnessState: 'n/a',
      at: now,
    };
    store.handoffs.push(handoff);
    store.denials.push({
      id: id('deny'),
      at: now,
      reason: UNENROLLED_EDGE_HANDOFF_DENIED,
    });
    await save(input.root, store);
    return handoff;
  }

  if (input.explicit !== true) {
    const handoff: EdgeHandoff = {
      id: id('ehand'),
      fromDeviceId: from?.id ?? null,
      toDeviceId: to.id,
      explicit: false,
      accepted: false,
      reason: 'EDGE_HANDOFF_REQUIRES_EXPLICIT_ACK',
      hiddenDeployAttempted: false,
      freshnessState: 'n/a',
      at: now,
    };
    store.handoffs.push(handoff);
    store.denials.push({
      id: id('deny'),
      at: now,
      reason: 'EDGE_HANDOFF_REQUIRES_EXPLICIT_ACK',
    });
    await save(input.root, store);
    return handoff;
  }

  // Freshness-sensitive offline path → STALE / WAITING_DATA (not fake fresh).
  if (input.freshnessSensitive === true && (!to.online || to.freshness !== 'fresh')) {
    const freshnessState =
      to.freshness === 'waiting_data' || !to.online ? 'waiting_data' : 'stale';
    const handoff: EdgeHandoff = {
      id: id('ehand'),
      fromDeviceId: from?.id ?? null,
      toDeviceId: to.id,
      explicit: true,
      accepted: false,
      reason: FRESHNESS_STALE_OR_WAITING,
      hiddenDeployAttempted: false,
      freshnessState,
      at: now,
    };
    store.handoffs.push(handoff);
    await save(input.root, store);
    return handoff;
  }

  const handoff: EdgeHandoff = {
    id: id('ehand'),
    fromDeviceId: from?.id ?? null,
    toDeviceId: to.id,
    explicit: true,
    accepted: true,
    reason: 'EXPLICIT_ENROLLED_EDGE_HANDOFF',
    hiddenDeployAttempted: false,
    freshnessState: to.freshness,
    at: now,
  };
  store.handoffs.push(handoff);
  await save(input.root, store);
  return handoff;
}
