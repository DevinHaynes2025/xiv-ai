export type ToolTrust = 'UNVERIFIED' | 'EVALUATING' | 'APPROVED' | 'BLOCKED';

export interface OpenSourceToolEntry {
  toolId: string;
  name: string;
  repositoryRef: string;
  licenseRef: string;
  capabilityTags: string[];
  offlineCapable: boolean;
  trust: ToolTrust;
  securityReviewRefs: string[];
  versionPin?: string;
}

export function canLoadOpenSourceTool(entry: OpenSourceToolEntry): boolean {
  return entry.trust === 'APPROVED' && !!entry.licenseRef && entry.securityReviewRefs.length > 0;
}

export const OPEN_SOURCE_TOOL_GUARDRAILS = {
  licenseReviewRequired: true,
  securityReviewRequired: true,
  versionPinRecommended: true,
  arbitraryRemoteCodeExecutionAllowed: false,
  productionInstallRequiresHumanApproval: true,
};
