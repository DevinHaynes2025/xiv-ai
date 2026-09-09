/**
 * 62L-CP Plugin/Tool Foundry — identify capability gaps; reuse approved
 * plugins first; sandbox new builds; promotion gates before assign.
 * Registration ≠ authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_SELF_ASSIGN_DENIED,
  CP_LOCKS,
  HONESTY_BANNER,
  PROMOTION_GATES_INCOMPLETE,
  REUSE_PREFERRED,
  SANDBOX_UNTIL_PROMOTION,
  type CpActor,
  type PluginLifecycleState,
} from './knowledge-supply-plugin-foundry-types';

export type FoundryPlugin = {
  id: string;
  name: string;
  capabilityTag: string;
  lifecycle: PluginLifecycleState;
  sandbox: boolean;
  promoted: boolean;
  approved: boolean;
  unitTestsPass: boolean;
  integrationTestsPass: boolean;
  securityTestsPass: boolean;
  benchmarksPass: boolean;
  humanReviewPass: boolean;
  elevatedPermissions: boolean;
  reason: string;
  createdAt: string;
};

export type CapabilityGap = {
  id: string;
  capabilityTag: string;
  reuseCandidateId: string | null;
  action: 'reuse' | 'sandbox_build';
  reason: string;
  at: string;
};

export type PromotionAttempt = {
  id: string;
  pluginId: string;
  status: 'promoted' | 'denied' | 'sandboxed';
  reason: string;
  at: string;
};

export type AssignmentAttempt = {
  id: string;
  pluginId: string;
  agentId: string;
  elevated: boolean;
  selfAssign: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  plugins: FoundryPlugin[];
  gaps: CapabilityGap[];
  promotions: PromotionAttempt[];
  assignments: AssignmentAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-tool-foundry.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plugins: [],
    gaps: [],
    promotions: [],
    assignments: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pluginFoundryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CP_LOCKS.L4_AUTONOMY_ENABLED,
    reuseApprovedFirst: CP_LOCKS.REUSE_APPROVED_PLUGINS_FIRST,
    newBuildsSandboxOnly: CP_LOCKS.NEW_BUILDS_SANDBOX_ONLY,
    agentSelfAssignUnpromoted: CP_LOCKS.AGENT_SELF_ASSIGN_UNPROMOTED,
    promotionRequiresUnit: CP_LOCKS.PROMOTION_REQUIRES_UNIT_TESTS,
    promotionRequiresIntegration: CP_LOCKS.PROMOTION_REQUIRES_INTEGRATION_TESTS,
    promotionRequiresSecurity: CP_LOCKS.PROMOTION_REQUIRES_SECURITY_TESTS,
    promotionRequiresBenchmarks: CP_LOCKS.PROMOTION_REQUIRES_BENCHMARKS,
    promotionRequiresHumanReview: CP_LOCKS.PROMOTION_REQUIRES_HUMAN_REVIEW,
  };
}

export async function registerApprovedPlugin(input: {
  name: string;
  capabilityTag: string;
  root: string;
  actor: CpActor;
}): Promise<FoundryPlugin> {
  const store = await load(input.root);
  const plugin: FoundryPlugin = {
    id: id('fplug'),
    name: input.name.trim(),
    capabilityTag: input.capabilityTag.trim().toLowerCase(),
    lifecycle: 'approved',
    sandbox: false,
    promoted: true,
    approved: true,
    unitTestsPass: true,
    integrationTestsPass: true,
    securityTestsPass: true,
    benchmarksPass: true,
    humanReviewPass: true,
    elevatedPermissions: false,
    reason: 'APPROVED_PLUGIN_REGISTERED_FOR_REUSE',
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.plugins.push(plugin);
  await save(input.root, store);
  return plugin;
}

export async function identifyCapabilityGap(input: {
  capabilityTag: string;
  root: string;
  actor: CpActor;
}): Promise<CapabilityGap> {
  const store = await load(input.root);
  const tag = input.capabilityTag.trim().toLowerCase();
  const reuse = store.plugins.find(
    (p) =>
      p.capabilityTag === tag &&
      (p.approved || p.promoted) &&
      p.lifecycle !== 'revoked' &&
      p.lifecycle !== 'sandbox',
  );
  const gap: CapabilityGap = {
    id: id('gap'),
    capabilityTag: tag,
    reuseCandidateId: reuse?.id ?? null,
    action: reuse ? 'reuse' : 'sandbox_build',
    reason: reuse ? REUSE_PREFERRED : SANDBOX_UNTIL_PROMOTION,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.gaps.push(gap);
  await save(input.root, store);
  return gap;
}

export async function buildSandboxPlugin(input: {
  name: string;
  capabilityTag: string;
  elevatedPermissions?: boolean;
  forceDuplicate?: boolean;
  root: string;
  actor: CpActor;
}): Promise<FoundryPlugin> {
  const store = await load(input.root);
  const tag = input.capabilityTag.trim().toLowerCase();
  const reuse = store.plugins.find(
    (p) => p.capabilityTag === tag && (p.approved || p.promoted) && p.lifecycle !== 'revoked',
  );
  if (reuse && CP_LOCKS.REUSE_APPROVED_PLUGINS_FIRST && input.forceDuplicate !== true) {
    return {
      ...reuse,
      reason: REUSE_PREFERRED,
    };
  }
  const plugin: FoundryPlugin = {
    id: id('fplug'),
    name: input.name.trim(),
    capabilityTag: tag,
    lifecycle: 'sandbox',
    sandbox: true,
    promoted: false,
    approved: false,
    unitTestsPass: false,
    integrationTestsPass: false,
    securityTestsPass: false,
    benchmarksPass: false,
    humanReviewPass: false,
    elevatedPermissions: input.elevatedPermissions === true,
    reason: SANDBOX_UNTIL_PROMOTION,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.plugins.push(plugin);
  await save(input.root, store);
  return plugin;
}

export async function attemptPromotePlugin(input: {
  pluginId: string;
  unitTestsPass?: boolean;
  integrationTestsPass?: boolean;
  securityTestsPass?: boolean;
  benchmarksPass?: boolean;
  humanReviewPass?: boolean;
  root: string;
  actor: CpActor;
}): Promise<PromotionAttempt & { plugin: FoundryPlugin | null }> {
  const store = await load(input.root);
  const plugin = store.plugins.find((p) => p.id === input.pluginId) ?? null;
  void input.actor;
  if (!plugin) {
    const attempt: PromotionAttempt = {
      id: id('prom'),
      pluginId: input.pluginId,
      status: 'denied',
      reason: 'PLUGIN_NOT_FOUND',
      at: new Date().toISOString(),
    };
    store.promotions.push(attempt);
    await save(input.root, store);
    return { ...attempt, plugin: null };
  }

  plugin.unitTestsPass = input.unitTestsPass === true;
  plugin.integrationTestsPass = input.integrationTestsPass === true;
  plugin.securityTestsPass = input.securityTestsPass === true;
  plugin.benchmarksPass = input.benchmarksPass === true;
  plugin.humanReviewPass = input.humanReviewPass === true;

  const gatesOk =
    plugin.unitTestsPass &&
    plugin.integrationTestsPass &&
    plugin.securityTestsPass &&
    plugin.benchmarksPass &&
    plugin.humanReviewPass;

  if (!gatesOk) {
    plugin.lifecycle = 'sandbox';
    plugin.sandbox = true;
    plugin.promoted = false;
    plugin.approved = false;
    plugin.reason = PROMOTION_GATES_INCOMPLETE;
    const attempt: PromotionAttempt = {
      id: id('prom'),
      pluginId: plugin.id,
      status: 'sandboxed',
      reason: PROMOTION_GATES_INCOMPLETE,
      at: new Date().toISOString(),
    };
    store.promotions.push(attempt);
    await save(input.root, store);
    return { ...attempt, plugin };
  }

  plugin.lifecycle = 'promoted';
  plugin.sandbox = false;
  plugin.promoted = true;
  plugin.approved = true;
  plugin.reason = 'PROMOTION_GATES_PASSED_HUMAN_REVIEWED';
  const attempt: PromotionAttempt = {
    id: id('prom'),
    pluginId: plugin.id,
    status: 'promoted',
    reason: plugin.reason,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return { ...attempt, plugin };
}

export async function assignPluginToAgent(input: {
  pluginId: string;
  agentId: string;
  elevatedPermissions?: boolean;
  selfAssign?: boolean;
  root: string;
  actor: CpActor;
}): Promise<AssignmentAttempt> {
  const store = await load(input.root);
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const elevated = input.elevatedPermissions === true;
  const selfAssign = input.selfAssign === true;
  void input.actor;

  const deny =
    !plugin ||
    !plugin.promoted ||
    plugin.sandbox ||
    plugin.lifecycle === 'sandbox' ||
    (selfAssign && elevated) ||
    (elevated && !plugin.promoted);

  if (deny) {
    const attempt: AssignmentAttempt = {
      id: id('assign'),
      pluginId: input.pluginId,
      agentId: input.agentId,
      elevated,
      selfAssign,
      status: 'denied',
      reason: AGENT_SELF_ASSIGN_DENIED,
      at: new Date().toISOString(),
    };
    store.assignments.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: AssignmentAttempt = {
    id: id('assign'),
    pluginId: plugin.id,
    agentId: input.agentId,
    elevated: false,
    selfAssign,
    status: 'allowed',
    reason: 'PROMOTED_PLUGIN_ASSIGNED_BOUNDED',
    at: new Date().toISOString(),
  };
  store.assignments.push(attempt);
  await save(input.root, store);
  return attempt;
}
