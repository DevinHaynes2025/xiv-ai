/**
 * 62L-DA Superbrain Runtime Kernel façade —
 * Coherent runtime kernel over department OS, knowledge event bus,
 * model federation, compute control plane, software factory, and
 * universe continuity engine. Coexistence layer — not mega-merge.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DA_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  type DaActor,
} from './superbrain-runtime-kernel-types';
import { autonomousDepartmentOsHonesty } from './autonomous-department-operating-system';
import { neuralKnowledgeEventBusHonesty } from './neural-knowledge-event-bus';
import { localCloudModelFederationHonesty } from './local-cloud-model-federation';
import { heterogeneousComputeControlPlaneHonesty } from './heterogeneous-compute-control-plane';
import { agentSoftwareCompanyFactoryHonesty } from './agent-software-company-factory';
import { universeContinuityEngineHonesty } from './distributed-universe-continuity-engine';

export type SuperbrainRuntimeKernel = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  createdAt: string;
};

type Store = { kernels: SuperbrainRuntimeKernel[] };

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-runtime-kernel.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { kernels: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function superbrainRuntimeKernelHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DA_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DA_LOCKS.TIP_LAND,
    productionAuthorization: DA_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DA_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DA_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    coexistenceLayer: DA_LOCKS.OS_IS_COEXISTENCE_LAYER,
    megaDeltaSwallow: DA_LOCKS.OS_SWALLOWS_UNRELATED_MEGA_DELTA,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      departmentOs: autonomousDepartmentOsHonesty(),
      knowledgeEventBus: neuralKnowledgeEventBusHonesty(),
      modelFederation: localCloudModelFederationHonesty(),
      computeControlPlane: heterogeneousComputeControlPlaneHonesty(),
      softwareFactory: agentSoftwareCompanyFactoryHonesty(),
      universeContinuity: universeContinuityEngineHonesty(),
    },
  };
}

export async function bootstrapSuperbrainRuntimeKernel(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DaActor;
}): Promise<SuperbrainRuntimeKernel> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.kernels.find(
    (k) =>
      k.orgId === input.orgId &&
      k.tenantId === input.tenantId &&
      k.universeId === input.universeId,
  );
  if (existing) return existing;
  const kernel: SuperbrainRuntimeKernel = {
    id: id('srk'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    createdAt: new Date().toISOString(),
  };
  store.kernels.push(kernel);
  await save(input.root, store);
  return kernel;
}
