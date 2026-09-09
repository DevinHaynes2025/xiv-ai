/**
 * 62L-EX16 — Translation receipt contract + algorithm bridges with provenance.
 */

import { createHash } from 'node:crypto';

import type { AlgorithmTranslation } from './translator.ts';
import type { CompilerResult } from './compiler.ts';
import type { AdapterBinding } from './adapters.ts';
import type { XivProblemIR } from './problem-ir.ts';
import { EX16_COMPILER_VERSION, EX16_SCHEMA_VERSION } from './types.ts';

export type TranslationReceipt = {
  receiptId: string;
  translationId: string;
  sourceIrId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  targetRepresentation: string;
  executionClass: string;
  lossyState: string;
  semanticEquivalence: string;
  compilerVersion: typeof EX16_COMPILER_VERSION | string;
  schemaVersion: typeof EX16_SCHEMA_VERSION | string;
  pipelineStages: string[];
  adapterKind: string | null;
  integrityHash: string;
  createdAt: string;
  offline: boolean;
  physicalQpuVerified: false;
};

export type AlgorithmBridge = {
  bridgeId: string;
  fromRepresentation: string;
  toRepresentation: string;
  translationId: string;
  receiptId: string;
  provenance: string[];
  status: 'RECORDED';
};

function integrity(parts: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

export function emitTranslationReceipt(input: {
  problem: XivProblemIR;
  translation: AlgorithmTranslation;
  compiler?: CompilerResult | null;
  adapter?: AdapterBinding | null;
  offline?: boolean;
  createdAt?: string;
}): TranslationReceipt {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const pipelineStages = input.compiler?.stages.map((s) => s.stage) ?? [];
  const receiptId = `rcpt_${createHash('sha256')
    .update(input.translation.translationId + createdAt)
    .digest('hex')
    .slice(0, 20)}`;
  const base = {
    receiptId,
    translationId: input.translation.translationId,
    sourceIrId: input.problem.irId,
    missionId: input.problem.missionId,
    tenantId: input.problem.tenantId,
    universeId: input.problem.universeId,
    targetRepresentation: input.translation.targetRepresentation,
    executionClass: input.translation.executionClass,
    lossyState: input.translation.lossyState,
    semanticEquivalence: input.translation.semanticEquivalence,
    compilerVersion: input.translation.compilerVersion,
    schemaVersion: input.translation.schemaVersion,
    pipelineStages,
    adapterKind: input.adapter?.adapter.kind ?? null,
    createdAt,
    offline: input.offline ?? true,
    physicalQpuVerified: false as const,
  };
  return {
    ...base,
    integrityHash: integrity(base),
  };
}

export function recordAlgorithmBridge(input: {
  from: string;
  to: string;
  translation: AlgorithmTranslation;
  receipt: TranslationReceipt;
  provenance?: string[];
}): AlgorithmBridge {
  return {
    bridgeId: `br_${input.receipt.receiptId}`,
    fromRepresentation: input.from,
    toRepresentation: input.to,
    translationId: input.translation.translationId,
    receiptId: input.receipt.receiptId,
    provenance: input.provenance ?? [
      `source=${input.translation.sourceIrId}`,
      `receipt=${input.receipt.receiptId}`,
      `integrity=${input.receipt.integrityHash.slice(0, 12)}`,
    ],
    status: 'RECORDED',
  };
}
