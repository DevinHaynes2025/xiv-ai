export interface StudySource {
  sourceId: string;
  title: string;
  sourceType: 'DOCUMENTARY' | 'AUTOBIOGRAPHY' | 'CASE_STUDY' | 'BOOK' | 'ARTICLE' | 'INTERNAL_DOCUMENT';
  provenanceRef: string;
  licensedOrAuthorized: boolean;
}

export interface StudyModule {
  moduleId: string;
  topic: string;
  sourceIds: readonly string[];
  learningObjectives: readonly string[];
  assessmentRequired: boolean;
}

export const STUDY_GUARDRAILS = {
  provenanceRequired: true,
  copyrightRespectRequired: true,
  sourceAuthorizationRequired: true,
  completionDoesNotImplyExpertise: true,
} as const;

export function validateStudySource(source: StudySource): boolean {
  return Boolean(source.sourceId && source.title && source.provenanceRef && source.licensedOrAuthorized);
}
