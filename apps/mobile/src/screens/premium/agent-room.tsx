import { XivAgentCard, XivSectionHeader, XivStatusPill } from '@/components/premium';
import { AgentPermissionBadge, AgentWorkspace } from '@/components/v4';
import { XivText } from '@/components/xiv/text';
import { AGENT_WORKSPACE, EXPERIENCE_AGENTS } from '@/data/premium-experience';

import { PremiumDesk } from './desk';

export function PremiumAgentRoom() {
  return (
    <PremiumDesk title="AI Agent Room" subtitle="Operating workspace. Production writes stay on the governed Agents desk.">
      <XivStatusPill label="L4 disabled" tone="warning" />
      <AgentPermissionBadge level="L0" enabled />
      <AgentPermissionBadge level="L1" enabled />
      <AgentPermissionBadge level="L2" enabled />
      <AgentPermissionBadge level="L3" enabled />
      <AgentPermissionBadge level="L4" enabled={false} />
      <AgentPermissionBadge level="L5" enabled />
      <AgentWorkspace {...AGENT_WORKSPACE} />
      <XivSectionHeader kicker="Workforce" title="Agents" />
      {EXPERIENCE_AGENTS.map((agent) => (
        <XivAgentCard
          key={agent.name}
          name={`${agent.name} Agent`}
          role={agent.name}
          authority={agent.authority}
          status={agent.status}
          task={agent.task}
        />
      ))}
      <XivText variant="micro" dim>
        Client role arrays, selected company, and selected Universe are not authorization. Server membership governs writes.
      </XivText>
    </PremiumDesk>
  );
}
