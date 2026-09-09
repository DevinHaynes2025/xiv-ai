/**
 * 62L-BW Universal Device/Plugin Neural Mesh — external AI-provider connectors
 * (configured+authorized only); mobile/PC/server/XR/wearable/smart-home adapter
 * contracts. Unenrolled/unverified device → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BW_LOCKS,
  HONESTY_BANNER,
  UNCONFIGURED_DEVICE_UNAVAILABLE,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';

export type DeviceAdapterClass =
  | 'mobile'
  | 'pc'
  | 'server'
  | 'xr'
  | 'wearable'
  | 'smart_home'
  | 'unknown';

export type ProviderConnector = {
  id: string;
  name: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type DeviceAdapter = {
  id: string;
  deviceClass: DeviceAdapterClass;
  enrolled: boolean;
  verified: boolean;
  hardwareSupported: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  physicalControl: false;
  productionAuthorization: false;
  createdAt: string;
};

type Store = {
  providers: ProviderConnector[];
  devices: DeviceAdapter[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-device-plugin-neural-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { providers: [], devices: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function devicePluginMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BW_LOCKS.L4_AUTONOMY_ENABLED,
    unconfiguredDeviceAvailable: BW_LOCKS.UNCONFIGURED_DEVICE_AVAILABLE,
    unconfiguredProviderAvailable: BW_LOCKS.UNCONFIGURED_PROVIDER_AVAILABLE,
    providersUnavailableUntilVerified: BW_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED,
  };
}

export async function registerProviderConnector(input: {
  name: string;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const ok =
    input.configured === true && input.authorized === true && input.verified === true;
  const provider: ProviderConnector = {
    id: id('prov'),
    name: input.name.trim(),
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status: ok ? 'available' : 'unavailable',
    reason: ok ? 'PROVIDER_CONFIGURED_AUTHORIZED_VERIFIED' : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.providers.push(provider);
  await save(root, store);
  return {
    accepted: ok,
    provider,
    status: provider.status,
    reason: provider.reason,
  };
}

export async function connectProvider(input: {
  providerId: string;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const provider = store.providers.find((p) => p.id === input.providerId);
  if (!provider || provider.status !== 'available') {
    return {
      accepted: false as const,
      status: 'unavailable' as const,
      reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
    };
  }
  return {
    accepted: true as const,
    status: 'available' as const,
    reason: 'PROVIDER_CONNECTED',
    provider,
  };
}

export async function registerDeviceAdapter(input: {
  deviceClass: DeviceAdapterClass;
  enrolled?: boolean;
  verified?: boolean;
  hardwareSupported?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const ok =
    input.enrolled === true &&
    input.verified === true &&
    input.hardwareSupported === true;
  const device: DeviceAdapter = {
    id: id('dev'),
    deviceClass: input.deviceClass,
    enrolled: input.enrolled === true,
    verified: input.verified === true,
    hardwareSupported: input.hardwareSupported === true,
    status: ok ? 'available' : 'unavailable',
    reason: ok ? 'DEVICE_ENROLLED_VERIFIED_SUPPORTED' : UNCONFIGURED_DEVICE_UNAVAILABLE,
    physicalControl: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.devices.push(device);
  await save(root, store);
  return {
    accepted: ok,
    device,
    status: device.status,
    reason: device.reason,
  };
}

export async function activateDeviceAdapter(input: {
  deviceId: string;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const device = store.devices.find((d) => d.id === input.deviceId);
  if (!device || device.status !== 'available') {
    return {
      accepted: false as const,
      status: 'unavailable' as const,
      reason: UNCONFIGURED_DEVICE_UNAVAILABLE,
    };
  }
  return {
    accepted: true as const,
    status: 'available' as const,
    reason: 'DEVICE_ADAPTER_ACTIVE',
    device,
  };
}

export async function listDeviceAdapters(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.devices;
}

export async function listProviderConnectors(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.providers;
}
