export type ExperienceSurface =
  | 'EXECUTIVE_HOME'
  | 'BUSINESS_HEALTH'
  | 'STORY_ENGINE'
  | 'AGENT_ACTIVITY'
  | 'APPROVALS'
  | 'LEARNING'
  | 'COMMUNITY';

export interface ExperienceRequest {
  tenantId: string;
  userId: string;
  surface: ExperienceSurface;
  offline: boolean;
  query?: string;
}

export interface ExperienceCard {
  id: string;
  title: string;
  summary: string;
  confidence?: number;
  evidenceRefs: string[];
  action?: {
    label: string;
    actionClass: 'INFORMATIONAL' | 'NAVIGATION' | 'CONSEQUENTIAL';
    approvalRequired: boolean;
  };
}

export interface ExperienceResponse {
  tenantId: string;
  surface: ExperienceSurface;
  generatedAt: string;
  offlineCapable: boolean;
  cards: readonly Readonly<ExperienceCard>[];
  warnings: readonly string[];
}

const EXPERIENCE_SURFACES: readonly ExperienceSurface[] = Object.freeze([
  'EXECUTIVE_HOME',
  'BUSINESS_HEALTH',
  'STORY_ENGINE',
  'AGENT_ACTIVITY',
  'APPROVALS',
  'LEARNING',
  'COMMUNITY',
]);

const OFFLINE_SURFACES = new Set<ExperienceSurface>([
  'EXECUTIVE_HOME',
  'BUSINESS_HEALTH',
  'STORY_ENGINE',
  'AGENT_ACTIVITY',
  'APPROVALS',
  'LEARNING',
]);

export const EXPERIENCE_BACKEND_GUARDRAILS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  tenantIsolationRequired: true,
  humanApprovalForConsequentialActions: true,
  topSecretCommunityExposureAllowed: false,
  frontendFilteringIsSecurityBoundary: false,
  productionMutationAllowed: false,
});

const refuse = (): never => {
  throw new Error('EXPERIENCE_BACKEND_FAIL_CLOSED');
};

function exactDataObject(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    refuse();
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const keys = Reflect.ownKeys(value);

  if (
    keys.some((key) => typeof key !== 'string' || !allowed.has(key)) ||
    requiredKeys.some((key) => !descriptors[key]) ||
    Object.keys(descriptors).some((key) => {
      const descriptor = descriptors[key];
      return !descriptor || !('value' in descriptor) || descriptor.enumerable !== true;
    })
  ) {
    refuse();
  }
}

function boundedId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_.:@-]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function boundedText(value: unknown, max: number): string {
  if (
    typeof value !== 'string' ||
    value.trim().length < 1 ||
    value.length > max
  ) {
    refuse();
  }

  return value;
}

function validateRequest(request: unknown): Readonly<ExperienceRequest> {
  exactDataObject(
    request,
    ['tenantId', 'userId', 'surface', 'offline'],
    ['query'],
  );

  const tenantId = boundedId(request.tenantId);
  const userId = boundedId(request.userId);

  if (
    typeof request.surface !== 'string' ||
    !EXPERIENCE_SURFACES.includes(request.surface as ExperienceSurface) ||
    typeof request.offline !== 'boolean'
  ) {
    refuse();
  }

  const query =
    request.query === undefined
      ? undefined
      : boundedText(request.query, 500);

  return Object.freeze({
    tenantId,
    userId,
    surface: request.surface as ExperienceSurface,
    offline: request.offline,
    ...(query !== undefined ? { query } : {}),
  });
}

function validateAction(
  action: unknown,
): Readonly<NonNullable<ExperienceCard['action']>> {
  exactDataObject(
    action,
    ['label', 'actionClass', 'approvalRequired'],
  );

  const label = boundedText(action.label, 160);

  if (
    action.actionClass !== 'INFORMATIONAL' &&
    action.actionClass !== 'NAVIGATION' &&
    action.actionClass !== 'CONSEQUENTIAL'
  ) {
    refuse();
  }

  if (typeof action.approvalRequired !== 'boolean') {
    refuse();
  }

  if (
    action.actionClass === 'CONSEQUENTIAL' &&
    action.approvalRequired !== true
  ) {
    refuse();
  }

  return Object.freeze({
    label,
    actionClass: action.actionClass,
    approvalRequired: action.approvalRequired,
  });
}

function validateCard(card: unknown): Readonly<ExperienceCard> {
  exactDataObject(
    card,
    ['id', 'title', 'summary', 'evidenceRefs'],
    ['confidence', 'action'],
  );

  const id = boundedId(card.id);
  const title = boundedText(card.title, 200);
  const summary = boundedText(card.summary, 2_000);

  let confidence: number | undefined;

  if (card.confidence !== undefined) {
    if (
      typeof card.confidence !== 'number' ||
      !Number.isFinite(card.confidence) ||
      card.confidence < 0 ||
      card.confidence > 1
    ) {
      refuse();
    }

    confidence = card.confidence;
  }

  if (!Array.isArray(card.evidenceRefs) || card.evidenceRefs.length > 64) {
    refuse();
  }

  const evidenceRefs = Object.freeze(
    card.evidenceRefs.map((ref) => boundedId(ref)),
  );

  const action =
    card.action === undefined
      ? undefined
      : validateAction(card.action);

  return Object.freeze({
    id,
    title,
    summary,
    ...(confidence !== undefined ? { confidence } : {}),
    evidenceRefs,
    ...(action !== undefined ? { action } : {}),
  });
}

export function buildExperienceResponse(
  requestInput: ExperienceRequest,
  cardsInput: ExperienceCard[],
): Readonly<ExperienceResponse> {
  const request = validateRequest(requestInput);

  if (!Array.isArray(cardsInput)) {
    refuse();
  }

  const cards = Object.freeze(
    cardsInput.slice(0, 24).map((card) => validateCard(card)),
  );

  const offlineCapable = OFFLINE_SURFACES.has(request.surface);

  const warnings = Object.freeze([
    ...(request.offline && !offlineCapable
      ? ['surface_requires_network_or_cached_content']
      : []),
  ]);

  return Object.freeze({
    tenantId: request.tenantId,
    surface: request.surface,
    generatedAt: new Date().toISOString(),
    offlineCapable,
    cards,
    warnings,
  });
}
