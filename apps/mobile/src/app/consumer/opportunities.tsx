import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { SectionHeader } from '@/components/xiv/section-header';
import { consumerOpportunities } from '@/data/mock';

export default function Opportunities() {
  return (
    <ExperienceScreen title="Opportunities" subtitle="Surveys, paid work, and ventures.">
      <SectionHeader kicker="Open lanes" title="What you can enter" />
      {consumerOpportunities.map((item) => (
        <ModuleCard key={item.id} tag={item.kind} title={item.title} body={item.pay} />
      ))}
    </ExperienceScreen>
  );
}
