import { SponsoredCard, XivEmptyState, XivGlassPanel, XivSectionHeader, XivStatusPill } from '@/components/premium';
import { CompanyProfileCard, ProfessionalProfileCard } from '@/components/v4';
import { XivText } from '@/components/xiv/text';
import { premiumAd } from '@/data/premium-demo';
import { COMPANY_PROFILE, PROFESSIONAL_PROFILE } from '@/data/premium-experience';

import { PremiumDesk } from './desk';

export function PremiumMarketplace() {
  return (
    <PremiumDesk title="Marketplace" subtitle="Apps, agents, packs, connectors. No executable JS downloads.">
      <XivSectionHeader kicker="Featured" title="Governed modules" />
      <XivGlassPanel>
        <XivText variant="subtitle">Industry packs</XivText>
        <XivText variant="body" muted>
          CRM, WMS, insurance, and real estate remain behind existing module policy. Wildcard permissions stay denied.
        </XivText>
      </XivGlassPanel>
    </PremiumDesk>
  );
}

export function PremiumPromote() {
  return (
    <PremiumDesk title="XIV Promote" subtitle="Opt-in paid exposure. Always disclosed.">
      <XivStatusPill label="Promoted" tone="sponsored" />
      <SponsoredCard {...premiumAd} />
      <XivEmptyState title="Payments not configured" body="Budgets are designed. Card processing is not connected." />
    </PremiumDesk>
  );
}

export function PremiumAds() {
  return (
    <PremiumDesk title="Business Ads" subtitle="B2B placements. Never hidden as organic.">
      <SponsoredCard disclosure="Advertisement" headline="Commercial insurance" body="Advertisement. Distinct from intelligence cards." />
      <SponsoredCard {...premiumAd} />
    </PremiumDesk>
  );
}

export function PremiumCompanyProfile() {
  return (
    <PremiumDesk title="Company Profile" subtitle="Public company surface. Private tenant data stays private.">
      <CompanyProfileCard
        legalName={COMPANY_PROFILE.legalName}
        industry={COMPANY_PROFILE.industry}
        note={COMPANY_PROFILE.note}
        state={COMPANY_PROFILE.surface}
      />
    </PremiumDesk>
  );
}

export function PremiumProfessionalProfile() {
  return (
    <PremiumDesk title="Professional Profile" subtitle="Expertise, problems, contributions — not followers.">
      <ProfessionalProfileCard {...PROFESSIONAL_PROFILE} />
    </PremiumDesk>
  );
}
