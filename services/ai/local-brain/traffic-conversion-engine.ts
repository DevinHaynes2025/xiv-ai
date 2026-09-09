/**
 * 62L-EK Module H — Traffic Conversion Engine + soft-wire EI/EG + honesty non-claims.
 * Recommend ≠ auto-charge; conversion ≠ dark patterns / deception.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONVERSION_NEQ_CHARGE,
  EK_LOCKS,
  EXPLICIT_NON_CLAIMS,
  MAX_CONVERSION_EVENTS,
  type EkActor,
  type EkEvidenceState,
} from './windows-amd-local-cognitive-os-types';

export const CONVERSION_FLYWHEEL = Object.freeze([
  'public_xiv_search',
  'useful_answer',
  'account',
  'personal_universe',
  'connect_authorized_data',
  'personal_agent',
  'entrepreneur_business_workspace',
  'organization_universe',
  'plugins_integrations',
  'paid_ai_workforce_storage_intelligence',
] as const);

export type ConversionStep = {
  id: string;
  stepId: string;
  stage: (typeof CONVERSION_FLYWHEEL)[number];
  recommendOnly: true;
  autoCharge: false;
  darkPattern: false;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

export type ConversionChargeProbe = {
  id: string;
  attemptAutoCharge: boolean;
  status: 'denied';
  state: EkEvidenceState;
  reason: string;
  autoCharge: false;
  at: string;
};

type Store = {
  steps: ConversionStep[];
  charges: ConversionChargeProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'traffic-conversion-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { steps: [], charges: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function trafficConversionEngineHonesty() {
  return {
    flywheel: CONVERSION_FLYWHEEL,
    recommendNeqAutoCharge: true,
    conversionNeqDarkPatterns: true,
    explicitNonClaims: EXPLICIT_NON_CLAIMS,
    integrationBrandsCandidatesUntilEvidence: true,
    dbCandidatesNotApplied: true,
    l4AutonomyEnabled: EK_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function registerConversionStep(input: {
  stepId: string;
  stage: (typeof CONVERSION_FLYWHEEL)[number];
  attemptAutoCharge?: boolean;
  darkPattern?: boolean;
  root: string;
  actor: EkActor;
}): Promise<ConversionStep> {
  void input.actor;
  const store = await load(input.root);
  if (store.steps.length >= MAX_CONVERSION_EVENTS) {
    throw new Error('MAX_CONVERSION_EVENTS');
  }

  if (input.attemptAutoCharge || input.darkPattern) {
    const denied: ConversionStep = {
      id: id('ekconv'),
      stepId: input.stepId.trim(),
      stage: input.stage,
      recommendOnly: true,
      autoCharge: false,
      darkPattern: false,
      status: 'denied',
      state: 'DENIED',
      reason: input.attemptAutoCharge
        ? CONVERSION_NEQ_CHARGE
        : 'CONVERSION_DARK_PATTERNS_DENIED',
      at: new Date().toISOString(),
    };
    store.steps.push(denied);
    await save(input.root, store);
    return denied;
  }

  const rec: ConversionStep = {
    id: id('ekconv'),
    stepId: input.stepId.trim(),
    stage: input.stage,
    recommendOnly: true,
    autoCharge: false,
    darkPattern: false,
    status: 'ok',
    state: 'RECOMMENDATION_ONLY',
    reason: 'CONVERSION_STEP_RECOMMEND_ONLY',
    at: new Date().toISOString(),
  };
  store.steps.push(rec);
  await save(input.root, store);
  return rec;
}

export async function denyConversionAutoCharge(input: {
  attemptAutoCharge: boolean;
  root: string;
  actor: EkActor;
}): Promise<ConversionChargeProbe> {
  void input.actor;
  const store = await load(input.root);
  const denied: ConversionChargeProbe = {
    id: id('ekchg'),
    attemptAutoCharge: input.attemptAutoCharge,
    status: 'denied',
    state: 'DENIED',
    reason: CONVERSION_NEQ_CHARGE,
    autoCharge: false,
    at: new Date().toISOString(),
  };
  store.charges.push(denied);
  await save(input.root, store);
  return denied;
}

export function explicitNonClaimsSnapshot() {
  return { ...EXPLICIT_NON_CLAIMS };
}
