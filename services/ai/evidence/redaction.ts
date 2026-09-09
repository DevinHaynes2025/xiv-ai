import { sanitizeGeminiDiagnostic } from '../diagnostics';
import type { SecretScanPayload } from './types';

/**
 * Sections 34 and 47: secrets, authentication tokens, private prompts and
 * unnecessary customer data must not be copied into evidence artifacts, and a
 * discovered credential value must never reach a Founder Brief.
 *
 * The ledger refuses a record that trips this detector rather than silently
 * scrubbing it. A scrubbed artifact would no longer match the hash the
 * producer computed, and quietly rewriting evidence is exactly the behaviour
 * an evidence chain exists to prevent.
 */

/**
 * Field names are matched on their trailing word rather than as a substring.
 * Evidence payloads are full of fields like `tokens`, `credentialType` and
 * `authorizationPassed`; treating those as secrets would make the detector
 * useless and train people to route around it.
 */
const SECRET_NAME_SUFFIX = new Set([
  'key',
  'apikey',
  'token',
  'secret',
  'password',
  'passphrase',
  'credential',
  'credentials',
  'authorization',
  'cookie',
  'bearer',
]);

const SECRET_FULL_NAMES = new Set(['sessionid', 'auth', 'jwt', 'pat']);

function looksLikeSecretField(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SECRET_FULL_NAMES.has(normalized)) return true;
  const words = key
    .replace(/[_\-.]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const last = words.at(-1);
  return last !== undefined && SECRET_NAME_SUFFIX.has(last);
}

const SECRET_VALUE =
  /(?:AIza[0-9A-Za-z_\-]{8,}|AQ\.[A-Za-z0-9._\-]{16,}|sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|ya29\.[A-Za-z0-9._\-]+|eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9._\-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;

/** Long unbroken high-entropy strings that look like raw key material. */
const RAW_KEY_MATERIAL = /\b[A-Fa-f0-9]{48,}\b|\b[A-Za-z0-9+/]{60,}={0,2}\b/;

export type SecretFinding = {
  path: string;
  reason: 'secret_field_name' | 'secret_value_shape' | 'raw_key_material';
};

/**
 * Paths that legitimately carry hex digests. They are hashes of content, not
 * key material, and every evidence record has several of them.
 */
const HASH_PATHS =
  /(^|\.)(artifactHash|evidenceHash|chainHash|previousHash|resultHash|outputDigest|inputDigest|dependencyLockHash|migrationHash|containerDigest|fingerprint|sbomRef|commitSha|stateDigest|transcriptDigest)$/;

export function findSecrets(value: unknown, path = ''): SecretFinding[] {
  const findings: SecretFinding[] = [];

  if (typeof value === 'string') {
    if (SECRET_VALUE.test(value)) findings.push({ path: path || '<root>', reason: 'secret_value_shape' });
    else if (!HASH_PATHS.test(path) && RAW_KEY_MATERIAL.test(value)) {
      findings.push({ path: path || '<root>', reason: 'raw_key_material' });
    }
    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => findings.push(...findSecrets(entry, `${path}[${index}]`)));
    return findings;
  }

  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      // Only a string can carry a credential; a count or a flag cannot.
      if (typeof entry === 'string' && entry !== '' && looksLikeSecretField(key)) {
        findings.push({ path: childPath, reason: 'secret_field_name' });
        continue;
      }
      findings.push(...findSecrets(entry, childPath));
    }
  }

  return findings;
}

export function containsSecret(value: unknown): boolean {
  return findSecrets(value).length > 0;
}

/** For log lines and human-facing summaries, never for stored evidence. */
export function scrubForDisplay(value: unknown): unknown {
  return sanitizeGeminiDiagnostic(value);
}

/**
 * Section 47: the reportable shape of a secret-scan finding. Credential type,
 * location category, severity and remediation state — never the credential.
 */
export function briefableSecretFindings(payload: SecretScanPayload) {
  return payload.findings.map((finding) => ({
    credentialType: finding.credentialType,
    locationCategory: finding.locationCategory,
    severity: finding.severity,
    remediationState: finding.remediationState,
  }));
}
