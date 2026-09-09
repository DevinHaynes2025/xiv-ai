/**
 * 62L-CX Agent-Built Research Tool Ecosystem —
 * Reuse-first; deny-by-default; registration ≠ authority;
 * tools cannot self-promote to production.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CX_LOCKS,
  HONESTY_BANNER,
  MAX_ECOSYSTEM_TOOLS,
  REGISTRATION_NO_AUTHORITY,
  TOOL_REUSE_PREFERRED,
  TOOL_SELF_PROMOTION_DENIED,
  type CxActor,
} from './persistent-knowledge-civilization-types';

export type EcosystemToolLifecycle =
  | 'registered'
  | 'sandbox'
  | 'approved'
  | 'unpromoted'
  | 'denied'
  | 'revoked';

export type EcosystemTool = {
  id: string;
  name: string;
  capabilityKey: string;
  lifecycle: EcosystemToolLifecycle;
  approved: boolean;
  authorityGranted: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type ToolEcosystemResult = {
  accepted: boolean;
  reason: string;
  tool?: EcosystemTool;
  reused?: boolean;
  at: string;
};

type Store = { tools: EcosystemTool[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-built-research-tool-ecosystem.json');
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

export function toolEcosystemHonesty() {
  return {
    banner: HONESTY_BANNER,
    reuseFirst: CX_LOCKS.TOOL_REUSE_FIRST,
    registrationGrantsAuthority: CX_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    selfPromotionToProduction: CX_LOCKS.TOOL_SELF_PROMOTION_TO_PRODUCTION,
  };
}

export async function registerApprovedEcosystemTool(input: {
  name: string;
  capabilityKey: string;
  root: string;
  actor: CxActor;
}): Promise<ToolEcosystemResult> {
  void input.actor;
  const store = await load(input.root);
  if (store.tools.length >= MAX_ECOSYSTEM_TOOLS) {
    return {
      accepted: false,
      reason: 'MAX_ECOSYSTEM_TOOLS_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const tool: EcosystemTool = {
    id: id('abre'),
    name: input.name.trim() || 'unnamed-tool',
    capabilityKey: input.capabilityKey.trim().toLowerCase(),
    lifecycle: 'approved',
    approved: true,
    authorityGranted: false,
    productionAuthorized: false,
    reason: REGISTRATION_NO_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.tools.push(tool);
  await save(input.root, store);
  return { accepted: true, reason: 'APPROVED_TOOL_REGISTERED_NO_AUTHORITY', tool, at: now };
}

export async function requestSandboxToolBuild(input: {
  name: string;
  capabilityKey: string;
  root: string;
  actor: CxActor;
}): Promise<ToolEcosystemResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const key = input.capabilityKey.trim().toLowerCase();
  const existing = store.tools.find(
    (t) => t.capabilityKey === key && t.approved && t.lifecycle === 'approved',
  );
  if (existing && CX_LOCKS.TOOL_REUSE_FIRST) {
    return {
      accepted: true,
      reason: TOOL_REUSE_PREFERRED,
      tool: existing,
      reused: true,
      at: now,
    };
  }
  if (store.tools.length >= MAX_ECOSYSTEM_TOOLS) {
    return {
      accepted: false,
      reason: 'MAX_ECOSYSTEM_TOOLS_BOUNDED',
      at: now,
    };
  }
  const tool: EcosystemTool = {
    id: id('abre'),
    name: input.name.trim() || 'sandbox-tool',
    capabilityKey: key,
    lifecycle: 'sandbox',
    approved: false,
    authorityGranted: false,
    productionAuthorized: false,
    reason: REGISTRATION_NO_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.tools.push(tool);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'SANDBOX_TOOL_BUILD_CREATED',
    tool,
    reused: false,
    at: now,
  };
}

export async function attemptToolSelfPromotion(input: {
  toolId: string;
  root: string;
  actor: CxActor;
}): Promise<ToolEcosystemResult> {
  void input.actor;
  const store = await load(input.root);
  const tool = store.tools.find((t) => t.id === input.toolId);
  const now = new Date().toISOString();
  if (!tool) {
    return { accepted: false, reason: 'TOOL_NOT_FOUND', at: now };
  }
  tool.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: TOOL_SELF_PROMOTION_DENIED,
    tool: { ...tool, productionAuthorized: false },
    at: now,
  };
}
