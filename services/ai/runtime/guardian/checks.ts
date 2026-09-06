export type GuardianCheckId =
  | 'mobile-typescript'
  | 'mobile-lint'
  | 'expo-doctor'
  | 'ai-typescript'
  | 'runtime-tests'
  | 'repository-status'
  | 'repository-diff-check'
  | 'ai-service-health'
  | 'configuration-health'
  | 'runtime-health';

export type GuardianCheckCategory =
  | 'quality'
  | 'mobile_build'
  | 'service'
  | 'configuration'
  | 'repository'
  | 'security';

export type GuardianCheckSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type GuardianExecutionType = 'host_process' | 'in_process' | 'injected';

export type GuardianExecutableToken = 'npx' | 'npm' | 'git';

export type GuardianCwdToken = 'apps/mobile' | 'services/ai' | 'repository';

export type GuardianOutputParser =
  | 'typescript'
  | 'lint'
  | 'expo-doctor'
  | 'runtime-tests'
  | 'git-status'
  | 'git-diff'
  | 'health'
  | 'in-process';

export type StaticCommand = {
  executable: GuardianExecutableToken;
  args: readonly string[];
  cwd: GuardianCwdToken;
};

export type GuardianCheckDefinition = {
  id: GuardianCheckId;
  name: string;
  description: string;
  category: GuardianCheckCategory;
  severity: GuardianCheckSeverity;
  executionType: GuardianExecutionType;
  command?: StaticCommand;
  workingDirectory?: GuardianCwdToken;
  timeoutMs: number;
  safeToRun: boolean;
  enabled: boolean;
  outputParser: GuardianOutputParser;
};

export const GUARDIAN_CHECK_REGISTRY: readonly GuardianCheckDefinition[] = [
  {
    id: 'mobile-typescript',
    name: 'Mobile TypeScript',
    description: 'Allowlisted TypeScript check for apps/mobile. Host runner only.',
    category: 'quality',
    severity: 'high',
    executionType: 'host_process',
    command: { executable: 'npx', args: ['tsc', '--noEmit'], cwd: 'apps/mobile' },
    workingDirectory: 'apps/mobile',
    timeoutMs: 180_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'typescript',
  },
  {
    id: 'mobile-lint',
    name: 'Mobile lint',
    description: 'Allowlisted ESLint check for apps/mobile. Host runner only.',
    category: 'quality',
    severity: 'medium',
    executionType: 'host_process',
    command: { executable: 'npm', args: ['run', 'lint'], cwd: 'apps/mobile' },
    workingDirectory: 'apps/mobile',
    timeoutMs: 180_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'lint',
  },
  {
    id: 'expo-doctor',
    name: 'Expo Doctor',
    description: 'Allowlisted Expo Doctor check. Host runner only.',
    category: 'mobile_build',
    severity: 'medium',
    executionType: 'host_process',
    command: { executable: 'npx', args: ['expo-doctor'], cwd: 'apps/mobile' },
    workingDirectory: 'apps/mobile',
    timeoutMs: 180_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'expo-doctor',
  },
  {
    id: 'ai-typescript',
    name: 'AI service TypeScript',
    description: 'Allowlisted TypeScript check for services/ai. Host runner only.',
    category: 'quality',
    severity: 'high',
    executionType: 'host_process',
    command: { executable: 'npx', args: ['tsc', '--noEmit'], cwd: 'services/ai' },
    workingDirectory: 'services/ai',
    timeoutMs: 120_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'typescript',
  },
  {
    id: 'runtime-tests',
    name: 'Runtime tests',
    description: 'Allowlisted governed runtime tests. Host runner only.',
    category: 'quality',
    severity: 'high',
    executionType: 'host_process',
    command: { executable: 'npm', args: ['run', 'test:runtime'], cwd: 'services/ai' },
    workingDirectory: 'services/ai',
    timeoutMs: 120_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'runtime-tests',
  },
  {
    id: 'repository-status',
    name: 'Repository status',
    description: 'Allowlisted git status --short. Host runner only. No remotes are fetched.',
    category: 'repository',
    severity: 'low',
    executionType: 'host_process',
    command: { executable: 'git', args: ['status', '--short'], cwd: 'repository' },
    workingDirectory: 'repository',
    timeoutMs: 15_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'git-status',
  },
  {
    id: 'repository-diff-check',
    name: 'Repository diff check',
    description: 'Allowlisted git diff --check. Host runner only.',
    category: 'repository',
    severity: 'medium',
    executionType: 'host_process',
    command: { executable: 'git', args: ['diff', '--check'], cwd: 'repository' },
    workingDirectory: 'repository',
    timeoutMs: 15_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'git-diff',
  },
  {
    id: 'ai-service-health',
    name: 'AI service health',
    description: 'Optional injected probe of /health. No secrets are sent.',
    category: 'service',
    severity: 'high',
    executionType: 'injected',
    timeoutMs: 4_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'health',
  },
  {
    id: 'configuration-health',
    name: 'Configuration health',
    description: 'Checks whether required public configuration names are present. Values are never returned.',
    category: 'configuration',
    severity: 'high',
    executionType: 'in_process',
    timeoutMs: 1_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'in-process',
  },
  {
    id: 'runtime-health',
    name: 'Runtime health',
    description: 'Confirms registries and policy are loaded. Not continuous monitoring.',
    category: 'service',
    severity: 'medium',
    executionType: 'in_process',
    timeoutMs: 1_000,
    safeToRun: true,
    enabled: true,
    outputParser: 'in-process',
  },
] as const;

const BY_ID = new Map(GUARDIAN_CHECK_REGISTRY.map((check) => [check.id, check]));

export function isGuardianCheckId(id: string): id is GuardianCheckId {
  return BY_ID.has(id as GuardianCheckId);
}

export function getGuardianCheck(id: string): GuardianCheckDefinition | undefined {
  return BY_ID.get(id as GuardianCheckId);
}

export function listGuardianChecks(): readonly GuardianCheckDefinition[] {
  return GUARDIAN_CHECK_REGISTRY;
}

export function listHostGuardianChecks(): readonly GuardianCheckDefinition[] {
  return GUARDIAN_CHECK_REGISTRY.filter((check) => check.executionType === 'host_process' && check.enabled);
}
