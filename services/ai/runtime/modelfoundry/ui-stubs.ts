/**
 * Minimal admin/executive surface stubs (contracts only).
 */

import { ADMIN_SURFACE_STUBS, type AdminSurfaceStub } from './types';

export type AdminSurface = {
  id: AdminSurfaceStub;
  routeStub: string;
  productionLive: false;
  executesMutations: false;
};

export function listAdminSurfaceStubs(): readonly AdminSurface[] {
  return ADMIN_SURFACE_STUBS.map((id) => ({
    id,
    routeStub: `/admin/${id.toLowerCase().replace(/_/g, '-')}`,
    productionLive: false,
    executesMutations: false,
  }));
}

export function openAdminSurface(id: AdminSurfaceStub): AdminSurface {
  return {
    id,
    routeStub: `/admin/${id.toLowerCase().replace(/_/g, '-')}`,
    productionLive: false,
    executesMutations: false,
  };
}
