import { XivAgentCard, XivEmptyState, XivGlassPanel, XivSectionHeader, XivStatusPill } from '@/components/premium';
import { XivText } from '@/components/xiv/text';
import { premiumAgents } from '@/data/premium-demo';

import { PremiumDesk } from './desk';

export function PremiumAgentRoom() {
  return (
    <PremiumDesk title="AI Agent Room" subtitle="Ask XIV. Evidence drawer. Approvals. No self-authority edits.">
      <XivStatusPill label="L4 disabled" tone="warning" />
      <XivSectionHeader kicker="Ask" title="Ask XIV" />
      <XivGlassPanel>
        <XivText variant="body" muted>
          Agent collaboration timeline is a prototype. Production writes remain governed. Cloud Agent is not XIV production authority.
        </XivText>
      </XivGlassPanel>
      <XivSectionHeader kicker="Workforce" title="Agents" />
      {premiumAgents.map((agent) => (
        <XivAgentCard key={agent.name} {...agent} />
      ))}
      <XivEmptyState
        title="Approval requests"
        body="No pending governed action. Agents cannot change their own authority."
      />
    </PremiumDesk>
  );
}
