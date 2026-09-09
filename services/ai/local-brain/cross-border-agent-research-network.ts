/**
 * 62L-CN Cross-Border Agent Research Network —
 * Bounded cross-border research coordination.
 * Learning ≠ permission; embassy/bureau cannot approve deals/spend;
 * no uncontrolled jurisdiction bypass; no permission/spend escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CN_LOCKS,
  CROSS_BORDER_PERMISSION_DENIED,
  HONESTY_BANNER,
  type CnActor,
} from './world-knowledge-routing-os-types';

export type ResearchSession = {
  id: string;
  topic: string;
  jurisdictions: string[];
  bounded: true;
  permissionEscalated: false;
  spendEscalated: false;
  dealApproved: false;
  status: 'open' | 'closed' | 'denied';
  createdAt: string;
};

export type ResearchActionResult = {
  accepted: boolean;
  reason: string;
  session?: ResearchSession;
  at: string;
};

type Store = {
  sessions: ResearchSession[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'cross-border-agent-research-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sessions: [], denials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function crossBorderResearchHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    crossBorderResearchBounded: CN_LOCKS.CROSS_BORDER_RESEARCH_BOUNDED,
    crossBorderPermissionEscalation: CN_LOCKS.CROSS_BORDER_PERMISSION_ESCALATION,
    crossBorderSpendEscalation: CN_LOCKS.CROSS_BORDER_SPEND_ESCALATION,
    embassyBureauCanApproveDeals: CN_LOCKS.EMBASSY_BUREAU_CAN_APPROVE_DEALS,
    embassyBureauCanApproveSpend: CN_LOCKS.EMBASSY_BUREAU_CAN_APPROVE_SPEND,
    learningIsPermission: CN_LOCKS.LEARNING_IS_PERMISSION,
    autonomousSpending: CN_LOCKS.AUTONOMOUS_SPENDING,
    dealApprovalAuthority: CN_LOCKS.DEAL_APPROVAL_AUTHORITY,
  };
}

export async function openResearchSession(input: {
  topic: string;
  jurisdictions: string[];
  root: string;
  actor: CnActor;
}): Promise<ResearchActionResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const session: ResearchSession = {
    id: id('xbr'),
    topic: input.topic,
    jurisdictions: [...input.jurisdictions],
    bounded: true,
    permissionEscalated: false,
    spendEscalated: false,
    dealApproved: false,
    status: 'open',
    createdAt: now,
  };
  store.sessions.push(session);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'CROSS_BORDER_RESEARCH_SESSION_OPEN_BOUNDED',
    session,
    at: now,
  };
}

export async function attemptResearchEscalation(input: {
  sessionId: string;
  claimPermissionEscalation?: boolean;
  claimSpendAuthority?: boolean;
  claimDealApproval?: boolean;
  root: string;
  actor: CnActor;
}): Promise<ResearchActionResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const session = store.sessions.find((s) => s.id === input.sessionId);

  if (
    input.claimPermissionEscalation === true ||
    input.claimSpendAuthority === true ||
    input.claimDealApproval === true ||
    input.actor?.kind === 'embassy_bureau'
  ) {
    store.denials.push({
      id: id('xbrdeny'),
      at: now,
      reason: CROSS_BORDER_PERMISSION_DENIED,
    });
    await save(input.root, store);
    return {
      accepted: false,
      reason: CROSS_BORDER_PERMISSION_DENIED,
      session: session
        ? {
            ...session,
            permissionEscalated: false,
            spendEscalated: false,
            dealApproved: false,
          }
        : undefined,
      at: now,
    };
  }

  return {
    accepted: false,
    reason: CROSS_BORDER_PERMISSION_DENIED,
    session,
    at: now,
  };
}
