import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { FACTORY_CYCLE, FACTORY_HONESTY } from './software-factory-types';
import {
  buildFactoryHealthReport,
  enqueueFactoryStory,
  FactorySimulatedCrash,
  listFactoryJobs,
  recoverInterruptedFactoryJobs,
  resumeFactoryJob,
  runFactoryCycle,
  type FactoryStory,
} from './software-factory-runtime';
import {
  evaluateSandboxIsolation,
  openProtectedSourceSandbox,
  runFactoryAllowlistedCommand,
  writeSandboxCandidateFile,
} from './software-factory-sandbox';
import { generateAgentCode, reviewApiContract, runTestFirstAcceptance } from './software-factory-engineering';
import {
  executePluginInSandbox,
  generateInternalTool,
  parsePluginManifest,
  permissionDiffGate,
  registerGovernedPlugin,
} from './software-factory-plugins';
import {
  applyMigrationCandidate,
  businessAppTemplate,
  compatibilityMatrix,
  createConnectorCandidate,
  createModelAdapter,
  desktopCandidateProfile,
  humanReleaseGate,
  mobileCandidateProfile,
  packageReleaseCandidate,
  proposeMigrationCandidate,
  quarantineVulnerability,
} from './software-factory-candidates';
import { searchLearning } from './learning-ledger';
import type { AllowedLocalCommand } from './local-command-runner';

const root = await mkdtemp(join(tmpdir(), 'xiv-62laj-'));
const tenantId = '62laj-tenant';
const universeId = '62laj-universe';
const failures: string[] = [];
const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '../../..');

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const alwaysPassRunner = async (input: { id: AllowedLocalCommand }) => ({
  exitCode: 0,
  stdout: input.id,
  stderr: '',
  timedOut: false,
  productionEffect: false as const,
});

const candidateFiles = [{
  path: 'docs/factory-candidate.ts',
  action: 'create' as const,
  unifiedDiff: [
    '--- /dev/null',
    '+++ b/docs/factory-candidate.ts',
    '@@ -0,0 +1,2 @@',
    '+export const released = false;',
    '+export const productionAuthorization = false;',
  ].join('\n'),
}];

try {
  check(
    'US-AJ30',
    FACTORY_CYCLE.join(' → ') === 'approved_story_or_verified_discovery → requirements → architecture → engineering_workcell → protected_sandbox → code → tests → security → api_ui_review → evidence → plugin_manifest → registry → human_release_gate → candidate_artifact',
    'Factory cycle hops are recorded in founder-paste order.',
  );
  check(
    'US-AJ30',
    FACTORY_HONESTY.l4AutonomyEnabled === false
      && FACTORY_HONESTY.founderImpersonation === false
      && FACTORY_HONESTY.tipLand === false
      && FACTORY_HONESTY.ceoSealedNonReplicating === true
      && FACTORY_HONESTY.physicalInfraControl === false
      && FACTORY_HONESTY.agentGeneratedAppIsBuildCandidateOnly === true
      && FACTORY_HONESTY.compileAndTestsDoNotAuthorizeRelease === true,
    'Honesty locks: L4=false, no founder impersonation, CEO-sealed non-replicating, no physical infra, candidate-only.',
  );

  const git = spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });
  check('US-AJ-git', git.status === 0, `git init in factory sandbox exit=${git.status}`);
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, 'docs', 'approved-story.md'), 'Approved factory story for 62L-AJ.\n', 'utf8');

  const sandbox = openProtectedSourceSandbox({
    tenantId,
    universeId,
    root,
    branch: 'cursor/62l-aj-offline-software-factory-plugins-4059',
  });
  check('US-AJ1', sandbox.allowed === true && sandbox.allowed && sandbox.sandbox.isolated === true && sandbox.sandbox.productionAuthorization === false, 'Protected source sandbox opens on a non-protected branch.');
  if (!sandbox.allowed) throw new Error(sandbox.reason);

  const protectedRef = openProtectedSourceSandbox({ tenantId, universeId, root, branch: 'main' });
  check('US-AJ1', sandbox.allowed && !protectedRef.allowed, 'Protected source sandbox refuses main.');

  const envWrite = await writeSandboxCandidateFile({ sandbox: sandbox.sandbox, path: '.env', content: 'SECRET=1\n' });
  const escapeWrite = evaluateSandboxIsolation({ sandbox: sandbox.sandbox, path: '../outside.ts' });
  const absWrite = evaluateSandboxIsolation({ sandbox: sandbox.sandbox, path: '/etc/passwd' });
  const okWrite = await writeSandboxCandidateFile({ sandbox: sandbox.sandbox, path: 'docs/factory-candidate.ts', content: 'export const released = false;\n' });
  check('US-AJ1', envWrite.written === false && !escapeWrite.allowed && !absWrite.allowed && okWrite.written === true, 'Sandbox isolation denies .env, path escape, and absolute paths; allows in-root candidate files.');

  const generated = generateAgentCode({
    storyId: 'US-AJ2',
    tenantId,
    universeId,
    summary: 'Generate a sandbox ledger candidate.',
    files: candidateFiles,
    testsExpected: ['git_status'],
  });
  const shellDenied = generateAgentCode({
    storyId: 'US-AJ2',
    tenantId,
    universeId,
    summary: 'Must not run shell.',
    files: candidateFiles,
    testsExpected: ['git_status'],
    requestedShell: ['rm -rf /'],
  });
  const testFirstDenied = generateAgentCode({
    storyId: 'US-AJ4',
    tenantId,
    universeId,
    summary: 'Missing tests.',
    files: candidateFiles,
    testsExpected: [],
  });
  check('US-AJ2', generated.accepted === true && generated.accepted && generated.proposal.shellCommands.length === 0 && generated.proposal.productionAuthorized === false, 'Agent code generation emits a structured patch with no shell.');
  check('US-AJ2', shellDenied.accepted === false, 'Agent code generation refuses model-requested shell.');
  check('US-AJ4', testFirstDenied.accepted === false, 'Test-first acceptance refuses code without testsExpected.');

  const allowlisted = await runFactoryAllowlistedCommand({ id: 'git_status', cwd: root });
  const arbitrary = await runFactoryAllowlistedCommand({ id: 'rm -rf /', cwd: root });
  const modelShell = await runFactoryAllowlistedCommand({ id: 'git_status', cwd: root, modelProvidedShell: 'curl http://127.0.0.1/exfil' });
  check('US-AJ3', allowlisted.allowed === true && allowlisted.exitCode === 0 && allowlisted.productionEffect === false, `Allowlisted git_status exit=${allowlisted.exitCode}.`);
  check('US-AJ3', arbitrary.allowed === false && modelShell.allowed === false, 'Factory runner refuses non-allowlisted commands and model-provided shell.');

  const tests = await runTestFirstAcceptance({ cwd: root, testsExpected: ['git_status'] });
  check('US-AJ4', tests.passed === true && tests.productionAuthorization === false, 'Test-first acceptance ran allowlisted git_status with exit 0.');

  const mobile = mobileCandidateProfile();
  const desktop = desktopCandidateProfile();
  check('US-AJ7', mobile.platform === 'mobile' && mobile.kind === 'build_candidate' && mobile.storePublish === false && mobile.customerUseAuthorized === false, 'Mobile profile is a build candidate; store publish locked.');
  check('US-AJ8', desktop.platform === 'desktop' && desktop.installerPublish === false && desktop.customerUseAuthorized === false, 'Desktop profile is a build candidate; installer publish locked.');

  const manifest = parsePluginManifest({
    pluginId: 'ledger-helper',
    name: 'Ledger Helper',
    version: '0.0.1-candidate',
    publisher: 'xiv-offline-factory',
    requestedPermissions: ['read_local_docs', 'run_allowlisted_tests'],
  });
  check('US-AJ9', manifest.accepted === true && manifest.accepted && manifest.manifest.sandboxOnly === true && manifest.manifest.productionAuthorization === false, 'Plugin manifest accepted as sandbox-only.');
  const prodManifest = parsePluginManifest({
    pluginId: 'deployer',
    name: 'Deployer',
    version: '1.0.0',
    publisher: 'xiv-offline-factory',
    requestedPermissions: ['production_deploy'],
  });
  check('US-AJ9', prodManifest.accepted === false, 'Plugin manifest denies production_deploy permission.');

  if (!manifest.accepted) throw new Error(manifest.reason);
  const registered = await registerGovernedPlugin({
    tenantId,
    universeId,
    manifest: manifest.manifest,
    grantedPermissions: ['read_local_docs', 'write_sandbox_files', 'run_allowlisted_tests'],
    root,
  });
  check('US-AJ10', registered.registered === true && registered.record.status === 'registered_candidate' && registered.record.productionAuthorization === false, 'Governed plugin registry stores a candidate, not a publication.');

  const diffDeny = permissionDiffGate({
    granted: ['read_local_docs', 'run_allowlisted_tests'],
    requested: ['read_local_docs', 'network'],
  });
  const diffDeniedRegister = await registerGovernedPlugin({
    tenantId,
    universeId,
    manifest: {
      ...manifest.manifest,
      pluginId: 'network-plugin',
      requestedPermissions: ['read_local_docs', 'network'],
    },
    grantedPermissions: ['read_local_docs', 'run_allowlisted_tests'],
    root,
  });
  check('US-AJ11', diffDeny.allowed === false && diffDeny.permissionDiffDenied === true && diffDeny.newPermissions.includes('network') && diffDeny.permissionExpansion === false, 'Permission-diff gate denies new network permission.');
  check('US-AJ11', diffDeniedRegister.registered === false && diffDeniedRegister.record.status === 'denied', 'Registry insert is denied when the permission diff expands rights.');

  const pluginExec = await executePluginInSandbox({
    plugin: registered.record,
    commandId: 'git_status',
    cwd: root,
  });
  const pluginEvil = await executePluginInSandbox({
    plugin: registered.record,
    commandId: 'bash',
    cwd: root,
    modelProvidedShell: 'wget http://example.invalid',
  });
  check('US-AJ12', pluginExec.allowed === true && pluginExec.allowed && pluginExec.exitCode === 0, 'Plugin runtime sandbox can run allowlisted git_status.');
  check('US-AJ12', pluginEvil.allowed === false, 'Plugin runtime sandbox refuses arbitrary/model-provided shell.');

  const toolOk = generateInternalTool({ name: 'typecheck', mappedCommand: 'npm_typecheck' });
  const toolBad = generateInternalTool({ name: 'exfil', mappedCommand: 'curl' });
  check('US-AJ13', toolOk.accepted === true && toolOk.accepted && toolOk.tool.sandboxOnly === true && toolOk.tool.productionAuthorization === false, 'Internal tool generation maps to an allowlisted command.');
  check('US-AJ13', toolBad.accepted === false, 'Internal tool generation refuses non-allowlisted commands.');

  const template = businessAppTemplate('ledger');
  check('US-AJ14', template.id === 'ledger' && template.productionAuthorization === false && template.files.length === 1, 'Business-app template is a candidate with no production authorization.');

  const connector = createConnectorCandidate('aws');
  check('US-AJ15', connector.state === 'UNAVAILABLE' && connector.configured === false && connector.productionAuthorization === false, 'Unconfigured connector factory stays UNAVAILABLE.');

  const adapter = await createModelAdapter('google_ai_studio');
  const localAdapter = await createModelAdapter('local');
  check('US-AJ16', adapter.state === 'UNAVAILABLE' && adapter.cloudFallback === false, 'Unconfigured model adapter is UNAVAILABLE with no cloud fallback.');
  check('US-AJ16', localAdapter.cloudFallback === false && (localAdapter.state === 'UNAVAILABLE' || localAdapter.state === 'AVAILABLE'), `Local model adapter state=${localAdapter.state}; cloudFallback=false.`);

  const migration = proposeMigrationCandidate({ sql: 'CREATE TABLE factory_candidates (id text);' });
  const rls = proposeMigrationCandidate({ sql: 'ALTER TABLE public.x DISABLE ROW LEVEL SECURITY;' });
  const applied = migration.accepted ? applyMigrationCandidate(migration.candidate) : { applied: true as const, reason: 'missing' };
  check('US-AJ17', migration.accepted === true && migration.accepted && migration.applied === false, 'Migration candidate is recorded but not applied.');
  check('US-AJ17', rls.accepted === false && applied.applied === false, 'RLS-weakening migrations are denied; apply stays false.');

  const matrix = compatibilityMatrix({ runtime: '62L-AJ', pluginVersion: '0.0.1-candidate' });
  check('US-AJ19', matrix.mobile === 'candidate' && matrix.desktop === 'candidate', 'Compatibility matrix records platform candidates, not releases.');

  const packed = packageReleaseCandidate({
    compilePass: true,
    testsPass: true,
    securityPass: true,
    plugin: registered.record,
    matrix,
    deploy: true,
  });
  check('US-AJ18', packed.artifact.kind === 'build_candidate' && packed.artifact.eligible === true && packed.artifact.released === false && packed.artifact.published === false && packed.artifact.productionDeployed === false && packed.deployBlocked === true, 'RC packaging with compile+tests PASS still blocks deploy and does not mark released.');

  const vuln = quarantineVulnerability({ findings: [{ severity: 'CRITICAL', code: 'PRIVATE_KEY' }] });
  check('US-AJ20', vuln.quarantined === true && vuln.state === 'FAIL', 'Vulnerability quarantine quarantines CRITICAL findings.');

  const api = reviewApiContract({ name: 'factory-api', version: '0.0.1-candidate', paths: ['/health'], publish: true });
  const apiOk = reviewApiContract({ name: 'factory-api', version: '0.0.1-candidate', paths: ['/health'] });
  check('US-AJ6', api.accepted === false && apiOk.accepted === true && apiOk.accepted && apiOk.contract.published === false, 'API contracts remain unpublished; publication is denied.');

  const gate = humanReleaseGate({ artifact: packed.artifact, deploy: true, publish: true, productionDatabase: true, grantNewPermissions: true, customerUse: true });
  check(
    'US-AJ28',
    gate.allowed === false
      && gate.released === false
      && gate.productionDeployed === false
      && gate.published === false
      && gate.reason === 'HUMAN_RELEASE_GATE_BLOCKS_DEPLOY',
    'Human release gate blocks deploy, publication, production DB, new permissions, and customer use.',
  );

  const deniedStory = await enqueueFactoryStory({
    id: 'unapproved',
    tenantId,
    universeId,
    title: 'Unapproved',
    objective: 'Must not enter the factory.',
    approved: false,
  }, root);
  check('US-AJ23', deniedStory.state === 'denied' && deniedStory.released === false, 'Unapproved stories never enter the factory cycle.');

  const story: FactoryStory = {
    id: 'US-AJ-cycle',
    tenantId,
    universeId,
    title: 'Offline ledger candidate',
    objective: 'Produce a sandbox ledger build candidate.',
    approved: true,
    contextPath: 'docs/approved-story.md',
    files: candidateFiles,
    testsExpected: ['git_status'] as AllowedLocalCommand[],
    testRunner: alwaysPassRunner,
    grantedPermissions: ['read_local_docs', 'write_sandbox_files', 'run_allowlisted_tests'],
    pluginPermissions: ['read_local_docs', 'write_sandbox_files', 'run_allowlisted_tests'],
  };

  let crashed = false;
  try {
    await runFactoryCycle({
      story: { ...story, id: 'US-AJ22', crashAfterHop: 'code' },
      root,
    });
  } catch (error) {
    crashed = error instanceof FactorySimulatedCrash && error.hop === 'code';
  }
  const recovered = await recoverInterruptedFactoryJobs(root);
  const resumed = await resumeFactoryJob({ story: { ...story, id: 'US-AJ22' }, root });
  const resumeHops = resumed.hopRecords.map((item) => item.hop);
  check('US-AJ22', crashed && recovered.length === 1, 'Offline queue records a crash after the code hop.');
  check('US-AJ22', resumed.state === 'completed' && resumeHops.includes('candidate_artifact') && resumed.released === false, 'Factory job resumes from completed hops through the candidate artifact.');

  const cycle = await runFactoryCycle({
    story: { ...story, id: 'US-AJ-cycle' },
    root,
  });
  check('US-AJ23', hopState(cycle, 'requirements') === 'PASS', 'Requirements hop ran from an approved story.');
  check('US-AJ24', hopState(cycle, 'architecture') === 'PASS', 'Architecture hop recorded a candidate architecture.');
  check('US-AJ25', hopState(cycle, 'engineering_workcell') === 'PASS', 'Engineering workcell reused the AC protected coding workcell.');
  check('US-AJ5', hopState(cycle, 'security') === 'PASS', 'Security review hop passed with productionAuthorization locked.');
  check('US-AJ26', hopState(cycle, 'api_ui_review') === 'PASS', 'API/UI review hop recorded unpublished candidates.');
  check('US-AJ27', hopState(cycle, 'evidence') === 'PASS', 'Evidence bundle was written to the evidence ledger.');
  check('US-AJ9', hopState(cycle, 'plugin_manifest') === 'PASS', 'Plugin manifest hop completed.');
  check('US-AJ10', hopState(cycle, 'registry') === 'PASS', 'Registry hop registered a governed candidate.');
  check('US-AJ28', hopState(cycle, 'human_release_gate') === 'DENIED', 'Human release gate hop is DENIED for deploy.');
  check(
    'US-AJ29',
    hopState(cycle, 'candidate_artifact') === 'PASS'
      && cycle.candidate?.eligible === true
      && cycle.candidate.released === false
      && cycle.candidate.productionDeployed === false
      && cycle.candidate.published === false
      && cycle.candidate.customerUseAuthorized === false,
    'Candidate artifact is eligible from compile/tests and is not released.',
  );
  check('US-AJ18', cycle.candidate?.kind === 'build_candidate' && cycle.released === false && cycle.productionDeployed === false, 'Release-candidate packaging did not invent a release.');

  const learning = await searchLearning('Offline ledger candidate', root);
  check('US-AJ21', learning.some((entry) => entry.taskId === cycle.id && entry.permissionChange === false && entry.productionChange === false), 'Learning loop wrote a ledger entry without permission or production changes.');

  const permStory = await runFactoryCycle({
    story: {
      ...story,
      id: 'US-AJ11-cycle',
      pluginPermissions: ['read_local_docs', 'network'],
      grantedPermissions: ['read_local_docs', 'run_allowlisted_tests'],
    },
    root,
  });
  check('US-AJ11', hopState(permStory, 'registry') === 'DENIED' && permStory.state === 'denied' && permStory.released === false, 'Full factory cycle denies registry when permission-diff expands rights.');

  const jobs = await listFactoryJobs(root);
  check('US-AJ22', jobs.length >= 3, `Offline factory queue persisted ${jobs.length} jobs.`);

  const health = await buildFactoryHealthReport({ tenantId, universeId, root: repoRoot });
  check('US-AJ30', health.honesty.l4AutonomyEnabled === false && health.honesty.founderImpersonation === false && health.honesty.inventedPass === false && health.honesty.tipLand === false, 'Health report honesty locks remain false.');
  check('US-AJ30', health.predecessor.adMesh === 'PASS' && health.predecessor.acWorkcells === 'PASS', 'AD/AC predecessor reports are present on this child.');
  check('US-AJ30', health.predecessor.aiResearchDirector === 'WAITING_DATA' && health.predecessor.ahCausalWorldModel === 'WAITING_DATA' && health.predecessor.agAgentSociety === 'WAITING_DATA' && health.predecessor.afUniverseKernel === 'WAITING_DATA', 'AI/AH/AG/AF reports are WAITING_DATA (not invented PASS).');
  check('US-AJ16', health.localModel.availability === 'UNAVAILABLE' || health.localModel.availability === 'PASS', `Health localModel=${health.localModel.availability}; unconfigured stays UNAVAILABLE.`);
  check('US-AJ30', health.next.startsWith('62L-AK'), 'NEXT title is 62L-AK only.');
  check('US-AJ29', health.released === 0, 'Health report does not invent released artifacts on the repo root store.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

function hopState(job: { hopRecords: Array<{ hop: string; state: string }> }, hop: string) {
  return job.hopRecords.find((item) => item.hop === hop)?.state;
}

if (failures.length) {
  console.error('62L-AJ safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AJ safety tests PASS');
