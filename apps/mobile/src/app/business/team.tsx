import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { businessTeam } from '@/data/mock';

export default function BusinessTeam() {
  return (
    <ExperienceScreen title="Team" subtitle="Coverage without exposing employee identity.">
      <PrototypeNotice text="Team counts are synthetic. Individual identities are never shown." />
      <SectionHeader kicker="Organization" title="Overview" />
      {businessTeam.map((item) => (
        <ModuleCard key={item.id} tag="Team" title={item.title} body={item.detail} />
      ))}
    </ExperienceScreen>
  );
}
