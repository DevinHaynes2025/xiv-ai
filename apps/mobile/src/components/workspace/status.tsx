import { XivEmptyState, XivGlassPanel, XivStatusPill } from '@/components/premium';
import { XivStatusIndicator } from '@/components/v4';
import { XivText } from '@/components/xiv/text';
import type { DataSurfaceState } from '@/lib/surface-state';

export function OfflineBanner({ state }: { state: 'ONLINE' | 'OFFLINE' | 'PENDING_SYNC' }) {
  return (
    <XivGlassPanel accessibilityLabel={`Offline state ${state}`}>
      <XivStatusPill label={state} tone={state === 'ONLINE' ? 'success' : 'warning'} />
      <XivText variant="body" muted>
        Offline work is a foundation. Production sync is not live. Queued actions still require server authorization.
      </XivText>
    </XivGlassPanel>
  );
}

export function SyncIndicator() {
  return <XivStatusIndicator state="NOT_CONFIGURED" />;
}

export function PendingChangesBadge({ count }: { count: number }) {
  return <XivStatusPill label={`${count} pending (local queue)`} tone="warning" />;
}

export function ConflictNotice() {
  return <XivEmptyState title="No conflicts" body="Conflict resolution runs only after reconnect and tenant validation." />;
}

export function OfflineAvailabilityBadge({ policy }: { policy: string }) {
  return <XivStatusPill label={policy} tone="neutral" />;
}

export function EvidenceCellIndicator({ source, state }: { source: string; state: DataSurfaceState }) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state={state} />
      <XivText variant="metadata" muted>
        {source}
      </XivText>
    </XivGlassPanel>
  );
}
