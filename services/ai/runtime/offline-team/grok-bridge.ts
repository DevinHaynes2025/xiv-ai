export const GROK_API_BASE_URL = 'https://api.x.ai/v1' as const;
export const GROK_DEFAULT_MODEL = 'grok-4.6' as const;

export interface GrokBridgeConfig {
  apiKeyPresent: boolean;
  networkAvailable: boolean;
  enabled: boolean;
  baseUrl: string;
  model: string;
}

export interface GrokBridgeDecision {
  runnable: boolean;
  mode: 'REMOTE_SANDBOX' | 'WAITING_CREDENTIALS' | 'WAITING_NETWORK' | 'DISABLED';
  productionAuthority: false;
  reason: string;
}

export function decideGrokBridge(config: GrokBridgeConfig): GrokBridgeDecision {
  if (!config.enabled) return { runnable: false, mode: 'DISABLED', productionAuthority: false, reason: 'Grok bridge disabled' };
  if (!config.apiKeyPresent) return { runnable: false, mode: 'WAITING_CREDENTIALS', productionAuthority: false, reason: 'XAI_API_KEY not available to local runtime' };
  if (!config.networkAvailable) return { runnable: false, mode: 'WAITING_NETWORK', productionAuthority: false, reason: 'network unavailable; continue with Ollama/local team' };
  return { runnable: true, mode: 'REMOTE_SANDBOX', productionAuthority: false, reason: 'Grok available for bounded planning/review/coding tasks' };
}

export const GROK_BRIDGE_GUARDRAILS = {
  credentialsFromEnvironmentOnly: true,
  commitSecrets: false,
  autonomousProductionDeploy: false,
  autonomousProductionDatabaseMutation: false,
  fallbackToOfflineTeam: true,
} as const;
