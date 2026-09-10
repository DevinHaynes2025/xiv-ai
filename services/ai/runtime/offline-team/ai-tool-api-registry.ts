export type ToolKind = 'LOCAL_MODEL' | 'CLOUD_MODEL' | 'PLUGIN' | 'IDE' | 'DEVICE_TOOL' | 'API' | 'DATA_SOURCE';
export type ToolState = 'CONNECTED' | 'AVAILABLE' | 'PAUSED' | 'OFFLINE' | 'UNVERIFIED';
export type DataClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface ToolCapabilityRecord {
  id: string;
  name: string;
  kind: ToolKind;
  state: ToolState;
  capabilities: string[];
  maxDataClass: DataClass;
  tenantScoped: boolean;
  productionAuthority: false;
  evidenceRefs: string[];
}

export const TOOL_REGISTRY_GUARDRAILS = {
  topSecretExternalRoutingAllowed: false,
  secretsInSourceAllowed: false,
  connectedStatusRequiresEvidence: true,
  productionAuthority: false,
};

export function buildDefaultToolRegistry(): ToolCapabilityRecord[] {
  return [
    { id: 'ollama', name: 'Ollama', kind: 'LOCAL_MODEL', state: 'AVAILABLE', capabilities: ['local-inference','coding','reasoning'], maxDataClass: 'TOP_SECRET', tenantScoped: true, productionAuthority: false, evidenceRefs: [] },
    { id: 'qwen-local', name: 'Qwen2.5-Coder', kind: 'LOCAL_MODEL', state: 'AVAILABLE', capabilities: ['coding','review','planning'], maxDataClass: 'TOP_SECRET', tenantScoped: true, productionAuthority: false, evidenceRefs: [] },
    { id: 'lovable', name: 'Lovable', kind: 'PLUGIN', state: 'PAUSED', capabilities: ['full-stack-prototype','ux','responsive-ui'], maxDataClass: 'CONFIDENTIAL', tenantScoped: true, productionAuthority: false, evidenceRefs: ['lovable-project-private-unpublished'] },
    { id: 'github', name: 'GitHub', kind: 'API', state: 'CONNECTED', capabilities: ['source-control','reviews','history'], maxDataClass: 'CONFIDENTIAL', tenantScoped: true, productionAuthority: false, evidenceRefs: ['github-connector'] },
    { id: 'gitlab', name: 'GitLab', kind: 'API', state: 'CONNECTED', capabilities: ['source-control','reviews','ci'], maxDataClass: 'CONFIDENTIAL', tenantScoped: true, productionAuthority: false, evidenceRefs: ['gitlab-connector'] },
    { id: 'android-studio', name: 'Android Studio', kind: 'DEVICE_TOOL', state: 'UNVERIFIED', capabilities: ['android-build','emulator','device-validation'], maxDataClass: 'CONFIDENTIAL', tenantScoped: true, productionAuthority: false, evidenceRefs: [] },
  ];
}

export function canRouteToTool(tool: ToolCapabilityRecord, classification: DataClass): boolean {
  if (classification === 'TOP_SECRET' && tool.kind !== 'LOCAL_MODEL') return false;
  if (!tool.tenantScoped || tool.productionAuthority) return false;
  return tool.state === 'CONNECTED' || tool.state === 'AVAILABLE';
}
