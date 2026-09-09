import { createHash } from 'node:crypto';

import { SEALED_REDACTION, readCeoSealedRecord, sealCeoRecord } from './ceo-sealed-vault';
import { rememberFounderMemory, recallFounderMemories } from './founder-memory-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { listDistributedMemory, memoryIntegrity, type DistributedMemoryRecord } from './memory-ingest';
import type { SealedActor } from './hybrid-edge-cloud-types';

export type PoisonFinding = {
  recordId: string;
  poisonState: 'clean' | 'quarantine';
  reason: string;
  dropped: false;
};

async function rewriteMemory(root: string, mutate: (records: DistributedMemoryRecord[]) => void) {
  const path = xivLocalPath(root, 'distributed-memory.json');
  const store = await readJsonFile<{ records: DistributedMemoryRecord[] }>(path, { records: [] });
  const records = Array.isArray(store.records) ? store.records : [];
  mutate(records);
  await writeJsonFileAtomic(path, { records });
  return records;
}

export async function isolateFounderMemory(input: {
  tenantId: string;
  universeId: string;
  founderId: string;
  twinId: string;
  subject: string;
  summary: string;
  actorKind: 'founder_twin' | 'ordinary_agent';
  root?: string;
}) {
  if (input.actorKind === 'ordinary_agent') {
    return {
      accepted: false as const,
      isolated: true as const,
      reason: 'Ordinary agents cannot write restricted founder memory.',
      founderImpersonation: false as const,
    };
  }
  const remembered = await rememberFounderMemory({
    twinId: input.twinId,
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'lesson',
    subject: input.subject,
    summary: input.summary,
    sourceRefs: ['62L-AR:founder-isolation'],
    root: input.root,
  });
  return {
    ...remembered,
    isolated: true as const,
    ordinaryReadable: false as const,
    founderImpersonation: false as const,
  };
}

export async function ordinaryCannotRecallFounderMemory(input: {
  tenantId: string;
  universeId: string;
  founderId: string;
  actorKind: 'ordinary_agent' | 'founder_twin';
  root?: string;
}) {
  if (input.actorKind === 'ordinary_agent') {
    return { allowed: false as const, memories: [] as const, reason: 'FOUNDER_MEMORY_RESTRICTED' };
  }
  const memories = await recallFounderMemories({
    tenantId: input.tenantId,
    universeId: input.universeId,
    founderId: input.founderId,
    root: input.root,
  });
  return { allowed: true as const, memories, reason: 'FOUNDER_TWIN_SCOPE' };
}

export async function sealAndRefuseReplication(input: {
  tenantId: string;
  universeId: string;
  label: string;
  payload: string;
  actor: SealedActor;
  replicator: SealedActor;
  root?: string;
}) {
  const sealed = await sealCeoRecord(input);
  if (!sealed.accepted || !sealed.record) {
    return { sealed: false as const, replicated: false as const, redacted: SEALED_REDACTION, reason: sealed.reason };
  }
  const read = await readCeoSealedRecord({
    recordId: sealed.record.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor: input.replicator,
    root: input.root,
  });
  return {
    sealed: true as const,
    replicated: false as const,
    ordinaryMemory: false as const,
    payload: read.allowed ? read.payload : SEALED_REDACTION,
    allowed: read.allowed,
    reason: read.allowed ? 'GRANT_REQUIRED_FOR_READ' : read.reason,
    recordId: sealed.record.id,
  };
}

export function verifyRecordIntegrity(record: DistributedMemoryRecord) {
  const expected = memoryIntegrity({
    tenantId: record.tenantId,
    universeId: record.universeId,
    contentHash: record.contentHash,
    claim: record.claim,
  });
  const ok = expected === record.integrity;
  return {
    ok,
    poisonState: ok ? ('clean' as const) : ('quarantine' as const),
    expected,
    observed: record.integrity,
  };
}

export async function scanMemoryPoison(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<{ findings: PoisonFinding[]; quarantined: number }> {
  const root = input.root ?? process.cwd();
  const records = await listDistributedMemory({ ...input, root });
  const findings: PoisonFinding[] = [];
  await rewriteMemory(root, (all) => {
    for (const record of all) {
      if (record.tenantId !== input.tenantId || record.universeId !== input.universeId) continue;
      const check = verifyRecordIntegrity(record);
      if (!check.ok) {
        record.poisonState = 'quarantine';
        findings.push({
          recordId: record.id,
          poisonState: 'quarantine',
          reason: 'Integrity hash mismatch. Record quarantined, not dropped.',
          dropped: false,
        });
      }
    }
  });
  return { findings, quarantined: findings.length };
}

export async function injectPoisonForTest(input: {
  tenantId: string;
  universeId: string;
  recordId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  await rewriteMemory(root, (records) => {
    const record = records.find((item) => item.id === input.recordId);
    if (record) record.integrity = createHash('sha256').update('poisoned').digest('hex');
  });
}
