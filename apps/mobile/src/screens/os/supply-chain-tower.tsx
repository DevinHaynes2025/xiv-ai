import { useState } from 'react';

import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { OsModuleChips } from '@/components/xiv/os-module-chips';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { RingCard } from '@/components/xiv/ring-card';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivCausalChain } from '@/components/xiv/xiv-causal-chain';
import { XivEvidencePanel } from '@/components/xiv/xiv-evidence-panel';
import { XivRecommendationCard } from '@/components/xiv/xiv-recommendation-card';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import { fulfillmentStory, supplyRisks, supplyTower } from '@/data/operating-system';

import { useOsActions } from './use-os-actions';

const LENSES = [
  'Health',
  'Suppliers',
  'Procurement',
  'Inventory',
  'Warehouses',
  'Transportation',
  'Orders',
  'Service',
  'Risk',
  'Forecast',
] as const;

export function SupplyChainTower() {
  const { go, askXiv, approvePlan, proposedAction, notice } = useOsActions();
  const [lens, setLens] = useState<(typeof LENSES)[number]>('Health');

  const cards =
    lens === 'Risk'
      ? supplyRisks
      : supplyTower
          .filter((item) => lens === 'Health' || item.title.startsWith(lens.slice(0, 4)))
          .map((item) => ({ id: item.id, title: `${item.title} · ${item.value}`, body: `${item.detail}. SAMPLE DATA.` }));

  return (
    <ExperienceScreen title="Supply Chain" subtitle="Physical foundation. One tower." atmosphere="cinematic">
      <PrototypeNotice text="Control-tower cards are DEMO. XIV does not claim live ERP, WMS, TMS, or supplier integrations." />
      <OsModuleChips items={LENSES} selected={lens} onSelect={(item) => setLens(item as (typeof LENSES)[number])} />
      <SectionHeader kicker="Universe" title="How work travels" />
      <XivCausalChain nodes={fulfillmentStory.chain} />
      {lens === 'Health' ? (
        <>
          <MetricRow scroll>
            <RingCard title="Tower" value={86} detail="Physical composite" sample />
            {supplyTower.slice(0, 4).map((item) => (
              <MetricCard key={item.id} title={item.title} value={item.value} detail={item.detail} sample />
            ))}
          </MetricRow>
          <XivRecommendationCard
            recommends="Treat Dallas Zone C as the only named fulfillment risk today."
            ifWeAct="The chair sees one story. No ERP, WMS, or TMS write runs."
          />
          <XivEvidencePanel items={fulfillmentStory.evidence} />
        </>
      ) : null}
      <XivStoryCard
        story={fulfillmentStory}
        compact={lens !== 'Health'}
        approveLive={Boolean(proposedAction)}
        onApprovePlan={approvePlan}
        onAskXiv={askXiv}
      />
      <SectionHeader kicker={lens} title="Signals" />
      {cards.map((item) => (
        <ModuleCard
          key={item.id}
          tag="DEMO"
          title={item.title}
          body={item.body}
          onPress={item.title.startsWith('Ware') ? () => go('warehouse') : item.title.startsWith('Inve') ? () => go('inventory') : undefined}
        />
      ))}
      {notice ? <PrototypeNotice text={notice} /> : null}
    </ExperienceScreen>
  );
}
