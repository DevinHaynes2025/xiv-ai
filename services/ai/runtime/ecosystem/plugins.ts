import type { IndustryPackId } from './types';

export type PluginManifest = {
  packId: IndustryPackId;
  signed: boolean;
  scanned: boolean;
  requestedPermissions: readonly string[];
  companyApproved: boolean;
  universeBound: boolean;
};

export type PluginInstall = {
  packId: IndustryPackId;
  unrestrictedAccess: false;
};

export function installIndustryPack(manifest: PluginManifest): PluginInstall | { allowed: false; reason: string } {
  if (!manifest.signed || !manifest.scanned || !manifest.companyApproved || !manifest.universeBound) {
    return { allowed: false, reason: 'plugin_requires_signature_scan_approval_and_universe_binding' };
  }
  if (manifest.requestedPermissions.includes('*') || manifest.requestedPermissions.includes('unrestricted')) {
    return { allowed: false, reason: 'plugin_cannot_receive_unrestricted_access' };
  }
  return { packId: manifest.packId, unrestrictedAccess: false };
}

export function pluginReceivesUnrestrictedAccess(_install: PluginInstall): false {
  return false;
}
