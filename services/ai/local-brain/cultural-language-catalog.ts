import { conveneHistoricalCulturalCouncil } from './cortex-councils';
import { attachTranslationMetadata, preserveOriginalSource } from './multilingual-source';
import { CLAIM_STATES, type ClaimState } from './knowledge-domains';
import {
  COMMUNICATION_CONTEXT_SIGNALS,
  type CommunicationContext,
  type CommunicationContextSignal,
  type EnsEvidenceState,
} from './enterprise-nervous-types';

export const ISO_639_1_CODES = [
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
] as const;

export type LanguageCode = (typeof ISO_639_1_CODES)[number];

export type LanguageCatalogEntry = {
  code: string;
  configured: boolean;
  evaluationEvidenceRefs: string[];
  capabilityState: 'PASS' | 'UNAVAILABLE';
  freshness?: string;
  provenanceRefs: string[];
  productionAuthorization: false;
};

const evaluations = new Map<string, { evidenceRefs: string[]; configured: boolean; freshness: string }>();

export function languageCatalogSize() {
  return ISO_639_1_CODES.length;
}

export function describeLanguageCapability(code: string): LanguageCatalogEntry {
  const normalized = code.trim().toLowerCase() as LanguageCode;
  if (!ISO_639_1_CODES.includes(normalized)) {
    return {
      code: normalized || 'und',
      configured: false,
      evaluationEvidenceRefs: [],
      capabilityState: 'UNAVAILABLE',
      provenanceRefs: [],
      productionAuthorization: false,
    };
  }
  const evalRecord = evaluations.get(normalized);
  const configured = evalRecord?.configured === true;
  const evidence = evalRecord?.evidenceRefs ?? [];
  const capable = configured && evidence.length > 0;
  return {
    code: normalized,
    configured,
    evaluationEvidenceRefs: [...evidence],
    capabilityState: capable ? 'PASS' : 'UNAVAILABLE',
    freshness: evalRecord?.freshness,
    provenanceRefs: capable ? [...evidence] : [],
    productionAuthorization: false,
  };
}

export function registerLanguageEvaluation(input: {
  code: string;
  evidenceRefs: string[];
  configured?: boolean;
}): LanguageCatalogEntry {
  const normalized = input.code.trim().toLowerCase();
  if (!ISO_639_1_CODES.includes(normalized as LanguageCode) || input.evidenceRefs.length === 0) {
    return describeLanguageCapability(normalized);
  }
  evaluations.set(normalized, {
    evidenceRefs: [...input.evidenceRefs],
    configured: input.configured !== false,
    freshness: new Date().toISOString(),
  });
  return describeLanguageCapability(normalized);
}

export function listLanguageCatalog(): LanguageCatalogEntry[] {
  return ISO_639_1_CODES.map((code) => describeLanguageCapability(code));
}

export type CulturalIntelligenceNote = {
  region?: string;
  topic: string;
  claimState: ClaimState;
  confidence: number;
  provenanceRefs: string[];
  freshness: string;
  individualDeterministicClaim: false;
  culturalGeneralizationAboutPerson: false;
  consensusForced: false;
  communicationHint: string;
  state: EnsEvidenceState;
};

export async function culturalIntelligenceHint(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  region?: string;
  individualId?: string;
  provenanceRefs?: string[];
  root?: string;
}): Promise<CulturalIntelligenceNote> {
  void input.individualId;
  const council = await conveneHistoricalCulturalCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: input.topic,
    kind: 'cultural',
    root: input.root,
  });
  const provenance = input.provenanceRefs?.length ? input.provenanceRefs : council.evidenceRefs;
  const freshness = council.createdAt;
  const confidence = provenance.length ? 0.4 : 0.1;
  return {
    region: input.region,
    topic: input.topic,
    claimState: (CLAIM_STATES.includes('CULTURAL_CONTEXT') ? 'CULTURAL_CONTEXT' : 'UNKNOWN') as ClaimState,
    confidence,
    provenanceRefs: provenance,
    freshness,
    individualDeterministicClaim: false,
    culturalGeneralizationAboutPerson: false,
    consensusForced: council.consensusForced,
    communicationHint:
      'Cultural context may alter phrasing, formality, and examples. It is not a verified fact about any named individual.',
    state: provenance.length ? 'PASS' : 'WAITING_DATA',
  };
}

export function communicationContextFromSignals(input: {
  signals: CommunicationContextSignal[];
  languageCode?: string;
  culturalRegion?: string;
  urgencyScore?: number;
}): CommunicationContext {
  const allowed = input.signals.filter((signal) =>
    (COMMUNICATION_CONTEXT_SIGNALS as readonly string[]).includes(signal),
  );
  return {
    signals: allowed,
    languageCode: input.languageCode,
    culturalRegion: input.culturalRegion,
    urgencyScore: Math.max(0, Math.min(1, input.urgencyScore ?? 0)),
    literalAgentFeelings: false,
    unsupportedPsychologicalConclusion: false,
    altersCommunication: true,
    inferredPersonalityOfIndividual: false,
  };
}

export async function offlineMultilingualIngest(input: {
  tenantId: string;
  universeId: string;
  industry: string;
  sourceUri: string;
  sourceLanguage: string;
  originalText: string;
  provenanceRefs: string[];
  targetLanguage?: string;
  translatedText?: string;
  localModelConfigured?: boolean;
  root?: string;
}) {
  const preserved = await preserveOriginalSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry,
    partition: 'world',
    sourceUri: input.sourceUri,
    sourceLanguage: input.sourceLanguage,
    originalText: input.originalText,
    provenanceRefs: input.provenanceRefs,
    root: input.root,
  });
  let translation = null;
  if (input.targetLanguage) {
    const capability = describeLanguageCapability(input.targetLanguage);
    translation = await attachTranslationMetadata({
      lakeObjectId: preserved.object.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      targetLanguage: input.targetLanguage,
      translatedText: capability.capabilityState === 'PASS' ? input.translatedText : undefined,
      translator: capability.capabilityState === 'PASS' ? 'human' : 'UNAVAILABLE',
      localModelConfigured: input.localModelConfigured === true,
      root: input.root,
    });
  }
  return {
    originalPreserved: true as const,
    originalLanguage: preserved.originalLanguage,
    originalText: preserved.originalText,
    translation,
    replacesOriginal: false as const,
  };
}

export function resetLanguageEvaluationsForTests() {
  evaluations.clear();
}
