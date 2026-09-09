import { directoryRollup, listDirectory, type DirectoryRollup } from './directory';
import { budgetUtilisation } from './governor';
import { requireMember, visibleTo, type CivilizationState } from './store';
import type { ActorContext, UniverseLifecycleStage } from './types';

// The XIV Command Center rollup.
//
// The one number that matters most here is the gap between logicalAgents and
// activeAgents. The directory can describe a thousand identities while a couple
// of dozen are actually running; keeping those two counts separate is what stops
// "we have 1,284 agents" from meaning "we are paying for 1,284 agents".

export type CommandCenterView = {
  universe: {
    id: string;
    name: string;
    lifecycleStage: UniverseLifecycleStage;
    killSwitchEngaged: boolean;
  };
  logicalAgents: number;
  activeAgents: number;
  sleepingAgents: number;
  pausedAgents: number;
  quarantinedAgents: number;
  activeTaskForces: number;
  runningMeetings: number;
  meetingsAwaitingHuman: number;
  pendingRecommendations: number;
  humanApprovalsRequired: number;
  securityViolations: number;
  budgetsExhausted: number;
  mostConsumedBudget: { meetingId: string; dimension: string; fraction: number } | null;
  directory: DirectoryRollup[];
};

export function commandCenter(state: CivilizationState, actor: ActorContext): CommandCenterView {
  const { universe } = requireMember(state, actor);

  const agents = visibleTo(state, actor, state.agents);
  const meetings = visibleTo(state, actor, state.meetings);
  const taskForces = visibleTo(state, actor, state.taskForces);
  const actions = visibleTo(state, actor, state.meetingActions);
  const budgets = visibleTo(state, actor, state.meetingBudgets);
  const observations = visibleTo(state, actor, state.guardianObservations);
  const events = visibleTo(state, actor, state.governanceEvents);

  // The catalogued population, falling back to the number of registered
  // identities when a universe has not sized its directory yet.
  const catalogued = listDirectory(state, actor).reduce((total, entry) => total + entry.logicalAgentCount, 0);

  let mostConsumed: CommandCenterView['mostConsumedBudget'] = null;
  for (const budget of budgets) {
    for (const usage of budgetUtilisation(budget)) {
      if (!mostConsumed || usage.fraction > mostConsumed.fraction) {
        mostConsumed = { meetingId: budget.meetingId, dimension: usage.dimension, fraction: usage.fraction };
      }
    }
  }

  return {
    universe: {
      id: universe.id,
      name: universe.name,
      lifecycleStage: universe.lifecycleStage,
      killSwitchEngaged: universe.killSwitchEngaged,
    },
    logicalAgents: Math.max(catalogued, agents.length),
    activeAgents: agents.filter((agent) => agent.lifecycleState === 'active' && agent.controlState === 'normal').length,
    sleepingAgents: agents.filter((agent) => agent.lifecycleState === 'sleeping').length,
    pausedAgents: agents.filter((agent) => agent.controlState === 'paused').length,
    quarantinedAgents: agents.filter((agent) => agent.controlState === 'quarantined').length,
    activeTaskForces: taskForces.filter((item) => item.status === 'active' || item.status === 'reporting').length,
    runningMeetings: meetings.filter((item) => item.status === 'open' || item.status === 'deliberating').length,
    meetingsAwaitingHuman: meetings.filter((item) => item.status === 'awaiting_human').length,
    pendingRecommendations: meetings.filter((item) => item.synthesis !== null && item.decision === null).length,
    humanApprovalsRequired: actions.filter(
      (item) => item.requiresHumanApproval && !item.approvedBy && item.status === 'queued',
    ).length,
    // A violation is something Guardian refused or the civilization layer
    // refused, both of which are recorded rather than inferred.
    securityViolations:
      observations.filter((item) => item.verdict === 'refuse').length +
      events.filter((item) => item.eventKind === 'guardian_refusal').length,
    budgetsExhausted: budgets.filter((item) => item.exhausted).length,
    mostConsumedBudget: mostConsumed,
    directory: directoryRollup(state, actor),
  };
}

export function formatCommandCenter(view: CommandCenterView): string {
  return [
    `XIV COMMAND CENTER — ${view.universe.name}`,
    `${view.logicalAgents} logical agents`,
    `${view.activeAgents} currently active`,
    `${view.runningMeetings} meetings running`,
    `${view.activeTaskForces} task forces`,
    `${view.pendingRecommendations} recommendations pending`,
    `${view.humanApprovalsRequired} human approvals required`,
    `${view.securityViolations} security violations`,
  ].join('\n');
}
