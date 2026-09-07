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
    <PremiumDesk title="XIV Daily Global" subtitle="AI_GENERATED_DRAFT requires human review. No fabricated breaking news.">
      {DAILY_CHANNELS.map((channel) => (
        <XivListRow key={channel} title={channel} body="HUMAN_REVIEW_REQUIRED before PUBLISHED." />
      ))}
    </PremiumDesk>
  );
}

export function WorkspaceStartups() {
  return (
    <PremiumDesk title="Startup Discover" subtitle="Funding and valuation claims require evidence. No fake rounds.">
      <XivStatusPill label="Stage UNKNOWN until evidenced" tone="warning" />
      <XivListRow title="DEMO founder pitch" body="FOUNDER_CLAIM. Not independently verified." />
      <XivText variant="metadata" muted>
        Capital availability, investor names, and valuations stay NOT_CONFIGURED unless a proven source is attached.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceResearchRoom() {
  return (
    <PremiumDesk title="Research Room" subtitle="Agent disagreement stays visible. No silent majority vote.">
      <XivStatusPill label="Contradiction Agent" />
      <XivListRow title="Filings Agent" body="FACT when SEC provenance exists." />
      <XivListRow title="Story Agent" body="INFERENCE cannot become FACT automatically." />
      <ContradictionPanel text="Disagreement is preserved. Consensus is not automatic fact promotion." />
    </PremiumDesk>
  );
}

export function WorkspaceCompanyComparison() {
  return (
    <PremiumDesk title="Company Comparison" subtitle="No silent currency, period, or unit conversion.">
      <XivListRow title="UNILEVER PLC" body="GB · GLEIF identity may be LIVE · filings NOT_CONFIGURED" />
      <XivListRow title="Apple Inc." body="US · SEC filings may be LIVE · not a market-price row" />
      <EvidenceCellIndicator source="Comparison cells keep provider + retrievedAt" state="HISTORICAL" />
    </PremiumDesk>
  );
}

export function WorkspaceDocumentary() {
  return (
    <PremiumDesk title="Documentary Research" subtitle="Research packet only. Video and transcription are not live.">
      <XivStatusPill label="Video NOT_CONFIGURED" tone="warning" />
      <XivListRow title="FOUNDER_CLAIM" body="Preserved separately from FACT." />
      <XivListRow title="Research gap" body="Interview questions stay unanswered until evidenced." />
    </PremiumDesk>
  );
}

export function WorkspaceCompanyProfile() {
  return (
    <PremiumDesk title="Company Profile" subtitle="Official, public-source, XIV research, and community stay separate.">
      <XivListRow title="OFFICIAL_COMPANY_CONTENT" body="Claimed only after verification." />
      <XivListRow title="PUBLIC_SOURCE_CONTENT" body="GLEIF / SEC / World Bank when proven." />
      <XivListRow title="XIV_RESEARCH" body="Labeled research. Not a live ticker." />
      <XivListRow title="COMMUNITY_CONTENT" body="Never mixed silently into official facts." />
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

export function WorkspaceDevices() {
  return (
    <PremiumDesk title="Devices" subtitle="XIV Device Fabric. Client device state is not tenant authority.">
      <XivStatusPill label="Native desktop packaging: NOT_IMPLEMENTED" tone="warning" />
      <XivListRow title="PHONE · iOS / Android" body="TRUSTED is a device posture, not organization membership." />
      <XivListRow title="TABLET" body="Operational workspace contract. Not a stretched phone." />
      <XivListRow title="DESKTOP / WEB" body="Adaptive layouts only. No production installer claim." />
      <XivText variant="metadata" muted>
        GPS, camera, and endpoint protection stay UNKNOWN or NOT_CONFIGURED until a real device path is proven.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceDeviceDetail() {
  return (
    <PremiumDesk title="Device Detail" subtitle="Independent trust. A revoked device cannot authorize a session.">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivListRow title="deviceTrustState" body="UNKNOWN until enrollment is proven on a real client." />
      <XivListRow title="Revocation" body="Compromised device can be revoked without disabling the account." />
    </PremiumDesk>
  );
}

export function WorkspaceLocation() {
  return (
    <PremiumDesk title="Location" subtitle="Permissioned GPS. No hidden tracking. Not live.">
      <XivStatusPill label="GPS path: not live" tone="warning" />
      <XivListRow title="Deny by default" body="User permission, purpose, tenant policy, and agent scope are all required." />
      <XivListRow title="Approximate vs precise" body="Approximate grants do not expose precise coordinates." />
      <XivText variant="metadata" muted>
        A device LOCATION capability does not grant every agent location access. No employee surveillance architecture.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceSecurityAgents() {
  return (
    <PremiumDesk title="Security Agents" subtitle="Cyber Defense Department. No agent is sovereign.">
      <XivListRow title="Security Director" body="Coordinates. Cannot override Guardian or self-promote." />
      <XivListRow title="SOC / Threat / Identity / Device" body="Research and alert contracts. Telemetry NOT_CONFIGURED." />
      <XivListRow title="Agent Security" body="Watches other AI. Text cannot redefine permissions." />
    </PremiumDesk>
  );
}

export function WorkspaceSecurityIncidents() {
  return (
    <PremiumDesk title="Incidents" subtitle="High-impact containment stays human-approved.">
      <XivStatusPill label="No fabricated telemetry" tone="warning" />
      <XivListRow title="Stages" body="DETECTED → TRIAGE → INVESTIGATION → CONTAINMENT → ERADICATION → RECOVERY → POST_INCIDENT" />
      <XivListRow title="L4" body="Bounded autonomy remains disabled." />
    </PremiumDesk>
  );
}

export function WorkspaceIdentitySecurity() {
  return (
    <PremiumDesk title="Identity Security" subtitle="Unusual login and session research. No production detection claim.">
      <XivListRow title="Signals" body="New device, failed MFA, role escalation, stale privileges — contracts only." />
      <XivListRow title="Authority" body="Client-reported device or location is not tenant membership." />
    </PremiumDesk>
  );
}

export function WorkspaceAccessSecurity() {
  return (
    <PremiumDesk title="Access Governance" subtitle="Excessive permissions stay reviewable. Changes need approval.">
      <XivListRow title="Checks" body="Stale memberships, admin concentration, cross-Universe requests." />
      <XivListRow title="No self-grant" body="Agents cannot add their own tools or raise authority." />
    </PremiumDesk>
  );
}

export function WorkspaceAgentSecurity() {
  return (
    <PremiumDesk title="Agent Security" subtitle="AI that watches other AI. Guardian stays above every agent.">
      <XivListRow title="Watches" body="Scope violations, prompt injection, classification leaks, approval bypass." />
      <XivListRow title="Rule" body="An agent cannot say it is the CFO and receive finance access." />
    </PremiumDesk>
  );
}

export function WorkspaceAudit() {
  return (
    <PremiumDesk title="Audit" subtitle="Device, session, location, and agent decisions. Secrets are redacted.">
      <XivListRow title="Location" body="Grants and denials are audited. Precise GPS is not logged by default." />
      <XivListRow title="Secrets Guardian" body="API keys, tokens, and service_role patterns are redacted." />
    </PremiumDesk>
  );
}

export function WorkspaceCrossDevice() {
  return (
    <PremiumDesk title="Cross-Device" subtitle="One XIV identity. Independent device trust. MFA cannot be bypassed.">
      <XivListRow title="PHONE_COMPACT" body="Alerts, approvals, AI, scan." />
      <XivListRow title="TABLET_EXPANDED" body="Operations, Sheets, field dashboards." />
      <XivListRow title="DESKTOP_WORKSPACE / WEB_RESPONSIVE" body="Multi-panel research and security command. Installers NOT_IMPLEMENTED." />
    </PremiumDesk>
  );
}

export function WorkspaceKnowledge() {
  return (
    <PremiumDesk title="Global Research Mesh" subtitle="Federated discovery. Not every search engine. No scraping.">
      <XivStatusPill label="Unproven search providers: NOT_CONFIGURED" tone="warning" />
      <XivListRow title="Approved classes" body="Official APIs, publisher feeds, licensed indexes, direct public sources." />
      <XivListRow title="Wikipedia / libraries / news" body="Adapter architecture only. Status remains NOT_CONFIGURED." />
      <XivText variant="metadata" muted>
        XIV does not claim trillions of documents are indexed. Proven LIVE sources remain World Bank, SEC, and GLEIF identity.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceArticles() {
  return (
    <PremiumDesk title="Article Intelligence" subtitle="AI_GENERATED_DRAFT requires editorial review. No wholesale republication.">
      <XivListRow title="WHAT HAPPENED" body="Sourced event only." />
      <XivListRow title="WHY / WHO / IMPACT" body="Supply-chain, market, and local impact stay UNKNOWN without evidence." />
      <XivStatusPill label="PUBLISHED is never automatic" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceHistory() {
  return (
    <PremiumDesk title="Historical Business Library" subtitle="Independent archives. Provenance required. Not all libraries.">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivListRow title="Dallas County 1950–today" body="Unanswerable until a licensed or public archive adapter is proven." />
    </PremiumDesk>
  );
}

export function WorkspaceProductPassport() {
  return (
    <PremiumDesk title="Product Passport" subtitle="Origin is not invented. Evidence classes stay visible.">
      <XivListRow title="VERIFIED" body="Only with source + retrievedAt + reference." />
      <XivListRow title="SUPPLIER_REPORTED / CARRIER_REPORTED" body="Not manufacturer fact. Not silently upgraded." />
      <XivListRow title="UNKNOWN" body="Default when a factory or material is not evidenced." />
    </PremiumDesk>
  );
}

export function WorkspaceSuppliers() {
  return (
    <PremiumDesk title="Supplier Universe" subtitle="Onboarding without assuming verification. Evidence, not rankings.">
      <XivListRow title="Self-report" body="SUPPLIER_REPORTED. Not a verified capability." />
      <XivListRow title="Procurement query" body="Returns evidence packets. No fake capacity or certifications." />
    </PremiumDesk>
  );
}

export function WorkspaceParcel() {
  return (
    <PremiumDesk title="XIV Logistics" subtitle="Parcel · Freight · Cargo · Last Mile · Fulfillment · Trade">
      <XivStatusPill label="Carrier integrations: NOT_CONFIGURED" tone="warning" />
      <XivListRow title="Amazon / Uber / UPS / FedEx / Maersk" body="Potential connectors. Not built-in access." />
      <XivListRow title="Tracking" body="Events require evidence. Fabricated locations are denied." />
    </PremiumDesk>
  );
}

export function WorkspaceCommerce() {
  return (
    <PremiumDesk title="Commerce Graph" subtitle="Merchant intelligence. Customer records stay tenant-private.">
      <XivListRow title="Allowed" body="Aggregated demand, authorized sales, public prices, reviews." />
      <XivListRow title="Denied" body="Hidden individual tracking and automatic Global Brain promotion." />
    </PremiumDesk>
  );
}

export function WorkspaceAgentFoundry() {
  return (
    <PremiumDesk title="Agent Foundry" subtitle="Specify → review → sandbox → human approval. No self-deploy.">
      <XivListRow title="Lifecycle" body="PROPOSED through RETIRED. DEPLOYED requires human approval." />
      <XivListRow title="Firewall" body="New agents cannot grant themselves tools or permissions." />
      <XivStatusPill label="L4 disabled" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceBoards() {
  return (
    <PremiumDesk title="Digital AI Boards" subtitle="Contradiction keeps a seat. Disagreement stays visible.">
      <XivListRow title="Supply Chain Board" body="Synthesis is a packet, not a silent vote." />
      <XivListRow title="Financial Intelligence" body="FACT / SIGNAL / FORECAST remain separate. No BUY/SELL." />
    </PremiumDesk>
  );
}

export function WorkspaceTemporal() {
  return (
    <PremiumDesk title="Temporal Intelligence" subtitle="The further back or forward, the more explicit the uncertainty.">
      <XivStatusPill label="Not knowledge since the beginning of time" tone="warning" />
      <XivListRow title="Evidence classes" body="DIRECT_PRIMARY_SOURCE · ARCHAEOLOGICAL · LATER_ACCOUNT · DISPUTED · UNKNOWN" />
      <XivListRow title="Rule" body="Legend, reconstruction, and documented history are never treated as equivalent." />
    </PremiumDesk>
  );
}

export function WorkspaceCivilizations() {
  return (
    <PremiumDesk title="Civilization Graph" subtitle="Commerce beyond modern corporations. Provenance required.">
      <XivListRow title="Entities" body="Empire, port, guild, workshop, commodity, tax system, technology." />
      <XivListRow title="Comparison" body="Roman trade fragility vs modern concentration is a research question, not a fact." />
    </PremiumDesk>
  );
}

export function WorkspaceThinkers() {
  return (
    <PremiumDesk title="Global Thinkers" subtitle="Worldwide coverage. No ranking by race, nationality, or civilization.">
      <XivListRow title="Regions" body="Africa, Asia, Europe, Middle East, Oceania, Americas, Indigenous societies, diasporas." />
      <XivListRow title="Ideas" body="Each claim keeps a source. Machine translation is not a verified interpretation." />
    </PremiumDesk>
  );
}

export function WorkspaceForesight() {
  return (
    <PremiumDesk title="Foresight Laboratory" subtitle="Scenarios and probabilities — never certainty.">
      <XivStatusPill label="Quantum: NOT_CONFIGURED" tone="warning" />
      <XivListRow title="FACT / INFERENCE / SCENARIO / FORECAST / SPECULATION" body="Stay separate. Invented percentages are denied." />
      <XivListRow title="Simulations" body="Monte Carlo and disruption models output scenarios, not facts." />
    </PremiumDesk>
  );
}

export function WorkspaceTimeMachine() {
  return (
    <PremiumDesk title="Business Time Machine" subtitle="Analogues with similarities, differences, and evidence.">
      <XivListRow title="Historical analogue" body="Does not become a forecast fact." />
      <XivListRow title="Company overwrites" body="1890 independent and 2026 successor both remain queryable." />
    </PremiumDesk>
  );
}

export function WorkspaceAtlas() {
  return (
    <PremiumDesk title="Historical Business Atlas" subtitle="World → country → county → city → site, time-aware.">
      <XivListRow title="Dallas 1850–2026" body="Unanswerable until a proven archive is connected." />
      <XivStatusIndicator state="NOT_CONFIGURED" />
    </PremiumDesk>
  );
}

export function WorkspaceArchives() {
  return (
    <PremiumDesk title="Libraries & Archives" subtitle="Federated registry. Unconnected sources stay NOT_CONFIGURED.">
      <XivListRow title="Library of Congress" body="Adapter architecture only. No live retrieval." />
      <XivListRow title="Scale" body="Capacity objective, not a claim that trillions of documents are indexed." />
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
