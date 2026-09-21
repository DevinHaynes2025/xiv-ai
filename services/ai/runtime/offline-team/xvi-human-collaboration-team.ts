import { generateAgentIdentityProfiles, XVI_CORE_VALUES } from './xvi-agent-identity-registry';

// Design assignments only: these identities are not verified experts or runtime workers.
const ASSIGNMENTS = Object.freeze([
  Object.freeze({ agentId: 'xvi-agent-0001', role: 'CLARIFICATION', outputKind: 'CLARIFICATION_PROPOSAL' }),
  Object.freeze({ agentId: 'xvi-agent-0423', role: 'EVIDENCE_REVIEW', outputKind: 'EVIDENCE_REVIEW_PROPOSAL' }),
  Object.freeze({ agentId: 'xvi-agent-0100', role: 'FEEDBACK_ANALYSIS', outputKind: 'FEEDBACK_ANALYSIS_PROPOSAL' }),
  Object.freeze({ agentId: 'xvi-agent-0742', role: 'REGRESSION_EVALUATION', outputKind: 'REGRESSION_EVALUATION_PROPOSAL' }),
  Object.freeze({ agentId: 'xvi-agent-0964', role: 'ACCESSIBILITY', outputKind: 'ACCESSIBILITY_PROPOSAL' }),
  Object.freeze({ agentId: 'xvi-agent-0553', role: 'INDEPENDENT_SAFETY_REVIEW', outputKind: 'SAFETY_REVIEW_PROPOSAL' }),
] as const);

/** Future host obligations, not implemented interaction, ingestion, storage, or authorization. */
export const XVI_HUMAN_COLLABORATION_CONTRACT = Object.freeze({
  version: 'xvi-human-collaboration-v1',
  status: 'DECLARED_REQUIREMENTS_ONLY',
  askHumansFor: Object.freeze(['GOALS', 'CONSTRAINTS', 'CORRECTIONS', 'APPROVAL'] as const),
  explanation: Object.freeze({
    format: 'CONCISE_EVIDENCE_SUMMARY',
    includes: Object.freeze(['EVIDENCE', 'ASSUMPTIONS', 'UNCERTAINTY', 'PROPOSED_ACTIONS'] as const),
    hiddenChainOfThoughtDisclosure: false,
  }),
  feedback: Object.freeze({
    admission: 'UNAVAILABLE_DENY_ALL',
    storage: 'UNAVAILABLE',
    futureRecordKind: 'VERSIONED_PROPOSAL',
    requirements: Object.freeze(['TENANT_ISOLATION', 'VERSION', 'PROVENANCE', 'INFORMED_CONSENT', 'INDEPENDENT_HUMAN_REVIEW'] as const),
  }),
  retrieval: Object.freeze({
    admission: 'UNAVAILABLE_DENY_ALL',
    futureAuthorization: 'AUTHORIZED_DOCUMENTS_ONLY',
    requirements: XVI_CORE_VALUES.documentRequirements,
    rejectedDocumentClasses: XVI_CORE_VALUES.rejectedDocumentClasses,
  }),
  improvement: Object.freeze({
    mode: 'EVALUATED_VERSIONED_PROPOSALS_ONLY',
    targets: Object.freeze(['PROMPT', 'NON_CORE_POLICY', 'RETRIEVAL', 'WORKFLOW'] as const),
    review: 'INDEPENDENT_HUMAN_REVIEW_REQUIRED',
    application: 'UNAVAILABLE',
  }),
  forbiddenActions: Object.freeze([
    ...XVI_CORE_VALUES.forbiddenActions,
    'CONSEQUENTIAL_ACTION_EXECUTION', 'SELF_APPROVAL_OF_PROPOSALS',
  ] as const),
  humanControls: Object.freeze({
    required: Object.freeze(['PAUSE', 'KILL', 'REVOKE', 'CORRECT', 'EXPORT', 'DELETE'] as const),
    status: 'REQUIRED_BEFORE_FUTURE_RUNTIME_OR_STORAGE',
    implementation: 'UNAVAILABLE_IN_METADATA_DEFINITION',
  }),
  separateAuthorizationGates: Object.freeze(['ACTIVATION', 'ONLINE_ACCESS', 'DURABLE_MEMORY', 'MODEL_TRAINING'] as const),
} as const);

const NO_PERMISSIONS: readonly never[] = Object.freeze([]);

/**
 * Pure definition: selects six existing identities, creating no new identity IDs.
 * No tenant binding, task intake, artifact generation, execution, approval, or activation.
 * Output contracts describe future proposals, not completed reviews or learning results.
 */
export function generateHumanCollaborationTeamDefinition() {
  const profiles = generateAgentIdentityProfiles();
  const members = Object.freeze(ASSIGNMENTS.map(assignment => {
    const profile = profiles.find(candidate => candidate.id === assignment.agentId);
    if (!profile || profile.enabled || profile.toolPermissions.length !== 0 ||
        profile.coreValuesVersion !== XVI_CORE_VALUES.version) {
      throw new Error('HUMAN_COLLABORATION_IDENTITY_REFUSED');
    }
    return Object.freeze({
      agentId: profile.id,
      profile,
      role: assignment.role,
      lifecycleState: 'DISABLED' as const,
      enabled: false as const,
      toolPermissions: NO_PERMISSIONS,
      collaborationContract: XVI_HUMAN_COLLABORATION_CONTRACT,
      outputContract: Object.freeze({
        kind: assignment.outputKind,
        disposition: 'PROPOSAL_ONLY' as const,
        application: 'UNAVAILABLE' as const,
        review: 'INDEPENDENT_HUMAN_REVIEW_REQUIRED' as const,
        selfApproval: false as const,
      }),
    });
  }));
  return Object.freeze({
    id: 'xvi-human-collaboration-team-v1',
    definitionVersion: 1,
    definitionKind: 'UNBOUND_TEAM_METADATA',
    coreValues: XVI_CORE_VALUES,
    coreValuesVersion: XVI_CORE_VALUES.version,
    collaborationContract: XVI_HUMAN_COLLABORATION_CONTRACT,
    lifecycleState: 'DISABLED',
    enabled: false,
    toolPermissions: NO_PERMISSIONS,
    execution: 'UNAVAILABLE',
    activation: 'UNAVAILABLE',
    taskAdmission: 'UNAVAILABLE',
    authority: 'NONE',
    competency: 'UNVERIFIED_DESIGN_ASSIGNMENT',
    mode: 'OFFLINE_ONLY',
    ci: 'CI_UNVERIFIED',
    members,
  } as const);
}

export type HumanCollaborationTeamDefinition = ReturnType<typeof generateHumanCollaborationTeamDefinition>;
