import { XivGlassPanel, XivStatusPill } from '@/components/premium';
import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Palette } from '@/constants/theme';

import { EvidenceStrip, XivConfidenceBadge, XivStatusIndicator } from './story';

export function AgentPermissionBadge({
  level,
  enabled,
}: {
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  enabled: boolean;
}) {
  const labels = {
    L0: 'L0 Observe',
    L1: 'L1 Recommend',
    L2: 'L2 Draft',
    L3: 'L3 Human Approval',
    L4: 'L4 Bounded Autonomy',
    L5: 'L5 Human Only / Critical',
  } as const;
  return <XivStatusPill label={`${labels[level]}${enabled ? '' : ' · disabled'}`} tone={enabled ? 'neutral' : 'warning'} />;
}

export function AgentStatus({
  name,
  investigating,
  authority,
}: {
  name: string;
  investigating: string;
  authority: string;
}) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state="DEMO" />
      <XivText variant="card">Active agent: {name}</XivText>
      <XivText variant="body" muted>
        Investigating: {investigating}
      </XivText>
      <XivText variant="metadata" dim>
        Current authority: {authority}
      </XivText>
    </XivGlassPanel>
  );
}

export function AgentEvidence({ items }: { items: readonly string[] }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Evidence
      </XivText>
      <EvidenceStrip items={items} />
    </XivGlassPanel>
  );
}

export function AgentRecommendation({ text, approval }: { text: string; approval: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Proposed action
      </XivText>
      <XivText variant="body">{text}</XivText>
      <XivText variant="metadata" muted>
        Required approval: {approval}
      </XivText>
    </XivGlassPanel>
  );
}

export function AgentApprovalCard() {
  return (
    <XivGlassPanel accessibilityLabel="No pending approval">
      <XivStatusPill label="Approvals" tone="success" />
      <XivText variant="card">No pending consequential action</XivText>
      <XivText variant="body" muted>
        High-impact actions remain human governed. Agents cannot change their own authority.
      </XivText>
    </XivGlassPanel>
  );
}

export function AgentActivityTimeline({ items }: { items: readonly string[] }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Audit trail
      </XivText>
      {items.map((item) => (
        <XivText key={item} variant="body" muted>
          · {item}
        </XivText>
      ))}
    </XivGlassPanel>
  );
}

export function AgentOutcomeCard({ text }: { text: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Outcome
      </XivText>
      <XivText variant="body">{text}</XivText>
      <SampleMark text="NO PRODUCTION WRITE" />
    </XivGlassPanel>
  );
}

export function AgentWorkspace({
  active,
  investigating,
  sources,
  evidence,
  confidence,
  proposedAction,
  requiredApproval,
  currentAuthority,
  outcome,
  audit,
}: {
  active: string;
  investigating: string;
  sources: readonly string[];
  evidence: readonly string[];
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  proposedAction: string;
  requiredApproval: string;
  currentAuthority: string;
  outcome: string;
  audit: readonly string[];
}) {
  return (
    <>
      <AgentStatus name={active} investigating={investigating} authority={currentAuthority} />
      <XivGlassPanel>
        <XivText variant="label" color={Palette.accent}>
          Sources being used
        </XivText>
        <EvidenceStrip items={sources} />
      </XivGlassPanel>
      <AgentEvidence items={evidence} />
      <XivConfidenceBadge confidence={confidence} />
      <AgentRecommendation text={proposedAction} approval={requiredApproval} />
      <AgentPermissionBadge level="L3" enabled />
      <AgentPermissionBadge level="L4" enabled={false} />
      <AgentPermissionBadge level="L5" enabled />
      <AgentApprovalCard />
      <AgentOutcomeCard text={outcome} />
      <AgentActivityTimeline items={audit} />
    </>
  );
}
