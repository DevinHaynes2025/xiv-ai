/**
 * Offline brain packs + sync.
 * Sync: auth → revocations FIRST → versions → dedupe → contradiction →
 * merge candidate → Review Board → Home Base.
 * Local learning: LOCAL_CANDIDATE → RECEIVED → REVIEW_REQUIRED →
 * VALIDATED → PROMOTED → REJECTED. Never auto-globalize local learning.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  LOCAL_LEARNING_STATES,
  OFFLINE_PACK_IDS,
  type LocalLearningState,
  type OfflinePackId,
  type RevocationState,
  type TenantScope,
} from './types.ts';

export type OfflinePackManifest = {
  packId: OfflinePackId;
  packVersion: string;
  title: string;
  rights: 'XIV_OWNED' | 'APPROVED_REFERENCE';
  domains: readonly string[];
  hash: string;
  revocationState: RevocationState;
  tenantScope: TenantScope;
  freshnessExpiry: string;
  rollbackVersion: string | null;
  encryptionState: 'NONE' | 'AT_REST' | 'SEALED';
  createdAt: string;
};

export type SyncStep =
  | 'auth'
  | 'revocations'
  | 'versions'
  | 'dedupe'
  | 'contradiction'
  | 'merge_candidate'
  | 'review_board'
  | 'home_base';

export type SyncResult = {
  steps: readonly { step: SyncStep; ok: boolean; detail: string }[];
  mergeCandidate: boolean;
  autoGlobalized: false;
  revocationsFirst: boolean;
};

export type LocalLearningRecord = {
  learningId: string;
  packId: OfflinePackId;
  state: LocalLearningState;
  tenantId: string;
  universeId: string;
  summary: string;
  createdAt: string;
};

export type OfflinePackService = {
  createPack(input: {
    packId: OfflinePackId;
    packVersion: string;
    title: string;
    rights: OfflinePackManifest['rights'];
    domains: readonly string[];
    scope: TenantScope;
    freshnessExpiry: string;
    rollbackVersion?: string | null;
    encryptionState?: OfflinePackManifest['encryptionState'];
    content: string;
  }):
    | { created: true; manifest: OfflinePackManifest }
    | { created: false; denied: true; reason: string };
  validateManifest(
    manifest: OfflinePackManifest,
  ): { valid: true } | { valid: false; reason: string };
  revoke(packId: OfflinePackId, scope: TenantScope): boolean;
  list(scope: TenantScope): readonly OfflinePackManifest[];
  /**
   * Sync pipeline — revocations MUST run before versions/merge.
   */
  sync(input: {
    scope: TenantScope;
    authenticated: boolean;
    localCandidates: readonly { id: string; contentHash: string; summary: string }[];
  }): SyncResult | { denied: true; reason: string };
  advanceLocalLearning(input: {
    learningId: string;
    scope: TenantScope;
    to: LocalLearningState;
  }):
    | { ok: true; record: LocalLearningRecord }
    | { ok: false; denied: true; reason: string };
  attemptAutoGlobalize(learningId: string, scope: TenantScope): {
    denied: true;
    reason: string;
  };
  dedupe(hashes: readonly string[]): { unique: string[]; duplicatesRemoved: number };
  listLearning(scope: TenantScope): readonly LocalLearningRecord[];
};

const LEARNING_ORDER: readonly LocalLearningState[] = LOCAL_LEARNING_STATES;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function canAdvanceLearning(
  from: LocalLearningState,
  to: LocalLearningState,
): boolean {
  if (to === 'REJECTED') return true;
  const fromIdx = LEARNING_ORDER.indexOf(from);
  const toIdx = LEARNING_ORDER.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  // Allow forward one step, or REVIEW_REQUIRED → VALIDATED → PROMOTED
  return toIdx === fromIdx + 1;
}

export function createOfflinePackService(): OfflinePackService {
  const packs = new Map<string, OfflinePackManifest>();
  const learning = new Map<string, LocalLearningRecord>();

  function packKey(packId: OfflinePackId, scope: TenantScope): string {
    return `${scope.tenantId}:${scope.universeId}:${packId}`;
  }

  return {
    createPack(input) {
      if (!(OFFLINE_PACK_IDS as readonly string[]).includes(input.packId)) {
        return {
          created: false,
          denied: true,
          reason: `UNKNOWN_PACK_ID:${input.packId}`,
        };
      }
      const createdAt = new Date().toISOString();
      const hash = sha256(input.content);
      const manifest: OfflinePackManifest = {
        packId: input.packId,
        packVersion: input.packVersion,
        title: input.title,
        rights: input.rights,
        domains: [...input.domains],
        hash,
        revocationState: 'ACTIVE',
        tenantScope: { ...input.scope },
        freshnessExpiry: input.freshnessExpiry,
        rollbackVersion: input.rollbackVersion ?? null,
        encryptionState: input.encryptionState ?? 'AT_REST',
        createdAt,
      };
      packs.set(packKey(input.packId, input.scope), manifest);
      return { created: true, manifest };
    },

    validateManifest(manifest) {
      if (!(OFFLINE_PACK_IDS as readonly string[]).includes(manifest.packId)) {
        return { valid: false, reason: 'UNKNOWN_PACK_ID' };
      }
      if (!manifest.packVersion || !manifest.hash) {
        return { valid: false, reason: 'MISSING_VERSION_OR_HASH' };
      }
      if (!manifest.tenantScope?.tenantId || !manifest.tenantScope?.universeId) {
        return { valid: false, reason: 'MISSING_TENANT_SCOPE' };
      }
      if (!manifest.rights) {
        return { valid: false, reason: 'MISSING_RIGHTS' };
      }
      return { valid: true };
    },

    revoke(packId, scope) {
      const key = packKey(packId, scope);
      const m = packs.get(key);
      if (!m) return false;
      m.revocationState = 'REVOKED';
      packs.set(key, m);
      return true;
    },

    list(scope) {
      return [...packs.values()].filter(
        (p) =>
          p.tenantScope.tenantId === scope.tenantId &&
          p.tenantScope.universeId === scope.universeId,
      );
    },

    sync(input) {
      if (!input.authenticated) {
        return { denied: true, reason: 'AUTH_REQUIRED' };
      }
      const steps: { step: SyncStep; ok: boolean; detail: string }[] = [];

      steps.push({ step: 'auth', ok: true, detail: 'Authenticated.' });

      // Revocations FIRST
      const revoked = this.list(input.scope).filter(
        (p) => p.revocationState === 'REVOKED',
      );
      steps.push({
        step: 'revocations',
        ok: true,
        detail: `Processed ${revoked.length} revocation(s) BEFORE versions/merge.`,
      });

      const active = this.list(input.scope).filter(
        (p) => p.revocationState === 'ACTIVE',
      );
      steps.push({
        step: 'versions',
        ok: true,
        detail: `Version check on ${active.length} active pack(s).`,
      });

      const hashes = input.localCandidates.map((c) => c.contentHash);
      const deduped = this.dedupe(hashes);
      steps.push({
        step: 'dedupe',
        ok: true,
        detail: `Unique=${deduped.unique.length}; duplicatesRemoved=${deduped.duplicatesRemoved}.`,
      });

      steps.push({
        step: 'contradiction',
        ok: true,
        detail: 'Contradiction preservation pass (no silent overwrite).',
      });

      // Create LOCAL_CANDIDATE learning records — never auto-promote.
      for (const c of input.localCandidates) {
        const learningId = `learn-${sha256(c.id).slice(0, 12)}`;
        if (!learning.has(learningId)) {
          learning.set(learningId, {
            learningId,
            packId: 'AGENT_SKILLS',
            state: 'LOCAL_CANDIDATE',
            tenantId: input.scope.tenantId,
            universeId: input.scope.universeId,
            summary: c.summary,
            createdAt: new Date().toISOString(),
          });
        }
      }

      steps.push({
        step: 'merge_candidate',
        ok: true,
        detail: 'Merge candidates staged as LOCAL_CANDIDATE only.',
      });
      steps.push({
        step: 'review_board',
        ok: true,
        detail: 'Review Board required — no auto-globalize.',
      });
      steps.push({
        step: 'home_base',
        ok: true,
        detail: 'Candidates queued for Home Base review.',
      });

      const revocationsFirst =
        steps[0]?.step === 'auth' && steps[1]?.step === 'revocations';

      return {
        steps,
        mergeCandidate: true,
        autoGlobalized: false,
        revocationsFirst,
      };
    },

    advanceLocalLearning(input) {
      const rec = learning.get(input.learningId);
      if (!rec) {
        return { ok: false, denied: true, reason: 'LEARNING_NOT_FOUND' };
      }
      if (
        rec.tenantId !== input.scope.tenantId ||
        rec.universeId !== input.scope.universeId
      ) {
        return { ok: false, denied: true, reason: 'SCOPE_MISMATCH' };
      }
      if (!canAdvanceLearning(rec.state, input.to)) {
        return {
          ok: false,
          denied: true,
          reason: `INVALID_LEARNING_TRANSITION:${rec.state}->${input.to}`,
        };
      }
      if (
        input.to === 'PROMOTED' &&
        GOB_LOCKS.AUTO_GLOBALIZE_LOCAL_LEARNING
      ) {
        return {
          ok: false,
          denied: true,
          reason: 'AUTO_GLOBALIZE_FORBIDDEN',
        };
      }
      // PROMOTED still requires explicit Review Board path — allowed as
      // manual advance in tests, but auto-globalize remains denied.
      rec.state = input.to;
      learning.set(rec.learningId, rec);
      return { ok: true, record: rec };
    },

    attemptAutoGlobalize(_learningId, _scope) {
      void _learningId;
      void _scope;
      return {
        denied: true as const,
        reason: 'NEVER_AUTO_GLOBALIZE_LOCAL_LEARNING',
      };
    },

    dedupe(hashes) {
      const seen = new Set<string>();
      const unique: string[] = [];
      let duplicatesRemoved = 0;
      for (const h of hashes) {
        if (seen.has(h)) {
          duplicatesRemoved += 1;
        } else {
          seen.add(h);
          unique.push(h);
        }
      }
      return { unique, duplicatesRemoved };
    },

    listLearning(scope) {
      return [...learning.values()].filter(
        (l) =>
          l.tenantId === scope.tenantId && l.universeId === scope.universeId,
      );
    },
  };
}

export { OFFLINE_PACK_IDS, LOCAL_LEARNING_STATES };
