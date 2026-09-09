/**
 * 62L-DE Autonomous AI Company Incubator —
 * Sandbox AI company incubation only.
 * Self-promote to production DENIED.
 * Consequential changes require human approval gate.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HONESTY_BANNER,
  INCUBATOR_HUMAN_APPROVAL_REQUIRED,
  INCUBATOR_SELF_PROMOTION_DENIED,
  MAX_INCUBATOR_COMPANIES,
  type DeActor,
} from './knowledge-exchange-gateway-marketplace-types';

export type IncubatorCompany = {
  id: string;
  name: string;
  lifecycle: 'sandbox' | 'gated' | 'candidate' | 'unpromoted' | 'denied';
  sandboxOnly: true;
  productionAuthorized: false;
  authorityGranted: false;
  humanApprovalGranted: boolean;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type IncubatorResult = {
  accepted: boolean;
  reason: string;
  company?: IncubatorCompany;
  at: string;
};

type Store = { companies: IncubatorCompany[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-ai-company-incubator.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { companies: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function aiCompanyIncubatorHonesty() {
  return {
    banner: HONESTY_BANNER,
    selfPromotionToProduction: DE_LOCKS.INCUBATOR_SELF_PROMOTION_TO_PRODUCTION,
    consequentialWithoutHumanApproval:
      DE_LOCKS.INCUBATOR_CONSEQUENTIAL_WITHOUT_HUMAN_APPROVAL,
    sandboxOnly: true as const,
  };
}

export async function registerIncubatorCompany(input: {
  name: string;
  root: string;
  actor: DeActor;
}): Promise<IncubatorResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.companies.length >= MAX_INCUBATOR_COMPANIES) {
    return { accepted: false, reason: 'MAX_INCUBATOR_COMPANIES_BOUNDED', at: now };
  }
  const company: IncubatorCompany = {
    id: id('aici'),
    name: input.name.trim() || 'unnamed-incubator-company',
    lifecycle: 'sandbox',
    sandboxOnly: true,
    productionAuthorized: false,
    authorityGranted: false,
    humanApprovalGranted: false,
    reason: 'AI_COMPANY_REGISTERED_IN_SANDBOX_ONLY',
    createdAt: now,
    updatedAt: now,
  };
  store.companies.push(company);
  await save(input.root, store);
  return { accepted: true, reason: company.reason, company, at: now };
}

export async function requestIncubatorConsequentialChange(input: {
  companyId: string;
  changeSummary: string;
  humanApproved?: boolean;
  humanOperator?: boolean;
  root: string;
  actor: DeActor;
}): Promise<IncubatorResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const company = store.companies.find((c) => c.id === input.companyId);
  if (!company) {
    return { accepted: false, reason: 'INCUBATOR_COMPANY_NOT_FOUND', at: now };
  }

  const humanOk =
    input.humanApproved === true &&
    (input.humanOperator === true ||
      input.actor.kind === 'human_operator' ||
      input.actor.kind === 'ceo_principal');

  if (!humanOk) {
    company.lifecycle = 'gated';
    company.humanApprovalGranted = false;
    company.reason = INCUBATOR_HUMAN_APPROVAL_REQUIRED;
    company.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: INCUBATOR_HUMAN_APPROVAL_REQUIRED,
      company,
      at: now,
    };
  }

  void input.changeSummary;
  company.humanApprovalGranted = true;
  company.lifecycle = 'candidate';
  company.productionAuthorized = false;
  company.authorityGranted = false;
  company.reason = 'CONSEQUENTIAL_CHANGE_HUMAN_APPROVED_CANDIDATE_NOT_PRODUCTION';
  company.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: company.reason, company, at: now };
}

export async function attemptIncubatorSelfPromotion(input: {
  companyId: string;
  root: string;
  actor: DeActor;
}): Promise<IncubatorResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const company = store.companies.find((c) => c.id === input.companyId);
  if (!company) {
    return { accepted: false, reason: 'INCUBATOR_COMPANY_NOT_FOUND', at: now };
  }
  company.lifecycle = 'unpromoted';
  company.productionAuthorized = false;
  company.authorityGranted = false;
  company.reason = INCUBATOR_SELF_PROMOTION_DENIED;
  company.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: INCUBATOR_SELF_PROMOTION_DENIED,
    company,
    at: now,
  };
}
