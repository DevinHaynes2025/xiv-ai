/**
 * AC-16 secret and credential scanner.
 *
 * Scans the git working tree for high-confidence credential material. Rules are
 * deliberately narrow: each one matches a credential format that is meaningful
 * on its own, so a finding is a finding rather than a guess. Placeholder and
 * example values are excluded by an explicit allowlist, and the allowlist is
 * reported alongside the findings.
 *
 * Usage: tsx tools/secret-scan.ts [--json]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

export type Severity = 'critical' | 'high' | 'medium';

export type SecretRule = {
  id: string;
  severity: Severity;
  description: string;
  pattern: RegExp;
};

export type SecretFinding = {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  excerpt: string;
};

/**
 * Values that look like credentials but are not: documented placeholders and
 * example files. Anything matched here is reported separately so the exclusion
 * is visible rather than silent.
 */
const PLACEHOLDER = /(your[_-]?|example|placeholder|changeme|dummy|redacted|xxx+|<[^>]+>|\.\.\.|sample|test[_-]?key)/i;

export const SECRET_RULES: readonly SecretRule[] = [
  {
    id: 'aws_access_key_id',
    severity: 'critical',
    description: 'AWS access key id',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: 'google_api_key',
    severity: 'critical',
    description: 'Google / Gemini API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: 'openai_api_key',
    severity: 'critical',
    description: 'OpenAI API key',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g,
  },
  {
    id: 'anthropic_api_key',
    severity: 'critical',
    description: 'Anthropic API key',
    pattern: /\bsk-ant-[A-Za-z0-9_-]{24,}\b/g,
  },
  {
    id: 'private_key_block',
    severity: 'critical',
    description: 'PEM private key block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    id: 'github_token',
    severity: 'critical',
    description: 'GitHub personal access token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: 'slack_token',
    severity: 'critical',
    description: 'Slack token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: 'supabase_service_role_jwt',
    severity: 'critical',
    description: 'Supabase service_role JWT',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*(?:c2VydmljZV9yb2xl|service_role)[A-Za-z0-9_-]*\.[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: 'generic_jwt',
    severity: 'high',
    description: 'JWT-shaped credential',
    pattern: /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: 'assigned_secret_literal',
    severity: 'high',
    description: 'Secret-named variable assigned a long literal',
    pattern:
      /\b(?:api[_-]?key|secret[_-]?key|service[_-]?role[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|passwd|private[_-]?key)\b\s*[:=]\s*['"`][^'"`\n]{16,}['"`]/gi,
  },
  {
    id: 'postgres_url_with_password',
    severity: 'high',
    description: 'Database URL containing a password',
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:@/]+:[^\s:@/]{6,}@/g,
  },
];

/** Files whose contents are never credentials but often trip entropy rules. */
const SKIPPED_PATHS = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /\.(png|jpg|jpeg|gif|webp|ico|pdf|svg|ttf|otf|woff2?|mp4|zip|gz)$/i,
];

/** Client bundle roots where server-only credentials are prohibited outright. */
export const CLIENT_BUNDLE_ROOTS = ['apps/mobile/src', 'apps/mobile/app.json'];

const CLIENT_PROHIBITED = [
  /SUPABASE_SERVICE_ROLE(?:_KEY)?/g,
  /SERVICE_ROLE_KEY/g,
  /GEMINI_API_KEY/g,
  /GOOGLE_API_KEY/g,
  /OPENAI_API_KEY/g,
  /ANTHROPIC_API_KEY/g,
];

export type SecretScanReport = {
  scannedFiles: number;
  skippedFiles: number;
  findings: SecretFinding[];
  placeholderMatches: SecretFinding[];
  criticalCount: number;
  highCount: number;
  clientBundleViolations: SecretFinding[];
  envExampleFilesWithValues: string[];
  gitignoreCoversEnv: boolean;
};

/**
 * Covers tracked files plus untracked ones git would let you commit. Scanning
 * only the index leaves work in progress unscanned, which is the window a
 * credential is most likely to be sitting in.
 */
function scannableFiles(): string[] {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return [...new Set(output.split('\n').filter(Boolean))].sort();
}

function isSkipped(file: string): boolean {
  return SKIPPED_PATHS.some((pattern) => pattern.test(file));
}

/**
 * Applies the rule set to one file's contents. Exported so the rules can be
 * proven to fire against synthetic credentials in the unit suite: a scanner
 * that reports zero findings because its rules never match is worse than none.
 */
export function scanContents(
  file: string,
  contents: string,
): { findings: SecretFinding[]; placeholderMatches: SecretFinding[]; clientBundleViolations: SecretFinding[] } {
  const findings: SecretFinding[] = [];
  const placeholderMatches: SecretFinding[] = [];
  const clientBundleViolations: SecretFinding[] = [];
  const lines = contents.split('\n');

  for (const rule of SECRET_RULES) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] as string;
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(line);
      if (!match) continue;
      const finding: SecretFinding = {
        ruleId: rule.id,
        severity: rule.severity,
        file,
        line: index + 1,
        excerpt: `${match[0].slice(0, 12)}…(${match[0].length} chars)`,
      };
      if (PLACEHOLDER.test(line) || file.endsWith('.env.example')) {
        placeholderMatches.push(finding);
      } else {
        findings.push(finding);
      }
    }
  }

  if (CLIENT_BUNDLE_ROOTS.some((root) => file.startsWith(root))) {
    // One violation per line: several patterns can match the same reference and
    // that is one problem to fix, not several.
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] as string;
      const matched = CLIENT_PROHIBITED.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(line);
      });
      if (!matched) continue;
      clientBundleViolations.push({
        ruleId: 'client_bundle_server_credential',
        severity: 'critical',
        file,
        line: index + 1,
        excerpt: line.trim().slice(0, 80),
      });
    }
  }

  return { findings, placeholderMatches, clientBundleViolations };
}

export function scanSecrets(): SecretScanReport {
  const files = scannableFiles();
  const findings: SecretFinding[] = [];
  const placeholderMatches: SecretFinding[] = [];
  const clientBundleViolations: SecretFinding[] = [];
  const envExampleFilesWithValues: string[] = [];
  let scannedFiles = 0;
  let skippedFiles = 0;

  for (const file of files) {
    if (isSkipped(file)) {
      skippedFiles += 1;
      continue;
    }
    const absolute = join(repoRoot, file);
    let contents: string;
    try {
      if (statSync(absolute).size > 4 * 1024 * 1024) {
        skippedFiles += 1;
        continue;
      }
      contents = readFileSync(absolute, 'utf8');
    } catch {
      skippedFiles += 1;
      continue;
    }
    scannedFiles += 1;
    const lines = contents.split('\n');
    const scanned = scanContents(file, contents);
    findings.push(...scanned.findings);
    placeholderMatches.push(...scanned.placeholderMatches);
    clientBundleViolations.push(...scanned.clientBundleViolations);

    // An .env.example must document secret names, never their values. A
    // non-secret default such as a localhost URL or a model name is fine.
    if (file.endsWith('.env.example')) {
      const withValues = lines.filter((line) => {
        const match = /^([A-Z0-9_]+)=(.+)$/.exec(line.trim());
        if (!match) return false;
        const name = match[1] as string;
        const value = (match[2] as string).trim();
        if (!/(KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL)$/.test(name)) return false;
        return value.length > 12 && !PLACEHOLDER.test(value);
      });
      if (withValues.length) envExampleFilesWithValues.push(file);
    }
  }

  let gitignoreCoversEnv = false;
  try {
    const gitignore = readFileSync(join(repoRoot, '.gitignore'), 'utf8');
    gitignoreCoversEnv = /^\.env$/m.test(gitignore) && /\*\*\/\.env/m.test(gitignore);
  } catch {
    gitignoreCoversEnv = false;
  }

  return {
    scannedFiles,
    skippedFiles,
    findings,
    placeholderMatches,
    criticalCount: findings.filter((finding) => finding.severity === 'critical').length,
    highCount: findings.filter((finding) => finding.severity === 'high').length,
    clientBundleViolations,
    envExampleFilesWithValues,
    gitignoreCoversEnv,
  };
}

/** Scans arbitrary emitted text (logs, transcripts) for known secret values. */
export function findLeakedValues(haystack: string, needles: readonly string[]): string[] {
  return needles.filter((needle) => needle.length >= 8 && haystack.includes(needle));
}

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (invokedDirectly) {
  const report = scanSecrets();
  if (process.argv.includes('--json')) {
    console.info(JSON.stringify(report, null, 2));
  } else {
    console.info(`[secret-scan] scanned ${report.scannedFiles} working-tree files (${report.skippedFiles} skipped)`);
    for (const finding of report.findings) {
      console.info(`[secret-scan] ${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.file}:${finding.line} ${finding.excerpt}`);
    }
    for (const finding of report.clientBundleViolations) {
      console.info(`[secret-scan] CLIENT ${finding.file}:${finding.line} ${finding.excerpt}`);
    }
    console.info(
      `[secret-scan] critical=${report.criticalCount} high=${report.highCount} clientBundle=${report.clientBundleViolations.length} placeholdersExcluded=${report.placeholderMatches.length}`,
    );
  }
  if (report.criticalCount > 0 || report.clientBundleViolations.length > 0) process.exitCode = 1;
}
