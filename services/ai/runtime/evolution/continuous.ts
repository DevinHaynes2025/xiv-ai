/**
 * Continuous Evolution Engine — observes outcomes, proposes improvements, never auto-ships.
 * Creative proposals ≠ production authority. L4 disabled.
 */

import { openFeedbackLoopV4 } from './feedback';
import { openInterfaceEvolutionEngine } from './interface';
import { openContentIntelligenceEngine } from './content';
import { openNightShiftV4 } from './nightshift';
import { openPhase2iacInvariants } from './invariants';

export type ContinuousEvolutionStage =
  | 'OBSERVE'
  | 'MEASURE'
  | 'COMPARE_EXPECTED_VS_ACTUAL'
  | 'ANALYZE'
  | 'PROPOSE'
  | 'HUMAN_POLICY_GATE'
  | 'SANDBOX_VALIDATE'
  | 'RELEASE_CANDIDATE'
  | 'STOP_BEFORE_UNATTENDED_PROD';

export const CONTINUOUS_EVOLUTION_STAGES = [
  'OBSERVE',
  'MEASURE',
  'COMPARE_EXPECTED_VS_ACTUAL',
  'ANALYZE',
  'PROPOSE',
  'HUMAN_POLICY_GATE',
  'SANDBOX_VALIDATE',
  'RELEASE_CANDIDATE',
  'STOP_BEFORE_UNATTENDED_PROD',
] as const satisfies readonly ContinuousEvolutionStage[];

export type ContinuousEvolutionEngine = {
  stages: readonly ContinuousEvolutionStage[];
  feedbackLoopV4: true;
  interfaceEvolution: true;
  contentIntelligence: true;
  nightShiftV4: true;
  autoShipToProduction: false;
  darkPatternsAllowed: false;
  l4Enabled: false;
  productionLive: false;
};

export function listContinuousEvolutionStages(): readonly ContinuousEvolutionStage[] {
  return CONTINUOUS_EVOLUTION_STAGES;
}

export function openContinuousEvolutionEngine(): ContinuousEvolutionEngine {
  // Touch dependent engines so the fabric composes without side effects.
  openFeedbackLoopV4();
  openInterfaceEvolutionEngine();
  openContentIntelligenceEngine();
  openNightShiftV4();
  openPhase2iacInvariants();
  return {
    stages: CONTINUOUS_EVOLUTION_STAGES,
    feedbackLoopV4: true,
    interfaceEvolution: true,
    contentIntelligence: true,
    nightShiftV4: true,
    autoShipToProduction: false,
    darkPatternsAllowed: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function continuousEvolutionMayAutoShip(): false {
  return false;
}
