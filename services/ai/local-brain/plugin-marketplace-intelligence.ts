/**
 * 62L-DQ Plugin Marketplace Intelligence —
 * Marketplace intelligence over connectors (trust/health/reuse signals).
 * Intelligence signals ≠ automatic authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { DQ_LOCKS, type DqActor } from './universal-integration-brain-types';

export type MarketplaceIntelligenceSignal = {
  id: string;
  connectorId: string;
  healthScore: number;
  reuseCount: number;
  trustHint: number;
  grantsAuthority: false;
  grantsTrust: false;
  reason: string;
  at: string;
};

type Store = {
  signals: MarketplaceIntelligenceSignal[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-marketplace-intelligence.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { signals: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pluginMarketplaceIntelligenceHonesty() {
  return {
    installedEqTrusted: DQ_LOCKS.INSTALLED_EQ_TRUSTED,
    registrationGrantsAuthority: DQ_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    intelligenceEqAuthority: false,
  };
}

export async function recordMarketplaceIntelligence(input: {
  connectorId: string;
  healthScore: number;
  reuseCount: number;
  trustHint: number;
  root: string;
  actor: DqActor;
}): Promise<MarketplaceIntelligenceSignal> {
  const store = await load(input.root);
  void input.actor;
  const signal: MarketplaceIntelligenceSignal = {
    id: id('dqmkt'),
    connectorId: input.connectorId,
    healthScore: Math.max(0, Math.min(100, input.healthScore)),
    reuseCount: Math.max(0, input.reuseCount),
    trustHint: Math.max(0, Math.min(100, input.trustHint)),
    grantsAuthority: false,
    grantsTrust: false,
    reason: 'MARKETPLACE_INTELLIGENCE_SIGNAL_RECORDED_NOT_AUTHORITY',
    at: new Date().toISOString(),
  };
  store.signals.push(signal);
  await save(input.root, store);
  return signal;
}
