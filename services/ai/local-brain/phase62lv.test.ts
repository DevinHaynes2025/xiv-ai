import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentBus } from './agent-bus';
import { resetAgentPopulation } from './agent-population';
import { createFounderDigitalTwin, resetFounderDigitalTwins, twinAct } from './founder-digital-twin';
import { recallFounderMemories, rememberApprovedContextExcerpt, rememberFounderMemory } from './founder-memory-vault';
import { simulateFounderDecision } from './founder-decision-engine';
import { delegateCannot, planVirtualFounderDelegates } from './founder-delegates';
import { GlobalBrainHighways, GLOBAL_BRAIN_PIPELINE } from './global-brain-highways';
import { cloudToolRoutingDecision, requestSharedTool, verifyProviderForExchange } from './tool-capability-exchange';
import { planRdRecruiting } from './rd-recruiting-planner';
import { conveneMarketingIntelligenceCouncil } from './marketing-intelligence-council';
import { conveneGlobalResearchCouncil } from './global-research-council';
import { DEBRIEF_PHASES, listDebriefCycles, runDebriefRecoveryCycle } from './debrief-recovery';
import { inspectBrainHighwayHealth } from './brain-highway-health';
import {
  ADDRESSABLE_LOGICAL_CONTEXT_CAPACITY,
  ADDRESSABLE_LOGICAL_PATHWAY_CAPACITY,
  MAX_RESIDENT_CONTEXTS,
  addressLogicalContext,
  resetVirtualPopulation,
  simulateVirtualPopulation,
} from './virtual-population';
import { runGlobalBrainStory } from './global-brain';
import { providerSlots } from './provider-fabric';
import type { WorkEnvelope } from './collaboration-protocol';
import type { AllowedLocalCommand } from './local-command-runner';

const failures: string[] = [];
function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const root = await mkdtemp(join(tmpdir(), 'xiv-62lv-'));
const tenantId = '62lv-tenant';
const universeId = '62lv-universe';
const founderId = 'founder-devin';

try {
  resetAgentPopulation();
  resetAgentBus();
  resetFounderDigitalTwins();
  resetVirtualPopulation();

  const twin = createFounderDigitalTwin({ founderId, tenantId, universeId, displayName: 'Simulated Founder Twin' });
  check('US-V1', twin.authority === 'SIMULATED_ONLY' && twin.realFounderRemainsAuthority && twin.canFabricateApproval === false && twin.canSignContracts === false && twin.canSpendMoney === false && twin.canHireOrFire === false && twin.canImpersonateFounderExternally === false && twin.productionAuthorization === false, 'Founder Digital Twin is simulated-only.');
  const sign = twinAct({ twin, action: 'sign the contract with vendor', kind: 'sign_contract' });
  const spend = twinAct({ twin, action: 'spend money from usd funds', kind: 'spend_money' });
  const hire = twinAct({ twin, action: 'hire a staff engineer' });
  const impersonate = twinAct({ twin, action: 'draft a recommendation', impersonateFounderExternally: true });
  const recommend = twinAct({ twin, action: 'Draft a local sandbox recommendation for the next story.', kind: 'recommend', consequence: 'LOW' });
  check('US-V1-locks', !sign.allowed && !spend.allowed && !hire.allowed && !impersonate.allowed && recommend.allowed && recommend.founderApprovalFabricated === false && recommend.executableByAgent === false, 'Twin refuses contracts/spend/hire/impersonation and cannot fabricate approval.');

  const secretDenied = await rememberFounderMemory({
    twinId: twin.id,
    founderId,
    tenantId,
    universeId,
    kind: 'preference',
    subject: 'api_key stash',
    summary: 'token=super-secret',
    root,
  });
  check('US-V2-secret', secretDenied.accepted === false, 'Memory vault refuses secret-like material.');
  const remembered = await rememberFounderMemory({
    twinId: twin.id,
    founderId,
    tenantId,
    universeId,
    kind: 'preference',
    subject: 'offline-first',
    summary: 'Prefer local/offline work. Cloud stays UNAVAILABLE until configured.',
    sourceRefs: ['founder:preference'],
    root,
  });
  check('US-V2', remembered.accepted === true, 'Founder Memory Vault stores scoped non-secret memories.');
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, 'docs', 'note.md'), 'Approved local context for twin memory.\n', 'utf8');
  const excerpt = await rememberApprovedContextExcerpt({
    twinId: twin.id,
    founderId,
    tenantId,
    universeId,
    repoRoot: root,
    requestedPath: 'docs/note.md',
    subject: 'local-note',
  });
  const recalled = await recallFounderMemories({ tenantId, universeId, founderId, query: 'offline', root });
  const otherUniverse = await recallFounderMemories({ tenantId, universeId: 'other', founderId, root });
  check('US-V2-scope', excerpt.accepted === true && recalled.length >= 1 && otherUniverse.length === 0, 'Vault uses Context Vault excerpts and tenant/Universe isolation.');

  const fabricated = await simulateFounderDecision({
    twin,
    action: 'Approve production deploy',
    consequence: 'CRITICAL',
    production: true,
    twinClaimedFounderApproval: true,
    fabricatedApprovalToken: 'twin-says-yes',
    root,
  });
  check('US-V3-fabricate', fabricated.kind === 'SIMULATED_RECOMMENDATION' && fabricated.founderApprovalFabricated === false && fabricated.executableByTwin === false, 'Decision engine refuses fabricated twin approval.');
  const simulated = await simulateFounderDecision({
    twin,
    action: 'Prepare a local sandbox briefing',
    consequence: 'LOW',
    root,
  });
  check('US-V3', simulated.kind === 'SIMULATED_RECOMMENDATION' && simulated.executableByTwin === false && simulated.productionAuthorization === false && simulated.memoriesUsed >= 1, 'Simulated founder decision uses memory vault and remains recommendation-only.');
  const human = await simulateFounderDecision({
    twin,
    action: 'Prepare a local sandbox briefing',
    consequence: 'LOW',
    founderAuthorization: {
      source: 'human_founder',
      founderId,
      authorizedAction: 'Prepare a local sandbox briefing',
      evidenceRefs: ['human:explicit'],
    },
    root,
  });
  check('US-V3-human', human.kind === 'FOUNDER_AUTHORIZED' && human.productionAuthorization === false && human.executableByTwin === false, 'Only evidenced human founder authorization is recorded; twin still cannot execute.');

  const delegates = planVirtualFounderDelegates({
    twin,
    departments: ['rd', 'engineering', 'marketing', 'finance', 'supply_chain', 'operations'],
    consequence: 'LOW',
    approved: true,
    taskId: 'delegates-1',
  });
  check('US-V4', delegates.status === 'PLANNED' && delegates.delegates.length === 6 && delegates.delegates.every((d) => d.canHireOrFire === false && d.canSpendMoney === false && d.canSignContracts === false), 'Virtual founder delegates cover departments without hire/spend authority.');
  check('US-V4-lock', delegateCannot('hire').allowed === false, 'Delegates cannot hire.');

  const highways = new GlobalBrainHighways();
  const routed = highways.route({
    tenantId,
    universeId,
    fromLane: 'founder_twin',
    toLane: 'department',
    topic: 'story',
    body: 'Route a governed packet down the Global Brain Highway.',
  });
  const isolated = highways.packetsFor('other-tenant', universeId);
  check('US-V5', routed.accepted === true && highways.packetsFor(tenantId, universeId).length === 1 && isolated.length === 0 && GLOBAL_BRAIN_PIPELINE.length === 16, 'Global Brain routing highways are tenant/Universe scoped.');

  const localCmd = requestSharedTool('local_command_runner');
  const localModel = requestSharedTool('local_model');
  const cloud = cloudToolRoutingDecision();
  const aws = providerSlots().find((slot) => slot.provider === 'aws');
  check('US-V6', localCmd.state === 'AVAILABLE' && localModel.state === 'UNAVAILABLE' && cloud.cloud === 'UNAVAILABLE' && cloud.preferLocal === true && aws?.state === 'UNAVAILABLE', 'Shared tool exchange prefers local; unconfigured cloud/model stay UNAVAILABLE.');
  const verifiedLocal = verifyProviderForExchange({
    provider: 'local',
    capabilities: ['model_inference', 'compute'],
    configured: true,
    authorized: true,
    evidenceRefs: ['probe:local'],
    notes: 'Test-only local verification evidence.',
  });
  check('US-V6-verify', verifiedLocal.state === 'AVAILABLE' && providerSlots().find((slot) => slot.provider === 'aws')?.state === 'UNAVAILABLE', 'Provider exchange requires configuration+authorization+evidence; AWS remains UNAVAILABLE.');

  const rdPlan = planRdRecruiting({
    tenantId,
    universeId,
    taskId: 'rd-plan-1',
    focus: 'local knowledge retrieval',
    approved: true,
  });
  const rdHire = planRdRecruiting({
    tenantId,
    universeId,
    taskId: 'rd-hire',
    focus: 'real hire',
    attemptHire: true,
  });
  check('US-V7', rdPlan.status === 'PLANNED' && rdPlan.hired === false && rdPlan.realEmploymentChange === false && rdHire.status === 'DENIED', 'R&D recruiting is planning-only and cannot hire.');

  const marketingDenied = await conveneMarketingIntelligenceCouncil({
    tenantId,
    universeId,
    topic: 'Launch campaign as the founder',
    publishExternally: true,
    root,
  });
  const marketing = await conveneMarketingIntelligenceCouncil({
    tenantId,
    universeId,
    topic: 'Internal positioning draft',
    approved: true,
    root,
  });
  check('US-V8', marketingDenied.status === 'DENIED' && marketing.status === 'CONVENED' && marketing.externalPublication === false, 'Marketing Intelligence Council is recommendation-only.');

  const researchWait = await conveneGlobalResearchCouncil({
    tenantId,
    universeId,
    question: 'live market ticker',
    needsExternalFreshness: true,
    root,
  });
  const research = await conveneGlobalResearchCouncil({
    tenantId,
    universeId,
    question: 'offline-first local brain',
    approved: true,
    root,
  });
  check('US-V9', researchWait.status === 'WAITING_DATA' && research.status === 'CONVENED' && research.inventedFacts === false, 'Global Research Council uses local evidence and does not invent facts.');

  const debrief = await runDebriefRecoveryCycle({
    tenantId,
    universeId,
    storyId: '62L-V',
    taskId: 'debrief-1',
    accomplishments: ['Twin routing implemented'],
    failures: ['Local model UNAVAILABLE'],
    assumptions: ['Cloud remains UNAVAILABLE until configured'],
    resourceUse: { modelCalls: 0, residentAgents: 3, notes: 'sparse' },
    lessons: ['Do not treat twin output as founder approval'],
    nextPriorities: ['Keep 62L-W transit honest about offline partitioning'],
    root,
  });
  const cycles = await listDebriefCycles(tenantId, universeId, root);
  check('US-V10', debrief.record.suspended === true && DEBRIEF_PHASES.join('>') === 'checkpoint>summarize>lessons>suspend>next_priorities' && cycles.length >= 1 && debrief.checkpoint.summary.includes('Debrief'), 'Debrief/recovery cycles checkpoint, summarize, learn, suspend, and record next priorities.');

  const health = inspectBrainHighwayHealth(highways, { tenantId, universeId, congestionThreshold: 1 });
  check('US-V11', health.productionAuthorization === false && health.providersUnavailable.includes('aws') && health.lanes.some((lane) => lane.lane === 'founder_twin' && (lane.status === 'HEALTHY' || lane.status === 'CONGESTED')), 'Brain Highway health monitoring reports scoped lane status without claiming cloud AVAILABLE.');

  const first = addressLogicalContext({ tenantId, universeId, highway: 'global', department: 'rd', pathwayIndex: 7 });
  const reuse = addressLogicalContext({ tenantId, universeId, highway: 'global', department: 'rd', pathwayIndex: 7 });
  for (let index = 0; index < MAX_RESIDENT_CONTEXTS + 2; index += 1) {
    addressLogicalContext({ tenantId, universeId, highway: 'global', department: 'sim', pathwayIndex: index + 10 });
  }
  const population = simulateVirtualPopulation(highways.fabric);
  check('US-V12', first.materialized === true && reuse.reused === true && population.addressableLogicalContexts === ADDRESSABLE_LOGICAL_CONTEXT_CAPACITY && population.addressableLogicalPathways === ADDRESSABLE_LOGICAL_PATHWAY_CAPACITY && population.residentContexts <= MAX_RESIDENT_CONTEXTS && population.runningProgramsAreNotTrillions === true && population.residentProcesses < 1_000, 'Virtual population is a sparse address space, not trillions of running programs.');

  resetAgentPopulation();
  const envelope: WorkEnvelope = {
    id: 'gb-1',
    tenantId,
    universeId,
    storyId: '62L-V',
    objective: 'Prepare a bounded local Global Brain patch candidate.',
    requestedRoles: ['coder', 'tester', 'security'],
    sourceProvider: 'cursor',
    targetProviders: ['chatgpt', 'local_model'],
    evidenceRefs: ['story:62L-V'],
    classification: 'internal',
    consequence: 'LOW',
    productionAuthorized: false,
    permissionExpansionAuthorized: false,
  };
  const files = [{
    path: 'services/ai/local-brain/example.ts',
    action: 'modify' as const,
    unifiedDiff: [
      '--- a/services/ai/local-brain/example.ts',
      '+++ b/services/ai/local-brain/example.ts',
      '@@ -1,1 +1,2 @@',
      ' export const x = 1;',
      '+export const y = 2;',
    ].join('\n'),
  }];
  const runner = async (input: { id: AllowedLocalCommand }) => ({
    exitCode: 0,
    stdout: input.id,
    stderr: '',
    timedOut: false,
    productionEffect: false as const,
  });
  const story = await runGlobalBrainStory({
    founderId,
    tenantId,
    universeId,
    storyId: '62L-V',
    objective: 'Prepare a bounded local Global Brain patch candidate.',
    envelope,
    demand: {
      tenantId,
      universeId,
      taskId: 'gb-1',
      requestedRoles: ['coder', 'tester', 'security'],
      consequence: 'LOW',
      approved: true,
    },
    observations: [
      { provider: 'chatgpt', state: 'UNAVAILABLE', evidenceRefs: [], notes: 'Not configured.' },
      { provider: 'local_model', state: 'UNAVAILABLE', evidenceRefs: [], notes: 'Not verified in this run.' },
    ],
    currentBranch: 'cursor/62l-v-global-brain-founder-twin-4059',
    files,
    cwd: root,
    testCommands: ['git_diff_check'],
    runner,
  });
  check('US-V-pipeline', story.status !== 'DENIED' && 'decision' in story && story.pipeline.join(' → ') === GLOBAL_BRAIN_PIPELINE.join(' → ') && story.productionAuthorization === false && story.founderApprovalFabricated === false && story.decision.kind === 'SIMULATED_RECOMMENDATION' && story.twin.authority === 'SIMULATED_ONLY', 'Orchestrator preserves Founder → Twin → Highway → … → Next Story without fabricated approval.');
  check('US-V-pipeline-status', story.status !== 'DENIED' && 'civilization' in story && story.civilization.productionAuthorization === false && story.cloud.cloud === 'UNAVAILABLE' && story.population.runningProgramsAreNotTrillions, 'Pipeline keeps providers honest and population sparse.');

  const fabricateStory = twinAct({ twin: story.twin, action: 'approve as founder the production cut', kind: 'fabricate_founder_approval' });
  check('US-V-no-fake-approval', fabricateStory.allowed === false, 'Pipeline twin still cannot fabricate founder approval.');

  if (failures.length) {
    console.error(failures.join('\n'));
    throw new Error(`62L-V tests failed: ${failures.length}`);
  }
  console.log('62L-V safety tests PASS');
} finally {
  await rm(root, { recursive: true, force: true });
}
