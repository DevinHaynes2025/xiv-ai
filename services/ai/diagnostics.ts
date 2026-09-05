export function diagnoseAgentStage(stage: string, code?: string) {
  if (typeof console === 'undefined') return;
  console.warn(`[xiv-agent] ${stage}${code ? ` code=${code}` : ''}`);
}

const REDACTED = '[redacted]';
const SECRET_FIELD =
  /api[_-]?key|token|secret|authorization|password|credential|bearer|private[_-]?key|x-goog-api-key|gemini[_-]?key/i;

function secretValuePattern() {
  return /(?:AIza[0-9A-Za-z_\-]{8,}|AQ\.[A-Za-z0-9._\-]{16,}|sk-[A-Za-z0-9]{8,}|ya29\.[A-Za-z0-9._\-]+|eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9._\-]+)/g;
}

export type GeminiFailureClass =
  | 'schema'
  | 'key/permission'
  | 'model'
  | 'quota'
  | 'network'
  | 'json_parse'
  | 'structured-output_validation'
  | 'timeout'
  | 'empty_response'
  | 'http';

export type GeminiRequestShape = {
  geminiKeyConfigured: boolean;
  model: string;
  endpoint: string;
  responseMimeType: string | null;
  responseSchema: boolean;
  partsMimeType: string;
  hasSystemInstruction: boolean;
  contentsCount: number;
  userMessageLength: number;
  role: string;
  hasOrganizationContext: boolean;
  hasApprovedDataContext: boolean;
};

function redactSecretsInText(text: string) {
  return text
    .replace(secretValuePattern(), REDACTED)
    .replace(/(?:api[_-]?key|token|authorization|x-goog-api-key)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/[?&](?:key|api_key|token)=[^&\s]+/gi, '[redacted-param]');
}

function looksLikeSecretField(key: string) {
  return SECRET_FIELD.test(key);
}

function looksLikeSecretValue(value: string) {
  return secretValuePattern().test(value.trim());
}

export function sanitizeGeminiDiagnostic(value: unknown, key = ''): unknown {
  if (looksLikeSecretField(key)) return REDACTED;
  if (typeof value === 'string') {
    if (looksLikeSecretValue(value)) return REDACTED;
    const redacted = redactSecretsInText(value);
    return redacted.length > 4000 ? `${redacted.slice(0, 4000)}…` : redacted;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeGeminiDiagnostic(item));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
      out[entryKey] = sanitizeGeminiDiagnostic(entryValue, entryKey);
    }
    return out;
  }
  return value;
}

export function safeGeminiEndpoint(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '[invalid-url]';
  }
}

export function classifyGeminiHttpStatus(status: number): GeminiFailureClass {
  if (status === 400) return 'schema';
  if (status === 401 || status === 403) return 'key/permission';
  if (status === 404) return 'model';
  if (status === 429) return 'quota';
  return 'http';
}

export function parseGeminiErrorBody(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return sanitizeGeminiDiagnostic(JSON.parse(trimmed) as unknown);
  } catch {
    return redactSecretsInText(trimmed).slice(0, 4000);
  }
}

export function logGeminiRequest(shape: GeminiRequestShape) {
  console.info('[xiv-ai] geminiKeyConfigured', shape.geminiKeyConfigured);
  console.info('[xiv-ai] GEMINI_MODEL', shape.model);
  console.info('[xiv-ai] gemini endpoint', safeGeminiEndpoint(shape.endpoint));
  console.info('[xiv-ai] gemini request shape', {
    partsMimeType: shape.partsMimeType,
    responseMimeType: shape.responseMimeType ?? 'no',
    responseSchema: shape.responseSchema ? 'yes' : 'no',
    hasSystemInstruction: shape.hasSystemInstruction,
    contentsCount: shape.contentsCount,
    userMessageLength: shape.userMessageLength,
    role: shape.role,
    hasOrganizationContext: shape.hasOrganizationContext,
    hasApprovedDataContext: shape.hasApprovedDataContext,
  });
}

export function logGeminiHttpFailure(input: {
  status: number;
  failureClass: GeminiFailureClass;
  body: unknown;
}) {
  console.warn('[xiv-ai] gemini HTTP status', input.status);
  console.warn('[xiv-ai] gemini failure class', input.failureClass);
  console.warn('[xiv-ai] gemini error body', input.body);
}

export function logGeminiFailure(failureClass: GeminiFailureClass, detail?: unknown) {
  console.warn('[xiv-ai] gemini failure class', failureClass);
  if (detail !== undefined) {
    console.warn('[xiv-ai] gemini failure detail', sanitizeGeminiDiagnostic(detail));
  }
}
