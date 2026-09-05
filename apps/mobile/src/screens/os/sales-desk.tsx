import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionCard } from '@/components/xiv/action-card';
import { Button } from '@/components/xiv/button';
import { CustomerCard } from '@/components/xiv/customer-card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { OpportunityCard } from '@/components/xiv/opportunity-card';
import { OsModuleChips } from '@/components/xiv/os-module-chips';
import { PipelineCard } from '@/components/xiv/pipeline-card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SalesInsightCard } from '@/components/xiv/sales-insight-card';
import { SectionHeader } from '@/components/xiv/section-header';
import { SpecializedAgentCard } from '@/components/xiv/specialized-agent-card';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import { Spacing } from '@/constants/theme';
import { specializedAgents } from '@/data/agents-catalog';
import {
  customerCards,
  salesAccounts,
  salesActivity,
  salesCampaigns,
  salesContacts,
  salesLeads,
  salesOpportunities,
  salesPipeline,
  salesStalledStory,
  salesToday,
} from '@/data/operating-system';

import { useOsActions } from './use-os-actions';

const VIEWS = ['Today', 'Leads', 'Accounts', 'Contacts', 'Opportunities', 'Pipeline', 'Customers', 'Activity', 'Campaigns'] as const;

export function SalesDesk() {
  const { go, askXiv, approvePlan, prototype, notice, proposedAction } = useOsActions();
  const [view, setView] = useState<(typeof VIEWS)[number]>('Today');
  const salesAgent = specializedAgents.find((item) => item.id === 'sales');

  return (
    <ExperienceScreen title="Sales" subtitle="CRM pulse. Nothing auto-sends." atmosphere="cinematic">
      <PrototypeNotice text="Sales figures are DEMO / SAMPLE DATA. CRM is NOT CONNECTED. Follow-ups never auto-send." />
      <OsModuleChips items={VIEWS} selected={view} onSelect={(item) => setView(item as (typeof VIEWS)[number])} />

      {view === 'Today' ? (
        <>
          <SectionHeader kicker="Pulse" title="Sales desk" />
          <MetricRow scroll>
            {salesToday.map((item) => (
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
          <SalesInsightCard
            title="A $410K commit went quiet"
            body="Nine idle days and a late sample carton sit on the same account."
            detail="CRM is NOT CONNECTED. Nothing is auto-sent."
          />
          <SectionHeader kicker="Pipeline" title="Weighted stages" />
          <PipelineCard stages={salesPipeline} />
          <SectionHeader kicker="Priority" title="Accounts" />
          {salesAccounts.map((item) => (
            <ActionCard
              key={item.id}
              kicker="Account"
              title={item.title}
              body={item.body}
              sample
              onPress={() => go('customers')}
            />
          ))}
          <SectionHeader kicker="Follow-ups" title="Human owned" />
          {salesActivity.map((item) => (
            <ActionCard key={item.id} kicker="Follow-up" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {view === 'Pipeline' ? (
        <>
          <SectionHeader kicker="Pipeline" title="Visual weight" />
          <PipelineCard stages={salesPipeline} />
        </>
      ) : null}

      {view === 'Leads' ? (
        <>
          <SectionHeader kicker="Leads" title="Hot" />
          {salesLeads.map((item) => (
            <ActionCard key={item.id} kicker="Lead" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {view === 'Accounts' ? (
        <>
          <SectionHeader kicker="Accounts" title="Named" />
          {salesAccounts.map((item) => (
            <ActionCard
              key={item.id}
              kicker="Account"
              title={item.title}
              body={item.body}
              sample
              onPress={() => go('customers')}
            />
          ))}
        </>
      ) : null}

      {view === 'Contacts' ? (
        <>
          <SectionHeader kicker="Contacts" title="People on the deal" />
          {salesContacts.map((item) => (
            <ActionCard key={item.id} kicker="Contact" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {view === 'Opportunities' ? (
        <>
          <SectionHeader kicker="Opportunities" title="In motion" />
          {salesOpportunities.map((item) => (
            <OpportunityCard
              key={item.id}
              kind={item.stage}
              title={item.title}
              body={item.body}
              meta={item.amount}
              sample
            />
          ))}
        </>
      ) : null}

      {view === 'Customers' ? (
        <>
          <SectionHeader kicker="Customers" title="Health" />
          {customerCards.map((item) => (
            <CustomerCard
              key={item.id}
              title={item.title}
              relationship={item.relationship}
              health={item.health}
              orders={item.orders}
              service={item.service}
              returns={item.returns}
              onPress={() => go('customers')}
            />
          ))}
        </>
      ) : null}

      {view === 'Activity' ? (
        <>
          <SectionHeader kicker="Activity" title="What went quiet" />
          {salesActivity.map((item) => (
            <ActionCard key={item.id} kicker="Activity" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {view === 'Campaigns' ? (
        <>
          <SectionHeader kicker="Campaigns" title="Drafts only" />
          {salesCampaigns.map((item) => (
            <ActionCard key={item.id} kicker="Campaign" title={item.title} body={item.body} sample />
          ))}
        </>
      ) : null}

      {salesAgent ? (
        <SpecializedAgentCard
          agent={salesAgent}
          status="coming_soon"
          activity="Stalled $410K example · COMING SOON — no sales model"
          onPress={() =>
            prototype('XIV Sales Agent is COMING SOON. Ask XIV still opens the existing Gemini Business or Executive agent.')
          }
        />
      ) : null}

      <XivStoryCard
        story={salesStalledStory}
        compact={view !== 'Today'}
        approveLive={Boolean(proposedAction)}
        onApprovePlan={approvePlan}
        onAskXiv={askXiv}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label="Open Account" variant="secondary" onPress={() => go('customers')} />
        </View>
        <View style={styles.flex}>
          <Button label="Draft Follow-Up" variant="secondary" onPress={() => prototype('Draft Follow-Up')} />
        </View>
      </View>
      {notice ? <PrototypeNotice text={notice} /> : null}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
