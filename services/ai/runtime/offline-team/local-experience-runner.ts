import { buildExperienceResponse, type ExperienceCard, type ExperienceSurface } from './experience-backend';
import { toExperienceViewModel } from './experience-view-model';

export interface LocalExperienceInput {
  tenantId: string;
  userId: string;
  surface: ExperienceSurface;
  cards: ExperienceCard[];
}

export function runLocalExperience(input: LocalExperienceInput) {
  const response = buildExperienceResponse({
    tenantId: input.tenantId,
    userId: input.userId,
    surface: input.surface,
    offline: true,
  }, input.cards);

  return {
    response,
    view: toExperienceViewModel(input.surface, response.cards),
  };
}
