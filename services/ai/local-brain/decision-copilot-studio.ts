/**
 * 62L-DI Decision Copilot Studio — probabilistic scenarios + evidence drawers.
 */
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DI_LOCKS, HONESTY_BANNER, MAX_COPILOT_SCENARIOS, PREDICTION_MUST_REMAIN_PROBABILISTIC,
  type DiActor, type ForecastEpistemicLabel,
} from './personalized-intelligence-companion-os-types';

export type CopilotScenario = {
  id: string; studioId: string; title: string; probability: number; label: ForecastEpistemicLabel;
  evidenceDrawerIds: string[]; labeledVerifiedFact: false; status: 'ACCEPTED' | 'DENIED'; reason: string; at: string;
};
export type DecisionCopilotStudio = { id: string; orgId: string; tenantId: string; universeId: string; createdAt: string };
type Store = { studios: DecisionCopilotStudio[]; scenarios: CopilotScenario[] };

function storePath(root: string) { return xivLocalPath(root, 'decision-copilot-studio.json'); }
async function load(root: string): Promise<Store> { return readJsonFile<Store>(storePath(root), { studios: [], scenarios: [] }); }
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function clampProb(p: number): number { if (!Number.isFinite(p)) return 0.5; return Math.min(1, Math.max(0, p)); }

export function decisionCopilotStudioHonesty() {
  return {
    banner: HONESTY_BANNER,
    predictionsRemainProbabilistic: DI_LOCKS.PREDICTIONS_REMAIN_PROBABILISTIC,
    recommendationEqCharge: DI_LOCKS.RECOMMENDATION_EQ_CHARGE,
    recommendationEqDeploy: DI_LOCKS.RECOMMENDATION_EQ_DEPLOY,
    recommendationEqPublish: DI_LOCKS.RECOMMENDATION_EQ_PUBLISH,
    l4AutonomyEnabled: DI_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function bootstrapDecisionCopilotStudio(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor;
}): Promise<DecisionCopilotStudio> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.studios.find((s) => s.orgId === input.orgId && s.tenantId === input.tenantId && s.universeId === input.universeId);
  if (existing) return existing;
  const studio: DecisionCopilotStudio = { id: id('didcs'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, createdAt: new Date().toISOString() };
  store.studios.push(studio); await save(input.root, store); return studio;
}

export async function submitCopilotScenario(input: {
  studioId: string; title: string; probability: number; evidenceDrawerIds?: string[];
  claimVerifiedFact?: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; scenario?: CopilotScenario }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const studio = store.studios.find((s) => s.id === input.studioId);
  if (!studio) return { accepted: false, reason: 'DECISION_COPILOT_STUDIO_NOT_FOUND' };
  if (store.scenarios.length >= MAX_COPILOT_SCENARIOS) return { accepted: false, reason: 'MAX_COPILOT_SCENARIOS_BOUNDED' };
  if (input.claimVerifiedFact === true) {
    const scenario: CopilotScenario = {
      id: id('dicsc'), studioId: studio.id, title: input.title.trim() || 'untitled-scenario',
      probability: clampProb(input.probability), label: 'PROBABILISTIC', evidenceDrawerIds: input.evidenceDrawerIds ?? [],
      labeledVerifiedFact: false, status: 'DENIED', reason: PREDICTION_MUST_REMAIN_PROBABILISTIC, at: now,
    };
    store.scenarios.push(scenario); await save(input.root, store);
    return { accepted: false, reason: PREDICTION_MUST_REMAIN_PROBABILISTIC, scenario };
  }
  const scenario: CopilotScenario = {
    id: id('dicsc'), studioId: studio.id, title: input.title.trim() || 'untitled-scenario',
    probability: clampProb(input.probability), label: 'LABELED_SCENARIO', evidenceDrawerIds: input.evidenceDrawerIds ?? [],
    labeledVerifiedFact: false, status: 'ACCEPTED', reason: 'PROBABILISTIC_SCENARIO_WITH_EVIDENCE_DRAWER', at: now,
  };
  store.scenarios.push(scenario); await save(input.root, store);
  return { accepted: true, reason: 'COPILOT_SCENARIO_RECORDED', scenario };
}
