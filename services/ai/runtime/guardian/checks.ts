export type GuardianCheckId =
  | 'typescript'
  | 'lint'
  | 'expo-doctor'
  | 'ai-service-health'
  | 'configuration-health'
  | 'repository-health'
  | 'runtime-health'
  | 'validation-status';

export type GuardianCheckCategory =
  | 'quality'
  | 'mobile_build'
  | 'service'
  | 'configuration'
  | 'repository'
  | 'security';

export type GuardianCheckSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AllowlistedCommand = {
  kind: 'allowlisted';
  cwd: 'apps/mobile' | 'services/ai' | 'repository';
  argv: readonly string[];
};

export type GuardianCheckDefinition = {
  id: GuardianCheckId;
  name: string;
  description: string;
  category: GuardianCheckCategory;
  severity: GuardianCheckSeverity;
  command?: AllowlistedCommand;
  handler: 'prototype' | 'configuration_presence' | 'injected';
  safeToRun: boolean;
  timeoutMs: number;
  enabled: boolean;
};

export const GUARDIAN_CHECK_REGISTRY: readonly GuardianCheckDefinition[] = [
  {
    id: 'typescript',
    name: 'TypeScript health',
    description: 'Allowlisted `npx tsc --noEmit` for the mobile app. Not executed from the agent runtime in Phase 2A.',
    category: 'quality',
    severity: 'high',
    command: { kind: 'allowlisted', cwd: 'apps/mobile', argv: ['npx', 'tsc', '--noEmit'] },
    handler: 'prototype',
    safeToRun: false,
    timeoutMs: 120_000,
    enabled: true,
  },
  {
    id: 'lint',
    name: 'ESLint health',
    description: 'Allowlisted `npm run lint` for the mobile app. Not executed from the agent runtime in Phase 2A.',
    category: 'quality',
    severity: 'medium',
    command: { kind: 'allowlisted', cwd: 'apps/mobile', argv: ['npm', 'run', 'lint'] },
    handler: 'prototype',
    safeToRun: false,
    timeoutMs: 120_000,
    enabled: true,
  },
  {
    id: 'expo-doctor',
    name: 'Expo Doctor health',
    description: 'Allowlisted `npx expo-doctor`. Not executed from the agent runtime in Phase 2A.',
    category: 'mobile_build',
    severity: 'medium',
    command: { kind: 'allowlisted', cwd: 'apps/mobile', argv: ['npx', 'expo-doctor'] },
    handler: 'prototype',
    safeToRun: false,
    timeoutMs: 120_000,
    enabled: true,
  },
  {
    id: 'ai-service-health',
    name: 'AI service health',
    description: 'Optional injected probe of the existing `/health` route. No secrets are sent.',
    category: 'service',
    severity: 'high',
    handler: 'injected',
    safeToRun: true,
    timeoutMs: 4_000,
    enabled: true,
  },
  {
    id: 'configuration-health',
    name: 'Configuration health',
    description: 'Checks whether required public configuration names are present. Values are never returned.',
    category: 'configuration',
    severity: 'high',
    handler: 'configuration_presence',
    safeToRun: true,
    timeoutMs: 1_000,
    enabled: true,
  },
  {
    id: 'repository-health',
    name: 'Repository health',
    description: 'Confirms the Phase 2A runtime modules are registered. Does not inspect git history or remotes.',
    category: 'repository',
    severity: 'low',
    handler: 'prototype',
    safeToRun: true,
    timeoutMs: 1_000,
    enabled: true,
  },
  {
    id: 'runtime-health',
    name: 'Runtime health',
    description: 'Confirms the agent registry, tool registry, and policy function are loaded.',
    category: 'service',
    severity: 'medium',
    handler: 'prototype',
    safeToRun: true,
    timeoutMs: 1_000,
    enabled: true,
  },
  {
    id: 'validation-status',
    name: 'Validation status',
    description: 'Placeholder for host TypeScript/lint/expo-doctor results. Not executed from the runtime.',
    category: 'quality',
    severity: 'medium',
    handler: 'prototype',
    safeToRun: false,
    timeoutMs: 1_000,
    enabled: true,
  },
] as const;

const BY_ID = new Map(GUARDIAN_CHECK_REGISTRY.map((check) => [check.id, check]));

export function getGuardianCheck(id: string): GuardianCheckDefinition | undefined {
  return BY_ID.get(id as GuardianCheckId);
}

export function listGuardianChecks(): readonly GuardianCheckDefinition[] {
  return GUARDIAN_CHECK_REGISTRY;
}
