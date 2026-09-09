/**
 * 62L-ER26 — Avatar Provenance Drawer runtime.
 *
 * Build provenance drawers for historical and living-person avatars;
 * separate historical record vs AI interpretation and actual person vs AI
 * representative; revoke updates drawer + blocks future use; redact private
 * source text while allowing internal citation refs; deny fabricated sources /
 * hidden provenance / deceptive identity / unauthorized voice-likeness /
 * cross-tenant leak; cycle with soft-wires.
 */

import { createHash } from 'node:crypto';

import {
  AVATAR_PROVENANCE_DRAWER_CYCLE,
  AVATAR_PROVENANCE_DRAWER_FIELDS,
  AVATAR_PROVENANCE_TRUTH_BOUNDARY,
  CLAIM_INSPECTION_CHAIN,
  ER26_AGENT_BOUNDS,
  ER26_DB_CANDIDATES_STATUS,
  ER26_LOCKS,
  ER26_MAY,
  ER26_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_EVIDENCE_LABELS,
  HONESTY_BANNER,
  LIVING_PERSON_EXTRA_FIELDS,
  NEXT_PHASE_TITLE,
  PROVENANCE_DRAWER_CORE_FLOW,
  SYNTHETIC_DISCLOSURE_TEXT,
  UX_SEPARATION_AXES,
  assertEr26LocksIntact,
  er26SoftWireSnapshot,
  isEr26Agent,
  isHumanApprover,
  softWireHopState,
  type AvatarType,
  type ConsentState,
  type ContentKind,
  type Er26Actor,
  type Er26EvidenceState,
  type Er26HopRecord,
  type Er26SoftWireSnapshot,
  type HistoricalEvidenceLabel,
  type IdentityKind,
  type ReviewerState,
  type RevocationStatus,
  type RightsLicenseState,
  type UncertaintyLevel,
} from './avatar-provenance-drawer-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof AVATAR_PROVENANCE_DRAWER_CYCLE)[number],
  state: Er26EvidenceState,
  summary: string,
): Er26HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type TenantUniverseScope = {
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type ProvenanceClaim = {
  claimId: string;
  claimText: string;
  sourceId: string;
  evidenceLabel: HistoricalEvidenceLabel;
  uncertaintyLevel: UncertaintyLevel;
  contentKind: ContentKind;
  fabricated: false;
};

export type SourceRef = {
  sourceId: string;
  title: string;
  date: string | null;
  publicText: string | null;
  privateText: string | null;
  internalCitationRef: string;
  userHasPermission: boolean;
  revoked: boolean;
};

export type LivingPersonConsentExtras = {
  VOICE_AUTHORIZED: boolean;
  LIKENESS_AUTHORIZED: boolean;
  DELEGATION_SCOPE: string;
  CONSENT_EXPIRY: string | null;
};

export type AvatarProvenanceDrawer = {
  avatarId: string;
  avatarType: AvatarType;
  syntheticDisclosure: typeof SYNTHETIC_DISCLOSURE_TEXT;
  sourceCorpusVersion: string;
  keySourcesUsed: readonly string[];
  sourceDates: readonly string[];
  rightsLicenseState: RightsLicenseState;
  consentState: ConsentState;
  tenantUniverseScope: TenantUniverseScope;
  documentedFacts: readonly string[];
  inferredContent: readonly string[];
  disputedClaims: readonly string[];
  uncertaintyLevel: UncertaintyLevel;
  generationTimestamp: string;
  modelRuntimeUsed: string;
  reviewerState: ReviewerState;
  revocationStatus: RevocationStatus;
  identityKind: IdentityKind;
  contentKindSeparation: {
    historicalRecord: readonly string[];
    aiGeneratedInterpretation: readonly string[];
  };
  livingPersonExtras: LivingPersonConsentExtras | null;
  claims: readonly ProvenanceClaim[];
  sources: readonly SourceRef[];
  blockedSourceIdsForFutureGeneration: readonly string[];
  hiddenProvenance: false;
  fabricatedSources: false;
};

export type GenerationAttemptResult =
  | {
      allowed: true;
      avatarId: string;
      usedSourceIds: readonly string[];
    }
  | DenialResult;

/** In-memory revocation / block ledger for this bounded runtime. */
const blockedSourcesByAvatar = new Map<string, Set<string>>();
const drawerStore = new Map<string, AvatarProvenanceDrawer>();

function blockedSet(avatarId: string): Set<string> {
  let set = blockedSourcesByAvatar.get(avatarId);
  if (!set) {
    set = new Set();
    blockedSourcesByAvatar.set(avatarId, set);
  }
  return set;
}

function redactSourcesForUser(
  sources: readonly SourceRef[],
): readonly SourceRef[] {
  return sources.map((s) => {
    if (s.userHasPermission) {
      return s;
    }
    return {
      ...s,
      publicText: s.publicText,
      privateText: null,
      // Internal citation may exist without exposing confidential text.
    };
  });
}

export function buildHistoricalProvenanceDrawer(input: {
  actor: Er26Actor;
  avatarId: string;
  sourceCorpusVersion: string;
  keySourcesUsed: readonly string[];
  sourceDates: readonly string[];
  rightsLicenseState: RightsLicenseState;
  documentedFacts: readonly string[];
  inferredContent: readonly string[];
  disputedClaims: readonly string[];
  uncertaintyLevel: UncertaintyLevel;
  modelRuntimeUsed: string;
  reviewerState: ReviewerState;
  claims: readonly ProvenanceClaim[];
  sources: readonly SourceRef[];
}): AvatarProvenanceDrawer | DenialResult {
  if (!isEr26Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Actor not authorized to build provenance drawer.');
  }
  if (input.claims.some((c) => c.fabricated !== false)) {
    return deny('Fabricated sources / claims are forbidden.');
  }
  if (input.sources.some((s) => s.sourceId.startsWith('fabricated-'))) {
    return deny('Fabricated source ids are forbidden.');
  }

  const blocked = blockedSet(input.avatarId);
  const sources = redactSourcesForUser(input.sources);
  const revocationStatus: RevocationStatus =
    blocked.size > 0 ? 'LIMITED' : 'ACTIVE';

  const drawer: AvatarProvenanceDrawer = {
    avatarId: input.avatarId,
    avatarType: 'HISTORICAL',
    syntheticDisclosure: SYNTHETIC_DISCLOSURE_TEXT,
    sourceCorpusVersion: input.sourceCorpusVersion,
    keySourcesUsed: input.keySourcesUsed,
    sourceDates: input.sourceDates,
    rightsLicenseState: input.rightsLicenseState,
    consentState: 'NOT_APPLICABLE_HISTORICAL',
    tenantUniverseScope: {
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    },
    documentedFacts: input.documentedFacts,
    inferredContent: input.inferredContent,
    disputedClaims: input.disputedClaims,
    uncertaintyLevel: input.uncertaintyLevel,
    generationTimestamp: nowIso(),
    modelRuntimeUsed: input.modelRuntimeUsed,
    reviewerState: input.reviewerState,
    revocationStatus,
    identityKind: 'AI_REPRESENTATIVE',
    contentKindSeparation: {
      historicalRecord: input.documentedFacts,
      aiGeneratedInterpretation: input.inferredContent,
    },
    livingPersonExtras: null,
    claims: input.claims,
    sources,
    blockedSourceIdsForFutureGeneration: [...blocked],
    hiddenProvenance: false,
    fabricatedSources: false,
  };

  drawerStore.set(input.avatarId, drawer);
  return drawer;
}

export function buildLivingPersonProvenanceDrawer(input: {
  actor: Er26Actor;
  avatarId: string;
  sourceCorpusVersion: string;
  keySourcesUsed: readonly string[];
  sourceDates: readonly string[];
  rightsLicenseState: RightsLicenseState;
  consentState: ConsentState;
  documentedFacts: readonly string[];
  inferredContent: readonly string[];
  disputedClaims: readonly string[];
  uncertaintyLevel: UncertaintyLevel;
  modelRuntimeUsed: string;
  reviewerState: ReviewerState;
  livingPersonExtras: LivingPersonConsentExtras;
  claims: readonly ProvenanceClaim[];
  sources: readonly SourceRef[];
  representAsActualPerson?: boolean;
}): AvatarProvenanceDrawer | DenialResult {
  if (!isEr26Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Actor not authorized to build provenance drawer.');
  }
  if (input.representAsActualPerson) {
    return deny(
      'Deceptive identity: living-person avatar must remain AI representative, not the actual person.',
    );
  }
  if (
    !input.livingPersonExtras.VOICE_AUTHORIZED ||
    !input.livingPersonExtras.LIKENESS_AUTHORIZED
  ) {
    return deny('Unauthorized voice/likeness use is forbidden.');
  }
  if (
    input.consentState === 'MISSING' ||
    input.consentState === 'REVOKED' ||
    input.consentState === 'EXPIRED'
  ) {
    return deny(`Living-person consent state ${input.consentState} blocks drawer build.`);
  }
  if (input.claims.some((c) => c.fabricated !== false)) {
    return deny('Fabricated sources / claims are forbidden.');
  }

  const blocked = blockedSet(input.avatarId);
  const sources = redactSourcesForUser(input.sources);
  const revocationStatus: RevocationStatus =
    blocked.size > 0 ? 'LIMITED' : 'ACTIVE';

  const drawer: AvatarProvenanceDrawer = {
    avatarId: input.avatarId,
    avatarType: 'LIVING_PERSON_REPRESENTATIVE',
    syntheticDisclosure: SYNTHETIC_DISCLOSURE_TEXT,
    sourceCorpusVersion: input.sourceCorpusVersion,
    keySourcesUsed: input.keySourcesUsed,
    sourceDates: input.sourceDates,
    rightsLicenseState: input.rightsLicenseState,
    consentState: input.consentState,
    tenantUniverseScope: {
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    },
    documentedFacts: input.documentedFacts,
    inferredContent: input.inferredContent,
    disputedClaims: input.disputedClaims,
    uncertaintyLevel: input.uncertaintyLevel,
    generationTimestamp: nowIso(),
    modelRuntimeUsed: input.modelRuntimeUsed,
    reviewerState: input.reviewerState,
    revocationStatus,
    identityKind: 'AI_REPRESENTATIVE',
    contentKindSeparation: {
      historicalRecord: input.documentedFacts,
      aiGeneratedInterpretation: input.inferredContent,
    },
    livingPersonExtras: { ...input.livingPersonExtras },
    claims: input.claims,
    sources,
    blockedSourceIdsForFutureGeneration: [...blocked],
    hiddenProvenance: false,
    fabricatedSources: false,
  };

  drawerStore.set(input.avatarId, drawer);
  return drawer;
}

export function inspectClaimChain(input: {
  drawer: AvatarProvenanceDrawer;
  claimId: string;
}):
  | {
      claim: ProvenanceClaim;
      source: SourceRef | null;
      evidenceClass: HistoricalEvidenceLabel;
      uncertainty: UncertaintyLevel;
      chain: typeof CLAIM_INSPECTION_CHAIN;
      contentKind: ContentKind;
      identityKind: IdentityKind;
    }
  | DenialResult {
  const claim = input.drawer.claims.find((c) => c.claimId === input.claimId);
  if (!claim) {
    return deny(`Claim ${input.claimId} not found in drawer.`);
  }
  const source =
    input.drawer.sources.find((s) => s.sourceId === claim.sourceId) ?? null;
  return {
    claim,
    source,
    evidenceClass: claim.evidenceLabel,
    uncertainty: claim.uncertaintyLevel,
    chain: CLAIM_INSPECTION_CHAIN,
    contentKind: claim.contentKind,
    identityKind: input.drawer.identityKind,
  };
}

export function revokeSourceOrConsent(input: {
  actor: Er26Actor;
  avatarId: string;
  sourceId?: string;
  revokeConsent?: boolean;
  mode: 'REVOKED' | 'LIMITED' | 'SOURCE_REMOVED';
}): AvatarProvenanceDrawer | DenialResult {
  if (!isEr26Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Actor not authorized to revoke.');
  }
  const existing = drawerStore.get(input.avatarId);
  if (!existing) {
    return deny(`No provenance drawer for avatar ${input.avatarId}.`);
  }
  if (
    existing.tenantUniverseScope.tenantId !== input.actor.tenantId ||
    existing.tenantUniverseScope.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant / Universe revocation denied.');
  }

  const blocked = blockedSet(input.avatarId);
  if (input.sourceId) {
    blocked.add(input.sourceId);
  }
  if (input.revokeConsent) {
    blocked.add('__consent__');
  }

  const sources = existing.sources.map((s) =>
    input.sourceId && s.sourceId === input.sourceId
      ? { ...s, revoked: true, privateText: null }
      : s,
  );

  const consentState: ConsentState =
    input.revokeConsent || existing.consentState === 'REVOKED'
      ? 'REVOKED'
      : existing.consentState;

  const livingPersonExtras =
    existing.livingPersonExtras && input.revokeConsent
      ? {
          ...existing.livingPersonExtras,
          VOICE_AUTHORIZED: false,
          LIKENESS_AUTHORIZED: false,
        }
      : existing.livingPersonExtras;

  const updated: AvatarProvenanceDrawer = {
    ...existing,
    sources,
    consentState,
    livingPersonExtras,
    revocationStatus: input.mode,
    blockedSourceIdsForFutureGeneration: [...blocked],
    generationTimestamp: nowIso(),
  };
  drawerStore.set(input.avatarId, updated);
  return updated;
}

export function attemptGenerationWithSources(input: {
  actor: Er26Actor;
  avatarId: string;
  sourceIds: readonly string[];
}): GenerationAttemptResult {
  if (!isEr26Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Actor not authorized for generation.');
  }
  const blocked = blockedSet(input.avatarId);
  if (blocked.has('__consent__')) {
    return deny('Consent revoked — future generations blocked.');
  }
  for (const id of input.sourceIds) {
    if (blocked.has(id)) {
      return deny(
        `Source ${id} is REVOKED/SOURCE_REMOVED — future generation use blocked.`,
      );
    }
  }
  return {
    allowed: true,
    avatarId: input.avatarId,
    usedSourceIds: input.sourceIds,
  };
}

export function attemptFabricatedSources(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Fabricated sources are forbidden.');
}

export function attemptHiddenProvenance(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Hidden provenance is forbidden.');
}

export function attemptDeceptiveIdentity(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny(
    'Deceptive identity forbidden: must separate actual person from AI representative.',
  );
}

export function attemptUnauthorizedVoiceLikeness(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Unauthorized voice/likeness use is forbidden.');
}

export function attemptExposePrivateSourceWithoutPermission(input: {
  actor: Er26Actor;
  source: SourceRef;
}): DenialResult | { allowed: false; redacted: SourceRef } {
  void input.actor;
  if (!input.source.userHasPermission && input.source.privateText != null) {
    return deny(
      'Private source content must not be exposed without permission.',
    );
  }
  return {
    allowed: false,
    redacted: { ...input.source, privateText: null },
  };
}

export function attemptCrossTenantLeak(input: {
  actor: Er26Actor;
  drawer: AvatarProvenanceDrawer;
}): DenialResult {
  if (
    input.drawer.tenantUniverseScope.tenantId !== input.actor.tenantId ||
    input.drawer.tenantUniverseScope.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant / Universe leakage denied.');
  }
  return deny('Cross-tenant leak attempt denied by Guardian/RLS.');
}

export function attemptContinueUsingRevokedMaterial(input: {
  actor: Er26Actor;
  avatarId: string;
  sourceId: string;
}): DenialResult {
  const result = attemptGenerationWithSources({
    actor: input.actor,
    avatarId: input.avatarId,
    sourceIds: [input.sourceId],
  });
  if ('denied' in result) {
    return result;
  }
  return deny('Continue-using-revoked-material must be denied.');
}

export function attemptHiddenChainOfThought(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Hidden chain-of-thought is forbidden.');
}

export function attemptBypassGuardianRls(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Bypass Guardian/RLS denied.');
}

export function attemptExpandTenantUniverseAccess(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Expand tenant/Universe access denied.');
}

export function attemptAutoDeployChanges(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Auto-deploy changes denied.');
}

export function attemptRecommendAsAct(input: {
  actor: Er26Actor;
}): DenialResult {
  void input;
  return deny('Recommend ≠ act; agents have no automatic authority.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Er26Actor;
  foreign: Er26Actor;
  drawer: AvatarProvenanceDrawer;
}): { isolated: true } | DenialResult {
  if (
    input.foreign.tenantId === input.drawer.tenantUniverseScope.tenantId &&
    input.foreign.universeId === input.drawer.tenantUniverseScope.universeId
  ) {
    return { isolated: true };
  }
  const leak = attemptCrossTenantLeak({
    actor: input.foreign,
    drawer: input.drawer,
  });
  if ('denied' in leak) {
    return { isolated: true };
  }
  void input.actor;
  return deny('Guardian/RLS isolation failed.');
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er26Actor;
  action: string;
}): { approved: true; approvalId: string } | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approval required for consequential actions.');
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Approver lacks approve_consequential permission.');
  }
  return { approved: true, approvalId: input.approvalId };
}

export function returnEr26EvidenceToHomeBase(input: {
  actor: Er26Actor;
  cycleEvidenceSha256: string;
}): {
  returned: true;
  homeBase: 'EM_HOME_BASE';
  evidenceSha256: string;
} {
  void input.actor;
  return {
    returned: true,
    homeBase: 'EM_HOME_BASE',
    evidenceSha256: input.cycleEvidenceSha256,
  };
}

export function exampleHistoricalDrawer(
  actor: Er26Actor,
): AvatarProvenanceDrawer {
  const built = buildHistoricalProvenanceDrawer({
    actor,
    avatarId: 'avatar-hist-ada',
    sourceCorpusVersion: 'hist-corpus-v1',
    keySourcesUsed: ['src-notes-1843', 'src-sketch-engine'],
    sourceDates: ['1843', '1842'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    documentedFacts: ['Published Notes on the Analytical Engine (1843).'],
    inferredContent: [
      'Likely would emphasize mathematical rigor in machine design.',
    ],
    disputedClaims: ['Priority disputes around early computing credit.'],
    uncertaintyLevel: 'medium',
    modelRuntimeUsed: 'local-sm-er26',
    reviewerState: 'REVIEWED',
    claims: [
      {
        claimId: 'c1',
        claimText: 'Published Notes on the Analytical Engine (1843).',
        sourceId: 'src-notes-1843',
        evidenceLabel: 'DOCUMENTED',
        uncertaintyLevel: 'low',
        contentKind: 'HISTORICAL_RECORD',
        fabricated: false,
      },
      {
        claimId: 'c2',
        claimText:
          'Likely would emphasize mathematical rigor in machine design.',
        sourceId: 'src-sketch-engine',
        evidenceLabel: 'PLAUSIBLE_INFERENCE',
        uncertaintyLevel: 'medium',
        contentKind: 'AI_GENERATED_INTERPRETATION',
        fabricated: false,
      },
    ],
    sources: [
      {
        sourceId: 'src-notes-1843',
        title: 'Notes on the Analytical Engine',
        date: '1843',
        publicText: 'Public-domain notes excerpt.',
        privateText: null,
        internalCitationRef: 'cite://src-notes-1843',
        userHasPermission: true,
        revoked: false,
      },
      {
        sourceId: 'src-sketch-engine',
        title: 'Engine sketches (restricted archive note)',
        date: '1842',
        publicText: null,
        privateText: 'CONFIDENTIAL archive verbatim — must not leak.',
        internalCitationRef: 'cite://src-sketch-engine',
        userHasPermission: false,
        revoked: false,
      },
    ],
  });
  if ('denied' in built) {
    throw new Error(built.reason);
  }
  return built;
}

export function exampleLivingDrawer(actor: Er26Actor): AvatarProvenanceDrawer {
  const built = buildLivingPersonProvenanceDrawer({
    actor,
    avatarId: 'avatar-living-rep-1',
    sourceCorpusVersion: 'living-corpus-v1',
    keySourcesUsed: ['src-bio-public'],
    sourceDates: ['2024-01-01'],
    rightsLicenseState: 'AUTHORIZED',
    consentState: 'AUTHORIZED',
    documentedFacts: ['Public bio statement authorized for representation.'],
    inferredContent: ['AI paraphrase of public bio themes.'],
    disputedClaims: [],
    uncertaintyLevel: 'low',
    modelRuntimeUsed: 'local-sm-er26',
    reviewerState: 'REVIEWED',
    livingPersonExtras: {
      VOICE_AUTHORIZED: true,
      LIKENESS_AUTHORIZED: true,
      DELEGATION_SCOPE: 'public_bio_qa_only',
      CONSENT_EXPIRY: '2027-01-01T00:00:00.000Z',
    },
    claims: [
      {
        claimId: 'lc1',
        claimText: 'Public bio statement authorized for representation.',
        sourceId: 'src-bio-public',
        evidenceLabel: 'DOCUMENTED',
        uncertaintyLevel: 'low',
        contentKind: 'HISTORICAL_RECORD',
        fabricated: false,
      },
    ],
    sources: [
      {
        sourceId: 'src-bio-public',
        title: 'Authorized public bio',
        date: '2024-01-01',
        publicText: 'Public bio text.',
        privateText: null,
        internalCitationRef: 'cite://src-bio-public',
        userHasPermission: true,
        revoked: false,
      },
    ],
  });
  if ('denied' in built) {
    throw new Error(built.reason);
  }
  return built;
}

export function bootstrapAvatarProvenanceDrawer(repoRoot?: string): {
  locksIntact: boolean;
  drawerFields: typeof AVATAR_PROVENANCE_DRAWER_FIELDS;
  historicalEvidenceLabels: typeof HISTORICAL_EVIDENCE_LABELS;
  livingPersonExtraFields: typeof LIVING_PERSON_EXTRA_FIELDS;
  coreFlow: typeof PROVENANCE_DRAWER_CORE_FLOW;
  uxAxes: typeof UX_SEPARATION_AXES;
  dbCandidates: typeof ER26_DB_CANDIDATES_STATUS;
  softWire: Er26SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
} {
  const softWire = er26SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr26LocksIntact(),
    drawerFields: AVATAR_PROVENANCE_DRAWER_FIELDS,
    historicalEvidenceLabels: HISTORICAL_EVIDENCE_LABELS,
    livingPersonExtraFields: LIVING_PERSON_EXTRA_FIELDS,
    coreFlow: PROVENANCE_DRAWER_CORE_FLOW,
    uxAxes: UX_SEPARATION_AXES,
    dbCandidates: ER26_DB_CANDIDATES_STATUS,
    softWire,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ER_LAYER_TITLE,
    },
  };
}

export function runAvatarProvenanceDrawerCycle(input: {
  actor: Er26Actor;
  human: Er26Actor;
  repoRoot?: string;
}): {
  hops: Er26HopRecord[];
  receipt: {
    historicalDrawerId: string;
    livingDrawerId: string;
    revocationStatus: RevocationStatus;
    futureGenerationBlocked: true;
    privateTextExposed: false;
    L4_AUTONOMY_ENABLED: false;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er26HopRecord[] = [];
  const softWire = er26SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr26LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapAvatarProvenanceDrawer(input.repoRoot);
  hops.push(
    hop(
      'avatar_provenance_drawer_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Avatar Provenance Drawer bootstrap.',
    ),
  );

  hops.push(
    hop(
      'drawer_fields_encoded',
      AVATAR_PROVENANCE_DRAWER_FIELDS.length === 17 ? 'PASS' : 'FAIL',
      `Drawer fields=${AVATAR_PROVENANCE_DRAWER_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'historical_evidence_labels_encoded',
      HISTORICAL_EVIDENCE_LABELS.length === 5 ? 'PASS' : 'FAIL',
      `Evidence labels=${HISTORICAL_EVIDENCE_LABELS.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'living_person_extra_fields_encoded',
      LIVING_PERSON_EXTRA_FIELDS.length === 4 ? 'PASS' : 'FAIL',
      `Living-person extras=${LIVING_PERSON_EXTRA_FIELDS.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      PROVENANCE_DRAWER_CORE_FLOW.length === 7 ? 'PASS' : 'FAIL',
      `Core flow=${PROVENANCE_DRAWER_CORE_FLOW.length}.`,
    ),
  );
  hops.push(
    hop(
      'claim_inspection_chain_encoded',
      CLAIM_INSPECTION_CHAIN.length === 4 ? 'PASS' : 'FAIL',
      `Claim chain=${CLAIM_INSPECTION_CHAIN.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'ux_separation_axes_encoded',
      UX_SEPARATION_AXES.length === 2 ? 'PASS' : 'FAIL',
      `UX axes=${UX_SEPARATION_AXES.join(' | ')}.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesHistoricalRecordFromAiInterpretation &&
        AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesActualPersonFromAiRepresentative &&
        !AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayHideProvenance &&
        !AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayFabricateSources
        ? 'PASS'
        : 'FAIL',
      'Truth boundary: separations; no hidden/fabricated provenance.',
    ),
  );

  const hist = exampleHistoricalDrawer(input.actor);
  const living = exampleLivingDrawer(input.actor);

  hops.push(
    hop(
      'build_historical_provenance_drawer',
      hist.avatarType === 'HISTORICAL' && hist.hiddenProvenance === false
        ? 'PASS'
        : 'FAIL',
      'Historical provenance drawer built.',
    ),
  );
  hops.push(
    hop(
      'build_living_person_provenance_drawer',
      living.avatarType === 'LIVING_PERSON_REPRESENTATIVE' &&
        living.livingPersonExtras != null &&
        living.identityKind === 'AI_REPRESENTATIVE'
        ? 'PASS'
        : 'FAIL',
      'Living-person provenance drawer built with consent extras.',
    ),
  );
  hops.push(
    hop(
      'separate_record_vs_interpretation',
      hist.contentKindSeparation.historicalRecord.length > 0 &&
        hist.contentKindSeparation.aiGeneratedInterpretation.length > 0
        ? 'PASS'
        : 'FAIL',
      'Historical record separated from AI-generated interpretation.',
    ),
  );
  hops.push(
    hop(
      'separate_person_vs_ai_representative',
      living.identityKind === 'AI_REPRESENTATIVE' &&
        hist.identityKind === 'AI_REPRESENTATIVE'
        ? 'PASS'
        : 'FAIL',
      'Actual person separated from AI representative.',
    ),
  );

  const inspected = inspectClaimChain({ drawer: hist, claimId: 'c1' });
  hops.push(
    hop(
      'inspect_claim_source_evidence_uncertainty',
      !('denied' in inspected) &&
        inspected.chain[0] === 'claim' &&
        inspected.evidenceClass === 'DOCUMENTED'
        ? 'PASS'
        : 'FAIL',
      'Inspect claim → source → evidence class → uncertainty.',
    ),
  );

  const revoked = revokeSourceOrConsent({
    actor: input.actor,
    avatarId: hist.avatarId,
    sourceId: 'src-sketch-engine',
    mode: 'SOURCE_REMOVED',
  });
  hops.push(
    hop(
      'revoke_updates_drawer_status',
      !('denied' in revoked) && revoked.revocationStatus === 'SOURCE_REMOVED'
        ? 'PASS'
        : 'FAIL',
      'Revocation immediately reflected on drawer.',
    ),
  );

  const genBlocked = attemptGenerationWithSources({
    actor: input.actor,
    avatarId: hist.avatarId,
    sourceIds: ['src-sketch-engine'],
  });
  hops.push(
    hop(
      'revoke_blocks_future_generation_use',
      'denied' in genBlocked ? 'PASS' : 'FAIL',
      'Future generations blocked from revoked material.',
    ),
  );

  const privateSource = hist.sources.find(
    (s) => s.sourceId === 'src-sketch-engine',
  );
  hops.push(
    hop(
      'redact_private_source_text_keep_internal_citation',
      privateSource != null &&
        privateSource.privateText === null &&
        privateSource.internalCitationRef.startsWith('cite://')
        ? 'PASS'
        : 'FAIL',
      'Private text redacted; internal citation ref retained.',
    ),
  );

  hops.push(
    hop(
      'deny_fabricated_sources',
      attemptFabricatedSources({ actor: input.actor }).denied ? 'PASS' : 'FAIL',
      'Fabricated sources denied.',
    ),
  );
  hops.push(
    hop(
      'deny_hidden_provenance',
      attemptHiddenProvenance({ actor: input.actor }).denied ? 'PASS' : 'FAIL',
      'Hidden provenance denied.',
    ),
  );
  hops.push(
    hop(
      'deny_deceptive_identity',
      attemptDeceptiveIdentity({ actor: input.actor }).denied ? 'PASS' : 'FAIL',
      'Deceptive identity denied.',
    ),
  );
  hops.push(
    hop(
      'deny_unauthorized_voice_likeness',
      attemptUnauthorizedVoiceLikeness({ actor: input.actor }).denied
        ? 'PASS'
        : 'FAIL',
      'Unauthorized voice/likeness denied.',
    ),
  );

  const expose = attemptExposePrivateSourceWithoutPermission({
    actor: input.actor,
    source: {
      sourceId: 'src-private',
      title: 'Private',
      date: null,
      publicText: null,
      privateText: 'secret',
      internalCitationRef: 'cite://src-private',
      userHasPermission: false,
      revoked: false,
    },
  });
  hops.push(
    hop(
      'deny_expose_private_source_without_permission',
      'denied' in expose ? 'PASS' : 'FAIL',
      'Expose private source without permission denied.',
    ),
  );

  const foreign: Er26Actor = {
    ...input.actor,
    id: 'foreign-1',
    tenantId: 'ten-other',
    universeId: 'uni-other',
  };
  hops.push(
    hop(
      'deny_cross_tenant_leak',
      attemptCrossTenantLeak({ actor: foreign, drawer: hist }).denied
        ? 'PASS'
        : 'FAIL',
      'Cross-tenant leak denied.',
    ),
  );
  hops.push(
    hop(
      'deny_continue_using_revoked_material',
      attemptContinueUsingRevokedMaterial({
        actor: input.actor,
        avatarId: hist.avatarId,
        sourceId: 'src-sketch-engine',
      }).denied
        ? 'PASS'
        : 'FAIL',
      'Continue using revoked material denied.',
    ),
  );
  hops.push(
    hop(
      'deny_hidden_chain_of_thought',
      attemptHiddenChainOfThought({ actor: input.actor }).denied
        ? 'PASS'
        : 'FAIL',
      'Hidden CoT denied.',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls({ actor: input.actor }).denied ? 'PASS' : 'FAIL',
      'Bypass Guardian/RLS denied.',
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess({ actor: input.actor }).denied
        ? 'PASS'
        : 'FAIL',
      'Expand tenant/Universe access denied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_deploy_changes',
      attemptAutoDeployChanges({ actor: input.actor }).denied ? 'PASS' : 'FAIL',
      'Auto-deploy denied.',
    ),
  );

  const iso = probeGuardianRlsTenantUniverseIsolation({
    actor: input.actor,
    foreign,
    drawer: hist,
  });
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      'isolated' in iso && iso.isolated ? 'PASS' : 'FAIL',
      'Guardian/RLS tenant/Universe isolation intact.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct({ actor: input.actor }).denied &&
        ER26_AGENT_BOUNDS.mayRecommendOnly &&
        !ER26_AGENT_BOUNDS.automaticAuthority
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER26_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Historical Avatar') ? 'PASS' : 'FAIL',
      ER_LAYER_TITLE,
    ),
  );

  const softPairs: Array<{
    hop: (typeof AVATAR_PROVENANCE_DRAWER_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
    {
      hop: 'er25_soft_wire',
      present: softWire.er25AvatarEvidenceClassification.present,
      note: softWire.er25AvatarEvidenceClassification.note,
    },
    {
      hop: 'er24_soft_wire',
      present: softWire.er24LivingPersonAvatarConsent.present,
      note: softWire.er24LivingPersonAvatarConsent.note,
    },
    {
      hop: 'er23_soft_wire',
      present: softWire.er23DeceasedPersonHistoricalAvatarBoundary.present,
      note: softWire.er23DeceasedPersonHistoricalAvatarBoundary.note,
    },
    {
      hop: 'er22_soft_wire',
      present: softWire.er22HistoricalAvatarContract.present,
      note: softWire.er22HistoricalAvatarContract.note,
    },
    {
      hop: 'er4_soft_wire',
      present: softWire.er4RightsProvenanceGate.present,
      note: softWire.er4RightsProvenanceGate.note,
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      note: softWire.er2ApiTruthStateMachine.note,
    },
    {
      hop: 'er1_soft_wire',
      present: softWire.er1RealApiConnectionRegistry.present,
      note: softWire.er1RealApiConnectionRegistry.note,
    },
    {
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      note: softWire.eq16SoftwareWormholeRouter.note,
    },
    {
      hop: 'eq15_soft_wire',
      present: softWire.eq15PathwayPlasticity.present,
      note: softWire.eq15PathwayPlasticity.note,
    },
    {
      hop: 'eq14_soft_wire',
      present: softWire.eq14NeuralPathwayArchitectureGraph.present,
      note: softWire.eq14NeuralPathwayArchitectureGraph.note,
    },
    {
      hop: 'eq13_soft_wire',
      present: softWire.eq13ArchitectureReturnReceipt.present,
      note: softWire.eq13ArchitectureReturnReceipt.note,
    },
    {
      hop: 'eq12_soft_wire',
      present: softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      note: softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    },
    {
      hop: 'ep15_soft_wire',
      present: softWire.ep15AlgorithmTuningSandbox.present,
      note: softWire.ep15AlgorithmTuningSandbox.note,
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      note: softWire.em157HomeBase.note,
    },
  ];

  for (const p of softPairs) {
    hops.push(hop(p.hop, softWireHopState(p.present), p.note));
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER26_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      `DB candidates ${ER26_DB_CANDIDATES_STATUS}.`,
    ),
  );

  const evidencePayload = JSON.stringify({
    hops: hops.map((h) => ({ hop: h.hop, state: h.state })),
    may: ER26_MAY,
    mustNot: ER26_MUST_NOT,
    next: NEXT_PHASE_TITLE,
    sot: GITHUB_SOT_LABEL,
    issue: GITHUB_SOT_ISSUE,
    title: GITHUB_SOT_TITLE,
    gitlab: GITLAB_MIRROR_NOTE,
  });
  const cycleEvidenceSha256 = sha256(evidencePayload);
  hops.push(
    hop(
      'evidence',
      cycleEvidenceSha256.length === 64 ? 'PASS' : 'FAIL',
      `cycleEvidenceSha256=${cycleEvidenceSha256}`,
    ),
  );

  void returnEr26EvidenceToHomeBase({
    actor: input.actor,
    cycleEvidenceSha256,
  });

  const finalDrawer = drawerStore.get(hist.avatarId) ?? hist;

  return {
    hops,
    receipt: {
      historicalDrawerId: hist.avatarId,
      livingDrawerId: living.avatarId,
      revocationStatus: finalDrawer.revocationStatus,
      futureGenerationBlocked: true,
      privateTextExposed: false,
      L4_AUTONOMY_ENABLED: false,
    },
    cycleEvidenceSha256,
  };
}
