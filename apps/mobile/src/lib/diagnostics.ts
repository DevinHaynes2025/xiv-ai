export type DiagnosableError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export type DiagnosticSeverity = 'info' | 'warn' | 'error';

const SECRET_PATTERN =
  /bearer\s+|authorization\s*:|api[_-]?key|service[_-]?role|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]+|password|secret/i;

const INFO_STAGES = new Set([
  'provision:start',
  'provision:profile_upsert',
  'provision:progress_upsert',
  'provision:ok',
  'persist:repair_noop',
  'roles:ensure',
  'hydrate:start',
  'hydrate:complete',
  'signup:start',
  'signin:start',
  'signup:session_present',
  'signup:provisioned',
  'signin:provisioned',
  'interests:save',
]);

// persist:repair is warn-only because reaching it means stored onboarding state
// was actually wrong and had to be rewritten. A no-op pass logs persist:repair_noop.
const WARN_STAGES = new Set([
  'provision:user_mismatch',
  'profile:identity_columns_missing',
  'profile:identity_load_optional_failed',
  'profile:identity_save_fallback',
  'onboarding:optional_column_missing',
  'persist:repair',
  'roles:upsert_failed',
  'interests:upsert_failed',
  'signup:email_confirmation_required',
  'profile:avatar_sign_failed',
]);

function safeField(label: string, value?: string) {
  if (!value) return '';
  if (SECRET_PATTERN.test(value)) return `${label}=[redacted]`;
  return `${label}=${value}`;
}

export function isMissingColumnError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /could not find the .+ column/i.test(error.message ?? '') ||
    /column .+ does not exist/i.test(error.message ?? '') ||
    /undefined_column/i.test(error.message ?? '') ||
    /schema cache/i.test(error.message ?? '')
  );
}

/**
 * Extracts the offending column from a Postgres undefined_column (42703) or a
 * PostgREST schema-cache (PGRST204) error so the log names the column instead of
 * only the code. Returns null when the message does not identify one.
 */
export function missingColumnName(
  error: { message?: string; details?: string; hint?: string } | null | undefined,
) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
  const undefinedColumn = /column\s+(?:"?[\w]+"?\.)?"?([\w]+)"?\s+does not exist/i.exec(text);
  if (undefinedColumn) return undefinedColumn[1];
  const schemaCache = /could not find the '?"?([\w]+)"?'?\s+column/i.exec(text);
  if (schemaCache) return schemaCache[1];
  return null;
}

function severityFor(stage: string): DiagnosticSeverity {
  if (INFO_STAGES.has(stage)) return 'info';
  if (WARN_STAGES.has(stage)) return 'warn';
  if (/fail|error|missing|denied|unauthorized|no_session|no_user/i.test(stage)) return 'error';
  return 'info';
}

export function diagnoseAuthStage(stage: string, codeOrError?: string | DiagnosableError, detail?: string) {
  if (!__DEV__) return;

  let code: string | undefined;
  let message: string | undefined;
  let details: string | undefined;
  let hint: string | undefined;

  if (codeOrError && typeof codeOrError === 'object') {
    code = codeOrError.code;
    message = codeOrError.message;
    details = codeOrError.details;
    hint = codeOrError.hint;
  } else {
    code = codeOrError;
    message = detail;
  }

  const extras = [
    safeField('code', code),
    safeField('message', message),
    safeField('details', details),
    safeField('hint', hint),
  ]
    .filter(Boolean)
    .join(' ');

  const line = `[xiv-auth] ${stage}${extras ? ` ${extras}` : ''}`;
  const severity = severityFor(stage);
  if (severity === 'error') {
    console.error(line);
    return;
  }
  if (severity === 'warn') {
    console.warn(line);
    return;
  }
  console.info(line);
}
