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
import { XivV5AnswerPanel, XivV5CommunityCard, XivV5PlaceCard } from '@/components/v5';
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

export function WorkspacePocket() {
  return (
    <PremiumDesk title="Pocket Brain" subtitle="Scoped, encrypted cache. Not a copy of Global Brain.">
      <XivStatusPill label="CLOUD_ONLY cannot be cached" tone="warning" />
      <XivListRow title="What may live here" body="Assigned tasks, approved documents, warehouse work, recent conversations." />
      <XivListRow title="Triple boundary" body="Device → Identity → Universe. A compromised phone is not a compromised company." />
    </PremiumDesk>
  );
}

export function WorkspacePocketWms() {
  return (
    <PremiumDesk title="Pocket WMS" subtitle="Receive · putaway · pick · pack · count. Scans need evidence.">
      <XivListRow title="Scan pallet" body="Barcode creates an evidence-backed event. Inventory is not invented." />
      <XivListRow title="Human confirm" body="Dock / zone / bin recommendations stay L3. L4 disabled." />
    </PremiumDesk>
  );
}

export function WorkspacePocketTms() {
  return (
    <PremiumDesk title="Pocket TMS" subtitle="Shipment visibility contracts. No fake GPS, ETA, or tracking.">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivListRow title="Carrier status" body="Requires an authorized connector. Connectivity is not identity." />
    </PremiumDesk>
  );
}

export function WorkspaceSupplierConnect() {
  return (
    <PremiumDesk title="Supplier Connect" subtitle="RFQ and conversation. Self-report is not verification.">
      <XivListRow title="Verification" body="SELF_REPORTED · DOCUMENT_VERIFIED · REGISTRY_VERIFIED · UNKNOWN" />
      <XivListRow title="Agents" body="May draft. Cannot secretly finalize binding commercial terms." />
    </PremiumDesk>
  );
}

export function WorkspaceDeviceTrust() {
  return (
    <PremiumDesk title="Device Trust" subtitle="Android enrollment. Client trust is not tenant authority.">
      <XivListRow title="UNKNOWN" body="Cannot become TRUSTED automatically." />
      <XivListRow title="REVOKED" body="Session denied. Account can remain intact." />
      <XivText variant="metadata" muted>
        XIV does not replace Android. Google Play targets modern supported devices, not every phone ever made.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspacePocketSecurity() {
  return (
    <PremiumDesk title="Mobile Security" subtitle="Keystore-backed secrets when supported. Guardian stays above agents.">
      <XivStatusPill label="Secrets never written to client config" tone="warning" />
      <XivListRow title="Enclave layer" body="Uses Android security. Does not claim to replace hardware TEE." />
      <XivListRow title="Audit" body="Location, offline queue, and agent permissions stay distinguishable: LIVE / NOT_CONFIGURED / UNKNOWN." />
    </PremiumDesk>
  );
}

export function WorkspaceCommunities() {
  return (
    <PremiumDesk title="Communities" subtitle="Subjects, not follower contests. Membership is not tenant access.">
      <XivStatusPill label="Follower ranking: off" tone="warning" />
      <XivV5CommunityCard title="Supply Chain" body="INDUSTRY. Community posts are not verified facts." />
      <XivV5CommunityCard title="Dallas Business" body="LOCAL. GPS discovery still requires permission." />
    </PremiumDesk>
  );
}

export function WorkspaceGroups() {
  return (
    <PremiumDesk title="Groups" subtitle="Community Mode by default. Follow Mode is optional and private.">
      <XivListRow title="followMode" body="DISABLED by default. ENABLED never changes evidence quality." />
      <XivListRow title="showFollowerCount" body="false. No fame score. No popularity-based authority." />
    </PremiumDesk>
  );
}

export function WorkspacePlaces() {
  return (
    <PremiumDesk title="XIV Places" subtitle="Local business intelligence. No hidden tracking.">
      <XivV5PlaceCard title="Nearby suppliers" body="Requires OS permission, XIV purpose, tenant, and agent scope." />
      <XivText variant="metadata" muted>
        Private precise location is not exposed to community discovery.
      </XivText>
    </PremiumDesk>
  );
}

export function WorkspaceAnswers() {
  return (
    <PremiumDesk title="XIV Answers" subtitle="Evidence-backed business answers. Not a generic web chatbot.">
      <XivV5AnswerPanel question="Why are transportation costs changing?" />
      <XivListRow title="Company vs public" body="Streams stay separate. Numbers appear only from connected evidence." />
    </PremiumDesk>
  );
}

export function WorkspaceReviews() {
  return (
    <PremiumDesk title="Reviews" subtitle="USER_REVIEW · VERIFIED_TRANSACTION · COMPANY_RESPONSE · XIV_RESEARCH">
      <XivListRow title="AI summary" body="Cannot invent sentiment from empty or unlabeled reviews." />
      <XivStatusIndicator state="NOT_CONFIGURED" />
    </PremiumDesk>
  );
}

export function WorkspaceLiveRooms() {
  return (
    <PremiumDesk title="Live Rooms" subtitle="XIV Live V2 contracts. Video and transcription are not live.">
      <XivStatusPill label="Transcription: NOT_CONFIGURED" tone="warning" />
      <XivListRow title="Companion agents" body="Notes and evidence stay drafts. AI summaries are not automatic facts." />
    </PremiumDesk>
  );
}

export function WorkspaceDataAgents() {
  return (
    <PremiumDesk title="Data Agent Department" subtitle="Gateway required. No raw database secrets.">
      <XivListRow title="Schema Agent" body="Cannot run destructive production migrations." />
      <XivListRow title="Access path" body="Agent → Guardian → Data Access Gateway → tenant → classification." />
      <XivStatusPill label="L4 disabled" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceSupplyGraph() {
  return (
    <PremiumDesk title="Supply Chain Nervous System" subtitle="Evidence-backed events. Knowledge Vaults, not black holes.">
      <XivListRow title="SOURCE → FACTORY → PORT → LAST MILE → RETURN" body="Every hop needs source, retrievedAt, and reference." />
      <XivStatusPill label="No global product tracking claimed" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceWarehouseTwin() {
  return (
    <PremiumDesk title="Warehouse Twin" subtitle="OBSERVED · CALCULATED · INFERRED · FORECAST · RECOMMENDED">
      <XivListRow title="Recommendation" body="Not a fact. No fake telemetry." />
      <XivListRow title="Phone as sensor" body="A pallet scan may enter Company Brain. Unrelated movement does not." />
    </PremiumDesk>
  );
}

export function WorkspaceEarth() {
  return (
    <PremiumDesk title="Earth Intelligence" subtitle="Open-science adapters. No NASA partnership claim.">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivListRow title="Observation != forecast" body="Earth Twin scenarios stay simulations." />
      <XivListRow title="Connectivity" body="Starlink / AT&T / Verizon are transport, not location authority." />
    </PremiumDesk>
  );
}

export function WorkspacePipelines() {
  return (
    <PremiumDesk title="Pipeline Foundry" subtitle="Propose → sandbox → review → human approval. No autonomous ingest.">
      <XivListRow title="Hot → Warm → Cold → Archive → Source reference" body="Storage is elastic and tiered. Not infinite." />
      <XivListRow title="Connector Foundry" body="Cannot mint production credentials." />
    </PremiumDesk>
  );
}

export function WorkspaceDefenseMesh() {
  return (
    <PremiumDesk title="Autonomous Defense Mesh" subtitle="AI-vs-AI monitoring. Guardian stays above the mesh.">
      <XivListRow title="States" body="NORMAL → SUSPICIOUS → RESTRICTED → HUMAN_REVIEW" />
      <XivListRow title="Quarantine" body="High-impact restriction needs human review. No destructive retaliation." />
    </PremiumDesk>
  );
}

export function WorkspaceLocationFabric() {
  return (
    <PremiumDesk title="Location Intelligence Fabric" subtitle="Device GPS · Places · Carrier telematics. Guardian last.">
      <XivListRow title="Permission stack" body="OS + XIV + purpose + tenant + Universe + agent + precision + retention + audit." />
      <XivStatusPill label="No global real-time GPS claimed" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceUniverses() {
  return (
    <PremiumDesk title="Data Universes" subtitle="Knowledge Vaults. Not black holes. Tenant isolation stays intact.">
      <XivListRow title="Tiers" body="HOT → WARM → COLD → ARCHIVE → SOURCE REFERENCE. Not infinite storage." />
      <XivListRow title="Private company Universe" body="Cannot become public automatically." />
    </PremiumDesk>
  );
}

export function WorkspaceTransport() {
  return (
    <PremiumDesk title="Transportation Intelligence" subtitle="Parcel · Freight · Cargo. Evidence required. No fabricated tracking.">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivListRow title="Telematics" body="Carrier connectivity is not location authority." />
    </PremiumDesk>
  );
}

export function WorkspacePorts() {
  return (
    <PremiumDesk title="Port and Trade Intelligence" subtitle="Ports, customs, and trade compliance remain unproven adapters.">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivListRow title="Every carrier connected" body="Not claimed." />
    </PremiumDesk>
  );
}

export function WorkspaceGeospatial() {
  return (
    <PremiumDesk title="Geospatial and Earth Agents" subtitle="Observation is not forecast. Scenario is not fact.">
      <XivListRow title="NASA-compatible" body="Open-science adapter architecture. No NASA partnership." />
      <XivStatusPill label="L4 disabled" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceLegacy() {
  return (
    <PremiumDesk title="Legacy Intelligence" subtitle="Evidence-grounded historical AI personas. Not the actual person.">
      <XivListRow
        title="Simulation label"
        body="AI historical simulation based on available evidence. This is not the actual person and may not represent views they would hold today."
      />
      <XivListRow title="Obituary" body="May support identity. Not enough to reconstruct a complete Legacy Brain." />
    </PremiumDesk>
  );
}

export function WorkspaceCouncil() {
  return (
    <PremiumDesk title="Council of Minds" subtitle="Historical simulations and XIV agents stay distinguishable.">
      <XivListRow title="Agreement · Disagreement · Unknown" body="Disagreement stays visible. Majority cannot create verified fact." />
    </PremiumDesk>
  );
}

export function WorkspaceAssembly() {
  return (
    <PremiumDesk title="Agent Assembly" subtitle="Virtual meeting primitive. Participation does not grant permissions.">
      <XivListRow title="Pocket Team" body="Bounded offline agents. Local report → signed queue → Guardian → Company Brain." />
    </PremiumDesk>
  );
}

export function WorkspaceAlgorithmFoundry() {
  return (
    <PremiumDesk title="Algorithm Foundry" subtitle="Sandbox → benchmark → measured bias → human approval → canary.">
      <XivListRow title="Zero bias" body="Not claimed. Bias and uncertainty are measured and documented." />
      <XivStatusPill label="No production self-rewrite" tone="warning" />
    </PremiumDesk>
  );
}

export function WorkspaceBrains() {
  return (
    <PremiumDesk title="Global Brain Network" subtitle="Logical knowledge domains. Not nested physical databases.">
      <XivListRow title="Permissioned mesh" body="Public, licensed, and tenant-authorized systems only. No interception or secret listening." />
    </PremiumDesk>
  );
}

export function WorkspacePhilosophy() {
  return (
    <PremiumDesk title="Human Thought & Philosophy" subtitle="Ethics, leadership, meaning, epistemology. Description is not endorsement.">
      <XivListRow title="Religion" body="Historical documents may appear as sources. XIV does not promote a religion." />
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
