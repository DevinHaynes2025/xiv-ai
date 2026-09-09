/**
 * 62L-DQ Security Trust Scoring Engine —
 * Explainable plugin trust scores. Score ≠ automatic broad authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DQ_LOCKS,
  MAX_TRUST_SCORES,
  TRUST_SCORE_NO_BROADER_SCOPES,
  type DqActor,
  type PermissionScope,
  type TrustScoreBreakdown,
} from './universal-integration-brain-types';

export type TrustScoreRecord = {
  id: string;
  pluginId: string;
  score: number;
  breakdown: TrustScoreBreakdown;
  grantsBroaderScopes: false;
  reason: string;
  at: string;
};

export type TrustScopeProbe = {
  id: string;
  pluginId: string;
  score: number;
  requestedScopes: PermissionScope[];
  grantedScopes: PermissionScope[];
  status: 'denied' | 'unchanged';
  reason: string;
  at: string;
};

type Store = {
  scores: TrustScoreRecord[];
  probes: TrustScopeProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'security-trust-scoring-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { scores: [], probes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function securityTrustScoringEngineHonesty() {
  return {
    trustScoreGrantsBroaderScopes: DQ_LOCKS.TRUST_SCORE_GRANTS_BROADER_SCOPES,
    trustScoreExplainable: DQ_LOCKS.TRUST_SCORE_EXPLAINABLE,
  };
}

export async function computeTrustScore(input: {
  pluginId: string;
  verification: number;
  health: number;
  marketplaceReputation: number;
  incidentHistory: number;
  ageDays: number;
  root: string;
  actor: DqActor;
}): Promise<TrustScoreRecord> {
  const store = await load(input.root);
  void input.actor;
  if (store.scores.length >= MAX_TRUST_SCORES) {
    throw new Error('MAX_TRUST_SCORES');
  }
  const v = Math.max(0, Math.min(100, input.verification));
  const h = Math.max(0, Math.min(100, input.health));
  const m = Math.max(0, Math.min(100, input.marketplaceReputation));
  const incidents = Math.max(0, input.incidentHistory);
  const age = Math.max(0, input.ageDays);
  const incidentPenalty = Math.min(40, incidents * 10);
  const ageBonus = Math.min(10, Math.floor(age / 30));
  const score = Math.max(
    0,
    Math.min(100, Math.round(v * 0.35 + h * 0.25 + m * 0.25 + ageBonus - incidentPenalty)),
  );
  const breakdown: TrustScoreBreakdown = {
    verification: v,
    health: h,
    marketplaceReputation: m,
    incidentHistory: incidents,
    ageDays: age,
    explainers: [
      `verification_weighted=${(v * 0.35).toFixed(1)}`,
      `health_weighted=${(h * 0.25).toFixed(1)}`,
      `marketplace_weighted=${(m * 0.25).toFixed(1)}`,
      `age_bonus=${ageBonus}`,
      `incident_penalty=${incidentPenalty}`,
      'score_does_not_grant_broader_scopes',
    ],
  };
  const record: TrustScoreRecord = {
    id: id('dqtrust'),
    pluginId: input.pluginId,
    score,
    breakdown,
    grantsBroaderScopes: false,
    reason: 'TRUST_SCORE_EXPLAINABLE_NOT_AUTHORITY',
    at: new Date().toISOString(),
  };
  store.scores.push(record);
  await save(input.root, store);
  return record;
}

export async function probeTrustScoreScopeGrant(input: {
  pluginId: string;
  score: number;
  requestedScopes: PermissionScope[];
  grantedScopes: PermissionScope[];
  root: string;
  actor: DqActor;
}): Promise<TrustScopeProbe> {
  const store = await load(input.root);
  void input.actor;
  const broader = input.requestedScopes.some((s) => !input.grantedScopes.includes(s));
  const probe: TrustScopeProbe = {
    id: id('dqtscope'),
    pluginId: input.pluginId,
    score: input.score,
    requestedScopes: input.requestedScopes,
    grantedScopes: input.grantedScopes,
    status: broader ? 'denied' : 'unchanged',
    reason: broader
      ? TRUST_SCORE_NO_BROADER_SCOPES
      : 'TRUST_SCORE_NO_SCOPE_CHANGE',
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}
