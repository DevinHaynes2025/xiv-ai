import { nowIso } from '../actions';
import { GUARDIAN_CHECK_REGISTRY, type GuardianCheckDefinition, type GuardianCheckId } from './checks';
import {
  rollupOverall,
  summarizeReport,
  type GuardianCheckResult,
  type GuardianHealthReport,
} from './health';

export type GuardianCheckHandler = () => Promise<Pick<GuardianCheckResult, 'status' | 'message'>> | Pick<GuardianCheckResult, 'status' | 'message'>;

export type GuardianRunnerOptions = {
  handlers?: Partial<Record<GuardianCheckId, GuardianCheckHandler>>;
};

function configurationPresence(): Pick<GuardianCheckResult, 'status' | 'message'> {
  const supabasePresent = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  );
  const publicAiPresent = Boolean(process.env.EXPO_PUBLIC_XIV_AI_URL);

  if (supabasePresent && publicAiPresent) {
    return {
      status: 'healthy',
      message: 'Supabase and AI service URL names are present. Values are not displayed.',
    };
  }
  if (supabasePresent || publicAiPresent) {
    return {
      status: 'warning',
      message: 'Some expected public configuration names are present. Missing names are not listed with values.',
    };
  }
  return {
    status: 'unknown',
    message: 'Public configuration names were not visible in this runtime. This is not a secret scan.',
  };
}

function prototypeResult(check: GuardianCheckDefinition): Pick<GuardianCheckResult, 'status' | 'message'> {
  if (check.id === 'repository-health' || check.id === 'runtime-health') {
    return {
      status: 'healthy',
      message: 'Agent registry, tool registry, policy engine, and Guardian checks are registered. Not continuous monitoring.',
    };
  }
  if (check.id === 'validation-status') {
    return {
      status: 'unknown',
      message: 'Host TypeScript, lint, and Expo Doctor execution is not wired. This is a placeholder.',
    };
  }
  return {
    status: 'unknown',
    message: `${check.name} is allowlisted but was not executed. Guardian does not run arbitrary shell commands.`,
  };
}

async function runCheck(
  check: GuardianCheckDefinition,
  handlers: Partial<Record<GuardianCheckId, GuardianCheckHandler>>,
): Promise<GuardianCheckResult> {
  const started = Date.now();
  const timestamp = nowIso();

  if (!check.enabled) {
    return {
      id: check.id,
      status: 'skipped',
      message: `${check.name} is disabled.`,
      durationMs: Date.now() - started,
      timestamp,
    };
  }

  const injected = handlers[check.id];
  try {
    const result = injected
      ? await injected()
      : check.handler === 'configuration_presence'
        ? configurationPresence()
        : prototypeResult(check);

    return {
      id: check.id,
      status: result.status,
      message: result.message,
      durationMs: Date.now() - started,
      timestamp,
    };
  } catch {
    return {
      id: check.id,
      status: 'warning',
      message: `${check.name} handler failed without exposing internals.`,
      durationMs: Date.now() - started,
      timestamp,
    };
  }
}

/**
 * Runs only hardcoded registry checks. Never accepts model-generated commands.
 */
export async function runGuardianSnapshot(options: GuardianRunnerOptions = {}): Promise<GuardianHealthReport> {
  const checks: GuardianCheckResult[] = [];
  for (const check of GUARDIAN_CHECK_REGISTRY) {
    checks.push(await runCheck(check, options.handlers ?? {}));
  }

  const overallStatus = rollupOverall(checks);
  return {
    overallStatus,
    prototype: true,
    continuousMonitoring: false,
    generatedAt: nowIso(),
    checks,
    summary: summarizeReport(overallStatus, checks),
    recommendedActions: [
      'Treat this snapshot as observation only.',
      'Do not apply automatic production fixes from Guardian.',
      'Run allowlisted developer checks from a trusted host when a concrete TypeScript, lint, or Expo result is needed.',
    ],
  };
}
