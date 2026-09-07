import { XivGlassPanel, XivStatusPill } from '@/components/premium';
import { XivStatusIndicator } from '@/components/v4';
import { XivText } from '@/components/xiv/text';
import type { DataSurfaceState } from '@/lib/surface-state';

export function CompanyHeader({ name, lei, country }: { name: string; lei?: string; country: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="title">{name}</XivText>
      <XivText variant="metadata" muted>
        {country}
        {lei ? ` · LEI ${lei}` : ''}
      </XivText>
    </XivGlassPanel>
  );
}

export function JurisdictionBadge({ country }: { country: string }) {
  return <XivStatusPill label={`Jurisdiction ${country}`} />;
}

export function RegistryBadge({ registry, live }: { registry: string; live: boolean }) {
  return <XivStatusPill label={`${registry} ${live ? 'LIVE' : 'NOT_CONFIGURED'}`} tone={live ? 'success' : 'warning'} />;
}

export function FilingTimeline({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((item) => (
        <XivText key={item} variant="body">
          {item}
        </XivText>
      ))}
    </>
  );
}

export function FinancialFactCard({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label">{label}</XivText>
      <XivText variant="body">{value}</XivText>
      <XivText variant="micro" dim>
        {source}
      </XivText>
    </XivGlassPanel>
  );
}

export function CompanyStoryCard({ heading, body, stance }: { heading: string; body: string; stance: string }) {
  return (
    <XivGlassPanel>
      <XivStatusPill label={stance} />
      <XivText variant="label">{heading}</XivText>
      <XivText variant="body">{body}</XivText>
    </XivGlassPanel>
  );
}

export function ContradictionPanel({ text }: { text: string }) {
  return (
    <XivGlassPanel>
      <XivStatusPill label="Contradiction" tone="warning" />
      <XivText variant="body">{text}</XivText>
    </XivGlassPanel>
  );
}

export function MacroContextCard({ text }: { text: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label">Macro context</XivText>
      <XivText variant="body">{text}</XivText>
    </XivGlassPanel>
  );
}

export function WatchStateBadge({ label }: { label: string }) {
  return <XivStatusPill label={label} tone="warning" />;
}

export function SourceProvenancePanel({ source, state }: { source: string; state: DataSurfaceState }) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state={state} />
      <XivText variant="metadata" muted>
        {source}
      </XivText>
    </XivGlassPanel>
  );
}

export function DataQualityCard({ text }: { text: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label">Data quality</XivText>
      <XivText variant="body">{text}</XivText>
    </XivGlassPanel>
  );
}
