import { ServiceError } from './auth';
import {
  classifyGeminiHttpStatus,
  logGeminiFailure,
  logGeminiHttpFailure,
  logGeminiRequest,
  parseGeminiErrorBody,
} from './diagnostics';
import { EXECUTIVE_RESPONSE_SCHEMA, parseStructuredOutput } from './schema';
import type { ApprovedDataContext, OrganizationContext, StructuredAgentOutput } from './types';

const GEMINI_TIMEOUT_MS = 20_000;
const DEFAULT_MODEL = 'gemini-2.5-flash';
const RESPONSE_MIME_TYPE = 'application/json';

const SYSTEM_INSTRUCTION = [
  'You are XIV Executive Agent, a business decision-support assistant.',
  'You may analyze and recommend. You may not execute consequential actions automatically.',
  'Never move money, change payroll, terminate accounts, alter enterprise permissions, execute large purchases, or change production systems.',
  'If the user asks for those, set riskLevel to high or critical, requiresApproval to true, and do not treat the action as executed.',
  'Use only the provided mock or approved business context. Do not invent live ledger, payroll, or production-system facts.',
  'Return only the structured JSON object. Do not wrap it in markdown.',
].join(' ');

export type GeminiTurnInput = {
  userMessage: string;
  role: string;
  organizationContext?: OrganizationContext;
  approvedDataContext?: ApprovedDataContext;
};

export function isGeminiKeyConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function geminiModelName() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function geminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new ServiceError('not_configured', 503, 'The AI service is not configured.');
  }
  return key;
}

function geminiEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

export async function completeGeminiStructured(input: GeminiTurnInput): Promise<StructuredAgentOutput> {
  const keyConfigured = isGeminiKeyConfigured();
  const model = geminiModelName();
  const url = geminiEndpoint(model);

  logGeminiRequest({
    geminiKeyConfigured: keyConfigured,
    model,
    endpoint: url,
    responseMimeType: RESPONSE_MIME_TYPE,
    responseSchema: true,
    partsMimeType: 'text/plain',
    hasSystemInstruction: true,
    contentsCount: 1,
    userMessageLength: input.userMessage.length,
    role: input.role,
    hasOrganizationContext: Boolean(input.organizationContext),
    hasApprovedDataContext: Boolean(input.approvedDataContext),
  });

  const key = geminiKey();

  const userPayload = {
    message: input.userMessage,
    role: input.role,
    organizationContext: input.organizationContext ?? null,
    approvedDataContext: input.approvedDataContext ?? null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `User request and optional mock business context:\n${JSON.stringify(userPayload)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: RESPONSE_MIME_TYPE,
          responseSchema: EXECUTIVE_RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      let rawBody = '';
      try {
        rawBody = await response.text();
      } catch {
        rawBody = '';
      }
      logGeminiHttpFailure({
        status: response.status,
        failureClass: classifyGeminiHttpStatus(response.status),
        body: parseGeminiErrorBody(rawBody),
      });
      if (response.status === 401 || response.status === 403) {
        throw new ServiceError('not_configured', 503, 'The AI service is not configured.');
      }
      if (response.status === 429) {
        throw new ServiceError('unavailable', 503, 'The AI service is unavailable. Try again in a moment.');
      }
      throw new ServiceError('unavailable', 503, 'The AI service is unavailable. Try again in a moment.');
    }

    let payload: {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    try {
      payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
    } catch (caught) {
      logGeminiFailure('json_parse', {
        reason: caught instanceof Error ? caught.name : 'unknown',
      });
      throw new ServiceError('unavailable', 503, 'The AI service is unavailable. Try again in a moment.');
    }

    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    if (!text.trim()) {
      logGeminiFailure('structured-output_validation', { reason: 'empty_candidate_text' });
      throw new ServiceError('malformed', 422, 'The assistant returned an unusable response. Try again.');
    }

    const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(trimmed) as unknown;
    } catch {
      logGeminiFailure('json_parse', { reason: 'candidate_text_not_json' });
      throw new ServiceError('malformed', 422, 'The assistant returned an unusable response. Try again.');
    }

    try {
      return parseStructuredOutput(parsedJson);
    } catch {
      logGeminiFailure('structured-output_validation', { reason: 'schema_mismatch' });
      throw new ServiceError('malformed', 422, 'The assistant returned an unusable response. Try again.');
    }
  } catch (caught) {
    if (caught instanceof ServiceError) throw caught;
    if (caught instanceof Error && caught.name === 'AbortError') {
      logGeminiFailure('timeout', { reason: 'abort' });
      throw new ServiceError('timeout', 504, 'The model timed out. Try again.');
    }
    logGeminiFailure('network', {
      reason: caught instanceof Error ? caught.name : 'unknown',
      message: caught instanceof Error ? caught.message : 'unknown',
    });
    throw new ServiceError('unavailable', 503, 'The AI service is unavailable. Try again in a moment.');
  } finally {
    clearTimeout(timer);
  }
}
