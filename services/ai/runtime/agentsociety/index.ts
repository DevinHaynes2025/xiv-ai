/**
 * Energy-aware agent society — continuous learning without always-on silicon burn.
 * L4 disabled. Architecture ≠ 24/7 live. Debriefs wait for review before global brain.
 */

export {
  ARCHITECTURE_EXISTS_MEANS_247_LIVE,
  alwaysOnBurningSilicon,
  architectureExistsMeans247Live,
  chargeEnergy,
  createDutyCycle,
  createEnergyBudget,
  enterIdleState,
  enterSleepState,
  isEnergyExhausted,
  preferBatchDebriefOverConstantInference,
} from './energy';
export type { AgentEnergyState, DutyCycle, DutyCycleWindow, EnergyBudget } from './energy';

export {
  createSocietyMeeting,
  estimateMeetingEnergyCost,
  meetingEqualsAuthority,
  runSocietyTurn,
  societyL4Enabled,
  stopMeetingOnEnergyExhaustion,
} from './meetings';
export type {
  SocietyAgendaItem,
  SocietyMeeting,
  SocietyMeetingStatus,
  SocietyTurnResult,
} from './meetings';

export {
  createLearningLoopStore,
  debriefAutoPromotesToGlobalBrain,
  enqueueLessonCandidates,
  extractLessonCandidatesFromDebrief,
  listWaitingReview,
  mayAutoRewriteAgentsMd,
  mayAutoRewriteGlobalTruth,
  promoteLessonToGlobalBrain,
} from './learning-loop';
export type { LearningLoopStore, LessonCandidate, LessonReviewState } from './learning-loop';

export {
  defaultWeekdayDaytimeDutyCycle,
  overnightAllowsFullInference,
  overnightDefaultWork,
  resolveScheduleMode,
  scheduleIsAlwaysOn,
} from './schedule';
export type { LocalClock, ScheduleMode } from './schedule';

export const L4_AUTONOMY_ENABLED = false as const;
export const AGENT_SOCIETY_ALWAYS_ON = false as const;
export const AGENT_SOCIETY_PRODUCTION_LIVE = false as const;

export function agentSocietyStatus() {
  return {
    l4Enabled: L4_AUTONOMY_ENABLED,
    alwaysOn: AGENT_SOCIETY_ALWAYS_ON,
    productionLive: AGENT_SOCIETY_PRODUCTION_LIVE,
    architectureMeans247Live: false as const,
    preferBatchDebrief: true as const,
    quantumAgentic: 'classical_first_qpu_candidate' as const,
  };
}
