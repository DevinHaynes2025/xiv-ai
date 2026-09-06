import type { GovernedAction, GovernedAuditEvent } from './actions';

export type AuditStore = {
  record(event: GovernedAuditEvent): void;
  recordAction(action: GovernedAction): void;
  listEvents(): GovernedAuditEvent[];
  listActions(): GovernedAction[];
};

/**
 * In-memory prototype store. Persistence can replace this later
 * without changing the runtime call sites.
 */
export function createMemoryAuditStore(): AuditStore {
  const events: GovernedAuditEvent[] = [];
  const actions: GovernedAction[] = [];

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
    listEvents() {
      return [...events];
    },
    listActions() {
      return [...actions];
    },
  };
}

const defaultStore = createMemoryAuditStore();

export function getPrototypeAuditStore() {
  return defaultStore;
}
