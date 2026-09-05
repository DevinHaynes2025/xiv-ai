import { Card } from '@/components/xiv/card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { SystemStatus, type SystemStatusKind } from '@/components/xiv/system-status';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useAgent } from '@/hooks/useAgent';

type Props = {
  title: string;
  subtitle: string;
  notice: string;
  items: { id: string; title: string; body: string }[];
};

function LightDesk({ title, subtitle, notice, items }: Props) {
  return (
    <ExperienceScreen title={title} subtitle={subtitle}>
      <PrototypeNotice text={notice} />
      <SectionHeader kicker="Preview" title={title} />
      {items.map((item) => (
        <ModuleCard key={item.id} tag="COMING SOON" title={item.title} body={item.body} />
      ))}
    </ExperienceScreen>
  );
}

export function MarketingDesk() {
  return (
    <LightDesk
      title="Marketing"
      subtitle="Demand quality, not vanity volume."
      notice="Campaigns are not published. No audience is contacted from this screen."
      items={[
        { id: 'm1', title: 'Demand quality', body: 'Inquiry quality would score here. SAMPLE DATA only.' },
        { id: 'm2', title: 'Campaign drafts', body: 'XIV Marketing Agent is COMING SOON. Nothing is sent.' },
      ]}
    />
  );
}

export function ProjectsDesk() {
  return (
    <LightDesk
      title="Projects"
      subtitle="Decisions in motion."
      notice="No project table is written. This is a digital-foundation placeholder."
      items={[
        { id: 'p1', title: 'Dallas recovery window', body: 'Tied to the DEMO fulfillment story. Not a live project.' },
        { id: 'p2', title: 'Close-calendar rehearsal', body: 'Governed agent work stays on the live Business or Executive agent.' },
      ]}
    />
  );
}

export function FinanceDesk() {
  return (
    <LightDesk
      title="Finance"
      subtitle="Chair snapshot. Synthetic."
      notice="Figures are invented for the walkthrough. No ledger is connected. No trade is executed."
      items={[
        { id: 'f1', title: 'Trailing revenue', body: '$48.2M recognized · SAMPLE DATA.' },
        { id: 'f2', title: 'At-risk fulfillment', body: '287 DEMO orders sit under the Dallas story. Not a live accrual.' },
      ]}
    />
  );
}

type SecurityRow = {
  id: string;
  title: string;
  body: string;
  status: SystemStatusKind;
};

export function SecurityDesk() {
  const { session, authSession } = useSession();
  const { liveWired, activityError } = useAgent();

  const rows: SecurityRow[] = [
    {
      id: 's1',
      title: 'Signed-in session',
      body: authSession?.user
        ? 'Authenticated session is present. No service-role key is in the mobile app.'
        : 'No session. Sign in to use owner-scoped surfaces.',
      status: authSession?.user ? 'ACTIVE' : 'NEEDS ATTENTION',
    },
    {
      id: 's2',
      title: 'Gemini Business / Executive agent',
      body: liveWired
        ? 'The existing Gemini workspace is the only live agent route.'
        : 'This role does not call Gemini. Specialized agents stay COMING SOON.',
      status: liveWired ? 'ACTIVE' : 'COMING SOON',
    },
    {
      id: 's3',
      title: 'Profile identity columns',
      body: session.identitySchemaReady
        ? 'Optional identity fields loaded from profiles after the identity migration.'
        : 'Core hydrate still uses id, full_name, email, country. Run 20260904200000_profile_identity_and_avatars.sql.',
      status: session.identitySchemaReady ? 'CONFIGURED' : 'NEEDS ATTENTION',
    },
    {
      id: 's4',
      title: 'Agent governance tables',
      body:
        activityError?.kind === 'missing_schema'
          ? `${activityError.code}: ${activityError.message}. ${activityError.hint}`
          : activityError
            ? `${activityError.code}: ${activityError.message}`
            : 'Activity query reached public.ai_agent_actions with owner RLS. No sample rows were invented.',
      status:
        activityError?.kind === 'missing_schema'
          ? 'NEEDS ATTENTION'
          : activityError
            ? 'NEEDS ATTENTION'
            : 'CONFIGURED',
    },
    {
      id: 's5',
      title: 'Vendor token rotation',
      body: 'Flagged in the DEMO briefing only. No vendor token is rotated here.',
      status: 'COMING SOON',
    },
    {
      id: 's6',
      title: 'Builder Agent',
      body: 'Not implemented. It cannot modify itself or deploy software.',
      status: 'COMING SOON',
    },
  ];

  return (
    <ExperienceScreen title="Security" subtitle="Honest posture. No false claims." atmosphere="cinematic">
      <PrototypeNotice text="Statuses reflect this session and client queries only. Hosted SQL still has to be applied by the founder. Tenant isolation is unchanged." />
      <SectionHeader kicker="Control" title="Security center" />
      {rows.map((item) => (
        <Card key={item.id} style={{ gap: Spacing.two }}>
          <SystemStatus status={item.status} />
          <XivText variant="subtitle">{item.title}</XivText>
          <XivText variant="body" muted>
            {item.body}
          </XivText>
        </Card>
      ))}
      <XivText variant="caption" color={Palette.textDim}>
        ACTIVE means a live path in this build. CONFIGURED means the client reached the expected table or column set.
        NEEDS ATTENTION means a real error or missing migration. COMING SOON is not built.
      </XivText>
    </ExperienceScreen>
  );
}
