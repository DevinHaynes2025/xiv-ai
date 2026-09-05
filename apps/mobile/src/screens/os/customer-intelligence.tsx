import { ActionCard } from '@/components/xiv/action-card';
import { CustomerCard } from '@/components/xiv/customer-card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { RingCard } from '@/components/xiv/ring-card';
import { SectionHeader } from '@/components/xiv/section-header';
import { SpecializedAgentCard } from '@/components/xiv/specialized-agent-card';
import { XivCausalChain } from '@/components/xiv/xiv-causal-chain';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import { specializedAgents } from '@/data/agents-catalog';
import { customerCards, customerStory } from '@/data/operating-system';

import { useOsActions } from './use-os-actions';

export function CustomerIntelligence() {
  const { go, askXiv, approvePlan, proposedAction, notice } = useOsActions();
  const customerAgent = specializedAgents.find((item) => item.id === 'customer');

  return (
    <ExperienceScreen title="Customers" subtitle="Customer health. CRM plus operations, conceptually." atmosphere="cinematic">
      <PrototypeNotice text="Customer intelligence is DEMO. CRM and order systems are NOT CONNECTED. No private account file is loaded." />
      <SectionHeader kicker="Customer health" title="One score from two desks" />
      <MetricRow scroll>
        <RingCard title="Keel Atlantic" value={72} detail="Sales stall + late sample" sample />
        <RingCard title="Harbor Retail" value={88} detail="On time · growing" sample />
        <MetricCard title="Open orders" value="20" detail="Across DEMO accounts" sample />
      </MetricRow>
      <XivCausalChain nodes={customerStory.chain} />
      <XivStoryCard
        story={customerStory}
        approveLive={Boolean(proposedAction)}
        onApprovePlan={approvePlan}
        onAskXiv={askXiv}
      />
      <SectionHeader kicker="Accounts" title="Health cards" />
      {customerCards.map((item) => (
        <CustomerCard
          key={item.id}
          title={item.title}
          relationship={item.relationship}
          health={item.health}
          orders={item.orders}
          service={item.service}
          returns={item.returns}
        />
      ))}
      <ActionCard
        kicker="Sales"
        title="Open the sales desk"
        body="Pipeline and the stalled $410K story. SAMPLE DATA."
        sample
        onPress={() => go('sales')}
      />
      {customerAgent ? (
        <SpecializedAgentCard
          agent={customerAgent}
          status="coming_soon"
          activity="COMING SOON — no customer model is called"
        />
      ) : null}
      {notice ? <PrototypeNotice text={notice} /> : null}
    </ExperienceScreen>
  );
}
