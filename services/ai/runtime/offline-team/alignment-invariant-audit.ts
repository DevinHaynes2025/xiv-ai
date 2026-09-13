/**
 * 12D-113: Mechanical alignment-invariant audit for the XIV offline-team runtime.
 *
 * This module turns the cross-agent alignment briefing's shared invariants into a
 * mechanical, repeatable source audit over `runtime/offline-team/*.ts` (non-test files).
 * It audits sources; it executes none of them, makes no network call, starts no worker,
 * and changes nothing.
 *
 * Audited invariants (alignment briefing §3):
 *  1. Every *_GUARDRAILS object is Object.freeze'd and carries humanDecision: 'REQUIRED'.
 *     Violations are classified against the GENERATED debt ledger
 *     (alignment-invariant-debt.ts): a violation matching the ledger exactly is counted
 *     as known debt (tracked, shrink-only); any other violation is a FINDING.
 *  2. No guardrails module makes network calls (any network primitive in a guardrails
 *     module is a finding — debt cannot grandfather a network call).
 *  3. Any non-test module using a network primitive must be an explicitly listed,
 *     reason-justified authorized surface AND must bind to the local plane
 *     (127.0.0.1 / localhost), directly or via its named loopback module; an unlisted or
 *     non-loopback network user is a finding.
 *  4. The device capability ladder stays distinct: all six DeviceEnrollmentState values
 *     are declared, and no state is aliased to another.
 *  5. Scale honesty markers exist: the queue's proven 2,000,000-row ceiling and the
 *     partition contract's billionUsersProven: false.
 *
 * The debt ledger may only SHRINK: an entry that becomes compliant without being removed
 * from the ledger is itself a finding (debt-ledger-stale), so the ledger is forced to be
 * updated when debt is paid.
 *
 * HONEST STATE: humanDecision 'REQUIRED', learningPromoted: false, auditOnly: true,
 * liveAgentCount: null. This audit cannot fix anything it finds; remediation is a
 * separate human-reviewed change.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { KNOWN_GUARDRAILS_DEBT, type KnownGuardrailsDebtEntry } from './alignment-invariant-debt';

export const ALIGNMENT_AUDIT_POLICY = Object.freeze({
  auditOnly: true,
  fixesAnything: false,
  maxFindingsReported: 400,
  maxFilesScanned: 500,
});

export const ALIGNMENT_AUDIT_GUARDRAILS = Object.freeze({
  auditOnly: true,
  executesAuditedModules: false,
  makesNetworkCalls: false,
  startsWorkers: false,
  promotesLearning: false,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

/** Network primitives that count as "makes network calls" for this audit. */
const NETWORK_PATTERN = /from ['"]node:(http|https|net|dns|dgram|tls|undici)['"]|fetch\s*\(|new\s+WebSocket|require\s*\(\s*['"](?:node:)?(?:http|https|net|dns)['"]|axios|undici/;

/** Loopback / local-plane literals that justify a network-using module as authorized. */
const LOOPBACK_PATTERN = /127\.0\.0\.1|localhost|::1/;

/** Authorized network-primitive surfaces (each must carry its loopback justification). */
export const AUTHORIZED_NETWORK_SURFACES: readonly { file: string; reason: string; viaLoopbackModules?: readonly string[] }[] = Object.freeze([
  { file: 'agent-tool-heartbeat-fabric.ts', reason: 'loopback-only Ollama collaboration bus (127.0.0.1:11434)' },
  { file: 'alignment-invariant-audit.ts', reason: 'this audit: NETWORK_PATTERN/AUTHORIZED list contain pattern text, not calls (self-excluded from network invariants)' },
  { file: 'background-shift.cli.ts', reason: 'operator-invoked CLI whose fetch wrapper feeds the loopback-bound meeting engine', viaLoopbackModules: ['agent-tool-heartbeat-fabric.ts'] },
  { file: 'claude-text-reviewer.ts', reason: 'spawns the local reviewer executable; no network import' },
  { file: 'control-tower-http-server.ts', reason: 'loopback-bound, token-gated control-tower HTTP server' },
  { file: 'ollama-job-cli.ts', reason: 'operator-invoked CLI feeding the loopback-bound Ollama job executor', viaLoopbackModules: ['ollama-job-executor.ts'] },
  { file: 'ollama-meeting-runner.ts', reason: 'loopback-only Ollama meeting runner (127.0.0.1:11434)' },
  { file: 'supervised-local-worker.ts', reason: 'loopback-only Ollama runtime bridge (127.0.0.1:11434)' },
  { file: 'supervisor-cli.ts', reason: 'operator-invoked CLI feeding the loopback-bound model discovery surface', viaLoopbackModules: ['model-discovery.ts'] },
]);

/** The audit module itself carries network-pattern TEXT (regex literals, authorized-list entries), not calls. */
const AUDIT_SELF_FILE = 'alignment-invariant-audit.ts';

const DEVICE_STATES: readonly string[] = [
  'ENROLLED_NOT_ACTIVE', 'ELIGIBLE_FOR_LOCAL_TASKS', 'PAUSED', 'REVOKED', 'EXPIRED', 'UNVERIFIED_COMPATIBILITY',
];

export interface AlignmentFinding {
  invariant: string;
  file: string;
  detail: string;
}

export interface AlignmentAuditPacket {
  kind: 'ALIGNMENT_INVARIANT_AUDIT';
  auditedAtMs: number;
  filesScanned: number;
  guardrailObjects: number;
  compliantGuardrailObjects: number;
  knownDebtViolations: number;
  knownDebtLedgerSize: number;
  authorizedNetworkSurfaces: number;
  findings: readonly AlignmentFinding[];
  auditOnly: true;
  liveAgentCount: null;
  learningPromoted: false;
  automaticRecovery: false;
  humanDecision: 'REQUIRED';
}

type DebtFacet = KnownGuardrailsDebtEntry['missing'][number];

/** Extracts the balanced object-literal body that follows an Object.freeze( occurrence. */
function objectBodyFrom(source: string, openHint: number): string | null {
  const open = source.indexOf('{', openHint);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
}

const sameFacets = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

export function auditAlignmentInvariants(input: {
  dir: string;
  auditedAtMs: number;
}): AlignmentAuditPacket {
  if (!input || typeof input.dir !== 'string' || input.dir.length === 0) throw new Error('audit directory required');
  if (!Number.isSafeInteger(input.auditedAtMs) || input.auditedAtMs < 0) throw new Error('audit timestamp required');
  const findings: AlignmentFinding[] = [];
  const add = (invariant: string, file: string, detail: string) => {
    if (findings.length < ALIGNMENT_AUDIT_POLICY.maxFindingsReported) {
      findings.push(Object.freeze({ invariant, file, detail }));
    }
  };

  const debtByKey = new Map(KNOWN_GUARDRAILS_DEBT.map((e) => [`${e.file}::${e.object}`, e]));
  const debtSeen = new Set<string>();
  let guardrailObjects = 0;
  let compliantGuardrailObjects = 0;
  let knownDebtViolations = 0;

  const names = readdirSync(input.dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')).sort();
  if (names.length > ALIGNMENT_AUDIT_POLICY.maxFilesScanned) throw new Error('too many source files for one audit');

  for (const name of names) {
    const path = join(input.dir, name);
    let source: string;
    try {
      source = readFileSync(path, 'utf8');
    } catch {
      add('readable-source', name, 'audit could not read the file');
      continue;
    }

    // Invariant 1: every *_GUARDRAILS declaration is Object.freeze'd with humanDecision REQUIRED.
    const guardrailPattern = /\b([A-Z][A-Z0-9_]*_GUARDRAILS)\b\s*=/g;
    let match: RegExpExecArray | null;
    while ((match = guardrailPattern.exec(source)) !== null) {
      guardrailObjects += 1;
      const objectName = match[1];
      const eqIndex = match.index + match[0].length;
      const tail = source.slice(eqIndex, eqIndex + 120);
      const frozen = /^\s*Object\.freeze\(/.test(tail);
      const body = objectBodyFrom(source, eqIndex);
      const humanDecisionRequired = body !== null && /humanDecision\s*:\s*'REQUIRED'/.test(body);
      if (frozen && humanDecisionRequired) {
        compliantGuardrailObjects += 1;
        if (debtByKey.has(`${name}::${objectName}`)) {
          debtSeen.add(`${name}::${objectName}`);
          add('debt-ledger-stale', name, `${objectName} is now compliant; remove its KNOWN_GUARDRAILS_DEBT entry (the ledger may only shrink, never hide compliance)`);
        }
        continue;
      }
      const missing: DebtFacet[] = [
        ...(!frozen ? (['freeze'] as const) : []),
        ...(!humanDecisionRequired ? (['humanDecision'] as const) : []),
      ];
      const entry = debtByKey.get(`${name}::${objectName}`);
      if (entry && sameFacets(entry.missing, missing)) {
        knownDebtViolations += 1;
        debtSeen.add(`${name}::${objectName}`);
        continue;
      }
      if (entry) {
        debtSeen.add(`${name}::${objectName}`);
        add('guardrails-definition', name, `${objectName} violates the ledger's recorded facets (${entry.missing.join(', ')}) with different facets (${missing.join(', ')}); update the ledger or fix the object`);
      } else {
        add('guardrails-definition', name, `${objectName} violates the guardrails invariants (missing: ${missing.join(', ')}) and is not in the debt ledger`);
      }
    }

    // The audit's own file contains network-pattern TEXT, not network calls.
    if (name === AUDIT_SELF_FILE) continue;

    // Invariant 2: a guardrails module must not itself make network calls.
    const usesNetwork = NETWORK_PATTERN.test(source);
    const declaresGuardrails = /\b[A-Z][A-Z0-9_]*_GUARDRAILS\b\s*=/.test(source);
    if (declaresGuardrails && usesNetwork) {
      add('guardrails-no-network', name, 'a module declaring *_GUARDRAILS also uses a network primitive');
    }

    // Invariant 3: network-primitive users must be authorized and loopback-bound.
    if (usesNetwork) {
      const authorized = AUTHORIZED_NETWORK_SURFACES.find((a) => a.file === name);
      if (!authorized) {
        add('network-surface-authorized', name, 'network primitive used by a module absent from AUTHORIZED_NETWORK_SURFACES');
      } else {
        const usesChildProcessOnly = /from ['"]node:child_process['"]/.test(source)
          && !/fetch\s*\(|node:http|node:https|node:net|WebSocket/.test(source);
        let viaModuleLoopback = false;
        if (authorized.viaLoopbackModules !== undefined) {
          // Fail closed: an unreadable named loopback module never counts as bound.
          for (const viaModule of authorized.viaLoopbackModules) {
            try {
              if (LOOPBACK_PATTERN.test(readFileSync(join(input.dir, viaModule), 'utf8'))) {
                viaModuleLoopback = true;
                break;
              }
            } catch {
              // fall through: unreadable module does not justify loopback binding
            }
          }
        }
        const bindsLocalPlane = LOOPBACK_PATTERN.test(source) || viaModuleLoopback;
        if (!usesChildProcessOnly && !bindsLocalPlane) {
          add('network-surface-loopback', name, `authorized surface '${name}' has no local-plane binding in source`);
        }
      }
    }
  }

  // Invariant 4: the device ladder stays distinct — all six states declared, no aliases.
  const ladderFile = 'device-fleet-enrollment.ts';
  let ladderSource: string | null = null;
  try {
    ladderSource = readFileSync(join(input.dir, ladderFile), 'utf8');
  } catch {
    add('ladder-distinct', ladderFile, 'device ladder module could not be read');
  }
  if (ladderSource !== null) {
    for (const state of DEVICE_STATES) {
      const pattern = new RegExp(`'${state}'`, 'g');
      const occurrences = (ladderSource.match(pattern) ?? []).length;
      if (occurrences === 0) add('ladder-distinct', ladderFile, `device state ${state} is not declared`);
    }
    for (const [a, b] of [['VERIFIED', 'TARGETED'], ['ENROLLED_NOT_ACTIVE', 'TARGETED'], ['ELIGIBLE_FOR_LOCAL_TASKS', 'VERIFIED']] as const) {
      const alias = new RegExp(`${a}\\s*(==|===)\\s*['"]${b}['"]`);
      if (alias.test(ladderSource)) add('ladder-distinct', ladderFile, `${a} may be aliased to ${b} in the ladder module`);
    }
  }

  // Invariant 5: scale honesty markers exist.
  const scaleChecks: readonly { file: string; marker: RegExp; label: string }[] = [
    { file: 'offline-story-queue.ts', marker: /2_000_000|2000000/, label: 'queue 2,000,000-row policy ceiling' },
    { file: 'queue-partition-contract.ts', marker: /billionUsersProven\s*:\s*false/, label: 'partition contract billionUsersProven:false' },
  ];
  for (const check of scaleChecks) {
    let scaleSource: string | null = null;
    try {
      scaleSource = readFileSync(join(input.dir, check.file), 'utf8');
    } catch {
      add('scale-honesty', check.file, `scale marker source (${check.label}) could not be read`);
      continue;
    }
    if (!check.marker.test(scaleSource)) add('scale-honesty', check.file, `missing scale honesty marker: ${check.label}`);
  }

  // Ledger hygiene: every ledger entry must have been observed as still-violating or
  // still-compliant in this audit; an entry whose file no longer declares the object at
  // all is stale ledger data.
  for (const entry of KNOWN_GUARDRAILS_DEBT) {
    if (!debtSeen.has(`${entry.file}::${entry.object}`)) {
      add('debt-ledger-stale', entry.file, `ledger entry ${entry.object} was not observed in the audit (fixed, renamed, or removed) — update KNOWN_GUARDRAILS_DEBT`);
    }
  }

  return Object.freeze({
    kind: 'ALIGNMENT_INVARIANT_AUDIT' as const,
    auditedAtMs: input.auditedAtMs,
    filesScanned: names.length,
    guardrailObjects,
    compliantGuardrailObjects,
    knownDebtViolations,
    knownDebtLedgerSize: KNOWN_GUARDRAILS_DEBT.length,
    authorizedNetworkSurfaces: AUTHORIZED_NETWORK_SURFACES.length,
    findings,
    auditOnly: true as const,
    liveAgentCount: null as null,
    learningPromoted: false as const,
    automaticRecovery: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}