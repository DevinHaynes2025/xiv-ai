export type ToolMode = 'LOCAL' | 'HYBRID' | 'REMOTE';
export type ToolStatus = 'TARGET' | 'AVAILABLE' | 'VERIFIED' | 'DISABLED';
export type DataClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface GovernedTool {
  toolId: string;
  capability: string;
  mode: ToolMode;
  status: ToolStatus;
  authorityLevel: 0 | 1 | 2 | 3 | 4 | 5;
  allowedDataClasses: DataClass[];
  evidenceRefs: string[];
  productionMutationAllowed: false;
}

export const DEFAULT_XIV_TOOLS: GovernedTool[] = [
  { toolId: 'local-ollama', capability: 'local-llm-inference', mode: 'LOCAL', status: 'TARGET', authorityLevel: 1, allowedDataClasses: ['PUBLIC','INTERNAL','CONFIDENTIAL','TOP_SECRET'], evidenceRefs: [], productionMutationAllowed: false },
  { toolId: 'local-rag', capability: 'private-retrieval', mode: 'LOCAL', status: 'AVAILABLE', authorityLevel: 1, allowedDataClasses: ['PUBLIC','INTERNAL','CONFIDENTIAL','TOP_SECRET'], evidenceRefs: [], productionMutationAllowed: false },
  { toolId: 'github-adapter', capability: 'source-control', mode: 'REMOTE', status: 'AVAILABLE', authorityLevel: 2, allowedDataClasses: ['PUBLIC','INTERNAL'], evidenceRefs: [], productionMutationAllowed: false },
  { toolId: 'gitlab-adapter', capability: 'source-control', mode: 'REMOTE', status: 'AVAILABLE', authorityLevel: 2, allowedDataClasses: ['PUBLIC','INTERNAL','CONFIDENTIAL'], evidenceRefs: [], productionMutationAllowed: false },
  { toolId: 'historical-archive', capability: 'source-backed-ingestion', mode: 'HYBRID', status: 'AVAILABLE', authorityLevel: 1, allowedDataClasses: ['PUBLIC','INTERNAL'], evidenceRefs: [], productionMutationAllowed: false },
];

export function canUseTool(tool: GovernedTool, dataClass: DataClass, requestedAuthority: number): boolean {
  return tool.status === 'VERIFIED' && tool.allowedDataClasses.includes(dataClass) && requestedAuthority <= tool.authorityLevel;
}
