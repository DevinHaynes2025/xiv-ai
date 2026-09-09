export type SparseRoute = {
  fromId: string;
  toId: string;
  nextHop: string;
  tenantId: string;
  universeId: string;
  weight: number;
};

export class SparseRoutingTable {
  private routes = new Map<string, SparseRoute>();

  private key(tenantId: string, universeId: string, fromId: string, toId: string) {
    return `${tenantId}/${universeId}/${fromId}->${toId}`;
  }

  register(route: SparseRoute) {
    if (!route.tenantId || !route.universeId) throw new Error('SPARSE_ROUTE_SCOPE_REQUIRED');
    if (!Number.isFinite(route.weight) || route.weight < 0 || route.weight > 1) throw new Error('SPARSE_ROUTE_WEIGHT');
    this.routes.set(this.key(route.tenantId, route.universeId, route.fromId, route.toId), { ...route });
    return this.size();
  }

  lookup(input: { tenantId: string; universeId: string; fromId: string; toId: string }) {
    const exact = this.routes.get(this.key(input.tenantId, input.universeId, input.fromId, input.toId));
    if (exact) return exact;
    return null;
  }

  lookupScoped(tenantId: string, universeId: string) {
    return [...this.routes.values()].filter((route) => route.tenantId === tenantId && route.universeId === universeId);
  }

  size() {
    return this.routes.size;
  }

  stats() {
    return {
      registeredRoutes: this.routes.size,
      materializedFullMesh: false as const,
      productionAuthorization: false as const,
    };
  }
}
