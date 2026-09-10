export type OsFamily = 'WINDOWS' | 'LINUX' | 'MACOS' | 'ANDROID' | 'IOS' | 'CHROMEOS' | 'EMBEDDED';
export type OsSupport = 'UNVERIFIED' | 'PLANNED' | 'SUPPORTED' | 'VERIFIED';

export interface OsRuntimeReceipt {
  os: OsFamily;
  support: OsSupport;
  runtime: string;
  evidenceRefs: readonly string[];
}

export const CROSS_OS_GUARDRAILS = {
  claimUniversalCompatibility: false,
  verifiedRequiresEvidence: true,
  productionAutoInstall: false,
} as const;

export function validateOsRuntimeReceipt(receipt: OsRuntimeReceipt): OsRuntimeReceipt {
  if (!receipt.runtime.trim()) throw new Error('runtime required');
  if (receipt.support === 'VERIFIED' && receipt.evidenceRefs.length === 0) throw new Error('VERIFIED OS support requires evidence');
  return Object.freeze({ ...receipt, evidenceRefs: Object.freeze([...receipt.evidenceRefs]) });
}
