export type DeviceFamily = 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'EDGE';
export type OsFamily = 'ANDROID' | 'IOS' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'CHROMEOS' | 'EMBEDDED';
export type CpuFamily = 'ARM64' | 'X64' | 'X86' | 'RISCV' | 'UNKNOWN';
export type CompatibilityState = 'TARGETED' | 'DETECTED' | 'VERIFIED' | 'UNVERIFIED' | 'UNSUPPORTED';

export interface DeviceCompatibilityProfile {
  deviceFamily: DeviceFamily;
  osFamily: OsFamily;
  cpuFamily: CpuFamily;
  state: CompatibilityState;
  evidenceRefs: string[];
  offlineMode: boolean;
  supportedSurfaces: Array<'WEB' | 'PWA' | 'REACT_NATIVE' | 'DESKTOP_SHELL' | 'LOCAL_AGENT'>;
}

export const TARGET_MATRIX: DeviceCompatibilityProfile[] = [
  ['PHONE','ANDROID','ARM64',['WEB','PWA','REACT_NATIVE','LOCAL_AGENT']],
  ['PHONE','IOS','ARM64',['WEB','PWA','REACT_NATIVE']],
  ['TABLET','ANDROID','ARM64',['WEB','PWA','REACT_NATIVE','LOCAL_AGENT']],
  ['TABLET','IOS','ARM64',['WEB','PWA','REACT_NATIVE']],
  ['LAPTOP','WINDOWS','X64',['WEB','PWA','DESKTOP_SHELL','LOCAL_AGENT']],
  ['LAPTOP','MACOS','ARM64',['WEB','PWA','DESKTOP_SHELL','LOCAL_AGENT']],
  ['LAPTOP','LINUX','X64',['WEB','PWA','DESKTOP_SHELL','LOCAL_AGENT']],
  ['LAPTOP','CHROMEOS','X64',['WEB','PWA']],
  ['DESKTOP','WINDOWS','X64',['WEB','PWA','DESKTOP_SHELL','LOCAL_AGENT']],
  ['DESKTOP','MACOS','ARM64',['WEB','PWA','DESKTOP_SHELL','LOCAL_AGENT']],
  ['DESKTOP','LINUX','X64',['WEB','PWA','DESKTOP_SHELL','LOCAL_AGENT']],
  ['EDGE','EMBEDDED','ARM64',['LOCAL_AGENT']],
].map(([deviceFamily, osFamily, cpuFamily, supportedSurfaces]) => ({
  deviceFamily: deviceFamily as DeviceFamily,
  osFamily: osFamily as OsFamily,
  cpuFamily: cpuFamily as CpuFamily,
  state: 'TARGETED' as CompatibilityState,
  evidenceRefs: [],
  offlineMode: true,
  supportedSurfaces: supportedSurfaces as DeviceCompatibilityProfile['supportedSurfaces'],
}));

export function verifyCompatibility(
  profile: DeviceCompatibilityProfile,
  evidenceRefs: string[],
): DeviceCompatibilityProfile {
  if (!evidenceRefs.length) throw new Error('verification evidence required');
  return { ...profile, state: 'VERIFIED', evidenceRefs: [...new Set(evidenceRefs)] };
}

export const UNIVERSAL_COMPATIBILITY_GUARDRAILS = {
  universalSupportClaimAllowedWithoutEvidence: false,
  verificationRequiredPerOsDeviceClass: true,
  fallbackToWebOrPwaWhenNativeUnavailable: true,
  offlineFirstWhereSupported: true,
  secretsInClientLogsAllowed: false,
  productionAuthorityFromDeviceInstall: false,
};
