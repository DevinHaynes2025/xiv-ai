import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { employeeGrowth } from '@/data/mock';

export default function Learn() {
  return (
    <ExperienceScreen title="Learn" subtitle="Paths that do not broadcast your name.">
      <PrototypeNotice text="Learning cards are synthetic. Enrollment and HR systems are not connected." />
      <SectionHeader kicker="Development" title="Move without broadcasting" />
      {employeeGrowth.map((item) => (
        <ModuleCard
          key={item.id}
          tag={item.kind}
          title={item.title}
          body="Enrollment and HR systems are not connected in this prototype."
        />
      ))}
    </ExperienceScreen>
  );
}
