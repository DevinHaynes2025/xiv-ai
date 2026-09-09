import { refuse } from '../civilization/errors';
import { requireMember, sha256, visibleTo, type EvidenceState } from './store';
import type { CodeIdentity, EvidenceActor, EvidenceManifest, EvidenceRecord } from './types';

// Section 39 — the CI evidence package.
//
// The directory list below is the shape of the package. Categories with nothing
// in them are still listed, because an empty security/ directory is information
// and an omitted one is not.

export const EVIDENCE_CATEGORIES = [
  'unit',
  'integration',
  'security',
  'rls',
  'tenant-isolation',
  'api',
  'web',
  'mobile',
  'runtime',
  'agents',
  'models',
  'dependencies',
  'secrets',
  'performance',
  'cost',
  'provenance',
  'backup-restore',
  'rollback',
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export type ManifestCounts = {
  testsExecuted: number;
  testsSkipped: number;
  passes: number;
  failures: number;
  warnings: number;
  exceptions: number;
};

// A skipped mandatory test is counted, named and carried into the manifest.
// Section 39's rule is that it must remain visible; the cheapest way to break
// that rule is to compute "executed" as "everything we have a row for", so
// skipped is subtracted here explicitly.
export function countRecords(records: readonly EvidenceRecord[]): ManifestCounts {
  const skipped = records.filter((r) => r.status === 'skipped' || r.status === 'blocked');
  return {
    testsExecuted: records.length - skipped.length,
    testsSkipped: skipped.length,
    passes: records.filter((r) => r.status === 'pass').length,
    failures: records.filter((r) => r.status === 'fail' || r.status === 'error').length,
    warnings: 0,
    exceptions: 0,
  };
}

export function skippedMandatory(records: readonly EvidenceRecord[]): EvidenceRecord[] {
  return records.filter((r) => r.mandatory && (r.status === 'skipped' || r.status === 'blocked'));
}

export type ManifestInput = {
  testRunId: string;
  code: CodeIdentity;
  environment: string;
  generatedBy: string;
  artifactHashes?: Record<string, string>;
  warnings?: number;
};

export function buildManifest(
  state: EvidenceState,
  actor: EvidenceActor,
  input: ManifestInput,
): EvidenceManifest {
  requireMember(state, actor);
  if (state.manifests.some((m) => m.testRunId === input.testRunId && m.universeId === actor.universeId)) {
    refuse('manifest_run_duplicate', input.testRunId);
  }

  const records = state.records.filter(
    (record) => record.universeId === actor.universeId && record.testRunId === input.testRunId,
  );
  const counts = countRecords(records);
  const exceptions = state.exceptions.filter(
    (exception) => exception.universeId === actor.universeId && !exception.revokedAt,
  ).length;

  const artifactHashes = {
    ...(input.artifactHashes ?? {}),
    ...Object.fromEntries(records.map((record) => [record.evidenceLocation, record.evidenceHash])),
  };

  const body = {
    testRunId: input.testRunId,
    code: input.code,
    environment: input.environment,
    ...counts,
    warnings: input.warnings ?? 0,
    exceptions,
    artifactHashes,
  };

  const manifest: EvidenceManifest = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    testRunId: input.testRunId,
    code: { ...input.code },
    environment: input.environment,
    ...counts,
    warnings: input.warnings ?? 0,
    exceptions,
    artifactHashes,
    // Hashing the manifest body makes the index itself tamper-evident, so an
    // edited count is detectable and not merely discouraged.
    manifestHash: sha256(JSON.stringify(body)),
    generatedBy: input.generatedBy,
    createdAt: state.clock(),
  };
  state.manifests.push(manifest);
  return manifest;
}

export function verifyManifestHash(manifest: EvidenceManifest): boolean {
  const body = {
    testRunId: manifest.testRunId,
    code: manifest.code,
    environment: manifest.environment,
    testsExecuted: manifest.testsExecuted,
    testsSkipped: manifest.testsSkipped,
    passes: manifest.passes,
    failures: manifest.failures,
    warnings: manifest.warnings,
    exceptions: manifest.exceptions,
    artifactHashes: manifest.artifactHashes,
  };
  return sha256(JSON.stringify(body)) === manifest.manifestHash;
}

export function listManifests(state: EvidenceState, actor: EvidenceActor): EvidenceManifest[] {
  return visibleTo(state, actor, state.manifests);
}
