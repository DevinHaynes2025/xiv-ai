export type StartupStatus = 'STARTING' | 'READY' | 'DEGRADED' | 'UNVERIFIED';

export interface StartupReceipt {
  status: StartupStatus;
  timestamp: string;
  localhostOnly: true;
  productionMutationAllowed: false;
  ollamaReachable: boolean;
  agentRegistryLoaded: boolean;
  dashboardWritten: boolean;
  evidenceRefs: string[];
}

export function buildStartupReceipt(input: Omit<StartupReceipt, 'localhostOnly' | 'productionMutationAllowed'>): StartupReceipt {
  return {
    ...input,
    localhostOnly: true,
    productionMutationAllowed: false,
  };
}
