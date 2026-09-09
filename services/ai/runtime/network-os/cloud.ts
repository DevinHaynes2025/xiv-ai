/**
 * Cloud execution boundary. Cursor Cloud Agent is not XIV production authority.
 */
export type CloudExecutionProviderStatus = 'not_configured' | 'configured' | 'connected' | 'degraded' | 'unavailable';

export type CloudExecutionProvider = {
  status: CloudExecutionProviderStatus;
  cursorCloudAgentIsProductionAuthority: false;
  live: false;
};

export type JobQueueProvider = { status: CloudExecutionProviderStatus; live: false };
export type AgentExecutionProvider = { status: CloudExecutionProviderStatus; live: false };
export type StorageProvider = { status: CloudExecutionProviderStatus; live: false };

export type CloudJob = {
  jobId: string;
  tenantOrganizationId: string;
  permissions: readonly string[];
  timeoutMs: number;
  circuitBreaker: true;
  costControls: true;
  audit: true;
};

export function cloudExecutionProvider(): CloudExecutionProvider {
  return { status: 'not_configured', cursorCloudAgentIsProductionAuthority: false, live: false };
}

export function cursorCloudAgentIsProductionAuthority() {
  return false;
}

export function createCloudJob(input: { jobId: string; tenantOrganizationId?: string | null }): CloudJob | { allowed: false; reason: string } {
  if (!input.tenantOrganizationId) {
    return { allowed: false, reason: 'Cloud execution requires tenant scope, job identity, permissions, limits, and audit.' };
  }
  return {
    jobId: input.jobId,
    tenantOrganizationId: input.tenantOrganizationId,
    permissions: [],
    timeoutMs: 30_000,
    circuitBreaker: true,
    costControls: true,
    audit: true,
  };
}
