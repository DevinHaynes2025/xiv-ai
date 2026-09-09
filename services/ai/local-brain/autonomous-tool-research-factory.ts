/**
 * 62L-CV Autonomous Tool Research Factory —
 * Agent-built research tools with security/SBOM/benchmark gates.
 * Deny-by-default; registration ≠ authority; unpromoted without gates.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CV_LOCKS,
  HONESTY_BANNER,
  QUEUE_DEPLOY_DENIED,
  REGISTRATION_NO_AUTHORITY,
  SKILL_TOOL_NO_PERMISSION_ESCALATION,
  TOOL_UNPROMOTED_WITHOUT_GATES,
  type CvActor,
} from './distributed-intelligence-laboratory-os-types';

export type ToolLifecycle =
  | 'registered'
  | 'sandbox'
  | 'unpromoted'
  | 'promoted'
  | 'denied'
  | 'revoked';

export type ResearchTool = {
  id: string;
  name: string;
  sbomPresent: boolean;
  securityGatePassed: boolean;
  benchmarkPassed: boolean;
  lifecycle: ToolLifecycle;
  authorityGranted: false;
  permissionEscalation: false;
  productionDeployed: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type ToolResult = {
  accepted: boolean;
  reason: string;
  tool?: ResearchTool;
  permissionLevelAfter?: number;
  at: string;
};

type Store = { tools: ResearchTool[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-tool-research-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { tools: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function toolResearchFactoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresSbom: CV_LOCKS.TOOL_PROMOTION_REQUIRES_SBOM,
    requiresSecurity: CV_LOCKS.TOOL_PROMOTION_REQUIRES_SECURITY_GATE,
    requiresBenchmark: CV_LOCKS.TOOL_PROMOTION_REQUIRES_BENCHMARK,
    registrationGrantsAuthority: CV_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    queueProductionDeploy: CV_LOCKS.QUEUE_PRODUCTION_DEPLOY,
  };
}

export async function registerResearchTool(input: {
  name: string;
  sbomPresent?: boolean;
  securityGatePassed?: boolean;
  benchmarkPassed?: boolean;
  root: string;
  actor: CvActor;
}): Promise<ToolResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const tool: ResearchTool = {
    id: id('atrf'),
    name: input.name.trim() || 'unnamed-tool',
    sbomPresent: input.sbomPresent === true,
    securityGatePassed: input.securityGatePassed === true,
    benchmarkPassed: input.benchmarkPassed === true,
    lifecycle: 'registered',
    authorityGranted: false,
    permissionEscalation: false,
    productionDeployed: false,
    reason: REGISTRATION_NO_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.tools.push(tool);
  await save(input.root, store);
  return { accepted: true, reason: REGISTRATION_NO_AUTHORITY, tool, at: now };
}

export async function attemptPromoteResearchTool(input: {
  toolId: string;
  root: string;
  actor: CvActor;
}): Promise<ToolResult> {
  void input.actor;
  const store = await load(input.root);
  const tool = store.tools.find((t) => t.id === input.toolId);
  const now = new Date().toISOString();
  if (!tool) {
    return { accepted: false, reason: 'TOOL_NOT_FOUND', at: now };
  }

  const gatesOk =
    tool.sbomPresent && tool.securityGatePassed && tool.benchmarkPassed;
  if (!gatesOk) {
    tool.lifecycle = 'unpromoted';
    tool.reason = TOOL_UNPROMOTED_WITHOUT_GATES;
    tool.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: TOOL_UNPROMOTED_WITHOUT_GATES, tool, at: now };
  }

  tool.lifecycle = 'promoted';
  tool.reason = 'TOOL_PROMOTED_AFTER_SBOM_SECURITY_BENCHMARK';
  tool.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: tool.reason, tool, at: now };
}

export async function grantToolSkillWithoutEscalation(input: {
  toolId: string;
  root: string;
  actor: CvActor;
}): Promise<ToolResult> {
  const store = await load(input.root);
  const tool = store.tools.find((t) => t.id === input.toolId);
  const now = new Date().toISOString();
  if (!tool) {
    return { accepted: false, reason: 'TOOL_NOT_FOUND', at: now };
  }
  return {
    accepted: true,
    reason: SKILL_TOOL_NO_PERMISSION_ESCALATION,
    tool,
    permissionLevelAfter: input.actor.permissionLevel,
    at: now,
  };
}

export async function queueProductionDeploy(input: {
  toolId: string;
  root: string;
  actor: CvActor;
}): Promise<ToolResult> {
  void input.actor;
  const store = await load(input.root);
  const tool = store.tools.find((t) => t.id === input.toolId);
  const now = new Date().toISOString();
  if (!tool) {
    return { accepted: false, reason: 'TOOL_NOT_FOUND', at: now };
  }
  return {
    accepted: false,
    reason: QUEUE_DEPLOY_DENIED,
    tool,
    at: now,
  };
}
