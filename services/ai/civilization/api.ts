import { isGovernanceError, type GovernanceCode } from './errors';
import type { Civilization } from './civilization';
import type { ActorContext } from './types';

// The bounded service interface for meetings and task forces.
//
// Two things this file deliberately does not do.
//
// It does not decide anything. Every handler is a thin translation into the
// civilization layer, which re-checks membership, supervision, control state and
// budget for itself. An endpoint name grants nothing: POST /agents/:id/pause is
// refused for a non-supervisor by requireSupervisor, not by the router.
//
// It never reads identity from the request body. The universe and the user come
// from resolveActor, so a caller cannot widen its own scope by sending a
// different universeId in JSON.
//
// It is not mounted on the live server. 62B is not authorised for deployment, so
// the router exists, is tested, and waits for the story that turns it on.

export type ApiRequest = {
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type ApiResponse = {
  status: number;
  body: Record<string, unknown>;
};

export type ActorResolver = (request: ApiRequest) => ActorContext | null;

export const MEETING_ROUTES = [
  'POST /meetings',
  'GET /meetings/:id',
  'POST /meetings/:id/join',
  'POST /meetings/:id/message',
  'POST /meetings/:id/evidence',
  'POST /meetings/:id/proposal',
  'POST /meetings/:id/objection',
  'POST /meetings/:id/vote',
  'POST /meetings/:id/escalate',
  'POST /meetings/:id/close',
  'GET /task-forces',
  'POST /task-forces',
  'POST /agents/:id/pause',
  'POST /agents/:id/escalate',
] as const;

// Refusals keep their governance code in the response so a client can tell
// "you are not a member" apart from "that agent is paused" without parsing prose.
const STATUS_BY_CODE: Partial<Record<GovernanceCode, number>> = {
  tenancy_not_a_member: 403,
  tenancy_not_a_supervisor: 403,
  tenancy_cross_universe_blocked: 404,
  tenancy_universe_mismatch: 403,
  tenancy_universe_unknown: 404,
  tenancy_agent_unknown: 404,
  meeting_unknown: 404,
  proposal_unknown: 404,
  evidence_unknown: 404,
  objection_unknown: 404,
  decision_unknown: 404,
  action_unknown: 404,
  reputation_unknown: 404,
  directory_profession_unknown: 404,
  xarp_agent_impersonation_blocked: 403,
  xarp_no_speaking_grant: 403,
  agent_control_state_blocked: 409,
  task_force_control_state_blocked: 409,
  guardian_kill_switch_engaged: 423,
  guardian_agent_kill_switch_engaged: 423,
  meeting_budget_exhausted: 429,
  quota_registration_exceeded: 429,
  quota_activation_exceeded: 429,
  quota_task_queue_exceeded: 429,
  quota_cost_exceeded: 429,
};

function statusFor(code: GovernanceCode) {
  return STATUS_BY_CODE[code] ?? 422;
}

type Handler = (context: {
  actor: ActorContext;
  params: Record<string, string>;
  body: Record<string, unknown>;
}) => unknown;

type Route = {
  method: ApiRequest['method'];
  segments: string[];
  handler: Handler;
};

export function createMeetingsApi(options: { civilization: Civilization; resolveActor: ActorResolver }) {
  const xiv = options.civilization;

  const routes: Route[] = [
    route('POST', '/meetings', ({ actor, body }) =>
      xiv.convene(actor, {
        title: str(body.title),
        agenda: (body.agenda as { title: string; detail: string }[]) ?? [],
        triggerKind: body.triggerKind as never,
        triggerDetail: body.triggerDetail as string | undefined,
        taskForceId: (body.taskForceId as string | undefined) ?? null,
        budget: body.budget as never,
      }),
    ),

    route('GET', '/meetings/:id', ({ actor, params }) => xiv.reconstructMeeting(actor, params.id)),

    route('POST', '/meetings/:id/join', ({ actor, params, body }) =>
      xiv.seat(actor, {
        meetingId: params.id,
        participantKind: body.participantKind as 'agent' | 'human',
        agentId: body.agentId as string | undefined,
        userId: body.userId as string | undefined,
        participantRole: body.participantRole as never,
        xarpRoles: body.xarpRoles as never,
        operatorUserId: body.operatorUserId as string | undefined,
        speakingLanguage: body.speakingLanguage as string | undefined,
      }),
    ),

    route('POST', '/meetings/:id/message', ({ actor, params, body }) =>
      xiv.speak(actor, { ...(body as object), meetingId: params.id } as never),
    ),

    route('POST', '/meetings/:id/evidence', ({ actor, params, body }) =>
      xiv.submitEvidence(actor, { ...(body as object), meetingId: params.id } as never),
    ),

    route('POST', '/meetings/:id/proposal', ({ actor, params, body }) =>
      xiv.proposeOption(actor, { ...(body as object), meetingId: params.id } as never),
    ),

    route('POST', '/meetings/:id/objection', ({ actor, params, body }) =>
      xiv.raiseObjection(actor, { ...(body as object), meetingId: params.id } as never),
    ),

    route('POST', '/meetings/:id/vote', ({ actor, params, body }) =>
      xiv.castVote(actor, { ...(body as object), meetingId: params.id } as never),
    ),

    route('POST', '/meetings/:id/escalate', ({ actor, params, body }) =>
      xiv.escalateMeeting(actor, { meetingId: params.id, reason: str(body.reason) }),
    ),

    route('POST', '/meetings/:id/close', ({ actor, params, body }) =>
      xiv.archiveMeeting(actor, { meetingId: params.id, summary: str(body.summary) }),
    ),

    route('GET', '/task-forces', ({ actor }) => xiv.listTaskForces(actor)),

    route('POST', '/task-forces', ({ actor, body }) =>
      xiv.formTaskForce(actor, {
        name: str(body.name),
        purpose: str(body.purpose),
        humanExecutiveId: str(body.humanExecutiveId),
        memberAgentIds: (body.memberAgentIds as string[]) ?? [],
      }),
    ),

    route('POST', '/agents/:id/pause', ({ actor, params, body }) =>
      xiv.issueControl(actor, {
        control: 'pause',
        subjectKind: 'agent',
        subjectAgentId: params.id,
        reason: str(body.reason),
      }),
    ),

    route('POST', '/agents/:id/escalate', ({ actor, params, body }) =>
      xiv.issueControl(actor, {
        control: 'escalate_to_human',
        subjectKind: 'agent',
        subjectAgentId: params.id,
        reason: str(body.reason),
      }),
    ),
  ];

  function handle(request: ApiRequest): ApiResponse {
    const actor = options.resolveActor(request);
    if (!actor) {
      return { status: 401, body: { error: 'unauthenticated' } };
    }

    const segments = splitPath(request.path);
    for (const candidate of routes) {
      if (candidate.method !== request.method) continue;
      const params = match(candidate.segments, segments);
      if (!params) continue;

      try {
        const result = candidate.handler({ actor, params, body: request.body ?? {} });
        return { status: request.method === 'POST' ? 201 : 200, body: { data: result as never } };
      } catch (error) {
        if (isGovernanceError(error)) {
          return {
            status: statusFor(error.code),
            body: { error: error.code, detail: error.detail },
          };
        }
        throw error;
      }
    }

    return { status: 404, body: { error: 'no_such_route', detail: `${request.method} ${request.path}` } };
  }

  return { routes: MEETING_ROUTES, handle };
}

function route(method: ApiRequest['method'], pattern: string, handler: Handler): Route {
  return { method, segments: splitPath(pattern), handler };
}

function splitPath(path: string) {
  return path.split('/').filter((segment) => segment.length > 0);
}

function match(pattern: readonly string[], actual: readonly string[]) {
  if (pattern.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < pattern.length; index += 1) {
    const expected = pattern[index];
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = actual[index];
      continue;
    }
    if (expected !== actual[index]) return null;
  }
  return params;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
