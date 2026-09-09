/**
 * 62L-EM4 soft-wire — EM1 home base, EM3 registry, EL9 governor,
 * EL7 adapter, EL8 silent-fallback honesty (presence only).
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EM4_LOCKS,
  type Em4SoftWireSnapshot,
} from './em4-message-envelope-types.ts';

export function assertEm4LocksIntact(): boolean {
  return (
    EM4_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM4_LOCKS.TIP_LAND === false &&
    EM4_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EM4_LOCKS.MANAGE_PULL_REQUEST === false &&
    EM4_LOCKS.AUTOMATIC_CLOUD_PURCHASE === false &&
    EM4_LOCKS.HARDWARE_PROVISIONING === false &&
    EM4_LOCKS.DRIVER_BIOS_SECURITY_CONFIG_CHANGES === false &&
    EM4_LOCKS.CROSS_TENANT_DEFAULT === false &&
    EM4_LOCKS.CROSS_UNIVERSE_DEFAULT === false &&
    EM4_LOCKS.CHILD_WIDEN_DEVICE_MODEL_DATA_NETWORK === false &&
    EM4_LOCKS.HIGH_CONSEQUENCE_AUTO_EXECUTE === false &&
    EM4_LOCKS.CPU_SUCCESS_VERIFIES_REQUESTED_ACCELERATOR === false &&
    EM4_LOCKS.SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG === false
  );
}

export function em4SoftWireSnapshot(): Em4SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const runtime = join(here, '../local-runtime');

  const em1Path = join(here, 'agent-home-base-types.ts');
  const em3Path = join(runtime, 'universal-compute-registry.ts');
  const el9Path = join(runtime, 'resource-governor.ts');
  const el7AdapterPath = join(runtime, 'inference-adapter.ts');
  const el7SoftWirePath = join(runtime, 'el7-soft-wire.ts');
  const el7Path = existsSync(el7AdapterPath) ? el7AdapterPath : el7SoftWirePath;
  const el8Path = join(runtime, 'model-load-evidence.ts');

  return {
    em1HomeBasePresent: existsSync(em1Path),
    em1PathChecked: em1Path,
    em3RegistryPresent: existsSync(em3Path),
    em3PathChecked: em3Path,
    el9GovernorPresent: existsSync(el9Path),
    el9PathChecked: el9Path,
    el7AdapterPresent: existsSync(el7AdapterPath) || existsSync(el7SoftWirePath),
    el7PathChecked: el7Path,
    el8SilentFallbackPresent: existsSync(el8Path),
    el8PathChecked: el8Path,
    note:
      'Presence soft-wire only; does not imply EM1/EM3/EL7/EL8/EL9 VERIFIED or production authorization.',
  };
}

export async function softWireEl8DetectSilentFallback(): Promise<{
  present: boolean;
  el8DetectAvailable: boolean;
}> {
  const snap = em4SoftWireSnapshot();
  if (!snap.el8SilentFallbackPresent) {
    return { present: false, el8DetectAvailable: false };
  }
  try {
    const mod = await import('../local-runtime/model-load-evidence.ts');
    return {
      present: true,
      el8DetectAvailable: typeof mod.detectSilentFallback === 'function',
    };
  } catch {
    return { present: true, el8DetectAvailable: false };
  }
}
