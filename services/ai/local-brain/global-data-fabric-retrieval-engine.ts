/**
 * 62L-DX Module B — Global Data Fabric & Retrieval Engine.
 * Federated retrieval + historical-data coverage; ACL / deny-by-default.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  FABRIC_ACL_DENIED,
  LABEL_NEQ_FABRIC_ACCESS,
  MAX_FABRIC_QUERIES,
  UNAUTHORIZED_HISTORICAL,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type FabricQuery = {
  id: string;
  query: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  historicalCoverageAuthorized: boolean;
  status: 'allowed_sandbox' | 'denied';
  reason: string;
  at: string;
};

type Store = { queries: FabricQuery[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-data-fabric-retrieval-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { queries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalDataFabricRetrievalHonesty() {
  return {
    denyByDefault: true,
    labelAloneEqAccess: false,
    unauthorizedHistoricalCoverage: false,
    authorizedPublicLicensedCustomerOwnedOnly: true,
  };
}

export async function federatedRetrieve(input: {
  query: string;
  labelPresent?: boolean;
  explicitGrant?: boolean;
  historicalCoverageAuthorized?: boolean;
  root: string;
  actor: DxActor;
}): Promise<FabricQuery> {
  const store = await load(input.root);
  void input.actor;
  if (store.queries.length >= MAX_FABRIC_QUERIES) {
    throw new Error('MAX_FABRIC_QUERIES_REACHED');
  }

  const labelPresent = input.labelPresent === true;
  const explicitGrant = input.explicitGrant === true;
  const historicalOk = input.historicalCoverageAuthorized === true;

  let status: FabricQuery['status'] = 'denied';
  let reason = FABRIC_ACL_DENIED;

  if (!explicitGrant && labelPresent) {
    reason = LABEL_NEQ_FABRIC_ACCESS;
  } else if (explicitGrant && !historicalOk) {
    reason = UNAUTHORIZED_HISTORICAL;
  } else if (explicitGrant && historicalOk) {
    status = 'allowed_sandbox';
    reason = 'FEDERATED_RETRIEVAL_SANDBOXED_AUTHORIZED_ONLY';
  }

  const record: FabricQuery = {
    id: id('dxfab'),
    query: input.query.trim(),
    labelPresent,
    explicitGrant,
    historicalCoverageAuthorized: historicalOk,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.queries.push(record);
  await save(input.root, store);
  return record;
}
