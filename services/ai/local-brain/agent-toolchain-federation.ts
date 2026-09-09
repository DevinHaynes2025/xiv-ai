/**
 * 62L-DP Agent Toolchain Federation —
 * Federated agent toolchains using verified plugins only.
 * Agent-built connector candidates remain sandbox until gates.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_BUILT_SANDBOX_UNTIL_GATES,
  MAX_TOOLCHAINS,
  PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
  PERMISSION_UPGRADE_DIFF_REQUIRED,
  type DpActor,
  type PermissionScope,
} from './plugin-civilization-os-types';

export type FederatedPluginRef = {
  pluginId: string;
  verified: boolean;
  approved: boolean;
  agentBuilt: boolean;
  sandbox: boolean;
  scopes: PermissionScope[];
  killed: boolean;
  driftDetected: boolean;
};

export type Toolchain = {
  id: string;
  name: string;
  pluginIds: string[];
  status: 'active' | 'denied' | 'sandbox';
  reason: string;
  createdAt: string;
};

export type PermissionUpgrade = {
  id: string;
  pluginId: string;
  fromScopes: PermissionScope[];
  toScopes: PermissionScope[];
  explicitDiffPresented: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type ToolchainInvoke = {
  id: string;
  toolchainId: string;
  pluginId: string;
  status: 'allowed' | 'denied' | 'sandbox';
  reason: string;
  at: string;
};

type Store = {
  plugins: FederatedPluginRef[];
  toolchains: Toolchain[];
  upgrades: PermissionUpgrade[];
  invokes: ToolchainInvoke[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-toolchain-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plugins: [],
    toolchains: [],
    upgrades: [],
    invokes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentToolchainFederationHonesty() {
  return {
    verifiedPluginsOnly: true,
    agentBuiltSandboxUntilGates: true,
    permissionUpgradeRequiresExplicitDiff: true,
  };
}

export async function registerFederatedPlugin(input: {
  pluginId?: string;
  verified?: boolean;
  approved?: boolean;
  agentBuilt?: boolean;
  scopes?: PermissionScope[];
  root: string;
  actor: DpActor;
}): Promise<FederatedPluginRef> {
  const store = await load(input.root);
  void input.actor;
  const agentBuilt = input.agentBuilt === true;
  const verified = input.verified === true;
  const approved = input.approved === true && verified;
  const plugin: FederatedPluginRef = {
    pluginId: input.pluginId ?? id('dpfedplug'),
    verified,
    approved,
    agentBuilt,
    sandbox: agentBuilt || !approved,
    scopes: input.scopes ?? ['read'],
    killed: false,
    driftDetected: false,
  };
  store.plugins.push(plugin);
  await save(input.root, store);
  return plugin;
}

export async function createToolchain(input: {
  name: string;
  pluginIds: string[];
  root: string;
  actor: DpActor;
}): Promise<Toolchain> {
  const store = await load(input.root);
  void input.actor;
  if (store.toolchains.length >= MAX_TOOLCHAINS) throw new Error('MAX_TOOLCHAINS_REACHED');
  const plugins = input.pluginIds.map((pid) => store.plugins.find((p) => p.pluginId === pid));
  const allVerifiedApproved =
    plugins.length > 0 &&
    plugins.every(
      (p) => p && p.verified && p.approved && !p.killed && !p.driftDetected && !p.sandbox,
    );
  const anySandbox = plugins.some((p) => p && p.sandbox);
  const toolchain: Toolchain = {
    id: id('dptc'),
    name: input.name.trim(),
    pluginIds: input.pluginIds,
    status: allVerifiedApproved ? 'active' : anySandbox ? 'sandbox' : 'denied',
    reason: allVerifiedApproved
      ? 'TOOLCHAIN_VERIFIED_PLUGINS_ONLY'
      : anySandbox
        ? AGENT_BUILT_SANDBOX_UNTIL_GATES
        : PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
    createdAt: new Date().toISOString(),
  };
  store.toolchains.push(toolchain);
  await save(input.root, store);
  return toolchain;
}

export async function requestPermissionUpgrade(input: {
  pluginId: string;
  toScopes: PermissionScope[];
  explicitDiffPresented?: boolean;
  root: string;
  actor: DpActor;
}): Promise<PermissionUpgrade> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.pluginId === input.pluginId);
  const fromScopes = plugin?.scopes ?? [];
  const explicit = input.explicitDiffPresented === true;
  const upgrade: PermissionUpgrade = {
    id: id('dpupg'),
    pluginId: input.pluginId,
    fromScopes,
    toScopes: input.toScopes,
    explicitDiffPresented: explicit,
    status: explicit && plugin ? 'allowed' : 'denied',
    reason: explicit && plugin ? 'PERMISSION_UPGRADE_DIFF_ACCEPTED' : PERMISSION_UPGRADE_DIFF_REQUIRED,
    at: new Date().toISOString(),
  };
  if (upgrade.status === 'allowed' && plugin) {
    plugin.scopes = [...new Set([...plugin.scopes, ...input.toScopes])];
  }
  store.upgrades.push(upgrade);
  await save(input.root, store);
  return upgrade;
}

export async function invokeFederatedPlugin(input: {
  toolchainId: string;
  pluginId: string;
  root: string;
  actor: DpActor;
}): Promise<ToolchainInvoke> {
  const store = await load(input.root);
  void input.actor;
  const toolchain = store.toolchains.find((t) => t.id === input.toolchainId);
  const plugin = store.plugins.find((p) => p.pluginId === input.pluginId);
  const now = new Date().toISOString();

  if (!toolchain || !plugin || !toolchain.pluginIds.includes(input.pluginId)) {
    const inv: ToolchainInvoke = {
      id: id('dpfedinv'),
      toolchainId: input.toolchainId,
      pluginId: input.pluginId,
      status: 'denied',
      reason: PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
      at: now,
    };
    store.invokes.push(inv);
    await save(input.root, store);
    return inv;
  }

  if (plugin.agentBuilt && plugin.sandbox && !plugin.approved) {
    const inv: ToolchainInvoke = {
      id: id('dpfedinv'),
      toolchainId: toolchain.id,
      pluginId: plugin.pluginId,
      status: 'sandbox',
      reason: AGENT_BUILT_SANDBOX_UNTIL_GATES,
      at: now,
    };
    store.invokes.push(inv);
    await save(input.root, store);
    return inv;
  }

  if (!plugin.verified || !plugin.approved || plugin.killed || plugin.driftDetected) {
    const inv: ToolchainInvoke = {
      id: id('dpfedinv'),
      toolchainId: toolchain.id,
      pluginId: plugin.pluginId,
      status: 'denied',
      reason: PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
      at: now,
    };
    store.invokes.push(inv);
    await save(input.root, store);
    return inv;
  }

  const inv: ToolchainInvoke = {
    id: id('dpfedinv'),
    toolchainId: toolchain.id,
    pluginId: plugin.pluginId,
    status: 'allowed',
    reason: 'FEDERATED_INVOKE_ALLOWED',
    at: now,
  };
  store.invokes.push(inv);
  await save(input.root, store);
  return inv;
}
