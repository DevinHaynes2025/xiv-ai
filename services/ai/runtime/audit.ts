import type { ApprovalRecord, GovernedAction, GovernedAuditEvent } from './actions';

export type AuditStore = {
  record(event: GovernedAuditEvent): void;
  recordAction(action: GovernedAction): void;
  recordApproval(record: ApprovalRecord): void;
  getAction(actionId: string): GovernedAction | undefined;
  getApproval(actionId: string): ApprovalRecord | undefined;
  listEvents(): GovernedAuditEvent[];
  listActions(): GovernedAction[];
  listApprovals(): ApprovalRecord[];
  listPending(): GovernedAction[];
};

export function createMemoryAuditStore(): AuditStore {
  const events: GovernedAuditEvent[] = [];
  const actions: GovernedAction[] = [];
  const approvals = new Map<string, ApprovalRecord>();

  return {
    record(event) {
      events.unshift(event);
    },
    recordAction(action) {
      const index = actions.findIndex((item) => item.actionId === action.actionId);
      if (index >= 0) {
        actions[index] = action;
        return;
      }
      actions.unshift(action);
    },
    recordApproval(record) {
      approvals.set(record.actionId, record);
    },
    getAction(actionId) {
      return actions.find((item) => item.actionId === actionId);
    },
    getApproval(actionId) {
      return approvals.get(actionId);
    },
    listEvents() {
      return [...events];
    },
    listActions() {
      return [...actions];
    },
    listApprovals() {
      return [...approvals.values()];
    },
    listPending() {
      return actions.filter((item) => item.status === 'awaiting_approval' && item.approvalStatus === 'pending');
    },
  };
}

const defaultStore = createMemoryAuditStore();

export function getPrototypeAuditStore() {
  return defaultStore;
}
