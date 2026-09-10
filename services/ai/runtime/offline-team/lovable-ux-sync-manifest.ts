export type ToolSyncState = 'CONNECTED' | 'PAUSED' | 'READY' | 'UNVERIFIED';

export interface LovableUxSyncManifest {
  tool: 'LOVABLE';
  projectName: string;
  projectIdRef: string;
  state: ToolSyncState;
  approvedScopes: string[];
  forbiddenScopes: string[];
  sourceOfTruth: 'GITHUB_GITLAB_GOVERNED_HISTORY';
  evidenceRefs: string[];
}

export function buildLovableUxSyncManifest(state: ToolSyncState, evidenceRefs: string[]): LovableUxSyncManifest {
  return {
    tool: 'LOVABLE',
    projectName: 'XIV AI Universe',
    projectIdRef: 'external:lovable:xiv-ai-universe',
    state,
    approvedScopes: ['responsive UX','visual storytelling','mobile layouts','desktop command center','synthetic-data prototyping'],
    forbiddenScopes: ['TOP_SECRET prompts','production secrets','unreviewed production deploys','cross-tenant data'],
    sourceOfTruth: 'GITHUB_GITLAB_GOVERNED_HISTORY',
    evidenceRefs,
  };
}

export const LOVABLE_SYNC_GUARDRAILS = {
  topSecretAllowed: false,
  productionDeploymentAllowed: false,
  syntheticPrototypeDataOnly: true,
  syncRequiresEvidence: true,
};
