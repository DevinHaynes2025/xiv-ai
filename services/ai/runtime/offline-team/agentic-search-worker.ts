import { ToolHeartbeat, usableHeartbeat } from './live-tool-heartbeats';

export interface SearchMission {
  missionId: string;
  tenantId: string;
  query: string;
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  preferredSources: Array<'COMPANY_BRAIN' | 'COMMUNITY' | 'HISTORY_GRAPH' | 'PUBLIC_WEB'>;
}

export interface SearchWorkerPlan {
  missionId: string;
  selectedTools: string[];
  selectedSources: SearchMission['preferredSources'];
  requiresHumanApproval: boolean;
  reason: string;
}

export function planAgenticSearch(mission: SearchMission, heartbeats: ToolHeartbeat[]): SearchWorkerPlan {
  if (!mission.tenantId) throw new Error('tenant required');
  if (!mission.query.trim()) throw new Error('query required');

  const usable = heartbeats.filter(usableHeartbeat);
  const selectedTools = usable
    .filter(tool => mission.confidentiality !== 'TOP_SECRET' || tool.kind === 'LOCAL')
    .slice(0, 8)
    .map(tool => tool.toolId);

  const selectedSources = mission.confidentiality === 'TOP_SECRET'
    ? mission.preferredSources.filter(source => source === 'COMPANY_BRAIN' || source === 'HISTORY_GRAPH')
    : mission.preferredSources;

  return {
    missionId: mission.missionId,
    selectedTools,
    selectedSources,
    requiresHumanApproval: mission.confidentiality === 'TOP_SECRET',
    reason: 'Search plan preserves tenant scope, confidentiality and evidence-backed tool availability.',
  };
}
