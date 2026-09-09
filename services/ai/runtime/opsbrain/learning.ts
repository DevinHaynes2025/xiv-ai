import { learningMayRewriteSecurityOrProductionPolicy } from '../knowledge/loop';

export type OutcomeLesson = {
  lessonId: string;
  mayUpdateApprovedKnowledge: true;
  mayRewriteSecurityPolicy: false;
  mayRewriteProductionCode: false;
  mayRewriteModelAuthority: false;
  mayRewritePermissions: false;
};

export function recordOutcomeLesson(): OutcomeLesson {
  void learningMayRewriteSecurityOrProductionPolicy();
  return {
    lessonId: 'lesson-1',
    mayUpdateApprovedKnowledge: true,
    mayRewriteSecurityPolicy: false,
    mayRewriteProductionCode: false,
    mayRewriteModelAuthority: false,
    mayRewritePermissions: false,
  };
}

export function lessonsRewriteSecurityPolicy(): false {
  return learningMayRewriteSecurityOrProductionPolicy();
}
