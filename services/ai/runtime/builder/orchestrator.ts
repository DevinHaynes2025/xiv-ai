import { decideBuilderRequest } from './policy';
import type { BuilderDecision, BuilderProvider, BuilderRequest, DatabaseBlueprint } from './types';

export interface BuilderProviderConfig {
  provider: BuilderProvider;
  endpoint?: string;
  model?: string;
  enabled: boolean;
  local: boolean;
}

export const DEFAULT_BUILDERS: BuilderProviderConfig[] = [
  { provider: 'OLLAMA', endpoint: 'http://127.0.0.1:11434', model: 'configurable', enabled: true, local: true },
  { provider: 'GROK', enabled: false, local: false },
  { provider: 'CHATGPT', enabled: false, local: false },
  { provider: 'GEMINI', enabled: false, local: false },
  { provider: 'LOCAL_RULES', enabled: true, local: true },
];

export function planDatabase(request: BuilderRequest, blueprint: DatabaseBlueprint): {
  decision: BuilderDecision;
  steps: string[];
} {
  const decision = decideBuilderRequest(request);
  if (!decision.allowed) return { decision, steps: [] };

  const steps = [
    `validate blueprint ${blueprint.name}`,
    `generate ${blueprint.engine.toLowerCase()} schema artifact`,
    'generate reversible migration',
    'generate seed data using synthetic records only',
    'generate integrity and rollback tests',
    request.target === 'LOCAL' ? 'execute in local sandbox' : 'execute in isolated cloud sandbox',
    'record checksums, lineage, test evidence, and cost metrics',
    'stop before production deployment',
  ];

  return { decision, steps };
}

export function selectBuilder(configs: BuilderProviderConfig[], preferOffline: boolean): BuilderProviderConfig | null {
  const enabled = configs.filter((config) => config.enabled);
  if (preferOffline) return enabled.find((config) => config.local) ?? null;
  return enabled[0] ?? null;
}
