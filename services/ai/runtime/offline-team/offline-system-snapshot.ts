import { createHash } from 'node:crypto';

export type ConsoleIdentity = Readonly<{ tenantId: string; universeId: string; requesterId: string }>;
export type InstalledModel = Readonly<{ name: string; sizeBytes: number }>;
export type ConsoleEvidence = Readonly<{
  identity: ConsoleIdentity;
  installedModels: readonly InstalledModel[] | null;
  pendingReviews: number | null;
}>;

const refused = () => { throw new Error('SYSTEM_SNAPSHOT_REFUSED'); };
const reference = (domain: string, value: string) => createHash('sha256').update(`xiv:${domain}:v1:${value}`, 'utf8').digest('hex');
const sensitiveIdentifier = /secret|token|password|bearer|credential|api-key|sk-|(?:sk|pk)_(?:test|live)_|gh[pousr]_|github_pat_|glpat-|npm_|xox[baprs]-|akia|asia|aiza/i;
function record(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) refused();
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) refused();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value as object).length !== keys.length ||
      keys.some(key => !descriptors[key] || !('value' in descriptors[key]))) refused();
}
function identity(value: unknown): ConsoleIdentity {
  record(value, ['tenantId', 'universeId', 'requesterId']);
  for (const key of ['tenantId', 'universeId', 'requesterId']) {
    if (typeof value[key] !== 'string' || !/^[a-z][a-z0-9-]{0,47}$/.test(value[key] as string) || sensitiveIdentifier.test(value[key] as string)) refused();
  }
  return Object.freeze({ tenantId: value.tenantId as string, universeId: value.universeId as string, requesterId: value.requesterId as string });
}
function count(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) refused();
  return value as number;
}

/** Match raw identifiers privately; references never confer authority. */
export function assertConsoleIdentity(expected: unknown, requested: unknown): void {
  const scope = identity(expected);
  const request = identity(requested);
  for (const key of ['tenantId', 'universeId', 'requesterId'] as const) {
    if (scope[key] !== request[key]) refused();
  }
}

/** Pure, bounded projection. No discovery, paths, environment, providers, or clock. */
export function buildSystemSnapshot(expected: unknown, requested: unknown, evidence: unknown) {
  const scope = identity(expected);
  const request = identity(requested);
  record(evidence, ['identity', 'installedModels', 'pendingReviews']);
  const owner = identity(evidence.identity);
  for (const key of ['tenantId', 'universeId', 'requesterId'] as const) {
    if (scope[key] !== request[key] || scope[key] !== owner[key]) refused();
  }
  let models: readonly Readonly<{ label: 'LOCAL_MODEL'; modelRef: string; sizeBytes: number }>[] | null = null;
  if (evidence.installedModels !== null) {
    if (!Array.isArray(evidence.installedModels) || evidence.installedModels.length > 32) refused();
    const input = evidence.installedModels as unknown[];
    // Reject holes, accessors and attached properties before iterating the bounded array.
    if (Reflect.ownKeys(input).length !== input.length + 1 || Array.from({ length: input.length }, (_, i) =>
      Object.getOwnPropertyDescriptor(input, String(i))).some(descriptor => !descriptor || !('value' in descriptor))) refused();
    const seen = new Set<string>();
    models = Object.freeze(Array.from(input, model => {
      record(model, ['name', 'sizeBytes']);
      // Defense-in-depth screening is not universal secret detection. Never return the input name.
      if (typeof model.name !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,63}$/.test(model.name) ||
          sensitiveIdentifier.test(model.name) || seen.has(model.name)) refused();
      seen.add(model.name as string);
      return Object.freeze({ label: 'LOCAL_MODEL' as const, modelRef: reference('model', model.name as string), sizeBytes: count(model.sizeBytes, 1_000_000_000_000) });
    }).sort((a, b) => a.modelRef < b.modelRef ? -1 : a.modelRef > b.modelRef ? 1 : 0));
  }
  const pendingReviews = evidence.pendingReviews === null ? null : count(evidence.pendingReviews, 2_000_000);
  const payload = Object.freeze({
    version: '12d-606-v1' as const, identity: Object.freeze({
      tenantRef: reference('tenant', scope.tenantId),
      universeRef: reference('universe', scope.universeId),
      requesterRef: reference('requester', scope.requesterId),
    }),
    mode: 'OFFLINE_ONLY' as const, ci: 'CI_UNVERIFIED' as const,
    readiness: models === null || pendingReviews === null ? 'EVIDENCE_UNAVAILABLE' as const :
      models.length === 0 ? 'NO_INSTALLED_MODELS' as const : 'METADATA_READY' as const,
    installedModels: models, pendingReviews,
  });
  const digest = createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
  return Object.freeze({ ...payload, receipt: Object.freeze({ algorithm: 'SHA-256' as const, digest, verification: 'SNAPSHOT_INTEGRITY_ONLY' as const }) });
}
export type SystemSnapshot = ReturnType<typeof buildSystemSnapshot>;
