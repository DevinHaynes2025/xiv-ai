import { randomUUID } from 'node:crypto';

import { appendEvidenceEvent } from './evidence-ledger';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { recordContradiction, upsertPartitionedKnowledge, type ContradictionRecord } from './world-knowledge-graph';

export type ProvenanceLink = {
  id: string;
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
  kind: 'derived_from' | 'cited' | 'transformed_from' | 'routed_from';
  createdAt: string;
};

type ProvenanceStore = { links: ProvenanceLink[] };

function storePath(root: string) {
  return xivLocalPath(root, 'provenance-chains.json');
}

async function load(root: string): Promise<ProvenanceLink[]> {
  const parsed = await readJsonFile<ProvenanceStore>(storePath(root), { links: [] });
  return Array.isArray(parsed.links) ? parsed.links : [];
}

async function save(root: string, links: ProvenanceLink[]) {
  await writeJsonFileAtomic(storePath(root), { links: links.slice(-20_000) });
}

export async function appendProvenance(input: {
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
  kind: ProvenanceLink['kind'];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('PROVENANCE_SCOPE_REQUIRED');
  if (!input.from.trim() || !input.to.trim()) throw new Error('PROVENANCE_ENDPOINTS_REQUIRED');
  if (input.from === input.to) throw new Error('PROVENANCE_LOOP_DENIED');
  const root = input.root ?? process.cwd();
  const links = await load(root);
  const link: ProvenanceLink = {
    id: `prov_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    from: input.from,
    to: input.to,
    kind: input.kind,
    createdAt: new Date().toISOString(),
  };
  links.push(link);
  await save(root, links);
  return link;
}

export async function provenanceChain(input: {
  tenantId: string;
  universeId: string;
  start: string;
  root?: string;
}) {
  const links = (await load(input.root ?? process.cwd())).filter(
    (link) => link.tenantId === input.tenantId && link.universeId === input.universeId,
  );
  const chain = [input.start];
  const seen = new Set<string>([input.start]);
  let cursor = input.start;
  while (true) {
    const next = links.find((link) => link.to === cursor && !seen.has(link.from));
    if (!next) break;
    if (seen.has(next.from)) break;
    seen.add(next.from);
    chain.unshift(next.from);
    cursor = next.from;
  }
  return { chain, weak: chain.length < 2 };
}

export async function routeContradiction(input: {
  tenantId: string;
  universeId: string;
  claimA: string;
  claimB: string;
  evidenceRefs: string[];
  root?: string;
}): Promise<{ contradiction: ContradictionRecord; forgotten: false; routed: true; exploit: false }> {
  await upsertPartitionedKnowledge({
    id: input.claimA,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'company',
    type: 'claim',
    domain: 'supply_chain',
    label: input.claimA,
    summary: input.claimA,
    claimState: 'DISPUTED',
    sourceRefs: input.evidenceRefs,
    root: input.root,
  });
  await upsertPartitionedKnowledge({
    id: input.claimB,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'company',
    type: 'claim',
    domain: 'supply_chain',
    label: input.claimB,
    summary: input.claimB,
    claimState: 'DISPUTED',
    sourceRefs: input.evidenceRefs,
    root: input.root,
  });
  const contradiction = await recordContradiction({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'company',
    claimA: input.claimA,
    claimB: input.claimB,
    evidenceRefs: input.evidenceRefs,
    root: input.root,
  });
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Contradiction routed ${input.claimA} ⟂ ${input.claimB}`,
    payload: { contradictionId: contradiction.id, forgotten: false, exploit: false },
  }, input.root);
  return { contradiction, forgotten: false, routed: true, exploit: false };
}
