/**
 * 62L-CQ Accelerator/Cloud Collaboration —
 * AMD/NVIDIA workload adapters; AWS/GCP storage/model collaboration;
 * Cisco-compatible integration contracts — configured+authorized+verified only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CQ_LOCKS,
  HONESTY_BANNER,
  SEALED_SILENT_CLOUD_MODEL_DENIED,
  UNCONFIGURED_ADAPTER_UNAVAILABLE,
  type CqActor,
} from './offline-universe-quantum-genome-types';

export type AcceleratorVendor = 'amd' | 'nvidia';
export type CloudVendor = 'aws' | 'gcp';
export type IntegrationVendor = 'cisco_compatible';

export type AdapterStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED';

export type AcceleratorAdapter = {
  id: string;
  vendor: AcceleratorVendor;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: AdapterStatus;
  reason: string;
  createdAt: string;
};

export type CloudCollaborationChannel = {
  id: string;
  vendor: CloudVendor;
  kind: 'storage' | 'model';
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: AdapterStatus;
  reason: string;
  createdAt: string;
};

export type CiscoCompatibleContract = {
  id: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: AdapterStatus;
  reason: string;
  createdAt: string;
};

export type CloudModelRouteAttempt = {
  id: string;
  vendor: CloudVendor;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentFallbackRequested: boolean;
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  accelerators: AcceleratorAdapter[];
  clouds: CloudCollaborationChannel[];
  cisco: CiscoCompatibleContract[];
  routes: CloudModelRouteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'accelerator-cloud-collaboration.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    accelerators: [],
    clouds: [],
    cisco: [],
    routes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function gateStatus(configured: boolean, authorized: boolean, verified: boolean): {
  status: AdapterStatus;
  reason: string;
} {
  if (!configured || !authorized || !verified) {
    return { status: 'UNAVAILABLE', reason: UNCONFIGURED_ADAPTER_UNAVAILABLE };
  }
  return {
    status: 'AVAILABLE',
    reason: 'CONFIGURED_AUTHORIZED_VERIFIED',
  };
}

export function acceleratorCloudHonesty() {
  return {
    banner: HONESTY_BANNER,
    acceleratorRequiresCav: CQ_LOCKS.ACCELERATOR_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED,
    cloudRequiresCav: CQ_LOCKS.CLOUD_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED,
    ciscoRequiresCav: CQ_LOCKS.CISCO_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED,
    unconfiguredAvailable: CQ_LOCKS.UNCONFIGURED_ADAPTER_AVAILABLE,
    sealedSilentAwsGcp: CQ_LOCKS.SEALED_SILENT_AWS_GCP_MODEL_FALLBACK,
  };
}

export async function registerAcceleratorAdapter(input: {
  vendor: AcceleratorVendor;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CqActor;
}): Promise<AcceleratorAdapter> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const gate = gateStatus(configured, authorized, verified);
  const adapter: AcceleratorAdapter = {
    id: id('acc'),
    vendor: input.vendor,
    configured,
    authorized,
    verified,
    status: gate.status,
    reason: gate.reason,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.accelerators.push(adapter);
  await save(input.root, store);
  return adapter;
}

export async function registerCloudCollaboration(input: {
  vendor: CloudVendor;
  kind: 'storage' | 'model';
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CqActor;
}): Promise<CloudCollaborationChannel> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const gate = gateStatus(configured, authorized, verified);
  const channel: CloudCollaborationChannel = {
    id: id('cld'),
    vendor: input.vendor,
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: gate.status,
    reason: gate.reason,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.clouds.push(channel);
  await save(input.root, store);
  return channel;
}

export async function registerCiscoCompatibleContract(input: {
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CqActor;
}): Promise<CiscoCompatibleContract> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const gate = gateStatus(configured, authorized, verified);
  const contract: CiscoCompatibleContract = {
    id: id('cisco'),
    configured,
    authorized,
    verified,
    status: gate.status,
    reason: gate.reason,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.cisco.push(contract);
  await save(input.root, store);
  return contract;
}

export async function routeToCloudModel(input: {
  vendor: CloudVendor;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentFallbackRequested?: boolean;
  /** Channel must already be configured+authorized+verified when routing open content. */
  channelId?: string;
  root: string;
  actor: CqActor;
}): Promise<CloudModelRouteAttempt> {
  const store = await load(input.root);
  const silent = input.silentFallbackRequested === true;
  const sealedOrLocal =
    input.contentMode === 'sealed' || input.contentMode === 'local_only';

  let status: CloudModelRouteAttempt['status'] = 'denied';
  let reason = SEALED_SILENT_CLOUD_MODEL_DENIED;

  if (sealedOrLocal && silent) {
    status = 'denied';
    reason = SEALED_SILENT_CLOUD_MODEL_DENIED;
  } else if (sealedOrLocal) {
    status = 'denied';
    reason = SEALED_SILENT_CLOUD_MODEL_DENIED;
  } else {
    const channel = input.channelId
      ? store.clouds.find((c) => c.id === input.channelId && c.vendor === input.vendor)
      : store.clouds.find(
          (c) => c.vendor === input.vendor && c.kind === 'model' && c.status === 'AVAILABLE',
        );
    if (!channel || channel.status !== 'AVAILABLE') {
      status = 'unavailable';
      reason = UNCONFIGURED_ADAPTER_UNAVAILABLE;
    } else {
      status = 'allowed';
      reason = 'OPEN_CONTENT_EXPLICIT_CONFIGURED_AUTHORIZED_VERIFIED_ROUTE';
    }
  }

  const attempt: CloudModelRouteAttempt = {
    id: id('cmr'),
    vendor: input.vendor,
    contentMode: input.contentMode,
    silentFallbackRequested: silent,
    status,
    reason,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.routes.push(attempt);
  await save(input.root, store);
  return attempt;
}
