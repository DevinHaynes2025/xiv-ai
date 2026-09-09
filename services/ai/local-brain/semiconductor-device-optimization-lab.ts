/**
 * 62L-CF Semiconductor/Device Optimization Lab — CPU/GPU/NPU placement experiments +
 * local-model quantization research. Sandbox only; not production authorize.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CF_LOCKS,
  HONESTY_BANNER,
  QUANTIZATION_LAB_SANDBOX,
  type CfActor,
} from './data-refinery-compression-replication-types';

export type DeviceTarget = 'cpu' | 'gpu' | 'npu' | 'mixed';

export type PlacementExperiment = {
  id: string;
  workloadId: string;
  target: DeviceTarget;
  compatibilityNotes: string;
  status: 'sandbox' | 'denied';
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

export type QuantizationExperiment = {
  id: string;
  modelId: string;
  bits: 4 | 8 | 16;
  status: 'sandbox' | 'denied';
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

type Store = {
  placements: PlacementExperiment[];
  quantizations: QuantizationExperiment[];
  productionAttempts: Array<{
    id: string;
    experimentId: string;
    denied: true;
    reason: string;
    at: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'semiconductor-device-optimization-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    placements: [],
    quantizations: [],
    productionAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deviceLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    deviceLabSandboxOnly: CF_LOCKS.DEVICE_LAB_SANDBOX_ONLY,
    quantizationAutoProduction: CF_LOCKS.QUANTIZATION_AUTO_PRODUCTION,
    placementAutoProduction: CF_LOCKS.PLACEMENT_AUTO_PRODUCTION,
    securityCorrectnessBeatsSizeSpeedEnergy:
      CF_LOCKS.SECURITY_CORRECTNESS_BEATS_SIZE_SPEED_ENERGY,
  };
}

export async function runPlacementExperiment(input: {
  workloadId: string;
  target: DeviceTarget;
  compatibilityNotes?: string;
  forceProductionAuthorize?: boolean;
  root: string;
  actor: CfActor;
}): Promise<PlacementExperiment> {
  const store = await load(input.root);
  const experiment: PlacementExperiment = {
    id: id('place'),
    workloadId: input.workloadId,
    target: input.target,
    compatibilityNotes: input.compatibilityNotes ?? '',
    status: input.forceProductionAuthorize ? 'denied' : 'sandbox',
    productionAuthorized: false,
    reason: QUANTIZATION_LAB_SANDBOX,
    createdAt: new Date().toISOString(),
  };
  store.placements.push(experiment);
  await save(input.root, store);
  return experiment;
}

export async function runQuantizationExperiment(input: {
  modelId: string;
  bits: 4 | 8 | 16;
  forceProductionAuthorize?: boolean;
  root: string;
  actor: CfActor;
}): Promise<QuantizationExperiment> {
  const store = await load(input.root);
  const experiment: QuantizationExperiment = {
    id: id('quant'),
    modelId: input.modelId,
    bits: input.bits,
    status: input.forceProductionAuthorize ? 'denied' : 'sandbox',
    productionAuthorized: false,
    reason: QUANTIZATION_LAB_SANDBOX,
    createdAt: new Date().toISOString(),
  };
  store.quantizations.push(experiment);
  await save(input.root, store);
  return experiment;
}

export async function attemptLabProductionAuthorize(input: {
  experimentId: string;
  root: string;
  actor: CfActor;
}): Promise<{
  accepted: false;
  denied: true;
  reason: typeof QUANTIZATION_LAB_SANDBOX;
}> {
  const store = await load(input.root);
  store.productionAttempts.push({
    id: id('labprod'),
    experimentId: input.experimentId,
    denied: true,
    reason: QUANTIZATION_LAB_SANDBOX,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return { accepted: false, denied: true, reason: QUANTIZATION_LAB_SANDBOX };
}
