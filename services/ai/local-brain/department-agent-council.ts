import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BL_LOCKS,
  CROSS_ORG_ACCESS_DENIED,
  type BlActor,
  type DepartmentId,
} from './org-agent-universe-types';
import { getOrgUniverse } from './org-agent-universe';

export const DEPT_COUNCIL_FILE = 'department-agent-councils.json';

export type CouncilRecommendation = {
  id: string;
  text: string;
  /** Recommendation never charges or deploys. */
  chargeOrDeploy: false;
  learningElevatesAuthority: false;
};

export type DepartmentAgentCouncil = {
  id: string;
  orgId: string;
  universeId: string;
  departmentId: DepartmentId;
  topic: string;
  agents: Array<{ id: string; role: string }>;
  recommendations: CouncilRecommendation[];
  consensusForced: false;
  productionAuthorized: false;
  createdAt: string;
};

type CouncilStore = { councils: DepartmentAgentCouncil[] };

const MAX_COUNCILS = 2_000;

function storePath(root: string) {
  return xivLocalPath(root, DEPT_COUNCIL_FILE);
}

async function load(root: string): Promise<CouncilStore> {
  const parsed = await readJsonFile<CouncilStore>(storePath(root), { councils: [] });
  return { councils: Array.isArray(parsed.councils) ? parsed.councils : [] };
}

async function save(root: string, store: CouncilStore) {
  await writeJsonFileAtomic(storePath(root), { councils: store.councils.slice(-MAX_COUNCILS) });
}

const DEFAULT_ROLES: Record<DepartmentId, string[]> = {
  engineering: ['architect', 'reviewer', 'security_advocate'],
  operations: ['ops_lead', 'sre', 'incident_analyst'],
  finance: ['controller', 'analyst', 'risk'],
  security: ['trust_officer', 'auditor', 'red_team_defensive_only'],
  research: ['researcher', 'skeptic', 'evidence_verifier'],
  customer: ['advocate', 'support_lead', 'privacy_steward'],
  executive: ['strategy', 'governance', 'ethics'],
};

/**
 * Convene a department-specific agent council inside an Organization Universe.
 * Councils recommend only — recommendation ≠ charge/deploy; learning ≠ authority.
 */
export async function conveneDepartmentCouncil(input: {
  orgId: string;
  departmentId: DepartmentId;
  topic: string;
  actor: BlActor;
  root?: string;
  now?: number;
}) {
  if (!input.orgId || !input.departmentId || !input.topic.trim()) {
    return { accepted: false as const, reason: 'ORG_DEPARTMENT_TOPIC_REQUIRED' };
  }
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: CROSS_ORG_ACCESS_DENIED };
  }

  const root = input.root ?? process.cwd();
  const universe = await getOrgUniverse(input.orgId, root);
  if (!universe) return { accepted: false as const, reason: 'ORG_UNIVERSE_NOT_FOUND' };
  if (!universe.departments.includes(input.departmentId)) {
    return { accepted: false as const, reason: 'DEPARTMENT_NOT_IN_UNIVERSE' };
  }

  const roles = DEFAULT_ROLES[input.departmentId];
  const agents = roles.map((role, index) => ({
    id: `${input.departmentId}-agent-${index + 1}`,
    role,
  }));

  const recommendations: CouncilRecommendation[] = agents.map((agent) => ({
    id: `rec_${randomUUID()}`,
    text: `${agent.role}: recommend local evaluation of "${input.topic.slice(0, 200)}" — recommendation ≠ charge/deploy; learning ≠ authority.`,
    chargeOrDeploy: false,
    learningElevatesAuthority: false,
  }));

  const council: DepartmentAgentCouncil = {
    id: `council_${randomUUID()}`,
    orgId: input.orgId,
    universeId: universe.id,
    departmentId: input.departmentId,
    topic: input.topic.slice(0, 2_000),
    agents,
    recommendations,
    consensusForced: false,
    productionAuthorized: false,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
  };

  const store = await load(root);
  store.councils.push(council);
  await save(root, store);

  return {
    accepted: true as const,
    council,
    reason: 'Department Agent Council convened; recommendation ≠ charge/deploy.',
    locks: {
      RECOMMENDATION_IS_CHARGE_OR_DEPLOY: BL_LOCKS.RECOMMENDATION_IS_CHARGE_OR_DEPLOY,
      LEARNING_IS_AUTHORITY: BL_LOCKS.LEARNING_IS_AUTHORITY,
    },
  };
}

/**
 * Attempt to execute a charge/deploy from a council recommendation — always denied.
 */
export async function attemptCouncilChargeOrDeploy(input: {
  councilId: string;
  actor: BlActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const council = store.councils.find((item) => item.id === input.councilId);
  if (!council) return { allowed: false as const, reason: 'COUNCIL_NOT_FOUND', chargeOrDeploy: false as const };
  if (input.actor.orgId !== council.orgId) {
    return { allowed: false as const, reason: CROSS_ORG_ACCESS_DENIED, chargeOrDeploy: false as const };
  }
  return {
    allowed: false as const,
    reason: 'RECOMMENDATION_IS_NOT_CHARGE_OR_DEPLOY',
    chargeOrDeploy: false as const,
    productionAuthorized: false as const,
    locks: { RECOMMENDATION_IS_CHARGE_OR_DEPLOY: BL_LOCKS.RECOMMENDATION_IS_CHARGE_OR_DEPLOY },
  };
}

export async function listDepartmentCouncils(orgId: string, root = process.cwd()) {
  return (await load(root)).councils.filter((item) => item.orgId === orgId);
}

export function departmentCouncilHonesty() {
  return {
    recommendationIsChargeOrDeploy: false as const,
    learningIsAuthority: false as const,
    consensusForced: false as const,
    productionAuthorization: false as const,
    locks: BL_LOCKS,
  };
}
