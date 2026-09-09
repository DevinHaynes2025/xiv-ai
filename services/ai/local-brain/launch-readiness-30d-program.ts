/**
 * 62L-DR 30-Day Launch Readiness Program —
 * Checklist/harness for private beta/pilot / investor-ready MVP readiness evidence.
 * Cannot mark full OS PRODUCTION AUTHORIZED in 30 days.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DR_LOCKS,
  HONESTY_BANNER,
  LAUNCH_NO_FULL_PROD_AUTH,
  LAUNCH_TARGET_LABEL,
  type DrActor,
} from './enterprise-nervous-revenue-command-types';

export type LaunchChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  evidenceRef?: string;
};

export type LaunchReadinessProgram = {
  id: string;
  orgId: string;
  tenantId: string;
  dayHorizon: 30;
  targetLabel: typeof LAUNCH_TARGET_LABEL;
  items: LaunchChecklistItem[];
  mvpReadyClaim: boolean;
  fullOsProductionAuthorized: false;
  productionAuthorized: false;
  createdAt: string;
};

export type LaunchAuthAttempt = {
  id: string;
  programId: string;
  claimedFullOsProductionAuthorized: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  programs: LaunchReadinessProgram[];
  authAttempts: LaunchAuthAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'launch-readiness-30d-program.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { programs: [], authAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ITEMS: Array<{ id: string; label: string }> = [
  { id: 'design_partners', label: 'Design partners identified' },
  { id: 'wedge_metric', label: 'Narrow measurable wedge defined' },
  { id: 'pe_cfo_process', label: 'PE-ready CFO/finance process stubs' },
  { id: 'tech_leadership', label: 'Technical leadership operating cadence' },
  { id: 'sales_leadership', label: 'Sales leadership operating cadence' },
  { id: 'integrate_existing', label: 'Integrate existing systems (no rip-replace)' },
  { id: 'agent_boundaries', label: 'Specialized agents with boundaries documented' },
  { id: 'pilot_scope', label: 'Private beta / pilot scope sealed' },
  { id: 'investor_mvp', label: 'Investor-ready MVP evidence pack' },
  { id: 'honesty_locks', label: 'Honesty locks + founder gates verified in tests' },
];

export function launchReadiness30dHonesty() {
  return {
    banner: HONESTY_BANNER,
    thirtyDayEqFullGa: DR_LOCKS.THIRTY_DAY_EQ_FULL_GA,
    fullOsProductionAuthorizedIn30Days: DR_LOCKS.FULL_OS_PRODUCTION_AUTHORIZED_IN_30_DAYS,
    targetLabel: LAUNCH_TARGET_LABEL,
  };
}

export async function bootstrapLaunchReadinessProgram(input: {
  root: string;
  actor: DrActor;
}): Promise<LaunchReadinessProgram> {
  const store = await load(input.root);
  const program: LaunchReadinessProgram = {
    id: id('l30'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    dayHorizon: 30,
    targetLabel: LAUNCH_TARGET_LABEL,
    items: DEFAULT_ITEMS.map((i) => ({ ...i, done: false })),
    mvpReadyClaim: false,
    fullOsProductionAuthorized: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.programs.push(program);
  await save(input.root, store);
  return program;
}

export async function markLaunchChecklistItem(input: {
  programId: string;
  itemId: string;
  done: boolean;
  evidenceRef?: string;
  root: string;
  actor: DrActor;
}): Promise<LaunchReadinessProgram | null> {
  const store = await load(input.root);
  void input.actor;
  const program = store.programs.find((p) => p.id === input.programId);
  if (!program) return null;
  const item = program.items.find((i) => i.id === input.itemId);
  if (!item) return null;
  item.done = input.done;
  if (input.evidenceRef) item.evidenceRef = input.evidenceRef;
  program.mvpReadyClaim = program.items.every((i) => i.done);
  program.fullOsProductionAuthorized = false;
  program.productionAuthorized = false;
  await save(input.root, store);
  return program;
}

export async function attemptMarkFullOsProductionAuthorized(input: {
  programId: string;
  root: string;
  actor: DrActor;
}): Promise<LaunchAuthAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: LaunchAuthAttempt = {
    id: id('lauth'),
    programId: input.programId,
    claimedFullOsProductionAuthorized: true,
    status: 'denied',
    reason: LAUNCH_NO_FULL_PROD_AUTH,
    at: new Date().toISOString(),
  };
  store.authAttempts.push(attempt);
  const program = store.programs.find((p) => p.id === input.programId);
  if (program) {
    program.fullOsProductionAuthorized = false;
    program.productionAuthorized = false;
  }
  await save(input.root, store);
  return attempt;
}
