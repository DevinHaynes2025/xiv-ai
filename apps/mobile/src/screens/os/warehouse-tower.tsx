import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionCard } from '@/components/xiv/action-card';
import { Button } from '@/components/xiv/button';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { IntelligenceHero } from '@/components/xiv/intelligence-hero';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { OsModuleChips } from '@/components/xiv/os-module-chips';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { SpecializedAgentCard } from '@/components/xiv/specialized-agent-card';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import { Spacing } from '@/constants/theme';
import { specializedAgents } from '@/data/agents-catalog';
import {
  DEMO_MARK,
  fulfillmentStory,
  warehouseExceptions,
  warehouseHealth,
  warehouseLabor,
  warehousePacking,
  warehousePicking,
  warehousePrototypeActions,
  warehousePulse,
  warehousePutaway,
  warehouseReceiving,
  warehouseReturns,
  warehouseShipping,
} from '@/data/operating-system';

import { useOsActions } from './use-os-actions';

const MODULES = [
  'Health',
  'Receiving',
  'Inventory',
  'Putaway',
  'Picking',
  'Packing',
  'Shipping',
  'Returns',
  'Exceptions',
  'Labor',
] as const;

export function WarehouseTower() {
  const { emphasis, notice, setNotice, go, askXiv, approvePlan, prototype, proposedAction } = useOsActions();
  const [module, setModule] = useState<(typeof MODULES)[number]>('Health');
  const warehouseAgent = specializedAgents.find((item) => item.id === 'warehouse');
  const chair = emphasis === 'chair';

  return (
    <ExperienceScreen
      title="Warehouse"
      subtitle={chair ? 'Fulfillment story for the chair.' : 'Compact control tower.'}
      atmosphere="cinematic">
      <PrototypeNotice text="WMS is DEMO / SAMPLE DATA. No warehouse transaction is persisted. Scan, receive, pick, and ship stay prototype only." />
      <OsModuleChips items={MODULES} selected={module} onSelect={(item) => setModule(item as (typeof MODULES)[number])} />

      {module === 'Health' ? (
        <>
          <IntelligenceHero
            score={warehouseHealth.score}
            label="Warehouse Health"
            brief={warehouseHealth.insight}
            risk="Zone C congestion on 287 DEMO orders"
            opportunity="Rebalance pick labor from Zone A"
            sample
          />
          <SectionHeader kicker="Tower" title="Dallas pulse" />
          <MetricRow scroll>
            {warehousePulse.map((item) => (
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
          <SectionHeader kicker={DEMO_MARK} title="Fulfillment story" />
          <XivStoryCard
            story={fulfillmentStory}
            compact
            approveLive={Boolean(proposedAction)}
            onApprovePlan={approvePlan}
            onAskXiv={askXiv}
          />
          <Button label="Investigate picking" variant="secondary" onPress={() => setModule('Picking')} />
        </>
      ) : null}

      {module === 'Receiving' ? (
        <>
          <SectionHeader kicker="Receiving" title="Inbound" />
          {warehouseReceiving.map((item) => (
            <ActionCard key={item.id} kicker="Receiving" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {module === 'Inventory' ? (
        <ActionCard
          kicker="Inventory"
          title="SKU 432 overlay"
          body="Dallas Zone C is holding the surge. Open Inventory for the health tower. SAMPLE DATA."
          sample
          onPress={() => go('inventory')}
        />
      ) : null}

      {module === 'Putaway' ? (
        <>
          <SectionHeader kicker="Putaway" title="Where inbound sits" />
          {warehousePutaway.map((item) => (
            <ActionCard key={item.id} kicker="Putaway" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {module === 'Picking' ? (
        <>
          <SectionHeader kicker="Picking" title="Zone C" />
          {warehousePicking.map((item) => (
            <ActionCard key={item.id} kicker="Picking" title={item.title} body={item.body} sample />
          ))}
          <XivStoryCard
            story={fulfillmentStory}
            compact
            approveLive={Boolean(proposedAction)}
            onApprovePlan={approvePlan}
            onAskXiv={askXiv}
          />
        </>
      ) : null}

      {module === 'Packing' ? (
        <>
          <SectionHeader kicker="Packing" title="Stations" />
          {warehousePacking.map((item) => (
            <ActionCard key={item.id} kicker="Packing" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {module === 'Shipping' ? (
        <>
          <SectionHeader kicker="Shipping" title="On-time" />
          {warehouseShipping.map((item) => (
            <ActionCard key={item.id} kicker="Shipping" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {module === 'Returns' ? (
        <>
          <SectionHeader kicker="Returns" title="Inspection" />
          {warehouseReturns.map((item) => (
            <ActionCard key={item.id} kicker="Returns" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {module === 'Exceptions' ? (
        <>
          <SectionHeader kicker="Exceptions" title="Named risk" />
          {warehouseExceptions.map((item) => (
            <ActionCard key={item.id} kicker="Exception" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {module === 'Labor' ? (
        <>
          <SectionHeader kicker="Labor" title="Coverage, not names" />
          {warehouseLabor.map((item) => (
            <ActionCard key={item.id} kicker="Labor" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {warehouseAgent ? (
        <SpecializedAgentCard
          agent={warehouseAgent}
          status="coming_soon"
          activity="COMING SOON — no warehouse model is called"
          onPress={() =>
            setNotice('Warehouse Agent is COMING SOON. Ask XIV opens the existing Gemini Business or Executive agent only.')
          }
        />
      ) : null}

      {!chair ? (
        <>
          <SectionHeader kicker="Future floor" title="Prototype actions" />
          <View style={styles.row}>
            {warehousePrototypeActions.map((item) => (
              <View key={item.id} style={styles.flex}>
                <Button label={item.label} variant="ghost" onPress={() => prototype(item.label)} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {notice ? <PrototypeNotice text={notice} /> : null}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  flex: {
    minWidth: 120,
    flexGrow: 1,
  },
});
