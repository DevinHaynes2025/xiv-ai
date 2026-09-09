/**
 * Provider access must pass this ordered gate. Default deny.
 * No service_role. No secret logging. No Global Brain promotion of private data.
 */
import { canIngestFromProvider, sourceAuditEvents } from './registry';
import { evaluateGlobalBrainIngestion, sourcesUseServiceRole } from './policy';

export const PROVIDER_ACCESS_PIPELINE = [
  'provider_authorization',
  'source_policy',
  'data_classification',
  'provenance_validation',
  'tenant_global_scope',
  'data_gateway',
  'audit',
] as const;

export function evaluateProviderAccess(input: {
  providerId: string;
  category: string | null;
  brainOrigin: 'personal' | 'company' | 'global' | 'external_public';
  provenancePresent: boolean;
  licenseKnown: boolean;
  crossTenant?: boolean;
  unrestrictedAgentIngest?: boolean;
}) {
  if (sourcesUseServiceRole()) {
    return { allowed: false as const, reason: 'service_role is not used.', pipeline: PROVIDER_ACCESS_PIPELINE };
  }
  const ingest = canIngestFromProvider(input.providerId);
  if (!ingest.allowed) {
    return { ...ingest, pipeline: PROVIDER_ACCESS_PIPELINE, auditEvents: sourceAuditEvents() };
  }
  const globalGate = evaluateGlobalBrainIngestion({
    category: input.category,
    brainOrigin: input.brainOrigin,
    provenancePresent: input.provenancePresent,
    licenseKnown: input.licenseKnown,
    crossTenant: input.crossTenant,
    unrestrictedAgentIngest: input.unrestrictedAgentIngest,
  });
  if (!globalGate.allowed) {
    return { allowed: false as const, reason: globalGate.reason, pipeline: PROVIDER_ACCESS_PIPELINE };
  }
  return {
    allowed: true as const,
    reason: 'Provider access passed authorization, policy, classification, provenance, scope, gateway, and audit.',
    pipeline: PROVIDER_ACCESS_PIPELINE,
    secretsLogged: false as const,
    usesServiceRole: false as const,
  };
}
