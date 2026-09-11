export type ToolState = 'TARGET' | 'RESEARCH' | 'APPROVED' | 'VERIFIED';

export interface OpenSourceToolNode {
  name: string;
  repositoryUrl?: string;
  license?: string;
  state: ToolState;
  securityReviewed: boolean;
  allowedOffline: boolean;
  sourceRefs: string[];
}

export function canUseTool(node: OpenSourceToolNode): boolean {
  return (node.state === 'APPROVED' || node.state === 'VERIFIED') &&
    node.securityReviewed &&
    !!node.license &&
    node.sourceRefs.length > 0;
}

export const openSourceMeshPolicy = {
  arbitraryCodeExecutionAllowed: false,
  licenseReviewRequired: true,
  securityReviewRequired: true,
  secretsToPublicToolsAllowed: false,
  topSecretExternalUseAllowed: false,
};
