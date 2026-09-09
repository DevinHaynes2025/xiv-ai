import { createMemoryAuditStore } from './runtime/audit';
import { recordAccessEvent } from './runtime/audit-access';
import { buildExecutiveBrief } from './runtime/brief';
import { createCompanyDataGateway } from './runtime/company-data';
import { createHttpHealthAdapter, resolveConfiguredHealthUrl } from './runtime/context/adapters/http-health';
import { createLiveContextProvider } from './runtime/context/adapters/live-provider';
import { createSignedUploadGrant } from './runtime/media/signed';

const store = createMemoryAuditStore();

function noSecrets<T extends Record<string, unknown>>(body: T) {
  const serialized = JSON.stringify(body);
  if (/(password|token|api[_-]?key|secret|AKIA|X-Amz-)/i.test(serialized)) {
    return { error: { code: 'secret_stripped', message: 'Response withheld because it would leak a secret.' } };
  }
  return body;
}

export async function businessSourceStatus(userId: string) {
  const adapter = createHttpHealthAdapter({ healthUrl: resolveConfiguredHealthUrl() });
  const status = await adapter.getConnectionStatus();
  const capabilities = adapter.getCapabilities();
  recordAccessEvent(store, {
    category: 'source',
    agentId: 'executive',
    toolId: 'company_data_reader',
    reason: `source status ${status}`,
    decision: 'allowed',
  });
  return noSecrets({
    userId,
    status,
    domains: capabilities.domains,
    records: capabilities.records,
    writeSupported: false,
    configured: adapter.getSourceMetadata().configured,
    firstRealSource: 'authorized session records on mobile; HTTP /health connection probe here',
    sessionRecords: 'not_configured',
    message:
      status === 'live'
        ? 'LIVE DATA for connection health only. No ERP, WMS, or TMS records.'
        : status === 'not_configured'
          ? 'NOT CONFIGURED'
          : 'SOURCE UNAVAILABLE',
  });
}

export async function businessHealth(userId: string) {
  const adapter = createHttpHealthAdapter({ healthUrl: resolveConfiguredHealthUrl() });
  const gateway = createCompanyDataGateway(adapter);
  const live = await gateway.read({
    agentId: 'executive',
    toolId: 'company_data_reader',
    capability: 'connection_health',
    mode: 'read',
    classification: 'public',
  });
  const provider = createLiveContextProvider({
    status: live.status === 'denied' ? 'unavailable' : live.status,
    provenance: live.provenance,
    records: live.records,
    domains: adapter.getCapabilities().domains,
  });
  const report = provider.getBusinessHealthReport();
  recordAccessEvent(store, {
    category: 'business_data',
    agentId: 'executive',
    toolId: 'business_health_report',
    reason: `health ${report.dataStatus ?? 'unknown'}`,
    decision: live.allowed ? 'allowed' : 'denied',
  });
  return noSecrets({
    userId,
    report,
    usedPrototypeFallback: false,
    financialImpactNote: 'Financial impact unavailable from connected sources.',
  });
}

export async function businessExecutiveBrief(userId: string) {
  const adapter = createHttpHealthAdapter({ healthUrl: resolveConfiguredHealthUrl() });
  const status = await adapter.getConnectionStatus();
  const live = await createCompanyDataGateway(adapter).read({
    agentId: 'executive',
    toolId: 'executive_brief_builder',
    capability: 'connection_health',
    mode: 'read',
    classification: 'public',
  });
  const brief = buildExecutiveBrief({
    liveStatus: live.status === 'denied' ? 'unavailable' : live.status,
    provenance: live.provenance,
  });
  recordAccessEvent(store, {
    category: 'agent_data',
    agentId: 'executive',
    toolId: 'executive_brief_builder',
    reason: `brief ${brief.dataStatus}`,
    decision: 'allowed',
  });
  return noSecrets({
    userId,
    brief,
    connectionStatus: status,
    financialImpactNote: brief.financialImpactNote,
  });
}

export function mediaAuthorize(userId: string, body: Record<string, unknown>) {
  const mime = typeof body.mimeType === 'string' ? body.mimeType : '';
  const grant = createSignedUploadGrant({
    mediaId: typeof body.mediaId === 'string' ? body.mediaId : `media_${Date.now().toString(36)}`,
    ownerId: userId,
    universeId: typeof body.universeId === 'string' ? body.universeId : '',
    organizationId: typeof body.organizationId === 'string' ? body.organizationId : '',
    allowedMime: mime,
    maxBytes: typeof body.sizeBytes === 'number' ? body.sizeBytes : 0,
    visibility: body.visibility === 'public' ? 'public' : 'private',
    classification: 'internal',
    ttlMs: 15 * 60_000,
  });
  recordAccessEvent(store, {
    category: 'media',
    agentId: 'executive',
    toolId: 'media_intelligence_reader',
    universeId: grant.universeId,
    organizationId: grant.organizationId,
    resourceId: grant.mediaId,
    reason: 'Upload authorization not configured. No signed cloud URL issued.',
    decision: 'denied',
  });
  return noSecrets({
    uploadEnabled: false,
    configured: false,
    credentialsReturned: false,
    status: 'not_configured',
    message: 'UPLOAD NOT CONFIGURED. Signed upload is not live.',
    expiresAt: grant.expiresAt,
    mediaId: grant.mediaId,
  });
}

export function mediaComplete() {
  recordAccessEvent(store, {
    category: 'media',
    agentId: 'executive',
    toolId: 'media_intelligence_reader',
    reason: 'Upload complete denied. Storage provider is not_configured.',
    decision: 'denied',
  });
  return noSecrets({
    ok: false,
    status: 'denied',
    message: 'Upload complete denied. Storage provider is not_configured.',
    credentialsReturned: false,
  });
}

export function mediaStatus(mediaId: string) {
  return noSecrets({
    mediaId,
    pipelineStatus: 'quarantined',
    scanStatus: 'unavailable',
    uploadEnabled: false,
    publicUrl: null,
    message: 'SCAN UNAVAILABLE. Upload not configured. Media is not marked safe.',
  });
}
