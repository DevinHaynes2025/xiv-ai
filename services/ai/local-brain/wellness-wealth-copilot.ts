/**
 * 62L-DU Module F — Wellness/Wealth Copilot.
 * Entrepreneurship / music / media / product workflows + wellness/wealth.
 * Recommend ≠ medical diagnose / financial trade / transfer authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_COPILOT_RECS,
  WEALTH_NEQ_TRADE_TRANSFER,
  WELLNESS_NEQ_DIAGNOSE,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type CopilotDomain =
  | 'wellness'
  | 'wealth'
  | 'entrepreneurship'
  | 'music'
  | 'media'
  | 'product';

export type CopilotRecommendation = {
  id: string;
  domain: CopilotDomain;
  summary: string;
  diagnoses: false;
  trades: false;
  transfers: false;
  status: 'recommendation_only' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  recommendations: CopilotRecommendation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'wellness-wealth-copilot.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { recommendations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function wellnessWealthCopilotHonesty() {
  return {
    medicalAdviceAuthority: false,
    financialAdviceAuthority: false,
    recommendEqDiagnose: false,
    recommendEqTrade: false,
    recommendEqTransfer: false,
    l4AutonomyEnabled: false,
  };
}

export async function recommendWellness(input: {
  summary: string;
  attemptDiagnose?: boolean;
  root: string;
  actor: DuActor;
}): Promise<CopilotRecommendation> {
  const store = await load(input.root);
  void input.actor;
  if (store.recommendations.length >= MAX_COPILOT_RECS) {
    throw new Error('MAX_COPILOT_RECS_REACHED');
  }
  const attempting = input.attemptDiagnose === true;
  const rec: CopilotRecommendation = {
    id: id('duwell'),
    domain: 'wellness',
    summary: input.summary.trim(),
    diagnoses: false,
    trades: false,
    transfers: false,
    status: attempting ? 'denied' : 'recommendation_only',
    reason: WELLNESS_NEQ_DIAGNOSE,
    createdAt: new Date().toISOString(),
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function recommendWealth(input: {
  summary: string;
  attemptTrade?: boolean;
  attemptTransfer?: boolean;
  root: string;
  actor: DuActor;
}): Promise<CopilotRecommendation> {
  const store = await load(input.root);
  void input.actor;
  if (store.recommendations.length >= MAX_COPILOT_RECS) {
    throw new Error('MAX_COPILOT_RECS_REACHED');
  }
  const attempting =
    input.attemptTrade === true || input.attemptTransfer === true;
  const rec: CopilotRecommendation = {
    id: id('duwealth'),
    domain: 'wealth',
    summary: input.summary.trim(),
    diagnoses: false,
    trades: false,
    transfers: false,
    status: attempting ? 'denied' : 'recommendation_only',
    reason: WEALTH_NEQ_TRADE_TRANSFER,
    createdAt: new Date().toISOString(),
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function recommendWorkflow(input: {
  domain: Exclude<CopilotDomain, 'wellness' | 'wealth'>;
  summary: string;
  root: string;
  actor: DuActor;
}): Promise<CopilotRecommendation> {
  const store = await load(input.root);
  void input.actor;
  const rec: CopilotRecommendation = {
    id: id('duflow'),
    domain: input.domain,
    summary: input.summary.trim(),
    diagnoses: false,
    trades: false,
    transfers: false,
    status: 'recommendation_only',
    reason: 'WORKFLOW_RECOMMENDATION_ONLY_NOT_AUTHORITY',
    createdAt: new Date().toISOString(),
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return rec;
}
