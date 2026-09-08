import type { AuditLedger } from './audit';
import { RuntimeError } from './errors';
import type { TenantRef } from './types';

export type TenantScoped = { tenant: TenantRef };

export function sameTenant(a: TenantRef, b: TenantRef): boolean {
  return a.organizationId === b.organizationId && a.universeId === b.universeId;
}

export function tenantKey(tenant: TenantRef): string {
  return `${tenant.organizationId}::${tenant.universeId}`;
}

export type BypassPath = {
  pathId: string;
  justification: string;
  approvedByPrincipalId: string;
  reviewedAt: number;
};

/**
 * Registry of privileged paths that may read across tenants (backup, restore,
 * fleet health). Registration requires a justification and a human approver, so
 * "privileged bypass paths without documented justification" is structurally 0
 * rather than a review promise.
 */
export class BypassRegistry {
  private readonly paths = new Map<string, BypassPath>();

  register(path: BypassPath) {
    if (!path.justification.trim() || path.justification.trim().length < 16) {
      throw new RuntimeError('bypass_unjustified', 'A privileged bypass path requires a written justification.', {
        pathId: path.pathId,
      });
    }
    if (!path.approvedByPrincipalId.trim()) {
      throw new RuntimeError('bypass_unjustified', 'A privileged bypass path requires a named approver.', {
        pathId: path.pathId,
      });
    }
    this.paths.set(path.pathId, path);
  }

  assertDocumented(pathId: string): BypassPath {
    const path = this.paths.get(pathId);
    if (!path) {
      throw new RuntimeError('bypass_unjustified', 'Undocumented privileged bypass path.', { pathId });
    }
    return path;
  }

  list(): BypassPath[] {
    return [...this.paths.values()];
  }

  get undocumentedUseCount() {
    return this.rejected;
  }

  private rejected = 0;

  noteRejected() {
    this.rejected += 1;
  }
}

export type IsolationCounters = {
  deniedReads: number;
  deniedWrites: number;
  allowedReads: number;
  allowedWrites: number;
};

/**
 * Every tenant-bearing collection in the plane goes through this store. There is
 * no unscoped read path: `get`/`list` always take the caller's scope and a row
 * belonging to another organization or universe is treated as absent, while the
 * attempt itself is audited as a security event.
 */
export class TenantStore<T extends TenantScoped> {
  private readonly rows = new Map<string, T>();
  private readonly byTenant = new Map<string, Set<string>>();

  constructor(
    readonly name: string,
    private readonly audit: AuditLedger,
    private readonly counters: IsolationCounters,
  ) {}

  put(scope: TenantRef, id: string, row: T): T {
    if (!sameTenant(scope, row.tenant)) {
      this.counters.deniedWrites += 1;
      this.audit.append({
        tenant: scope,
        category: 'isolation',
        kind: 'cross_tenant_write_denied',
        subjectId: `${this.name}:${id}`,
        detail: { table: this.name, scope: tenantKey(scope), row: tenantKey(row.tenant) },
      });
      throw new RuntimeError('isolation_violation', 'Write outside the caller tenant scope was refused.', {
        table: this.name,
      });
    }
    const existing = this.rows.get(id);
    if (existing && !sameTenant(existing.tenant, row.tenant)) {
      this.counters.deniedWrites += 1;
      throw new RuntimeError('isolation_violation', 'Identifier already owned by another tenant.', {
        table: this.name,
      });
    }
    this.rows.set(id, row);
    const key = tenantKey(row.tenant);
    const bucket = this.byTenant.get(key) ?? new Set<string>();
    bucket.add(id);
    this.byTenant.set(key, bucket);
    this.counters.allowedWrites += 1;
    return row;
  }

  get(scope: TenantRef, id: string): T | undefined {
    const row = this.rows.get(id);
    if (!row) return undefined;
    if (!sameTenant(scope, row.tenant)) {
      this.counters.deniedReads += 1;
      this.audit.append({
        tenant: scope,
        category: 'isolation',
        kind: 'cross_tenant_read_denied',
        subjectId: `${this.name}:${id}`,
        detail: { table: this.name, scope: tenantKey(scope), row: tenantKey(row.tenant) },
      });
      return undefined;
    }
    this.counters.allowedReads += 1;
    return row;
  }

  require(scope: TenantRef, id: string, code: RuntimeError['code'] = 'not_found'): T {
    const row = this.get(scope, id);
    if (!row) {
      throw new RuntimeError(code, 'The requested record is not visible in this tenant scope.', {
        table: this.name,
        id,
      });
    }
    return row;
  }

  list(scope: TenantRef): T[] {
    const ids = this.byTenant.get(tenantKey(scope));
    if (!ids) return [];
    const out: T[] = [];
    for (const id of ids) {
      const row = this.rows.get(id);
      if (row && sameTenant(scope, row.tenant)) out.push(row);
    }
    this.counters.allowedReads += 1;
    return out;
  }

  /** Privileged whole-table read. Only reachable with a documented bypass path. */
  listPrivileged(bypass: BypassRegistry, pathId: string, principalId: string): T[] {
    const path = bypass.assertDocumented(pathId);
    this.audit.append({
      tenant: null,
      category: 'isolation',
      kind: 'privileged_bypass_used',
      subjectId: this.name,
      principalId,
      detail: { pathId: path.pathId, justification: path.justification, approver: path.approvedByPrincipalId },
    });
    return [...this.rows.values()];
  }

  /** Unscoped existence check used only for identity uniqueness enforcement. */
  hasId(id: string): boolean {
    return this.rows.has(id);
  }

  delete(scope: TenantRef, id: string): boolean {
    const row = this.get(scope, id);
    if (!row) return false;
    this.rows.delete(id);
    this.byTenant.get(tenantKey(row.tenant))?.delete(id);
    return true;
  }

  get size() {
    return this.rows.size;
  }

  tenantCount(scope: TenantRef): number {
    return this.byTenant.get(tenantKey(scope))?.size ?? 0;
  }

  exportAll(): Record<string, T> {
    return Object.fromEntries(this.rows.entries());
  }

  restoreAll(rows: Record<string, T>) {
    this.rows.clear();
    this.byTenant.clear();
    for (const [id, row] of Object.entries(rows)) {
      this.rows.set(id, row);
      const key = tenantKey(row.tenant);
      const bucket = this.byTenant.get(key) ?? new Set<string>();
      bucket.add(id);
      this.byTenant.set(key, bucket);
    }
  }
}
