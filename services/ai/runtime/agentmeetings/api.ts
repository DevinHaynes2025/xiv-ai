/**
 * Bounded service interfaces. API names do not grant capabilities.
 * Authorization is enforced server-side against the actor.
 */

import {
  collectEvidence,
  createMeeting,
  getMeeting,
  joinMeeting,
  postMessage,
  type MeetingNetwork,
} from './engine';
import { applyControl, killTaskForce } from './governance';
import { humanDecide, humanEnterMeeting } from './humans';
import { objectToProposal, submitProposal, voteOnProposal } from './protocol';
import { listTaskForces, recommendTaskForce } from './society';
import type { Actor, Allow, Deny, MeetingParticipant } from './types';

export type ApiResult = Allow<unknown> | Deny;

export function handleMeetingApi(
  net: MeetingNetwork,
  method: string,
  path: string,
  actor: Actor,
  body: Record<string, unknown> = {},
): ApiResult {
  const meetingMatch = path.match(/^\/meetings\/([^/]+)(?:\/([a-z-]+))?$/);
  if (method === 'POST' && path === '/meetings') {
    return createMeeting(net, {
      meetingId: String(body.meetingId ?? ''),
      actor,
      title: String(body.title ?? 'Untitled meeting'),
      purpose: String(body.purpose ?? ''),
      trigger: String(body.trigger ?? 'api'),
    });
  }
  if (method === 'GET' && meetingMatch && !meetingMatch[2]) {
    return getMeeting(net, meetingMatch[1]!, actor);
  }
  if (method === 'POST' && meetingMatch) {
    const meetingId = meetingMatch[1]!;
    const action = meetingMatch[2];
    if (action === 'join') {
      if (actor.kind === 'human') return humanEnterMeeting(net, meetingId, actor);
      return joinMeeting(net, meetingId, actor, {
        participantId: `p:${actor.actorId}`,
        meetingId,
        actorId: actor.actorId,
        kind: actor.kind,
        organizationId: actor.organizationId,
        universeId: actor.universeId,
      } satisfies MeetingParticipant);
    }
    if (action === 'message') {
      return postMessage(net, meetingId, actor, String(body.body ?? ''));
    }
    if (action === 'evidence') {
      return collectEvidence(net, meetingId, actor, {
        evidenceId: String(body.evidenceId ?? `ev:${Date.now()}`),
        claim: String(body.claim ?? ''),
        source: String(body.source ?? ''),
        provenance: String(body.provenance ?? ''),
        date: String(body.date ?? ''),
        confidence: Number(body.confidence ?? 0),
        classification: (body.classification as 'internal') ?? 'internal',
      });
    }
    if (action === 'proposal') {
      return submitProposal(net, meetingId, actor, {
        proposalId: String(body.proposalId ?? `pr:${Date.now()}`),
        claim: String(body.claim ?? ''),
        evidence: Array.isArray(body.evidence) ? body.evidence.map(String) : [],
        source: String(body.source ?? ''),
        provenance: String(body.provenance ?? ''),
        date: String(body.date ?? ''),
        confidence: Number(body.confidence ?? 0),
        assumptions: Array.isArray(body.assumptions) ? body.assumptions.map(String) : [],
        counterargument: String(body.counterargument ?? ''),
        risk: String(body.risk ?? ''),
        unknown: String(body.unknown ?? ''),
        recommendation: String(body.recommendation ?? ''),
      });
    }
    if (action === 'objection') {
      return objectToProposal(
        net,
        meetingId,
        actor,
        String(body.proposalId ?? ''),
        String(body.statement ?? ''),
      );
    }
    if (action === 'vote') {
      return voteOnProposal(
        net,
        meetingId,
        actor,
        String(body.proposalId ?? ''),
        (body.stance as 'support') ?? 'abstain',
      );
    }
    if (action === 'escalate') {
      return applyControl(net, meetingId, actor, 'ESCALATE_TO_HUMAN');
    }
    if (action === 'close') {
      return applyControl(net, meetingId, actor, 'STOP');
    }
  }
  if (method === 'GET' && path === '/task-forces') {
    return { ok: true, value: listTaskForces(actor.organizationId, actor.universeId), audited: true };
  }
  if (method === 'POST' && path === '/task-forces') {
    return recommendTaskForce(net, actor, {
      taskForceId: String(body.taskForceId ?? ''),
      problem: String(body.problem ?? ''),
      memberIds: Array.isArray(body.memberIds) ? body.memberIds.map(String) : [],
      meetingId: String(body.meetingId ?? `mtg:${Date.now()}`),
      title: String(body.title ?? 'Task force meeting'),
    });
  }
  const agentPause = path.match(/^\/agents\/([^/]+)\/pause$/);
  if (method === 'POST' && agentPause) {
    return applyControl(net, String(body.meetingId ?? ''), actor, 'PAUSE', agentPause[1]);
  }
  const agentEscalate = path.match(/^\/agents\/([^/]+)\/escalate$/);
  if (method === 'POST' && agentEscalate) {
    return applyControl(net, String(body.meetingId ?? ''), actor, 'ESCALATE_TO_HUMAN', agentEscalate[1]);
  }
  if (method === 'POST' && path.startsWith('/task-forces/') && path.endsWith('/kill')) {
    const meetingId = String(body.meetingId ?? '');
    return killTaskForce(net, meetingId, actor);
  }
  return { ok: false, reason: 'unknown_route', audited: true };
}

export function apiNameGrantsCapability(): false {
  return false;
}
