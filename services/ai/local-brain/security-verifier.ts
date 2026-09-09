import { evaluateSandboxGitAction, isCredentialPath } from './sandbox-guard';
import type { StructuredPatchProposal } from './coding-agent';

export type SecurityFinding = {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  path?: string;
  message: string;
};

const SECRET_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  { code: 'PRIVATE_KEY', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { code: 'AWS_ACCESS_KEY', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { code: 'GITHUB_TOKEN', pattern: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { code: 'GENERIC_SECRET', pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"\s]{8,}['"]/i },
];

const TENANT_BOUNDARY_PATTERNS = [
  /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i,
  /DROP\s+POLICY/i,
  /BYPASSRLS/i,
  /ALTER\s+TABLE[\s\S]{0,120}DISABLE\s+ROW\s+LEVEL\s+SECURITY/i,
];

function scanText(text: string, path: string, findings: SecurityFinding[]) {
  for (const secret of SECRET_PATTERNS) {
    if (secret.pattern.test(text)) {
      findings.push({ code: secret.code, severity: 'CRITICAL', path, message: `Secret-like material detected in ${path}.` });
    }
  }
  for (const pattern of TENANT_BOUNDARY_PATTERNS) {
    if (pattern.test(text)) {
      findings.push({ code: 'TENANT_BOUNDARY', severity: 'CRITICAL', path, message: `Tenant/RLS boundary change detected in ${path}.` });
    }
  }
  if (/\bL4_AUTONOMY_ENABLED\s*=\s*true\b/i.test(text) || /\bAUTO_PRODUCTION_DEPLOY\s*=\s*true\b/i.test(text) || /\bAUTO_GUARDIAN_OVERRIDE\s*=\s*true\b/i.test(text)) {
    findings.push({ code: 'PRODUCTION_LOCK', severity: 'CRITICAL', path, message: `Attempt to weaken a production lock in ${path}.` });
  }
}

function diffIntegrity(path: string, unifiedDiff: string, findings: SecurityFinding[]) {
  if (unifiedDiff.includes('\0')) {
    findings.push({ code: 'DIFF_INTEGRITY', severity: 'HIGH', path, message: 'Diff contains a NUL byte.' });
  }
  if (unifiedDiff.includes('/../') || unifiedDiff.includes('\n../')) {
    findings.push({ code: 'DIFF_INTEGRITY', severity: 'HIGH', path, message: 'Diff contains a path-traversal sequence.' });
  }
  const headerPaths = [...unifiedDiff.matchAll(/^(?:---|\+\+\+)\s+[ab]\/(.+)$/gm)].map((match) => match[1]);
  if (headerPaths.some((headerPath) => headerPath !== path && !headerPath.endsWith(`/${path}`) && headerPath !== '/dev/null')) {
    findings.push({ code: 'DIFF_INTEGRITY', severity: 'MEDIUM', path, message: `Diff header path does not match declared file ${path}.` });
  }
}

export function verifySecurity(input: {
  files: Array<{ path: string; content?: string; unifiedDiff?: string }>;
  currentBranch?: string;
  tenantBoundaryChanged?: boolean;
  productionLocks?: {
    l4Autonomy?: boolean;
    autoProduction?: boolean;
    productionDbWrite?: boolean;
    productionGitPush?: boolean;
    guardianOverride?: boolean;
  };
}) {
  const findings: SecurityFinding[] = [];
  const locks = input.productionLocks ?? {};
  if (locks.l4Autonomy) findings.push({ code: 'PRODUCTION_LOCK', severity: 'CRITICAL', message: 'L4 autonomy must remain disabled.' });
  if (locks.autoProduction) findings.push({ code: 'PRODUCTION_LOCK', severity: 'CRITICAL', message: 'Auto production deploy must remain disabled.' });
  if (locks.productionDbWrite) findings.push({ code: 'PRODUCTION_LOCK', severity: 'CRITICAL', message: 'Production database writes must remain disabled.' });
  if (locks.productionGitPush) findings.push({ code: 'PRODUCTION_LOCK', severity: 'CRITICAL', message: 'Production git push must remain disabled.' });
  if (locks.guardianOverride) findings.push({ code: 'PRODUCTION_LOCK', severity: 'CRITICAL', message: 'Guardian override must remain disabled.' });
  if (input.tenantBoundaryChanged) {
    findings.push({ code: 'TENANT_BOUNDARY', severity: 'CRITICAL', message: 'Tenant/Universe boundary change requires human authorization.' });
  }
  if (input.currentBranch) {
    const branch = evaluateSandboxGitAction({ currentBranch: input.currentBranch, action: 'commit' });
    if (!branch.allowed) findings.push({ code: 'PROTECTED_REF', severity: 'HIGH', message: branch.reason });
  }

  for (const file of input.files) {
    if (isCredentialPath(file.path)) {
      findings.push({ code: 'PROTECTED_PATH', severity: 'CRITICAL', path: file.path, message: `Protected or credential path: ${file.path}` });
    }
    if (file.unifiedDiff) {
      diffIntegrity(file.path, file.unifiedDiff, findings);
      scanText(file.unifiedDiff, file.path, findings);
    }
    if (file.content) scanText(file.content, file.path, findings);
  }

  return {
    passed: findings.length === 0,
    findings,
    productionAuthorization: false as const,
  };
}

export function verifyPatchProposal(proposal: StructuredPatchProposal, currentBranch?: string) {
  return verifySecurity({
    files: proposal.files.map((file) => ({ path: file.path, unifiedDiff: file.unifiedDiff })),
    currentBranch,
  });
}
