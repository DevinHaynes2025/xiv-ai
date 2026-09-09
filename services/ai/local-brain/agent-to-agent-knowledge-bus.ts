/**
 * 62L-DX Module F — Agent-to-Agent Knowledge Bus.
 * Authorized signed exchange only; sealed deny otherwise.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  A2A_UNAUTHORIZED_DENIED,
  A2A_UNSIGNED_DENIED,
  MAX_A2A_EXCHANGES,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type A2aExchange = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  signed: boolean;
  authorized: boolean;
  status: 'accepted_sandbox' | 'denied';
  reason: string;
  at: string;
};

type Store = { exchanges: A2aExchange[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-to-agent-knowledge-bus.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { exchanges: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentToAgentKnowledgeBusHonesty() {
  return {
    signedAuthorizedOnly: true,
    unsignedDenied: true,
    unauthorizedDenied: true,
    sealedDenyOtherwise: true,
  };
}

export async function exchangeAgentKnowledge(input: {
  fromAgentId: string;
  toAgentId: string;
  signed: boolean;
  authorized: boolean;
  root: string;
  actor: DxActor;
}): Promise<A2aExchange> {
  const store = await load(input.root);
  void input.actor;
  if (store.exchanges.length >= MAX_A2A_EXCHANGES) {
    throw new Error('MAX_A2A_EXCHANGES_REACHED');
  }

  let status: A2aExchange['status'] = 'denied';
  let reason = A2A_UNAUTHORIZED_DENIED;

  if (!input.signed) {
    reason = A2A_UNSIGNED_DENIED;
  } else if (!input.authorized) {
    reason = A2A_UNAUTHORIZED_DENIED;
  } else {
    status = 'accepted_sandbox';
    reason = 'A2A_SIGNED_AUTHORIZED_EXCHANGE_SANDBOXED';
  }

  const record: A2aExchange = {
    id: id('dxa2a'),
    fromAgentId: input.fromAgentId,
    toAgentId: input.toAgentId,
    signed: input.signed,
    authorized: input.authorized,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.exchanges.push(record);
  await save(input.root, store);
  return record;
}
