import { publishAgentMessage } from './agent-bus';
import { createMeeting, runLocalMeeting, type MeshAgentRole } from './agent-mesh';
import { retrieveEvidencePathway } from './cortex-evidence';
import { rememberCortexTrace } from './memory-cortex';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const HISTORICAL_CULTURAL_ROLES: MeshAgentRole[] = [
  'culture_historian',
  'researcher',
  'skeptic',
  'evidence_verifier',
];

export type CouncilKind = 'historical' | 'cultural' | 'mixed';

export type CouncilRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: CouncilKind;
  topic: string;
  roles: MeshAgentRole[];
  independentPositions: Array<{ role: MeshAgentRole; position: string }>;
  messages: Array<{ from: string; content: string }>;
  dissent: string[];
  consensusForced: false;
  runtimeState: 'COMPLETED' | 'UNAVAILABLE';
  evidenceRefs: string[];
  createdAt: string;
  productionAuthorized: false;
};

type CouncilStore = { councils: CouncilRecord[] };

function councilsPath(root: string) {
  return xivLocalPath(root, 'historical-cultural-councils.json');
}

async function loadCouncils(root: string) {
  const parsed = await readJsonFile<CouncilStore>(councilsPath(root), { councils: [] });
  return Array.isArray(parsed.councils) ? parsed.councils : [];
}

async function saveCouncils(root: string, councils: CouncilRecord[]) {
  await writeJsonFileAtomic(councilsPath(root), { councils: councils.slice(-500) });
}

export async function conveneHistoricalCulturalCouncil(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  kind?: CouncilKind;
  root?: string;
}): Promise<CouncilRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.topic.trim()) throw new Error('COUNCIL_TOPIC_REQUIRED');
  const root = input.root ?? process.cwd();
  const knowledge = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.topic,
    root,
  });

  const independentPositions = HISTORICAL_CULTURAL_ROLES.map((role) => ({
    role,
    position: knowledge.evidenceRefs.length
      ? `${role} independent position: evaluate local evidence ${knowledge.evidenceRefs.slice(0, 8).join(', ')} before synthesis. Do not treat cultural context as verified fact.`
      : `${role} independent position: no local evidence yet. UNKNOWN is valid. Do not invent historical or cultural facts.`,
  }));

  const meeting = createMeeting(
    `${input.topic}\n\nIndependent positions were written before exchange.\nEvidence: ${knowledge.evidenceRefs.join(', ') || 'none'}`,
    HISTORICAL_CULTURAL_ROLES,
    1,
  );
  const result = await runLocalMeeting(meeting);
  const dissent = [
    'Consensus is not forced; historical accounts, cultural context, belief/tradition, and verified fact remain distinct claim states.',
    ...result.messages.filter((message) => /UNAVAILABLE|uncertain|contradict|disagree|dissent/i.test(message.content)).map((message) => `${message.from}: ${message.content.slice(0, 240)}`),
  ];

  for (const message of result.messages) {
    publishAgentMessage({
      fromRole: message.from,
      toRole: 'all',
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'challenge',
      body: message.content.slice(0, 16_000),
      evidenceRefs: knowledge.evidenceRefs,
      requiresHumanApproval: false,
    });
  }

  const record: CouncilRecord = {
    id: cortexId('council'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind ?? 'mixed',
    topic: input.topic.trim(),
    roles: [...HISTORICAL_CULTURAL_ROLES],
    independentPositions,
    messages: result.messages.map((message) => ({ from: message.from, content: message.content })),
    dissent,
    consensusForced: false,
    runtimeState: result.runtimeState,
    evidenceRefs: knowledge.evidenceRefs,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };

  const councils = await loadCouncils(root);
  councils.push(record);
  await saveCouncils(root, councils);

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'world',
    kind: 'council',
    claimState: 'CULTURAL_CONTEXT',
    label: `Council: ${input.topic.slice(0, 80)}`,
    summary: `runtime=${record.runtimeState}; dissent=${dissent.length}; evidence=${knowledge.evidenceRefs.length}`,
    evidenceRefs: knowledge.evidenceRefs,
    sourceRefs: [`council:${record.id}`],
    classification: 'internal',
    retentionClass: 'durable',
    root,
  });

  return record;
}

export async function loadCouncil(id: string, tenantId: string, universeId: string, root = process.cwd()) {
  const councils = await loadCouncils(root);
  return councils.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId) ?? null;
}

export function councilStats(councils: CouncilRecord[]) {
  return {
    total: councils.length,
    unavailable: councils.filter((item) => item.runtimeState === 'UNAVAILABLE').length,
    consensusForced: false as const,
    productionAuthorized: false as const,
  };
}

export async function listCouncils(tenantId: string, universeId: string, root = process.cwd()) {
  return (await loadCouncils(root)).filter((item) => item.tenantId === tenantId && item.universeId === universeId);
}
