export type ConnectionStatus = 'TARGET' | 'CONFIGURED' | 'VERIFIED' | 'DEGRADED' | 'OFFLINE';
export type ExecutionMode = 'OFFLINE_LOCAL' | 'HYBRID' | 'ONLINE_REMOTE' | 'DENY';
export type BrainSecurityClass = 'ORDINARY' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type ToolId =
  | 'OLLAMA_LOCAL'
  | 'CLAUDE_CODE'
  | 'GROK_XAI'
  | 'OPENAI'
  | 'GEMINI'
  | 'GOOGLE_CLOUD'
  | 'AZURE'
  | 'GITHUB'
  | 'GITLAB'
  | 'LOVABLE'
  | 'REPLIT'
  | 'CURSOR';

export type AgentRole =
  | 'CEO_ADVISOR'
  | 'CTO_ARCHITECT'
  | 'CISO_GUARDIAN'
  | 'CFO_ANALYST'
  | 'PRODUCT_OWNER'
  | 'OLLAMA_BUILDER'
  | 'MODEL_REVIEWER'
  | 'QA_VALIDATOR'
  | 'MEMORY_CURATOR'
  | 'LEARNING_RECORDER'
  | 'DEVOPS_ENGINEER'
  | 'DOCUMENTATION_AGENT';

export interface ToolConnectionReceipt {
  toolId: ToolId;
  status: ConnectionStatus;
  evidenceRef?: string;
  verifiedAt?: string;
  localExecution: boolean;
  remoteExecution: boolean;
  productionAuthority: false;
  privateDataAllowed: boolean;
}

export interface CapabilityGenome {
  genomeId: string;
  agentRole: AgentRole;
  version: number;
  skills: readonly string[];
  reasoningStyles: readonly string[];
  languages: readonly string[];
  accessibilitySupports: readonly string[];
  culturalContextTags: readonly string[];
  permittedTools: readonly ToolId[];
  permittedSecurityClasses: readonly BrainSecurityClass[];
  pathwayIds: readonly string[];
  evidenceRefs: readonly string[];
  demographicTraitsUsedForDecisioning: false;
  biologicalGenomeClaim: false;
  modelWeightsMutated: false;
}

export interface ParallelUniversePlan {
  universeId: string;
  tenantId: string;
  purpose: 'SIMULATION' | 'SANDBOX' | 'SCENARIO_TEST';
  isolated: true;
  productionMutationAllowed: false;
  sharedRawPrivateDataAllowed: false;
  executionModel: 'CLASSICAL_SIMULATOR';
  quantumHardwareVerified: false;
}

export interface AgentAlignmentRecord {
  agentId: string;
  tenantId: string;
  role: AgentRole;
  genomeId: string;
  activePathwayIds: readonly string[];
  executionMode: ExecutionMode;
  requiredToolIds: readonly ToolId[];
  evidenceRefs: readonly string[];
  aligned: boolean;
  blockers: readonly string[];
}

export interface ScaleReadiness {
  targetUsers: number;
  measuredConcurrentUsers?: number;
  measuredRequestsPerSecond?: number;
  loadEvidenceRefs: readonly string[];
  billionsReady: boolean;
}

export interface CeoProgressPacket {
  ceo: 'Devin Xavier Haynes';
  generatedAt: string;
  verifiedConnections: readonly ToolId[];
  degradedOrOfflineConnections: readonly ToolId[];
  alignedAgentCount: number;
  blockedAgentCount: number;
  offlineCapable: boolean;
  onlineCapable: boolean;
  hybridCapable: boolean;
  quantumStatus: 'CLASSICAL_SIMULATION_ONLY';
  cloudExecutionVerified: boolean;
  scale: ScaleReadiness;
  decisions: readonly string[];
  risks: readonly string[];
  nextActions: readonly string[];
}

export const AGENTIC_BRAIN_ALIGNMENT_GUARDRAILS = {
  topSecretRemoteExecutionAllowed: false,
  crossTenantRawMemoryAllowed: false,
  modelWeightMutationAllowed: false,
  autonomousProductionMutationAllowed: false,
  biologicalRaceGenomeDecisioningAllowed: false,
  quantumAdvantageClaimAllowed: false,
  quantumHardwareVerified: false,
  requireEvidenceForVerifiedConnections: true,
  requireLoadEvidenceForBillionsReady: true,
} as const;

export function chooseExecutionMode(input: {
  securityClass: BrainSecurityClass;
  localToolsVerified: boolean;
  remoteToolsVerified: boolean;
  networkAvailable: boolean;
}): ExecutionMode {
  if (input.securityClass === 'TOP_SECRET') return input.localToolsVerified ? 'OFFLINE_LOCAL' : 'DENY';
  if (input.localToolsVerified && input.remoteToolsVerified && input.networkAvailable) return 'HYBRID';
  if (input.localToolsVerified) return 'OFFLINE_LOCAL';
  if (input.remoteToolsVerified && input.networkAvailable) return 'ONLINE_REMOTE';
  return 'DENY';
}

export function createCapabilityGenome(input: Omit<CapabilityGenome, 'demographicTraitsUsedForDecisioning' | 'biologicalGenomeClaim' | 'modelWeightsMutated'>): CapabilityGenome {
  if (!input.genomeId || input.version < 1 || input.evidenceRefs.length === 0) throw new Error('capability genome identity/version/evidence required');
  return Object.freeze({
    ...input,
    skills: Object.freeze([...new Set(input.skills)]),
    reasoningStyles: Object.freeze([...new Set(input.reasoningStyles)]),
    languages: Object.freeze([...new Set(input.languages)]),
    accessibilitySupports: Object.freeze([...new Set(input.accessibilitySupports)]),
    culturalContextTags: Object.freeze([...new Set(input.culturalContextTags)]),
    permittedTools: Object.freeze([...new Set(input.permittedTools)]),
    permittedSecurityClasses: Object.freeze([...new Set(input.permittedSecurityClasses)]),
    pathwayIds: Object.freeze([...new Set(input.pathwayIds)]),
    evidenceRefs: Object.freeze([...new Set(input.evidenceRefs)]),
    demographicTraitsUsedForDecisioning: false,
    biologicalGenomeClaim: false,
    modelWeightsMutated: false,
  });
}

export function buildParallelUniversePlan(input: { universeId: string; tenantId: string; purpose: ParallelUniversePlan['purpose'] }): ParallelUniversePlan {
  if (!input.universeId || !input.tenantId) throw new Error('universe and tenant identity required');
  return Object.freeze({
    ...input,
    isolated: true,
    productionMutationAllowed: false,
    sharedRawPrivateDataAllowed: false,
    executionModel: 'CLASSICAL_SIMULATOR',
    quantumHardwareVerified: false,
  });
}

export function alignAgent(input: {
  agentId: string;
  tenantId: string;
  role: AgentRole;
  genome: CapabilityGenome;
  requestedSecurityClass: BrainSecurityClass;
  requiredToolIds: readonly ToolId[];
  connectionReceipts: readonly ToolConnectionReceipt[];
  evidenceRefs: readonly string[];
  networkAvailable: boolean;
}): AgentAlignmentRecord {
  const blockers: string[] = [];
  if (input.genome.agentRole !== input.role) blockers.push('genome role mismatch');
  if (!input.genome.permittedSecurityClasses.includes(input.requestedSecurityClass)) blockers.push('security class not permitted by genome');
  for (const toolId of input.requiredToolIds) {
    if (!input.genome.permittedTools.includes(toolId)) blockers.push(`tool not permitted by genome: ${toolId}`);
  }

  const receipts = input.connectionReceipts.filter((receipt) => input.requiredToolIds.includes(receipt.toolId));
  const verified = receipts.filter((receipt) => receipt.status === 'VERIFIED' && receipt.evidenceRef);
  const localVerified = verified.some((receipt) => receipt.localExecution);
  const remoteVerified = verified.some((receipt) => receipt.remoteExecution);
  if (verified.length < new Set(input.requiredToolIds).size) blockers.push('one or more required tool connections are not verified');
  if (input.requestedSecurityClass === 'TOP_SECRET' && receipts.some((receipt) => receipt.remoteExecution)) blockers.push('TOP_SECRET cannot require remote execution');

  const executionMode = blockers.length === 0
    ? chooseExecutionMode({ securityClass: input.requestedSecurityClass, localToolsVerified: localVerified, remoteToolsVerified: remoteVerified, networkAvailable: input.networkAvailable })
    : 'DENY';
  if (executionMode === 'DENY' && blockers.length === 0) blockers.push('no safe execution path available');

  return Object.freeze({
    agentId: input.agentId,
    tenantId: input.tenantId,
    role: input.role,
    genomeId: input.genome.genomeId,
    activePathwayIds: Object.freeze([...input.genome.pathwayIds]),
    executionMode,
    requiredToolIds: Object.freeze([...new Set(input.requiredToolIds)]),
    evidenceRefs: Object.freeze([...new Set(input.evidenceRefs)]),
    aligned: blockers.length === 0 && executionMode !== 'DENY',
    blockers: Object.freeze(blockers),
  });
}

export function assessScaleReadiness(input: Omit<ScaleReadiness, 'billionsReady'>): ScaleReadiness {
  const billionsReady = input.targetUsers >= 1_000_000_000
    && (input.measuredConcurrentUsers ?? 0) > 0
    && (input.measuredRequestsPerSecond ?? 0) > 0
    && input.loadEvidenceRefs.length > 0;
  return Object.freeze({ ...input, loadEvidenceRefs: Object.freeze([...input.loadEvidenceRefs]), billionsReady });
}

export function buildCeoProgressPacket(input: {
  generatedAt: string;
  connections: readonly ToolConnectionReceipt[];
  alignments: readonly AgentAlignmentRecord[];
  scale: ScaleReadiness;
  cloudExecutionVerified: boolean;
}): CeoProgressPacket {
  const verifiedConnections = input.connections.filter((c) => c.status === 'VERIFIED' && c.evidenceRef).map((c) => c.toolId);
  const degradedOrOfflineConnections = input.connections.filter((c) => c.status === 'DEGRADED' || c.status === 'OFFLINE').map((c) => c.toolId);
  const alignedAgentCount = input.alignments.filter((a) => a.aligned).length;
  const blockedAgentCount = input.alignments.length - alignedAgentCount;
  const local = input.connections.some((c) => c.status === 'VERIFIED' && c.localExecution && c.evidenceRef);
  const remote = input.connections.some((c) => c.status === 'VERIFIED' && c.remoteExecution && c.evidenceRef);

  const risks: string[] = [];
  if (blockedAgentCount > 0) risks.push(`${blockedAgentCount} agent(s) blocked by alignment or connection evidence`);
  if (!input.cloudExecutionVerified) risks.push('cloud execution not verified by runtime receipt');
  if (!input.scale.billionsReady) risks.push('billions-user readiness not proven by measured load evidence');

  return Object.freeze({
    ceo: 'Devin Xavier Haynes',
    generatedAt: input.generatedAt,
    verifiedConnections: Object.freeze([...new Set(verifiedConnections)]),
    degradedOrOfflineConnections: Object.freeze([...new Set(degradedOrOfflineConnections)]),
    alignedAgentCount,
    blockedAgentCount,
    offlineCapable: local,
    onlineCapable: remote,
    hybridCapable: local && remote,
    quantumStatus: 'CLASSICAL_SIMULATION_ONLY',
    cloudExecutionVerified: input.cloudExecutionVerified,
    scale: input.scale,
    decisions: Object.freeze([
      'Prefer verified local execution for sensitive work',
      'Use remote models only through evidence-backed minimized contexts',
      'Promote pathways only after evaluation, review, approval, and rollback evidence',
      'Treat Universes as isolated tenants/sandboxes, not shared raw-data pools',
    ]),
    risks: Object.freeze(risks),
    nextActions: Object.freeze([
      'Verify live Ollama receipt from localhost runtime',
      'Mirror 12D-90 and 12D-91 to GitHub to remove repository drift',
      'Resolve legacy TypeScript surface errors',
      'Add measured load, failover, and offline/online continuity tests before scale claims',
    ]),
  });
}
