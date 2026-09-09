export type SecurityDomainId =
  | 'identity'
  | 'session'
  | 'device'
  | 'tenant'
  | 'data'
  | 'agent'
  | 'tool'
  | 'model'
  | 'api'
  | 'media'
  | 'live'
  | 'infrastructure'
  | 'supply_chain'
  | 'audit'
  | 'recovery'
  | 'global_deployment';

export type SecurityDomain = {
  id: SecurityDomainId;
  name: string;
  certifiedLayer: false;
  maturity: 'implemented' | 'prototype' | 'planned';
};

export const SECURITY_DOMAINS: readonly SecurityDomain[] = [
  { id: 'identity', name: 'Identity Security', certifiedLayer: false, maturity: 'implemented' },
  { id: 'session', name: 'Session Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'device', name: 'Device Security', certifiedLayer: false, maturity: 'planned' },
  { id: 'tenant', name: 'Tenant Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'data', name: 'Data Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'agent', name: 'Agent Security', certifiedLayer: false, maturity: 'implemented' },
  { id: 'tool', name: 'Tool Security', certifiedLayer: false, maturity: 'implemented' },
  { id: 'model', name: 'Model Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'api', name: 'API Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'media', name: 'Media Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'live', name: 'Live Security', certifiedLayer: false, maturity: 'planned' },
  { id: 'infrastructure', name: 'Infrastructure Security', certifiedLayer: false, maturity: 'planned' },
  { id: 'supply_chain', name: 'Supply Chain Security', certifiedLayer: false, maturity: 'planned' },
  { id: 'audit', name: 'Audit Security', certifiedLayer: false, maturity: 'prototype' },
  { id: 'recovery', name: 'Recovery Security', certifiedLayer: false, maturity: 'planned' },
  { id: 'global_deployment', name: 'Global Deployment Security', certifiedLayer: false, maturity: 'planned' },
];

export function certifiedSecurityLayerCount() {
  return 0;
}
