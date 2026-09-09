import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useSession } from '@/context/session';
import {
  bootstrapOrganization,
  bootstrapUniverse,
  loadPersistedTenant,
  persistenceLabel,
  writeTenantSelection,
  type TenantMutationResult,
} from '@/lib/tenant';
import { getDefaultAgentRuntime } from '@/lib/ai';
import {
  canBootstrapUniverseFromContext,
  emptyTenantContext,
  recordTenantAudit,
  type ActiveTenantContext,
  type BootstrapStatus,
  type PersistedClassification,
} from '../../../../services/ai/runtime/tenant';

type TenantContextValue = {
  tenant: ActiveTenantContext;
  refresh: () => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
  selectUniverse: (universeId: string) => Promise<void>;
  createOrganization: (input: { name: string; slug?: string }) => Promise<TenantMutationResult>;
  createUniverse: (input: {
    name: string;
    slug?: string;
    classification?: PersistedClassification;
  }) => Promise<TenantMutationResult>;
  canCreateUniverse: boolean;
  persistenceLabel: string;
  orgBootstrapStatus: BootstrapStatus;
  universeBootstrapStatus: BootstrapStatus;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const [tenant, setTenant] = useState<ActiveTenantContext>(emptyTenantContext({ loading: true }));
  const [orgBootstrapStatus, setOrgBootstrapStatus] = useState<BootstrapStatus>('idle');
  const [universeBootstrapStatus, setUniverseBootstrapStatus] = useState<BootstrapStatus>('idle');

  const refresh = useCallback(async () => {
    if (!session.userId) {
      setTenant(emptyTenantContext());
      return;
    }
    const loaded = await loadPersistedTenant(session.userId);
    setTenant(loaded.context);
  }, [session.userId]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const userId = session.userId;
    const timer = setTimeout(() => {
      if (!userId) {
        if (alive) setTenant(emptyTenantContext());
        return;
      }
      void loadPersistedTenant(userId).then((loaded) => {
        if (alive) setTenant(loaded.context);
      });
    }, 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ready, session.userId]);

  const selectOrganization = useCallback(
    async (organizationId: string) => {
      if (!session.userId) return;
      writeTenantSelection(session.userId, { organizationId, universeId: null });
      const loaded = await loadPersistedTenant(session.userId, { organizationId, universeId: null });
      recordTenantAudit(getDefaultAgentRuntime().store, {
        event: loaded.denied ? 'cross_org_denied' : 'organization_selected',
        actorUserId: session.userId,
        organizationId,
        decision: loaded.denied ? 'denied' : 'allowed',
        reason: loaded.denied ?? 'Authorized organization selected from persisted membership.',
      });
      setTenant(loaded.context);
    },
    [session.userId],
  );

  const selectUniverse = useCallback(
    async (universeId: string) => {
      if (!session.userId) return;
      const organizationId = tenant.activeOrganization?.id ?? null;
      writeTenantSelection(session.userId, { organizationId, universeId });
      const loaded = await loadPersistedTenant(session.userId, { organizationId, universeId });
      recordTenantAudit(getDefaultAgentRuntime().store, {
        event: loaded.denied ? 'cross_universe_denied' : 'universe_selected',
        actorUserId: session.userId,
        organizationId,
        universeId,
        decision: loaded.denied ? 'denied' : 'allowed',
        reason: loaded.denied ?? 'Authorized Universe selected from persisted membership.',
      });
      setTenant(loaded.context);
    },
    [session.userId, tenant.activeOrganization?.id],
  );

  const createOrganization = useCallback(
    async (input: { name: string; slug?: string }) => {
      if (!session.userId) {
        return { status: 'denied' as const, message: 'Sign in is required to create an organization.' };
      }
      if (tenant.persistenceStatus !== 'ready') {
        return {
          status: 'failed' as const,
          message: persistenceLabel(tenant.persistenceStatus),
        };
      }
      setOrgBootstrapStatus('creating');
      const result = await bootstrapOrganization({ userId: session.userId, ...input });
      setOrgBootstrapStatus(result.status);
      if (result.status === 'ready') await refresh();
      return result;
    },
    [refresh, session.userId, tenant.persistenceStatus],
  );

  const createUniverse = useCallback(
    async (input: { name: string; slug?: string; classification?: PersistedClassification }) => {
      if (!session.userId || !tenant.activeOrganization) {
        return { status: 'denied' as const, message: 'An authorized organization is required to create a Universe.' };
      }
      if (tenant.persistenceStatus !== 'ready') {
        return { status: 'failed' as const, message: persistenceLabel(tenant.persistenceStatus) };
      }
      const allowed = canBootstrapUniverseFromContext(tenant);
      if (!allowed.allowed) {
        setUniverseBootstrapStatus('denied');
        recordTenantAudit(getDefaultAgentRuntime().store, {
          event: 'membership_denied',
          actorUserId: session.userId,
          organizationId: tenant.activeOrganization.id,
          decision: 'denied',
          reason: allowed.reason,
        });
        return { status: 'denied' as const, message: allowed.reason };
      }
      setUniverseBootstrapStatus('creating');
      const result = await bootstrapUniverse({
        userId: session.userId,
        organizationId: tenant.activeOrganization.id,
        ...input,
      });
      setUniverseBootstrapStatus(result.status);
      if (result.status === 'ready') await refresh();
      return result;
    },
    [refresh, session.userId, tenant],
  );

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      refresh,
      selectOrganization,
      selectUniverse,
      createOrganization,
      createUniverse,
      canCreateUniverse: canBootstrapUniverseFromContext(tenant).allowed,
      persistenceLabel: persistenceLabel(tenant.persistenceStatus),
      orgBootstrapStatus,
      universeBootstrapStatus,
    }),
    [
      createOrganization,
      createUniverse,
      orgBootstrapStatus,
      refresh,
      selectOrganization,
      selectUniverse,
      tenant,
      universeBootstrapStatus,
    ],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
