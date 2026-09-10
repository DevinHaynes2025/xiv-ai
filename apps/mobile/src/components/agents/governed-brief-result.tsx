import { StyleSheet, View } from 'react-native';

import { briefStatus, DataStatusMark } from '@/components/agents/data-status';
import { ModuleCard } from '@/components/xiv/experience-screen';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { ExecutiveBrief } from '@/lib/ai';

export function GovernedBriefResult({ brief }: { brief: ExecutiveBrief }) {
  const status = briefStatus(brief);
  return (
    <View style={styles.wrap}>
      <XivText variant="label" color={Palette.accent}>
        Governed Story Engine brief - read-only
      </XivText>
      <DataStatusMark
        status={status}
        source={brief.sources[0]}
        freshness={brief.freshness}
        retrievedAt={brief.generatedAt}
      />
      <XivText variant="caption" dim>
        Confidence {brief.confidence} · freshness {brief.freshnessSummary}
      </XivText>
      <XivText variant="caption" muted>
        {brief.financialImpactNote} Financial impact claimed: {String(brief.financialImpactClaimed)}.
      </XivText>
      {brief.unsupportedDomains.length > 0 ? (
        <XivText variant="caption" dim>
          Unsupported domains: {brief.unsupportedDomains.join(', ')}
        </XivText>
      ) : null}
    </View>
  );
}

export function StoryBriefChapters({ brief }: { brief: ExecutiveBrief }) {
  const live = brief.dataStatus === 'live' && !brief.prototype;
  return (
    <View style={styles.wrap}>
      <SectionHeader kicker="Changed" title="What changed" />
      {brief.criticalChanges.length === 0 ? (
        <ModuleCard
          tag={live ? 'live-empty' : String(brief.dataStatus)}
          title={live ? 'No observed changes yet' : 'No change narrative'}
          body="Empty change list — not a fabricated status update. Story Engine only reports authorized evidence."
        />
      ) : (
        brief.criticalChanges.map((change) => (
          <ModuleCard key={change} tag="what-changed" title={change} body="From governed live executive brief sources." />
        ))
      )}

      <SectionHeader kicker="Why" title="Why it may matter" />
      {brief.topRisks.length === 0 ? (
        <ModuleCard
          tag="hypothesis"
          title="No live why-chain yet"
          body="Risks and causes stay empty until authorized sources provide them. Hypotheses are never shown as facts."
        />
      ) : (
        brief.topRisks.map((risk) => (
          <ModuleCard key={risk} tag="risk / why" title={risk} body="Listed as risk context — not automatic causation." />
        ))
      )}

      <SectionHeader kicker="Next" title="Opportunities & priorities (not executed)" />
      {brief.topOpportunities.length === 0 && brief.recommendedPriorities.length === 0 ? (
        <ModuleCard
          tag="requiresApproval"
          title="No recommended action yet"
          body="requiresApproval=true for any operational change. L4_AUTONOMY_ENABLED=false. Founder Twin cannot approve writes."
        />
      ) : (
        [...brief.recommendedPriorities, ...brief.topOpportunities].slice(0, 4).map((item) => (
          <ModuleCard
            key={item}
            tag="requiresApproval"
            title={item}
            body="Read-only brief. Human approval required before any action; approval does not override policy."
          />
        ))
      )}

      <SectionHeader kicker="Evidence" title="Sources" />
      <ModuleCard
        tag={String(brief.dataStatus)}
        title={brief.sources.join(', ') || 'No sources'}
        body={${brief.freshnessSummary} · generated }
      />

      {brief.decisionsAwaitingApproval.length > 0 ? (
        <>
          <SectionHeader kicker="Approvals" title="Decisions awaiting human review" />
          {brief.decisionsAwaitingApproval.map((decision) => (
            <ModuleCard key={decision} tag="pending" title={decision} body="Not auto-executed." />
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
});
