/**
 * Model router connection — truthful provider status; no budget bypass.
 */

import type { ModelRouterConnection } from './types';

export function openModelRouterConnection(input?: {
  connected?: boolean;
}): ModelRouterConnection {
  return {
    connected: input?.connected ?? true,
    routerId: 'xiv-model-router',
    lifecycle: input?.connected === false ? 'NOT_CONFIGURED' : 'CONFIGURED',
    mayBypassBudget: false,
    l4Enabled: false,
  };
}

export type ModelRouteRequest = {
  missionId: string;
  taskClass: string;
  tenantId: string;
  universeId: string;
};

export type ModelRouteResult = {
  authorizedModel: string | null;
  validated: boolean;
  lifecycle: ModelRouterConnection['lifecycle'];
  mayBypassBudget: false;
  l4Enabled: false;
};

/**
 * MISSION → TASK CLASSIFIER → MODEL ROUTER → AUTHORIZED MODEL → RESPONSE VALIDATION
 */
export function routeMissionIntelligence(
  conn: ModelRouterConnection,
  req: ModelRouteRequest,
): ModelRouteResult {
  if (!conn.connected || conn.lifecycle === 'NOT_CONFIGURED') {
    return {
      authorizedModel: null,
      validated: false,
      lifecycle: 'NOT_CONFIGURED',
      mayBypassBudget: false,
      l4Enabled: false,
    };
  }
  const model =
    req.taskClass === 'security' ? 'xiv-security-small' : req.taskClass === 'code' ? 'xiv-code-mid' : 'xiv-general-small';
  return {
    authorizedModel: model,
    validated: true,
    lifecycle: conn.lifecycle,
    mayBypassBudget: false,
    l4Enabled: false,
  };
}
