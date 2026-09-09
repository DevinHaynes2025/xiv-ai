/**
 * 62L-EX16 — Software wormholes for cached translations with freshness checks.
 * Identical cached translation must pass freshness; stale compiler → invalid.
 */

import { createHash } from 'node:crypto';

import type { AlgorithmTranslation } from './translator.ts';
import { isTranslationStale } from './compiler.ts';
import { EX16_COMPILER_VERSION, EX16_SCHEMA_VERSION } from './types.ts';

export type TranslationWormhole = {
  wormholeId: string;
  translationId: string;
  payloadHash: string;
  compilerVersion: string;
  schemaVersion: string;
  createdAt: string;
  expiresAt: string | null;
};

export type FreshnessResult =
  | { fresh: true; wormholeId: string }
  | { fresh: false; reason: 'STALE_COMPILER' | 'STALE_SCHEMA' | 'HASH_MISMATCH' | 'EXPIRED'; status: 'STALE' };

function payloadHash(t: AlgorithmTranslation): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        translationId: t.translationId,
        sourceIrId: t.sourceIrId,
        target: t.targetRepresentation,
        lossy: t.lossyState,
        objectivePreserved: t.objectivePreserved,
      }),
    )
    .digest('hex');
}

export function openTranslationWormhole(
  translation: AlgorithmTranslation,
  expiresAt: string | null = null,
): TranslationWormhole {
  return {
    wormholeId: `wh_${translation.translationId}`,
    translationId: translation.translationId,
    payloadHash: payloadHash(translation),
    compilerVersion: translation.compilerVersion,
    schemaVersion: translation.schemaVersion,
    createdAt: translation.createdAt,
    expiresAt,
  };
}

export function checkWormholeFreshness(input: {
  wormhole: TranslationWormhole;
  translation: AlgorithmTranslation;
  nowIso: string;
  currentCompilerVersion?: string;
  currentSchemaVersion?: string;
}): FreshnessResult {
  if (input.wormhole.payloadHash !== payloadHash(input.translation)) {
    return { fresh: false, reason: 'HASH_MISMATCH', status: 'STALE' };
  }
  if (
    input.wormhole.expiresAt &&
    Date.parse(input.nowIso) > Date.parse(input.wormhole.expiresAt)
  ) {
    return { fresh: false, reason: 'EXPIRED', status: 'STALE' };
  }
  if (
    isTranslationStale({
      translationCompilerVersion: input.wormhole.compilerVersion,
      translationSchemaVersion: input.wormhole.schemaVersion,
      currentCompilerVersion: input.currentCompilerVersion,
      currentSchemaVersion: input.currentSchemaVersion,
    })
  ) {
    if (
      input.wormhole.compilerVersion !==
      (input.currentCompilerVersion ?? EX16_COMPILER_VERSION)
    ) {
      return { fresh: false, reason: 'STALE_COMPILER', status: 'STALE' };
    }
    return { fresh: false, reason: 'STALE_SCHEMA', status: 'STALE' };
  }
  // Identical cached translation with matching versions
  if (
    input.wormhole.translationId === input.translation.translationId &&
    input.wormhole.compilerVersion === EX16_COMPILER_VERSION &&
    input.wormhole.schemaVersion === EX16_SCHEMA_VERSION
  ) {
    return { fresh: true, wormholeId: input.wormhole.wormholeId };
  }
  return { fresh: true, wormholeId: input.wormhole.wormholeId };
}
