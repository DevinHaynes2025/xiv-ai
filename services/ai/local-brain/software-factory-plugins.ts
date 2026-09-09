import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { isAllowedLocalCommand } from './local-command-runner';
import { runFactoryAllowlistedCommand } from './software-factory-sandbox';
import type { FactoryEvidenceState } from './software-factory-types';

export type PluginPermission =
  | 'read_local_docs'
  | 'write_sandbox_files'
  | 'run_allowlisted_tests'
  | 'network'
  | 'production_deploy'
  | 'production_database'
  | 'permission_expansion';

export type PluginManifest = {
  pluginId: string;
  name: string;
  version: string;
  publisher: string;
  requestedPermissions: PluginPermission[];
  requestedCapabilities: string[];
  networkAccess: boolean;
  storageAccess: boolean;
  sandboxOnly: true;
  productionAuthorization: false;
};

export type PluginRegistryRecord = {
  pluginId: string;
  tenantId: string;
  universeId: string;
  manifest: PluginManifest;
  grantedPermissions: PluginPermission[];
  status: 'registered_candidate' | 'denied' | 'quarantined';
  permissionDiffDenied: boolean;
  newPermissions: PluginPermission[];
  productionAuthorization: false;
};

export type InternalToolCandidate = {
  id: string;
  name: string;
  mappedCommand: string;
  sandboxOnly: true;
  productionAuthorization: false;
};

type PluginRegistryState = {
  records: PluginRegistryRecord[];
};

const EMPTY: PluginRegistryState = { records: [] };

function registryPath(root: string) {
  return xivLocalPath(root, 'plugin-registry.json');
}

export function parsePluginManifest(input: {
  pluginId: string;
  name: string;
  version: string;
  publisher: string;
  requestedPermissions: PluginPermission[];
  requestedCapabilities?: string[];
  networkAccess?: boolean;
  storageAccess?: boolean;
}) {
  if (!input.pluginId.trim() || !input.name.trim() || !input.version.trim() || !input.publisher.trim()) {
    return { accepted: false as const, reason: 'Plugin manifest requires pluginId, name, version, and publisher.' };
  }
  if (input.requestedPermissions.includes('production_deploy') || input.requestedPermissions.includes('production_database') || input.requestedPermissions.includes('permission_expansion')) {
    return { accepted: false as const, reason: 'Plugin manifest requested a production or permission-expansion capability. Denied.' };
  }
  if (input.networkAccess) {
    return { accepted: false as const, reason: 'Plugin network access is not granted in the offline factory. Unconfigured network stays UNAVAILABLE.' };
  }
  const manifest: PluginManifest = {
    pluginId: input.pluginId.trim(),
    name: input.name.trim(),
    version: input.version.trim(),
    publisher: input.publisher.trim(),
    requestedPermissions: [...input.requestedPermissions],
    requestedCapabilities: [...(input.requestedCapabilities ?? [])],
    networkAccess: false,
    storageAccess: input.storageAccess === true,
    sandboxOnly: true,
    productionAuthorization: false,
  };
  return { accepted: true as const, manifest, reason: 'Plugin manifest accepted as a sandbox candidate.' };
}

export function permissionDiffGate(input: {
  granted: readonly PluginPermission[];
  requested: readonly PluginPermission[];
}) {
  const granted = new Set(input.granted);
  const newPermissions = input.requested.filter((permission) => !granted.has(permission));
  if (newPermissions.length > 0) {
    return {
      allowed: false as const,
      permissionDiffDenied: true as const,
      newPermissions,
      reason: `PERMISSION_DIFF_DENY:${newPermissions.join(',')}`,
      permissionExpansion: false as const,
      productionAuthorization: false as const,
    };
  }
  return {
    allowed: true as const,
    permissionDiffDenied: false as const,
    newPermissions: [] as PluginPermission[],
    reason: 'Requested permissions match the granted set.',
    permissionExpansion: false as const,
    productionAuthorization: false as const,
  };
}

export async function registerGovernedPlugin(input: {
  tenantId: string;
  universeId: string;
  manifest: PluginManifest;
  grantedPermissions: PluginPermission[];
  root?: string;
}) {
  const diff = permissionDiffGate({
    granted: input.grantedPermissions,
    requested: input.manifest.requestedPermissions,
  });
  const root = input.root ?? process.cwd();
  const state = await readJsonFile(registryPath(root), EMPTY);
  if (!diff.allowed) {
    const denied: PluginRegistryRecord = {
      pluginId: input.manifest.pluginId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      manifest: input.manifest,
      grantedPermissions: [...input.grantedPermissions],
      status: 'denied',
      permissionDiffDenied: true,
      newPermissions: diff.newPermissions,
      productionAuthorization: false,
    };
    state.records.push(denied);
    await writeJsonFileAtomic(registryPath(root), state);
    return { registered: false as const, record: denied, reason: diff.reason };
  }
  const record: PluginRegistryRecord = {
    pluginId: input.manifest.pluginId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    manifest: input.manifest,
    grantedPermissions: [...input.grantedPermissions],
    status: 'registered_candidate',
    permissionDiffDenied: false,
    newPermissions: [],
    productionAuthorization: false,
  };
  state.records = state.records.filter((item) => !(item.pluginId === record.pluginId && item.tenantId === input.tenantId && item.universeId === input.universeId));
  state.records.push(record);
  await writeJsonFileAtomic(registryPath(root), state);
  return { registered: true as const, record, reason: 'Plugin registered as a governed sandbox candidate. Not published.' };
}

export async function listRegisteredPlugins(input: { tenantId: string; universeId: string; root?: string }) {
  const state = await readJsonFile(registryPath(input.root ?? process.cwd()), EMPTY);
  return state.records.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export async function quarantinePlugin(input: {
  tenantId: string;
  universeId: string;
  pluginId: string;
  reason: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const state = await readJsonFile(registryPath(root), EMPTY);
  const record = state.records.find((item) => item.pluginId === input.pluginId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!record) return { quarantined: false as const, reason: 'PLUGIN_NOT_FOUND' };
  record.status = 'quarantined';
  await writeJsonFileAtomic(registryPath(root), state);
  return { quarantined: true as const, record, reason: input.reason, productionAuthorization: false as const };
}

export async function executePluginInSandbox(input: {
  plugin: PluginRegistryRecord;
  commandId: string;
  cwd: string;
  modelProvidedShell?: string;
}) {
  if (input.plugin.status !== 'registered_candidate') {
    return { allowed: false as const, reason: `PLUGIN_NOT_EXECUTABLE:${input.plugin.status}`, state: 'DENIED' as FactoryEvidenceState };
  }
  if (input.plugin.manifest.networkAccess) {
    return { allowed: false as const, reason: 'Plugin network remains UNAVAILABLE in the offline factory.', state: 'UNAVAILABLE' as FactoryEvidenceState };
  }
  if (!input.plugin.grantedPermissions.includes('run_allowlisted_tests') && !isAllowedLocalCommand(input.commandId)) {
    return { allowed: false as const, reason: 'Plugin runtime sandbox refused a non-allowlisted command.', state: 'DENIED' as FactoryEvidenceState };
  }
  const result = await runFactoryAllowlistedCommand({
    id: input.commandId,
    cwd: input.cwd,
    modelProvidedShell: input.modelProvidedShell,
  });
  return { ...result, state: result.allowed ? ('PASS' as FactoryEvidenceState) : ('DENIED' as FactoryEvidenceState) };
}

export function generateInternalTool(input: {
  name: string;
  mappedCommand: string;
}) {
  if (!input.name.trim()) {
    return { accepted: false as const, reason: 'Internal tool generation requires a name.' };
  }
  if (!isAllowedLocalCommand(input.mappedCommand)) {
    return { accepted: false as const, reason: `INTERNAL_TOOL_NOT_ALLOWLISTED:${input.mappedCommand}` };
  }
  const tool: InternalToolCandidate = {
    id: cortexId('tool'),
    name: input.name.trim(),
    mappedCommand: input.mappedCommand,
    sandboxOnly: true,
    productionAuthorization: false,
  };
  return { accepted: true as const, tool, reason: 'Internal tool candidate maps to an allowlisted command only. Not deployed.' };
}
