/**
 * 62L-CE Hardware Intelligence Compiler — map workloads to verified
 * CPU/GPU/NPU/memory/compiler/runtime combinations only.
 * Unverified → UNAVAILABLE (not VERIFIED).
 * Quantization/compression = research candidates; not auto production deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CE_LOCKS,
  COMPRESSION_RESEARCH_CANDIDATE,
  HONESTY_BANNER,
  UNVERIFIED_HARDWARE_UNAVAILABLE,
  type CeActor,
} from './knowledge-excavation-memory-lake-types';

export type HardwareCombo = {
  id: string;
  label: string;
  cpu: string;
  gpu?: string;
  npu?: string;
  memoryGb: number;
  compiler: string;
  runtime: string;
  verified: boolean;
  status: 'verified' | 'unavailable' | 'candidate';
  reason: string;
  createdAt: string;
};

export type WorkloadMapping = {
  id: string;
  workloadId: string;
  comboId: string | null;
  status: 'mapped' | 'unavailable' | 'denied';
  labeledVerified: boolean;
  reason: string;
  createdAt: string;
};

export type CompressionResearchOutput = {
  id: string;
  technique: 'quantization' | 'pruning' | 'distillation' | 'compression';
  status: 'research_candidate';
  autoDeploy: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

type Store = {
  combos: HardwareCombo[];
  mappings: WorkloadMapping[];
  research: CompressionResearchOutput[];
  deployAttempts: Array<{
    id: string;
    researchId: string;
    denied: true;
    reason: string;
    at: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'hardware-intelligence-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    combos: [],
    mappings: [],
    research: [],
    deployAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hardwareCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    unverifiedLabeledVerified: CE_LOCKS.UNVERIFIED_HARDWARE_LABELED_VERIFIED,
    compressionAutoDeploy: CE_LOCKS.COMPRESSION_AUTO_PRODUCTION_DEPLOY,
    quantizationAutoDeploy: CE_LOCKS.QUANTIZATION_AUTO_PRODUCTION_DEPLOY,
  };
}

export async function registerHardwareCombo(input: {
  label: string;
  cpu: string;
  gpu?: string;
  npu?: string;
  memoryGb: number;
  compiler: string;
  runtime: string;
  verified: boolean;
  root: string;
  actor: CeActor;
}): Promise<HardwareCombo> {
  const store = await load(input.root);
  const verified = input.verified === true;
  const combo: HardwareCombo = {
    id: id('hw'),
    label: input.label,
    cpu: input.cpu,
    gpu: input.gpu,
    npu: input.npu,
    memoryGb: input.memoryGb,
    compiler: input.compiler,
    runtime: input.runtime,
    verified,
    status: verified ? 'verified' : 'unavailable',
    reason: verified ? 'VERIFIED_HARDWARE_COMBO' : UNVERIFIED_HARDWARE_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.combos.push(combo);
  await save(input.root, store);
  return combo;
}

export async function mapWorkloadToHardware(input: {
  workloadId: string;
  comboId: string;
  forceLabelVerified?: boolean;
  root: string;
  actor: CeActor;
}): Promise<WorkloadMapping> {
  const store = await load(input.root);
  const combo = store.combos.find((c) => c.id === input.comboId);
  if (!combo || !combo.verified || combo.status !== 'verified') {
    const mapping: WorkloadMapping = {
      id: id('map'),
      workloadId: input.workloadId,
      comboId: combo?.id ?? null,
      status: 'unavailable',
      labeledVerified: false,
      reason: UNVERIFIED_HARDWARE_UNAVAILABLE,
      createdAt: new Date().toISOString(),
    };
    // forceLabelVerified cannot elevate unverified → VERIFIED
    if (input.forceLabelVerified) {
      mapping.labeledVerified = false;
      mapping.reason = UNVERIFIED_HARDWARE_UNAVAILABLE;
    }
    store.mappings.push(mapping);
    await save(input.root, store);
    return mapping;
  }
  const mapping: WorkloadMapping = {
    id: id('map'),
    workloadId: input.workloadId,
    comboId: combo.id,
    status: 'mapped',
    labeledVerified: true,
    reason: 'WORKLOAD_MAPPED_TO_VERIFIED_COMBO',
    createdAt: new Date().toISOString(),
  };
  store.mappings.push(mapping);
  await save(input.root, store);
  return mapping;
}

export async function captureCompressionResearch(input: {
  technique: CompressionResearchOutput['technique'];
  forceAutoDeploy?: boolean;
  root: string;
  actor: CeActor;
}): Promise<CompressionResearchOutput> {
  const store = await load(input.root);
  const output: CompressionResearchOutput = {
    id: id('cmp'),
    technique: input.technique,
    status: 'research_candidate',
    autoDeploy: false,
    productionAuthorized: false,
    reason: COMPRESSION_RESEARCH_CANDIDATE,
    createdAt: new Date().toISOString(),
  };
  store.research.push(output);
  if (input.forceAutoDeploy) {
    store.deployAttempts.push({
      id: id('dep'),
      researchId: output.id,
      denied: true,
      reason: COMPRESSION_RESEARCH_CANDIDATE,
      at: new Date().toISOString(),
    });
  }
  await save(input.root, store);
  return output;
}

export async function attemptCompressionAutoDeploy(input: {
  researchId: string;
  root: string;
  actor: CeActor;
}): Promise<{ denied: true; reason: string; autoDeploy: false }> {
  const store = await load(input.root);
  const research = store.research.find((r) => r.id === input.researchId);
  store.deployAttempts.push({
    id: id('dep'),
    researchId: input.researchId,
    denied: true,
    reason: COMPRESSION_RESEARCH_CANDIDATE,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  void research;
  return {
    denied: true,
    reason: COMPRESSION_RESEARCH_CANDIDATE,
    autoDeploy: false,
  };
}
