import { sanitizeAuditText, stripSignedUrlSecrets } from '../audit-access';

export type DistributedTrace = {
  requestId: string;
  correlationId: string;
  tenant: string | null;
  universe: string | null;
  service: string;
  agent: string | null;
  tool: string | null;
  provider: string | null;
  latencyMs: number | 'not_measured';
  result: 'ok' | 'denied' | 'error' | 'not_configured';
  policy: string | null;
  error: string | null;
};

export function createDistributedTrace(input: DistributedTrace): DistributedTrace {
  return {
    ...input,
    error: input.error ? sanitizeAuditText(stripSignedUrlSecrets(input.error)) : null,
  };
}
