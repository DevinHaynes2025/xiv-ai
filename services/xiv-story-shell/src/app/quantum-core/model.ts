/** Local synthetic read model. No identity, execution, storage or transport adapter. */
export const ENGINE_NAMES = ['Reasoning', 'Planning', 'Memory', 'Retrieval', 'Analysis', 'Coding', 'Simulation', 'Safety', 'Orchestration', 'Communication', 'Evaluation', 'Specialized Domains'] as const;
export const FIXTURE_TIME = '2026-09-26T00:00:00.000Z';
export const SOURCE = 'DEMO_DATA' as const;
export type Binding = Readonly<{ actionId: string; reviewCycleId: string; organizationId: string; membershipId: string; membershipRoleVersion: number }>;
// Tuple serialization preserves field boundaries. This is an identity key, never authority.
export function approvalIdentity(b: Binding): string {
  return JSON.stringify([b.actionId, b.reviewCycleId, b.organizationId, b.membershipId, b.membershipRoleVersion]);
}
export type Decision = 'APPROVE' | 'DENY' | 'REQUEST_CHANGES';
export type Verification = 'VERIFIED' | 'UNVERIFIED' | 'TAMPERED' | 'INCOMPLETE' | 'EXPIRED';
export type Approval = Binding & Readonly<{ universeId: string; agentId: string; principal: string; action: string; target: string; risk: 'HIGH'; reason: string; effect: string; reversibility: string; createdAt: string; expiresAt: string; reviewerRole: string; evidence: string; state: 'PENDING' | Decision | 'REVOKED'; }>;
export type Receipt = Readonly<{ id: string; timestamp: string; actor: string; organizationId: string; universeId: string; agentId: string; action: string; decision: Decision; result: 'DEMO_REVIEW_ONLY'; risk: 'HIGH'; evidenceDigest: string; previousDigest: string | null; digest: string; canonicalPayload: string; verification: 'UNVERIFIED'; correlationId: string; source: typeof SOURCE }>;
export const UNIVERSES = Object.freeze([
  Object.freeze({ id: 'universe-atlas', organizationId: 'org-atlas', name: 'Atlas Research', membershipId: 'demo-reviewer-atlas', membershipRoleVersion: 1 }),
  Object.freeze({ id: 'universe-orion', organizationId: 'org-orion', name: 'Orion Engineering', membershipId: 'demo-reviewer-orion', membershipRoleVersion: 2 }),
]);
export type Universe = typeof UNIVERSES[number];
export type ConsoleState = Readonly<{ universeId: string; approvals: readonly Approval[]; receipts: readonly Receipt[] }>;
export function initialState(): ConsoleState {
  return Object.freeze({ universeId: UNIVERSES[0].id, receipts: Object.freeze([]), approvals: Object.freeze(UNIVERSES.flatMap(u => [1, 2].map(n => Object.freeze({
    actionId: `action-${n}`, reviewCycleId: 'cycle-1', organizationId: u.organizationId, membershipId: u.membershipId, membershipRoleVersion: u.membershipRoleVersion,
    universeId: u.id, agentId: `${u.id}-agent-${n}`, principal: 'Synthetic proposal author', action: n === 1 ? 'Publish evaluation summary' : 'Synchronize edge metadata',
    target: n === 1 ? 'Disconnected report connector' : 'Disconnected cloud replica', risk: 'HIGH' as const,
    reason: 'Demonstrate human review of an external-action proposal.', effect: 'Record a demo decision only; no external action.', reversibility: 'No external effect; session resets on reload.',
    createdAt: FIXTURE_TIME, expiresAt: '2026-10-26T00:00:00.000Z', reviewerRole: 'Demo reviewer (not authenticated)', evidence: `synthetic-evaluation-${n}`, state: 'PENDING' as const,
  })))) });
}
export function activeUniverse(state: ConsoleState): Universe {
  const universe = UNIVERSES.find(u => u.id === state.universeId);
  if (!universe) throw new Error('SCOPE_UNAVAILABLE');
  return universe;
}
export function visibleApprovals(state: ConsoleState) {
  const u = activeUniverse(state);
  return state.approvals.filter(a => a.organizationId === u.organizationId && a.universeId === u.id && a.membershipId === u.membershipId && a.membershipRoleVersion === u.membershipRoleVersion);
}
export function visibleReceipts(state: ConsoleState) {
  const u = activeUniverse(state);
  return state.receipts.filter(r => r.organizationId === u.organizationId && r.universeId === u.id);
}
export function switchUniverse(state: ConsoleState, id: unknown): ConsoleState {
  if (typeof id !== 'string' || !UNIVERSES.some(u => u.id === id)) return state;
  return Object.freeze({ ...state, universeId: id });
}
export function agents(state: ConsoleState) {
  const u = activeUniverse(state);
  return [1, 2, 3].map(n => Object.freeze({ id: `${u.id}-agent-${n}`, role: ['Evidence reviewer', 'Edge coordinator', 'Safety reviewer'][n - 1], organization: u.organizationId, universe: u.id,
    state: 'OFFLINE', tools: 'None', denied: 'All execution, network, shell, credentials, spawning', task: 'No runtime task', mode: 'Disabled / proposal only', heartbeat: 'Unavailable', risk: 'Unassessed', supervisor: 'Human owner (demo)', dependencies: 'Runtime adapter unavailable', evidence: 'Synthetic identity; no runtime evidence' }));
}
async function sha256(text: string): Promise<string> {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
}
export type ReviewResult = Readonly<{ state: ConsoleState; message: string }>;
/** Trusted in-memory fixture state only. A serialized command grants no real authority. */
export async function reviewDemo(state: ConsoleState, serialized: unknown, now: number): Promise<ReviewResult> {
  const refuse = (message: string) => Object.freeze({ state, message });
  if (typeof serialized !== 'string' || serialized.length > 2048 || new TextEncoder().encode(serialized).length > 2048 || !Number.isSafeInteger(now) || now < 0) return refuse('Malformed request');
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { return refuse('Malformed request'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return refuse('Malformed request');
  const command = parsed as Record<string, unknown>;
  if (Object.keys(command).sort().join(',') !== 'decision,identity' || typeof command.identity !== 'string' || typeof command.decision !== 'string' || !['APPROVE', 'DENY', 'REQUEST_CHANGES'].includes(command.decision)) return refuse('Malformed request');
  const matches = visibleApprovals(state).filter(a => approvalIdentity(a) === command.identity);
  if (matches.length !== 1) return refuse('Scope or identity refused');
  const approval = matches[0];
  if (approval.state !== 'PENDING') return refuse('Already decided or revoked');
  if (now < Date.parse(approval.createdAt) || now >= Date.parse(approval.expiresAt)) return refuse('Approval expired or not yet valid');
  if (state.receipts.length >= 64) return refuse('Session receipt limit reached');
  const decision = command.decision as Decision;
  try {
    const prior = visibleReceipts(state).at(-1);
    const payload = Object.freeze({ version: 'xvi-core-demo-receipt-v1', timestamp: new Date(now).toISOString(), actor: approval.membershipId,
      organizationId: approval.organizationId, universeId: approval.universeId, agentId: approval.agentId, action: approval.action, decision,
      result: 'DEMO_REVIEW_ONLY' as const, risk: approval.risk, evidenceDigest: await sha256(approval.evidence), previousDigest: prior?.digest ?? null,
      correlationId: approvalIdentity(approval), sequence: visibleReceipts(state).length + 1, source: SOURCE });
    const canonicalPayload = JSON.stringify(payload);
    const digest = await sha256(canonicalPayload);
    const receipt: Receipt = Object.freeze({ ...payload, id: `demo-receipt:${digest}`, digest, canonicalPayload, verification: 'UNVERIFIED' });
    return Object.freeze({ message: 'Demo decision recorded. No execution grant issued.', state: Object.freeze({ ...state,
      approvals: Object.freeze(state.approvals.map(a => approvalIdentity(a) === command.identity ? Object.freeze({ ...a, state: decision }) : a)), receipts: Object.freeze([...state.receipts, receipt]) }) });
  } catch { return refuse('Review unavailable'); }
}
export const executionStatus = () => Object.freeze({ permitted: false, reason: 'No authenticated authority, execution grant or adapter' });
