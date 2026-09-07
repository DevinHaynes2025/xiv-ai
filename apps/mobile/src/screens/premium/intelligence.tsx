import { XivIntelligenceCard, XivSectionHeader } from '@/components/premium';
import {
  BusinessTimeline,
  ComparisonPanel,
  IntelligenceStoryCard,
  RiskOpportunityPanel,
  SourceRow,
  XivStatusIndicator,
} from '@/components/v4';
import {
  FORECAST_STORY,
  INFERENCE_STORY,
  INTELLIGENCE_STORIES,
  INTELLIGENCE_TIMELINE,
  SOURCE_ROWS,
} from '@/data/premium-experience';

import { PremiumDesk } from './desk';

export function PremiumIntelligence() {
  return (
    <PremiumDesk title="Intelligence" subtitle="WHAT · WHY · IMPACT · NEXT · ACTION · EVIDENCE · CONFIDENCE.">
      <XivSectionHeader kicker="Truth" title="Provider state" />
      {SOURCE_ROWS.filter((row) => row.name === 'World Bank Open Data' || row.name === 'U.S. SEC EDGAR').map((row) => (
        <SourceRow key={row.name} {...row} />
      ))}
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivIntelligenceCard
        title="Global Data Fabric"
        body="Production-live remains false. Bloomberg, NVIDIA, ERP, and private warehouse feeds are not claimed."
        source="global-data-fabric"
        connected={false}
        confidence="unknown"
      />

      <XivSectionHeader kicker="Stories" title="Business intelligence stories" />
      {INTELLIGENCE_STORIES.map((story) => (
        <IntelligenceStoryCard key={story.title} {...story} />
      ))}

      <XivSectionHeader kicker="Risk" title="Risk and opportunity" />
      <RiskOpportunityPanel
        risk="Working-capital pressure if DSO stays elevated — DEMO only."
        opportunity="Public World Bank and SEC adapters can inform historical context. They are not this card streaming."
      />

      <XivSectionHeader kicker="Compare" title="Comparison" />
      <ComparisonPanel left="Last week DSO 41 days (DEMO)" right="This week DSO 44 days (DEMO)" />

      <XivSectionHeader kicker="Time" title="Timeline" />
      <BusinessTimeline periods={[...INTELLIGENCE_TIMELINE]} />

      <XivSectionHeader kicker="Forecast" title="Not a fact" />
      <IntelligenceStoryCard {...FORECAST_STORY} />
      <XivSectionHeader kicker="Inference" title="Modeled, not observed" />
      <IntelligenceStoryCard {...INFERENCE_STORY} />
    </PremiumDesk>
  );
}

export function PremiumStory() {
  const story = INTELLIGENCE_STORIES[0];
  return (
    <PremiumDesk title="Business Story" subtitle={`${story.title} · ${story.state}`}>
      <IntelligenceStoryCard {...story} />
    </PremiumDesk>
  );
}

export function PremiumDataSources() {
  return (
    <PremiumDesk title="Data Sources" subtitle="Source · status · owner · freshness · permission · quality.">
      {SOURCE_ROWS.map((row) => (
        <SourceRow key={row.name} {...row} />
      ))}
    </PremiumDesk>
  );
}
