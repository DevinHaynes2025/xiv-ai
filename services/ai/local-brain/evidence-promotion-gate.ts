import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const EVIDENCE_PROMOTION_STATES = [
  'raw_docs',
  'parsed',
  'claims',
  'verified',
  'stale',
  'superseded',
  'conflicts',
  'unknowns',
] as const;

export type EvidencePromotionState = (typeof EVIDENCE_PROMOTION_STATES)[number];

export const EVIDENCE_STATES = ['PASS', 'FAIL', 'UNAVAILABLE', 'WAITING_DATA', 'UNKNOWN', 'NOT_TESTED'] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export type PromotedEvidenceRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  promotion: EvidencePromotionState;
  summary: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  testState: EvidenceState;
  inventedFacts: false;
  productionAuthorization: false;
  createdAt: string;
};

type Store = { records: PromotedEvidenceRecord[] };

const ORDER: EvidencePromotionState[] = [...EVIDENCE_PROMOTION_STATES];

function storePath(root: string) {
  return xivLocalPath(root, 'evidence-promotion.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { records: [] });
  return Array.isArray(parsed.records) ? parsed.records : [];
}

async function save(root: string, records: PromotedEvidenceRecord[]) {
  await writeJsonFileAtomic(storePath(root), { records: records.slice(-10_000) });
}

function canAdvance(from: EvidencePromotionState, to: EvidencePromotionState) {
  if (from === to) return true;
  if (to === 'stale' || to === 'superseded' || to === 'conflicts' || to === 'unknowns') return true;
  return ORDER.indexOf(to) === ORDER.indexOf(from) + 1;
}

export async function ingestRawEvidence(input: {
  tenantId: string;
  universeId: string;
  summary: string;
  sourceRefs: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.summary.trim()) throw new Error('EVIDENCE_SUMMARY_REQUIRED');
  const root = input.root ?? process.cwd();
  const record: PromotedEvidenceRecord = {
    id: cortexId('eprom'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    promotion: 'raw_docs',
    summary: input.summary.trim(),
    sourceRefs: [...input.sourceRefs],
    evidenceRefs: [...input.sourceRefs],
    testState: input.sourceRefs.length ? 'NOT_TESTED' : 'UNKNOWN',
    inventedFacts: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  const records = await load(root);
  records.push(record);
  await save(root, records);
  return record;
}

export async function promoteEvidence(input: {
  id: string;
  tenantId: string;
  universeId: string;
  to: EvidencePromotionState;
  testState?: EvidenceState;
  evidenceRefs?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const records = await load(root);
  const record = records.find((item) => item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!record) throw new Error('EVIDENCE_RECORD_NOT_FOUND');
  if (!canAdvance(record.promotion, input.to)) {
    throw new Error(`EVIDENCE_PROMOTION_ILLEGAL:${record.promotion}->${input.to}`);
  }
  if (input.to === 'verified') {
    const refs = input.evidenceRefs ?? record.evidenceRefs;
    if (refs.length === 0) throw new Error('VERIFIED_REQUIRES_EVIDENCE_REFS');
    if ((input.testState ?? record.testState) !== 'PASS') throw new Error('VERIFIED_REQUIRES_PASS_TEST_STATE');
    record.evidenceRefs = [...refs];
  }
  if (input.to === 'unknowns' && (input.evidenceRefs?.length ?? record.evidenceRefs.length) === 0) {
    record.testState = 'UNKNOWN';
  }
  record.promotion = input.to;
  if (input.testState) record.testState = input.testState;
  if (input.evidenceRefs) record.evidenceRefs = [...input.evidenceRefs];
  await save(root, records);
  return record;
}

export async function listPromotedEvidence(input: {
  tenantId: string;
  universeId: string;
  promotion?: EvidencePromotionState;
  root?: string;
}) {
  const records = await load(input.root ?? process.cwd());
  return records.filter((record) =>
    record.tenantId === input.tenantId &&
    record.universeId === input.universeId &&
    (!input.promotion || record.promotion === input.promotion),
  );
}

export function distinguishPromotion(record: PromotedEvidenceRecord) {
  return {
    raw_docs: record.promotion === 'raw_docs',
    parsed: record.promotion === 'parsed',
    claims: record.promotion === 'claims',
    verified: record.promotion === 'verified',
    stale: record.promotion === 'stale',
    superseded: record.promotion === 'superseded',
    conflicts: record.promotion === 'conflicts',
    unknowns: record.promotion === 'unknowns',
  } as const;
}
