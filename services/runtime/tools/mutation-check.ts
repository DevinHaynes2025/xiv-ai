/**
 * Mutation check for the acceptance suite.
 *
 * A suite that passes tells you nothing on its own: it might be asserting
 * something that cannot fail. This seeds a fault into one runtime guard at a
 * time and requires the acceptance criteria that claim to cover that guard to
 * turn FAIL. A mutation that survives means the thresholds covering it are
 * decorative, and that is reported as a survivor rather than a pass.
 *
 * Each mutation runs in a fresh child process so the module graph is reloaded,
 * and the source file is restored afterwards whether or not the run succeeded.
 *
 * Usage: tsx tools/mutation-check.ts [--json]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = resolve(here, '..');

export type Mutation = {
  id: string;
  /** The guard this fault removes, in the terms the criteria are written in. */
  guard: string;
  file: string;
  find: string;
  replace: string;
  /** Criteria that must turn FAIL. Anything less is a surviving mutation. */
  expectFailing: string[];
};

export const MUTATIONS: readonly Mutation[] = [
  {
    id: 'isolation_cross_tenant_read',
    guard: 'tenant store refuses a read from another tenant',
    file: 'src/isolation.ts',
    find: `    if (!row) return undefined;
    if (!sameTenant(scope, row.tenant)) {`,
    replace: `    if (!row) return undefined;
    if (false) {`,
    expectFailing: ['AC-03'],
  },
  {
    id: 'router_ignores_organization',
    guard: 'router excludes nodes belonging to another organization',
    file: 'src/router.ts',
    find: '      if (node.tenant.organizationId !== spec.tenant.organizationId) {',
    replace: '      if (false) {',
    expectFailing: ['AC-03'],
  },
  {
    id: 'attestation_gate_open',
    guard: 'protected work requires a passing, unexpired attestation',
    file: 'src/attestation.ts',
    find: "    if (state.status !== 'required_pass') {",
    replace: '    if (false) {',
    expectFailing: ['AC-02'],
  },
  {
    id: 'capability_check_removed',
    guard: 'a workload may not request capabilities its principal lacks',
    file: 'src/authorization.ts',
    find: "    if (missing.length) return refuse('capability_missing');",
    replace: '    if (false) return refuse(\'capability_missing\');',
    expectFailing: ['AC-04'],
  },
  {
    id: 'unbounded_budget_admitted',
    guard: 'a workload without a finite hard-termination limit is refused',
    file: 'src/governor.ts',
    find: '    if (!Number.isFinite(budget.hardTerminationMs) || budget.hardTerminationMs <= 0) {',
    replace: '    if (false) {',
    expectFailing: ['AC-04'],
  },
  {
    id: 'hard_termination_never_fires',
    guard: 'a workload past its hard-termination limit is killed',
    file: 'src/governor.ts',
    find: '    if (elapsed > lease.budget.hardTerminationMs || elapsed > MANDATORY_HARD_TERMINATION_MS) {',
    replace: '    if (false) {',
    expectFailing: ['AC-08'],
  },
  {
    id: 'unapproved_model_invocable',
    guard: 'only approved, gated, configured models may be invoked',
    file: 'src/models.ts',
    find: "    if (state !== 'available') {",
    replace: '    if (false) {',
    expectFailing: ['AC-14'],
  },
  {
    id: 'model_substitution_allowed',
    guard: 'the runtime may not substitute a different model',
    file: 'src/models.ts',
    find: '    if (resolved !== entry.modelId) {',
    replace: '    if (false) {',
    expectFailing: ['AC-14'],
  },
  {
    id: 'expired_offline_package_accepted',
    guard: 'an expired offline work package is refused',
    file: 'src/offline.ts',
    find: '    if (this.clock.now() > grant.expiresAt) {',
    replace: '    if (false) {',
    expectFailing: ['AC-10'],
  },
  {
    id: 'corrupt_snapshot_restored',
    guard: 'a snapshot whose digest does not match is refused',
    file: 'src/snapshot.ts',
    find: '    if (!integrityVerified) {',
    replace: '    if (false) {',
    expectFailing: ['AC-23'],
  },
  {
    id: 'kill_switch_stops_blocking',
    guard: 'a paused, quarantined or revoked node stays out of scheduling',
    file: 'src/control.ts',
    find: `  isBlocked(nodeId: string): boolean {
    return this.blockedNodes.has(nodeId);`,
    replace: `  isBlocked(nodeId: string): boolean {
    return false;`,
    expectFailing: ['AC-13'],
  },
  {
    id: 'external_action_replayed',
    guard: 'an external action is executed once even across a recovery',
    file: 'src/external-actions.ts',
    find: '    if (existing) {',
    replace: '    if (false && existing) {',
    expectFailing: ['AC-12'],
  },
  {
    id: 'cost_overrun_unauthorized',
    guard: 'a workload over its cost budget continues only with authorization',
    file: 'src/cost.ts',
    find: '    if (!authorization) {',
    replace: '    if (false) {',
    expectFailing: ['AC-21'],
  },
  {
    id: 'agent_key_collision_allowed',
    guard: 'one agent key resolves to one agent inside a tenant',
    file: 'src/agents.ts',
    find: '    const existingAgentId = this.slots.get(slot);',
    replace: '    const existingAgentId = undefined as string | undefined;',
    expectFailing: ['AC-09'],
  },
  {
    id: 'api_capability_check_removed',
    guard: 'the control surface refuses a caller lacking the route capability',
    file: 'src/server.ts',
    find: '    if (route.capability && !principal.capabilities.includes(route.capability as never)) {',
    replace: '    if (false) {',
    expectFailing: ['AC-19'],
  },
  {
    id: 'meeting_roster_unverified',
    guard: 'a meeting roster that was tampered with fails verification',
    file: 'src/meetings.ts',
    find: '    const rosterIntact = verifySignature(this.keys.meeting, {',
    replace: '    const rosterIntact = true || verifySignature(this.keys.meeting, {',
    expectFailing: ['AC-11'],
  },
];

export type MutationOutcome = {
  id: string;
  guard: string;
  expectFailing: string[];
  /** Criteria that actually turned FAIL. */
  observedFailing: string[];
  /** True when every expected criterion failed, i.e. the fault was detected. */
  detected: boolean;
  error?: string;
};

/**
 * Runs the given criteria in a child process and returns the ones reporting
 * FAIL. A crash counts as detection: the suite refused to report a pass.
 */
function statusesFor(acIds: readonly string[]): { failing: string[]; error?: string } {
  try {
    const output = execFileSync(
      'node',
      ['--import', 'tsx', join(runtimeRoot, 'tools/mutation-probe.ts'), ...acIds],
      { cwd: runtimeRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const line = output.split('\n').find((entry) => entry.startsWith('{'));
    if (!line) return { failing: [], error: 'probe produced no result line' };
    const parsed = JSON.parse(line) as Record<string, string>;
    return { failing: Object.entries(parsed).filter(([, status]) => status !== 'PASS').map(([id]) => id) };
  } catch (error) {
    // A guard removed mid-flight can make a producer throw. The criterion did
    // not report PASS, which is the property being checked.
    return { failing: [...acIds], error: (error as { message?: string }).message?.slice(0, 200) };
  }
}

export function runMutationCheck(mutations: readonly Mutation[] = MUTATIONS): MutationOutcome[] {
  const outcomes: MutationOutcome[] = [];
  // Contents as found, so the restore can be checked rather than trusted. A
  // tool that edits source in place and leaves a fault behind is worse than no
  // tool.
  const pristine = new Map<string, string>();
  for (const mutation of mutations) {
    const path = join(runtimeRoot, mutation.file);
    if (!pristine.has(path)) pristine.set(path, readFileSync(path, 'utf8'));
  }

  for (const mutation of mutations) {
    const path = join(runtimeRoot, mutation.file);
    const original = readFileSync(path, 'utf8');
    if (!original.includes(mutation.find)) {
      outcomes.push({
        id: mutation.id,
        guard: mutation.guard,
        expectFailing: mutation.expectFailing,
        observedFailing: [],
        detected: false,
        error: `anchor not found in ${mutation.file}; the guard moved and this mutation no longer tests it`,
      });
      continue;
    }
    if (original.split(mutation.find).length !== 2) {
      outcomes.push({
        id: mutation.id,
        guard: mutation.guard,
        expectFailing: mutation.expectFailing,
        observedFailing: [],
        detected: false,
        error: `anchor is not unique in ${mutation.file}`,
      });
      continue;
    }

    try {
      writeFileSync(path, original.replace(mutation.find, mutation.replace));
      const { failing, error } = statusesFor(mutation.expectFailing);
      outcomes.push({
        id: mutation.id,
        guard: mutation.guard,
        expectFailing: mutation.expectFailing,
        observedFailing: failing,
        detected: mutation.expectFailing.every((id) => failing.includes(id)),
        error,
      });
    } finally {
      writeFileSync(path, original);
    }
  }

  for (const [path, contents] of pristine) {
    if (readFileSync(path, 'utf8') !== contents) {
      writeFileSync(path, contents);
      throw new Error(`mutation-check left ${path} modified; it has been restored, but re-run to get clean results`);
    }
  }

  return outcomes;
}

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (invokedDirectly) {
  const outcomes = runMutationCheck();
  const survivors = outcomes.filter((outcome) => !outcome.detected);
  if (process.argv.includes('--json')) {
    console.info(JSON.stringify({ outcomes, survivors: survivors.length }, null, 2));
  } else {
    for (const outcome of outcomes) {
      const mark = outcome.detected ? 'DETECTED' : 'SURVIVED';
      console.info(`[mutation] ${mark.padEnd(9)} ${outcome.id} — ${outcome.guard}`);
      if (!outcome.detected) {
        console.info(
          `[mutation]           expected ${outcome.expectFailing.join(', ')} to fail, observed ${outcome.observedFailing.join(', ') || 'none'}${outcome.error ? ` (${outcome.error})` : ''}`,
        );
      }
    }
    console.info(`[mutation] ${outcomes.length - survivors.length}/${outcomes.length} seeded faults detected`);
  }
  if (survivors.length) process.exitCode = 1;
}
