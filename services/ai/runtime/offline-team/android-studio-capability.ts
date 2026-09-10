export type AndroidStudioState = 'CONNECTED' | 'DETECTED' | 'UNVERIFIED' | 'OFFLINE';

export interface AndroidStudioCapability {
  tool: 'ANDROID_STUDIO';
  purpose: 'DEVICE_VALIDATION';
  state: AndroidStudioState;
  evidenceRefs: string[];
  supports: Array<'ANDROID_EMULATOR' | 'PHYSICAL_ANDROID' | 'BUILD_LOGS' | 'DEVICE_RECEIPTS'>;
}

export function buildAndroidStudioCapability(evidenceRefs: string[] = []): AndroidStudioCapability {
  return {
    tool: 'ANDROID_STUDIO',
    purpose: 'DEVICE_VALIDATION',
    state: evidenceRefs.length ? 'DETECTED' : 'UNVERIFIED',
    evidenceRefs,
    supports: ['ANDROID_EMULATOR', 'PHYSICAL_ANDROID', 'BUILD_LOGS', 'DEVICE_RECEIPTS'],
  };
}

export const ANDROID_STUDIO_GUARDRAILS = {
  universalCompatibilityClaimAllowed: false,
  productionDeploymentAllowed: false,
  secretsInLogsAllowed: false,
  verifiedRequiresDeviceReceipt: true,
};
