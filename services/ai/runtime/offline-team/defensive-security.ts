export type SecurityFindingSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface SecurityScanInput {
  authorized: boolean;
  scopeId: string;
  files: readonly { path: string; content: string }[];
}

export interface SecurityFinding {
  id: string;
  severity: SecurityFindingSeverity;
  path: string;
  category: 'SECRET_PATTERN' | 'DANGEROUS_CONFIG' | 'MISSING_GUARDRAIL';
  evidence: string;
}

export const DEFENSIVE_SECURITY_GUARDRAILS = {
  authorizedScopeRequired: true,
  exploitExecutionAllowed: false,
  credentialTheftAllowed: false,
  persistenceAllowed: false,
  destructiveActionAllowed: false,
  productionMutationAllowed: false,
} as const;

const secretPatterns: RegExp[] = [
  /AKIA[0-9A-Z]{16}/g,
  /xox[baprs]-[0-9A-Za-z-]{10,}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
];

export function runAuthorizedStaticSecurityScan(input: SecurityScanInput): SecurityFinding[] {
  if (!input.authorized) throw new Error('authorized scope required');
  const findings: SecurityFinding[] = [];
  for (const file of input.files) {
    for (const pattern of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(file.content)) {
        findings.push({
          id: `${input.scopeId}:${file.path}:secret`,
          severity: 'HIGH',
          path: file.path,
          category: 'SECRET_PATTERN',
          evidence: 'high-confidence credential-like pattern detected; value intentionally not returned',
        });
      }
    }
    if (/productionAutoDeploy\s*[:=]\s*true/.test(file.content)) {
      findings.push({
        id: `${input.scopeId}:${file.path}:autodeploy`,
        severity: 'HIGH',
        path: file.path,
        category: 'DANGEROUS_CONFIG',
        evidence: 'production auto-deploy flag appears enabled',
      });
    }
  }
  return findings;
}
