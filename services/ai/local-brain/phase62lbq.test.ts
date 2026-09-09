import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  accessAuthorizedAdapter,
  attemptArbitraryServerScan,
  federationHonesty,
  getFederationAdapter,
  listScanDenials,
  probeFederationAdapter,
  registerFederationAdapter,
  resetFederationAdapters,
} from './authorized-data-server-federation';
import {
  attemptVerifyLanguage,
  certifyCodingSkill,
  getPolyglotEntry,
  listPolyglotEntries,
  polyglotHonesty,
  resetPolyglotRegistry,
} from './polyglot-language-registry';
import {
  BQ_BOUNDS,
  BQ_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PATHWAY_NOT_PERMISSION,
  POLYGLOT_CODING_CIVILIZATION_CYCLE,
  SKILL_NOT_PERMISSION,
  ARBITRARY_SCAN_DENIED,
  TOOL_RECURSION_BOUND,
  UNCONFIGURED_ADAPTER_UNAVAILABLE,
  UNPROVEN_NOT_VERIFIED,
  PUZZLE_SPLIT_BOUNDED,
  githubIssueSot,
  predecessorMap,
} from './polyglot-coding-civilization-types';
import {
  buildPolyglotCodingCivilizationHealthReport,
  runPolyglotCodingCivilizationCycle,
} from './polyglot-coding-civilization-runtime';
import {
  createPuzzleGraph,
  decomposePuzzleNode,
  detectBottlenecks,
  puzzleEngineHonesty,
  resetPuzzleEngine,
} from './problem-decomposition-puzzle-engine';
import {
  buildFoundryArtifact,
  resetToolFoundry,
  toolFoundryHonesty,
} from './recursive-tool-foundry';
import {
  architectureExpansionHonesty,
  listArchitectureProposals,
  proposeArchitecturePathway,
  resetArchitectureExpansion,
  reviewArchitecturePathway,
  searchPathwayInventory,
} from './superbrain-architecture-expansion';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbq-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetPolyglotRegistry();
  resetToolFoundry();
  resetPuzzleEngine();
  resetFederationAdapters();
  resetArchitectureExpansion();

  check(
    'US-BQ-HONESTY',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      BQ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BQ_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BQ_LOCKS.SKILL_IS_PERMISSION_GRANT === false &&
      BQ_LOCKS.PATHWAY_PROPOSAL_IS_PERMISSION === false &&
      BQ_LOCKS.SILENT_ARBITRARY_SERVER_SCAN === false &&
      BQ_LOCKS.UNBOUNDED_TOOL_RECURSION === false &&
      BQ_LOCKS.UNBOUNDED_PUZZLE_SPLIT === false &&
      BQ_LOCKS.UNPROVEN_LANGUAGE_LABELED_VERIFIED === false &&
      BQ_LOCKS.BUILDER_IS_DEPLOY_AUTHORITY === false &&
      BQ_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      BQ_LOCKS.SUPERBRAIN_REMAINS_ROOT === true &&
      BQ_LOCKS.SWALLOW_SUPERBRAIN_ROOT === false &&
      BQ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true,
    'Honesty locks: L4 false; skill≠permission; no silent scan; bounded recursion/split; Superbrain root.',
  );

  const sot = githubIssueSot();
  check(
    'US-BQ-SOT',
    sot.githubIssue === 81 &&
      sot.gitlabIssue === 15 &&
      sot.githubRole === 'implementation_source_of_truth' &&
      sot.gitlabRole === 'coordination_only',
    'GitHub #81 SoT; GitLab #15 coordination only.',
  );

  check(
    'US-BQ-NEXT',
    NEXT_PHASE_TITLE.startsWith('62L-BR — Autonomous Software Civilization Sandbox'),
    `Next queue title recorded: ${NEXT_PHASE_TITLE}`,
  );

  check(
    'US-BQ-CYCLE',
    POLYGLOT_CODING_CIVILIZATION_CYCLE[0] === 'honesty_locks' &&
      POLYGLOT_CODING_CIVILIZATION_CYCLE.includes('toolchain_verify_gate') &&
      POLYGLOT_CODING_CIVILIZATION_CYCLE.includes('federation_deny_arbitrary_scan') &&
      POLYGLOT_CODING_CIVILIZATION_CYCLE.includes('pathway_reject_redundant'),
    'Polyglot civilization cycle recorded.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BQ-BASE',
    preds.BP.tipProbe === 'PRESENT' &&
      preds.BP.report === 'PRESENT' &&
      preds.BO.tipProbe === 'PRESENT' &&
      preds.BO.report === 'PRESENT',
    `BP present as base; BO=${preds.BO.tipProbe}/${preds.BO.report}; BN=${preds.BN.tipProbe}/${preds.BN.report}; BM=${preds.BM.tipProbe}/${preds.BM.report}.`,
  );

  // --- A. Unproven language/runtime not labeled VERIFIED ---
  const entries = listPolyglotEntries();
  check(
    'US-BQ-POLYGLOT-REGISTRY',
    entries.length >= 8 &&
      entries.every((e) => e.targetCompatible === true) &&
      entries.some((e) => e.family === 'programming') &&
      entries.some((e) => e.family === 'shader') &&
      entries.some((e) => e.family === 'hdl'),
    `Registry covers ${entries.length} families including programming/shader/hdl.`,
  );

  const unproven = attemptVerifyLanguage({
    key: 'brainfuck',
    toolchainProven: false,
    testsProven: false,
    evidenceRefs: [],
  });
  check(
    'US-BQ-UNPROVEN-NOT-VERIFIED',
    unproven.labeled !== 'VERIFIED' &&
      unproven.reason === UNPROVEN_NOT_VERIFIED &&
      getPolyglotEntry('brainfuck')?.label !== 'VERIFIED' &&
      polyglotHonesty().unprovenLanguageLabeledVerified === false,
    'Unproven language/runtime is not labeled VERIFIED.',
  );

  const proven = attemptVerifyLanguage({
    key: 'typescript',
    toolchainProven: true,
    testsProven: true,
    evidenceRefs: ['toolchain:tsc', 'test:phase62lbq'],
  });
  check(
    'US-BQ-PROVEN-VERIFIED',
    proven.labeled === 'VERIFIED' && proven.entry.toolchainProven && proven.entry.testsProven,
    'Proven toolchain+tests may label VERIFIED.',
  );

  // --- Skill certify does not escalate authority ---
  const priorPerm = 2;
  const priorAuth = 1;
  const skill = certifyCodingSkill({
    agentId: 'agent-bq-1',
    languageKey: 'typescript',
    proficiency: 0.8,
    evidenceRefs: ['lesson:ts-basics'],
    currentPermissionLevel: priorPerm,
    currentAuthorityLevel: priorAuth,
  });
  check(
    'US-BQ-SKILL-NOT-AUTHORITY',
    skill.accepted === true &&
      skill.authorityEscalated === false &&
      skill.reason === SKILL_NOT_PERMISSION &&
      skill.cert?.permissionLevel === priorPerm &&
      skill.cert?.authorityLevel === priorAuth &&
      skill.cert?.skillIsPermissionGrant === false &&
      skill.cert?.learningIsAuthority === false &&
      skill.cert?.productionAuthorized === false,
    'Skill certify does not escalate authority / grant permissions.',
  );

  // --- B. Tool-foundry recursion hits bound / requires review ---
  const t1 = buildFoundryArtifact({ kind: 'tool', name: 'root-tool' });
  const t2 = buildFoundryArtifact({
    kind: 'plugin',
    name: 'nested-plugin',
    parentId: t1.accepted ? t1.artifact.id : null,
  });
  const t3 = buildFoundryArtifact({
    kind: 'api',
    name: 'nested-api',
    parentId: t2.accepted ? t2.artifact.id : null,
  });
  // depth 3 without review → AWAITING_REVIEW / rejected
  check(
    'US-BQ-FOUNDRY-REVIEW-AT-BOUND',
    t1.accepted === true &&
      t2.accepted === true &&
      t3.accepted === false &&
      t3.reviewRequired === true &&
      t3.reason === TOOL_RECURSION_BOUND &&
      t3.artifact?.status === 'AWAITING_REVIEW',
    'Tool foundry at max depth requires review.',
  );
  const t4 = buildFoundryArtifact({
    kind: 'ai_project',
    name: 'too-deep',
    parentId: t3.artifact?.id ?? (t2.accepted ? t2.artifact.id : null),
  });
  // If parent is awaiting (depth 3), child depth 4 is DENIED
  check(
    'US-BQ-FOUNDRY-RECURSION-BOUND',
    t4.accepted === false &&
      t4.reason === TOOL_RECURSION_BOUND &&
      (t4.artifact?.status === 'DENIED' || t4.reviewRequired === true) &&
      toolFoundryHonesty().maxRecursionDepth === BQ_BOUNDS.MAX_TOOL_RECURSION_DEPTH &&
      toolFoundryHonesty().builderIsDeployAuthority === false,
    'Tool-foundry recursion hits bound; builder ≠ deploy authority.',
  );

  // --- C. Puzzle decomposition produces bounded subproblems ---
  const bottlenecks = detectBottlenecks({
    description: 'Slow compute and unclear verification authority path',
  });
  check(
    'US-BQ-BOTTLENECK',
    bottlenecks.includes('compute') &&
      (bottlenecks.includes('ambiguity') || bottlenecks.includes('authority') || bottlenecks.includes('verification')),
    `Bottlenecks detected: ${bottlenecks.join(',')}`,
  );

  const graph = createPuzzleGraph({
    label: 'Hard polyglot federation puzzle',
    description: 'dependency and verification bottleneck',
    constraints: ['no_arbitrary_scan', 'founder_sealed'],
  });
  const split1 = decomposePuzzleNode({
    graphId: graph.id,
    nodeId: graph.rootId,
    subproblemLabels: ['map languages', 'bound tools', 'authorize adapters'],
  });
  check(
    'US-BQ-PUZZLE-BOUNDED-SPLIT',
    split1.accepted === true &&
      split1.reason === PUZZLE_SPLIT_BOUNDED &&
      split1.graph.bounded === true &&
      split1.created.length === 3 &&
      split1.graph.totalSubproblems === 3,
    'Puzzle decomposition produces bounded subproblems.',
  );

  // Attempt over-bound per-node split
  const overNode = decomposePuzzleNode({
    graphId: graph.id,
    nodeId: graph.rootId,
    subproblemLabels: Array.from({ length: BQ_BOUNDS.MAX_SUBPROBLEMS_PER_NODE + 1 }, (_, i) => `p${i}`),
  });
  check(
    'US-BQ-PUZZLE-OVER-NODE-BOUND',
    overNode.accepted === false && overNode.reason === PUZZLE_SPLIT_BOUNDED,
    'Per-node subproblem bound enforced.',
  );

  // Drive depth beyond max
  let deepParent = split1.created[0]?.id ?? graph.rootId;
  let deepGraphId = graph.id;
  let hitDepthBound = false;
  for (let d = 0; d < BQ_BOUNDS.MAX_PUZZLE_SPLIT_DEPTH + 2; d++) {
    const r = decomposePuzzleNode({
      graphId: deepGraphId,
      nodeId: deepParent,
      subproblemLabels: [`depth-${d}-a`],
    });
    if (!r.accepted && r.reason === PUZZLE_SPLIT_BOUNDED) {
      hitDepthBound = true;
      break;
    }
    if (r.accepted && r.created[0]) {
      deepParent = r.created[0].id;
      deepGraphId = r.graph.id;
    }
  }
  check(
    'US-BQ-PUZZLE-DEPTH-BOUND',
    hitDepthBound === true && puzzleEngineHonesty().unboundedSplit === false,
    'Puzzle split depth bound prevents infinite decomposition.',
  );

  // --- D. Unconfigured server adapter → UNAVAILABLE ---
  const unconfigured = registerFederationAdapter({
    key: 'remote-pg-lab',
    kind: 'database',
    endpoint: 'postgres://lab.example.invalid/xiv',
    configured: false,
    authorized: false,
    verified: false,
  });
  const probeUnconf = probeFederationAdapter('remote-pg-lab');
  check(
    'US-BQ-UNCONFIGURED-UNAVAILABLE',
    unconfigured.state === 'UNAVAILABLE' &&
      probeUnconf.allowed === false &&
      probeUnconf.state === 'UNAVAILABLE' &&
      probeUnconf.reason === UNCONFIGURED_ADAPTER_UNAVAILABLE &&
      getFederationAdapter('remote-pg-lab')?.state === 'UNAVAILABLE',
    'Unconfigured server adapter → UNAVAILABLE.',
  );

  const configured = registerFederationAdapter({
    key: 'local-object-store',
    kind: 'object_store',
    endpoint: 'file:///tmp/xiv-bq-objects',
    configured: true,
    authorized: true,
    verified: true,
    evidenceRefs: ['adapter:local-object-store#1'],
  });
  const probeOk = accessAuthorizedAdapter({
    adapterKey: 'local-object-store',
    operation: 'health',
  });
  check(
    'US-BQ-CONFIGURED-AVAILABLE',
    configured.state === 'AVAILABLE' && probeOk.allowed === true && probeOk.state === 'AVAILABLE',
    'Configured+authorized+verified adapter can be AVAILABLE.',
  );

  // --- Arbitrary/unauthorized server scan/access → DENIED ---
  const scan = attemptArbitraryServerScan({
    target: 'https://evil.example/scan-all-ports',
  });
  const urlSmuggle = accessAuthorizedAdapter({
    adapterKey: 'https://arbitrary.internal/admin',
    operation: 'list',
  });
  check(
    'US-BQ-ARBITRARY-SCAN-DENIED',
    scan.allowed === false &&
      scan.state === 'DENIED' &&
      scan.reason === ARBITRARY_SCAN_DENIED &&
      scan.scannedArbitrary === false &&
      urlSmuggle.allowed === false &&
      urlSmuggle.state === 'DENIED' &&
      listScanDenials().length >= 2 &&
      federationHonesty().silentArbitraryServerScan === false,
    'Arbitrary/unauthorized server scan/access → DENIED.',
  );

  // --- E. Pathway proposal does not grant permissions; BN growth rules ---
  const redundant = proposeArchitecturePathway({
    key: 'neural_bus',
    demandProven: true,
    demandEvidenceRefs: ['demand:bus'],
    sourceSolutionRefs: ['puzzle:solved-1'],
  });
  check(
    'US-BQ-PATHWAY-REJECT-REDUNDANT',
    redundant.status === 'REJECTED_REDUNDANT' &&
      redundant.permissionGranted === false &&
      searchPathwayInventory('neural_bus').length > 0,
    'Redundant pathway rejected (BN growth rule).',
  );

  const noDemand = proposeArchitecturePathway({
    key: 'novel_polyglot_route_alpha',
    demandProven: false,
    sourceSolutionRefs: ['puzzle:solved-2'],
  });
  check(
    'US-BQ-PATHWAY-DEMAND',
    noDemand.status === 'REJECTED_NO_DEMAND' && noDemand.permissionGranted === false,
    'Pathway without proven demand rejected.',
  );

  const sandbox = proposeArchitecturePathway({
    key: 'novel_polyglot_route_beta',
    demandProven: true,
    demandEvidenceRefs: ['demand:polyglot-beta'],
    sourceSolutionRefs: ['puzzle:solved-3'],
  });
  const reviewed = reviewArchitecturePathway({
    proposalId: sandbox.id,
    approve: true,
  });
  check(
    'US-BQ-PATHWAY-NOT-PERMISSION',
    sandbox.status === 'SANDBOX_PROPOSAL' &&
      sandbox.permissionGranted === false &&
      sandbox.authorityEscalated === false &&
      sandbox.productionAuthorized === false &&
      sandbox.swallowsSuperbrainRoot === false &&
      reviewed.permissionGranted === false &&
      reviewed.reason === PATHWAY_NOT_PERMISSION &&
      architectureExpansionHonesty().superbrainRemainsRoot === true &&
      listArchitectureProposals().length >= 3,
    'Pathway proposal does not grant permissions; Superbrain remains root.',
  );

  const hops = runPolyglotCodingCivilizationCycle(repoRoot);
  const health = buildPolyglotCodingCivilizationHealthReport(repoRoot);
  check(
    'US-BQ-RUNTIME-HEALTH',
    hops.length === POLYGLOT_CODING_CIVILIZATION_CYCLE.length &&
      health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.githubIssue === 81 &&
      health.gitlabIssue === 15 &&
      health.nextPhaseTitle.startsWith('62L-BR'),
    'Runtime health report honest; productionAuthorization=false.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BQ tests:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-BQ polyglot coding civilization safety tests passed.');
