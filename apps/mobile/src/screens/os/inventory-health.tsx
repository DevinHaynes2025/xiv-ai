import { useState } from 'react';

import { ChartCard } from '@/components/xiv/chart-card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { OsModuleChips } from '@/components/xiv/os-module-chips';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { RingCard } from '@/components/xiv/ring-card';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivRecommendationCard } from '@/components/xiv/xiv-recommendation-card';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import {
  inventoryCritical,
  inventoryDistribution,
  inventoryExcess,
  inventoryPulse,
  inventoryReorder,
  inventoryRings,
  inventorySlow,
  inventoryStockouts,
  inventoryStory,
} from '@/data/operating-system';

import { useOsActions } from './use-os-actions';

const LENSES = ['Health', 'Stockouts', 'Excess', 'Critical', 'Slow moving', 'Reorder', 'Distribution'] as const;

export function InventoryHealth() {
  const { notice, askXiv, approvePlan, proposedAction } = useOsActions();
  const [lens, setLens] = useState<(typeof LENSES)[number]>('Health');

  return (
    <ExperienceScreen title="Inventory" subtitle="Health, not a stock ledger." atmosphere="cinematic">
      <PrototypeNotice text="Inventory cards are DEMO / SAMPLE DATA. Agent recommendations do not write stock, reorders, or transfers." />
      <OsModuleChips items={LENSES} selected={lens} onSelect={(item) => setLens(item as (typeof LENSES)[number])} />

      {lens === 'Health' ? (
        <>
          <SectionHeader kicker="Rings" title="Inventory health" />
          <MetricRow scroll>
            {inventoryRings.map((item) => (
              <RingCard key={item.id} title={item.title} value={item.value} detail={item.detail} sample />
            ))}
          </MetricRow>
          <SectionHeader kicker="Pulse" title="Watch" />
          <MetricRow scroll>
            {inventoryPulse.map((item) => (
              <MetricCard
                key={item.id}
                title={item.title}
                value={item.value}
                detail={item.detail}
                spark={item.spark}
                sample
              />
            ))}
          </MetricRow>
        </>
      ) : null}

      {lens === 'Stockouts' ? (
        <>
          <SectionHeader kicker="Stockouts" title="Critical cover" />
          {inventoryStockouts.map((item) => (
            <ModuleCard key={item.id} tag="SAMPLE DATA" title={item.title} body={item.body} />
          ))}
        </>
      ) : null}

      {lens === 'Excess' ? (
        <>
          <SectionHeader kicker="Excess" title="Over cover" />
          {inventoryExcess.map((item) => (
            <ModuleCard key={item.id} tag="SAMPLE DATA" title={item.title} body={item.body} />
          ))}
        </>
      ) : null}

      {lens === 'Critical' ? (
        <>
          <SectionHeader kicker="Watch" title="Critical SKUs" />
          {inventoryCritical.map((item) => (
            <ModuleCard key={item.id} tag="SAMPLE DATA" title={item.title} body={item.body} />
          ))}
        </>
      ) : null}

      {lens === 'Slow moving' ? (
        <>
          <SectionHeader kicker="Slow moving" title="Aged packs" />
          {inventorySlow.map((item) => (
            <ModuleCard key={item.id} tag="SAMPLE DATA" title={item.title} body={item.body} />
          ))}
        </>
      ) : null}

      {lens === 'Reorder' ? (
        <>
          <SectionHeader kicker="Reorder risk" title="Do not auto-buy" />
          {inventoryReorder.map((item) => (
            <ModuleCard key={item.id} tag="SAMPLE DATA" title={item.title} body={item.body} />
          ))}
        </>
      ) : null}

      {lens === 'Distribution' || lens === 'Health' ? (
        <>
          <SectionHeader kicker="Distribution" title="Warehouses" />
          <MetricRow scroll>
            {inventoryDistribution.map((item) => (
              <ChartCard
                key={item.id}
                title={item.title}
                value={item.value}
                detail={item.detail}
                series={[0.4, 0.5, 0.45, item.share, 0.7, item.share]}
                sample
              />
            ))}
          </MetricRow>
        </>
      ) : null}

      <XivRecommendationCard
        recommends="Hold a putaway sweep for SKU 432 before a reorder is drafted."
        ifWeAct="Dallas congestion eases on paper. No inventory write is executed."
      />
      <XivStoryCard
        story={inventoryStory}
        compact
        approveLive={Boolean(proposedAction)}
        onApprovePlan={approvePlan}
        onAskXiv={askXiv}
      />
      {notice ? <PrototypeNotice text={notice} /> : null}
    </ExperienceScreen>
  );
}
