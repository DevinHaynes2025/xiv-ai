export type OfflinePluginCapability = 'READ_LOCAL_DATA' | 'WRITE_LOCAL_CACHE' | 'RUN_LOCAL_MODEL' | 'ANALYZE_HISTORY' | 'SCAN_DEFENSIVE' | 'SIMULATE';

export interface OfflinePluginManifest {
  pluginId: string;
  version: string;
  capabilities: readonly OfflinePluginCapability[];
  checksum: string;
  enabled: boolean;
  requiresNetwork: boolean;
  mayWriteProduction: false;
}

export const OFFLINE_PLUGIN_GUARDRAILS = {
  productionWritesAllowed: false,
  networkDefaultAllowed: false,
  unsignedPluginAutoLoadAllowed: false,
  secretAccessAllowed: false,
  hostShellUnrestrictedAllowed: false,
  tenantBoundaryBypassAllowed: false,
} as const;

export function validateOfflinePlugin(manifest: OfflinePluginManifest): OfflinePluginManifest {
  if (!manifest.pluginId || !manifest.version || !manifest.checksum) throw new Error('plugin identity/checksum required');
  if (manifest.mayWriteProduction) throw new Error('offline plugins cannot write production');
  if (manifest.requiresNetwork && OFFLINE_PLUGIN_GUARDRAILS.networkDefaultAllowed === false) {
    return Object.freeze({ ...manifest, enabled: false, capabilities: Object.freeze([...new Set(manifest.capabilities)]) });
  }
  return Object.freeze({ ...manifest, capabilities: Object.freeze([...new Set(manifest.capabilities)]) });
}

export function runnableOfflinePlugins(manifests: readonly OfflinePluginManifest[]) {
  return Object.freeze(manifests.map(validateOfflinePlugin).filter((m) => m.enabled && !m.requiresNetwork));
}
