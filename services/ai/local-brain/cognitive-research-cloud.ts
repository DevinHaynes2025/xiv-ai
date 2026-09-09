/**
 * 62L-CU Cognitive Research Cloud — governed research-cloud layer over XIV’s
 * offline brain. Local-first; Founder-sealed deny-by-default; L4=false.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CU_LOCKS,
  HONESTY_BANNER,
  QUEUE_DEPLOY_DENIED,
  type CuActor,
} from './cognitive-research-cloud-types';

export type ResearchCloud = {
  id: string;
  orgId: string;
  tenantId: string;
  mode: 'local_first_offline_brain';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

export type QueueDeployAttempt = {
  id: string;
  cloudId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  clouds: ResearchCloud[];
  deployAttempts: QueueDeployAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cognitive-research-cloud.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { clouds: [], deployAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cognitiveResearchCloudHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CU_LOCKS.L4_AUTONOMY_ENABLED,
    localFirst: CU_LOCKS.LOCAL_FIRST,
    queueProductionDeploy: CU_LOCKS.QUEUE_PRODUCTION_DEPLOY,
    founderSealedDenyByDefault: CU_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function bootstrapCognitiveResearchCloud(input: {
  orgId: string;
  tenantId: string;
  root: string;
  actor: CuActor;
}): Promise<ResearchCloud> {
  const store = await load(input.root);
  const cloud: ResearchCloud = {
    id: id('crc'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    mode: 'local_first_offline_brain',
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    reason: 'COGNITIVE_RESEARCH_CLOUD_BOOTSTRAPPED_LOCAL_FIRST',
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.clouds.push(cloud);
  await save(input.root, store);
  return cloud;
}

export async function attemptQueueProductionDeploy(input: {
  cloudId: string;
  root: string;
  actor: CuActor;
}): Promise<QueueDeployAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: QueueDeployAttempt = {
    id: id('qdeploy'),
    cloudId: input.cloudId,
    status: 'denied',
    reason: QUEUE_DEPLOY_DENIED,
    at: new Date().toISOString(),
  };
  store.deployAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
