import { isAllowedLocalCommand, runAllowedLocalCommand, type AllowedLocalCommand } from './local-command-runner';

export type TestingAgentRunner = typeof runAllowedLocalCommand;

export type TestingAgentResult = {
  commandId: AllowedLocalCommand;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  productionEffect: false;
};

export async function runTestingAgent(input: {
  cwd: string;
  commands: string[];
  timeoutMs?: number;
  runner?: TestingAgentRunner;
}) {
  const runner = input.runner ?? runAllowedLocalCommand;
  const results: TestingAgentResult[] = [];

  for (const commandId of input.commands) {
    if (!isAllowedLocalCommand(commandId)) {
      return {
        passed: false as const,
        reason: `TESTING_AGENT_COMMAND_NOT_ALLOWLISTED:${commandId}`,
        results,
        productionEffect: false as const,
        productionAuthorization: false as const,
      };
    }
    const result = await runner({ id: commandId, cwd: input.cwd, timeoutMs: input.timeoutMs });
    results.push({
      commandId,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      stdout: result.stdout,
      stderr: result.stderr,
      productionEffect: false,
    });
  }

  const passed = results.length > 0 && results.every((result) => result.exitCode === 0 && !result.timedOut);
  return {
    passed,
    reason: passed ? 'Allowlisted local commands completed with exit code 0.' : 'One or more allowlisted commands failed or timed out.',
    results,
    productionEffect: false as const,
    productionAuthorization: false as const,
  };
}
