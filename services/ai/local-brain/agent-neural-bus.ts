import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { decisionGate } from './decision-gate';
import {
  AUTHORITY_TRANSFER_DENIED,
  BD_LOCKS,
  CROSS_UNIVERSE_ISOLATION,
  NEURAL_BUS_KINDS,
  type BdActor,
  type NeuralBusKind,
} from './cognitive-memory-types';

export const NEURAL_BUS_FILE = 'agent-neural-bus.json';

export type NeuralBusEnvelope = {
  id: string;
  kind: NeuralBusKind;
  fromAgentId: string;
  toAgentId: string;
  tenantId: string;
  universeId: string;
  body: string;
  evidenceRefs: string[];
  /** Explicitly never carries transferable authority. */
  authorityTransferAttempt: boolean;
  authorityTransferred: false;
  createdAt: string;
  expiresAt: string;
};

export type AuthorityTransferAttempt = {
  fromAgentId: string;
  toAgentId: string;
  tenantId: string;
  universeId: string;
  claimedAuthorityLevel: number;
  reason: string;
};

type BusStore = {
  messages: NeuralBusEnvelope[];
  denials: Array<{
    id: string;
    at: string;
    reason: string;
    attempt: AuthorityTransferAttempt;
  }>;
};

const MAX_MESSAGES = 10_000;
const DEFAULT_TTL_MS = 30 * 60_000;

function busPath(root: string) {
  return xivLocalPath(root, NEURAL_BUS_FILE);
}

async function load(root: string): Promise<BusStore> {
  const parsed = await readJsonFile<BusStore>(busPath(root), { messages: [], denials: [] });
  return {
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: BusStore) {
  await writeJsonFileAtomic(busPath(root), {
    messages: store.messages.slice(-MAX_MESSAGES),
    denials: store.denials.slice(-MAX_MESSAGES),
  });
}

function live(messages: NeuralBusEnvelope[], now: number) {
  return messages.filter((message) => Date.parse(message.expiresAt) > now);
}

/**
 * Hard deny: agents cannot transfer authority to another agent via Neural Bus.
 * Evidence/tasks/results may flow; authority levels and permission grants cannot.
 */
export async function attemptAuthorityTransfer(
  attempt: AuthorityTransferAttempt,
  root = process.cwd(),
) {
  const store = await load(root);
  const denial = {
    id: `deny_${randomUUID()}`,
    at: new Date().toISOString(),
    reason: AUTHORITY_TRANSFER_DENIED,
    attempt,
  };
  store.denials.push(denial);
  await save(root, store);

  const gate = decisionGate({
    id: denial.id,
    action: 'neural-bus-authority-transfer',
    consequence: 'CRITICAL',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: true,
    externalPublication: false,
  });

  return {
    allowed: false as const,
    authorityTransferred: false as const,
    reason: AUTHORITY_TRANSFER_DENIED,
    locks: {
      AUTHORITY_TRANSFER_VIA_NEURAL_BUS: BD_LOCKS.AUTHORITY_TRANSFER_VIA_NEURAL_BUS,
    },
    humanApprovalRequired: gate.humanApprovalRequired,
    executableByAgent: gate.executableByAgent,
    denialId: denial.id,
  };
}

export async function publishNeuralBusMessage(input: {
  kind: NeuralBusKind;
  from: BdActor;
  to: BdActor;
  body: string;
  evidenceRefs?: string[];
  /** If true, the publish is refused (authority non-transfer). */
  authorityTransferAttempt?: boolean;
  claimedAuthorityLevel?: number;
  ttlMs?: number;
  now?: number;
  root?: string;
}) {
  if (!NEURAL_BUS_KINDS.includes(input.kind)) {
    return { accepted: false as const, reason: 'UNKNOWN_BUS_KIND' };
  }
  if (!input.from.id || !input.to.id) {
    return { accepted: false as const, reason: 'AGENT_IDS_REQUIRED' };
  }
  if (!input.from.tenantId || !input.from.universeId) {
    return { accepted: false as const, reason: 'TENANT_AND_UNIVERSE_REQUIRED' };
  }
  if (
    input.from.tenantId !== input.to.tenantId ||
    input.from.universeId !== input.to.universeId
  ) {
    return {
      accepted: false as const,
      reason: CROSS_UNIVERSE_ISOLATION,
      note: 'Neural Bus does not route across Universes; use the Universe Knowledge Router with explicit permission.',
    };
  }
  if (!input.body.trim()) {
    return { accepted: false as const, reason: 'BODY_REQUIRED' };
  }
  if (input.body.length > 16_000) {
    return { accepted: false as const, reason: 'BODY_TOO_LARGE' };
  }

  const root = input.root ?? process.cwd();

  if (input.authorityTransferAttempt) {
    const denied = await attemptAuthorityTransfer(
      {
        fromAgentId: input.from.id,
        toAgentId: input.to.id,
        tenantId: input.from.tenantId,
        universeId: input.from.universeId,
        claimedAuthorityLevel: input.claimedAuthorityLevel ?? 1,
        reason: 'publish_with_authority_transfer_flag',
      },
      root,
    );
    return {
      accepted: false as const,
      reason: denied.reason,
      authorityTransferred: false as const,
      denialId: denied.denialId,
    };
  }

  const now = input.now ?? Date.now();
  const envelope: NeuralBusEnvelope = {
    id: `nbus_${randomUUID()}`,
    kind: input.kind,
    fromAgentId: input.from.id,
    toAgentId: input.to.id,
    tenantId: input.from.tenantId,
    universeId: input.from.universeId,
    body: input.body,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    authorityTransferAttempt: false,
    authorityTransferred: false,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + Math.max(1_000, Math.min(input.ttlMs ?? DEFAULT_TTL_MS, 24 * 60 * 60_000))).toISOString(),
  };

  const store = await load(root);
  store.messages = live(store.messages, now);
  store.messages.push(envelope);
  await save(root, store);
  return {
    accepted: true as const,
    envelope,
    authorityTransferred: false as const,
    reason: 'Neural Bus delivered evidence/task/result without authority transfer.',
  };
}

export async function neuralBusInbox(input: {
  agentId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const store = await load(input.root ?? process.cwd());
  const now = input.now ?? Date.now();
  return live(store.messages, now).filter(
    (message) =>
      message.toAgentId === input.agentId &&
      message.tenantId === input.tenantId &&
      message.universeId === input.universeId,
  );
}

export async function neuralBusDenials(root = process.cwd()) {
  return (await load(root)).denials;
}

export function neuralBusHonesty() {
  return {
    authorityTransferViaNeuralBus: false as const,
    lock: BD_LOCKS.AUTHORITY_TRANSFER_VIA_NEURAL_BUS,
    kinds: NEURAL_BUS_KINDS,
    crossUniverseRouting: false as const,
    productionAuthorization: false as const,
  };
}
