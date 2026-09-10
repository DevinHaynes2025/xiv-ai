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
  action?: { label: string; approvalRequired: boolean };
}

export interface ExperienceResponse {
  tenantId: string;
  surface: ExperienceSurface;
  generatedAt: string;
  offlineCapable: boolean;
  cards: ExperienceCard[];
  warnings: string[];
}

const OFFLINE_SURFACES = new Set<ExperienceSurface>([
  'EXECUTIVE_HOME', 'BUSINESS_HEALTH', 'STORY_ENGINE', 'AGENT_ACTIVITY', 'APPROVALS', 'LEARNING',
]);

export const EXPERIENCE_BACKEND_GUARDRAILS = Object.freeze({
  tenantIsolationRequired: true,
  humanApprovalForConsequentialActions: true,
  topSecretCommunityExposureAllowed: false,
  frontendFilteringIsSecurityBoundary: false,
  productionMutationAllowed: false,
});

export function buildExperienceResponse(
  request: ExperienceRequest,
  cards: ExperienceCard[],
): ExperienceResponse {
  const offlineCapable = OFFLINE_SURFACES.has(request.surface);
  const warnings: string[] = [];
  if (request.offline && !offlineCapable) warnings.push('surface_requires_network_or_cached_content');
  if (!request.tenantId || !request.userId) warnings.push('identity_context_required');
  return {
    tenantId: request.tenantId,
    surface: request.surface,
    generatedAt: new Date().toISOString(),
    offlineCapable,
    cards: cards.slice(0, 24),
    warnings,
  };
}
