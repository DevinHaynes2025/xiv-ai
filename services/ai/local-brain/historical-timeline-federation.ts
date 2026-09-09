import { ingestLakeSource, listLakeObjects, type KnowledgeLakeObject } from './knowledge-lake';
import { federateLogicalUniverses, isFederated, ensureLogicalUniverse } from './logical-universe-graph';
import { conveneHistoricalCulturalCouncil } from './cortex-councils';
import type { ClaimState } from './knowledge-domains';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { EnsEvidenceState } from './enterprise-nervous-types';

export type HistoricalTimelineEntry = {
  id: string;
  tenantId: string;
  universeId: string;
  era: string;
  topic: string;
  lakeObjectId?: string;
  claimState: ClaimState;
  provenanceRefs: string[];
  confidence: number;
  freshness: string;
  culturalDeterminismAboutIndividuals: false;
  productionAuthorization: false;
};

type TimelineStore = { entries: HistoricalTimelineEntry[] };

function timelinePath(root: string) {
  return xivLocalPath(root, 'ens-historical-timelines.json');
}

async function loadTimeline(root: string): Promise<HistoricalTimelineEntry[]> {
  const parsed = await readJsonFile<TimelineStore>(timelinePath(root), { entries: [] });
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

async function saveTimeline(root: string, entries: HistoricalTimelineEntry[]) {
  await writeJsonFileAtomic(timelinePath(root), { entries: entries.slice(-5_000) });
}

export async function ingestHistoricalKnowledge(input: {
  tenantId: string;
  universeId: string;
  industry?: string;
  era: string;
  sourceUri: string;
  sourceLanguage: string;
  originalText: string;
  provenanceRefs: string[];
  claimState?: ClaimState;
  root?: string;
}): Promise<{ object: KnowledgeLakeObject; claimState: ClaimState; duplicate: boolean }> {
  const ingested = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry ?? 'history',
    era: input.era,
    partition: 'world',
    sourceUri: input.sourceUri,
    sourceLanguage: input.sourceLanguage,
    originalText: input.originalText,
    provenanceRefs: input.provenanceRefs,
    root: input.root,
  });
  return {
    object: ingested.object,
    claimState: input.claimState ?? 'HISTORICAL_ACCOUNT',
    duplicate: ingested.duplicate,
  };
}

export async function recordHistoricalCulturalTimeline(input: {
  tenantId: string;
  universeId: string;
  era: string;
  topic: string;
  lakeObjectId?: string;
  claimState?: ClaimState;
  provenanceRefs: string[];
  root?: string;
}): Promise<HistoricalTimelineEntry> {
  const root = input.root ?? process.cwd();
  const council = await conveneHistoricalCulturalCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: input.topic,
    kind: 'mixed',
    root,
  });
  const provenance = input.provenanceRefs.length ? input.provenanceRefs : council.evidenceRefs;
  const entry: HistoricalTimelineEntry = {
    id: cortexId('timeline'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    era: input.era,
    topic: input.topic,
    lakeObjectId: input.lakeObjectId,
    claimState: input.claimState ?? 'HISTORICAL_ACCOUNT',
    provenanceRefs: provenance,
    confidence: provenance.length ? 0.5 : 0.1,
    freshness: new Date().toISOString(),
    culturalDeterminismAboutIndividuals: false,
    productionAuthorization: false,
  };
  const entries = await loadTimeline(root);
  entries.push(entry);
  await saveTimeline(root, entries);
  return entry;
}

export async function listHistoricalTimelines(input: {
  tenantId: string;
  universeId: string;
  era?: string;
  root?: string;
}) {
  const entries = await loadTimeline(input.root ?? process.cwd());
  return entries.filter(
    (entry) =>
      entry.tenantId === input.tenantId &&
      entry.universeId === input.universeId &&
      (!input.era || entry.era === input.era),
  );
}

export async function federateAuthorizedAgents(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  counterpartyTenantId?: string;
  explicitAuthorization: boolean;
  root?: string;
}): Promise<{ accepted: boolean; state: EnsEvidenceState; reason: string; linkId?: string }> {
  if (!input.tenantId || !input.fromUniverseId || !input.toUniverseId) {
    return { accepted: false, state: 'FAIL', reason: 'TENANT_AND_UNIVERSE_REQUIRED' };
  }
  if (input.counterpartyTenantId && input.counterpartyTenantId !== input.tenantId) {
    return { accepted: false, state: 'FAIL', reason: 'CROSS_TENANT_FEDERATION_DENIED' };
  }
  if (!input.explicitAuthorization) {
    return { accepted: false, state: 'UNAVAILABLE', reason: 'FEDERATION_REQUIRES_EXPLICIT_AUTHORIZATION' };
  }
  await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.fromUniverseId, root: input.root });
  await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.toUniverseId, root: input.root });
  const link = await federateLogicalUniverses({
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    assets: ['agents', 'evidence', 'knowledge_packs'],
    root: input.root,
  });
  return { accepted: true, state: 'PASS', reason: 'AUTHORIZED_SAME_TENANT_FEDERATION', linkId: link.id };
}

export async function agentsAreFederated(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  root?: string;
}) {
  return isFederated(input);
}

export async function listHistoricalLakeObjects(input: {
  tenantId: string;
  universeId: string;
  era?: string;
  root?: string;
}) {
  return listLakeObjects({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: 'history',
    era: input.era,
    root: input.root,
  });
}
