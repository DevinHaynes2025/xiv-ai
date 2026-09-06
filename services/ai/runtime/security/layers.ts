export type ControlMaturity = 'implemented' | 'prototype' | 'planned';

export type SecurityControl = {
  id: string;
  name: string;
  maturity: ControlMaturity;
};

export const SECURITY_CONTROLS: readonly SecurityControl[] = [
  { id: 'identity', name: 'Identity', maturity: 'implemented' },
  { id: 'mfa', name: 'MFA / passkeys architecture', maturity: 'planned' },
  { id: 'device_session', name: 'Device / session trust', maturity: 'prototype' },
  { id: 'rbac', name: 'RBAC', maturity: 'prototype' },
  { id: 'abac', name: 'ABAC', maturity: 'prototype' },
  { id: 'universe_isolation', name: 'Universe isolation', maturity: 'prototype' },
  { id: 'org_isolation', name: 'Organization isolation', maturity: 'prototype' },
  { id: 'classification', name: 'Data classification', maturity: 'prototype' },
  { id: 'least_privilege', name: 'Least privilege', maturity: 'implemented' },
  { id: 'signed_media', name: 'Signed media access', maturity: 'prototype' },
  { id: 'tls', name: 'Encryption in transit', maturity: 'implemented' },
  { id: 'encryption_rest', name: 'Encryption at rest', maturity: 'planned' },
  { id: 'key_management', name: 'Key-management abstraction', maturity: 'prototype' },
  { id: 'rate_limit', name: 'Rate limiting', maturity: 'planned' },
  { id: 'waf', name: 'WAF / DDoS architecture', maturity: 'planned' },
  { id: 'malware', name: 'Malware scanning', maturity: 'planned' },
  { id: 'content_validation', name: 'Content validation', maturity: 'prototype' },
  { id: 'audit', name: 'Audit events', maturity: 'prototype' },
  { id: 'anomaly', name: 'Anomaly detection', maturity: 'planned' },
  { id: 'backup', name: 'Backup / recovery', maturity: 'planned' },
  { id: 'region', name: 'Regional isolation', maturity: 'planned' },
  { id: 'secrets', name: 'Secret management', maturity: 'implemented' },
  { id: 'deps', name: 'Dependency security', maturity: 'planned' },
  { id: 'sdlc', name: 'Secure SDLC', maturity: 'prototype' },
  { id: 'agent_policy', name: 'Agent policy enforcement', maturity: 'implemented' },
];
