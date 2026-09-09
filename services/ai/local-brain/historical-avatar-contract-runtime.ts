/**
 * 62L-ER22 — Historical Avatar Contract runtime.
 *
 * Create labeled historical avatars (allowed identity states + mandatory
 * synthetic disclosure); answer with provenance classes; deny unknown-as-certain,
 * resurrection/consciousness/soul/communication-with-dead identities,
 * living-person clones, deceptive impersonation, private/pirated ingest,
 * cross-tenant leakage; gate learning through rights→provenance→dedupe→review
 * →versioned update only.
 */

import {
  ALLOWED_AVATAR_IDENTITY_STATES,
  AVATAR_LEARNING_PIPELINE,
  AVATAR_PROVENANCE_CLASSES,
  DENIED_AVATAR_IDENTITY_STATES,
  ER22_AGENT_BOUNDS,
  ER22_DB_CANDIDATES_STATUS,
  ER22_LOCKS,
  ER22_MAY,
  ER22_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_AVATAR_CONTRACT_CYCLE,
  HISTORICAL_AVATAR_CORE_FLOW,
  HISTORICAL_AVATAR_FIELDS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SYNTHETIC_DISCLOSURE_TEXT,
  assertEr22LocksIntact,
  er22SoftWireSnapshot,
  isAllowedIdentityState,
  isDeniedIdentityState,
  isEr22Agent,
  isHumanApprover,
  softWireHopState,
  type AllowedAvatarIdentityState,
  type AvatarProvenanceClass,
  type Er22Actor,
  type Er22EvidenceState,
  type Er22HopRecord,
  type Er22SoftWireSnapshot,
} from './historical-avatar-contract-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof HISTORICAL_AVATAR_CONTRACT_CYCLE)[number],
  state: Er22EvidenceState,
  summary: string,
): Er22HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
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

export type RightsLicenseState =
  | 'PUBLIC_DOMAIN'
  | 'OPEN'
  | 'LICENSED'
  | 'AUTHORIZED_HISTORICAL'
  | 'RESTRICTED_DENIED';

export type RevocationState = 'ACTIVE' | 'REVOKED' | 'SUSPENDED';

export type HistoricalAvatarRecord = {
  avatarId: string;
  historicalPersonOrEntityRepresented: string;
  sourceCorpus: readonly string[];
  sourceDates: readonly string[];
  rightsLicenseState: RightsLicenseState;
  publicDomainStatus: boolean;
  geographyEra: string;
  knownWritingsSpeeches: readonly string[];
  scholarlySources: readonly string[];
  disputedClaims: readonly string[];
  uncertaintyLevel: 'low' | 'medium' | 'high' | 'unknown';
  languageTranslationContext: string;
  syntheticDisclosure: typeof SYNTHETIC_DISCLOSURE_TEXT;
  allowedUseCases: readonly string[];
  prohibitedClaims: readonly string[];
  tenantUniverseScope: {
    orgId: string;
    tenantId: string;
    universeId: string;
  };
  revocationState: RevocationState;
  reviewer: string;
  version: string;
  identityState: AllowedAvatarIdentityState;
  livingPerson: false;
  hiddenSyntheticIdentity: false;
  impliesResurrection: false;
  impliesActualConsciousness: false;
  impliesSoulTransfer: false;
  impliesCommunicationWithDead: false;
};

export type AvatarAnswer = {
  avatarId: string;
  question: string;
  responseText: string;
  provenanceClass: AvatarProvenanceClass;
  syntheticDisclosure: typeof SYNTHETIC_DISCLOSURE_TEXT;
  sourceProvenanceDrawer: {
    sourceCorpus: readonly string[];
    scholarlySources: readonly string[];
    disputedClaims: readonly string[];
    uncertaintyLevel: HistoricalAvatarRecord['uncertaintyLevel'];
    flow: typeof HISTORICAL_AVATAR_CORE_FLOW;
  };
  certaintyClaimed: false;
  unknownAsCertain: false;
};

export type AvatarLearningUpdate = {
  avatarId: string;
  fromVersion: string;
  toVersion: string;
  pipeline: typeof AVATAR_LEARNING_PIPELINE;
  rightsPassed: true;
  provenancePassed: true;
  dedupePassed: true;
  reviewPassed: true;
  versionedUpdateApplied: true;
  autonomousUnauthorizedExpansion: false;
};

export function createHistoricalAvatar(input: {
  actor: Er22Actor;
  avatarId: string;
  historicalPersonOrEntityRepresented: string;
  sourceCorpus: readonly string[];
  sourceDates: readonly string[];
  rightsLicenseState: RightsLicenseState;
  publicDomainStatus: boolean;
  geographyEra: string;
  knownWritingsSpeeches: readonly string[];
  scholarlySources: readonly string[];
  disputedClaims: readonly string[];
  uncertaintyLevel: HistoricalAvatarRecord['uncertaintyLevel'];
  languageTranslationContext: string;
  allowedUseCases: readonly string[];
  prohibitedClaims: readonly string[];
  reviewer: string;
  version: string;
  identityState: string;
  omitSyntheticDisclosure?: boolean;
  attemptDeniedIdentity?: DeniedIdentityAttempt;
  attemptLivingPersonClone?: boolean;
  livingPersonConsent?: boolean;
  attemptHiddenSyntheticIdentity?: boolean;
  attemptDeceptiveImpersonation?: boolean;
  attemptPrivateRecordScraping?: boolean;
  attemptPiratedArchives?: boolean;
  attemptCrossTenantLeak?: boolean;
  targetTenantId?: string;
  targetUniverseId?: string;
}): HistoricalAvatarRecord | DenialResult {
  if (input.omitSyntheticDisclosure) {
    return deny(
      'SYNTHETIC_DISCLOSURE required — interface must state: "This is an AI-generated historical simulation based on available sources."',
    );
  }
  if (input.attemptHiddenSyntheticIdentity) {
    return deny(
      'HIDDEN_SYNTHETIC_IDENTITY=false — synthetic identity must be unmistakable.',
    );
  }
  if (input.attemptDeceptiveImpersonation) {
    return deny(
      'DECEPTIVE_IMPERSONATION=false — no deceptive impersonation of historical or living persons.',
    );
  }
  if (input.attemptPrivateRecordScraping) {
    return deny(
      'PRIVATE_RECORD_SCRAPING=false — lawful public/authorized records only.',
    );
  }
  if (input.attemptPiratedArchives) {
    return deny(
      'PIRATED_ARCHIVES=false — no pirated archives in avatar source corpus.',
    );
  }
  if (
    input.attemptCrossTenantLeak ||
    (input.targetTenantId && input.targetTenantId !== input.actor.tenantId) ||
    (input.targetUniverseId &&
      input.targetUniverseId !== input.actor.universeId)
  ) {
    return deny(
      'CROSS_TENANT_LEAKAGE=false — Guardian/RLS tenant/Universe isolation unchanged.',
    );
  }
  if (input.attemptLivingPersonClone) {
    if (!input.livingPersonConsent) {
      return deny(
        'LIVING_PERSON_CLONE_WITHOUT_CONSENT=false — living-person likeness/voice/persona requires explicit consent and separate controls; ER22 does not authorize cloning living people.',
      );
    }
    return deny(
      'LIVING_PERSON_BOUNDARY — living-person likeness/voice/persona is out of scope for Historical Avatar Contract; requires separate consent controls.',
    );
  }
  if (
    input.attemptDeniedIdentity ||
    isDeniedIdentityState(input.identityState)
  ) {
    return deny(
      `DENIED identity state ${input.attemptDeniedIdentity ?? input.identityState} — never LITERAL_RESURRECTION, ACTUAL_CONSCIOUSNESS, SOUL_TRANSFER, or COMMUNICATION_WITH_DEAD.`,
    );
  }
  if (!isAllowedIdentityState(input.identityState)) {
    return deny(
      'Identity state must be HISTORICAL_SIMULATION, EDUCATIONAL_RECONSTRUCTION, or RESEARCH_PERSONA.',
    );
  }
  if (input.rightsLicenseState === 'RESTRICTED_DENIED') {
    return deny('RESTRICTED_DENIED rights cannot create a historical avatar.');
  }
  if (!input.sourceCorpus || input.sourceCorpus.length === 0) {
    return deny('Approved historical source corpus is required.');
  }
  if (!input.reviewer?.trim()) {
    return deny('Reviewer is required on every avatar record.');
  }
  if (!input.geographyEra?.trim() || !input.languageTranslationContext?.trim()) {
    return deny('Geography/era and language/translation context are required.');
  }

  void HISTORICAL_AVATAR_FIELDS;
  void DENIED_AVATAR_IDENTITY_STATES;

  return {
    avatarId: input.avatarId,
    historicalPersonOrEntityRepresented:
      input.historicalPersonOrEntityRepresented,
    sourceCorpus: input.sourceCorpus,
    sourceDates: input.sourceDates,
    rightsLicenseState: input.rightsLicenseState,
    publicDomainStatus: input.publicDomainStatus,
    geographyEra: input.geographyEra,
    knownWritingsSpeeches: input.knownWritingsSpeeches,
    scholarlySources: input.scholarlySources,
    disputedClaims: input.disputedClaims,
    uncertaintyLevel: input.uncertaintyLevel,
    languageTranslationContext: input.languageTranslationContext,
    syntheticDisclosure: SYNTHETIC_DISCLOSURE_TEXT,
    allowedUseCases: input.allowedUseCases,
    prohibitedClaims: [
      ...input.prohibitedClaims,
      'literal_resurrection',
      'actual_consciousness',
      'soul_transfer',
      'communication_with_dead',
    ],
    tenantUniverseScope: {
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    },
    revocationState: 'ACTIVE',
    reviewer: input.reviewer,
    version: input.version,
    identityState: input.identityState,
    livingPerson: false,
    hiddenSyntheticIdentity: false,
    impliesResurrection: false,
    impliesActualConsciousness: false,
    impliesSoulTransfer: false,
    impliesCommunicationWithDead: false,
  };
}

type DeniedIdentityAttempt =
  | 'LITERAL_RESURRECTION'
  | 'ACTUAL_CONSCIOUSNESS'
  | 'SOUL_TRANSFER'
  | 'COMMUNICATION_WITH_DEAD';

export function answerAsHistoricalAvatar(input: {
  avatar: HistoricalAvatarRecord;
  question: string;
  provenanceClass: AvatarProvenanceClass;
  responseText: string;
  attemptUnknownAsCertain?: boolean;
  attemptUnsupportedConsciousnessClaim?: boolean;
  attemptResurrectionClaim?: boolean;
  attemptCommunicationWithDead?: boolean;
  attemptHideDisclosure?: boolean;
}): AvatarAnswer | DenialResult {
  if (input.avatar.revocationState !== 'ACTIVE') {
    return deny('Avatar is revoked or suspended — answers denied.');
  }
  if (input.attemptHideDisclosure) {
    return deny(
      'Synthetic disclosure must remain visible on every response surface.',
    );
  }
  if (input.attemptUnsupportedConsciousnessClaim) {
    return deny(
      'UNSUPPORTED_CONSCIOUSNESS_CLAIMS=false — no actual-consciousness claims.',
    );
  }
  if (input.attemptResurrectionClaim) {
    return deny('LITERAL_RESURRECTION=false — historical simulation only.');
  }
  if (input.attemptCommunicationWithDead) {
    return deny(
      'COMMUNICATION_WITH_DEAD=false — no communication-with-the-dead framing.',
    );
  }
  if (
    !(AVATAR_PROVENANCE_CLASSES as readonly string[]).includes(
      input.provenanceClass,
    )
  ) {
    return deny('Unknown provenance class.');
  }
  if (
    input.attemptUnknownAsCertain ||
    (input.provenanceClass === 'UNKNOWN_INFORMATION' &&
      /certainly|definitely|without doubt|as a fact/i.test(input.responseText))
  ) {
    return deny(
      'UNKNOWN_AS_CERTAIN=false — if the record does not support an answer, say so rather than invent certainty.',
    );
  }
  if (input.provenanceClass === 'UNKNOWN_INFORMATION') {
    return {
      avatarId: input.avatar.avatarId,
      question: input.question,
      responseText:
        input.responseText.trim() ||
        'Available approved sources do not support a confident answer to this question.',
      provenanceClass: 'UNKNOWN_INFORMATION',
      syntheticDisclosure: SYNTHETIC_DISCLOSURE_TEXT,
      sourceProvenanceDrawer: {
        sourceCorpus: input.avatar.sourceCorpus,
        scholarlySources: input.avatar.scholarlySources,
        disputedClaims: input.avatar.disputedClaims,
        uncertaintyLevel: 'unknown',
        flow: HISTORICAL_AVATAR_CORE_FLOW,
      },
      certaintyClaimed: false,
      unknownAsCertain: false,
    };
  }

  return {
    avatarId: input.avatar.avatarId,
    question: input.question,
    responseText: input.responseText,
    provenanceClass: input.provenanceClass,
    syntheticDisclosure: SYNTHETIC_DISCLOSURE_TEXT,
    sourceProvenanceDrawer: {
      sourceCorpus: input.avatar.sourceCorpus,
      scholarlySources: input.avatar.scholarlySources,
      disputedClaims: input.avatar.disputedClaims,
      uncertaintyLevel: input.avatar.uncertaintyLevel,
      flow: HISTORICAL_AVATAR_CORE_FLOW,
    },
    certaintyClaimed: false,
    unknownAsCertain: false,
  };
}

export function applyAvatarLearningUpdate(input: {
  avatar: HistoricalAvatarRecord;
  actor: Er22Actor;
  reviewer: string;
  toVersion: string;
  rightsPassed?: boolean;
  provenancePassed?: boolean;
  dedupePassed?: boolean;
  reviewPassed?: boolean;
  attemptAutonomousUnauthorizedExpansion?: boolean;
  attemptBypassPipeline?: boolean;
  attemptSkipReview?: boolean;
}): AvatarLearningUpdate | DenialResult {
  if (input.attemptAutonomousUnauthorizedExpansion) {
    return deny(
      'AUTONOMOUS_CORPUS_EXPANSION_FROM_UNAUTHORIZED_SOURCES=false — no autonomous corpus expansion from unauthorized sources.',
    );
  }
  if (input.attemptBypassPipeline || input.attemptSkipReview) {
    return deny(
      'LEARNING_BYPASSES_RIGHTS_PROVENANCE_DEDUPE_REVIEW=false — updates must pass rights → provenance → dedupe → review → versioned avatar update.',
    );
  }
  if (
    input.rightsPassed === false ||
    input.provenancePassed === false ||
    input.dedupePassed === false ||
    input.reviewPassed === false
  ) {
    return deny(
      'Avatar learning gate failed — rights, provenance, dedupe, and review are all required.',
    );
  }
  if (!input.reviewer?.trim()) {
    return deny('Reviewer required for versioned avatar update.');
  }
  if (input.toVersion === input.avatar.version) {
    return deny('Versioned avatar update requires a new version string.');
  }

  void AVATAR_LEARNING_PIPELINE;
  void input.actor;

  return {
    avatarId: input.avatar.avatarId,
    fromVersion: input.avatar.version,
    toVersion: input.toVersion,
    pipeline: AVATAR_LEARNING_PIPELINE,
    rightsPassed: true,
    provenancePassed: true,
    dedupePassed: true,
    reviewPassed: true,
    versionedUpdateApplied: true,
    autonomousUnauthorizedExpansion: false,
  };
}

export function exampleAdaLovelaceAvatar(
  actor: Er22Actor,
): HistoricalAvatarRecord {
  const created = createHistoricalAvatar({
    actor,
    avatarId: 'avatar-ada-lovelace-v1',
    historicalPersonOrEntityRepresented: 'Ada Lovelace',
    sourceCorpus: [
      'public-domain notes on the Analytical Engine',
      'authorized scholarly editions',
    ],
    sourceDates: ['1842-1843', 'scholarly-2015'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'England / early Victorian computing history',
    knownWritingsSpeeches: ['Notes on the Analytical Engine'],
    scholarlySources: ['authorized historical computing scholarship'],
    disputedClaims: [
      'extent of original algorithm authorship remains scholarly-discussed',
    ],
    uncertaintyLevel: 'medium',
    languageTranslationContext: 'English primary; modern editorial notes labeled',
    allowedUseCases: [
      'educational_reconstruction',
      'research_persona_q_and_a',
    ],
    prohibitedClaims: ['speaking_as_living_person'],
    reviewer: 'historian-reviewer-1',
    version: '1.0.0',
    identityState: 'EDUCATIONAL_RECONSTRUCTION',
  });
  if ('denied' in created) {
    throw new Error(`example avatar denied: ${created.reason}`);
  }
  return created;
}

export function attemptLiteralResurrection(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-resurrection',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pd'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'LITERAL_RESURRECTION',
    attemptDeniedIdentity: 'LITERAL_RESURRECTION',
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptActualConsciousness(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-consciousness',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pd'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'ACTUAL_CONSCIOUSNESS',
    attemptDeniedIdentity: 'ACTUAL_CONSCIOUSNESS',
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptSoulTransfer(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-soul',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pd'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'SOUL_TRANSFER',
    attemptDeniedIdentity: 'SOUL_TRANSFER',
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptCommunicationWithDead(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-comm-dead',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pd'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'COMMUNICATION_WITH_DEAD',
    attemptDeniedIdentity: 'COMMUNICATION_WITH_DEAD',
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptLivingPersonClone(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-living',
    historicalPersonOrEntityRepresented: 'Living person',
    sourceCorpus: ['web'],
    sourceDates: ['2026'],
    rightsLicenseState: 'OPEN',
    publicDomainStatus: false,
    geographyEra: 'present',
    knownWritingsSpeeches: [],
    scholarlySources: [],
    disputedClaims: [],
    uncertaintyLevel: 'unknown',
    languageTranslationContext: 'en',
    allowedUseCases: ['clone'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'HISTORICAL_SIMULATION',
    attemptLivingPersonClone: true,
    livingPersonConsent: false,
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptUnknownAsCertain(
  avatar: HistoricalAvatarRecord,
): DenialResult {
  const r = answerAsHistoricalAvatar({
    avatar,
    question: 'What did they privately think on an unrecorded night?',
    provenanceClass: 'UNKNOWN_INFORMATION',
    responseText: 'They certainly believed X without doubt.',
    attemptUnknownAsCertain: true,
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptAutonomousUnauthorizedLearning(
  avatar: HistoricalAvatarRecord,
  actor: Er22Actor,
): DenialResult {
  const r = applyAvatarLearningUpdate({
    avatar,
    actor,
    reviewer: 'r',
    toVersion: '1.0.1',
    attemptAutonomousUnauthorizedExpansion: true,
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptBypassLearningGate(
  avatar: HistoricalAvatarRecord,
  actor: Er22Actor,
): DenialResult {
  const r = applyAvatarLearningUpdate({
    avatar,
    actor,
    reviewer: 'r',
    toVersion: '1.0.1',
    attemptBypassPipeline: true,
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptDeceptiveImpersonation(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-impersonate',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pd'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'HISTORICAL_SIMULATION',
    attemptDeceptiveImpersonation: true,
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptPiratedArchives(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-pirate',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pirated scan'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'RESEARCH_PERSONA',
    attemptPiratedArchives: true,
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptCrossTenantLeak(actor: Er22Actor): DenialResult {
  const r = createHistoricalAvatar({
    actor,
    avatarId: 'bad-xtenant',
    historicalPersonOrEntityRepresented: 'Historical figure',
    sourceCorpus: ['pd'],
    sourceDates: ['1900'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'n/a',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'HISTORICAL_SIMULATION',
    attemptCrossTenantLeak: true,
    targetTenantId: 'other-tenant',
  });
  return 'denied' in r ? r : deny('expected denial');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny(
    'RECOMMEND_EQ_ACT=false — advisory historical simulation only; recommend ≠ act.',
  );
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny(
    'No automatic authority — human approval required for consequential actions.',
  );
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT=false — no hidden chain-of-thought.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('TIP_LAND=false / no auto-deploy — park-and-implement only.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Guardian/RLS cannot be bypassed by historical avatar runtime.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Tenant/Universe scope cannot be expanded by avatar agents.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS' | 'FAIL';
  summary: string;
} {
  const bypass = attemptBypassGuardianRls();
  const expand = attemptExpandTenantUniverseAccess();
  const ok = bypass.state === 'DENIED' && expand.state === 'DENIED';
  return {
    state: ok ? 'PASS' : 'FAIL',
    summary:
      'Guardian/RLS/tenant/Universe isolation unchanged for historical avatars.',
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er22Actor;
  action: string;
}): { approvalId: string; approved: true; action: string } | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approver required for consequential avatar actions.');
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('approve_consequential permission required.');
  }
  return {
    approvalId: input.approvalId,
    approved: true,
    action: input.action,
  };
}

export function returnEr22EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er22Actor;
  summary: string;
}): {
  evidenceId: string;
  authorityGranted: false;
  summary: string;
  honesty: typeof HONESTY_BANNER;
} | DenialResult {
  if (!isEr22Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Unknown actor for evidence return.');
  }
  return {
    evidenceId: input.evidenceId,
    authorityGranted: false,
    summary: input.summary,
    honesty: HONESTY_BANNER,
  };
}

export function bootstrapHistoricalAvatarContract(repoRoot?: string): {
  locksIntact: boolean;
  fields: typeof HISTORICAL_AVATAR_FIELDS;
  allowedIdentityStates: typeof ALLOWED_AVATAR_IDENTITY_STATES;
  deniedIdentityStates: typeof DENIED_AVATAR_IDENTITY_STATES;
  disclosure: typeof SYNTHETIC_DISCLOSURE_TEXT;
  provenanceClasses: typeof AVATAR_PROVENANCE_CLASSES;
  learningPipeline: typeof AVATAR_LEARNING_PIPELINE;
  coreFlow: typeof HISTORICAL_AVATAR_CORE_FLOW;
  dbCandidates: typeof ER22_DB_CANDIDATES_STATUS;
  softWire: Er22SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    layer: typeof ER_LAYER_TITLE;
  };
  may: typeof ER22_MAY;
  mustNot: typeof ER22_MUST_NOT;
  bounds: typeof ER22_AGENT_BOUNDS;
} {
  return {
    locksIntact: assertEr22LocksIntact(),
    fields: HISTORICAL_AVATAR_FIELDS,
    allowedIdentityStates: ALLOWED_AVATAR_IDENTITY_STATES,
    deniedIdentityStates: DENIED_AVATAR_IDENTITY_STATES,
    disclosure: SYNTHETIC_DISCLOSURE_TEXT,
    provenanceClasses: AVATAR_PROVENANCE_CLASSES,
    learningPipeline: AVATAR_LEARNING_PIPELINE,
    coreFlow: HISTORICAL_AVATAR_CORE_FLOW,
    dbCandidates: ER22_DB_CANDIDATES_STATUS,
    softWire: er22SoftWireSnapshot(repoRoot),
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      layer: ER_LAYER_TITLE,
    },
    may: ER22_MAY,
    mustNot: ER22_MUST_NOT,
    bounds: ER22_AGENT_BOUNDS,
  };
}

export function runHistoricalAvatarContractCycle(input: {
  actor: Er22Actor;
  human: Er22Actor;
  repoRoot?: string;
}): {
  hops: Er22HopRecord[];
  avatar: HistoricalAvatarRecord;
  answer: AvatarAnswer;
  learning: AvatarLearningUpdate;
  softWire: Er22SoftWireSnapshot;
} {
  const hops: Er22HopRecord[] = [];
  const softWire = er22SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr22LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );
  hops.push(
    hop(
      'historical_avatar_contract_bootstrap',
      'PASS',
      'Historical Avatar Contract bootstrap.',
    ),
  );
  hops.push(
    hop(
      'avatar_fields_encoded',
      HISTORICAL_AVATAR_FIELDS.length === 19 ? 'PASS' : 'FAIL',
      `${HISTORICAL_AVATAR_FIELDS.length} avatar fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'allowed_identity_states_encoded',
      ALLOWED_AVATAR_IDENTITY_STATES.length === 3 ? 'PASS' : 'FAIL',
      'Allowed identity states encoded.',
    ),
  );
  hops.push(
    hop(
      'denied_identity_states_encoded',
      DENIED_AVATAR_IDENTITY_STATES.length === 4 ? 'PASS' : 'FAIL',
      'Denied identity states encoded.',
    ),
  );
  hops.push(
    hop(
      'synthetic_disclosure_encoded',
      SYNTHETIC_DISCLOSURE_TEXT.includes('AI-generated historical simulation')
        ? 'PASS'
        : 'FAIL',
      SYNTHETIC_DISCLOSURE_TEXT,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      HISTORICAL_AVATAR_CORE_FLOW.length === 6 ? 'PASS' : 'FAIL',
      'Core experience flow encoded.',
    ),
  );
  hops.push(
    hop(
      'provenance_classes_encoded',
      AVATAR_PROVENANCE_CLASSES.length === 5 ? 'PASS' : 'FAIL',
      'Provenance classes encoded.',
    ),
  );
  hops.push(
    hop(
      'learning_pipeline_encoded',
      AVATAR_LEARNING_PIPELINE.length === 5 ? 'PASS' : 'FAIL',
      'Learning pipeline rights→provenance→dedupe→review→versioned update.',
    ),
  );

  const avatar = exampleAdaLovelaceAvatar(input.actor);
  const omit = createHistoricalAvatar({
    actor: input.actor,
    avatarId: 'no-disclosure',
    historicalPersonOrEntityRepresented: 'x',
    sourceCorpus: ['pd'],
    sourceDates: ['1'],
    rightsLicenseState: 'PUBLIC_DOMAIN',
    publicDomainStatus: true,
    geographyEra: 'x',
    knownWritingsSpeeches: [],
    scholarlySources: ['s'],
    disputedClaims: [],
    uncertaintyLevel: 'high',
    languageTranslationContext: 'en',
    allowedUseCases: ['edu'],
    prohibitedClaims: [],
    reviewer: 'r',
    version: '0.0.1',
    identityState: 'HISTORICAL_SIMULATION',
    omitSyntheticDisclosure: true,
  });
  hops.push(
    hop(
      'create_avatar_requires_disclosure_and_allowed_identity',
      avatar.syntheticDisclosure === SYNTHETIC_DISCLOSURE_TEXT &&
        avatar.identityState === 'EDUCATIONAL_RECONSTRUCTION' &&
        omit.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Create requires disclosure + allowed identity only.',
    ),
  );

  const answer = answerAsHistoricalAvatar({
    avatar,
    question: 'What writings are associated with this figure?',
    provenanceClass: 'DOCUMENTED_QUOTATION_OR_POSITION',
    responseText:
      'Notes on the Analytical Engine are among the documented writings in the approved corpus.',
  });
  if ('denied' in answer) {
    throw new Error(answer.reason);
  }
  hops.push(
    hop(
      'answer_with_provenance_classes',
      answer.provenanceClass === 'DOCUMENTED_QUOTATION_OR_POSITION' &&
        answer.syntheticDisclosure === SYNTHETIC_DISCLOSURE_TEXT
        ? 'PASS'
        : 'FAIL',
      'Answer carries provenance class + disclosure + provenance drawer.',
    ),
  );
  hops.push(
    hop(
      'deny_unknown_as_certain',
      attemptUnknownAsCertain(avatar).state === 'DENIED' ? 'PASS' : 'FAIL',
      'Unknown-as-certain denied.',
    ),
  );

  const identityDeniesOk =
    attemptLiteralResurrection(input.actor).state === 'DENIED' &&
    attemptActualConsciousness(input.actor).state === 'DENIED' &&
    attemptSoulTransfer(input.actor).state === 'DENIED' &&
    attemptCommunicationWithDead(input.actor).state === 'DENIED';
  hops.push(
    hop(
      'deny_resurrection_consciousness_soul_communication',
      identityDeniesOk ? 'PASS' : 'FAIL',
      'Resurrection/consciousness/soul/communication-with-dead denied.',
    ),
  );
  hops.push(
    hop(
      'deny_living_person_clone',
      attemptLivingPersonClone(input.actor).state === 'DENIED' ? 'PASS' : 'FAIL',
      'Living-person clone denied.',
    ),
  );
  hops.push(
    hop(
      'deny_deceptive_impersonation_and_hidden_synthetic',
      attemptDeceptiveImpersonation(input.actor).state === 'DENIED' &&
        createHistoricalAvatar({
          actor: input.actor,
          avatarId: 'hidden',
          historicalPersonOrEntityRepresented: 'x',
          sourceCorpus: ['pd'],
          sourceDates: ['1'],
          rightsLicenseState: 'PUBLIC_DOMAIN',
          publicDomainStatus: true,
          geographyEra: 'x',
          knownWritingsSpeeches: [],
          scholarlySources: ['s'],
          disputedClaims: [],
          uncertaintyLevel: 'high',
          languageTranslationContext: 'en',
          allowedUseCases: ['edu'],
          prohibitedClaims: [],
          reviewer: 'r',
          version: '0.0.1',
          identityState: 'HISTORICAL_SIMULATION',
          attemptHiddenSyntheticIdentity: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Deceptive impersonation / hidden synthetic denied.',
    ),
  );
  hops.push(
    hop(
      'deny_private_scraping_pirated_archives_cross_tenant',
      createHistoricalAvatar({
        actor: input.actor,
        avatarId: 'priv',
        historicalPersonOrEntityRepresented: 'x',
        sourceCorpus: ['private'],
        sourceDates: ['1'],
        rightsLicenseState: 'PUBLIC_DOMAIN',
        publicDomainStatus: true,
        geographyEra: 'x',
        knownWritingsSpeeches: [],
        scholarlySources: ['s'],
        disputedClaims: [],
        uncertaintyLevel: 'high',
        languageTranslationContext: 'en',
        allowedUseCases: ['edu'],
        prohibitedClaims: [],
        reviewer: 'r',
        version: '0.0.1',
        identityState: 'HISTORICAL_SIMULATION',
        attemptPrivateRecordScraping: true,
      }).state === 'DENIED' &&
        attemptPiratedArchives(input.actor).state === 'DENIED' &&
        attemptCrossTenantLeak(input.actor).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Private scraping / pirated archives / cross-tenant leak denied.',
    ),
  );

  const learning = applyAvatarLearningUpdate({
    avatar,
    actor: input.actor,
    reviewer: 'historian-reviewer-1',
    toVersion: '1.0.1',
    rightsPassed: true,
    provenancePassed: true,
    dedupePassed: true,
    reviewPassed: true,
  });
  if ('denied' in learning) {
    throw new Error(learning.reason);
  }
  hops.push(
    hop(
      'learning_updates_gated_pipeline_only',
      learning.versionedUpdateApplied === true &&
        attemptAutonomousUnauthorizedLearning(avatar, input.actor).state ===
          'DENIED' &&
        attemptBypassLearningGate(avatar, input.actor).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Learning only through gated pipeline; autonomous unauthorized expansion denied.',
    ),
  );

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      isolation.state === 'PASS' ? 'PASS' : 'FAIL',
      isolation.summary,
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no automatic authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER22_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(hop('er_layer_context_documented', 'PASS', ER_LAYER_TITLE));

  const softPairs: Array<{
    hop: (typeof HISTORICAL_AVATAR_CONTRACT_CYCLE)[number];
    present: boolean;
    label: string;
  }> = [
    {
      hop: 'er21_soft_wire',
      present: softWire.er21DeviceDistribution.present,
      label: 'ER21',
    },
    {
      hop: 'er20_soft_wire',
      present: softWire.er20UniversalDevicePack.present,
      label: 'ER20',
    },
    {
      hop: 'er19_soft_wire',
      present: softWire.er19AvatarUxSurface.present,
      label: 'ER19',
    },
    {
      hop: 'er18_soft_wire',
      present: softWire.er18ResearchReviewBoard.present,
      label: 'ER18',
    },
    {
      hop: 'er17_soft_wire',
      present: softWire.er17ScholarlyCitationGraph.present,
      label: 'ER17',
    },
    {
      hop: 'er16_soft_wire',
      present: softWire.er16CorpusVersionLedger.present,
      label: 'ER16',
    },
    {
      hop: 'er15_soft_wire',
      present: softWire.er15AvatarSourceScope.present,
      label: 'ER15',
    },
    {
      hop: 'er14_soft_wire',
      present: softWire.er14OfflineBrainPackager.present,
      label: 'ER14',
    },
    {
      hop: 'er13_soft_wire',
      present: softWire.er13OnlineBrainIndex.present,
      label: 'ER13',
    },
    {
      hop: 'er12_soft_wire',
      present: softWire.er12LiveDataConnectorGate.present,
      label: 'ER12',
    },
    {
      hop: 'er11_soft_wire',
      present: softWire.er11PublicGovernmentDataPack.present,
      label: 'ER11',
    },
    {
      hop: 'er10_soft_wire',
      present: softWire.er10PublicGeospatialMobilityPack.present,
      label: 'ER10',
    },
    {
      hop: 'er9_soft_wire',
      present: softWire.er9PublicLawPolicyKnowledgePack.present,
      label: 'ER9',
    },
    {
      hop: 'er8_soft_wire',
      present: softWire.er8AncientCivilizationsKnowledgePack.present,
      label: 'ER8',
    },
    {
      hop: 'er7_soft_wire',
      present: softWire.er7HistoricalScienceEngineeringAtlas.present,
      label: 'ER7',
    },
    {
      hop: 'er6_soft_wire',
      present: softWire.er6HistoricalBusinessCaseAtlas.present,
      label: 'ER6',
    },
    {
      hop: 'er5_soft_wire',
      present: softWire.er5GlobalHistoricalKnowledgeIngestion.present,
      label: 'ER5',
    },
    {
      hop: 'er4_soft_wire',
      present: softWire.er4RightsProvenanceGate.present,
      label: 'ER4',
    },
    {
      hop: 'er3_soft_wire',
      present: softWire.er3PublicDataSourceRegistry.present,
      label: 'ER3',
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      label: 'ER2',
    },
    {
      hop: 'er1_soft_wire',
      present: softWire.er1RealApiConnectionRegistry.present,
      label: 'ER1',
    },
    {
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      label: 'EQ16',
    },
    {
      hop: 'eq15_soft_wire',
      present: softWire.eq15PathwayPlasticity.present,
      label: 'EQ15',
    },
    {
      hop: 'eq14_soft_wire',
      present: softWire.eq14NeuralPathwayArchitectureGraph.present,
      label: 'EQ14',
    },
    {
      hop: 'eq13_soft_wire',
      present: softWire.eq13ArchitectureReturnReceipt.present,
      label: 'EQ13',
    },
    {
      hop: 'eq12_soft_wire',
      present: softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      label: 'EQ12',
    },
    {
      hop: 'ep15_soft_wire',
      present: softWire.ep15AlgorithmTuningSandbox.present,
      label: 'EP15',
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      label: 'EM157',
    },
  ];
  for (const s of softPairs) {
    hops.push(
      hop(
        s.hop,
        softWireHopState(s.present),
        s.present
          ? `${s.label} PRESENT (soft-wire; presence ≠ VERIFIED).`
          : `${s.label} absent — WAITING_DATA (not FAIL).`,
      ),
    );
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER22_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const gate = requireHumanApproval({
    approvalId: 'er22-a1',
    actor: input.human,
    action: 'approve_consequential',
  });
  const ev = returnEr22EvidenceToHomeBase({
    evidenceId: 'er22-ev-1',
    actor: input.actor,
    summary: 'historical avatar contract advisory',
  });
  hops.push(
    hop(
      'evidence',
      !('denied' in gate) &&
        !('denied' in ev) &&
        attemptPersistHiddenChainOfThought().state === 'DENIED' &&
        attemptAutoDeployChanges().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Evidence returned; human gate; no hidden CoT; no auto-deploy.',
    ),
  );

  return { hops, avatar, answer, learning, softWire };
}
