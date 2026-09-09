/**
 * Evidence ledger — structured evidence refs only (no hidden CoT).
 */

import { createHash } from 'node:crypto';
import { GOB_LOCKS, type TenantScope } from './types.ts';

export type EvidenceEntry = {
  evidenceId: string;
  agentId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  homeUniverseId: string;
  kind: string;
  summary: string;
  refs: readonly string[];
  contradictions: readonly string[];
  createdAt: string;
  hash: string;
};

export type EvidenceLedger = {
  record(input: {
    agentId: string;
    missionId: string;
    taskId: string;
    scope: TenantScope;
    kind: string;
    summary: string;
    refs?: readonly string[];
    contradictions?: readonly string[];
    hiddenCot?: string;
  }):
    | { recorded: true; entry: EvidenceEntry }
    | { recorded: false; denied: true; reason: string };
  get(evidenceId: string, scope: TenantScope): EvidenceEntry | null;
  list(scope: TenantScope): readonly EvidenceEntry[];
  preserveContradictions(scope: TenantScope): readonly string[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createEvidenceLedger(): EvidenceLedger {
  const byId = new Map<string, EvidenceEntry>();

  return {
    record(input) {
      if (input.hiddenCot !== undefined || GOB_LOCKS.HIDDEN_COT_PERSISTENCE) {
        return {
          recorded: false,
          denied: true,
          reason: 'HIDDEN_COT_PERSISTENCE_FORBIDDEN',
        };
      }
      if (input.kind === 'hidden_cot' || input.kind === 'chain_of_thought') {
        return {
          recorded: false,
          denied: true,
          reason: 'HIDDEN_COT_KIND_FORBIDDEN',
        };
      }
      const createdAt = new Date().toISOString();
      const body = JSON.stringify({
        agentId: input.agentId,
        missionId: input.missionId,
        taskId: input.taskId,
        kind: input.kind,
        summary: input.summary,
        refs: input.refs ?? [],
        contradictions: input.contradictions ?? [],
        createdAt,
      });
      const hash = sha256(body);
      const entry: EvidenceEntry = {
        evidenceId: `ev-${hash.slice(0, 20)}`,
        agentId: input.agentId,
        missionId: input.missionId,
        taskId: input.taskId,
        tenantId: input.scope.tenantId,
        homeUniverseId: input.scope.universeId,
        kind: input.kind,
        summary: input.summary,
        refs: input.refs ?? [],
        contradictions: input.contradictions ?? [],
        createdAt,
        hash,
      };
      byId.set(entry.evidenceId, entry);
      return { recorded: true, entry };
    },

    get(evidenceId, scope) {
      const e = byId.get(evidenceId);
      if (!e) return null;
      if (
        e.tenantId !== scope.tenantId ||
        e.homeUniverseId !== scope.universeId
      ) {
        return null;
      }
      return e;
    },

    list(scope) {
      return [...byId.values()].filter(
        (e) =>
          e.tenantId === scope.tenantId &&
          e.homeUniverseId === scope.universeId,
      );
    },

    preserveContradictions(scope) {
      const out: string[] = [];
      for (const e of this.list(scope)) {
        out.push(...e.contradictions);
      }
      return out;
    },
  };
}
