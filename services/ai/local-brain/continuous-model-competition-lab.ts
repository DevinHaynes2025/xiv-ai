/**
 * 62L-DE Continuous Model Competition Lab —
 * Continuous model tournaments/competitions with evaluation records.
 * Winner/consensus ≠ verified proof / production model.
 * Unconfigured targets UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HONESTY_BANNER,
  MAX_TOURNAMENTS,
  TOURNAMENT_WINNER_NOT_PROOF,
  UNCONFIGURED_MODEL_UNAVAILABLE,
  type DeActor,
} from './knowledge-exchange-gateway-marketplace-types';

export type CompetitionTarget = {
  id: string;
  modelKey: string;
  configured: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type TournamentRecord = {
  id: string;
  name: string;
  participantIds: string[];
  winnerTargetId: string | null;
  consensusOnly: boolean;
  labeledVerifiedProof: false;
  productionModelPromoted: false;
  evaluationEvidence: string[];
  status: 'RECORDED' | 'DENIED' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

type Store = {
  targets: CompetitionTarget[];
  tournaments: TournamentRecord[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'continuous-model-competition-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { targets: [], tournaments: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function continuousModelCompetitionLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    winnerEqVerifiedProof: DE_LOCKS.TOURNAMENT_WINNER_EQ_VERIFIED_PROOF,
    winnerEqProductionModel: DE_LOCKS.TOURNAMENT_WINNER_EQ_PRODUCTION_MODEL,
    unconfiguredAvailable: DE_LOCKS.UNCONFIGURED_MODEL_AVAILABLE,
  };
}

export async function registerCompetitionTarget(input: {
  modelKey: string;
  configured?: boolean;
  root: string;
  actor: DeActor;
}): Promise<CompetitionTarget> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const configured = input.configured === true;
  const target: CompetitionTarget = {
    id: id('cmct'),
    modelKey: input.modelKey.trim().toLowerCase(),
    configured,
    status: configured ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: configured
      ? 'COMPETITION_TARGET_CONFIGURED'
      : UNCONFIGURED_MODEL_UNAVAILABLE,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function runModelTournament(input: {
  name: string;
  participantIds: string[];
  winnerTargetId?: string | null;
  evaluationEvidence?: string[];
  claimWinnerIsVerifiedProof?: boolean;
  claimWinnerIsProductionModel?: boolean;
  root: string;
  actor: DeActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  tournament?: TournamentRecord;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.tournaments.length >= MAX_TOURNAMENTS) {
    return { accepted: false, reason: 'MAX_TOURNAMENTS_BOUNDED', at: now };
  }

  const participants = store.targets.filter((t) =>
    input.participantIds.includes(t.id),
  );
  if (participants.some((p) => p.status === 'UNAVAILABLE' || !p.configured)) {
    const tournament: TournamentRecord = {
      id: id('cmt'),
      name: input.name.trim() || 'unnamed-tournament',
      participantIds: input.participantIds,
      winnerTargetId: null,
      consensusOnly: true,
      labeledVerifiedProof: false,
      productionModelPromoted: false,
      evaluationEvidence: input.evaluationEvidence ?? [],
      status: 'UNAVAILABLE',
      reason: UNCONFIGURED_MODEL_UNAVAILABLE,
      createdAt: now,
    };
    store.tournaments.push(tournament);
    await save(input.root, store);
    return { accepted: false, reason: tournament.reason, tournament, at: now };
  }

  if (
    input.claimWinnerIsVerifiedProof === true ||
    input.claimWinnerIsProductionModel === true
  ) {
    const tournament: TournamentRecord = {
      id: id('cmt'),
      name: input.name.trim() || 'unnamed-tournament',
      participantIds: input.participantIds,
      winnerTargetId: input.winnerTargetId ?? null,
      consensusOnly: true,
      labeledVerifiedProof: false,
      productionModelPromoted: false,
      evaluationEvidence: input.evaluationEvidence ?? [],
      status: 'DENIED',
      reason: TOURNAMENT_WINNER_NOT_PROOF,
      createdAt: now,
    };
    store.tournaments.push(tournament);
    await save(input.root, store);
    return { accepted: false, reason: tournament.reason, tournament, at: now };
  }

  const tournament: TournamentRecord = {
    id: id('cmt'),
    name: input.name.trim() || 'unnamed-tournament',
    participantIds: input.participantIds,
    winnerTargetId: input.winnerTargetId ?? participants[0]?.id ?? null,
    consensusOnly: true,
    labeledVerifiedProof: false,
    productionModelPromoted: false,
    evaluationEvidence: input.evaluationEvidence ?? ['scorecard'],
    status: 'RECORDED',
    reason: 'TOURNAMENT_RECORDED_WINNER_NOT_VERIFIED_PROOF',
    createdAt: now,
  };
  store.tournaments.push(tournament);
  await save(input.root, store);
  return { accepted: true, reason: tournament.reason, tournament, at: now };
}
