/**
 * 62L-BX Neural Chip OS Abstraction (HAL) —
 * Hardware-abstraction for verified CPU/GPU/NPU/DSP/accelerator families only.
 * Unverified families → UNAVAILABLE; never claimed VERIFIED without proof.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BX_LOCKS,
  HONESTY_BANNER,
  UNVERIFIED_CHIP_FAMILY_UNAVAILABLE,
  UNVERIFIED_NOT_LABELED_VERIFIED,
  type BxActor,
  type CompatibilityLabel,
  type HardwareFamilyKind,
} from './neural-chip-os-semiconductor-twin-types';

export type ChipFamilyRecord = {
  familyKey: string;
  displayName: string;
  kind: HardwareFamilyKind;
  label: CompatibilityLabel;
  vendorProven: boolean;
  interfaceProven: boolean;
  evidenceRefs: string[];
  productionAuthorized: false;
};

type Store = {
  families: ChipFamilyRecord[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-chip-hal.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { families: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** Register a chip family with honest HAL label. VERIFIED only with vendor+interface proof. */
export async function registerChipFamily(input: {
  familyKey: string;
  displayName: string;
  kind: HardwareFamilyKind;
  vendorProven: boolean;
  interfaceProven: boolean;
  evidenceRefs?: string[];
  /** Attempt to force VERIFIED without proof — refused. */
  forceVerified?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const key = normalizeKey(input.familyKey);

  if (input.forceVerified && !(input.vendorProven && input.interfaceProven)) {
    return {
      accepted: false as const,
      reason: UNVERIFIED_NOT_LABELED_VERIFIED,
      label: 'DOCUMENTED' as const,
      labeledVerified: false as const,
      status: 'DENIED' as const,
    };
  }

  let label: CompatibilityLabel = 'DOCUMENTED';
  if (input.vendorProven && input.interfaceProven) {
    label = 'VERIFIED';
  } else if (input.vendorProven) {
    label = 'AVAILABLE';
  } else {
    label = 'DOCUMENTED';
  }

  const record: ChipFamilyRecord = {
    familyKey: key,
    displayName: input.displayName.trim() || key,
    kind: input.kind,
    label,
    vendorProven: input.vendorProven,
    interfaceProven: input.interfaceProven,
    evidenceRefs: input.evidenceRefs ?? [],
    productionAuthorized: false,
  };

  const idx = store.families.findIndex((f) => f.familyKey === key);
  if (idx >= 0) store.families[idx] = record;
  else store.families.push(record);
  await save(root, store);

  return {
    accepted: true as const,
    family: record,
    labeledVerified: label === 'VERIFIED',
    status: label,
  };
}

export async function getChipFamily(familyKey: string, root = process.cwd()) {
  const store = await load(root);
  return store.families.find((f) => f.familyKey === normalizeKey(familyKey)) ?? null;
}

/** Resolve HAL capability for a family — unverified → UNAVAILABLE (not VERIFIED). */
export async function resolveHalCapability(input: {
  familyKey: string;
  requireVerified?: boolean;
  actor?: BxActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const family = await getChipFamily(input.familyKey, root);

  if (!family) {
    return {
      available: false as const,
      status: 'UNAVAILABLE' as const,
      labeledVerified: false as const,
      reason: UNVERIFIED_CHIP_FAMILY_UNAVAILABLE,
      family: null,
    };
  }

  if (input.requireVerified !== false && family.label !== 'VERIFIED') {
    return {
      available: false as const,
      status: 'UNAVAILABLE' as const,
      labeledVerified: false as const,
      reason: UNVERIFIED_CHIP_FAMILY_UNAVAILABLE,
      family,
    };
  }

  return {
    available: true as const,
    status: family.label,
    labeledVerified: family.label === 'VERIFIED',
    reason: null,
    family,
  };
}

export async function listVerifiedHalFamilies(root = process.cwd()) {
  const store = await load(root);
  return store.families.filter((f) => f.label === 'VERIFIED');
}

export function neuralChipHalHonesty() {
  return {
    banner: HONESTY_BANNER,
    L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
    coversVerifiedFamiliesOnly: true as const,
    unverifiedLabeledVerified: BX_LOCKS.UNVERIFIED_CHIP_FAMILY_LABELED_VERIFIED,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
