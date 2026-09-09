/**
 * 62L-DV Module C — Supply Chain Digital Twin Network.
 * Twins, WMS/TMS/ERP adapters, bottleneck detection.
 * Advisory ≠ physical control; authorized connectors only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BOTTLENECK_ADVISORY_ONLY,
  MAX_ADAPTERS,
  MAX_TWINS,
  TWIN_NEQ_CONTROL,
  UNAUTHORIZED_ADAPTER,
  type DvActor,
} from './universal-data-industry-cortex-types';

export type SupplyChainTwin = {
  id: string;
  name: string;
  physicalControlAuthorized: false;
  status: 'twin_candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type AdapterKind = 'WMS' | 'TMS' | 'ERP';

export type ConnectorAdapter = {
  id: string;
  kind: AdapterKind;
  connectorAuthorized: boolean;
  status: 'registered' | 'denied';
  physicalControl: false;
  reason: string;
  createdAt: string;
};

export type BottleneckAdvisory = {
  id: string;
  twinId: string;
  signal: string;
  advisoryOnly: true;
  physicalControl: false;
  status: 'advisory' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  twins: SupplyChainTwin[];
  adapters: ConnectorAdapter[];
  bottlenecks: BottleneckAdvisory[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-digital-twin-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    twins: [],
    adapters: [],
    bottlenecks: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function supplyChainDigitalTwinHonesty() {
  return {
    twinEqPhysicalControl: false,
    unauthorizedAdaptersAllowed: false,
    bottleneckEqPhysicalControl: false,
    advisoryOnly: true,
  };
}

export async function createSupplyChainTwin(input: {
  name: string;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DvActor;
}): Promise<SupplyChainTwin> {
  const store = await load(input.root);
  void input.actor;
  if (store.twins.length >= MAX_TWINS) {
    throw new Error('MAX_TWINS_REACHED');
  }
  const attempting = input.attemptPhysicalControl === true;
  const twin: SupplyChainTwin = {
    id: id('dvtwin'),
    name: input.name.trim(),
    physicalControlAuthorized: false,
    status: attempting ? 'denied' : 'twin_candidate',
    reason: attempting ? TWIN_NEQ_CONTROL : 'SUPPLY_CHAIN_TWIN_RECORDED_CANDIDATE',
    createdAt: new Date().toISOString(),
  };
  store.twins.push(twin);
  await save(input.root, store);
  return twin;
}

export async function registerConnectorAdapter(input: {
  kind: AdapterKind;
  connectorAuthorized: boolean;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DvActor;
}): Promise<ConnectorAdapter> {
  const store = await load(input.root);
  void input.actor;
  if (store.adapters.length >= MAX_ADAPTERS) {
    throw new Error('MAX_ADAPTERS_REACHED');
  }
  const denied =
    !input.connectorAuthorized || input.attemptPhysicalControl === true;
  const adapter: ConnectorAdapter = {
    id: id('dvadapt'),
    kind: input.kind,
    connectorAuthorized: input.connectorAuthorized,
    status: denied ? 'denied' : 'registered',
    physicalControl: false,
    reason: !input.connectorAuthorized
      ? UNAUTHORIZED_ADAPTER
      : input.attemptPhysicalControl
        ? TWIN_NEQ_CONTROL
        : 'AUTHORIZED_CONNECTOR_REGISTERED_ADVISORY',
    createdAt: new Date().toISOString(),
  };
  store.adapters.push(adapter);
  await save(input.root, store);
  return adapter;
}

export async function detectBottleneckAdvisory(input: {
  twinId: string;
  signal: string;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DvActor;
}): Promise<BottleneckAdvisory> {
  const store = await load(input.root);
  void input.actor;
  const attempting = input.attemptPhysicalControl === true;
  const advisory: BottleneckAdvisory = {
    id: id('dvbn'),
    twinId: input.twinId,
    signal: input.signal.trim(),
    advisoryOnly: true,
    physicalControl: false,
    status: attempting ? 'denied' : 'advisory',
    reason: attempting ? BOTTLENECK_ADVISORY_ONLY : BOTTLENECK_ADVISORY_ONLY,
    at: new Date().toISOString(),
  };
  store.bottlenecks.push(advisory);
  await save(input.root, store);
  return advisory;
}
