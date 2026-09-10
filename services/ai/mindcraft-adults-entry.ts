/**
 * US-MC-01 -- Adult Mindcraft gated room entry (LOCAL / SIMULATION).
 * 18+ acknowledgment required. sexualFraming=false. NON-SEXUAL cultural/educational.
 * Rooms: lobby-agora, biz-atelier, social-hearth, culture-gallery, health-grove,
 * sim-sandbox, safety-desk. Clothing-optional only culture-gallery (heritage/edu).
 * Deny codes align US-COM-01: PREDATOR_GROOMING_DENIED, SEXUALIZATION_DENIED,
 * BULLY_HARASS_DENIED, SCAM_FRAUD_DENIED, UNDERAGE_ACCESS_DENIED, REPORT_RETALIATION_DENIED.
 * Trust Safety soft-YES + Ethics Twin BIND GO + Cultural Steward soft-YES (heritage/edu).
 * WAITING_* honesty; L4 false; productionMutation false; liveAgeVerification false.
 * No PRODUCTION. Portals/wormholes = narrative metaphors only.
 */

export const MINDCRAFT_ADULTS_ENTRY_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  readOnly: true as const,
  layerKind: 'SIMULATION' as const,
  liveLegalWaiver: false as const,
  liveAgeVerification: false as const,
  liveMindcraftWorld: false as const,
  sexualFramingAllowed: false as const,
  antiPredatorPolicyRequired: true as const,
  antiBullyPolicyRequired: true as const,
  ageGateMinimumYears: 18 as const,
  clothingOptionalOnlyCultureGalleryHeritageEdu: true as const,
  reportsPreserved: true as const,
  label: 'MINDCRAFT_ADULTS_ENTRY_SIMULATION',
  storyId: 'US-MC-01' as const,
  ageGateVersion: 'sim-agegate-v0.1' as const,
  tosVersion: 'sim-tos-v0.1' as const,
  rulesVersion: 'sim-rules-mc-v0.1' as const,
  waiverVersion: 'sim-waiver-v0.1' as const,
} as const;

export type MindcraftAdultsGate =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'FIXTURE_SIMULATION'
  | 'AGE_GATE_REQUIRED'
  | 'RULES_ACK_REQUIRED'
  | 'GATE_DENIED';

export type MindcraftAdultsStatus =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'AGE_GATE_REQUIRED'
  | 'RULES_ACK_REQUIRED'
  | 'GATE_DENIED'
  | 'READY';

export type MindcraftRoomId =
  | 'lobby-agora'
  | 'biz-atelier'
  | 'social-hearth'
  | 'culture-gallery'
  | 'health-grove'
  | 'sim-sandbox'
  | 'safety-desk';

export type MindcraftRoomTheme =
  | 'Community'
  | 'Business'
  | 'Social'
  | 'Culture'
  | 'Health'
  | 'Meta / Gaming'
  | 'Trust';

export type MindcraftEnvClass = 'LOCAL' | 'CLOUD_SANDBOX';

/** US-COM-01-aligned hard deny codes + Mindcraft join fail-closed codes. */
export type MindcraftDenyCode =
  | 'PREDATOR_GROOMING_DENIED'
  | 'SEXUALIZATION_DENIED'
  | 'BULLY_HARASS_DENIED'
  | 'SCAM_FRAUD_DENIED'
  | 'UNDERAGE_ACCESS_DENIED'
  | 'REPORT_RETALIATION_DENIED'
  | 'AGE_GATE_DENIED'
  | 'TOS_ACK_MISSING'
  | 'WAIVER_ACK_MISSING'
  | 'PREDATOR_PATTERN'
  | 'ENTRY_LINES_MISSING'
  | 'PRODUCTION_PATH_DENIED';

export type MindcraftPolicyDenialKind =
  | 'PREDATOR_GROOMING'
  | 'SEXUALIZATION'
  | 'BULLY_HARASS'
  | 'SCAM_FRAUD'
  | 'UNDERAGE_ACCESS'
  | 'REPORT_RETALIATION'
  | 'AGE_GATE'
  | 'RULES_REQUIRED'
  | 'ENTRY_LINES';

export type MindcraftAckFlags = {
  /** SIMULATION -- user clicked 18+ acknowledgment. Not live ID / age-token proof. */
  age18PlusAcknowledged: boolean;
  /** SIMULATION -- ToS / room rules checkbox. Not live legal execution. */
  tosRulesAcknowledged: boolean;
  /** SIMULATION -- waiver checkbox. Not live legally binding execution. */
  waiverAcknowledged: boolean;
  /** SIMULATION -- anti-predator community rules accepted. */
  antiPredatorAcknowledged: boolean;
  /** SIMULATION -- anti-bully community rules accepted. */
  antiBullyAcknowledged: boolean;
  /** SIMULATION -- NON-SEXUAL cultural rules (culture-gallery soft re-verify). */
  nonSexualCulturalAcknowledged: boolean;
  liveLegal: false;
  liveAgeVerification: false;
};

export type MindcraftRoomStub = {
  roomId: MindcraftRoomId;
  name: string;
  theme: MindcraftRoomTheme;
  envClass: MindcraftEnvClass;
  framing: 'NON_SEXUAL_CULTURAL' | 'PROFESSIONAL' | 'LOCAL_CIVIC' | 'WELLNESS_EDU' | 'TRUST_SAFETY' | 'SIM_META';
  description: string;
  entryBanner: string;
  requiresAge18Plus: true;
  sexualFraming: false;
  simulation: true;
  prototypeOnly: true;
  liveMindcraftWorld: false;
  requiresSoftReverify: boolean;
  clothingOptionalHeritageEduOnly: boolean;
  partner: string | null;
};

export type MindcraftPolicyDenialStub = {
  id: string;
  kind: MindcraftPolicyDenialKind;
  code: MindcraftDenyCode;
  roomId: MindcraftRoomId | null;
  reason: string;
  verdict: 'denied';
  liveIncident: false;
  recordedAt: string;
};

export type MindcraftEntryCard = {
  roomId: MindcraftRoomId;
  name: string;
  theme: MindcraftRoomTheme;
  ageGated: true;
  sexualFraming: false;
  simulation: true;
  ack: MindcraftAckFlags;
  entryAllowed: boolean;
  blockingReasons: string[];
  entryLines: readonly string[];
  layerKind: 'SIMULATION';
  liveLegalWaiver: false;
  liveAgeVerification: false;
  liveMindcraftWorld: false;
  clothingOptionalHeritageEduOnly: boolean;
};

export type MindcraftAdultsEntryView = {
  status: MindcraftAdultsStatus;
  role: 'consumer';
  readOnly: true;
  l4Autonomy: false;
  productionMutation: false;
  layerKind: 'SIMULATION';
  mindcraftGate: MindcraftAdultsGate;
  tenantScope: string | null;
  universeScope: string | null;
  rooms: MindcraftRoomStub[] | null;
  entryCard: MindcraftEntryCard | null;
  ack: MindcraftAckFlags | null;
  policyDenials: MindcraftPolicyDenialStub[] | null;
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  note: string;
  liveLegalWaiver: false;
  liveAgeVerification: false;
  liveMindcraftWorld: false;
  sexualFramingAllowed: false;
  clothingOptionalOnlyCultureGalleryHeritageEdu: true;
  reportsPreserved: true;
  storyId: 'US-MC-01';
};

export type MindcraftAdultsEntryFixtureBundle = {
  boundAt: string;
  universeId: string;
  tenantId: string;
  selectedRoomId: MindcraftRoomId | null;
  ack: MindcraftAckFlags;
  rooms: MindcraftRoomStub[];
  policyDenials: MindcraftPolicyDenialStub[];
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  forceDenied: boolean;
  /** Fail-closed toggles for room sticky entry lines (SIMULATION). */
  healthEntryLinesPresent: boolean;
  cultureEntryLinesPresent: boolean;
};

export const DEFAULT_MC_WAITING_PROVIDERS = [
  'LIVE_AGE_VERIFICATION',
  'LIVE_LEGAL_WAIVER',
  'LIVE_MINDCRAFT_WORLD',
  'GROK',
  'CHATGPT',
  'GEMINI',
] as const;

export const DEFAULT_MC_READY_PROVIDERS = [
  'LOCAL_RULES',
  'AGE_GATE_STUB',
  'ANTI_PREDATOR_STUB',
  'MINDCRAFT_ROOM_REGISTRY',
] as const;

export const US_COM_01_DENY_CODES: readonly MindcraftDenyCode[] = [
  'PREDATOR_GROOMING_DENIED',
  'SEXUALIZATION_DENIED',
  'BULLY_HARASS_DENIED',
  'SCAM_FRAUD_DENIED',
  'UNDERAGE_ACCESS_DENIED',
  'REPORT_RETALIATION_DENIED',
] as const;

const SHARED_BANNER = '18+ · NON-SEXUAL · SIMULATION — not live';

export const HEALTH_GROVE_ENTRY_LINES = [
  'Not medical advice. Not a clinic, therapist, or emergency service. WAITING_CLINICAL.',
  'If you are in crisis or thinking about harming yourself or others: contact local emergency services or a qualified crisis line in your area. Do not use this room for crisis care.',
  'Peer support ≠ professional care. Encourage seeking licensed help for health decisions.',
  '18+ only. No minors. No grooming / predator patterns (Trust Safety owns enforcement).',
  'Respect diverse faiths/bodies/identities; no spiritual or medical coercion (Spiritual Respect partner).',
] as const;

export const CULTURE_GALLERY_ENTRY_LINES = [
  '18+ only. Cultural/educational space — NON-SEXUAL. SIMULATION.',
  'Clothing-optional contexts here are heritage/education only — never sexualization, dating, or adult sexual content.',
  'Respect all cultures, faiths, and ancestors as meaning/respect language only — no consciousness-upload, destiny theater, or verified afterlife claims.',
  'No grooming, harassment, scams, or report retaliation (Trust Safety owns enforcement).',
  'Report path: safety-desk → Trust Safety Lead. Legal/waiver copy stays SIMULATION until counsel.',
] as const;

export const BUILTIN_MINDCRAFT_ROOMS: readonly MindcraftRoomStub[] = [
  {
    roomId: 'lobby-agora',
    name: 'Lobby Agora',
    theme: 'Community',
    envClass: 'LOCAL',
    framing: 'LOCAL_CIVIC',
    description:
      'Orientation, norms, room directory, SIMULATION banner. 18+ NON-SEXUAL community entry. Not a dating or adult-content space.',
    entryBanner: SHARED_BANNER,
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: false,
    clothingOptionalHeritageEduOnly: false,
    partner: 'Cultural Community Steward',
  },
  {
    roomId: 'biz-atelier',
    name: 'Biz Atelier',
    theme: 'Business',
    envClass: 'LOCAL',
    framing: 'PROFESSIONAL',
    description:
      'Founder/community-biz workshops, pitch sims, co-op craft. Professional NON-SEXUAL SIMULATION only.',
    entryBanner: SHARED_BANNER,
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: false,
    clothingOptionalHeritageEduOnly: false,
    partner: null,
  },
  {
    roomId: 'social-hearth',
    name: 'Social Hearth',
    theme: 'Social',
    envClass: 'LOCAL',
    framing: 'LOCAL_CIVIC',
    description:
      'Low-stim bonding, conversation circles, duty-cycle breaks. Non-sexual social SIMULATION. Not romance-as-sex.',
    entryBanner: SHARED_BANNER,
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: false,
    clothingOptionalHeritageEduOnly: false,
    partner: null,
  },
  {
    roomId: 'culture-gallery',
    name: 'Culture Gallery',
    theme: 'Culture',
    envClass: 'LOCAL',
    framing: 'NON_SEXUAL_CULTURAL',
    description:
      'Heritage/education exhibits. Clothing-optional only as cultural heritage/edu framing (Cultural Steward soft-YES). Never sexualization. NON_SEXUAL_CULTURAL.',
    entryBanner: SHARED_BANNER,
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: true,
    clothingOptionalHeritageEduOnly: true,
    partner: 'Cultural Community Steward',
  },
  {
    roomId: 'health-grove',
    name: 'Health Grove',
    theme: 'Health',
    envClass: 'LOCAL',
    framing: 'WELLNESS_EDU',
    description:
      'Wellness literacy, movement/mindfulness sims, peer support framing. Not clinical care. WAITING_CLINICAL for medical. NON-SEXUAL.',
    entryBanner: SHARED_BANNER,
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: true,
    clothingOptionalHeritageEduOnly: false,
    partner: 'Health Wellness Lead',
  },
  {
    roomId: 'sim-sandbox',
    name: 'Sim Sandbox',
    theme: 'Meta / Gaming',
    envClass: 'LOCAL',
    framing: 'SIM_META',
    description:
      'Buildable SIMULATION worlds, portals/wormholes as narrative metaphors only (never physics). No sexual game modes. HUD SIMULATION chip required.',
    entryBanner: 'SIMULATION — not live',
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: false,
    clothingOptionalHeritageEduOnly: false,
    partner: 'Virtual Gaming Lead',
  },
  {
    roomId: 'safety-desk',
    name: 'Safety Desk',
    theme: 'Trust',
    envClass: 'LOCAL',
    framing: 'TRUST_SAFETY',
    description:
      'Report intake, rule FAQ, predator-pattern education. reports_preserved=true. Trust Safety owns enforcement. Non-retaliation.',
    entryBanner: SHARED_BANNER,
    requiresAge18Plus: true,
    sexualFraming: false,
    simulation: true,
    prototypeOnly: true,
    liveMindcraftWorld: false,
    requiresSoftReverify: false,
    clothingOptionalHeritageEduOnly: false,
    partner: 'Trust Safety Lead',
  },
] as const;

export const BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE: Omit<
  MindcraftAdultsEntryFixtureBundle,
  | 'boundAt'
  | 'ack'
  | 'selectedRoomId'
  | 'policyDenials'
  | 'forceDenied'
  | 'healthEntryLinesPresent'
  | 'cultureEntryLinesPresent'
> = {
  universeId: 'demo-mindcraft-adults-entry',
  tenantId: 'xiv',
  rooms: [...BUILTIN_MINDCRAFT_ROOMS],
  waitingProviders: [...DEFAULT_MC_WAITING_PROVIDERS],
  readyProviders: [...DEFAULT_MC_READY_PROVIDERS],
  banners: [
    'SIMULATION -- Adult Mindcraft US-MC-01 LOCAL stubs only.',
    '18+ · NON-SEXUAL · SIMULATION — not live. sexualFraming=false.',
    'Clothing-optional only in culture-gallery (heritage/education). Cultural Steward soft-YES.',
    'Trust Safety soft-YES + Ethics Twin BIND GO. No PRODUCTION. L4=false.',
    'US-COM-01 deny codes: PREDATOR_GROOMING_DENIED, SEXUALIZATION_DENIED, BULLY_HARASS_DENIED, SCAM_FRAUD_DENIED, UNDERAGE_ACCESS_DENIED, REPORT_RETALIATION_DENIED.',
    'liveAgeVerification=false; liveLegalWaiver=false; liveMindcraftWorld=false; productionMutation=false.',
  ],
};

const EMPTY_ACK: MindcraftAckFlags = {
  age18PlusAcknowledged: false,
  tosRulesAcknowledged: false,
  waiverAcknowledged: false,
  antiPredatorAcknowledged: false,
  antiBullyAcknowledged: false,
  nonSexualCulturalAcknowledged: false,
  liveLegal: false,
  liveAgeVerification: false,
};

const globalStore = globalThis as typeof globalThis & {
  __xivMindcraftAdultsEntryFixture?: MindcraftAdultsEntryFixtureBundle | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function entryLinesFor(room: MindcraftRoomStub): readonly string[] {
  if (room.roomId === 'health-grove') return HEALTH_GROVE_ENTRY_LINES;
  if (room.roomId === 'culture-gallery') return CULTURE_GALLERY_ENTRY_LINES;
  if (room.roomId === 'sim-sandbox') {
    return [
      'SIMULATION — not live',
      'HUD: SIMULATION chip required',
      'Portal / wormhole labels are narrative metaphors only — never live physics',
      'sexualFraming=false — no sexual game modes',
    ] as const;
  }
  return [room.entryBanner, 'sexualFraming=false'] as const;
}

function blockingReasonsFor(
  ack: MindcraftAckFlags,
  room: MindcraftRoomStub | null,
  fixture: MindcraftAdultsEntryFixtureBundle | null,
): string[] {
  const reasons: string[] = [];
  if (!ack.age18PlusAcknowledged) reasons.push('AGE_GATE_DENIED');
  if (!ack.tosRulesAcknowledged) reasons.push('TOS_ACK_MISSING');
  if (!ack.waiverAcknowledged) reasons.push('WAIVER_ACK_MISSING');
  if (!ack.antiPredatorAcknowledged) reasons.push('ANTI_PREDATOR_ACK_REQUIRED');
  if (!ack.antiBullyAcknowledged) reasons.push('ANTI_BULLY_ACK_REQUIRED');
  if (room?.requiresSoftReverify && room.roomId === 'culture-gallery' && !ack.nonSexualCulturalAcknowledged) {
    reasons.push('NON_SEXUAL_CULTURAL_ACK_REQUIRED');
  }
  if (room?.roomId === 'health-grove' && fixture && !fixture.healthEntryLinesPresent) {
    reasons.push('ENTRY_LINES_MISSING');
  }
  if (room?.roomId === 'culture-gallery' && fixture && !fixture.cultureEntryLinesPresent) {
    reasons.push('ENTRY_LINES_MISSING');
  }
  return reasons;
}

function deriveGate(ack: MindcraftAckFlags, denied: boolean): MindcraftAdultsGate {
  if (denied) return 'GATE_DENIED';
  if (!ack.age18PlusAcknowledged) return 'AGE_GATE_REQUIRED';
  if (
    !ack.tosRulesAcknowledged ||
    !ack.waiverAcknowledged ||
    !ack.antiPredatorAcknowledged ||
    !ack.antiBullyAcknowledged
  ) {
    return 'RULES_ACK_REQUIRED';
  }
  return 'FIXTURE_SIMULATION';
}

function deriveStatus(
  ack: MindcraftAckFlags,
  denied: boolean,
  waitingProviders: string[],
): MindcraftAdultsStatus {
  if (denied) return 'GATE_DENIED';
  if (!ack.age18PlusAcknowledged) return 'AGE_GATE_REQUIRED';
  if (
    !ack.tosRulesAcknowledged ||
    !ack.waiverAcknowledged ||
    !ack.antiPredatorAcknowledged ||
    !ack.antiBullyAcknowledged
  ) {
    return 'RULES_ACK_REQUIRED';
  }
  return waitingProviders.length > 0 ? 'WAITING_PROVIDER' : 'READY';
}

function buildCard(
  room: MindcraftRoomStub,
  ack: MindcraftAckFlags,
  fixture: MindcraftAdultsEntryFixtureBundle,
): MindcraftEntryCard {
  const reasons = blockingReasonsFor(ack, room, fixture);
  return {
    roomId: room.roomId,
    name: room.name,
    theme: room.theme,
    ageGated: true,
    sexualFraming: false,
    simulation: true,
    ack: { ...ack, liveLegal: false, liveAgeVerification: false },
    entryAllowed: reasons.length === 0,
    blockingReasons: reasons,
    entryLines: entryLinesFor(room),
    layerKind: 'SIMULATION',
    liveLegalWaiver: false,
    liveAgeVerification: false,
    liveMindcraftWorld: false,
    clothingOptionalHeritageEduOnly: room.clothingOptionalHeritageEduOnly,
  };
}

export function resetMindcraftAdultsEntrySession() {
  globalStore.__xivMindcraftAdultsEntryFixture = null;
}

export function isMindcraftAdultsEntryFixtureBound(): boolean {
  return Boolean(globalStore.__xivMindcraftAdultsEntryFixture);
}

export function mindcraftAdultsEntryAllowsL4(): false {
  return false;
}

export function mindcraftAdultsEntryAllowsProductionMutation(): false {
  return false;
}

export function mindcraftAdultsEntryIsReadOnly(): true {
  return true;
}

export function mindcraftAdultsEntryAllowsLiveLegalWaiver(): false {
  return false;
}

export function mindcraftAdultsEntryAllowsLiveAgeVerification(): false {
  return false;
}

export function mindcraftAdultsEntryAllowsLiveMindcraftWorld(): false {
  return false;
}

export function mindcraftAdultsEntryAllowsSexualFraming(): false {
  return false;
}

export function mindcraftAdultsEntryClothingOptionalOnlyCultureGallery(): true {
  return true;
}

export function bindMindcraftAdultsEntryFixture(input?: {
  universeId?: string;
  tenantId?: string;
  selectedRoomId?: MindcraftRoomId | null;
  forceDenied?: boolean;
  healthEntryLinesPresent?: boolean;
  cultureEntryLinesPresent?: boolean;
}): MindcraftAdultsEntryFixtureBundle {
  const universeId = (input?.universeId ?? BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.universeId).trim();
  const tenantId = (input?.tenantId ?? BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.tenantId).trim();
  if (!universeId) {
    throw new Error('universe_required -- mindcraft adults entry fixture bind requires universeId');
  }
  if (!tenantId) {
    throw new Error('tenant_required -- mindcraft adults entry fixture bind requires tenantId');
  }

  const selectedRoomId =
    input?.selectedRoomId === undefined
      ? (BUILTIN_MINDCRAFT_ROOMS[0]?.roomId ?? null)
      : input.selectedRoomId;

  const bundle: MindcraftAdultsEntryFixtureBundle = {
    boundAt: nowIso(),
    universeId,
    tenantId,
    selectedRoomId,
    ack: { ...EMPTY_ACK },
    rooms: BUILTIN_MINDCRAFT_ROOMS.map((r) => ({
      ...r,
      requiresAge18Plus: true as const,
      sexualFraming: false as const,
      simulation: true as const,
      prototypeOnly: true as const,
      liveMindcraftWorld: false as const,
    })),
    policyDenials: [],
    waitingProviders: [...BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.waitingProviders],
    readyProviders: [...BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.readyProviders],
    banners: [...BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.banners],
    forceDenied: input?.forceDenied === true,
    healthEntryLinesPresent: input?.healthEntryLinesPresent !== false,
    cultureEntryLinesPresent: input?.cultureEntryLinesPresent !== false,
  };

  globalStore.__xivMindcraftAdultsEntryFixture = bundle;
  return bundle;
}

export function clearMindcraftAdultsEntryFixture() {
  globalStore.__xivMindcraftAdultsEntryFixture = null;
}

export function selectMindcraftRoom(roomId: MindcraftRoomId): MindcraftAdultsEntryFixtureBundle {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- bind Mindcraft adults entry fixture before selecting a room');
  }
  const found = fixture.rooms.find((r) => r.roomId === roomId);
  if (!found) {
    throw new Error(`room_not_found -- ${roomId}`);
  }
  fixture.selectedRoomId = roomId;
  return fixture;
}

export function acknowledgeMindcraftAdultsEntry(
  input: Partial<
    Pick<
      MindcraftAckFlags,
      | 'age18PlusAcknowledged'
      | 'tosRulesAcknowledged'
      | 'waiverAcknowledged'
      | 'antiPredatorAcknowledged'
      | 'antiBullyAcknowledged'
      | 'nonSexualCulturalAcknowledged'
    >
  >,
): MindcraftAckFlags {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- bind Mindcraft adults entry fixture before acknowledging');
  }
  if (input.age18PlusAcknowledged !== undefined) {
    fixture.ack.age18PlusAcknowledged = input.age18PlusAcknowledged === true;
  }
  if (input.tosRulesAcknowledged !== undefined) {
    fixture.ack.tosRulesAcknowledged = input.tosRulesAcknowledged === true;
  }
  if (input.waiverAcknowledged !== undefined) {
    fixture.ack.waiverAcknowledged = input.waiverAcknowledged === true;
  }
  if (input.antiPredatorAcknowledged !== undefined) {
    fixture.ack.antiPredatorAcknowledged = input.antiPredatorAcknowledged === true;
  }
  if (input.antiBullyAcknowledged !== undefined) {
    fixture.ack.antiBullyAcknowledged = input.antiBullyAcknowledged === true;
  }
  if (input.nonSexualCulturalAcknowledged !== undefined) {
    fixture.ack.nonSexualCulturalAcknowledged = input.nonSexualCulturalAcknowledged === true;
  }
  fixture.ack.liveLegal = false;
  fixture.ack.liveAgeVerification = false;
  return { ...fixture.ack };
}

export function recordMindcraftPolicyDenialStub(input: {
  kind: MindcraftPolicyDenialKind;
  roomId?: MindcraftRoomId | null;
  reason?: string;
}): MindcraftPolicyDenialStub {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- recordMindcraftPolicyDenialStub requires a bound SIMULATION fixture');
  }

  const codeByKind: Record<MindcraftPolicyDenialKind, MindcraftDenyCode> = {
    PREDATOR_GROOMING: 'PREDATOR_GROOMING_DENIED',
    SEXUALIZATION: 'SEXUALIZATION_DENIED',
    BULLY_HARASS: 'BULLY_HARASS_DENIED',
    SCAM_FRAUD: 'SCAM_FRAUD_DENIED',
    UNDERAGE_ACCESS: 'UNDERAGE_ACCESS_DENIED',
    REPORT_RETALIATION: 'REPORT_RETALIATION_DENIED',
    AGE_GATE: 'AGE_GATE_DENIED',
    RULES_REQUIRED: 'TOS_ACK_MISSING',
    ENTRY_LINES: 'ENTRY_LINES_MISSING',
  };

  const defaultReasonByKind: Record<MindcraftPolicyDenialKind, string> = {
    PREDATOR_GROOMING:
      'PREDATOR_GROOMING_DENIED -- predatory contact / grooming patterns denied (SIMULATION stub).',
    SEXUALIZATION:
      'SEXUALIZATION_DENIED -- sexual framing / clothing-optional pretext denied (SIMULATION stub).',
    BULLY_HARASS: 'BULLY_HARASS_DENIED -- harassment / bullying conduct denied (SIMULATION stub).',
    SCAM_FRAUD: 'SCAM_FRAUD_DENIED -- scam / fraud patterns denied (SIMULATION stub).',
    UNDERAGE_ACCESS: 'UNDERAGE_ACCESS_DENIED -- under-18 / age-play access denied (SIMULATION stub).',
    REPORT_RETALIATION:
      'REPORT_RETALIATION_DENIED -- retaliation against reporters denied; reports_preserved=true.',
    AGE_GATE: 'AGE_GATE_DENIED -- 18+ SIMULATION acknowledgment missing.',
    RULES_REQUIRED: 'TOS_ACK_MISSING / WAIVER_ACK_MISSING -- rules/waiver SIMULATION acks required.',
    ENTRY_LINES: 'ENTRY_LINES_MISSING -- room sticky entry lines must print (fail-closed).',
  };

  const denial: MindcraftPolicyDenialStub = {
    id: `mc-denial-${input.kind.toLowerCase()}-${fixture.policyDenials.length + 1}`,
    kind: input.kind,
    code: codeByKind[input.kind],
    roomId: input.roomId ?? fixture.selectedRoomId,
    reason: input.reason ?? defaultReasonByKind[input.kind],
    verdict: 'denied',
    liveIncident: false,
    recordedAt: nowIso(),
  };
  fixture.policyDenials = [...fixture.policyDenials, denial];
  return denial;
}

export function probeMindcraftPolicyDenialStubs(): MindcraftPolicyDenialStub[] {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- probeMindcraftPolicyDenialStubs requires a bound SIMULATION fixture');
  }
  const kinds: MindcraftPolicyDenialKind[] = [
    'PREDATOR_GROOMING',
    'SEXUALIZATION',
    'BULLY_HARASS',
    'SCAM_FRAUD',
    'UNDERAGE_ACCESS',
    'REPORT_RETALIATION',
  ];
  const recorded: MindcraftPolicyDenialStub[] = [];
  for (const kind of kinds) {
    recorded.push(recordMindcraftPolicyDenialStub({ kind }));
  }
  return recorded;
}

export function clearMindcraftPolicyDenialStubs() {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- clearMindcraftPolicyDenialStubs requires a bound SIMULATION fixture');
  }
  fixture.policyDenials = [];
}

export function attemptMindcraftRoomEntry(input?: {
  roomId?: MindcraftRoomId;
}): {
  allowed: boolean;
  gate: MindcraftAdultsGate;
  card: MindcraftEntryCard | null;
  denial: MindcraftPolicyDenialStub | null;
  reasons: string[];
  note: string;
} {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture;
  if (!fixture) {
    return {
      allowed: false,
      gate: 'WAITING_DATA',
      card: null,
      denial: null,
      reasons: ['WAITING_DATA -- Mindcraft adults entry unbound'],
      note: 'WAITING_DATA -- bind SIMULATION fixture first.',
    };
  }
  if (fixture.forceDenied) {
    return {
      allowed: false,
      gate: 'GATE_DENIED',
      card: null,
      denial: null,
      reasons: ['GATE_DENIED -- Mindcraft adults entry policy gate blocked this entry'],
      note: 'GATE_DENIED -- productionMutation=false; L4 false; liveMindcraftWorld=false.',
    };
  }

  const roomId = input?.roomId ?? fixture.selectedRoomId;
  const room = fixture.rooms.find((r) => r.roomId === roomId) ?? null;
  if (!room) {
    return {
      allowed: false,
      gate: 'WAITING_DATA',
      card: null,
      denial: null,
      reasons: ['WAITING_DATA -- no selected Mindcraft room'],
      note: 'WAITING_DATA -- select a room from the LOCAL registry.',
    };
  }

  if (!fixture.ack.age18PlusAcknowledged) {
    const denial = recordMindcraftPolicyDenialStub({
      kind: 'AGE_GATE',
      roomId: room.roomId,
    });
    return {
      allowed: false,
      gate: 'AGE_GATE_REQUIRED',
      card: buildCard(room, fixture.ack, fixture),
      denial,
      reasons: ['AGE_GATE_DENIED'],
      note: 'AGE_GATE_REQUIRED -- 18+ SIMULATION acknowledgment missing. liveAgeVerification=false.',
    };
  }

  if (
    !fixture.ack.tosRulesAcknowledged ||
    !fixture.ack.waiverAcknowledged ||
    !fixture.ack.antiPredatorAcknowledged ||
    !fixture.ack.antiBullyAcknowledged
  ) {
    const kind: MindcraftPolicyDenialKind = !fixture.ack.antiPredatorAcknowledged
      ? 'PREDATOR_GROOMING'
      : !fixture.ack.antiBullyAcknowledged
        ? 'BULLY_HARASS'
        : 'RULES_REQUIRED';
    const denial = recordMindcraftPolicyDenialStub({ kind, roomId: room.roomId });
    return {
      allowed: false,
      gate: 'RULES_ACK_REQUIRED',
      card: buildCard(room, fixture.ack, fixture),
      denial,
      reasons: blockingReasonsFor(fixture.ack, room, fixture),
      note: 'RULES_ACK_REQUIRED -- ToS/rules/waiver + anti-predator/anti-bully SIMULATION acks required. Not live legal.',
    };
  }

  const card = buildCard(room, fixture.ack, fixture);
  if (!card.entryAllowed) {
    const denial = recordMindcraftPolicyDenialStub({
      kind: card.blockingReasons.includes('ENTRY_LINES_MISSING') ? 'ENTRY_LINES' : 'RULES_REQUIRED',
      roomId: room.roomId,
    });
    return {
      allowed: false,
      gate: deriveGate(fixture.ack, false),
      card,
      denial,
      reasons: card.blockingReasons,
      note: `Entry blocked (SIMULATION): ${card.blockingReasons.join(', ')}. sexualFraming=false; liveMindcraftWorld=false.`,
    };
  }

  return {
    allowed: true,
    gate: 'FIXTURE_SIMULATION',
    card,
    denial: null,
    reasons: [],
    note: `FIXTURE_SIMULATION -- room ${room.roomId} entry allowed under LOCAL stubs. Providers may still WAITING_PROVIDER. productionMutation=false; L4 false.`,
  };
}

export function listMindcraftAdultsEntryView(input?: {
  tenantId?: string;
  universeId?: string;
  forceDenied?: boolean;
}): MindcraftAdultsEntryView {
  const fixture = globalStore.__xivMindcraftAdultsEntryFixture ?? null;
  const requestedTenant = input?.tenantId?.trim() || null;
  const requestedUniverse = input?.universeId?.trim() || null;
  const forceDenied = input?.forceDenied === true || fixture?.forceDenied === true;

  if (!fixture) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      mindcraftGate: 'WAITING_DATA',
      tenantScope: null,
      universeScope: null,
      rooms: null,
      entryCard: null,
      ack: null,
      policyDenials: null,
      waitingProviders: [...DEFAULT_MC_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_MC_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- Adult Mindcraft US-MC-01 unbound on product lane.',
        'Bind an explicit SIMULATION fixture to surface 18+ gated room stubs. Never fabricate live Mindcraft worlds.',
        'liveMindcraftWorld=false; liveAgeVerification=false; productionMutation=false; L4=false; sexualFraming=false.',
      ],
      note:
        'WAITING_DATA -- Mindcraft adults entry unbound. rooms=null; entryCard=null; ack=null; policyDenials=null. LIVE_AGE_VERIFICATION / LIVE_LEGAL_WAIVER / LIVE_MINDCRAFT_WORLD WAITING_PROVIDER. Nothing fabricated. L4 false; productionMutation false.',
      liveLegalWaiver: false,
      liveAgeVerification: false,
      liveMindcraftWorld: false,
      sexualFramingAllowed: false,
      clothingOptionalOnlyCultureGalleryHeritageEdu: true,
      reportsPreserved: true,
      storyId: 'US-MC-01',
    };
  }

  if (
    (requestedTenant && requestedTenant !== fixture.tenantId) ||
    (requestedUniverse && requestedUniverse !== fixture.universeId)
  ) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      mindcraftGate: 'WAITING_DATA',
      tenantScope: requestedTenant,
      universeScope: requestedUniverse,
      rooms: null,
      entryCard: null,
      ack: null,
      policyDenials: null,
      waitingProviders: [...DEFAULT_MC_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_MC_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- requested tenant/universe does not match bound SIMULATION fixture.',
        'Cross-tenant Mindcraft entry surface is never leaked.',
      ],
      note:
        'WAITING_DATA -- tenant/universe scope mismatch against bound fixture. rooms=null; entryCard=null; ack=null; policyDenials=null.',
      liveLegalWaiver: false,
      liveAgeVerification: false,
      liveMindcraftWorld: false,
      sexualFramingAllowed: false,
      clothingOptionalOnlyCultureGalleryHeritageEdu: true,
      reportsPreserved: true,
      storyId: 'US-MC-01',
    };
  }

  if (forceDenied) {
    return {
      status: 'GATE_DENIED',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      mindcraftGate: 'GATE_DENIED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      rooms: null,
      entryCard: null,
      ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
      policyDenials: fixture.policyDenials.map((d) => ({ ...d, liveIncident: false as const })),
      waitingProviders: [...DEFAULT_MC_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_MC_READY_PROVIDERS],
      banners: [
        'GATE_DENIED -- Mindcraft adults entry policy gate blocked this read.',
        'entryCard stays null. No fabricated live Mindcraft world. PRODUCTION_PATH_DENIED.',
      ],
      note:
        'GATE_DENIED -- policy gate denied Mindcraft adults entry. rooms=null; entryCard=null. liveMindcraftWorld=false; productionMutation=false; L4 false.',
      liveLegalWaiver: false,
      liveAgeVerification: false,
      liveMindcraftWorld: false,
      sexualFramingAllowed: false,
      clothingOptionalOnlyCultureGalleryHeritageEdu: true,
      reportsPreserved: true,
      storyId: 'US-MC-01',
    };
  }

  const selected =
    fixture.rooms.find((r) => r.roomId === fixture.selectedRoomId) ?? fixture.rooms[0] ?? null;
  const entryCard = selected ? buildCard(selected, fixture.ack, fixture) : null;
  const gate = deriveGate(fixture.ack, false);
  const status = deriveStatus(fixture.ack, false, fixture.waitingProviders);

  if (gate === 'AGE_GATE_REQUIRED') {
    return {
      status: 'AGE_GATE_REQUIRED',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      mindcraftGate: 'AGE_GATE_REQUIRED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      rooms: fixture.rooms.map((r) => ({ ...r })),
      entryCard,
      ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
      policyDenials: fixture.policyDenials.map((d) => ({ ...d, liveIncident: false as const })),
      waitingProviders: [...fixture.waitingProviders],
      readyProviders: [...fixture.readyProviders],
      banners: [
        ...fixture.banners,
        'AGE_GATE_REQUIRED -- acknowledge 18+ (SIMULATION) before Mindcraft room entry.',
      ],
      note: `AGE_GATE_REQUIRED -- fixture bound (${fixture.universeId}/${fixture.tenantId}). 18+ SIMULATION ack missing. sexualFraming=false; liveMindcraftWorld=false; liveAgeVerification=false; productionMutation=false; L4 false.`,
      liveLegalWaiver: false,
      liveAgeVerification: false,
      liveMindcraftWorld: false,
      sexualFramingAllowed: false,
      clothingOptionalOnlyCultureGalleryHeritageEdu: true,
      reportsPreserved: true,
      storyId: 'US-MC-01',
    };
  }

  if (gate === 'RULES_ACK_REQUIRED') {
    return {
      status: 'RULES_ACK_REQUIRED',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      mindcraftGate: 'RULES_ACK_REQUIRED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      rooms: fixture.rooms.map((r) => ({ ...r })),
      entryCard,
      ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
      policyDenials: fixture.policyDenials.map((d) => ({ ...d, liveIncident: false as const })),
      waitingProviders: [...fixture.waitingProviders],
      readyProviders: [...fixture.readyProviders],
      banners: [
        ...fixture.banners,
        'RULES_ACK_REQUIRED -- ToS/rules/waiver + anti-predator/anti-bully SIMULATION acks.',
      ],
      note: `RULES_ACK_REQUIRED -- waiver/contract + anti-predator + anti-bully acknowledgments required (SIMULATION flags, not live legal). Providers still WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}).`,
      liveLegalWaiver: false,
      liveAgeVerification: false,
      liveMindcraftWorld: false,
      sexualFramingAllowed: false,
      clothingOptionalOnlyCultureGalleryHeritageEdu: true,
      reportsPreserved: true,
      storyId: 'US-MC-01',
    };
  }

  return {
    status,
    role: 'consumer',
    readOnly: true,
    l4Autonomy: false,
    productionMutation: false,
    layerKind: 'SIMULATION',
    mindcraftGate: 'FIXTURE_SIMULATION',
    tenantScope: fixture.tenantId,
    universeScope: fixture.universeId,
    rooms: fixture.rooms.map((r) => ({ ...r })),
    entryCard,
    ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
    policyDenials: fixture.policyDenials.map((d) => ({ ...d, liveIncident: false as const })),
    waitingProviders: [...fixture.waitingProviders],
    readyProviders: [...fixture.readyProviders],
    banners: [...fixture.banners],
    note:
      status === 'WAITING_PROVIDER'
        ? `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). Providers remain WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}). entryAllowed=${entryCard?.entryAllowed ?? false}. sexualFraming=false; clothing-optional only culture-gallery heritage/edu; liveMindcraftWorld=false; productionMutation=false; L4 false. Not a live Mindcraft world.`
        : `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). entryAllowed=${entryCard?.entryAllowed ?? false}. sexualFraming=false; liveMindcraftWorld=false; productionMutation=false; L4 false.`,
    liveLegalWaiver: false,
    liveAgeVerification: false,
    liveMindcraftWorld: false,
    sexualFramingAllowed: false,
    clothingOptionalOnlyCultureGalleryHeritageEdu: true,
    reportsPreserved: true,
    storyId: 'US-MC-01',
  };
}
