import type { GuardianCheckDefinition, GuardianOutputParser } from './checks';
import type { GuardianCheckStatus } from './health';

export const OUTPUT_CHAR_LIMIT = 800;

export type HostExecutionResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type ParsedCheckOutcome = {
  status: GuardianCheckStatus;
  message: string;
  diagnosis: string;
  recommendedAction: string;
  outputSummary: string;
};

const SECRET_LINE = /(api[_-]?key|secret|password|token|gemini|supabase)=/i;

export function truncateOutput(text: string, max = OUTPUT_CHAR_LIMIT) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function sanitizeOutput(text: string) {
  return truncateOutput(
    text
      .split(/\r?\n/)
      .filter((line) => !SECRET_LINE.test(line))
      .join('\n'),
  );
}

export function containsEnvValues(text: string, env: Record<string, string | undefined>) {
  return Object.values(env).some((value) => Boolean(value && value.length > 8 && text.includes(value)));
}

export function diagnoseParser(parser: GuardianOutputParser, failed: boolean) {
  if (!failed) return 'Check completed with a passing exit code.';
  if (parser === 'typescript') return 'Compile/type health failure.';
  if (parser === 'lint') return 'Code quality warning.';
  if (parser === 'expo-doctor') return 'Dependency or Expo configuration health issue.';
  if (parser === 'runtime-tests') return 'Governed runtime regression.';
  if (parser === 'git-diff') return 'Whitespace or conflict hygiene issue.';
  if (parser === 'git-status') return 'Working tree hygiene notice.';
  if (parser === 'health') return 'Service availability warning.';
  return 'Check did not pass.';
}

export function recommendedActionFor(parser: GuardianOutputParser, failed: boolean) {
  if (!failed) return 'No developer action required.';
  if (parser === 'typescript') return 'Fix TypeScript errors on a trusted host, then re-run this check ID.';
  if (parser === 'lint') return 'Fix lint findings on a trusted host, then re-run mobile-lint.';
  if (parser === 'expo-doctor') return 'Review Expo Doctor findings on a trusted host.';
  if (parser === 'runtime-tests') return 'Inspect failing policy/runtime cases, then re-run runtime-tests.';
  if (parser === 'git-diff') return 'Fix whitespace or conflict markers, then re-run repository-diff-check.';
  if (parser === 'health') return 'Confirm the AI service is running. Guardian does not start it.';
  return 'Re-run the allowlisted check ID from a trusted host.';
}

export function parseHostResult(check: GuardianCheckDefinition, execution: HostExecutionResult): ParsedCheckOutcome {
  if (execution.timedOut) {
    return {
      status: 'unknown',
      message: `${check.name} timed out after ${check.timeoutMs}ms. No raw log is returned.`,
      diagnosis: 'Timeout — treated as an unknown developer validation result.',
      recommendedAction: 'Re-run this check ID on a trusted host with a healthy machine.',
      outputSummary: '',
    };
  }

  const failed = execution.exitCode !== 0;
  const status: GuardianCheckStatus = failed
    ? check.severity === 'high' || check.severity === 'critical'
      ? 'critical'
      : 'warning'
    : 'healthy';

  const outputSummary = sanitizeOutput(`${execution.stdout}\n${execution.stderr}`);
  return {
    status,
    message: failed
      ? `${check.name} failed (exit ${execution.exitCode ?? 'null'}). ${diagnoseParser(check.outputParser, true)}`
      : `${check.name} passed.`,
    diagnosis: diagnoseParser(check.outputParser, failed),
    recommendedAction: recommendedActionFor(check.outputParser, failed),
    outputSummary: failed ? outputSummary : '',
  };
}
