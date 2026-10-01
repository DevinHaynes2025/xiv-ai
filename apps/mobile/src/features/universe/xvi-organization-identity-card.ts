export type XviOperatingMode = 'ONLINE_GOVERNED' | 'OFFLINE_GOVERNED' | 'LOCAL_ONLY';
export type XviOrganizationIdentityState = 'UNRESOLVED' | 'CANDIDATE' | 'RESOLVED' | 'CONFLICTED' | 'REVOKED';
export type XviOrganizationLifecycleState = 'ACTIVE' | 'INACTIVE' | 'DISSOLVED' | 'MERGED' | 'RESTRUCTURED' | 'UNKNOWN';
export type XviFreshnessState = 'FRESH' | 'AGING' | 'STALE';
export type XviAttentionRoute = 'UNIVERSE' | 'NEEDS_YOU';

export interface XviOrganizationIdentityCardInput {
  readonly organizationId: string;
  readonly canonicalName: string;
  readonly mode: XviOperatingMode;
  readonly identityState: XviOrganizationIdentityState;
  readonly lifecycleState: XviOrganizationLifecycleState;
  readonly identityKeyCount: number;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly requiresHumanReview: boolean;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviOrganizationIdentityCardPresentation {
  readonly schemaVersion: 'xvi-org-identity-card-v1';
  readonly organizationId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly modeLabel: string;
  readonly identityLabel: string;
  readonly lifecycleLabel: string;
  readonly evidenceLabel: string;
  readonly freshnessState: XviFreshnessState;
  readonly attentionRoute: XviAttentionRoute;
  readonly attentionLabel: string | null;
  readonly primaryAction: 'Open identity history';
  readonly secondaryAction: 'Ask XVI';
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
  readonly accessibilityLabel: string;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(['ONLINE_GOVERNED', 'OFFLINE_GOVERNED', 'LOCAL_ONLY']);
const IDENTITY = new Set<XviOrganizationIdentityState>(['UNRESOLVED', 'CANDIDATE', 'RESOLVED', 'CONFLICTED', 'REVOKED']);
const LIFECYCLE = new Set<XviOrganizationLifecycleState>(['ACTIVE', 'INACTIVE', 'DISSOLVED', 'MERGED', 'RESTRUCTURED', 'UNKNOWN']);
const INPUT_KEYS = [
  'organizationId','canonicalName','mode','identityState','lifecycleState','identityKeyCount',
  'supportingEvidenceCount','contradictingEvidenceCount','requiresHumanReview','observedAt',
  'safeReadOnly','executionAuthority','mutationAuthority','productionAuthority'
] as const;

function assertPlainObject(value: unknown): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) !== PLAIN) throw new Error('CARD_INPUT_PLAIN_OBJECT_REQUIRED');
  if (Object.getOwnPropertySymbols(value).length) throw new Error('CARD_INPUT_SYMBOLS_FORBIDDEN');
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) throw new Error('CARD_INPUT_ACCESSOR_FORBIDDEN');
  }
}

function assertExactKeys(value: Record<string, unknown>): void {
  const actual = Object.keys(value).sort();
  const expected = [...INPUT_KEYS].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new Error('CARD_INPUT_SCHEMA_MISMATCH');
}

function assertCount(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000) throw new Error(`${label}_INVALID`);
}

function assertIso(value: string): void {
  if (typeof value !== 'string' || !value.includes('T') || Number.isNaN(Date.parse(value))) throw new Error('OBSERVED_AT_INVALID');
}

function humanize(value: string): string {
  return value.toLowerCase().split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function validateOrganizationIdentityCardInput(input: unknown): Readonly<XviOrganizationIdentityCardInput> {
  assertPlainObject(input);
  assertExactKeys(input);
  const value = input as unknown as XviOrganizationIdentityCardInput;
  if (!/^org:/.test(value.organizationId) || !value.canonicalName?.trim() || value.canonicalName.length > 240) throw new Error('CARD_IDENTITY_INVALID');
  if (!MODES.has(value.mode)) throw new Error('CARD_MODE_INVALID');
  if (!IDENTITY.has(value.identityState) || !LIFECYCLE.has(value.lifecycleState)) throw new Error('CARD_STATE_INVALID');
  assertCount(value.identityKeyCount, 'IDENTITY_KEY_COUNT');
  assertCount(value.supportingEvidenceCount, 'SUPPORTING_EVIDENCE_COUNT');
  assertCount(value.contradictingEvidenceCount, 'CONTRADICTING_EVIDENCE_COUNT');
  if (typeof value.requiresHumanReview !== 'boolean') throw new Error('HUMAN_REVIEW_FLAG_INVALID');
  assertIso(value.observedAt);
  if (value.safeReadOnly !== true || value.executionAuthority !== false || value.mutationAuthority !== false || value.productionAuthority !== false) throw new Error('CARD_AUTHORITY_VIOLATION');
  if (value.identityState === 'RESOLVED' && value.contradictingEvidenceCount > 0) throw new Error('RESOLVED_WITH_CONTRADICTION_INVALID');
  if (value.identityState === 'RESOLVED' && value.identityKeyCount < 1) throw new Error('RESOLVED_WITHOUT_IDENTITY_KEY_INVALID');
  if (value.identityState === 'CONFLICTED' && value.contradictingEvidenceCount < 1) throw new Error('CONFLICTED_WITHOUT_CONTRADICTION_INVALID');
  if ((value.identityState === 'CONFLICTED' || value.identityState === 'REVOKED') && value.requiresHumanReview !== true) throw new Error('ATTENTION_STATE_REQUIRES_HUMAN_REVIEW');
  return Object.freeze({ ...value });
}

export function presentOrganizationIdentityCard(
  input: unknown,
  now: string,
  agingAfterMs = 24 * 60 * 60 * 1000,
  staleAfterMs = 7 * 24 * 60 * 60 * 1000,
): Readonly<XviOrganizationIdentityCardPresentation> {
  const value = validateOrganizationIdentityCardInput(input);
  assertIso(now);
  if (!Number.isSafeInteger(agingAfterMs) || !Number.isSafeInteger(staleAfterMs) || agingAfterMs < 60_000 || staleAfterMs <= agingAfterMs || staleAfterMs > 90 * 24 * 60 * 60 * 1000) throw new Error('FRESHNESS_POLICY_INVALID');
  const ageMs = Date.parse(now) - Date.parse(value.observedAt);
  if (ageMs < 0) throw new Error('OBSERVATION_FROM_FUTURE');
  const freshnessState: XviFreshnessState = ageMs > staleAfterMs ? 'STALE' : ageMs > agingAfterMs ? 'AGING' : 'FRESH';
  const needsAttention = value.requiresHumanReview || value.identityState === 'CONFLICTED' || value.identityState === 'REVOKED' || freshnessState === 'STALE';
  const attentionLabel = needsAttention
    ? value.identityState === 'CONFLICTED'
      ? 'Identity conflict needs review'
      : value.identityState === 'REVOKED'
        ? 'Identity was revoked; review required'
        : freshnessState === 'STALE'
          ? 'Identity evidence is stale; refresh review required'
          : 'Human review required'
    : null;
  const evidenceLabel = `${value.supportingEvidenceCount} supporting · ${value.contradictingEvidenceCount} contradicting`;
  const identityLabel = humanize(value.identityState);
  const lifecycleLabel = humanize(value.lifecycleState);
  const modeLabel = humanize(value.mode);
  return Object.freeze({
    schemaVersion: 'xvi-org-identity-card-v1',
    organizationId: value.organizationId,
    title: value.canonicalName,
    subtitle: `${identityLabel} identity · ${lifecycleLabel}`,
    modeLabel,
    identityLabel,
    lifecycleLabel,
    evidenceLabel,
    freshnessState,
    attentionRoute: needsAttention ? 'NEEDS_YOU' : 'UNIVERSE',
    attentionLabel,
    primaryAction: 'Open identity history',
    secondaryAction: 'Ask XVI',
    safeReadOnly: true,
    canMutate: false,
    canClaimExecution: false,
    accessibilityLabel: `${value.canonicalName}. Identity ${identityLabel}. Lifecycle ${lifecycleLabel}. Evidence ${evidenceLabel}. Freshness ${humanize(freshnessState)}. ${attentionLabel ?? 'No identity review required.'} Read-only.`
  });
}
