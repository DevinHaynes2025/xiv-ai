/**
 * 62L-EL EL3 — Privacy-minimal probe output + secret-redaction alignment.
 */

import type { HardwareProbeRecord, RawProbeInput } from './hardware-probe';
import type { CapabilityRegistry, EvidenceState } from './types';

const REDACTED = '[redacted]';

const SECRET_FIELD =
  /api[_-]?key|token|secret|authorization|password|credential|bearer|private[_-]?key|x-goog-api-key|gemini[_-]?key/i;

const SENSITIVE_IDENTITY_KEYS =
  /machine[_-]?guid|serial|mac[_-]?address|username|user[_-]?name|home[_-]?directory|home[_-]?dir|hostname|email|ssid|imei|uuid|device[_-]?id/i;

function secretValuePattern() {
  return /(?:AIza[0-9A-Za-z_\-]{8,}|AQ\.[A-Za-z0-9._\-]{16,}|sk-[A-Za-z0-9]{8,}|ya29\.[A-Za-z0-9._\-]+|eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9._\-]+)/g;
}

export function redactSecretsInText(text: string): string {
  return text
    .replace(secretValuePattern(), REDACTED)
    .replace(/(?:api[_-]?key|token|authorization|x-goog-api-key)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/[?&](?:key|api_key|token)=[^&\s]+/gi, '[redacted-param]');
}

export function looksLikeSensitiveIdentityKey(key: string): boolean {
  return SENSITIVE_IDENTITY_KEYS.test(key) || SECRET_FIELD.test(key);
}

export function sanitizeProbeValue(value: unknown, key = ''): unknown {
  if (looksLikeSensitiveIdentityKey(key)) return REDACTED;
  if (typeof value === 'string') {
    if (secretValuePattern().test(value.trim())) return REDACTED;
    return redactSecretsInText(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeProbeValue(item));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
      out[entryKey] = sanitizeProbeValue(entryValue, entryKey);
    }
    return out;
  }
  return value;
}

export type PrivacyMinimalProbeOutput = {
  probeId: string;
  capturedAt: string;
  platform: string;
  release: string;
  arch: string;
  logicalCores: number;
  memoryBandGb: number;
  cpuVendor?: string;
  cpuFamily?: string;
  gpuVendorHints: string[];
  npuPresent: boolean | 'unknown';
  registry: CapabilityRegistry;
  status: HardwareProbeRecord['status'];
  state: EvidenceState;
  reason: string;
  redactedFields: string[];
  privacyMinimal: true;
  notes: string[];
};

function memoryBandGb(bytes: number): number {
  const gb = bytes / (1024 * 1024 * 1024);
  return Math.max(1, Math.round(gb / 4) * 4);
}

function cpuFamilyLabel(name?: string): string | undefined {
  if (!name) return undefined;
  const cleaned = name.replace(/\d{4,}/g, 'x').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 64);
}

function vendorHints(names: string[]): string[] {
  const hints = new Set<string>();
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower.includes('amd')) hints.add('AMD');
    else if (lower.includes('nvidia')) hints.add('NVIDIA');
    else if (lower.includes('intel')) hints.add('Intel');
    else if (lower.includes('qualcomm')) hints.add('Qualcomm');
    else hints.add('OTHER');
  }
  return [...hints];
}

export function redactProbeOutput(
  record: HardwareProbeRecord,
  raw?: RawProbeInput,
): PrivacyMinimalProbeOutput {
  const redactedFields: string[] = [
    'hostname',
    'machineGuid',
    'serialNumber',
    'username',
    'homeDirectory',
    'macAddresses',
  ];

  if (raw) {
    for (const key of Object.keys(raw)) {
      if (looksLikeSensitiveIdentityKey(key) && !redactedFields.includes(key)) {
        redactedFields.push(key);
      }
    }
  }

  const npuFlag = record.registry.flags.NPU_DETECTED;

  return {
    probeId: record.probeId,
    capturedAt: record.capturedAt,
    platform: record.platform,
    release: record.release,
    arch: record.arch,
    logicalCores: record.logicalCores,
    memoryBandGb: memoryBandGb(record.totalMemoryBytes),
    cpuVendor: record.cpuVendor,
    cpuFamily: cpuFamilyLabel(record.cpuName),
    gpuVendorHints: vendorHints(record.gpuNames),
    npuPresent: npuFlag === true ? true : npuFlag === false ? false : 'unknown',
    registry: record.registry,
    status: record.status,
    state: record.state,
    reason: record.reason,
    redactedFields,
    privacyMinimal: true,
    notes: [
      ...record.notes,
      'Sensitive identifiers (hostname, serial, MAC, username, home path, machine GUID) are redacted.',
      'Secret-bearing fields align with diagnostics redaction patterns.',
    ],
  };
}

export function assertNoSensitiveLeak(output: PrivacyMinimalProbeOutput, raw?: RawProbeInput): boolean {
  const serialized = JSON.stringify(output);
  if (raw?.hostname && serialized.includes(raw.hostname)) return false;
  if (raw?.serialNumber && serialized.includes(raw.serialNumber)) return false;
  if (raw?.username && serialized.includes(raw.username)) return false;
  if (raw?.machineGuid && serialized.includes(raw.machineGuid)) return false;
  if (raw?.homeDirectory && serialized.includes(raw.homeDirectory)) return false;
  if (raw?.macAddresses?.some((mac) => serialized.includes(mac))) return false;
  if (/sk-[A-Za-z0-9]{8,}/.test(serialized)) return false;
  return true;
}
