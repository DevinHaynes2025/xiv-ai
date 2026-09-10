import { config as loadEnv } from 'dotenv';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ServiceError, verifyAccessToken } from './auth';
import {
  businessExecutiveBrief,
  businessHealth,
  businessSourceStatus,
  mediaAuthorize,
  mediaComplete,
  mediaStatus,
} from './business-api';
import { agentMeetingNetworkStatus } from './runtime/agentmeetings';
import { runExecutiveTurn } from './executive-turn';
import { geminiModelName, isGeminiKeyConfigured } from './gemini-provider';
import {
  collectLocalWorkerHeartbeat,
  runLocalWorkerSmoke,
} from './local-coding-worker';
import type { ApprovedDataContext, OrganizationContext } from './types';

loadEnv({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 32_768;
let activeTurns = 0;

type ExecutiveTurnBody = {
  message?: unknown;
  role?: unknown;
  organizationContext?: unknown;
  approvedDataContext?: unknown;
};

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Xiv-Request-Id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function json(res: ServerResponse, status: number, body: unknown) {
  setCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function fail(res: ServerResponse, error: unknown) {
  if (error instanceof ServiceError) {
    json(res, error.status, { error: { code: error.code, message: error.message } });
    return;
  }
  json(res, 503, {
    error: { code: 'unavailable', message: 'The AI service is unavailable. Try again in a moment.' },
  });
}

function requestIdFrom(req: IncomingMessage) {
  const raw = req.headers['x-xiv-request-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^[A-Za-z0-9._-]{1,64}$/.test(value)) return value;
  return `s${Date.now().toString(36)}`;
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new ServiceError('malformed', 400, 'The request could not be read.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => reject(new ServiceError('unavailable', 503, 'The AI service is unavailable. Try again in a moment.')));
  });
}

function asOrganizationContext(value: unknown): OrganizationContext | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const body = value as Record<string, unknown>;
  if (body.kind !== 'placeholder_universe' && body.kind !== 'demo_tenant') return undefined;
  return {
    kind: body.kind,
    name: typeof body.name === 'string' ? body.name : 'Demo tenant',
    detail: typeof body.detail === 'string' ? body.detail : '',
  };
}

function asApprovedDataContext(value: unknown): ApprovedDataContext | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const body = value as Record<string, unknown>;
  return {
    alias: typeof body.alias === 'string' ? body.alias : undefined,
    profileName: typeof body.profileName === 'string' ? body.profileName : undefined,
    interests: Array.isArray(body.interests) ? body.interests.filter((item): item is string => typeof item === 'string') : undefined,
    metricsNote: typeof body.metricsNote === 'string' ? body.metricsNote : undefined,
    systemsNote: typeof body.systemsNote === 'string' ? body.systemsNote : undefined,
    universeNote: typeof body.universeNote === 'string' ? body.universeNote : undefined,
  };
}

async function handleExecutiveTurn(req: IncomingMessage, res: ServerResponse) {
  const user = await verifyAccessToken(req.headers.authorization);
  const raw = await readBody(req);
  let parsed: ExecutiveTurnBody;
  try {
    parsed = JSON.parse(raw) as ExecutiveTurnBody;
  } catch {
    throw new ServiceError('malformed', 400, 'The request could not be read.');
  }

  const message = typeof parsed.message === 'string' ? parsed.message.trim() : '';
  if (!message || message.length > 4000) {
    throw new ServiceError('malformed', 400, 'The request could not be read.');
  }

  const output = await runExecutiveTurn({
    userId: user.id,
    userMessage: message,
    role: typeof parsed.role === 'string' ? parsed.role : 'executive',
    organizationContext: asOrganizationContext(parsed.organizationContext),
    approvedDataContext: asApprovedDataContext(parsed.approvedDataContext),
  });

  json(res, 200, { output });
}

const server = createServer((req, res) => {
  void (async () => {
    try {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
      if (req.method === 'OPTIONS') {
        setCors(res);
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        json(res, 200, { ok: true, agent: 'executive_agent' });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/local-worker/heartbeat') {
        json(res, 200, await collectLocalWorkerHeartbeat());
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/local-worker/smoke') {
        json(res, 200, await runLocalWorkerSmoke());
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/business/source/status') {
        const user = await verifyAccessToken(req.headers.authorization);
        json(res, 200, await businessSourceStatus(user.id));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/business/health') {
        const user = await verifyAccessToken(req.headers.authorization);
        json(res, 200, await businessHealth(user.id));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/agent-meetings/status') {
        await verifyAccessToken(req.headers.authorization);
        json(res, 200, agentMeetingNetworkStatus());
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/business/executive-brief') {
        const user = await verifyAccessToken(req.headers.authorization);
        json(res, 200, await businessExecutiveBrief(user.id));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/media/authorize') {
        const user = await verifyAccessToken(req.headers.authorization);
        const raw = await readBody(req);
        let parsed: Record<string, unknown> = {};
        if (raw.trim()) {
          try {
            parsed = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            throw new ServiceError('malformed', 400, 'The request could not be read.');
          }
        }
        if (typeof parsed.storagePath === 'string') {
          throw new ServiceError('malformed', 400, 'Arbitrary storage paths are not accepted.');
        }
        json(res, 200, mediaAuthorize(user.id, parsed));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/media/complete') {
        await verifyAccessToken(req.headers.authorization);
        json(res, 403, mediaComplete());
        return;
      }

      const mediaStatusMatch = /^\/v1\/media\/([^/]+)\/status$/.exec(url.pathname);
      if (req.method === 'GET' && mediaStatusMatch) {
        await verifyAccessToken(req.headers.authorization);
        json(res, 200, mediaStatus(decodeURIComponent(mediaStatusMatch[1] ?? '')));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/executive/turn') {
        const requestId = requestIdFrom(req);
        activeTurns += 1;
        const overlap = activeTurns;
        console.info(`[xiv-ai] turn:start ${requestId}${overlap > 1 ? ` overlap=${overlap}` : ''}`);
        try {
          await handleExecutiveTurn(req, res);
        } finally {
          activeTurns -= 1;
          console.info(`[xiv-ai] turn:complete ${requestId}`);
        }
        return;
      }

      json(res, 404, { error: { code: 'not_found', message: 'Not found.' } });
    } catch (error) {
      fail(res, error);
    }
  })();
});

server.listen(PORT, () => {
  console.info(`[xiv-ai] listening on ${PORT}`);
  console.info(`[xiv-ai] Gemini configured: ${isGeminiKeyConfigured() ? 'yes' : 'no'}`);
  console.info(`[xiv-ai] Gemini model: ${geminiModelName()}`);
});
