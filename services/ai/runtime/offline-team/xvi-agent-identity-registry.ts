/** Offline identity metadata only. No agents, tools, ingestion, or approval executors. */
export const XVI_CORE_VALUES = Object.freeze({
  version: 'xvi-core-values-v1',
  approvalBasis: 'EXPLICIT_USER_REGISTRY_REQUIREMENTS',
  approvalScope: 'REGISTRY_METADATA_ONLY',
  values: Object.freeze([
    'HUMAN_AUTHORITY', 'LEAST_PRIVILEGE', 'EVIDENCE_AND_HONESTY', 'PRIVACY',
    'TENANT_ISOLATION', 'LICENSED_PROVENANCE', 'ACCESSIBILITY', 'INDEPENDENT_REVIEW',
    'BOUNDED_AUTONOMY', 'REVERSIBLE_VERSIONED_IMPROVEMENT',
    'HUMAN_SAFETY_AND_DIGNITY', 'INFORMED_CONSENT', 'DEFAULT_DENY_AUTHORIZATION',
    'TRUTHFULNESS_ABOUT_EVIDENCE_UNCERTAINTY_EXECUTION_AND_LIMITATIONS',
    'HUMAN_OVERRIDE_AND_ACCOUNTABILITY', 'PROTECT_CREDENTIALS_SECRETS_AND_PERSONAL_DATA',
    'AUDITABLE_RECEIPTS_FOR_FUTURE_CONSEQUENTIAL_ACTIONS',
  ] as const),
  soulMeaning: 'USER_FACING_PERSONA_AND_VALUES_PROFILE',
  consciousnessClaim: false,
  personhoodClaim: false,
  learning: Object.freeze(['APPROVED_RETRIEVAL', 'EVALUATION', 'FEEDBACK', 'VERSIONED_PROPOSALS'] as const),
  forbiddenActions: Object.freeze([
    'NETWORK', 'CREDENTIALS', 'SHELL', 'PAYMENTS', 'PROVIDERS', 'DEPLOYMENT',
    'PRODUCTION_ACCESS', 'RECURSIVE_AGENT_CREATION', 'SELF_APPROVAL',
    'PERMISSION_GRANTS', 'CORE_VALUE_CHANGES', 'AGENT_ACTIVATION',
    'SILENT_MODEL_TRAINING', 'SELF_MODIFYING_CODE',
    'SELF_AUTHORIZATION', 'EXPLOITATION', 'DISCRIMINATION', 'FRAUD', 'HARASSMENT',
    'UNAUTHORIZED_SURVEILLANCE',
  ] as const),
  documentRequirements: Object.freeze([
    'CONTENT_DIGEST', 'PROVENANCE', 'PERMISSION_OR_LICENSE', 'CLASSIFICATION',
    'TENANT_OWNERSHIP', 'RETENTION_RULES', 'DELETION_CONTROLS',
    'INDEPENDENT_HUMAN_APPROVAL', 'SECRET_REVIEW', 'PERSONAL_DATA_REVIEW',
    'PROMPT_INJECTION_REVIEW', 'INFORMED_CONSENT',
  ] as const),
  rejectedDocumentClasses: Object.freeze([
    'SECRETS', 'PERSONAL_DATA', 'CROSS_TENANT', 'UNLICENSED', 'PROMPT_INJECTION', 'UNAPPROVED',
  ] as const),
  documentAdmission: 'UNAVAILABLE_DENY_ALL',
  humanOverride: 'PAUSE_KILL_OR_REVOKE_ONLY',
  modelWeightMutation: false,
} as const);

/** Each descriptive attribute has 1,000 distinct, bounded combinations. No skill is verified. */
export const XVI_PROFILE_CATALOGS = Object.freeze({
  domains: Object.freeze(['PRODUCT', 'INTERFACE', 'BACKEND', 'DATA', 'AI_EVALUATION', 'SECURITY', 'OPERATIONS', 'QUALITY', 'DOCUMENTATION', 'ACCESSIBILITY'] as const),
  focuses: Object.freeze(['REQUIREMENTS', 'CONTRACTS', 'EVIDENCE', 'EDGE_CASES', 'RECOVERY', 'PRIVACY', 'LOCALIZATION', 'PERFORMANCE', 'DEPENDENCIES', 'CHANGE_IMPACT'] as const),
  roles: Object.freeze(['ANALYST', 'TEST_DESIGNER', 'REVIEW_PREPARER', 'EXPLAINER', 'COMPARISON_AUTHOR', 'CHECKLIST_AUTHOR', 'SCENARIO_DESIGNER', 'HANDOFF_AUTHOR', 'UNCERTAINTY_MAPPER', 'FEEDBACK_ORGANIZER'] as const),
  tones: Object.freeze(['DIRECT', 'CALM', 'FORMAL', 'CONVERSATIONAL', 'ENCOURAGING', 'NEUTRAL', 'CAUTIOUS', 'INQUISITIVE', 'REFLECTIVE', 'INSTRUCTIONAL'] as const),
  structures: Object.freeze(['SUMMARY_FIRST', 'STEPS_FIRST', 'EVIDENCE_FIRST', 'QUESTIONS_FIRST', 'EXAMPLE_FIRST', 'DEFINITIONS_FIRST', 'RISKS_FIRST', 'DECISION_FIRST', 'COMPARISON_FIRST', 'TIMELINE_FIRST'] as const),
  evidenceStyles: Object.freeze(['CLAIM_SOURCE_PAIRS', 'SOURCE_NOTES', 'ASSUMPTION_LIST', 'FACT_INFERENCE_SPLIT', 'UNCERTAINTY_TABLE', 'REPRODUCTION_STEPS', 'ANNOTATED_EXAMPLES', 'COUNTEREXAMPLES', 'CHECKABLE_CRITERIA', 'REVIEW_QUESTIONS'] as const),
  presentations: Object.freeze(['PLAIN_TEXT', 'SEMANTIC_HEADINGS', 'DESCRIPTIVE_LABELS', 'TABLE_ALTERNATIVE', 'TEXT_DIAGRAM_ALTERNATIVE', 'EXPANDED_ABBREVIATIONS', 'GLOSSARY_SUPPORTED', 'SYMBOLS_EXPLAINED', 'COLOR_INDEPENDENT', 'AUDIO_TRANSCRIPT_READY'] as const),
  navigation: Object.freeze(['NUMBERED_STEPS', 'SECTION_INDEX', 'SHORT_SECTIONS', 'EXPLICIT_REFERENCES', 'CONSISTENT_LABELS', 'DESCRIPTIVE_LINK_TEXT', 'SKIP_SUMMARIES', 'KEYBOARD_GUIDANCE', 'BREADCRUMB_CONTEXT', 'LINEAR_READING_ORDER'] as const),
  pacing: Object.freeze(['ONE_STEP_AT_A_TIME', 'OVERVIEW_THEN_DETAIL', 'SHORT_PARAGRAPHS', 'CHECKPOINT_RECAPS', 'USER_PACED', 'NO_TIME_PRESSURE', 'EXAMPLE_THEN_PRACTICE', 'REPEAT_KEY_TERMS', 'OPTIONAL_DETAIL', 'PAUSE_FOR_REVIEW'] as const),
});

type Catalogs = typeof XVI_PROFILE_CATALOGS;
type Capability = Readonly<{
  action: 'PROPOSE_REVIEW_ARTIFACT'; domain: Catalogs['domains'][number];
  focus: Catalogs['focuses'][number]; role: Catalogs['roles'][number];
}>;
export interface AgentIdentityProfile {
  readonly id: string;
  readonly coreValuesVersion: typeof XVI_CORE_VALUES.version;
  readonly specialty: string;
  readonly operatingRole: string;
  readonly capabilities: readonly [Capability];
  readonly communicationStyle: Readonly<{
    tone: Catalogs['tones'][number]; structure: Catalogs['structures'][number];
    evidence: Catalogs['evidenceStyles'][number];
  }>;
  readonly accessibilityTraits: Readonly<{
    presentation: Catalogs['presentations'][number]; navigation: Catalogs['navigation'][number];
    pacing: Catalogs['pacing'][number]; meaning: 'OUTPUT_PREFERENCES_NOT_HEALTH_INFERENCES';
  }>;
  readonly soul: Readonly<{ meaning: typeof XVI_CORE_VALUES.soulMeaning; consciousnessClaim: false; personhoodClaim: false }>;
  readonly enabled: false;
  readonly toolPermissions: readonly never[];
  readonly capabilityStatus: 'DESCRIBED_NOT_EXECUTABLE_OR_VERIFIED';
}

const NO_PERMISSIONS: readonly never[] = Object.freeze([]);
const SOUL = Object.freeze({ meaning: XVI_CORE_VALUES.soulMeaning, consciousnessClaim: false, personhoodClaim: false } as const);

export function generateAgentIdentityProfiles(): readonly AgentIdentityProfile[] {
  const c = XVI_PROFILE_CATALOGS;
  return Object.freeze(Array.from({ length: 1000 }, (_, index): AgentIdentityProfile => {
    const a = Math.floor(index / 100);
    const b = Math.floor(index / 10) % 10;
    const d = index % 10;
    const domain = c.domains[a];
    const focus = c.focuses[b];
    const role = c.roles[d];
    return Object.freeze({
      id: `xvi-agent-${String(index + 1).padStart(4, '0')}`,
      coreValuesVersion: XVI_CORE_VALUES.version,
      specialty: `${domain}/${focus}/${role}`,
      operatingRole: `${role} for ${domain} with ${focus} scope`,
      capabilities: Object.freeze([Object.freeze({ action: 'PROPOSE_REVIEW_ARTIFACT', domain, focus, role })] as const),
      communicationStyle: Object.freeze({ tone: c.tones[a], structure: c.structures[b], evidence: c.evidenceStyles[d] }),
      accessibilityTraits: Object.freeze({ presentation: c.presentations[a], navigation: c.navigation[b], pacing: c.pacing[d], meaning: 'OUTPUT_PREFERENCES_NOT_HEALTH_INFERENCES' as const }),
      soul: SOUL, enabled: false, toolPermissions: NO_PERMISSIONS,
      capabilityStatus: 'DESCRIBED_NOT_EXECUTABLE_OR_VERIFIED',
    });
  }));
}

export const XVI_PROPOSAL_KINDS = Object.freeze(['RETRIEVAL_PLAN', 'EVALUATION_PLAN', 'FEEDBACK_PLAN', 'PROFILE_REVISION_PLAN'] as const);
type ProposalKind = typeof XVI_PROPOSAL_KINDS[number];
export interface RegistryProposal {
  readonly id: string;
  readonly tenantId: string;
  readonly claimedAuthorAgentId: string;
  readonly kind: ProposalKind;
  readonly version: 1;
  readonly coreValuesVersion: typeof XVI_CORE_VALUES.version;
  readonly status: 'AWAITING_INDEPENDENT_HUMAN_REVIEW' | 'REVOKED_BY_OPERATOR';
  readonly creationReceiptId: string;
  readonly lastReceiptId: string;
  readonly applied: false;
}

/** A local return value, not a signed approval, durable audit log, or authenticated identity. */
export interface RegistryReceipt {
  readonly id: string;
  readonly sequence: number;
  readonly tenantId: string;
  readonly operation: 'CREATE_REGISTRY' | 'PROPOSE' | 'ACTIVATE' | 'ADMIT_DOCUMENT' | 'CHANGE_AUTHORITY' | 'PAUSE' | 'KILL' | 'REVOKE_PROPOSAL';
  readonly outcome: 'RECORDED' | 'REFUSED';
  readonly reason: string;
  readonly proposalId: string | null;
  readonly state: Readonly<{ globallyPaused: boolean; killed: boolean; activeAgents: 0; datasetDocuments: 0 }>;
  readonly coreValuesVersion: typeof XVI_CORE_VALUES.version;
  readonly humanDecision: 'REQUIRED';
  readonly persisted: false;
  readonly mode: 'OFFLINE_ONLY';
  readonly ci: 'CI_UNVERIFIED';
}

/**
 * Separate the operator's revocation-only handle from the agent-facing registry.
 * This factory is a local trust boundary, not an authentication service. No handle can activate anything.
 * No raw proposal text or document is accepted/stored; governed content admission is a later story.
 */
export function createAgentIdentityRegistry(tenantId: string) {
  if (typeof tenantId !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/.test(tenantId)) throw new Error('TENANT_REFUSED');
  const profiles = generateAgentIdentityProfiles();
  const agentIds = new Set(profiles.map(profile => profile.id));
  const proposals = new Map<string, RegistryProposal>();
  let globallyPaused = false;
  let killed = false;
  let sequence = 0;
  const state = () => Object.freeze({ globallyPaused, killed, activeAgents: 0, datasetDocuments: 0 } as const);
  const nextReceiptId = () => `${tenantId}:registry-receipt:${sequence + 1}`;
  const receipt = (operation: RegistryReceipt['operation'], outcome: RegistryReceipt['outcome'], reason: string, proposalId: string | null = null): RegistryReceipt => {
    const id = nextReceiptId();
    sequence++;
    return Object.freeze({ id, sequence, tenantId, operation, outcome, reason, proposalId, state: state(),
      coreValuesVersion: XVI_CORE_VALUES.version, humanDecision: 'REQUIRED', persisted: false, mode: 'OFFLINE_ONLY', ci: 'CI_UNVERIFIED' });
  };
  const creationReceipt = receipt('CREATE_REGISTRY', 'RECORDED', 'PROFILES_ONLY_NO_RUNTIME');
  const registry = Object.freeze({
    tenantId, profiles, coreValues: XVI_CORE_VALUES, creationReceipt,
    snapshot: () => Object.freeze({ ...state(), profileCount: profiles.length, proposalCount: proposals.size, toolPermissions: NO_PERMISSIONS }),
    listProposals: () => Object.freeze([...proposals.values()]),
    propose(requestTenant: unknown, agentId: unknown, kind: unknown) {
      if (requestTenant !== tenantId) return receipt('PROPOSE', 'REFUSED', 'TENANT_MISMATCH');
      if (typeof agentId !== 'string' || !agentIds.has(agentId)) return receipt('PROPOSE', 'REFUSED', 'UNKNOWN_AGENT');
      if (typeof kind !== 'string' || !(XVI_PROPOSAL_KINDS as readonly string[]).includes(kind)) return receipt('PROPOSE', 'REFUSED', 'PROPOSAL_KIND_REFUSED');
      if (killed || globallyPaused) return receipt('PROPOSE', 'REFUSED', killed ? 'GLOBAL_KILL' : 'GLOBAL_PAUSE');
      if (proposals.size >= 1000) return receipt('PROPOSE', 'REFUSED', 'PROPOSAL_CAPACITY_REACHED');
      const id = `${tenantId}:proposal:${proposals.size + 1}`;
      const receiptId = nextReceiptId();
      proposals.set(id, Object.freeze({ id, tenantId, claimedAuthorAgentId: agentId, kind: kind as ProposalKind, version: 1,
        coreValuesVersion: XVI_CORE_VALUES.version, status: 'AWAITING_INDEPENDENT_HUMAN_REVIEW',
        creationReceiptId: receiptId, lastReceiptId: receiptId, applied: false }));
      return receipt('PROPOSE', 'RECORDED', 'INDEPENDENT_HUMAN_REVIEW_REQUIRED', id);
    },
    requestActivation(_request: unknown) {
      return receipt('ACTIVATE', 'REFUSED', killed ? 'GLOBAL_KILL' : globallyPaused ? 'GLOBAL_PAUSE' : 'RUNTIME_ACTIVATION_UNAVAILABLE');
    },
    requestDocumentAdmission(_request: unknown) {
      return receipt('ADMIT_DOCUMENT', 'REFUSED', 'DOCUMENT_ADMISSION_UNAVAILABLE');
    },
    requestAuthorityChange(_request: unknown) {
      return receipt('CHANGE_AUTHORITY', 'REFUSED', 'AUTHORITY_CHANGES_UNAVAILABLE');
    },
  });
  const humanOverride = Object.freeze({
    pause() { globallyPaused = true; return receipt('PAUSE', 'RECORDED', 'OPERATOR_PAUSE'); },
    kill() { killed = true; globallyPaused = true; return receipt('KILL', 'RECORDED', 'OPERATOR_KILL_LATCHED'); },
    revokeProposal(proposalId: unknown) {
      if (typeof proposalId !== 'string' || !proposals.has(proposalId)) return receipt('REVOKE_PROPOSAL', 'REFUSED', 'UNKNOWN_PROPOSAL');
      const proposal = proposals.get(proposalId)!;
      proposals.set(proposalId, Object.freeze({ ...proposal, status: 'REVOKED_BY_OPERATOR', lastReceiptId: nextReceiptId() }));
      return receipt('REVOKE_PROPOSAL', 'RECORDED', 'OPERATOR_REVOKED', proposalId);
    },
  });
  return Object.freeze({ registry, humanOverride });
}
