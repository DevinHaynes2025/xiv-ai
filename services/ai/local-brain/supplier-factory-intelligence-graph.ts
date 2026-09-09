/**
 * 62L-EI Module E — Supplier/Factory Intelligence Graph.
 * Supplier / manufacturer / factory + electronics/semiconductor supply-chain
 * intelligence = advisory only; ≠ physical control / auto PO / freight.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ELECTRONICS_SC_NEQ_PHYSICAL,
  MAX_SUPPLIER_EVENTS,
  SC_NEQ_AUTO_PO_FREIGHT,
  SUPPLIER_FACTORY_ADVISORY,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type SupplierFactoryNode = {
  id: string;
  nodeId: string;
  kind: 'supplier' | 'manufacturer' | 'factory' | 'electronics_sc' | 'semiconductor_sc';
  status: 'ok';
  state: EiEvidenceState;
  reason: string;
  advisoryOnly: true;
  physicalControlEnabled: false;
  autoPoEnabled: false;
  autoFreightEnabled: false;
  at: string;
};

export type AutoPoFreightProbe = {
  id: string;
  action: 'auto_po' | 'auto_freight';
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  autoPoEnabled: false;
  autoFreightEnabled: false;
  at: string;
};

export type ElectronicsPhysicalProbe = {
  id: string;
  claimPhysicalControl: boolean;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  physicalControlEnabled: false;
  at: string;
};

type Store = {
  nodes: SupplierFactoryNode[];
  autoActions: AutoPoFreightProbe[];
  physical: ElectronicsPhysicalProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supplier-factory-intelligence-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    autoActions: [],
    physical: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function supplierFactoryIntelligenceGraphHonesty() {
  return {
    advisoryOnly: true,
    neqPhysicalControl: true,
    neqAutoPo: true,
    neqAutoFreight: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerSupplierFactoryNode(input: {
  nodeId: string;
  kind: SupplierFactoryNode['kind'];
  root: string;
  actor: EiActor;
}): Promise<SupplierFactoryNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_SUPPLIER_EVENTS) {
    throw new Error('MAX_SUPPLIER_EVENTS');
  }
  const node: SupplierFactoryNode = {
    id: id('eisup'),
    nodeId: input.nodeId.trim(),
    kind: input.kind,
    status: 'ok',
    state: 'ADVISORY_ONLY',
    reason: SUPPLIER_FACTORY_ADVISORY,
    advisoryOnly: true,
    physicalControlEnabled: false,
    autoPoEnabled: false,
    autoFreightEnabled: false,
    at: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function denyAutoPoOrFreight(input: {
  action: 'auto_po' | 'auto_freight';
  root: string;
  actor: EiActor;
}): Promise<AutoPoFreightProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: AutoPoFreightProbe = {
    id: id('eiauto'),
    action: input.action,
    status: 'denied',
    state: 'DENIED',
    reason: SC_NEQ_AUTO_PO_FREIGHT,
    autoPoEnabled: false,
    autoFreightEnabled: false,
    at: new Date().toISOString(),
  };
  store.autoActions.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeElectronicsScPhysicalControl(input: {
  claimPhysicalControl: boolean;
  root: string;
  actor: EiActor;
}): Promise<ElectronicsPhysicalProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: ElectronicsPhysicalProbe = {
    id: id('eiscphys'),
    claimPhysicalControl: input.claimPhysicalControl,
    status: 'denied',
    state: 'DENIED',
    reason: ELECTRONICS_SC_NEQ_PHYSICAL,
    physicalControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.physical.push(probe);
  await save(input.root, store);
  return probe;
}
