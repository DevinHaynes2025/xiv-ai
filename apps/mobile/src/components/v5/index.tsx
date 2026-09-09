import { XivEmptyState, XivSectionHeader, XivStatusPill } from '@/components/premium';
import { XivListRow } from '@/components/v4';
import { XivText } from '@/components/xiv/text';

export const XIV_V5_COPY = {
  system: 'XIV Premium V5',
  principle: 'Calm, premium, business-first. No vanity ranking.',
} as const;

export function XivV5CommunityCard({ title, body }: { title: string; body: string }) {
  return <XivListRow title={title} body={body} />;
}

export function XivV5PlaceCard({ title, body }: { title: string; body: string }) {
  return <XivListRow title={title} body={body} />;
}

export function XivV5AnswerPanel({ question }: { question: string }) {
  return (
    <>
      <XivSectionHeader kicker="XIV Answers" title={question} />
      <XivStatusPill label="Numeric claims require connected company data" tone="warning" />
      <XivText variant="metadata" muted>
        Private company sources and public sources stay distinguishable. Invented percentages are denied.
      </XivText>
    </>
  );
}

export function XivV5Empty({ title, body }: { title: string; body: string }) {
  return <XivEmptyState title={title} body={body} />;
}
