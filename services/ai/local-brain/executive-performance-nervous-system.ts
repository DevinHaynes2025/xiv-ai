/**
 * 62L-DT Module G — Executive Performance Nervous System.
 * Decision-to-outcome learning: correlation ≠ causation.
 * Digital Twin ≠ founder.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CORRELATION_NEQ_CAUSATION,
  MAX_EXEC_DECISIONS,
  TWIN_NEQ_FOUNDER,
  type DtActor,
} from './growth-operating-system-types';

export type DecisionOutcomeLearning = {
  id: string;
  decisionId: string;
  outcomeId: string;
  correlationObserved: boolean;
  causationClaimed: boolean;
  causationGuaranteed: false;
  status: 'correlation_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type ExecutiveAlignment = {
  id: string;
  theme: string;
  aligned: boolean;
  reason: string;
  createdAt: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorKind: DtActor['kind'];
  claimsFounderAuthority: boolean;
  status: 'denied' | 'ok';
  isFounder: false | true;
  reason: string;
  at: string;
};

type Store = {
  learnings: DecisionOutcomeLearning[];
  alignments: ExecutiveAlignment[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'executive-performance-nervous-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    learnings: [],
    alignments: [],
    twinProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function executivePerformanceNervousSystemHonesty() {
  return {
    decisionOutcomeGuaranteedCausation: false,
    correlationEqCausation: false,
    digitalTwinEqFounder: false,
    consciousnessClaimed: false,
  };
}

export async function recordDecisionOutcomeLearning(input: {
  decisionId: string;
  outcomeId: string;
  correlationObserved: boolean;
  claimCausation?: boolean;
  root: string;
  actor: DtActor;
}): Promise<DecisionOutcomeLearning> {
  const store = await load(input.root);
  void input.actor;
  if (store.learnings.length >= MAX_EXEC_DECISIONS) {
    throw new Error('MAX_EXEC_DECISIONS_REACHED');
  }
  const learning: DecisionOutcomeLearning = {
    id: id('dtlearn'),
    decisionId: input.decisionId,
    outcomeId: input.outcomeId,
    correlationObserved: input.correlationObserved,
    causationClaimed: input.claimCausation === true,
    causationGuaranteed: false,
    status: input.claimCausation ? 'denied' : 'correlation_only',
    reason: CORRELATION_NEQ_CAUSATION,
    createdAt: new Date().toISOString(),
  };
  store.learnings.push(learning);
  await save(input.root, store);
  return learning;
}

export async function recordExecutiveAlignment(input: {
  theme: string;
  aligned: boolean;
  root: string;
  actor: DtActor;
}): Promise<ExecutiveAlignment> {
  const store = await load(input.root);
  void input.actor;
  const alignment: ExecutiveAlignment = {
    id: id('dtalign'),
    theme: input.theme.trim(),
    aligned: input.aligned,
    reason: input.aligned
      ? 'EXECUTIVE_ALIGNMENT_RECORDED'
      : 'EXECUTIVE_ALIGNMENT_GAP_RECORDED',
    createdAt: new Date().toISOString(),
  };
  store.alignments.push(alignment);
  await save(input.root, store);
  return alignment;
}

export async function probeDigitalTwinAuthority(input: {
  actor: DtActor;
  claimFounderAuthority?: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const isTwin = input.actor.kind === 'digital_twin';
  const claims = input.claimFounderAuthority === true || isTwin;
  const probe: TwinAuthorityProbe = {
    id: id('dttwin'),
    actorKind: input.actor.kind,
    claimsFounderAuthority: claims,
    status: isTwin || input.claimFounderAuthority ? 'denied' : 'ok',
    isFounder: input.actor.kind === 'founder',
    reason:
      isTwin || input.claimFounderAuthority
        ? TWIN_NEQ_FOUNDER
        : 'ACTOR_NOT_CLAIMING_FOUNDER_VIA_TWIN',
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}
