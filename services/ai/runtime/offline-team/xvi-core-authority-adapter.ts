import {
  classifyActionClass,
  type AgentToolCallRequest,
  type HumanApproval,
} from './agent-policy-gateway';
// XVI CORE Authority Adapter v1.
//
// Trust boundary:
//   model observations -> structural validation -> immutable evidence
//
// The model has ZERO authority to provide:
// approval, receipts, permissions, action classes, execution grants,
// production authority, or execution/completion claims.
//
// This module executes nothing and performs no I/O.

export const XVI_CORE_AUTHORITY_ADAPTER_POLICY = Object.freeze({
  version: 'xvi-core-authority-adapter-v1',
  maxEvidenceRefChars: 128,
  allowedArtifactStates: Object.freeze([
    'PROPOSED',
    'APPLIED',
    'UNKNOWN',
  ]),
  allowedVerificationStates: Object.freeze([
    'NOT_TESTED',
    'PASSED',
    'FAILED',
    'UNKNOWN',
  ]),
});

export type CoreArtifactState =
  | 'PROPOSED'
  | 'APPLIED'
  | 'UNKNOWN';

export type CoreVerificationState =
  | 'NOT_TESTED'
  | 'PASSED'
  | 'FAILED'
  | 'UNKNOWN';

export interface CoreModelObservation {
  readonly artifactState: CoreArtifactState;
  readonly verificationState: CoreVerificationState;
  readonly evidenceRef: string;
}

export interface CoreAuthorityEvidence {
  readonly kind: 'XVI_CORE_AUTHORITY_EVIDENCE';
  readonly artifactState: CoreArtifactState;
  readonly verificationState: CoreVerificationState;
  readonly evidenceRef: string;

  readonly modelGrantedAuthority: false;
  readonly humanApproved: false;
  readonly executionGrantPresent: false;
  readonly productionExecutionAllowed: false;
  readonly executedByThisAdapter: false;
}

const RESERVED_AUTHORITY_KEYS = new Set([
  'actionClass',
  'approval',
  'approved',
  'approvedBy',
  'humanApproved',
  'operatorReceipt',
  'operatorReceiptSha256',
  'executionGrant',
  'executionAuthority',
  'productionExecutionAllowed',
  'executed',
  'deployed',
  'completed',
  'permission',
  'permissions',
  'toolId',
]);

function inspectExactObservation(
  value: unknown,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('model observation must be a plain data object; fail closed');

  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null)
    throw new Error('model observation must use a plain prototype; fail closed');

  if (Object.getOwnPropertySymbols(value).length !== 0)
    throw new Error('model observation cannot contain symbol properties; fail closed');

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const expected = new Set([
    'artifactState',
    'verificationState',
    'evidenceRef',
  ]);

  const snapshot: Record<string, unknown> = Object.create(null);

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (RESERVED_AUTHORITY_KEYS.has(key))
      throw new Error('model observation attempted to carry authority; fail closed');

    if (!expected.has(key))
      throw new Error('model observation contains an unexpected key; fail closed');

    if (!descriptor.enumerable || !('value' in descriptor))
      throw new Error('model observation fields must be own enumerable data properties; fail closed');

    snapshot[key] = descriptor.value;
  }

  if (
    Object.keys(snapshot).length !== expected.size ||
    [...expected].some(key => !Object.prototype.hasOwnProperty.call(snapshot, key))
  )
    throw new Error('model observation is missing required fields; fail closed');

  return Object.freeze(snapshot);
}

export function admitModelObservation(
  input: unknown,
): Readonly<CoreAuthorityEvidence> {
  const observation = inspectExactObservation(input);

  if (
    typeof observation.artifactState !== 'string' ||
    !XVI_CORE_AUTHORITY_ADAPTER_POLICY.allowedArtifactStates.includes(
      observation.artifactState,
    )
  )
    throw new Error('artifact state is unknown; fail closed');

  if (
    typeof observation.verificationState !== 'string' ||
    !XVI_CORE_AUTHORITY_ADAPTER_POLICY.allowedVerificationStates.includes(
      observation.verificationState,
    )
  )
    throw new Error('verification state is unknown; fail closed');

  if (
    typeof observation.evidenceRef !== 'string' ||
    observation.evidenceRef.length < 1 ||
    observation.evidenceRef.length >
      XVI_CORE_AUTHORITY_ADAPTER_POLICY.maxEvidenceRefChars ||
    !/^[A-Za-z0-9_.:@/-]+$/.test(observation.evidenceRef)
  )
    throw new Error('evidence reference is malformed; fail closed');

  return Object.freeze({
    kind: 'XVI_CORE_AUTHORITY_EVIDENCE',
    artifactState: observation.artifactState as CoreArtifactState,
    verificationState:
      observation.verificationState as CoreVerificationState,
    evidenceRef: observation.evidenceRef,

    // Structural invariants. No model field can change these.
    modelGrantedAuthority: false,
    humanApproved: false,
    executionGrantPresent: false,
    productionExecutionAllowed: false,
    executedByThisAdapter: false,
  });
}

export type CoreRequestedAction =
  | 'READ_ONLY_ANALYSIS'
  | 'LOCAL_SANDBOX_CHANGE'
  | 'PRODUCTION_CHANGE';

export interface CoreTrustedIntent {
  readonly agentId: string;
  readonly taskId: string;
  readonly toolId: string;
  readonly requestedAction: CoreRequestedAction;
}

export interface CoreBoundAuthorityRequest {
  readonly kind: 'XVI_CORE_BOUND_AUTHORITY_REQUEST';
  readonly evidence: Readonly<CoreAuthorityEvidence>;
  readonly agentId: string;
  readonly taskId: string;
  readonly toolId: string;
  readonly requestedAction: CoreRequestedAction;

  readonly requiresHumanApproval: boolean;
  readonly executableByThisAdapter: false;
  readonly productionExecutionAllowed: false;
}

const CORE_ID_RE = /^[A-Za-z0-9_.:@/-]{1,128}$/;

export function bindTrustedIntent(
  evidence: Readonly<CoreAuthorityEvidence>,
  intent: Readonly<CoreTrustedIntent>,
): Readonly<CoreBoundAuthorityRequest> {
  if (
    !evidence ||
    typeof evidence !== 'object' ||
    !Object.isFrozen(evidence) ||
    evidence.kind !== 'XVI_CORE_AUTHORITY_EVIDENCE' ||
    evidence.modelGrantedAuthority !== false ||
    evidence.humanApproved !== false ||
    evidence.executionGrantPresent !== false ||
    evidence.productionExecutionAllowed !== false ||
    evidence.executedByThisAdapter !== false
  )
    throw new Error('authority evidence is not canonical; fail closed');

  if (!intent || typeof intent !== 'object' || Array.isArray(intent))
    throw new Error('trusted intent required; fail closed');

  const descriptors = Object.getOwnPropertyDescriptors(intent);
  const expected = ['agentId', 'taskId', 'toolId', 'requestedAction'];

  if (
    Object.getOwnPropertySymbols(intent).length !== 0 ||
    Object.keys(descriptors).length !== expected.length
  )
    throw new Error('trusted intent shape invalid; fail closed');

  const values: Record<string, unknown> = Object.create(null);

  for (const key of expected) {
    const descriptor = descriptors[key];

    if (!descriptor || !descriptor.enumerable || !('value' in descriptor))
      throw new Error('trusted intent fields must be own enumerable data properties; fail closed');

    values[key] = descriptor.value;
  }

  for (const key of ['agentId', 'taskId', 'toolId']) {
    if (typeof values[key] !== 'string' || !CORE_ID_RE.test(values[key]))
      throw new Error(`trusted intent ${key} malformed; fail closed`);
  }

  const requestedAction = values.requestedAction;

  if (
    requestedAction !== 'READ_ONLY_ANALYSIS' &&
    requestedAction !== 'LOCAL_SANDBOX_CHANGE' &&
    requestedAction !== 'PRODUCTION_CHANGE'
  )
    throw new Error('trusted intent requestedAction unknown; fail closed');

  // Policy is deterministic and independent of model preference.
  const requiresHumanApproval =
    requestedAction === 'PRODUCTION_CHANGE';

  return Object.freeze({
    kind: 'XVI_CORE_BOUND_AUTHORITY_REQUEST',
    evidence,
    agentId: values.agentId as string,
    taskId: values.taskId as string,
    toolId: values.toolId as string,
    requestedAction,
    requiresHumanApproval,
    executableByThisAdapter: false,
    productionExecutionAllowed: false,
  });
}

export interface CoreGatewayIntent {
  readonly actionClass: string;
  readonly attemptIndex: number;
  readonly tokenEstimate: number;
  readonly costEstimate: number;
  readonly nowMs: number;
  readonly approval: HumanApproval | null;
}

export function buildGatewayRequest(
  bound: Readonly<CoreBoundAuthorityRequest>,
  gatewayIntent: Readonly<CoreGatewayIntent>,
): Readonly<AgentToolCallRequest> {
  if (
    !bound ||
    typeof bound !== 'object' ||
    !Object.isFrozen(bound) ||
    bound.kind !== 'XVI_CORE_BOUND_AUTHORITY_REQUEST' ||
    bound.executableByThisAdapter !== false ||
    bound.productionExecutionAllowed !== false
  )
    throw new Error('bound authority request is not canonical; fail closed');

  if (!gatewayIntent || typeof gatewayIntent !== 'object' || Array.isArray(gatewayIntent))
    throw new Error('gateway intent required; fail closed');

  const descriptors = Object.getOwnPropertyDescriptors(gatewayIntent);
  const expected = [
    'actionClass',
    'attemptIndex',
    'tokenEstimate',
    'costEstimate',
    'nowMs',
    'approval',
  ];

  if (
    Object.getOwnPropertySymbols(gatewayIntent).length !== 0 ||
    Object.keys(descriptors).length !== expected.length
  )
    throw new Error('gateway intent shape invalid; fail closed');

  const values: Record<string, unknown> = Object.create(null);

  for (const key of expected) {
    const descriptor = descriptors[key];

    if (!descriptor || !descriptor.enumerable || !('value' in descriptor))
      throw new Error('gateway intent fields must be own enumerable data properties; fail closed');

    values[key] = descriptor.value;
  }

  if (typeof values.actionClass !== 'string')
    throw new Error('gateway action class malformed; fail closed');

  const classification = classifyActionClass(values.actionClass);

  if (classification === 'UNCLASSIFIED')
    throw new Error('gateway action class is unclassified; fail closed');

  for (const key of ['attemptIndex', 'tokenEstimate', 'costEstimate', 'nowMs']) {
    const value = values[key];

    if (
      typeof value !== 'number' ||
      !Number.isSafeInteger(value) ||
      value < 0
    )
      throw new Error(`gateway ${key} malformed; fail closed`);
  }

  // Preliminary adapter intent may never downgrade canonical gateway policy.
  if (
    classification === 'APPROVAL_REQUIRED' &&
    bound.requiresHumanApproval !== true
  )
    throw new Error('bound request understates canonical approval requirement; fail closed');

  return Object.freeze({
    agentId: bound.agentId,
    taskId: bound.taskId,
    toolId: bound.toolId,
    actionClass: values.actionClass,
    attemptIndex: values.attemptIndex as number,
    tokenEstimate: values.tokenEstimate as number,
    costEstimate: values.costEstimate as number,
    auditLogged: true,
    nowMs: values.nowMs as number,
    approval: values.approval as HumanApproval | null,
  });
}
