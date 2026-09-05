import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { SectionHeader } from '@/components/xiv/section-header';
import { businessBriefing } from '@/data/mock';

export default function Briefing() {
  return (
    <ExperienceScreen title="Executive briefing" subtitle="Prepared overnight. Not a live model run.">
      <SectionHeader kicker="XIV Brief" title="What needs the chair" />
      {businessBriefing.map((line, index) => (
        <ModuleCard key={line} tag={`0${index + 1}`} title="Briefing note" body={line} />
      ))}
    </ExperienceScreen>
  );
}
