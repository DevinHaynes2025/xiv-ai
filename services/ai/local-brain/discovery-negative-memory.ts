import { createHash } from 'node:crypto';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendLearning } from './learning-ledger';
import { appendEvidenceEvent } from './evidence-ledger';
import type { ExperimentKind, EvidenceState } from './discovery-invention-types';

export type NegativeResultRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  fingerprint: string;
  experiment: string;
  kind: ExperimentKind;
  conditions: Record<string, string>;
  evidenceRefs: string[];
  failure: string;
  evidenceState: 'FAIL';
  createdAt: string;
  rediscoveryBlocked: true;
  productionAuthorization: false;
};

type Store = { records: NegativeResultRecord[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'negative-result-memory.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { records: [] });
  return Array.isArray(parsed.records) ? parsed.records : [];
}

async function save(root: string, records: NegativeResultRecord[]) {
  await writeJsonFileAtomic(pathFor(root), { records: records.slice(-8_000) });
}

/** Same fingerprint contract as 62L-AI `negative-result-memory.ts` so the store is shared, not duplicated. */
export function fingerprintExperiment(input: {
  kind: ExperimentKind;
  experiment: string;
  conditions: Record<string, string>;
}) {
  const keys = Object.keys(input.conditions).sort();
  const conditionText = keys.map((key) => `${key}=${String(input.conditions[key] ?? '').trim().toLowerCase()}`).join('|');
  const raw = `${input.kind}\n${input.experiment.trim().toLowerCase()}\n${conditionText}`;
  return createHash('sha256').update(raw).digest('hex');
}

export async function recordNegativeResult(input: {
  tenantId: string;
  universeId: string;
  experiment: string;
  kind: ExperimentKind;
  conditions: Record<string, string>;
  evidenceRefs: string[];
  failure: string;
  root?: string;
}): Promise<NegativeResultRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.experiment.trim() || !input.failure.trim()) throw new Error('NEGATIVE_RESULT_REQUIRES_EXPERIMENT_AND_FAILURE');
  const root = input.root ?? process.cwd();
  const fingerprint = fingerprintExperiment(input);
  const existing = await load(root);
  const already = existing.find((item) =>
    item.tenantId === input.tenantId && item.universeId === input.universeId && item.fingerprint === fingerprint,
  );
  if (already) return already;

  const record: NegativeResultRecord = {
    id: cortexId('neg'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    fingerprint,
    experiment: input.experiment.trim().slice(0, 240),
    kind: input.kind,
    conditions: { ...input.conditions },
    evidenceRefs: [...input.evidenceRefs],
    failure: input.failure.trim().slice(0, 480),
    evidenceState: 'FAIL',
    createdAt: new Date().toISOString(),
    rediscoveryBlocked: true,
    productionAuthorization: false,
  };
  existing.push(record);
  await save(root, existing);
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Negative result retained: ${record.experiment}`,
    payload: { fingerprint, failure: record.failure, kind: record.kind },
  }, root);
  await appendLearning({
    domain: 'science',
    subject: `negative-result:${fingerprint.slice(0, 16)}`,
    claimState: 'UNKNOWN',
    summary: `Dead end retained. experiment=${record.experiment}; failure=${record.failure}`,
    sourceRefs: record.evidenceRefs,
    evidence: [record.id, ...record.evidenceRefs],
    confidence: 0.9,
  }, root);
  return record;
}

export async function lookupDeadEnd(input: {
  tenantId: string;
  universeId: string;
  kind: ExperimentKind;
  experiment: string;
  conditions: Record<string, string>;
  root?: string;
}): Promise<NegativeResultRecord | null> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const fingerprint = fingerprintExperiment(input);
  const existing = await load(root);
  return existing.find((item) =>
    item.tenantId === input.tenantId && item.universeId === input.universeId && item.fingerprint === fingerprint,
  ) ?? null;
}

export async function listNegativeResults(input: { tenantId: string; universeId: string; root?: string }) {
  const existing = await load(input.root ?? process.cwd());
  return existing.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
