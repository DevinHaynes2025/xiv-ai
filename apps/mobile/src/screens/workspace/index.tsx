import { type Href, useRouter } from 'expo-router';

import { XivEmptyState, XivPremiumButton, XivSectionHeader, XivStatusPill } from '@/components/premium';
import {
  ConnectionCard,
  IntelligenceStoryCard,
  SourceRow,
  XivListRow,
  XivStatusIndicator,
} from '@/components/v4';
import {
  CompanyHeader,
  CompanyStoryCard,
  ContradictionPanel,
  DataQualityCard,
  FilingTimeline,
  FinancialFactCard,
  JurisdictionBadge,
  MacroContextCard,
  RegistryBadge,
  SourceProvenancePanel,
  WatchStateBadge,
} from '@/components/workspace/company';
import {
  ConflictNotice,
  EvidenceCellIndicator,
  OfflineAvailabilityBadge,
  OfflineBanner,
  PendingChangesBadge,
  SyncIndicator,
} from '@/components/workspace/status';
import { useSession } from '@/context/session';
import { DAILY_CHANNELS, DISCOVERY_ROWS, SHEET_ROWS } from '@/data/workspace-demo';
import { EXPERIENCE_STORY } from '@/data/premium-experience';
import { osHome } from '@/lib/os-routes';
import { XivText } from '@/components/xiv/text';
import { PremiumDesk } from '../premium/desk';

export function WorkspaceOfflineCenter() {
  return (
    <PremiumDesk title="Offline Center" subtitle="Encrypted queue foundation. Not a production sync engine.">
      <OfflineBanner state="ONLINE" />
      <SyncIndicator />
      <PendingChangesBadge count={0} />
      <OfflineAvailabilityBadge policy="CLOUD_ONLY" />
      <OfflineAvailabilityBadge policy="OFFLINE_ENCRYPTED" />
      <ConflictNotice />
      <XivText variant="micro" dim>
        CLOUD_ONLY cannot be cached. Reconnect still requires tenant authorization. Secrets are not stored locally.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceDiscover() {
  return (
    <PremiumDesk title="Global Discover" subtitle="Opportunity discovery. Not guaranteed stock picking.">
      <XivStatusPill label="Investment recommendation: none" tone="warning" />
      {DISCOVERY_ROWS.map((row) => (
        <ConnectionCard key={row.name} name={row.name} expertise={`${row.country} · ${row.signal}`} context={row.note} state={row.state} />
      ))}
      <RegistryBadge registry="GLEIF" live={false} />
      <RegistryBadge registry="UK Companies House" live={false} />
      <XivText variant="metadata" muted>
        World Bank and SEC adapters may be LIVE. GLEIF may be LIVE after proof. UK Companies House, patents, procurement, and licensed news are NOT_CONFIGURED.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceWatchlist() {
  return (
    <PremiumDesk title="Research Watchlist" subtitle="WATCH · EMERGING · REQUIRES_REVIEW. No BUY/SELL.">
      <WatchStateBadge label="REQUIRES_REVIEW" />
      {SHEET_ROWS.map((row) => (
        <XivListRow key={row.company} title={row.company} body={`${row.signal} · ${row.risk}`} meta={row.evidence} />
      ))}
    </PremiumDesk>
  );
}

export function WorkspaceResearch() {
  return (
    <PremiumDesk title="Research Packet" subtitle="Discovery → Filings → Contradiction → Human.">
      <XivStatusPill label="Contradiction Agent" />
      <ContradictionPanel text="If a press release disagrees with a filing, XIV surfaces the contradiction instead of choosing the exciting narrative." />
      <MacroContextCard text="World Bank macro context is a separate provenance stream. Definitions are not silently compared to company filings." />
      <IntelligenceStoryCard {...EXPERIENCE_STORY} />
    </PremiumDesk>
  );
}

export function WorkspaceSheets() {
  return (
    <PremiumDesk title="XIV Sheets" subtitle="Bounded formulas. Cells may carry provenance. Not Excel.">
      <XivSectionHeader kicker="Grid" title="Watchlist table (DEMO)" />
      {SHEET_ROWS.map((row) => (
        <XivListRow
          key={row.company}
          title={row.company}
          body={`Revenue ${row.revenue} · Growth ${row.growth} · ${row.signal}`}
          meta={row.evidence}
        />
      ))}
      <EvidenceCellIndicator source="demo_sheet · not SEC streaming · GLEIF bindings keep provider + retrievedAt" state="DEMO" />
      <XivText variant="micro" dim>
        Formulas: SUM AVERAGE MIN MAX COUNT CHANGE PERCENT_CHANGE. Arbitrary code is denied.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceCharts() {
  return (
    <PremiumDesk title="XIV Charts" subtitle="LINE · BAR · COMPARISON · KPI. No fake live feed.">
      <XivStatusIndicator state="DEMO" />
      <XivEmptyState title="Chart foundation" body="Series carry source, period, unit, freshness, and fact/inference/forecast stance. Fake market prices are not shown." />
    </PremiumDesk>
  );
}

export function WorkspaceCompanyResearch() {
  return (
    <PremiumDesk title="Company Research" subtitle="Jurisdiction-aware identity. Name-only merge is denied.">
      <CompanyHeader name="UNILEVER PLC" country="GB" />
      <JurisdictionBadge country="GB" />
      <RegistryBadge registry="GLEIF" live={false} />
      <RegistryBadge registry="UK Companies House" live={false} />
      <CompanyStoryCard
        heading="WHAT THE COMPANY IS"
        body="Public LEI identity may be retrieved from GLEIF. This screen does not claim Companies House is live."
        stance="FACT"
      />
      <FinancialFactCard label="Financial facts" value="Not invented from LEI identity" source="SEC remains the proven filing adapter" />
      <DataQualityCard text="Quality is explainable by coverage and provenance. Not a universal trust number." />
      <SourceProvenancePanel source="gleif_lei · public LEI reference" state="HISTORICAL" />
    </PremiumDesk>
  );
}

export function WorkspaceCompanyTimeline() {
  return (
    <PremiumDesk title="Company Timeline" subtitle="Sourced events only. No invented milestones.">
      <FilingTimeline
        items={[
          'GLEIF registration event requires LEI + retrievedAt + jurisdiction.',
          'SEC filings remain facts when the SEC adapter is proven.',
          'UK Companies House filing history is NOT_CONFIGURED.',
        ]}
      />
    </PremiumDesk>
  );
}

export function WorkspaceOriginals() {
  return (
    <PremiumDesk title="XIV Stories" subtitle="Living case studies. Video infrastructure is not live.">
      <XivListRow title="THE IDEA" body="Founder claim — not independently verified." />
      <XivListRow title="THE FAILURE" body="Distinguish founder statements from public evidence." />
      <XivListRow title="THE LESSON" body="Documentary production is a contract, not a renderer." />
      <XivStatusPill label="Video NOT_CONFIGURED" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceDaily() {
  return (
    <PremiumDesk title="XIV Daily" subtitle="AI drafts require human review. No fabricated breaking news.">
      {DAILY_CHANNELS.map((channel) => (
        <XivListRow key={channel} title={channel} body="HUMAN_REVIEW_REQUIRED before PUBLISHED." />
      ))}
    </PremiumDesk>
  );
}

export function WorkspaceIdeaRoom() {
  return (
    <PremiumDesk title="Idea Room" subtitle="Problem → evidence → experiments. Success is never guaranteed.">
      <XivListRow title="Problem" body="Food waste in African logistics (DEMO)." />
      <XivListRow title="Idea" body="AI-powered cold-chain optimization (DEMO)." />
      <XivListRow title="Looking for" body="Engineer + logistics partner. Not a job board blast." />
      <XivStatusPill label="guaranteedSuccess = false" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspacePrivacy() {
  return (
    <PremiumDesk title="Privacy Center" subtitle="PERSONAL → TEAM → COMPANY → COMMUNITY → GLOBAL.">
      <XivText variant="body">
        Nothing automatically moves outward. Personal Brain is not Company Brain. Company Brain is not Global Brain.
      </XivText>
      <SourceRow
        name="Company Brain"
        owner="Tenant"
        classification="restricted"
        state="NOT_CONFIGURED"
        lastSync="never auto-promoted"
        note="Private tenant data cannot become Global Brain knowledge merely because XIV can access it."
      />
    </PremiumDesk>
  );
}

export function WorkspaceMoreLinks() {
  const router = useRouter();
  const { session } = useSession();
  const home = osHome(session.experience);
  const go = (path: string) => router.navigate(`${home}/${path}` as Href);
  return (
    <>
      <XivPremiumButton label="Offline Center" onPress={() => go('offline')} variant="ghost" />
      <XivPremiumButton label="Global Discover" onPress={() => go('discover')} variant="ghost" />
      <XivPremiumButton label="XIV Sheets" onPress={() => go('sheets')} variant="ghost" />
    </>
  );
}
