import { nowIso } from '../actions';
import {
  getGuardianCheck,
  GUARDIAN_CHECK_REGISTRY,
  isGuardianCheckId,
  listGuardianChecks,
  type GuardianCheckDefinition,
  type GuardianCheckId,
} from './checks';
import {
  countChecks,
  rollupOverall,
  summarizeReport,
  type GuardianCheckResult,
  type GuardianExecutionMode,
  type GuardianHealthReport,
} from './health';
import { parseHostResult, type HostExecutionResult } from './parse';

export type GuardianCheckHandler = () => Promise<Pick<GuardianCheckResult, 'status' | 'message'>> | Pick<GuardianCheckResult, 'status' | 'message'>;

export type GuardianHostAdapter = {
  execute(check: GuardianCheckDefinition): Promise<HostExecutionResult>;
};

export type GuardianRunnerOptions = {
  handlers?: Partial<Record<GuardianCheckId, GuardianCheckHandler>>;
  host?: GuardianHostAdapter;
};

function configurationPresence(): Pick<GuardianCheckResult, 'status' | 'message'> {
  const supabasePresent = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const publicAiPresent = Boolean(process.env.EXPO_PUBLIC_XIV_AI_URL);
  if (supabasePresent && publicAiPresent) {
    return { status: 'healthy', message: 'Supabase and AI service URL names are present. Values are not displayed.' };
  }
  if (supabasePresent || publicAiPresent) {
    return { status: 'warning', message: 'Some expected public configuration names are present. Values are not listed.' };
  }
  return { status: 'unknown', message: 'Public configuration names were not visible. This is not a secret scan.' };
}

function runtimeHealth(): Pick<GuardianCheckResult, 'status' | 'message'> {
  const loaded = listGuardianChecks().length > 0;
  return {
    status: loaded ? 'healthy' : 'critical',
    message: loaded
      ? 'Agent registry, tool registry, policy engine, and Guardian checks are registered. Not continuous monitoring.'
      : 'Guardian registry failed to load.',
  };
}

function deniedUnknown(id: string): GuardianCheckResult {
  return {
    id: 'unknown',
    name: 'Unknown check',
    status: 'denied',
    message: `Guardian accepts only registered check IDs. "${id}" is not registered. Raw commands are rejected.`,
    durationMs: 0,
    timestamp: nowIso(),
    safeToRun: false,
    executionMode: 'denied',
    diagnosis: 'Unknown check ID.',
    recommendedAction: 'Call runGuardianCheck with a registered ID such as mobile-typescript.',
  };
}

function modeFor(check: GuardianCheckDefinition, usedHost: boolean): GuardianExecutionMode {
  if (check.executionType === 'injected') return 'injected';
  if (check.executionType === 'in_process') return 'in_process';
  return usedHost ? 'trusted_host' : 'unavailable_on_device';
}

async function executeRegistered(
  check: GuardianCheckDefinition,
  options: GuardianRunnerOptions,
): Promise<GuardianCheckResult> {
  const started = Date.now();
  const timestamp = nowIso();
  if (!check.enabled) {
    return {
      id: check.id,
      name: check.name,
      status: 'skipped',
      message: `${check.name} is disabled.`,
      durationMs: Date.now() - started,
      timestamp,
      safeToRun: check.safeToRun,
      executionMode: 'in_process',
    };
  }

  const injected = options.handlers?.[check.id];
  if (injected) {
    const result = await injected();
    return {
      id: check.id,
      name: check.name,
      status: result.status,
      message: result.message,
      durationMs: Date.now() - started,
      timestamp,
      safeToRun: check.safeToRun,
      executionMode: 'injected',
    };
  }

  if (check.executionType === 'in_process') {
    const result = check.id === 'configuration-health' ? configurationPresence() : runtimeHealth();
    return {
      id: check.id,
      name: check.name,
      status: result.status,
      message: result.message,
      durationMs: Date.now() - started,
      timestamp,
      safeToRun: check.safeToRun,
      executionMode: 'in_process',
    };
  }

  if (check.executionType === 'host_process' && options.host) {
    const execution = await options.host.execute(check);
    const parsed = parseHostResult(check, execution);
    return {
      id: check.id,
      name: check.name,
      status: parsed.status,
      message: parsed.message,
      durationMs: Date.now() - started,
      timestamp,
      safeToRun: check.safeToRun,
      executionMode: 'trusted_host',
      diagnosis: parsed.diagnosis,
      recommendedAction: parsed.recommendedAction,
      outputSummary: parsed.outputSummary,
    };
  }

  return {
    id: check.id,
    name: check.name,
    status: 'unknown',
    message:
      check.executionType === 'host_process'
        ? `${check.name} requires the trusted host runner. It is not executed on device or from the agent runtime.`
        : `${check.name} has no injected probe in this pass.`,
    durationMs: Date.now() - started,
    timestamp,
    safeToRun: check.safeToRun,
    executionMode: modeFor(check, false),
    recommendedAction: 'Run npm run guardian:validate from services/ai on a trusted host.',
  };
}

/**
 * Accepts a registered check ID only. There is no exec(command) API.
 */
export async function runGuardianCheck(id: string, options: GuardianRunnerOptions = {}): Promise<GuardianCheckResult> {
  if (!isGuardianCheckId(id)) return deniedUnknown(id);
  const check = getGuardianCheck(id);
  if (!check) return deniedUnknown(id);
  try {
    return await executeRegistered(check, options);
  } catch {
    return {
      id: check.id,
      name: check.name,
      status: 'warning',
      message: `${check.name} handler failed without exposing internals.`,
      durationMs: 0,
      timestamp: nowIso(),
      safeToRun: check.safeToRun,
      executionMode: 'denied',
    };
  }
}

export async function runGuardianSnapshot(options: GuardianRunnerOptions = {}): Promise<GuardianHealthReport> {
  const checks: GuardianCheckResult[] = [];
  for (const check of GUARDIAN_CHECK_REGISTRY) {
    checks.push(await runGuardianCheck(check.id, options));
  }
  const counts = countChecks(checks);
  const overallStatus = rollupOverall(checks);
  return {
    overallStatus,
    prototype: true,
    continuousMonitoring: false,
    developerValidation: true,
    onDemand: true,
    generatedAt: nowIso(),
    checks,
    counts,
    summary: summarizeReport(overallStatus, counts),
    recommendedActions: [
      'This is developer validation, on-demand, not continuous monitoring.',
      'Do not apply automatic production fixes from Guardian.',
      'Host process checks run only from the trusted runner with static check IDs.',
    ],
  };
}

export async function runGuardianValidationSuite(options: GuardianRunnerOptions = {}): Promise<GuardianHealthReport> {
  return runGuardianSnapshot(options);
}
