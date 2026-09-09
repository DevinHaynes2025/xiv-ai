/**
 * Minimal UI contracts for Mission Control / Founder Brief surfaces.
 * Display-only — no LIVE claims, no ambient authority.
 */

import type { AdapterLifecycle, AgentMissionStatus, ComputeGovernorLevel } from './types';
import { FOUNDER_BRIEF_EMAIL } from './types';

export type MissionControlMissionRow = {
  missionId: string;
  objective: string;
  status: AgentMissionStatus;
  workerId: string | null;
  tenantId: string;
  universeId: string;
  retryCount: number;
  l4Enabled: false;
  productionLive: false;
};

export type MissionControlPanelContract = {
  title: 'Agent Mission Control';
  rows: readonly MissionControlMissionRow[];
  architectureExistsIsNotLive247: true;
  l4Enabled: false;
  defaultPermissions: 'NONE';
};

export type FounderBriefUiContract = {
  title: 'Founder Shift Brief';
  deliveryEmail: typeof FOUNDER_BRIEF_EMAIL;
  deliveryLifecycle: AdapterLifecycle;
  twinIsAuthority: false;
  agentsRan24x7Live: false;
  computePressure: ComputeGovernorLevel;
};

export type WhileYouWereAwayUiContract = {
  title: 'While You Were Away';
  completed: readonly string[];
  failed: readonly string[];
  quarantined: readonly string[];
  humanDecisionsRequired: readonly string[];
  productionDeployedOvernight: false;
  agentsRan24x7Live: false;
};

export function openMissionControlPanel(
  rows: readonly MissionControlMissionRow[] = [],
): MissionControlPanelContract {
  return {
    title: 'Agent Mission Control',
    rows,
    architectureExistsIsNotLive247: true,
    l4Enabled: false,
    defaultPermissions: 'NONE',
  };
}

export function openFounderBriefUi(input?: {
  deliveryLifecycle?: AdapterLifecycle;
  computePressure?: ComputeGovernorLevel;
}): FounderBriefUiContract {
  return {
    title: 'Founder Shift Brief',
    deliveryEmail: FOUNDER_BRIEF_EMAIL,
    deliveryLifecycle: input?.deliveryLifecycle ?? 'NOT_CONFIGURED',
    twinIsAuthority: false,
    agentsRan24x7Live: false,
    computePressure: input?.computePressure ?? 'NORMAL',
  };
}

export function openWhileYouWereAwayUi(input?: {
  completed?: readonly string[];
  failed?: readonly string[];
  quarantined?: readonly string[];
  humanDecisionsRequired?: readonly string[];
}): WhileYouWereAwayUiContract {
  return {
    title: 'While You Were Away',
    completed: input?.completed ?? [],
    failed: input?.failed ?? [],
    quarantined: input?.quarantined ?? [],
    humanDecisionsRequired: input?.humanDecisionsRequired ?? [],
    productionDeployedOvernight: false,
    agentsRan24x7Live: false,
  };
}
