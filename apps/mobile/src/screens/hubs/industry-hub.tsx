import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { IntelligenceHero } from '@/components/xiv/intelligence-hero';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { RingCard } from '@/components/xiv/ring-card';
import { SampleMark } from '@/components/xiv/sample-mark';
import { SectionHeader } from '@/components/xiv/section-header';
import { SpecializedAgentCard } from '@/components/xiv/specialized-agent-card';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { specializedAgents } from '@/data/agents-catalog';
import { industryHubs, industryHubById, type IndustryHubId } from '@/data/industry-hubs';

function hubAgentId(id: IndustryHubId) {
  if (id === 'trading') return 'trading_research' as const;
  if (id === 'real-estate') return 'real_estate' as const;
  return 'insurance' as const;
}

export function IndustryHubsHome() {
  const router = useRouter();

  return (
    <ExperienceScreen title="Industry Hubs" subtitle="Vertical floors for operators.">
      <PrototypeNotice text="These hubs are product architecture. Every figure is DEMO until a licensed feed, listing service, or policy admin is connected. Industry agents are COMING SOON." />
      {industryHubs.map((hub) => (
        <ModuleCard
          key={hub.id}
          tag="DEMO"
          title={hub.name}
          body={hub.summary}
          meta={hub.kicker}
          onPress={() => router.navigate(`/consumer/hubs/${hub.id}` as Href)}
        />
      ))}
    </ExperienceScreen>
  );
}

export function IndustryHubScreen({ id }: { id: IndustryHubId | string }) {
  const router = useRouter();
  const hub = industryHubById(id);

  if (!hub) {
    return (
      <ExperienceScreen title="Industry Hub" subtitle="Vertical floor">
        <EmptyState title="Unknown hub" body="This vertical is not in the preview map." />
      </ExperienceScreen>
    );
  }

  return (
    <ExperienceScreen title={hub.name} subtitle={hub.kicker} atmosphere="cinematic">
      <PrototypeNotice text={hub.disclaimer} />
      <IntelligenceHero
        score={86}
        label={hub.name}
        brief={hub.summary}
        risk="No licensed feed is connected"
        opportunity="Architecture only — DEMO"
        sample
      />
      <MetricRow scroll>
        {hub.metrics.map((metric, index) =>
          index === 0 && /^\d+$/.test(metric.value) ? (
            <RingCard
              key={metric.title}
              title={metric.title}
              value={Number(metric.value)}
              detail={metric.detail}
              sample
            />
          ) : (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              detail={metric.detail}
              sample
            />
          ),
        )}
      </MetricRow>

      <SectionHeader kicker="Agent" title={hub.agent.name} />
      {specializedAgents
        .filter((item) => item.id === hubAgentId(hub.id))
        .map((item) => (
          <SpecializedAgentCard key={item.id} agent={item} status="coming_soon" activity={hub.agent.note} />
        ))}
      <XivText variant="caption" color={Palette.textDim}>
        COMING SOON. No model is called from this card. No guaranteed returns, auto trading, or regulated decisions.
      </XivText>

      {hub.sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <SectionHeader kicker="DEMO" title={section.title} />
          <XivText variant="body" muted>
            {section.body}
          </XivText>
          {section.items.map((item) => (
            <Card key={item.title}>
              <SampleMark text="DEMO" />
              <XivText variant="subtitle">{item.title}</XivText>
              <XivText variant="body" muted>
                {item.detail}
              </XivText>
            </Card>
          ))}
        </View>
      ))}

      <ModuleCard
        tag="Network"
        title="Back to Discover"
        body="Industry hubs sit beside companies, products, and communities."
        onPress={() => router.navigate('/consumer/discover' as Href)}
      />
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
});
