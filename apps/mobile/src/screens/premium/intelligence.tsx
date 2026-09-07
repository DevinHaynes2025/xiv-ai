import { XivConfidenceIndicator, XivIntelligenceCard, XivLiveIndicator, XivSectionHeader, XivStoryCard } from '@/components/premium';
import { premiumHome, premiumSources } from '@/data/premium-demo';

import { PremiumDesk } from './desk';

export function PremiumIntelligence() {
  return (
    <PremiumDesk title="Intelligence" subtitle="Evidence first. Forecasts are not facts.">
      <XivLiveIndicator connected={false} />
      <XivSectionHeader kicker="Signals" title="Live Market Signals" />
      <XivIntelligenceCard {...premiumHome.market} />
      <XivSectionHeader kicker="Economy" title="Economic Updates" />
      <XivIntelligenceCard
        title="Macro context"
        body="World Bank GDP and inflation adapters exist. This screen does not pretend a live ticker is connected."
        source="world_bank_open_data"
        connected={false}
        confidence="low"
      />
      <XivSectionHeader kicker="Story" title="Business Story Engine" />
      <XivStoryCard {...premiumHome.story} />
      <XivConfidenceIndicator confidence="low" />
      <XivSectionHeader kicker="Sources" title="Provider state" />
      {premiumSources.map((item) => (
        <XivIntelligenceCard
          key={item.source}
          title={item.source}
          body={item.note}
          source={item.source}
          connected={item.connected}
          confidence={item.live ? 'low' : 'unknown'}
        />
      ))}
    </PremiumDesk>
  );
}

export function PremiumStory() {
  return (
    <PremiumDesk title="Business Story" subtitle="What happened → why it may have → what to try.">
      <XivStoryCard {...premiumHome.story} />
      <XivIntelligenceCard
        title="Stances"
        body="Observed, inferred, hypothesized, forecast, and recommended stay labeled. No fabricated quotes."
        source="story-engine"
        connected={false}
        confidence="low"
      />
    </PremiumDesk>
  );
}

export function PremiumDataSources() {
  return (
    <PremiumDesk title="Data Sources" subtitle="Connected adapters vs not_configured providers.">
      {premiumSources.map((item) => (
        <XivIntelligenceCard
          key={item.source}
          title={item.source}
          body={item.note}
          source={item.live ? 'validated public adapter' : 'not_configured'}
          connected={item.connected}
          confidence={item.live ? 'low' : 'unknown'}
        />
      ))}
    </PremiumDesk>
  );
}
