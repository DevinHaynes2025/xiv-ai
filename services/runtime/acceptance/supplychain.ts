/**
 * AC-16 secret and credential handling.
 * AC-17 dependency and supply-chain analysis.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSigningKeys } from '../src/crypto';
import { LOCAL_REFERENCE_MODEL_ID } from '../src/plane';
import { buildSbom, SHIPPING_RUNTIMES, type SbomReport } from '../tools/sbom';
import { findLeakedValues, scanSecrets, type SecretScanReport } from '../tools/secret-scan';
import type { AcceptanceResult, Threshold } from './harness';
import {
  TENANT_A,
  atLeast,
  boolean as booleanThreshold,
  buildFixture,
  catchCode,
  percent,
  standardBudget,
  summarize,
  unverified,
  workloadSpec,
  zero,
} from './harness';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Runs the plane through the paths that emit records, then searches every
 * emitted record for the plane's own signing keys and principal tokens. This is
 * a leak test against real output rather than a claim about the logger.
 */
function measureRuntimeLeakage() {
  const fixture = buildFixture();
  const { plane, operatorA, agentPrincipalA } = fixture;
  const node = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'secrets-1' });
  const hardware = { classIds: [plane.hostHardware.classId] };

  const agent = plane.agents.register({ tenant: TENANT_A, agentKey: 'secrets-agent', classification: 'confidential' });
  plane.agents.activate({
    principal: operatorA.principal,
    agentId: agent.agentId,
    node,
    nodeMaxClassification: plane.classificationCeilingForNode(node),
    reason: 'ac16',
  });

  for (let index = 0; index < 20; index += 1) {
    plane.engine.execute(
      {
        token: operatorA.token,
        spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID, agentId: agent.agentId }),
      },
      { iterations: 200, externalActionKey: `secrets-action-${index}` },
    );
  }

  // A rejected request path as well: failure output is where secrets usually
  // escape.
  plane.engine.submit({
    token: operatorA.token,
    spec: workloadSpec({ tenant: TENANT_A, hardware, classification: 'restricted', requiredCapabilities: ['node.control'] }),
  });
  catchCode(() => plane.principals.verify(`${operatorA.token}-tampered`));

  const offlinePackage = plane.offline.issue({
    principal: operatorA.principal,
    agentId: agent.agentId,
    node,
    capabilities: ['workload.submit', 'model.invoke'],
    classification: 'confidential',
    maxTasks: 2,
    budget: standardBudget({ maxTasks: 2 }),
    validForMs: 600_000,
  });
  const offlineSession = plane.offline.runOffline({
    grant: offlinePackage,
    tasks: [{ taskKey: 'offline-secrets', requiredCapabilities: ['workload.submit'], description: 'bounded offline task' }],
  });

  const meeting = plane.meetings.open({
    principal: operatorA.principal,
    tenant: TENANT_A,
    classification: 'confidential',
    participants: [
      { participantId: operatorA.principal.principalId, kind: 'human', tenant: TENANT_A, displayName: 'Operator' },
      { participantId: agentPrincipalA.principal.principalId, kind: 'agent', tenant: TENANT_A, displayName: 'Agent' },
    ],
    offline: true,
  });
  const evidence = plane.meetings.registerEvidence('bounded evidence for the secret-leak scan');
  plane.meetings.post({
    meetingId: meeting.meetingId,
    scope: TENANT_A,
    participantId: agentPrincipalA.principal.principalId,
    content: 'Recommend the reallocation simulation.',
    evidenceHashes: [evidence],
  });

  const ticket = plane.nodes.issueEnrollment({
    principal: operatorA.principal,
    tenant: TENANT_A,
    fingerprint: 'f'.repeat(64),
    hardware: plane.hostHardware.profile,
    capacity: { cpuMillis: 1_000, gpuMillis: 0, ramMb: 256, concurrentWorkloads: 1 },
  });
  const command = plane.control.issue({
    principal: operatorA.principal,
    kind: 'PAUSE_NODE',
    targetId: node.nodeId,
    tenant: TENANT_A,
    reason: 'ac16_leak_scan',
  });

  const needles = [
    ...Object.values(plane.keys),
    operatorA.token,
    agentPrincipalA.token,
    fixture.operatorB.token,
    fixture.limitedA.token,
  ];

  const surfaces = {
    audit: JSON.stringify(plane.audit.export()),
    telemetry: JSON.stringify(plane.telemetry.export()),
    lineage: JSON.stringify(plane.lineage.export()),
    cost: JSON.stringify(plane.cost.export()),
    workloads: JSON.stringify(plane.workloadStore.exportAll()),
    nodes: JSON.stringify(plane.nodeStore.exportAll()),
    externalActions: JSON.stringify(plane.external.export()),
    fleetHealth: JSON.stringify(plane.fleetHealth(operatorA.principal.principalId)),
  };
  const nodeFacingPayloads = {
    enrollmentTicket: JSON.stringify(ticket),
    offlinePackage: JSON.stringify(offlinePackage),
    offlineResult: JSON.stringify(offlineSession.result),
    controlCommand: JSON.stringify(command),
  };
  const transcript = JSON.stringify({
    meeting: plane.meetings.require(TENANT_A, meeting.meetingId),
    messages: plane.meetings.messagesFor(meeting.meetingId),
  });

  const logLeaks: Record<string, string[]> = {};
  for (const [surface, payload] of Object.entries(surfaces)) {
    const leaks = findLeakedValues(payload, needles);
    if (leaks.length) logLeaks[surface] = leaks.map((value) => `${value.slice(0, 6)}…`);
  }
  const propagationLeaks: Record<string, string[]> = {};
  for (const [surface, payload] of Object.entries(nodeFacingPayloads)) {
    const leaks = findLeakedValues(payload, needles);
    if (leaks.length) propagationLeaks[surface] = leaks.map((value) => `${value.slice(0, 6)}…`);
  }
  const transcriptLeaks = findLeakedValues(transcript, needles);

  // Rotation: after rotating, signatures issued under the previous key must
  // stop verifying while freshly issued ones still work.
  const preRotationPackage = offlinePackage;
  plane.rotateKeys(generateSigningKeys());
  const preRotationCode = catchCode(() => plane.offline.validate(preRotationPackage));
  const preRotationTicketCode = catchCode(() => plane.nodes.register(ticket, { fingerprint: 'f'.repeat(64) }));
  const postRotationPackage = plane.offline.issue({
    principal: operatorA.principal,
    agentId: agent.agentId,
    node,
    capabilities: ['workload.submit'],
    classification: 'internal',
    maxTasks: 1,
    budget: standardBudget({ maxTasks: 1 }),
    validForMs: 600_000,
  });
  const postRotationCode = catchCode(() => plane.offline.validate(postRotationPackage));
  const rotationAudited = plane.audit.has((event) => event.kind === 'signing_keys_rotated');
  const rotationAuditCarriesKeyMaterial = findLeakedValues(
    JSON.stringify(plane.audit.find((event) => event.kind === 'signing_keys_rotated')),
    Object.values(plane.keys),
  ).length;

  return {
    logLeaks,
    propagationLeaks,
    transcriptLeaks,
    surfaceSizes: Object.fromEntries(Object.entries(surfaces).map(([name, value]) => [name, value.length])),
    rotation: {
      previousPackageCode: preRotationCode,
      previousTicketCode: preRotationTicketCode,
      newPackageCode: postRotationCode,
      audited: rotationAudited,
      auditCarriesKeyMaterial: rotationAuditCarriesKeyMaterial,
    },
  };
}

export function runAc16(): AcceptanceResult {
  const scan: SecretScanReport = scanSecrets();
  const leakage = measureRuntimeLeakage();

  const rotationTested =
    leakage.rotation.previousPackageCode === 'package_invalid' &&
    leakage.rotation.previousTicketCode === 'enrollment_invalid' &&
    leakage.rotation.newPackageCode === 'no_error' &&
    leakage.rotation.audited &&
    leakage.rotation.auditCarriesKeyMaterial === 0;

  const logLeakCount = Object.values(leakage.logLeaks).reduce((total, leaks) => total + leaks.length, 0);
  const propagationLeakCount = Object.values(leakage.propagationLeaks).reduce((total, leaks) => total + leaks.length, 0);

  const thresholds: Threshold[] = [
    zero('repo_secrets', 'High-confidence secret detections in repository and config', scan.criticalCount + scan.highCount, {
      blocker: true,
      note: `${scan.scannedFiles} working-tree files scanned, ${scan.placeholderMatches.length} placeholder matches excluded`,
    }),
    zero('client_bundle_credentials', 'Server credentials reachable from the client bundle', scan.clientBundleViolations.length, {
      blocker: true,
    }),
    zero('runtime_log_leaks', 'Secrets exposed through runtime logs and telemetry', logLeakCount, { blocker: true }),
    zero('transcript_leaks', 'Secrets exposed through agent meeting transcripts', leakage.transcriptLeaks.length, {
      blocker: true,
    }),
    zero(
      'credential_propagation',
      'Credential propagation between runtimes without authorization',
      propagationLeakCount,
      { blocker: true },
    ),
    booleanThreshold('rotation_tested', 'Rotation procedure documented and tested', rotationTested, {
      blocker: true,
      note: 'docs/62d/SECRET-ROTATION.md; rotation invalidates prior offline packages and enrollment tickets while newly issued ones verify',
    }),
    booleanThreshold('env_ignored', 'Environment files excluded from version control', scan.gitignoreCoversEnv),
    zero('env_example_values', 'Example env files containing real values', scan.envExampleFilesWithValues.length, {
      blocker: true,
    }),
  ];

  return summarize('AC-16', 'Secret & Credential Handling', thresholds, {
    scanner: 'services/runtime/tools/secret-scan.ts',
    scannedFiles: scan.scannedFiles,
    skippedFiles: scan.skippedFiles,
    findings: scan.findings,
    placeholderMatchesExcluded: scan.placeholderMatches.length,
    runtimeSurfacesScanned: leakage.surfaceSizes,
    logLeaks: leakage.logLeaks,
    nodeFacingPayloadLeaks: leakage.propagationLeaks,
    rotation: leakage.rotation,
    note: 'The leak test searches the plane\'s own signing keys and principal tokens across every emitted record. It cannot prove the absence of secrets XIV never held.',
  });
}

/** Direct dependencies added on this branch, read from the git diff. */
function addedDirectDependencies(): { added: string[]; comparedAgainst: string | null } {
  const candidates = ['origin/main', 'main'];
  for (const base of candidates) {
    try {
      const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const diff = execFileSync('git', ['diff', `${mergeBase}..HEAD`, '--', '*/package.json', '**/package.json'], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
      });
      const added = new Set<string>();
      for (const line of diff.split('\n')) {
        if (!line.startsWith('+')) continue;
        const match = /^\+\s*"([^"]+)"\s*:\s*"([^"]+)"\s*,?$/.exec(line);
        if (!match) continue;
        const name = match[1] as string;
        const value = match[2] as string;
        // Dependency entries carry a version range; manifest fields do not.
        if (/^[~^><=*\d]|^(?:npm|git|file|workspace):/.test(value)) added.add(name);
      }
      return { added: [...added].sort(), comparedAgainst: base };
    } catch {
      continue;
    }
  }
  return { added: [], comparedAgainst: null };
}

export function runAc17(): AcceptanceResult {
  const report: SbomReport = buildSbom();
  const analyzed = report.runtimes.filter((entry) => entry.audit.available);
  const unanalyzed = report.runtimes.filter((entry) => !entry.audit.available);
  const criticalHigh = report.criticalHighTotal;
  const moderate = analyzed.reduce((total, entry) => total + (entry.audit.available ? entry.audit.vulnerabilities.moderate : 0), 0);

  const componentsTotal = report.runtimes.reduce((total, entry) => total + entry.componentCount, 0);
  const componentsPinned = report.runtimes.reduce(
    (total, entry) => total + entry.components.filter((component) => component.integrity && component.version).length,
    0,
  );
  const unpinned = componentsTotal - componentsPinned;
  const nonRegistrySources = report.runtimes.flatMap((entry) =>
    entry.components
      .filter((component) => component.resolved && !component.resolved.startsWith('https://registry.npmjs.org/'))
      .map((component) => `${entry.runtime}:${component.name}`),
  );

  const { added, comparedAgainst } = addedDirectDependencies();
  const reviewPath = join(repoRoot, 'docs/62d/DEPENDENCY-REVIEW.md');
  const review = existsSync(reviewPath) ? readFileSync(reviewPath, 'utf8') : '';
  const unreviewed = added.filter((name) => !review.includes(name));

  const thresholds: Threshold[] = [
    atLeast(
      'analysis_coverage',
      'Shipping runtimes with dependency analysis',
      percent(analyzed.length, SHIPPING_RUNTIMES.length),
      100,
      { blocker: true, note: unanalyzed.length ? `unavailable: ${unanalyzed.map((entry) => entry.runtime).join(', ')}` : undefined },
    ),
    zero('critical_high_vulnerabilities', 'Critical/high vulnerabilities in shipping dependency paths', criticalHigh, {
      blocker: true,
      note: `${moderate} moderate advisories remain and are listed in the evidence`,
    }),
    atLeast(
      'sbom_generated',
      'Component inventory generated for shipping runtimes',
      percent(report.runtimesAnalyzed, SHIPPING_RUNTIMES.length),
      100,
      { blocker: true },
    ),
    zero('unpinned_sources', 'Unpinned or unverifiable dependency sources', unpinned + nonRegistrySources.length, {
      blocker: true,
    }),
    zero('unreviewed_additions', 'Unreviewed direct dependency additions on this branch', unreviewed.length, {
      blocker: true,
      note: comparedAgainst
        ? `${added.length} direct additions vs ${comparedAgainst}, reviewed in docs/62d/DEPENDENCY-REVIEW.md`
        : 'no base branch available for comparison',
    }),
  ];

  if (!comparedAgainst) {
    thresholds.push(
      unverified(
        'dependency_diff_base',
        'Dependency additions compared against a base branch',
        'base branch reachable',
        'Neither origin/main nor main was resolvable in this checkout, so added dependencies could not be diffed.',
      ),
    );
  }

  return summarize('AC-17', 'Dependency & Supply Chain', thresholds, {
    tool: 'services/runtime/tools/sbom.ts (lockfile inventory + npm audit)',
    runtimes: report.runtimes.map((entry) => ({
      runtime: entry.runtime,
      components: entry.componentCount,
      direct: entry.directCount,
      withIntegrity: entry.componentsWithIntegrity,
      audit: entry.audit,
    })),
    componentsTotal,
    componentsPinned,
    nonRegistrySources,
    addedDirectDependencies: added,
    comparedAgainst,
    note: 'Vulnerability counts come from the npm advisory database at the time of this run and need re-running per release.',
  });
}

/** AC-17 evidence for the report: the moderate advisories that remain open. */
export function moderateAdvisorySummary(report: SbomReport): string[] {
  return report.runtimes.flatMap((entry) =>
    entry.audit.available && entry.audit.vulnerabilities.moderate > 0
      ? [`${entry.runtime}: ${entry.audit.vulnerabilities.moderate} moderate`]
      : [],
  );
}

export function runSupplyChainAcceptance(): AcceptanceResult[] {
  return [runAc16(), runAc17()];
}

/** Limits of this evidence, surfaced in the scorecard rather than left implicit. */
export const SUPPLY_CHAIN_CEILINGS = [
  'npm audit reflects the advisory database at run time, not a continuous monitor.',
  'No signed build provenance attestation is produced for XIV builds yet.',
] as const;
