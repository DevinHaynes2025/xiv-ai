import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionApprovalCard } from '@/components/agents/action-approval-card';
import { ApprovalAuditPanel } from '@/components/agents/approval-audit-panel';
import { XivStatusPill } from '@/components/premium';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { StatusBadge } from '@/components/xiv/status-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useAgent } from '@/hooks/useAgent';
import {
  SUPPLIER_SIMULATION_POLICY,
  SUPPLIER_SIMULATION_TOOL_ID,
  canProposeSupplierSimulation,
} from '@/lib/ai';
import { PremiumDesk } from '@/screens/premium/desk';

/**
 * US-AGT-01 / US-AGT-02 — Scenario Lab: propose supplier simulation + approval audit trail.
 * Honest WAITING_* labels. L4 false. Simulation ≠ production.
 */
export function SupplierSimulationLab() {
  const {
    ready,
    agentType,
    snapshot,
    proposedAction,
    loading,
    error,
    evidenceOpen,
    approveAction,
    rejectAction,
    viewEvidence,
    suggest,
  } = useAgent();

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canPropose = canProposeSupplierSimulation(agentType);
  const supplierPending =
    proposedAction?.toolId === SUPPLIER_SIMULATION_TOOL_ID ? proposedAction : null;
  const latestSimMessage =
    snapshot?.messages
      ?.slice()
      .reverse()
      .find((m) => /supplier reallocation simulation/i.test(m.content)) ?? null;

  let gateLabel: 'WAITING_SESSION' | 'WAITING_APPROVAL' | 'READY' | 'WAITING_DATA' = 'WAITING_SESSION';
  if (!ready || !agentType || !canPropose) gateLabel = 'WAITING_SESSION';
  else if (supplierPending) gateLabel = 'WAITING_APPROVAL';
  else if (!latestSimMessage) gateLabel = 'WAITING_DATA';
  else gateLabel = 'READY';

  const onPropose = async () => {
    if (!canPropose || !ready) return;
    setBusy(true);
    setLocalError(null);
    try {
      await suggest(SUPPLIER_SIMULATION_TOOL_ID);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'propose_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PremiumDesk
      title="Scenario Lab"
      subtitle="US-AGT-01/02 supplier simulation — propose, approve, and audit. Output is not prediction certainty."
    >
      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={SUPPLIER_SIMULATION_POLICY.label} tone="warning" />
      <XivStatusPill label={`Gate: ${gateLabel}`} tone={gateLabel === 'READY' ? 'success' : 'warning'} />
      <StatusBadge
        status={
          gateLabel === 'WAITING_APPROVAL'
            ? 'waiting_for_approval'
            : gateLabel === 'READY'
              ? 'ready'
              : gateLabel === 'WAITING_SESSION'
                ? 'offline'
                : 'thinking'
        }
      />

      <PrototypeNotice text="Prototype simulation only. Approving never mutates live orders, vendors, WMS, or production systems. Guardian/RLS unchanged." />

      <Card style={styles.card}>
        <SectionHeader kicker="AI Workforce" title="Propose supplier reallocation simulation" />
        <XivText variant="body" muted>
          Tool {SUPPLIER_SIMULATION_TOOL_ID}. requiresApproval=true. After approval, only a local prototype
          simulation runs — SIMULATION ≠ PRODUCTION.
        </XivText>
        {!canPropose || !ready ? (
          <XivText variant="caption" color={Palette.warning}>
            WAITING_SESSION — sign in as executive (executive_agent allowlist) to propose.
          </XivText>
        ) : supplierPending ? (
          <XivText variant="caption" color={Palette.warning}>
            WAITING_APPROVAL — review the proposal below. Nothing has simulated yet.
          </XivText>
        ) : (
          <XivText variant="caption" muted>
            WAITING_DATA — no completed supplier simulation in this session yet.
          </XivText>
        )}
        <View style={styles.actions}>
          <Button
            label={busy || loading ? 'Proposing…' : 'Propose supplier simulation'}
            disabled={busy || loading || !canPropose || !ready || Boolean(supplierPending)}
            onPress={() => {
              void onPropose();
            }}
          />
        </View>
        {error || localError ? (
          <XivText variant="body" color={Palette.danger}>
            {error ?? localError}
          </XivText>
        ) : null}
      </Card>

      {supplierPending ? (
        <ActionApprovalCard
          action={supplierPending}
          evidenceOpen={evidenceOpen}
          onApprove={() => {
            void approveAction(supplierPending.id);
          }}
          onReject={() => {
            void rejectAction(supplierPending.id);
          }}
          onViewEvidence={() => viewEvidence(supplierPending.id)}
        />
      ) : null}

      <ApprovalAuditPanel
        approvals={snapshot?.approvals ?? []}
        intents={snapshot?.intents ?? []}
      />

      {latestSimMessage ? (
        <Card style={styles.card}>
          <SectionHeader kicker="Result" title="Prototype simulation receipt" />
          <XivText variant="body" muted>
            {latestSimMessage.content}
          </XivText>
          <XivText variant="caption" color={Palette.warning}>
            SIMULATION_NOT_PRODUCTION — do not treat this as a live supplier change.
          </XivText>
        </Card>
      ) : null}
    </PremiumDesk>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  actions: {
    marginTop: Spacing.two,
  },
});
