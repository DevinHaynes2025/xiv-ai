/**
 * 62L-EX16 — Feedback loop (strengthen / REGRESSED),
 * neural node pathway (explainable; no authority change),
 * XIV_TRANSLATION_DNA (XIV-owned only; no proprietary compiler internals).
 */

import { createHash } from 'node:crypto';

import type { AlgorithmTranslation } from './translator.ts';
import type { TranslationReceipt } from './receipts.ts';
import {
  EX16_LOCKS,
  EX16_COMPILER_VERSION,
  EX16_SCHEMA_VERSION,
  EX16_CANONICAL_FLOW,
  type FeedbackOutcome,
} from './types.ts';

export type FeedbackEvent = {
  eventId: string;
  translationId: string;
  outcome: FeedbackOutcome;
  metricDelta: number;
  authorityChanged: false;
  permissionsChanged: false;
  note: string;
};

export function applyTranslationFeedback(input: {
  translation: AlgorithmTranslation;
  metricDelta: number;
}): FeedbackEvent {
  let outcome: FeedbackOutcome = 'UNCHANGED';
  if (input.metricDelta > 0) outcome = 'STRENGTHENED';
  else if (input.metricDelta < 0) outcome = 'REGRESSED';
  return {
    eventId: `fb_${input.translation.translationId}_${outcome}`,
    translationId: input.translation.translationId,
    outcome,
    metricDelta: input.metricDelta,
    authorityChanged: false,
    permissionsChanged: false,
    note: 'Feedback may strengthen/regress routing preference only; never authority.',
  };
}

export type NeuralPathwayNode = {
  hop: (typeof EX16_CANONICAL_FLOW)[number];
  explain: string;
};

export type NeuralPathwayTrace = {
  pathwayId: string;
  nodes: NeuralPathwayNode[];
  explainable: true;
  authorityChanged: false;
};

export function explainNeuralPathway(translationId: string): NeuralPathwayTrace {
  return {
    pathwayId: `np_${translationId}`,
    nodes: EX16_CANONICAL_FLOW.map((hop) => ({
      hop,
      explain: `EX16 hop ${hop} for translation ${translationId}`,
    })),
    explainable: true,
    authorityChanged: EX16_LOCKS.LEARNING_CHANGES_AUTHORITY,
  };
}

/**
 * Learning / neural updates cannot change authority.
 */
export function learningChangesAuthority(): false {
  return EX16_LOCKS.LEARNING_CHANGES_AUTHORITY;
}

export type XivTranslationDna = {
  dnaId: 'XIV_TRANSLATION_DNA';
  owner: 'XIV';
  compilerVersion: typeof EX16_COMPILER_VERSION;
  schemaVersion: typeof EX16_SCHEMA_VERSION;
  canonicalFlow: typeof EX16_CANONICAL_FLOW;
  proprietaryCompilerInternalsExposed: false;
  vendorLocked: false;
  hash: string;
};

export function buildXivTranslationDna(): XivTranslationDna {
  const base = {
    dnaId: 'XIV_TRANSLATION_DNA' as const,
    owner: 'XIV' as const,
    compilerVersion: EX16_COMPILER_VERSION,
    schemaVersion: EX16_SCHEMA_VERSION,
    canonicalFlow: EX16_CANONICAL_FLOW,
    proprietaryCompilerInternalsExposed: EX16_LOCKS.EXPOSE_PROPRIETARY_COMPILER_INTERNALS,
    vendorLocked: false as const,
  };
  return {
    ...base,
    hash: createHash('sha256').update(JSON.stringify(base)).digest('hex'),
  };
}

export function attachReceiptToDna(
  dna: XivTranslationDna,
  receipt: TranslationReceipt,
): { dnaId: 'XIV_TRANSLATION_DNA'; receiptId: string; linked: true } {
  return { dnaId: dna.dnaId, receiptId: receipt.receiptId, linked: true };
}
