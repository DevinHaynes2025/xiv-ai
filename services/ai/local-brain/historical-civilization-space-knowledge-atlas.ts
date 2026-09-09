/**
 * 62L-EA Module E — Historical Civilization/Space Knowledge Atlas.
 * Ancient-civilization knowledge, symbol translation, deep-time science,
 * space/aerospace research. Speculative topics → RESEARCH_SIM / SPECULATIVE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ATLAS_ACL_DENIED,
  MAX_ATLAS_EVENTS,
  SPECULATIVE_QUARANTINE,
  SPECULATIVE_TOPICS,
  SYMBOL_AUTHORIZED_DATA_ONLY,
  type EaActor,
  type EaEvidenceState,
  type SpeculativeTopic,
} from './global-operations-intelligence-grid-types';

export type AtlasAccess = {
  id: string;
  entryId: string;
  authorized: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type SpeculativeQuarantine = {
  id: string;
  topic: SpeculativeTopic | string;
  claimVerifiedFact: boolean;
  status: 'quarantined' | 'denied';
  state: EaEvidenceState;
  reason: string;
  label: 'SPECULATIVE' | 'RESEARCH_SIM';
  at: string;
};

export type SymbolTranslation = {
  id: string;
  symbolId: string;
  authorizedPublicLicensedOrCustomerOwned: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  accesses: AtlasAccess[];
  speculative: SpeculativeQuarantine[];
  symbols: SymbolTranslation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-civilization-space-knowledge-atlas.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    accesses: [],
    speculative: [],
    symbols: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalCivilizationSpaceKnowledgeAtlasHonesty() {
  return {
    aclDenyByDefault: true,
    speculativeTopicsQuarantined: true,
    speculativeTopics: SPECULATIVE_TOPICS,
    symbolTranslationAuthorizedDataOnly: true,
    speculativeNeqVerifiedFact: true,
  };
}

export async function accessCivilizationAtlas(input: {
  entryId: string;
  authorized: boolean;
  root: string;
  actor: EaActor;
}): Promise<AtlasAccess> {
  const store = await load(input.root);
  void input.actor;
  if (store.accesses.length >= MAX_ATLAS_EVENTS) {
    throw new Error('MAX_ATLAS_EVENTS_REACHED');
  }
  if (!input.authorized) {
    const denied: AtlasAccess = {
      id: id('eaatl'),
      entryId: input.entryId.trim(),
      authorized: false,
      status: 'denied',
      reason: ATLAS_ACL_DENIED,
      at: new Date().toISOString(),
    };
    store.accesses.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: AtlasAccess = {
    id: id('eaatl'),
    entryId: input.entryId.trim(),
    authorized: true,
    status: 'ok',
    reason: 'ATLAS_ACCESS_AUTHORIZED',
    at: new Date().toISOString(),
  };
  store.accesses.push(ok);
  await save(input.root, store);
  return ok;
}

export async function quarantineSpeculativeTopic(input: {
  topic: SpeculativeTopic | string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: EaActor;
}): Promise<SpeculativeQuarantine> {
  const store = await load(input.root);
  void input.actor;
  const quarantine: SpeculativeQuarantine = {
    id: id('easpq'),
    topic: input.topic,
    claimVerifiedFact: Boolean(input.claimVerifiedFact),
    status: input.claimVerifiedFact ? 'denied' : 'quarantined',
    state: input.claimVerifiedFact ? 'DENIED' : 'RESEARCH_SIM',
    reason: SPECULATIVE_QUARANTINE,
    label: 'RESEARCH_SIM',
    at: new Date().toISOString(),
  };
  store.speculative.push(quarantine);
  await save(input.root, store);
  return quarantine;
}

export async function translateSymbol(input: {
  symbolId: string;
  authorizedPublicLicensedOrCustomerOwned: boolean;
  root: string;
  actor: EaActor;
}): Promise<SymbolTranslation> {
  const store = await load(input.root);
  void input.actor;
  if (!input.authorizedPublicLicensedOrCustomerOwned) {
    const denied: SymbolTranslation = {
      id: id('easym'),
      symbolId: input.symbolId.trim(),
      authorizedPublicLicensedOrCustomerOwned: false,
      status: 'denied',
      reason: SYMBOL_AUTHORIZED_DATA_ONLY,
      at: new Date().toISOString(),
    };
    store.symbols.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: SymbolTranslation = {
    id: id('easym'),
    symbolId: input.symbolId.trim(),
    authorizedPublicLicensedOrCustomerOwned: true,
    status: 'ok',
    reason: 'SYMBOL_TRANSLATION_AUTHORIZED_DATA',
    at: new Date().toISOString(),
  };
  store.symbols.push(ok);
  await save(input.root, store);
  return ok;
}
