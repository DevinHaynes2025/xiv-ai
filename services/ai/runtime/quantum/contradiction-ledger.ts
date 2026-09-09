/**
 * 62L-EX11 — EvidenceContradiction graph.
 * Append-oriented; contradictions are first-class; never silent rewrite / LWW.
 */

import { createHash } from 'node:crypto';

import { hashContradiction } from './evidence-integrity.ts';
import type { EvidenceContradiction } from './evidence-types.ts';

export type ContradictionLedger = {
  record(input: {
    tenantId: string;
    universeId: string;
    leftEvidenceId: string;
    rightEvidenceId: string;
    topic: string;
    summary: string;
    createdAt?: string;
  }): EvidenceContradiction;
  list(scope: { tenantId: string; universeId: string }): readonly EvidenceContradiction[];
  get(contradictionId: string): EvidenceContradiction | null;
  involving(evidenceId: string, scope: { tenantId: string; universeId: string }): readonly EvidenceContradiction[];
};

export function createContradictionLedger(): ContradictionLedger {
  const byId = new Map<string, EvidenceContradiction>();

  return {
    record(input) {
      const createdAt = input.createdAt ?? new Date().toISOString();
      const rawId = createHash('sha256')
        .update(
          [
            input.tenantId,
            input.universeId,
            input.leftEvidenceId,
            input.rightEvidenceId,
            input.topic,
            createdAt,
          ].join('|'),
        )
        .digest('hex')
        .slice(0, 24);
      const contradictionId = `ctr-${rawId}`;
      const integrityHash = hashContradiction({
        tenantId: input.tenantId,
        universeId: input.universeId,
        leftEvidenceId: input.leftEvidenceId,
        rightEvidenceId: input.rightEvidenceId,
        topic: input.topic,
        summary: input.summary,
        createdAt,
      });
      const row: EvidenceContradiction = {
        contradictionId,
        tenantId: input.tenantId,
        universeId: input.universeId,
        leftEvidenceId: input.leftEvidenceId,
        rightEvidenceId: input.rightEvidenceId,
        topic: input.topic,
        summary: input.summary,
        createdAt,
        resolved: false,
        integrityHash,
      };
      byId.set(contradictionId, row);
      return row;
    },
    list(scope) {
      return [...byId.values()].filter(
        (c) => c.tenantId === scope.tenantId && c.universeId === scope.universeId,
      );
    },
    get(contradictionId) {
      return byId.get(contradictionId) ?? null;
    },
    involving(evidenceId, scope) {
      return this.list(scope).filter(
        (c) => c.leftEvidenceId === evidenceId || c.rightEvidenceId === evidenceId,
      );
    },
  };
}
