import type { DataClass, GovernedTool } from './governed-tool-registry';

export type BrainRoute = 'OFFLINE' | 'HYBRID' | 'ONLINE' | 'DENY';

export interface ToolRouteRequest {
  dataClass: DataClass;
  internetAvailable: boolean;
  localCapabilityAvailable: boolean;
  allowRemote: boolean;
}

export function chooseRoute(request: ToolRouteRequest): BrainRoute {
  if (request.dataClass === 'TOP_SECRET') return request.localCapabilityAvailable ? 'OFFLINE' : 'DENY';
  if (request.localCapabilityAvailable && !request.internetAvailable) return 'OFFLINE';
  if (request.localCapabilityAvailable && request.internetAvailable && request.allowRemote) return 'HYBRID';
  if (!request.localCapabilityAvailable && request.internetAvailable && request.allowRemote) return 'ONLINE';
  return 'DENY';
}

export function eligibleTools(tools: GovernedTool[], route: BrainRoute): GovernedTool[] {
  if (route === 'DENY') return [];
  return tools.filter((tool) => {
    if (route === 'OFFLINE') return tool.mode === 'LOCAL';
    if (route === 'ONLINE') return tool.mode === 'REMOTE';
    return tool.mode === 'LOCAL' || tool.mode === 'HYBRID' || tool.mode === 'REMOTE';
  });
}
