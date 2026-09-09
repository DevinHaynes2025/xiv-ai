import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ResourceBudget = {
  maxAgents: number;
  maxModelCalls: number;
  maxMs: number;
  maxLocalBytes: number;
};

export type ResourceLedger = {
  id: string;
  tenantId: string;
  universeId: string;
  budget: ResourceBudget;
  used: {
    agents: number;
    modelCalls: number;
    ms: number;
    localBytes: number;
  };
  debriefLock: boolean;
  recruitmentHalted: boolean;
  productionAuthorization: false;
  autoPurchase: false;
  createdAt: string;
};

const DEFAULT_BUDGET: ResourceBudget = {
  maxAgents: 8,
  maxModelCalls: 24,
  maxMs: 120_000,
  maxLocalBytes: 8_000_000,
};

type Store = { ledgers: ResourceLedger[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'resource-governance.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { ledgers: [] });
  return Array.isArray(parsed.ledgers) ? parsed.ledgers : [];
}

async function save(root: string, ledgers: ResourceLedger[]) {
  await writeJsonFileAtomic(pathFor(root), { ledgers: ledgers.slice(-2_000) });
}

function clampBudget(budget?: Partial<ResourceBudget>): ResourceBudget {
  return {
    maxAgents: Math.max(1, Math.min(budget?.maxAgents ?? DEFAULT_BUDGET.maxAgents, 32)),
    maxModelCalls: Math.max(1, Math.min(budget?.maxModelCalls ?? DEFAULT_BUDGET.maxModelCalls, 256)),
    maxMs: Math.max(1_000, Math.min(budget?.maxMs ?? DEFAULT_BUDGET.maxMs, 600_000)),
    maxLocalBytes: Math.max(4_096, Math.min(budget?.maxLocalBytes ?? DEFAULT_BUDGET.maxLocalBytes, 64_000_000)),
  };
}

export async function openResourceLedger(input: {
  tenantId: string;
  universeId: string;
  budget?: Partial<ResourceBudget>;
  root?: string;
}): Promise<ResourceLedger> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const ledger: ResourceLedger = {
    id: cortexId('res'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    budget: clampBudget(input.budget),
    used: { agents: 0, modelCalls: 0, ms: 0, localBytes: 0 },
    debriefLock: false,
    recruitmentHalted: false,
    productionAuthorization: false,
    autoPurchase: false,
    createdAt: new Date().toISOString(),
  };
  const root = input.root ?? process.cwd();
  const ledgers = await load(root);
  ledgers.push(ledger);
  await save(root, ledgers);
  return ledger;
}

export async function chargeResource(input: {
  id: string;
  tenantId: string;
  universeId: string;
  agents?: number;
  modelCalls?: number;
  ms?: number;
  localBytes?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const ledgers = await load(root);
  const ledger = ledgers.find((item) => item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!ledger) throw new Error('RESOURCE_LEDGER_NOT_FOUND');
  const nextUsed = {
    agents: ledger.used.agents + Math.max(0, input.agents ?? 0),
    modelCalls: ledger.used.modelCalls + Math.max(0, input.modelCalls ?? 0),
    ms: ledger.used.ms + Math.max(0, input.ms ?? 0),
    localBytes: ledger.used.localBytes + Math.max(0, input.localBytes ?? 0),
  };
  const exhausted =
    nextUsed.agents > ledger.budget.maxAgents ||
    nextUsed.modelCalls > ledger.budget.maxModelCalls ||
    nextUsed.ms > ledger.budget.maxMs ||
    nextUsed.localBytes > ledger.budget.maxLocalBytes;
  if (exhausted) {
    return {
      allowed: false as const,
      reason: 'RESOURCE_BUDGET_EXHAUSTED',
      ledger,
      productionAuthorization: false as const,
    };
  }
  ledger.used = nextUsed;
  await save(root, ledgers);
  return { allowed: true as const, ledger, productionAuthorization: false as const };
}

export async function setDebriefLock(input: {
  id: string;
  tenantId: string;
  universeId: string;
  locked: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const ledgers = await load(root);
  const ledger = ledgers.find((item) => item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!ledger) throw new Error('RESOURCE_LEDGER_NOT_FOUND');
  ledger.debriefLock = input.locked;
  ledger.recruitmentHalted = input.locked;
  await save(root, ledgers);
  return ledger;
}

export function recruitmentAllowed(ledger: ResourceLedger) {
  return !ledger.debriefLock && !ledger.recruitmentHalted && ledger.used.agents < ledger.budget.maxAgents;
}
