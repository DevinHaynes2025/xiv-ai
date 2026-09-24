// 12D-289 — THE READING CHAIN'S LOOPBACK CALLER, in its own module.
//
// This pays down the 12D-113 alignment-audit debt: the 12D-284 CLI
// declared *_GUARDRAILS AND carried the loopback fetch (the audit's
// guardrails-no-network invariant — debt cannot grandfather a network
// call into a guardrails module). The caller now lives here, a
// module that declares no *_GUARDRAILS, is explicitly listed in the
// audit's AUTHORIZED_NETWORK_SURFACES, and carries its OWN local-plane
// binding (the pinned 127.0.0.1 endpoint literal in this source).
//
// Fail-closed discipline:
//   * LOOPBACK ONLY, MECHANICALLY: every caller is built for an
//     endpoint whose host is 127.0.0.1 or localhost — any other host
//     refuses ('loopback-only'). The CLI's default builder pins the
//     12D-280 policy's endpoint verbatim. remoteCalls stay 0 —
//     loopback is not remote.
//   * THE MODEL NAME IS PINNED: every call names qwen2.5-coder:7b
//     with stream:false and temperature:0 — the caller cannot be
//     talked into another model.
//   * NO GUARDRAILS HERE BY AUDIT RULE: this module USES the network,
//     so declaring *_GUARDRAILS in it would violate the audit's
//     guardrails-no-network invariant; the honest flags ride on the
//     packets the caller's results feed (the cycle's and the CLI's).
//   * NO DRAFT GATES HERE: the draft gates (trim, budget,
//     SECRET_CONTENT_RE) live in the REAL 12D-280 first reader; this
//     module re-implements none of them.

import { isProxy } from 'node:util/types';

export const READING_LOOPBACK_CALLER_POLICY = Object.freeze({
  policyVersion: '12d-289-v1',
  domain: 'XIV_OS_READING_LOOPBACK_CALLER',
  /** The 12D-280 first-reader policy's pinned loopback endpoint. */
  defaultEndpoint: '127.0.0.1:11434',
  /** The pinned local model name — the caller cannot be talked into another model. */
  model: 'qwen2.5-coder:7b',
  remoteCalls: 0, // loopback is not remote
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  modelWeightMutation: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type ReadingLoopbackCaller = (prompt: string) => Promise<{ model: string; response: string }>;

/** Own enumerable data limits, snapshotted into a frozen record; input need not be frozen. */
export interface ReadingLoopbackGenerationBounds {
  timeoutMs: number;
  maxResponseBytes: number;
  numPredict: number;
  numCtx: number;
}
export type ReadingLoopbackJsonSchemaProperty = Readonly<{
  type: 'string' | 'boolean';
  enum?: readonly (string | boolean)[];
}>;

export type ReadingLoopbackJsonSchema = Readonly<{
  type: 'object';
  properties: Readonly<Record<string, ReadingLoopbackJsonSchemaProperty>>;
  required: readonly string[];
  additionalProperties: false;
}>;

function inspectOwnEnumerableDataObject(
  value: unknown,
  context: string,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || isProxy(value) || Array.isArray(value))
    throw new Error(`${context} must be a plain data object; fail closed`);

  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null)
    throw new Error(`${context} must be a plain data object; fail closed`);

  if (Object.getOwnPropertySymbols(value).length !== 0)
    throw new Error(`${context} must not contain symbol properties; fail closed`);

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const snapshot: Record<string, unknown> = Object.create(null);

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable || !('value' in descriptor))
      throw new Error(`${context} properties must be own enumerable data properties; fail closed`);

    snapshot[key] = descriptor.value;
  }

  return Object.freeze(snapshot);
}

function inspectOwnDataArray(
  value: unknown,
  context: string,
  maxLength: number,
): readonly unknown[] {
  if (!value || typeof value !== 'object' || isProxy(value) || !Array.isArray(value))
    throw new Error(`${context} must be a plain data array; fail closed`);

  if (Object.getPrototypeOf(value) !== Array.prototype)
    throw new Error(`${context} must use the ordinary Array prototype; fail closed`);

  if (Object.getOwnPropertySymbols(value).length !== 0)
    throw new Error(`${context} must not contain symbol properties; fail closed`);

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const lengthDescriptor: PropertyDescriptor | undefined =
    (descriptors as Record<string, PropertyDescriptor>)['length'];

  if (
    !lengthDescriptor ||
    typeof lengthDescriptor !== 'object' ||
    !Object.prototype.hasOwnProperty.call(lengthDescriptor, 'value')
  )
    throw new Error(`${context} length is malformed; fail closed`);

  const lengthValue = lengthDescriptor.value;

  if (!Number.isSafeInteger(lengthValue))
    throw new Error(`${context} length is malformed; fail closed`);

  const length = lengthValue as number;

  if (length < 0 || length > maxLength)
    throw new Error(`${context} length is out of bounds; fail closed`);

  const allowedNames = new Set<string>(['length']);

  for (let i = 0; i < length; i++) {
    allowedNames.add(String(i));
  }

  for (const name of Object.keys(descriptors)) {
    if (!allowedNames.has(name))
      throw new Error(`${context} contains an unexpected property; fail closed`);
  }

  const snapshot: unknown[] = [];

  for (let i = 0; i < length; i++) {
    const descriptor = descriptors[String(i)];

    if (!descriptor || !descriptor.enumerable || !('value' in descriptor))
      throw new Error(`${context} items must be own enumerable data properties; fail closed`);

    snapshot.push(descriptor.value);
  }

  return Object.freeze(snapshot);
}

function assertExactKeys(
  object: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  context: string,
): void {
  const actual = Object.keys(object).sort();
  const wanted = [...expected].sort();

  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  )
    throw new Error(`${context} contains missing or unexpected keys; fail closed`);
}

function validateJsonSchema(
  schema: ReadingLoopbackJsonSchema,
): ReadingLoopbackJsonSchema {
  const root = inspectOwnEnumerableDataObject(schema, 'structured schema');

  assertExactKeys(
    root,
    ['type', 'properties', 'required', 'additionalProperties'],
    'structured schema',
  );

  if (root.type !== 'object' || root.additionalProperties !== false)
    throw new Error('structured schema must be a closed object; fail closed');

  const properties = inspectOwnEnumerableDataObject(
    root.properties,
    'structured schema properties',
  );

  const keys = Object.keys(properties);

  if (keys.length < 1 || keys.length > 16)
    throw new Error('structured schema property count is out of bounds; fail closed');

  const requiredValues = inspectOwnDataArray(
    root.required,
    'structured schema required',
    16,
  );

  if (
    requiredValues.length !== keys.length ||
    requiredValues.some(
      value => typeof value !== 'string' || !keys.includes(value),
    ) ||
    new Set(requiredValues).size !== requiredValues.length
  )
    throw new Error('structured schema required keys must exactly match properties; fail closed');

  const snapshotProperties: Record<
    string,
    ReadingLoopbackJsonSchemaProperty
  > = Object.create(null);

  const reservedPropertyNames = new Set([
    '__proto__',
    'prototype',
    'constructor',
  ]);

  for (const key of keys) {
    if (
      !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key) ||
      reservedPropertyNames.has(key)
    )
      throw new Error('structured schema property name is malformed or reserved; fail closed');

    const property = inspectOwnEnumerableDataObject(
      properties[key],
      `structured schema property ${key}`,
    );

    const propertyKeys = Object.keys(property);

    if (
      propertyKeys.length < 1 ||
      propertyKeys.length > 2 ||
      !propertyKeys.includes('type') ||
      propertyKeys.some(name => name !== 'type' && name !== 'enum')
    )
      throw new Error('structured schema property contains unsupported keywords; fail closed');

    if (property.type !== 'string' && property.type !== 'boolean')
      throw new Error('structured schema property type is unsupported; fail closed');

    let enumValues: readonly (string | boolean)[] | undefined;

    if (Object.prototype.hasOwnProperty.call(property, 'enum')) {
      const rawEnum = inspectOwnDataArray(
        property.enum,
        `structured schema enum ${key}`,
        16,
      );

      if (rawEnum.length < 1)
        throw new Error('structured schema enum is out of bounds; fail closed');

      const validated: (string | boolean)[] = [];

      for (const value of rawEnum) {
        if (property.type === 'string') {
          if (typeof value !== 'string' || value.length > 128)
            throw new Error('structured schema string enum is invalid; fail closed');
        } else if (typeof value !== 'boolean') {
          throw new Error('structured schema boolean enum is invalid; fail closed');
        }

        validated.push(value);
      }

      enumValues = Object.freeze(validated);
    }

    snapshotProperties[key] = Object.freeze({
      type: property.type,
      ...(enumValues ? { enum: enumValues } : {}),
    });
  }

  return Object.freeze({
    type: 'object',
    properties: Object.freeze(snapshotProperties),
    required: Object.freeze(requiredValues as string[]),
    additionalProperties: false,
  });
}
function validateBounds(bounds: ReadingLoopbackGenerationBounds): ReadingLoopbackGenerationBounds {
  if (!bounds || typeof bounds !== 'object' || isProxy(bounds) || Array.isArray(bounds))
    throw new Error('loopback generation bounds must be a plain data object; fail closed');
  const prototype = Object.getPrototypeOf(bounds);
  if (prototype !== Object.prototype && prototype !== null)
    throw new Error('loopback generation bounds must be a plain data object; fail closed');
  const snapshot = (key: keyof ReadingLoopbackGenerationBounds): unknown => {
    const descriptor = Object.getOwnPropertyDescriptor(bounds, key);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value'))
      throw new Error(`loopback generation bounds ${key} must be an own enumerable data property; fail closed`);
    return descriptor.value;
  };
  const timeoutMs = snapshot('timeoutMs');
  const maxResponseBytes = snapshot('maxResponseBytes');
  const numPredict = snapshot('numPredict');
  const numCtx = snapshot('numCtx');
  function validate(value: unknown, key: string, minimum: number, maximum: number): asserts value is number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum)
      throw new Error(`loopback generation ${key} must be an integer in ${minimum}..${maximum}; fail closed`);
  }
  validate(timeoutMs, 'timeoutMs', 1, 120_000);
  validate(maxResponseBytes, 'maxResponseBytes', 1, 1_048_576);
  validate(numPredict, 'numPredict', 1, 256);
  validate(numCtx, 'numCtx', 128, 4096);
  return Object.freeze({ timeoutMs, maxResponseBytes, numPredict, numCtx });
}

async function readBoundedBody(res: Response, maximum: number, controller: AbortController): Promise<string> {
  if (!res.body) throw new Error('ollama response body is missing; fail closed');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > maximum) {
        controller.abort();
        throw new Error(`ollama response exceeds maxResponseBytes (${maximum}); fail closed`);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

/** A loopback endpoint is host 127.0.0.1 or localhost, optional :port (≤ 65535). */
const LOOPBACK_ENDPOINT_RE = /^(127\.0\.0\.1|localhost)(:\d{1,5})?$/;

/**
 * Build the caller for an EXPLICIT endpoint. Any non-loopback host
 * refuses — the reading chain never calls a remote model through this
 * surface.
 */
/** A model name: 1..64 chars, starts alnum, then alnum . _ : - (12D-385). */
const MODEL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

/**
 * Build the caller for an EXPLICIT endpoint AND an EXPLICIT model —
 * the 12D-385 multi-model shape. Both arguments are validated here;
 * the built caller names exactly the given model and reports it back,
 * so the first reader's model-identity gate stays truthful.
 */
export function buildLoopbackCallerForEndpointAndModel(
  endpoint: string, model: string, generationBounds?: ReadingLoopbackGenerationBounds,
): ReadingLoopbackCaller {
  if (typeof endpoint !== 'string' || !LOOPBACK_ENDPOINT_RE.test(endpoint))
    throw new Error('the reading caller is loopback-only (127.0.0.1 or localhost, optional :port); fail closed');
  const port = endpoint.includes(':') ? Number(endpoint.slice(endpoint.indexOf(':') + 1)) : 80;
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error('the reading caller endpoint port is out of range; fail closed');
  if (typeof model !== 'string' || !MODEL_NAME_RE.test(model))
    throw new Error('the reading caller model name is malformed (1..64 chars, starts alnum, then alnum . _ : -); fail closed');
  const bounds = generationBounds === undefined ? undefined : validateBounds(generationBounds);
  return async (prompt: string) => {
    const controller = bounds ? new AbortController() : undefined;
    const timer = bounds ? setTimeout(() => controller!.abort(), bounds.timeoutMs) : undefined;
    try {
      const res = await fetch(`http://${endpoint}/api/generate`, {
        method: 'POST',
        redirect: 'error',
        ...(controller ? { signal: controller.signal } : {}),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model, prompt, stream: false,
          options: { temperature: 0, ...(bounds ? { num_predict: bounds.numPredict, num_ctx: bounds.numCtx } : {}) },
          ...(bounds ? { keep_alive: 0 } : {}),
        }),
      });
      if (!res.ok) throw new Error(`ollama returned HTTP ${res.status}`);
      const data: unknown = JSON.parse(bounds
        ? await readBoundedBody(res, bounds.maxResponseBytes, controller!)
        : await res.text());
      if (!data || typeof data !== 'object' || Array.isArray(data) ||
          !('model' in data) || data.model !== model)
        throw new Error('ollama reported model does not match the declared model; fail closed');
      if (!('response' in data) || typeof data.response !== 'string')
        throw new Error('ollama response must be a string; fail closed');
      if (bounds && (!('done' in data) || data.done !== true))
        throw new Error('ollama bounded generation must report done:true; fail closed');
      return { model: data.model, response: data.response };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      controller?.abort();
    }
  };
}

export function buildStructuredLoopbackCallerForEndpointAndModel(
  endpoint: string,
  model: string,
  generationBounds: ReadingLoopbackGenerationBounds,
  schema: ReadingLoopbackJsonSchema,
): ReadingLoopbackCaller {
  if (typeof endpoint !== 'string' || !LOOPBACK_ENDPOINT_RE.test(endpoint))
    throw new Error('the reading caller is loopback-only (127.0.0.1 or localhost, optional :port); fail closed');

  const port = endpoint.includes(':') ? Number(endpoint.slice(endpoint.indexOf(':') + 1)) : 80;

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error('the reading caller endpoint port is out of range; fail closed');

  if (typeof model !== 'string' || !MODEL_NAME_RE.test(model))
    throw new Error('the reading caller model name is malformed; fail closed');

  const bounds = validateBounds(generationBounds);
  const format = validateJsonSchema(schema);

  return async (prompt: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), bounds.timeoutMs);

    try {
      const res = await fetch(`http://${endpoint}/api/generate`, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format,
          options: {
            temperature: 0,
            num_predict: bounds.numPredict,
            num_ctx: bounds.numCtx,
          },
          keep_alive: 0,
        }),
      });

      if (!res.ok) throw new Error(`ollama returned HTTP ${res.status}`);

      const data: unknown = JSON.parse(
        await readBoundedBody(res, bounds.maxResponseBytes, controller),
      );

      if (!data || typeof data !== 'object' || Array.isArray(data) ||
          !('model' in data) || data.model !== model)
        throw new Error('ollama reported model does not match the declared model; fail closed');

      if (!('response' in data) || typeof data.response !== 'string')
        throw new Error('ollama response must be a string; fail closed');

      if (!('done' in data) || data.done !== true)
        throw new Error('ollama bounded generation must report done:true; fail closed');

      return { model: data.model, response: data.response };
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  };
}
export function buildLoopbackCallerForEndpoint(endpoint: string): ReadingLoopbackCaller {
  return buildLoopbackCallerForEndpointAndModel(endpoint, READING_LOOPBACK_CALLER_POLICY.model);
}

/** The CLI's caller: pinned to the 12D-280 policy's loopback endpoint. */
export function buildLoopbackCaller(): ReadingLoopbackCaller {
  return buildLoopbackCallerForEndpoint(READING_LOOPBACK_CALLER_POLICY.defaultEndpoint);
}
