/**
 * 62L-EE Module E — Universal Industry Digital Twin Factory.
 * Industry digital-twin templates; sim/advisory; ≠ physical control.
 * Sim ≠ verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_TWIN_TEMPLATES,
  SIM_NEQ_FACT,
  TWIN_NEQ_PHYSICAL,
  TWIN_SIM_ADVISORY,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type IndustryTwinTemplate = {
  id: string;
  industry: string;
  claimVerifiedFact: boolean;
  claimPhysicalControl: boolean;
  status: 'sim_advisory' | 'denied';
  state: EeEvidenceState;
  reason: string;
  physicalControlEnabled: false;
  at: string;
};

export type TwinSimRun = {
  id: string;
  templateId: string;
  claimVerifiedFact: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  templates: IndustryTwinTemplate[];
  sims: TwinSimRun[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-industry-digital-twin-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    templates: [],
    sims: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalIndustryDigitalTwinFactoryHonesty() {
  return {
    industryTwinTemplateSimAdvisory: true,
    simNeqVerifiedFact: true,
    twinNeqPhysicalControl: true,
    physicalControlEnabled: false,
  };
}

export async function registerIndustryTwinTemplate(input: {
  industry: string;
  claimVerifiedFact?: boolean;
  claimPhysicalControl?: boolean;
  root: string;
  actor: EeActor;
}): Promise<IndustryTwinTemplate> {
  const store = await load(input.root);
  void input.actor;
  if (store.templates.length >= MAX_TWIN_TEMPLATES) {
    throw new Error('MAX_TWIN_TEMPLATES_REACHED');
  }
  const fact = Boolean(input.claimVerifiedFact);
  const physical = Boolean(input.claimPhysicalControl);
  let status: IndustryTwinTemplate['status'] = 'sim_advisory';
  let state: EeEvidenceState = 'LABELED_SIMULATION';
  let reason = TWIN_SIM_ADVISORY;
  if (physical) {
    status = 'denied';
    state = 'DENIED';
    reason = TWIN_NEQ_PHYSICAL;
  } else if (fact) {
    status = 'denied';
    state = 'DENIED';
    reason = SIM_NEQ_FACT;
  }
  const tmpl: IndustryTwinTemplate = {
    id: id('eetwin'),
    industry: input.industry.trim(),
    claimVerifiedFact: fact,
    claimPhysicalControl: physical,
    status,
    state,
    reason,
    physicalControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.templates.push(tmpl);
  await save(input.root, store);
  return tmpl;
}

export async function runTwinSimulation(input: {
  templateId: string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: EeActor;
}): Promise<TwinSimRun> {
  const store = await load(input.root);
  void input.actor;
  if (store.sims.length >= MAX_TWIN_TEMPLATES) {
    throw new Error('MAX_TWIN_TEMPLATES_REACHED');
  }
  const fact = Boolean(input.claimVerifiedFact);
  const sim: TwinSimRun = {
    id: id('eesim'),
    templateId: input.templateId.trim(),
    claimVerifiedFact: fact,
    status: fact ? 'denied' : 'ok',
    state: fact ? 'DENIED' : 'LABELED_SIMULATION',
    reason: fact ? SIM_NEQ_FACT : TWIN_SIM_ADVISORY,
    at: new Date().toISOString(),
  };
  store.sims.push(sim);
  await save(input.root, store);
  return sim;
}
