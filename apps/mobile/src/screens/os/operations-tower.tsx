import { ActionCard } from '@/components/xiv/action-card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivCausalChain } from '@/components/xiv/xiv-causal-chain';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import { executiveOperations } from '@/data/mock';
import { fulfillmentStory, warehouseHealth, warehousePulse } from '@/data/operating-system';

import { useOsActions } from './use-os-actions';

export function OperationsTower() {
  const { emphasis, go, askXiv, approvePlan, proposedAction, notice } = useOsActions();
  const chair = emphasis === 'chair';

  return (
    <ExperienceScreen
      title="Operations"
      subtitle={chair ? 'Exceptions the chair should see.' : 'Physical work, one story.'}
      atmosphere="cinematic">
      <PrototypeNotice text="Operations is a control tower over DEMO warehouse and inventory cards. No WMS is linked." />
      <SectionHeader kicker="Physical" title="Fulfillment" />
      <MetricRow scroll>
        <MetricCard title="Warehouse" value={String(warehouseHealth.score)} detail="Dallas health" sample />
        {warehousePulse.slice(0, 3).map((item) => (
          <MetricCard key={item.id} title={item.title} value={item.value} detail={item.detail} sample />
        ))}
      </MetricRow>
      <XivStoryCard
        story={fulfillmentStory}
        compact={chair}
        approveLive={Boolean(proposedAction)}
        onApprovePlan={approvePlan}
        onAskXiv={askXiv}
      />
      <XivCausalChain nodes={fulfillmentStory.chain} />
      <SectionHeader kicker="Open" title="Desks" />
      <ActionCard
        kicker="Warehouse"
        title="Dallas control tower"
        body="Orders, Zone C, shipping. SAMPLE DATA."
        sample
        onPress={() => go('warehouse')}
      />
      <ActionCard
        kicker="Inventory"
        title="SKU 432 overlay"
        body="Health, excess, reorder risk. SAMPLE DATA."
        sample
        onPress={() => go('inventory')}
      />
      <ActionCard
        kicker="Supply chain"
        title="Physical foundation"
        body="Suppliers through service levels. SAMPLE DATA."
        sample
        onPress={() => go('supply-chain')}
      />
      {chair
        ? executiveOperations.map((item) => (
            <ActionCard key={item.id} kicker="Chair note" title={item.title} body={item.detail} sample />
          ))
        : null}
      {notice ? <PrototypeNotice text={notice} /> : null}
    </ExperienceScreen>
  );
}
