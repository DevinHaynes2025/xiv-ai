/**
 * EW6 registry — shared vendor / architecture / device / runtime seeds.
 * One shared graph; no per-vendor brains.
 */

import {
  ACCELERATOR_CLASSES,
  CHIP_VENDORS,
  amdHardwareHonesty,
  type AcceleratorClass,
  type ChipVendor,
  type EvidenceState,
  type TenantScope,
} from './types.ts';

export type RegistryDeviceSeed = {
  deviceId: string;
  vendor: ChipVendor;
  acceleratorClass: AcceleratorClass;
  architectureId: string;
  label: string;
  initialState: EvidenceState;
  onnxCompatible: boolean;
  localOnlyCapable: boolean;
  memoryMb: number;
  knownLimitations: readonly string[];
};

export type RegistryRuntimeSeed = {
  runtimeId: string;
  label: string;
  vendors: readonly ChipVendor[];
  onnxCompatible: boolean;
  initialState: EvidenceState;
};

const SHARED_ARCHITECTURES: ReadonlyArray<{
  architectureId: string;
  vendor: ChipVendor;
  label: string;
}> = [
  { architectureId: 'amd-zen-x86_64', vendor: 'AMD', label: 'AMD Zen x86_64' },
  { architectureId: 'amd-rdna-gpu', vendor: 'AMD', label: 'AMD RDNA GPU' },
  { architectureId: 'amd-ryzen-ai-npu', vendor: 'AMD', label: 'AMD Ryzen AI NPU candidate' },
  { architectureId: 'nvidia-cuda-gpu', vendor: 'NVIDIA', label: 'NVIDIA CUDA GPU' },
  { architectureId: 'nvidia-tensorrt', vendor: 'NVIDIA', label: 'NVIDIA TensorRT candidate' },
  { architectureId: 'intel-x86_64', vendor: 'INTEL', label: 'Intel x86_64 CPU' },
  { architectureId: 'intel-xe-gpu', vendor: 'INTEL', label: 'Intel Xe GPU candidate' },
  { architectureId: 'intel-npu-openvino', vendor: 'INTEL', label: 'Intel NPU / OpenVINO candidate' },
  { architectureId: 'arm-aarch64', vendor: 'ARM', label: 'ARM AArch64' },
  { architectureId: 'apple-silicon', vendor: 'APPLE', label: 'Apple Silicon CPU/GPU/ANE' },
  { architectureId: 'qualcomm-hexagon', vendor: 'QUALCOMM', label: 'Qualcomm Hexagon NPU candidate' },
  { architectureId: 'riscv-vector-edge', vendor: 'RISC_V', label: 'RISC-V open ISA + vector/edge' },
  { architectureId: 'future-asic-qpu', vendor: 'FUTURE_ACCELERATOR', label: 'Future ASIC / authorized cloud accel / QPU' },
];

function defaultStateFor(
  vendor: ChipVendor,
  cls: AcceleratorClass,
): EvidenceState {
  const amd = amdHardwareHonesty();
  if (vendor === 'AMD' && cls === 'GPU') return amd.gpuState;
  if (vendor === 'AMD' && cls === 'NPU') return amd.npuState;
  if (cls === 'CPU') return 'DOCUMENTED';
  return 'NOT_TESTED';
}

/** Build honest cross-vendor device seeds (DOCUMENTED / NOT_TESTED). */
export function buildDefaultDeviceSeeds(): readonly RegistryDeviceSeed[] {
  const seeds: RegistryDeviceSeed[] = [];
  for (const vendor of CHIP_VENDORS) {
    for (const cls of ACCELERATOR_CLASSES) {
      if (cls === 'OTHER_ACCELERATOR' && vendor !== 'FUTURE_ACCELERATOR') {
        continue;
      }
      const arch =
        SHARED_ARCHITECTURES.find((a) => a.vendor === vendor) ??
        SHARED_ARCHITECTURES[SHARED_ARCHITECTURES.length - 1]!;
      seeds.push({
        deviceId: `${vendor.toLowerCase()}-${cls.toLowerCase()}-candidate`,
        vendor,
        acceleratorClass: cls,
        architectureId: arch.architectureId,
        label: `${vendor} ${cls} candidate`,
        initialState: defaultStateFor(vendor, cls),
        onnxCompatible: cls === 'CPU' || cls === 'GPU',
        localOnlyCapable: true,
        memoryMb: cls === 'CPU' ? 8192 : cls === 'GPU' ? 8192 : 2048,
        knownLimitations: [
          'Skeleton candidate — DOCUMENTED/NOT_TESTED until runtime evidence.',
          'Do not treat presence as VERIFIED.',
        ],
      });
    }
  }
  return seeds;
}

export function buildDefaultRuntimeSeeds(): readonly RegistryRuntimeSeed[] {
  return [
    {
      runtimeId: 'onnx-cpu',
      label: 'ONNX Runtime (CPU)',
      vendors: ['AMD', 'INTEL', 'ARM', 'APPLE', 'QUALCOMM', 'RISC_V'],
      onnxCompatible: true,
      initialState: 'DOCUMENTED',
    },
    {
      runtimeId: 'cuda-tensorrt',
      label: 'CUDA / TensorRT candidate',
      vendors: ['NVIDIA'],
      onnxCompatible: true,
      initialState: 'NOT_TESTED',
    },
    {
      runtimeId: 'rocm-hip',
      label: 'ROCm / HIP candidate',
      vendors: ['AMD'],
      onnxCompatible: true,
      initialState: 'NOT_TESTED',
    },
    {
      runtimeId: 'openvino',
      label: 'OpenVINO candidate',
      vendors: ['INTEL'],
      onnxCompatible: true,
      initialState: 'NOT_TESTED',
    },
    {
      runtimeId: 'coreml-ane',
      label: 'Core ML / Neural Engine candidate',
      vendors: ['APPLE'],
      onnxCompatible: false,
      initialState: 'NOT_TESTED',
    },
    {
      runtimeId: 'qnn-hexagon',
      label: 'Qualcomm AI Engine / Hexagon candidate',
      vendors: ['QUALCOMM'],
      onnxCompatible: true,
      initialState: 'NOT_TESTED',
    },
  ];
}

export function listSharedArchitectures(): typeof SHARED_ARCHITECTURES {
  return SHARED_ARCHITECTURES;
}

export type ScopedRegistryKey = {
  scope: TenantScope;
  key: string;
};

export function scopedKey(scope: TenantScope, id: string): string {
  return `${scope.orgId}:${scope.tenantId}:${scope.universeId}:${id}`;
}
