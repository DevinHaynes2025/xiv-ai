import { retrieveEvidencePathway } from './cortex-evidence';
import { evaluateOfflineTask } from './offline-policy';
import { evaluateKpi } from './kpi-engine';
import { appendLearning } from './learning-ledger';

export type MarketCellState = 'AVAILABLE' | 'WAITING_DATA' | 'UNAVAILABLE' | 'UNKNOWN';

export type MarketResearchCell = {
  id: string;
  tenantId: string;
  universeId: string;
  market: string;
  state: MarketCellState;
  inventedFacts: false;
  liveQuote: false;
  evidenceRefs: string[];
  notes: string[];
  productionAuthorization: false;
  tradingAuthorized: false;
};

export async function runGlobalMarketResearchCell(input: {
  tenantId: string;
  universeId: string;
  market: string;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  root?: string;
}): Promise<MarketResearchCell> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.market.trim()) throw new Error('MARKET_REQUIRED');
  const offline = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  if (!offline.allowed) {
    const state: MarketCellState = offline.state === 'WAITING_DATA'
      ? 'WAITING_DATA'
      : offline.state === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'UNKNOWN';
    return {
      id: `mkt:${input.market}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      market: input.market.trim(),
      state,
      inventedFacts: false,
      liveQuote: false,
      evidenceRefs: [],
      notes: [offline.reason, 'Live global-market quotes are not fabricated.'],
      productionAuthorization: false,
      tradingAuthorized: false,
    };
  }

  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.market,
    root: input.root,
  });
  const kpi = evaluateKpi({
    metric: `offline-market:${input.market}`,
    value: evidence.evidenceRefs.length,
    unit: 'local_evidence_refs',
    observedAt: new Date().toISOString(),
    sourceRefs: evidence.evidenceRefs,
    stale: evidence.state !== 'AVAILABLE',
  });
  if (evidence.evidenceRefs.length) {
    await appendLearning({
      domain: 'finance',
      subject: `market-cell:${input.market}`,
      claimState: 'MODEL_INFERENCE',
      summary: `Offline market cell used ${evidence.evidenceRefs.length} local refs. Not a live quote.`,
      sourceRefs: evidence.evidenceRefs,
      evidence: evidence.evidenceRefs,
    }, input.root);
  }

  const state: MarketCellState = evidence.state === 'AVAILABLE' && kpi.state !== 'UNKNOWN'
    ? 'AVAILABLE'
    : evidence.state === 'WAITING_DATA'
      ? 'WAITING_DATA'
      : evidence.state === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'UNKNOWN';

  return {
    id: `mkt:${input.market}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    market: input.market.trim(),
    state,
    inventedFacts: false,
    liveQuote: false,
    evidenceRefs: evidence.evidenceRefs,
    notes: [
      evidence.reason,
      `kpi=${kpi.state}`,
      'This cell is offline research, not a trading system.',
    ],
    productionAuthorization: false,
    tradingAuthorized: false,
  };
}
