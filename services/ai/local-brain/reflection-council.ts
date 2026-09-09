import { publishAgentMessage } from './agent-bus';
import { createMeeting, runLocalMeeting, type MeshAgentRole } from './agent-mesh';
import { retrieveEvidencePathway } from './cortex-evidence';
import { rememberCortexTrace } from './memory-cortex';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const REFLECTION_ROLES: MeshAgentRole[] = [
  'researcher',
  'skeptic',
  'evidence_verifier',
  'decision_strategist',
];

export type ReflectionCouncilRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  question: string;
  roles: MeshAgentRole[];
  independentPositions: Array<{ role: MeshAgentRole; position: string }>;
  messages: Array<{ from: string; content: string }>;
  dissent: string[];
  consensusForced: false;
  claimsConsciousness: false;
  runtimeState: 'COMPLETED' | 'UNAVAILABLE';
  evidenceRefs: string[];
  createdAt: string;
  productionAuthorized: false;
};

type Store = { councils: ReflectionCouncilRecord[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'reflection-councils.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { councils: [] });
  return Array.isArray(parsed.councils) ? parsed.councils : [];
}

async function save(root: string, councils: ReflectionCouncilRecord[]) {
  await writeJsonFileAtomic(pathFor(root), { councils: councils.slice(-500) });
}

export async function conveneReflectionCouncil(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<ReflectionCouncilRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.question.trim()) throw new Error('REFLECTION_QUESTION_REQUIRED');
  const root = input.root ?? process.cwd();
  const knowledge = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    root,
  });

  const independentPositions = REFLECTION_ROLES.map((role) => ({
    role,
    position: knowledge.evidenceRefs.length
      ? `${role} independent position: critique the hypothesis using local evidence ${knowledge.evidenceRefs.slice(0, 8).join(', ')}. XIV does not claim consciousness. Do not force consensus.`
      : `${role} independent position: no local evidence yet. UNKNOWN is valid. XIV does not claim consciousness. Do not invent facts or force consensus.`,
  }));

  const meeting = createMeeting(
    `${input.question}\n\nIndependent positions were written before debate.\nEvidence: ${knowledge.evidenceRefs.join(', ') || 'none'}\nXIV does not claim consciousness.`,
    REFLECTION_ROLES,
    1,
  );
  const result = await runLocalMeeting(meeting);
  const dissent = [
    'Consensus is not forced. Critique remains first-class.',
    ...result.messages
      .filter((message) => /UNAVAILABLE|uncertain|contradict|disagree|dissent/i.test(message.content))
      .map((message) => `${message.from}: ${message.content.slice(0, 240)}`),
  ];

  const record: ReflectionCouncilRecord = {
    id: cortexId('reflect'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question.trim(),
    roles: [...REFLECTION_ROLES],
    independentPositions,
    messages: result.messages.map((message) => ({ from: message.from, content: message.content })),
    dissent,
    consensusForced: false,
    claimsConsciousness: false,
    runtimeState: result.messages.some((message) => /UNAVAILABLE/i.test(message.content)) ? 'UNAVAILABLE' : 'COMPLETED',
    evidenceRefs: knowledge.evidenceRefs,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };

  publishAgentMessage({
    fromRole: 'skeptic',
    toRole: 'executive_synthesizer',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'challenge',
    body: `Reflection council ${record.id}: ${input.question} (consensusForced=false, claimsConsciousness=false)`,
    evidenceRefs: knowledge.evidenceRefs,
    requiresHumanApproval: false,
  });

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'council',
    claimState: 'MODEL_INFERENCE',
    label: `Reflection council: ${input.question.slice(0, 72)}`,
    summary: `runtimeState=${record.runtimeState}; consensusForced=false; claimsConsciousness=false`,
    evidenceRefs: knowledge.evidenceRefs,
    sourceRefs: [`reflect:${record.id}`],
    retentionClass: 'working',
    root,
  });

  const councils = await load(root);
  councils.push(record);
  await save(root, councils);
  return record;
}

export async function loadReflectionCouncil(id: string, tenantId: string, universeId: string, root?: string) {
  const councils = await load(root ?? process.cwd());
  return councils.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId) ?? null;
}
