import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { SectionHeader } from '@/components/xiv/section-header';
import { employeeGrowth } from '@/data/mock';

export default function Growth() {
  return (
    <ExperienceScreen title="Growth" subtitle="Learning, projects, and career paths.">
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
