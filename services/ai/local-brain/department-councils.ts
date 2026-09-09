import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createMeeting, runLocalMeeting, type MeshAgentRole } from './agent-mesh';
import { retrieveEvidencePathway } from './cortex-evidence';
import { conveneHistoricalCulturalCouncil } from './cortex-councils';
import { conveneReflectionCouncil } from './reflection-council';
import { openPersistentMeeting, runPersistentMeetingRound } from './persistent-meetings';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { runScenarioSimulation } from './simulation-lab';
import { rememberCortexTrace } from './memory-cortex';
import {
  councilMinimumContext,
  listSealedPriorities,
  SEALED_REDACTION,
  type CompartmentActor,
} from './privacy-compartments';
import { DEPARTMENT_ROLES, type SocietyDepartment } from './persistent-agent-registry';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const DEPARTMENT_COUNCIL_FILE = 'department-councils.json';
export const HARD_MAX_DEBATE_ROUNDS = 4;

export type DepartmentCouncilKind = SocietyDepartment | 'skeptic';

export type DepartmentCouncilRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: DepartmentCouncilKind;
  topic: string;
  roles: MeshAgentRole[];
  independentPositions: Array<{ role: MeshAgentRole; position: string }>;
  messages: Array<{ from: string; content: string }>;
  dissent: string[];
  evidenceRefs: string[];
  retrievalBeforeReasoning: true;
  consensusForced: false;
  founderImpersonation: false;
  sealedPayload: typeof SEALED_REDACTION;
  councilContext: ReturnType<typeof councilMinimumContext>;
  runtimeState: 'COMPLETED' | 'UNAVAILABLE';
  debateRounds: number;
  productionAuthorized: false;
  createdAt: string;
};

type Store = { councils: DepartmentCouncilRecord[] };

function pathFor(root: string) {
  return xivLocalPath(root, DEPARTMENT_COUNCIL_FILE);
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { councils: [] });
  return Array.isArray(parsed.councils) ? parsed.councils : [];
}

async function save(root: string, councils: DepartmentCouncilRecord[]) {
  await writeJsonFileAtomic(pathFor(root), { councils: councils.slice(-1_000) });
}

function rolesFor(kind: DepartmentCouncilKind): MeshAgentRole[] {
  if (kind === 'skeptic') return ['skeptic', 'evidence_verifier', 'researcher'];
  return DEPARTMENT_ROLES[kind];
}

export async function multiModelCouncilSlots() {
  const local = await localModelStatus();
  const providers = providerSlots().map((slot) => ({
    provider: slot.provider,
    configured: slot.configured,
    authorized: slot.authorized,
    state: slot.configured && slot.authorized && slot.evidenceRefs.length > 0 ? slot.state : 'UNAVAILABLE' as const,
    cloudFallback: false as const,
  }));
  return {
    local: {
      state: local.availability,
      model: local.model,
      reason: local.reason,
      cloudFallback: false as const,
    },
    providers,
    unconfiguredStayUnavailable: true as const,
    l4AutonomyEnabled: false as const,
  };
}

export async function probeDistributedMeshModule(): Promise<{
  state: 'WAITING_DATA' | 'UNAVAILABLE';
  modulePresent: boolean;
  reason: string;
}> {
  const file = join(dirname(fileURLToPath(import.meta.url)), 'distributed-mesh-runtime.ts');
  try {
    await access(file);
    return {
      state: 'WAITING_DATA',
      modulePresent: true,
      reason: 'distributed-mesh-runtime.ts exists locally but 62L-AD is not the parent of this child; AG reuses agent-mesh.ts.',
    };
  } catch {
    return {
      state: 'WAITING_DATA',
      modulePresent: false,
      reason: '62L-AD Distributed Mesh is not on this AC parent. Local agent-mesh / persistent meetings are reused.',
    };
  }
}

async function sealedCouncilContext(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  evidenceRefs: string[];
  actor: CompartmentActor;
  root: string;
}) {
  const priorities = await listSealedPriorities(input.tenantId, input.universeId, input.root);
  return councilMinimumContext({
    topic: input.topic,
    evidenceRefs: input.evidenceRefs,
    priority: priorities[0] ?? null,
    authorized: input.actor.kind === 'ceo_principal',
  });
}

export async function conveneDepartmentCouncil(input: {
  tenantId: string;
  universeId: string;
  kind: DepartmentCouncilKind;
  topic: string;
  maxRounds?: number;
  actor?: CompartmentActor;
  quantSignals?: QuantSignal[];
  root?: string;
}): Promise<DepartmentCouncilRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.topic.trim()) throw new Error('COUNCIL_TOPIC_REQUIRED');
  const root = input.root ?? process.cwd();
  const actor: CompartmentActor = input.actor ?? { id: 'council-default', kind: 'council' };
  const knowledge = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.topic,
    root,
  });
  const context = await sealedCouncilContext({
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: input.topic,
    evidenceRefs: knowledge.evidenceRefs,
    actor,
    root,
  });
  const debateRounds = Math.max(1, Math.min(input.maxRounds ?? 2, HARD_MAX_DEBATE_ROUNDS));
  const roles = rolesFor(input.kind);

  if (input.kind === 'historical_cultural') {
    const historical = await conveneHistoricalCulturalCouncil({
      tenantId: input.tenantId,
      universeId: input.universeId,
      topic: input.topic,
      root,
    });
    const record: DepartmentCouncilRecord = {
      id: cortexId('deptcouncil'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: input.kind,
      topic: input.topic.trim(),
      roles: historical.roles,
      independentPositions: historical.independentPositions,
      messages: historical.messages,
      dissent: historical.dissent,
      evidenceRefs: historical.evidenceRefs,
      retrievalBeforeReasoning: true,
      consensusForced: false,
      founderImpersonation: false,
      sealedPayload: SEALED_REDACTION,
      councilContext: context,
      runtimeState: historical.runtimeState,
      debateRounds: 1,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
    };
    const councils = await load(root);
    councils.push(record);
    await save(root, councils);
    return record;
  }

  if (input.kind === 'research' || input.kind === 'skeptic') {
    const reflection = await conveneReflectionCouncil({
      tenantId: input.tenantId,
      universeId: input.universeId,
      question: input.topic,
      root,
    });
    const record: DepartmentCouncilRecord = {
      id: cortexId('deptcouncil'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: input.kind,
      topic: input.topic.trim(),
      roles: reflection.roles,
      independentPositions: reflection.independentPositions,
      messages: reflection.messages,
      dissent: reflection.dissent,
      evidenceRefs: reflection.evidenceRefs,
      retrievalBeforeReasoning: true,
      consensusForced: false,
      founderImpersonation: false,
      sealedPayload: SEALED_REDACTION,
      councilContext: context,
      runtimeState: reflection.runtimeState,
      debateRounds: 1,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
    };
    const councils = await load(root);
    councils.push(record);
    await save(root, councils);
    return record;
  }

  if (input.kind === 'quant_simulation' && input.quantSignals?.length) {
    evaluateQuantSignals(input.quantSignals);
    await runScenarioSimulation({
      tenantId: input.tenantId,
      universeId: input.universeId,
      hypothesis: input.topic,
      consequence: 'LOW',
      root,
    });
  }

  const independentPositions = roles.map((role) => ({
    role,
    position: knowledge.evidenceRefs.length
      ? `${role} independent position before debate: use local evidence ${knowledge.evidenceRefs.slice(0, 8).join(', ')}. Do not invent facts. Do not force consensus. Sealed founder payload=${SEALED_REDACTION}.`
      : `${role} independent position before debate: no local evidence yet. UNKNOWN is valid. Do not invent facts. Sealed founder payload=${SEALED_REDACTION}.`,
  }));

  const meeting = await openPersistentMeeting({
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: `${input.topic}\nMinimum council context: ${JSON.stringify(context)}\nIndependent positions were written before exchange.`,
    roles,
    maxRounds: debateRounds,
    root,
  });
  let runtimeState: 'COMPLETED' | 'UNAVAILABLE' = 'UNAVAILABLE';
  let messages: Array<{ from: string; content: string }> = [];
  let stepped = meeting;
  for (let round = 0; round < debateRounds; round += 1) {
    stepped = await runPersistentMeetingRound({ id: meeting.id, tenantId: input.tenantId, universeId: input.universeId, root });
    runtimeState = stepped.state === 'unavailable' ? 'UNAVAILABLE' : 'COMPLETED';
    messages = stepped.messages.map((message) => ({ from: message.from, content: message.content }));
  }
  if (!messages.length) {
    const fallback = await runLocalMeeting(createMeeting(input.topic, roles, 1));
    runtimeState = fallback.runtimeState;
    messages = fallback.messages.map((message) => ({ from: message.from, content: message.content }));
  }

  const dissent = [
    'Consensus is not forced; dissent remains first-class.',
    ...messages.filter((message) => /UNAVAILABLE|uncertain|contradict|disagree|dissent/i.test(message.content)).map((message) => `${message.from}: ${message.content.slice(0, 240)}`),
  ];

  const record: DepartmentCouncilRecord = {
    id: cortexId('deptcouncil'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    topic: input.topic.trim(),
    roles,
    independentPositions,
    messages,
    dissent,
    evidenceRefs: knowledge.evidenceRefs,
    retrievalBeforeReasoning: true,
    consensusForced: false,
    founderImpersonation: false,
    sealedPayload: SEALED_REDACTION,
    councilContext: context,
    runtimeState,
    debateRounds,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  const councils = await load(root);
  councils.push(record);
  await save(root, councils);
  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'council',
    claimState: knowledge.evidenceRefs.length ? 'MODEL_INFERENCE' : 'UNKNOWN',
    label: `Dept council ${input.kind}: ${input.topic.slice(0, 72)}`,
    summary: `runtime=${runtimeState}; rounds=${debateRounds}; sealed=${SEALED_REDACTION}; evidence=${knowledge.evidenceRefs.length}`,
    evidenceRefs: knowledge.evidenceRefs,
    sourceRefs: [`deptcouncil:${record.id}`],
    retentionClass: 'working',
    root,
  });
  return record;
}

export async function listDepartmentCouncils(tenantId: string, universeId: string, root = process.cwd()) {
  return (await load(root)).filter((item) => item.tenantId === tenantId && item.universeId === universeId);
}

export function departmentCouncilStats(councils: DepartmentCouncilRecord[]) {
  return {
    total: councils.length,
    unavailable: councils.filter((item) => item.runtimeState === 'UNAVAILABLE').length,
    consensusForced: false as const,
    founderImpersonation: false as const,
    productionAuthorized: false as const,
  };
}
