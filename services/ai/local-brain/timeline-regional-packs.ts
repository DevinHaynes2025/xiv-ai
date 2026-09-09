import { registerKnowledgePack, type KnowledgePackClaim } from './knowledge-packs';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { KnowledgePartition } from './world-knowledge-graph';

export type IndustryTimelineEvent = {
  id: string;
  tenantId: string;
  universeId: string;
  industry: string;
  label: string;
  summary: string;
  validFrom: string;
  validTo?: string;
  sourceRefs: string[];
  productionAuthorization: false;
};

type TimelineStore = { events: IndustryTimelineEvent[] };

function timelinePath(root: string) {
  return xivLocalPath(root, 'industry-timelines.json');
}

export async function recordIndustryTimelineEvent(input: {
  tenantId: string;
  universeId: string;
  industry: string;
  label: string;
  summary: string;
  validFrom: string;
  validTo?: string;
  sourceRefs: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.sourceRefs.length === 0) throw new Error('TIMELINE_PROVENANCE_REQUIRED');
  const root = input.root ?? process.cwd();
  const event: IndustryTimelineEvent = {
    id: cortexId('tl'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry,
    label: input.label.trim(),
    summary: input.summary.trim(),
    validFrom: input.validFrom,
    validTo: input.validTo,
    sourceRefs: [...input.sourceRefs],
    productionAuthorization: false,
  };
  const parsed = await readJsonFile<TimelineStore>(timelinePath(root), { events: [] });
  const events = Array.isArray(parsed.events) ? parsed.events : [];
  events.push(event);
  await writeJsonFileAtomic(timelinePath(root), { events: events.slice(-10_000) });
  return event;
}

export async function recallIndustryTimeline(input: {
  tenantId: string;
  universeId: string;
  industry?: string;
  asOf?: string;
  root?: string;
}) {
  const asOf = input.asOf ?? new Date().toISOString();
  const parsed = await readJsonFile<TimelineStore>(timelinePath(input.root ?? process.cwd()), { events: [] });
  const events = Array.isArray(parsed.events) ? parsed.events : [];
  return events.filter((event) => {
    if (event.tenantId !== input.tenantId || event.universeId !== input.universeId) return false;
    if (input.industry && event.industry !== input.industry) return false;
    if (event.validFrom > asOf) return false;
    if (event.validTo && event.validTo < asOf) return false;
    return true;
  });
}

export async function registerRegionalIntelligencePack(input: {
  tenantId: string;
  universeId: string;
  region: string;
  title: string;
  claims: KnowledgePackClaim[];
  partition?: KnowledgePartition;
  root?: string;
}) {
  const pack = await registerKnowledgePack({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition ?? 'world',
    domain: 'culture',
    title: `${input.region}: ${input.title}`,
    claims: input.claims,
    root: input.root,
  });
  return {
    pack,
    region: input.region,
    liveGlobalCorpus: false as const,
    productionAuthorization: false as const,
  };
}
