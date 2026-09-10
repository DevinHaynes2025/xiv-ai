import type {
  DeviceCapability,
  DimensionalPoint,
  DimensionalWorkload,
  RouteDecision,
} from './types';

export const CURRENT_DIMENSIONAL_MILESTONE = 12 as const;
export const RESEARCH_DIMENSION_CEILING = 100 as const;
export const PRODUCTION_DIMENSIONAL_FABRIC_ENABLED = false as const;
export const PHYSICAL_PORTAL_CAPABILITY = false as const;
export const ATOMIC_SCALE_STORAGE_CLAIM = false as const;
export const BIOLOGICAL_DNA_CLONING_CAPABILITY = false as const;

export function validateDimensionCount(dimensions: number): number {
  if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > RESEARCH_DIMENSION_CEILING) {
    throw new RangeError(`logical dimensions must be an integer from 1 to ${RESEARCH_DIMENSION_CEILING}`);
  }
  return dimensions;
}

export function createPoint(coordinates: readonly number[]): DimensionalPoint {
  const dimensions = validateDimensionCount(coordinates.length);
  if (coordinates.some((value) => !Number.isFinite(value))) {
    throw new TypeError('coordinates must be finite numbers');
  }
  return { dimensions, coordinates: [...coordinates] };
}

export function projectPoint(point: DimensionalPoint, targetDimensions: number): DimensionalPoint {
  const target = validateDimensionCount(targetDimensions);
  if (target > point.coordinates.length) {
    return {
      dimensions: target,
      coordinates: [...point.coordinates, ...Array(target - point.coordinates.length).fill(0)],
    };
  }
  return { dimensions: target, coordinates: point.coordinates.slice(0, target) };
}

export function routeWorkload(
  workload: DimensionalWorkload,
  devices: readonly DeviceCapability[],
): RouteDecision | null {
  const dimensions = validateDimensionCount(workload.dimensions);
  const candidates = devices.filter((device) =>
    device.verified &&
    device.maxLogicalDimensions >= dimensions &&
    (!workload.requiredBackend || device.backends.includes(workload.requiredBackend)) &&
    (!workload.offlineAllowed || device.offlineReady),
  );

  const device = candidates[0];
  if (!device) return null;

  const backend = workload.requiredBackend ?? device.backends[0];
  if (!backend) return null;

  return {
    workloadId: workload.id,
    backend,
    deviceId: device.deviceId,
    dimensions,
    reason: `verified capability route on ${device.silicon}; research fabric only`,
    productionAuthorized: false,
  };
}
