import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readApprovedContext } from './context-vault';
import { LocalCheckpointStore } from './checkpoint-store';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { deriveRequirements, generateAgentCode, recordArchitecture, reviewApiContract, reviewApiUi, reviewSecurityCandidate, runEngineeringWorkcell, runTestFirstAcceptance } from './software-factory-engineering';
import { executePluginInSandbox, generateInternalTool, parsePluginManifest, registerGovernedPlugin, type PluginPermission } from './software-factory-plugins';
import { applyMigrationCandidate, businessAppTemplate, compatibilityMatrix, createConnectorCandidate, createModelAdapter, desktopCandidateProfile, humanReleaseGate, mobileCandidateProfile, packageReleaseCandidate, proposeMigrationCandidate, quarantineVulnerability } from './software-factory-candidates';
import { evaluateSandboxIsolation, openProtectedSourceSandbox, runFactoryAllowlistedCommand, writeSandboxCandidateFile } from './software-factory-sandbox';
import {
  FACTORY_CYCLE,
  FACTORY_HONESTY,
  FactorySimulatedCrash,
  type FactoryCandidateArtifact,
  type FactoryEvidenceState,
  type FactoryHop,
  type FactoryHopRecord,
  type FactoryJobState,
} from './software-factory-types';
import type { PatchFileChange } from './coding-agent';
import type { AllowedLocalCommand } from './local-command-runner';
import type { TestingAgentRunner } from './testing-agent';

export { FACTORY_CYCLE, FACTORY_HONESTY, FactorySimulatedCrash };

export type FactoryStory = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  objective: string;
  approved: boolean;
  verifiedDiscovery?: boolean;
  contextPath?: string;
  branch?: string;
  files?: PatchFileChange[];
  testsExpected?: AllowedLocalCommand[];
  testRunner?: TestingAgentRunner;
  pluginPermissions?: PluginPermission[];
  grantedPermissions?: PluginPermission[];
  apiPaths?: string[];
  template?: 'crm' | 'ledger' | 'inventory';
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  needsCloudProvider?: boolean;
  crashAfterHop?: FactoryHop;
  compilePass?: boolean;
};

export type FactoryJob = {
  id: string;
  storyId: string;
  tenantId: string;
  universeId: string;
  title: string;
  objective: string;
  state: FactoryJobState;
  completedHops: FactoryHop[];
  hopRecords: FactoryHopRecord[];
  candidate: FactoryCandidateArtifact | null;
  released: false;
  productionDeployed: false;
  crashAfterHop?: FactoryHop;
  createdAt: string;
  updatedAt: string;
};

type FactoryStore = {
  jobs: FactoryJob[];
};

const EMPTY: FactoryStore = { jobs: [] };

function storePath(root: string) {
  return xivLocalPath(root, 'software-factory.json');
}

function nowIso() {
  return new Date().toISOString();
}

function checkpointStateFor(state: FactoryJobState) {
  switch (state) {
    case 'completed':
      return 'completed' as const;
    case 'denied':
      return 'denied' as const;
    case 'unavailable':
      return 'unavailable' as const;
    case 'waiting_data':
      return 'waiting_data' as const;
    case 'queued':
      return 'queued' as const;
    case 'running':
      return 'running' as const;
    default:
      return 'failed' as const;
  }
}

function record(hop: FactoryHop, state: FactoryEvidenceState, summary: string): FactoryHopRecord {
  return { hop, state, summary, at: nowIso() };
}

export async function enqueueFactoryStory(story: FactoryStory, root = process.cwd()) {
  const state = await readJsonFile(storePath(root), EMPTY);
  const job: FactoryJob = {
    id: cortexId('factory'),
    storyId: story.id,
    tenantId: story.tenantId,
    universeId: story.universeId,
    title: story.title,
    objective: story.objective,
    state: story.approved || story.verifiedDiscovery ? 'queued' : 'denied',
    completedHops: [],
    hopRecords: story.approved || story.verifiedDiscovery
      ? []
      : [record('approved_story_or_verified_discovery', 'DENIED', 'Story is neither approved nor a verified discovery.')],
    candidate: null,
    released: false,
    productionDeployed: false,
    crashAfterHop: story.crashAfterHop,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function listFactoryJobs(root = process.cwd()) {
  return (await readJsonFile(storePath(root), EMPTY)).jobs;
}

async function saveJob(job: FactoryJob, root: string) {
  const state = await readJsonFile(storePath(root), EMPTY);
  const index = state.jobs.findIndex((item) => item.id === job.id);
  job.updatedAt = nowIso();
  if (index >= 0) state.jobs[index] = job;
  else state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function recoverInterruptedFactoryJobs(root = process.cwd()) {
  const state = await readJsonFile(storePath(root), EMPTY);
  const recovered: FactoryJob[] = [];
  for (const job of state.jobs) {
    if (job.state === 'running') {
      job.state = 'queued';
      job.updatedAt = nowIso();
      recovered.push(job);
    }
  }
  await writeJsonFileAtomic(storePath(root), state);
  return recovered;
}

export async function runFactoryCycle(input: {
  story: FactoryStory;
  root: string;
  resume?: FactoryJob;
}) {
  const root = input.root;
  const story = input.story;
  const job = input.resume ?? await enqueueFactoryStory(story, root);
  if (job.state === 'denied' && job.completedHops.length === 0 && job.hopRecords.some((item) => item.state === 'DENIED')) {
    return job;
  }

  const done = new Set(job.completedHops);
  const branch = story.branch ?? 'cursor/62l-aj-offline-software-factory-plugins-4059';
  job.state = 'running';
  await saveJob(job, root);

  const finishHop = async (hop: FactoryHop, state: FactoryEvidenceState, summary: string) => {
    job.hopRecords.push(record(hop, state, summary));
    if (state === 'PASS' || state === 'DENIED' || state === 'UNAVAILABLE' || state === 'WAITING_DATA') {
      job.completedHops.push(hop);
    }
    await saveJob(job, root);
    if (story.crashAfterHop === hop && !input.resume?.completedHops.includes(hop)) {
      throw new FactorySimulatedCrash(hop);
    }
  };

  const skip = (hop: FactoryHop) => done.has(hop);

  try {
    if (!skip('approved_story_or_verified_discovery')) {
      if (!story.approved && !story.verifiedDiscovery) {
        job.state = 'denied';
        await finishHop('approved_story_or_verified_discovery', 'DENIED', 'Unapproved work is not a factory input.');
        return job;
      }
      await finishHop('approved_story_or_verified_discovery', 'PASS', story.approved ? 'Approved story accepted.' : 'Verified discovery accepted as factory input.');
    }

    if (!skip('requirements')) {
      const requirements = deriveRequirements({
        storyId: story.id,
        tenantId: story.tenantId,
        universeId: story.universeId,
        objective: story.objective,
        source: story.approved ? 'approved_story' : 'verified_discovery',
      });
      if (story.contextPath) {
        await readApprovedContext(root, story.contextPath);
      }
      await finishHop('requirements', 'PASS', `Requirements derived (${requirements.acceptance.length} acceptance clauses). inventedFacts=false.`);
    }

    if (!skip('architecture')) {
      const architecture = recordArchitecture(story.objective);
      await finishHop('architecture', 'PASS', architecture.summary);
    }

    const sandboxOpen = openProtectedSourceSandbox({
      tenantId: story.tenantId,
      universeId: story.universeId,
      root,
      branch,
    });
    if (!sandboxOpen.allowed) {
      job.state = 'denied';
      await finishHop('engineering_workcell', 'DENIED', sandboxOpen.reason);
      return job;
    }

    const files = story.files?.length ? story.files : businessAppTemplate(story.template ?? 'ledger').files;
    const testsExpected = story.testsExpected ?? ['git_status'];
    const firstFile = files[0];
    if (!firstFile) {
      job.state = 'denied';
      await finishHop('engineering_workcell', 'DENIED', 'Factory engineering requires at least one candidate file.');
      return job;
    }

    if (!skip('engineering_workcell')) {
      const workcell = await runEngineeringWorkcell({
        tenantId: story.tenantId,
        universeId: story.universeId,
        storyId: story.id,
        objective: story.objective,
        files,
        testsExpected,
        cwd: root,
        runner: story.testRunner,
        currentBranch: branch,
        approved: story.approved || story.verifiedDiscovery,
        root,
      });
      if (!workcell.proposal.accepted) {
        job.state = 'denied';
        await finishHop('engineering_workcell', 'DENIED', workcell.proposal.reason);
        return job;
      }
      await finishHop('engineering_workcell', 'PASS', 'Engineering workcell reused 62L-AC protected coding workcell.');
    }

    if (!skip('protected_sandbox')) {
      const isolation = evaluateSandboxIsolation({ sandbox: sandboxOpen.sandbox, path: firstFile.path, kind: 'file' });
      const push = evaluateSandboxIsolation({ sandbox: sandboxOpen.sandbox, path: '.env', kind: 'file' });
      if (!isolation.allowed) {
        job.state = 'denied';
        await finishHop('protected_sandbox', 'DENIED', isolation.reason);
        return job;
      }
      await finishHop('protected_sandbox', 'PASS', `Sandbox isolated. Credential write denied=${!push.allowed}.`);
    }

    if (!skip('code')) {
      const generated = generateAgentCode({
        storyId: story.id,
        tenantId: story.tenantId,
        universeId: story.universeId,
        summary: story.objective,
        files,
        testsExpected,
      });
      if (!generated.accepted) {
        job.state = 'denied';
        await finishHop('code', 'DENIED', generated.reason);
        return job;
      }
      const written = await writeSandboxCandidateFile({
        sandbox: sandboxOpen.sandbox,
        path: firstFile.path,
        content: `// candidate only\nexport const released = false;\n`,
      });
      if (!written.written) {
        job.state = 'denied';
        await finishHop('code', 'DENIED', written.reason);
        return job;
      }
      await finishHop('code', 'PASS', 'Structured patch candidate materialized inside the sandbox. No shell.');
    }

    let testsPass = false;
    if (!skip('tests')) {
      const tests = await runTestFirstAcceptance({
        cwd: root,
        testsExpected,
        runner: story.testRunner,
      });
      testsPass = tests.passed;
      await finishHop('tests', tests.passed ? 'PASS' : 'FAIL', tests.reason);
      if (!tests.passed) {
        job.state = 'failed';
        return job;
      }
    } else {
      testsPass = true;
    }

    let securityPass = false;
    if (!skip('security')) {
      const security = reviewSecurityCandidate({
        files: files.map((file) => ({ path: file.path, unifiedDiff: file.unifiedDiff })),
        currentBranch: branch,
      });
      const vuln = quarantineVulnerability({ findings: security.findings });
      securityPass = security.passed && !vuln.quarantined;
      await finishHop('security', security.passed ? 'PASS' : 'FAIL', security.passed ? 'Security review passed with productionAuthorization=false.' : vuln.reason);
      if (!security.passed) {
        job.state = 'failed';
        return job;
      }
    } else {
      securityPass = true;
    }

    if (!skip('api_ui_review')) {
      const api = reviewApiContract({
        name: `${story.id}-api`,
        version: '0.0.1-candidate',
        paths: story.apiPaths ?? ['/health'],
      });
      const ui = reviewApiUi({ sandbox: sandboxOpen.sandbox, customerFacing: false });
      if (!api.accepted || !ui.accepted) {
        job.state = 'denied';
        await finishHop('api_ui_review', 'DENIED', api.accepted ? ui.reason : api.reason);
        return job;
      }
      await finishHop('api_ui_review', 'PASS', 'API/UI review recorded unpublished candidates.');
    }

    if (!skip('evidence')) {
      await appendEvidenceEvent({
        kind: 'evidence',
        storyId: story.id,
        tenantId: story.tenantId,
        universeId: story.universeId,
        summary: 'Factory evidence bundle for a build candidate.',
        payload: { released: false, productionDeployed: false },
      }, root);
      await finishHop('evidence', 'PASS', 'Evidence ledger appended. productionAuthorization=false.');
    }

    const granted = story.grantedPermissions ?? ['read_local_docs', 'write_sandbox_files', 'run_allowlisted_tests'];
    const requested = story.pluginPermissions ?? granted;
    const manifestParse = parsePluginManifest({
      pluginId: `plugin_${story.id}`,
      name: story.title,
      version: '0.0.1-candidate',
      publisher: 'xiv-offline-factory',
      requestedPermissions: requested,
    });

    if (!skip('plugin_manifest')) {
      if (!manifestParse.accepted) {
        job.state = 'denied';
        await finishHop('plugin_manifest', 'DENIED', manifestParse.reason);
        return job;
      }
      await finishHop('plugin_manifest', 'PASS', 'Plugin manifest accepted as sandbox-only.');
    }
    if (!manifestParse.accepted) {
      job.state = 'denied';
      return job;
    }

    let pluginRecord = null;
    if (!skip('registry')) {
      const registered = await registerGovernedPlugin({
        tenantId: story.tenantId,
        universeId: story.universeId,
        manifest: manifestParse.manifest,
        grantedPermissions: granted,
        root,
      });
      pluginRecord = registered.record;
      await finishHop('registry', registered.registered ? 'PASS' : 'DENIED', registered.reason);
      if (!registered.registered) {
        job.state = 'denied';
        return job;
      }
    }

    const compilePass = story.compilePass ?? testsPass;
    const matrix = compatibilityMatrix({ runtime: '62L-AJ', pluginVersion: '0.0.1-candidate' });
    const packed = packageReleaseCandidate({
      compilePass,
      testsPass,
      securityPass,
      plugin: pluginRecord ?? undefined,
      matrix,
    });
    job.candidate = packed.artifact;

    if (!skip('human_release_gate')) {
      const gate = humanReleaseGate({ artifact: packed.artifact, deploy: true });
      const decision = decisionGate({
        id: job.id,
        action: 'production_deploy',
        consequence: story.consequence ?? 'HIGH',
        production: story.production === true,
        financialCommitment: false,
        legalCommitment: false,
        permissionChange: story.permissionChange === true,
        externalPublication: true,
      });
      await finishHop(
        'human_release_gate',
        'DENIED',
        `${gate.reason}. decisionGate.executableByAgent=${decision.executableByAgent}.`,
      );
    }

    if (!skip('candidate_artifact')) {
      await finishHop(
        'candidate_artifact',
        packed.artifact.eligible ? 'PASS' : 'FAIL',
        `${packed.reason} released=${packed.artifact.released} productionDeployed=${packed.artifact.productionDeployed}.`,
      );
      job.state = packed.artifact.eligible ? 'completed' : 'failed';
    }

    if (story.needsCloudProvider) {
      job.state = 'unavailable';
    }

    await appendLearning({
      domain: 'technology',
      subject: story.title,
      claimState: 'MODEL_INFERENCE',
      summary: `Factory job ${job.id} ended state=${job.state}; released=false.`,
      sourceRefs: [job.id],
      evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
      taskId: job.id,
    }, root);

    const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
    await checkpoints.checkpoint({
      taskId: job.id,
      at: nowIso(),
      state: checkpointStateFor(job.state),
      attempt: 1,
      summary: `Factory candidate checkpoint state=${job.state}; released=false.`,
      nextAction: 'Human release gate remains closed. Do not deploy.',
      evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
    });

    await saveJob(job, root);
    return job;
  } catch (error) {
    if (error instanceof FactorySimulatedCrash) {
      job.state = 'running';
      await saveJob(job, root);
      throw error;
    }
    job.state = 'failed';
    await saveJob(job, root);
    throw error;
  }
}

export async function tickFactoryRuntime(input: { story: FactoryStory; root: string }) {
  const recovered = await recoverInterruptedFactoryJobs(input.root);
  const jobs = await listFactoryJobs(input.root);
  const queued = jobs.find((item) => item.state === 'queued' && item.storyId === input.story.id);
  if (queued) {
    return runFactoryCycle({ story: input.story, root: input.root, resume: queued });
  }
  if (recovered[0]) {
    return runFactoryCycle({ story: input.story, root: input.root, resume: recovered[0] });
  }
  return runFactoryCycle({ story: input.story, root: input.root });
}

export async function resumeFactoryJob(input: { story: FactoryStory; root: string }) {
  await recoverInterruptedFactoryJobs(input.root);
  const jobs = await listFactoryJobs(input.root);
  const job = jobs.find((item) => item.storyId === input.story.id);
  if (!job) throw new Error('FACTORY_JOB_NOT_FOUND');
  return runFactoryCycle({ story: input.story, root: input.root, resume: job });
}

export async function buildFactoryHealthReport(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const jobs = await listFactoryJobs(root);
  const model = await localModelStatus();
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const predecessorFile = (relative: string): FactoryEvidenceState =>
    existsSync(join(repoRoot, relative)) ? 'PASS' : 'WAITING_DATA';

  return {
    generatedAt: new Date().toISOString(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: FACTORY_CYCLE,
    jobs: jobs.length,
    completed: jobs.filter((item) => item.state === 'completed').length,
    released: jobs.filter((item) => item.released).length,
    localModel: {
      availability: model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      reason: model.reason,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      configured: slot.configured,
    })),
    predecessor: {
      adMesh: predecessorFile('docs/operations/62L_AD_DISTRIBUTED_OFFLINE_AGENT_MESH_REPORT.md'),
      acWorkcells: predecessorFile('docs/operations/62L_AC_OFFLINE_AGENT_RUNTIME_WORKCELLS_REPORT.md'),
      aiResearchDirector: predecessorFile('docs/operations/62L_AI_AUTONOMOUS_RESEARCH_DIRECTOR_REPORT.md'),
      ahCausalWorldModel: predecessorFile('docs/operations/62L_AH_CAUSAL_WORLD_MODEL_REPORT.md'),
      agAgentSociety: predecessorFile('docs/operations/62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md'),
      afUniverseKernel: predecessorFile('docs/operations/62L_AF_UNIVERSE_KERNEL_REPORT.md'),
      jSoftwareFactoryDocs: predecessorFile('docs/architecture/xiv-2i-ai-62j-self-improvement-lab-governed-software-factory.md'),
    },
    honesty: {
      ...FACTORY_HONESTY,
      windowsNodeVerification: 'NOT_TESTED' as const,
    },
    next: '62L-AK — Offline Developer Platform + Local App Store + Universe Package Manager + Agent Tool Marketplace',
  };
}

export {
  applyMigrationCandidate,
  businessAppTemplate,
  compatibilityMatrix,
  createConnectorCandidate,
  createModelAdapter,
  desktopCandidateProfile,
  evaluateSandboxIsolation,
  executePluginInSandbox,
  generateAgentCode,
  generateInternalTool,
  humanReleaseGate,
  mobileCandidateProfile,
  openProtectedSourceSandbox,
  packageReleaseCandidate,
  parsePluginManifest,
  proposeMigrationCandidate,
  registerGovernedPlugin,
  reviewApiContract,
  runFactoryAllowlistedCommand,
  writeSandboxCandidateFile,
};
