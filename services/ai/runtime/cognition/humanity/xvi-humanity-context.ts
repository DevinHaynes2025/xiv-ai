import {
  createHash,
} from 'node:crypto';

export type XviConversationTone =
  | 'NEUTRAL'
  | 'WARM'
  | 'CELEBRATORY'
  | 'REFLECTIVE'
  | 'SERIOUS'
  | 'PLAYFUL'
  | 'SUPPORTIVE'
  | 'PROFESSIONAL';

export type XviEmotionalCue =
  | 'JOY'
  | 'EXCITEMENT'
  | 'CURIOSITY'
  | 'CALM'
  | 'UNCERTAINTY'
  | 'FRUSTRATION'
  | 'SADNESS'
  | 'GRIEF'
  | 'FEAR'
  | 'ANGER'
  | 'HOPE'
  | 'NONE';

export interface XviHumanityContextInput {
  conversationId: string;

  language: string;
  culturalContext: string | null;

  tone: XviConversationTone;
  emotionalCue: XviEmotionalCue;

  humorAppropriate: boolean;
  celebrationAppropriate: boolean;
  supportiveResponseAppropriate: boolean;

  confidence: number;

  observedAtMs: number;
}

export interface XviHumanityContext {
  version:
    'xvi-humanity-context-v1';

  conversationId: string;

  language: string;
  culturalContext: string | null;

  tone: XviConversationTone;
  emotionalCue: XviEmotionalCue;

  humorAppropriate: boolean;
  celebrationAppropriate: boolean;
  supportiveResponseAppropriate: boolean;

  confidence: number;

  observedAtMs: number;

  contextDigest: string;

  emotionIsInferred: true;
  agentClaimsEmotion: false;
  agentClaimsConsciousness: false;

  manipulativePersuasionAllowed: false;
  impersonationAllowed: false;

  externalActionAuthority: false;
  productionAuthority: false;
}

const TONES =
  new Set<XviConversationTone>([
    'NEUTRAL',
    'WARM',
    'CELEBRATORY',
    'REFLECTIVE',
    'SERIOUS',
    'PLAYFUL',
    'SUPPORTIVE',
    'PROFESSIONAL',
  ]);

const CUES =
  new Set<XviEmotionalCue>([
    'JOY',
    'EXCITEMENT',
    'CURIOSITY',
    'CALM',
    'UNCERTAINTY',
    'FRUSTRATION',
    'SADNESS',
    'GRIEF',
    'FEAR',
    'ANGER',
    'HOPE',
    'NONE',
  ]);

const refuse = (): never => {
  throw new Error(
    'XVI_HUMANITY_CONTEXT_REFUSED',
  );
};

function exactInput(
  value: unknown,
): PropertyDescriptorMap {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'conversationId',
    'language',
    'culturalContext',
    'tone',
    'emotionalCue',
    'humorAppropriate',
    'celebrationAppropriate',
    'supportiveResponseAppropriate',
    'confidence',
    'observedAtMs',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(
      value,
    );

  const keys =
    Reflect.ownKeys(value);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(
          key as
            (typeof expected)[number],
        ),
    )
  ) {
    refuse();
  }

  for (const key of expected) {
    const descriptor =
      descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  return descriptors;
}

export function createXviHumanityContext(
  input: XviHumanityContextInput,
): Readonly<XviHumanityContext> {
  const d =
    exactInput(input);

  const conversationId =
    d.conversationId.value;

  const language =
    d.language.value;

  const culturalContext =
    d.culturalContext.value;

  if (
    typeof conversationId !== 'string' ||
    conversationId.length < 1 ||
    conversationId.length > 128 ||
    conversationId !==
      conversationId.trim() ||

    typeof language !== 'string' ||
    language.length < 2 ||
    language.length > 64 ||
    language !== language.trim() ||

    (
      culturalContext !== null &&
      (
        typeof culturalContext !==
          'string' ||
        culturalContext.length < 1 ||
        culturalContext.length > 256 ||
        culturalContext !==
          culturalContext.trim()
      )
    )
  ) {
    refuse();
  }

  const tone =
    d.tone.value as
      XviConversationTone;

  const emotionalCue =
    d.emotionalCue.value as
      XviEmotionalCue;

  if (
    !TONES.has(tone) ||
    !CUES.has(emotionalCue)
  ) {
    refuse();
  }

  const humorAppropriate =
    d.humorAppropriate.value;

  const celebrationAppropriate =
    d.celebrationAppropriate.value;

  const supportiveResponseAppropriate =
    d.supportiveResponseAppropriate.value;

  if (
    typeof humorAppropriate !==
      'boolean' ||
    typeof celebrationAppropriate !==
      'boolean' ||
    typeof supportiveResponseAppropriate !==
      'boolean'
  ) {
    refuse();
  }

  const confidence =
    d.confidence.value;

  if (
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    refuse();
  }

  const observedAtMs =
    d.observedAtMs.value;

  if (
    !Number.isSafeInteger(
      observedAtMs,
    ) ||
    observedAtMs < 0
  ) {
    refuse();
  }

  /*
   * Avoid obviously contradictory
   * conversational behavior.
   */
  if (
    emotionalCue === 'GRIEF' &&
    (
      humorAppropriate ||
      celebrationAppropriate
    )
  ) {
    refuse();
  }

  const canonical =
    JSON.stringify([
      'xvi-humanity-context-v1',
      conversationId,
      language,
      culturalContext,
      tone,
      emotionalCue,
      humorAppropriate,
      celebrationAppropriate,
      supportiveResponseAppropriate,
      confidence,
      observedAtMs,
    ]);

  const contextDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-humanity-context-v1' as const,

    conversationId,

    language,
    culturalContext,

    tone,
    emotionalCue,

    humorAppropriate,
    celebrationAppropriate,
    supportiveResponseAppropriate,

    confidence,
    observedAtMs,

    contextDigest,

    emotionIsInferred:
      true as const,

    agentClaimsEmotion:
      false as const,

    agentClaimsConsciousness:
      false as const,

    manipulativePersuasionAllowed:
      false as const,

    impersonationAllowed:
      false as const,

    externalActionAuthority:
      false as const,

    productionAuthority:
      false as const,
  });
}
