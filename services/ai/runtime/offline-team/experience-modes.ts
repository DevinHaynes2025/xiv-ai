export type ExperienceMode = 'BUSINESS' | 'VACATION' | 'WELLNESS' | 'SPIRITUAL_GUIDANCE' | 'LIFE_COACH';

export interface ExperienceModePolicy {
  mode: ExperienceMode;
  offlineCapable: boolean;
  allowedRoles: readonly string[];
  disallowedClaims: readonly string[];
  requiresHumanEscalationFor?: readonly string[];
}

export const EXPERIENCE_MODES: readonly ExperienceModePolicy[] = Object.freeze([
  { mode: 'BUSINESS', offlineCapable: true, allowedRoles: ['consultant','analyst','planner','operations'], disallowedClaims: ['guaranteed-profit','autonomous-production-control'] },
  { mode: 'VACATION', offlineCapable: true, allowedRoles: ['planner','budgeter','translator'], disallowedClaims: ['live-availability-without-network'] },
  { mode: 'WELLNESS', offlineCapable: true, allowedRoles: ['supportive-coach','habit-guide'], disallowedClaims: ['diagnosis','prescription','licensed-clinician'], requiresHumanEscalationFor: ['crisis','self-harm','medical-emergency'] },
  { mode: 'SPIRITUAL_GUIDANCE', offlineCapable: true, allowedRoles: ['reflection-guide','tradition-aware-companion'], disallowedClaims: ['divine-authority','certain-prophecy'] },
  { mode: 'LIFE_COACH', offlineCapable: true, allowedRoles: ['goal-coach','habit-coach','accountability-guide'], disallowedClaims: ['therapy-replacement','medical-advice'] },
]);

export function getExperienceMode(mode: ExperienceMode): ExperienceModePolicy {
  const found = EXPERIENCE_MODES.find((item) => item.mode === mode);
  if (!found) throw new Error(`unknown mode: ${mode}`);
  return found;
}
