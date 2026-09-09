import type { ExecutiveBrief } from '../brief';
import type { LiveSourceStatus } from './adapters/types';
import type { BusinessHealthReport } from './report';
import type { BusinessContext, OperationalSignals, SystemContextSlice } from './types';

export type DataAvailability = {
  status: LiveSourceStatus | 'prototype';
  message: string;
  prototype: boolean;
};

/**
 * Replaceable read-only context port. Later integrations implement this
 * without changing agents or the policy engine.
 */
export type BusinessContextProvider = {
  getBusinessContext(): BusinessContext;
  getOperationalSignals(): OperationalSignals;
  getSystemContext(): SystemContextSlice;
  getBusinessHealthReport(): BusinessHealthReport;
  getDataAvailability(): DataAvailability;
  getExecutiveBrief(): ExecutiveBrief;
};
