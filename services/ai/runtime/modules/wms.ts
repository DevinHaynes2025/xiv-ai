/**
 * WMS core domain contracts. Movements are append-oriented. Stock is not fabricated.
 */
export type Warehouse = {
  warehouseId: string;
  organizationId: string;
  universeId: string | null;
  name: string;
  persisted: false;
};

export type WarehouseLocation = {
  locationId: string;
  warehouseId: string;
  code: string;
};

export type WarehouseBin = {
  binId: string;
  locationId: string;
  code: string;
};

export type WarehouseSku = {
  skuId: string;
  organizationId: string;
  code: string;
  description: string;
};

export type StockLevel = {
  skuId: string;
  warehouseId: string;
  quantity: number | 'unknown';
  fabricated: false;
  source: 'unmeasured' | 'authorized_count';
};

export type InventoryMovement = {
  movementId: string;
  skuId: string;
  warehouseId: string;
  direction: 'in' | 'out' | 'adjust';
  quantity: number;
  appendOnly: true;
  auditable: true;
  fabricated: false;
};

export type Receiving = {
  receivingId: string;
  warehouseId: string;
  status: 'open' | 'closed';
};

export type PutawayTask = {
  taskId: string;
  warehouseId: string;
  status: 'open' | 'done';
};

export type PickTask = {
  taskId: string;
  warehouseId: string;
  status: 'open' | 'done';
};

export type PackTask = {
  taskId: string;
  warehouseId: string;
  status: 'open' | 'done';
};

export type Shipment = {
  shipmentId: string;
  warehouseId: string;
  status: 'draft' | 'shipped';
};

export type CycleCount = {
  countId: string;
  warehouseId: string;
  fabricatedVariance: false;
};

export type ReplenishmentTask = {
  taskId: string;
  warehouseId: string;
  status: 'open' | 'done';
};

export type WarehouseEvent = {
  eventId: string;
  warehouseId: string;
  kind: string;
  createdAt: string;
  appendOnly: true;
};

export function wmsFabricatesInventory() {
  return false;
}

export const WMS_CORE_CONTRACTS = [
  'Warehouse',
  'Location',
  'Bin',
  'SKU',
  'StockLevel',
  'InventoryMovement',
  'Receiving',
  'PutawayTask',
  'PickTask',
  'PackTask',
  'Shipment',
  'CycleCount',
  'ReplenishmentTask',
  'WarehouseEvent',
] as const;
