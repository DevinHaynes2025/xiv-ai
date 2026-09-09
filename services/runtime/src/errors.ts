export type RuntimeErrorCode =
  | 'unauthenticated'
  | 'unauthorized'
  | 'unknown_node'
  | 'node_revoked'
  | 'node_unavailable'
  | 'duplicate_identity'
  | 'enrollment_invalid'
  | 'attestation_required'
  | 'attestation_invalid'
  | 'isolation_violation'
  | 'grant_invalid'
  | 'grant_replayed'
  | 'approval_required'
  | 'budget_exceeded'
  | 'hard_termination'
  | 'model_unregistered'
  | 'model_unapproved'
  | 'model_unavailable'
  | 'model_substitution'
  | 'hardware_unavailable'
  | 'not_found'
  | 'malformed'
  | 'package_invalid'
  | 'package_expired'
  | 'permission_expansion'
  | 'reauthentication_required'
  | 'checkpoint_corrupt'
  | 'quota_exceeded'
  | 'recursion_limit'
  | 'bypass_unjustified';

export class RuntimeError extends Error {
  readonly code: RuntimeErrorCode;
  readonly status: number;
  readonly detail: Readonly<Record<string, unknown>>;

  constructor(code: RuntimeErrorCode, message: string, detail: Record<string, unknown> = {}, status = 403) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export function isRuntimeError(value: unknown): value is RuntimeError {
  return value instanceof RuntimeError;
}

export function errorCodeOf(value: unknown): string {
  return isRuntimeError(value) ? value.code : 'unexpected_error';
}
