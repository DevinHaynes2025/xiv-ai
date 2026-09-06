import type { BusinessContext, OperationalSignals, SystemContextSlice } from './types';

/**
 * Replaceable read-only context port. Later integrations implement this
 * without changing agents or the policy engine.
 */
export type BusinessContextProvider = {
  getBusinessContext(): BusinessContext;
  getOperationalSignals(): OperationalSignals;
  getSystemContext(): SystemContextSlice;
};
