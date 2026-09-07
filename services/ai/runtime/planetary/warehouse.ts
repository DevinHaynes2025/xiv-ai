import type { ObservationStance } from './types';

export type WarehouseSignal = {
  stance: ObservationStance;
  text: string;
  isFact: boolean;
};

export type WarehouseTwin = {
  warehouseId: string;
  zones: readonly WarehouseZone[];
  telemetryLive: false;
};

export type WarehouseZone = { zoneId: string; kind: 'RECEIVE' | 'STORAGE' | 'PICK' | 'PACK' | 'SHIP' | 'RETURNS' };
export type WarehouseLocation = { locationId: string; zoneId: string };
export type WarehouseBin = { binId: string; locationId: string };
export type WarehouseDock = { dockId: string; occupied: boolean; stance: 'OBSERVED' | 'INFERRED' };
export type WarehouseEquipment = { equipmentId: string; class: 'FORKLIFT' | 'SCANNER' | 'CONVEYOR' | 'VEHICLE' };
export type WarehouseInventoryState = { sku: string; quantity: number; stance: ObservationStance; isFact: boolean };
export type WarehouseTaskState = {
  taskId: string;
  kind: 'RECEIVE' | 'PUTAWAY' | 'REPLENISH' | 'PICK' | 'PACK' | 'SHIP' | 'COUNT' | 'OPTIMIZE';
  stance: ObservationStance;
};
export type WarehouseCongestion = { zoneId: string; stance: 'CALCULATED' | 'INFERRED' | 'FORECAST'; isFact: false };
export type WarehouseCapacity = { utilized: number; stance: 'CALCULATED'; isFact: false };
export type WarehouseObservation = WarehouseSignal & { stance: 'OBSERVED' };
export type WarehouseRecommendation = WarehouseSignal & { stance: 'RECOMMENDED'; isFact: false };

export const WAREHOUSE_STRATEGY_SIGNALS = [
  'slotting',
  'travel_distance',
  'inventory_velocity',
  'congestion',
  'labor_utilization',
  'dock_usage',
  'storage_utilization',
  'pick_path_efficiency',
  'replenishment',
  'receiving_bottlenecks',
  'predicted_stockouts',
] as const;

export function warehouseObservation(text: string): WarehouseSignal {
  return { stance: 'OBSERVED', text, isFact: true };
}

export function warehouseForecast(text: string): WarehouseSignal {
  return { stance: 'FORECAST', text, isFact: false };
}

export function warehouseRecommendation(text: string): WarehouseRecommendation {
  return { stance: 'RECOMMENDED', text, isFact: false };
}

export function warehouseObservationEqualsForecast(observation: WarehouseSignal, forecast: WarehouseSignal): boolean {
  return observation.stance === forecast.stance;
}

export function warehouseRecommendationIsFact(signal: WarehouseSignal): boolean {
  return signal.stance === 'RECOMMENDED' && signal.isFact;
}

export function openWarehouseTwin(warehouseId: string): WarehouseTwin {
  return { warehouseId, zones: [], telemetryLive: false };
}

export function warehouseHasFakeTelemetry(_twin: WarehouseTwin): false {
  return false;
}
