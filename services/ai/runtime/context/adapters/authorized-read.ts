import { createCompanyDataGateway, type CompanyDataRequest, type CompanyDataResult } from '../../company-data';
import { evaluatePolicy } from '../../policy';
import { createHttpHealthAdapter, resolveConfiguredHealthUrl } from './http-health';
import type { BusinessDataAdapter } from './types';

/**
 * The only supported live-read path. Agents must not call adapters directly.
 */
export async function readAuthorizedCompanyData(
  request: CompanyDataRequest,
  adapter: BusinessDataAdapter = createHttpHealthAdapter({ healthUrl: resolveConfiguredHealthUrl() }),
): Promise<CompanyDataResult> {
  const policy = evaluatePolicy({
    agentId: request.agentId,
    toolId: request.toolId,
    environment: 'development',
  });
  if (policy.verdict !== 'allowed') {
    return {
      allowed: false,
      reason: policy.reason,
      status: 'denied',
      records: [],
      provenance: null,
      message: policy.reason,
      usedPrototypeFallback: false,
    };
  }
  const gateway = createCompanyDataGateway(adapter);
  return gateway.read(request);
}
