export type OllamaToolId =
  | 'CLAUDE_CODE'
  | 'CODEX_CLI'
  | 'OPENCLAW'
  | 'OPENCODE'
  | 'HERMES_AGENT'
  | 'HERMES_DESKTOP'
  | 'DROID'
  | 'PI'
  | 'CLINE'
  | 'COPILOT_CLI'
  | 'OH_MY_PI'
  | 'DEEPSEEK_HARNESS'
  | 'QWEN_CODE'
  | 'TERMINAL';

export interface OllamaToolSpec {
  id: OllamaToolId;
  launch: string;
  role: 'CODER' | 'REVIEWER' | 'RESEARCHER' | 'ORCHESTRATOR' | 'TOOLKIT' | 'TERMINAL';
  requiresNetwork: boolean;
  parallelEligible: boolean;
  enabledByDefault: boolean;
  productionAuthority: false;
}

export const OLLAMA_TOOLCHAIN: readonly OllamaToolSpec[] = Object.freeze([
  { id: 'CLAUDE_CODE', launch: 'ollama launch claude', role: 'CODER', requiresNetwork: false, parallelEligible: true, enabledByDefault: false, productionAuthority: false },
  { id: 'CODEX_CLI', launch: 'ollama launch codex', role: 'CODER', requiresNetwork: false, parallelEligible: true, enabledByDefault: true, productionAuthority: false },
  { id: 'OPENCLAW', launch: 'ollama launch openclaw', role: 'TOOLKIT', requiresNetwork: false, parallelEligible: true, enabledByDefault: false, productionAuthority: false },
  { id: 'OPENCODE', launch: 'ollama launch opencode', role: 'CODER', requiresNetwork: false, parallelEligible: true, enabledByDefault: true, productionAuthority: false },
  { id: 'HERMES_AGENT', launch: 'ollama launch hermes', role: 'RESEARCHER', requiresNetwork: false, parallelEligible: true, enabledByDefault: true, productionAuthority: false },
  { id: 'HERMES_DESKTOP', launch: 'ollama launch hermes-desktop', role: 'ORCHESTRATOR', requiresNetwork: false, parallelEligible: false, enabledByDefault: false, productionAuthority: false },
  { id: 'DROID', launch: 'ollama launch droid', role: 'CODER', requiresNetwork: false, parallelEligible: true, enabledByDefault: false, productionAuthority: false },
  { id: 'PI', launch: 'ollama launch pi', role: 'TOOLKIT', requiresNetwork: false, parallelEligible: true, enabledByDefault: true, productionAuthority: false },
  { id: 'CLINE', launch: 'ollama launch cline', role: 'CODER', requiresNetwork: false, parallelEligible: true, enabledByDefault: false, productionAuthority: false },
  { id: 'COPILOT_CLI', launch: 'ollama launch copilot', role: 'CODER', requiresNetwork: true, parallelEligible: true, enabledByDefault: false, productionAuthority: false },
  { id: 'OH_MY_PI', launch: 'ollama launch omp', role: 'TOOLKIT', requiresNetwork: false, parallelEligible: true, enabledByDefault: false, productionAuthority: false },
  { id: 'DEEPSEEK_HARNESS', launch: 'ollama launch dsh', role: 'RESEARCHER', requiresNetwork: false, parallelEligible: true, enabledByDefault: true, productionAuthority: false },
  { id: 'QWEN_CODE', launch: 'ollama launch qwen', role: 'CODER', requiresNetwork: false, parallelEligible: true, enabledByDefault: true, productionAuthority: false },
  { id: 'TERMINAL', launch: 'ollama run', role: 'TERMINAL', requiresNetwork: false, parallelEligible: false, enabledByDefault: true, productionAuthority: false },
]);

export const OLLAMA_TOOLCHAIN_GUARDRAILS = {
  localFirst: true,
  maxConcurrentTools: 8,
  productionWritesAllowed: false,
  autonomousDeployAllowed: false,
  secretsFromEnvironmentOnly: true,
  shellCommandAllowlistRequired: true,
  evidenceReceiptRequired: true,
} as const;

export function planOllamaToolchain(input: {
  offline: boolean;
  requestedRoles: readonly OllamaToolSpec['role'][];
  installedTools?: readonly OllamaToolId[];
}): readonly OllamaToolSpec[] {
  const installed = new Set(input.installedTools ?? []);
  return Object.freeze(OLLAMA_TOOLCHAIN
    .filter((tool) => input.requestedRoles.includes(tool.role))
    .filter((tool) => !input.offline || !tool.requiresNetwork)
    .filter((tool) => installed.size === 0 ? tool.enabledByDefault : installed.has(tool.id))
    .slice(0, OLLAMA_TOOLCHAIN_GUARDRAILS.maxConcurrentTools));
}
