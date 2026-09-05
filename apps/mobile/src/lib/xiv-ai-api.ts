import type { ApprovedDataContext, OrganizationContext, StructuredAgentOutput } from '@/lib/ai';

export class XivAiRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type ErrorBody = {
  error?: { code?: string; message?: string };
};

export type AiServiceProbe = {
  reachable: boolean;
};

function friendlyMessage(code: string) {
  if (code === 'unauthorized') return 'Your session expired. Sign in again to use the agent.';
  if (code === 'timeout') return 'The request timed out. Try again.';
  if (code === 'malformed') return 'The assistant returned an unusable response. Try again.';
  if (code === 'gemini_failed' || code === 'not_configured') {
    return 'Gemini could not complete this request. Try again in a moment.';
  }
  if (code === 'unreachable') return 'The AI service is unreachable. Make sure it is running, then try again.';
  return 'The AI service is unavailable. Try again in a moment.';
}

function mapServerError(code: string) {
  if (code === 'not_configured' || code === 'unavailable') return 'gemini_failed';
  return code;
}

function apiBaseUrl() {
  return process.env.EXPO_PUBLIC_XIV_AI_URL?.replace(/\/$/, '') ?? '';
}

/** Live Gemini lives on the XIV AI service. This is the only implemented turn route. */
const LIVE_TURN_PATH = '/v1/executive/turn';
const TURN_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 4_000;

let requestSeq = 0;

function nextRequestId() {
  requestSeq += 1;
  return `m${Date.now().toString(36)}-${requestSeq}`;
}

function logAgentRequest(stage: 'start' | 'response' | 'complete' | 'timeout', requestId: string, status?: number) {
  if (!__DEV__) return;
  const suffix = status !== undefined ? ` ${status}` : '';
  console.warn(`[xiv-agent] request:${stage} ${requestId}${suffix}`);
}

function withAbortTimer(ms: number) {
  const controller = new AbortController();
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) controller.abort();
  }, ms);
  const settle = () => {
    settled = true;
    clearTimeout(timer);
  };
  return { controller, settle };
}

export async function probeAiService(): Promise<AiServiceProbe> {
  const base = apiBaseUrl();
  if (!base) return { reachable: false };

  try {
    const { controller, settle } = withAbortTimer(HEALTH_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}/health`, { method: 'GET', signal: controller.signal });
      return { reachable: response.ok };
    } finally {
      settle();
    }
  } catch {
    return { reachable: false };
  }
}

export async function requestExecutiveTurn(input: {
  accessToken: string;
  message: string;
  role: string;
  organizationContext?: OrganizationContext;
  approvedDataContext?: ApprovedDataContext;
}): Promise<StructuredAgentOutput> {
  const base = apiBaseUrl();
  if (!base) {
    throw new XivAiRequestError('unreachable', friendlyMessage('unreachable'));
  }

  const requestId = nextRequestId();
  logAgentRequest('start', requestId);

  let response: Response;
  const { controller, settle } = withAbortTimer(TURN_TIMEOUT_MS);
  try {
    response = await fetch(`${base}${LIVE_TURN_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        'X-Xiv-Request-Id': requestId,
      },
      body: JSON.stringify({
        message: input.message,
        role: input.role,
        organizationContext: input.organizationContext,
        approvedDataContext: input.approvedDataContext,
      }),
      signal: controller.signal,
    });
  } catch (caught) {
    if (caught instanceof Error && caught.name === 'AbortError') {
      logAgentRequest('timeout', requestId);
      throw new XivAiRequestError('timeout', friendlyMessage('timeout'));
    }
    throw new XivAiRequestError('unreachable', friendlyMessage('unreachable'));
  } finally {
    settle();
  }

  logAgentRequest('response', requestId, response.status);

  let payload: { output?: StructuredAgentOutput } & ErrorBody = {};
  try {
    payload = (await response.json()) as { output?: StructuredAgentOutput } & ErrorBody;
  } catch {
    throw new XivAiRequestError('malformed', friendlyMessage('malformed'));
  }

  if (!response.ok) {
    const raw = payload.error?.code ?? (response.status === 401 ? 'unauthorized' : 'gemini_failed');
    const code = mapServerError(raw);
    throw new XivAiRequestError(code, friendlyMessage(code));
  }

  const output = payload.output;
  if (
    !output?.summary ||
    !output.recommendation ||
    !output.riskLevel ||
    typeof output.requiresApproval !== 'boolean' ||
    !Array.isArray(output.evidence)
  ) {
    throw new XivAiRequestError('malformed', friendlyMessage('malformed'));
  }

  logAgentRequest('complete', requestId, response.status);
  return output;
}
