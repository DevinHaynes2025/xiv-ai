import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { SpecializedAgentCard } from '@/components/xiv/specialized-agent-card';
import { specializedAgents } from '@/data/agents-catalog';
import { peopleCoverage } from '@/data/operating-system';

export function PeopleDesk() {
  const peopleAgent = specializedAgents.find((item) => item.id === 'people');

  return (
    <ExperienceScreen title="People" subtitle="Coverage and climate. Never surveillance.">
      <PrototypeNotice text="People cards never show legal names. Counts are DEMO. XIV does not monitor individuals." />
      <SectionHeader kicker="Coverage" title="What the chair can see" />
      {peopleCoverage.map((item) => (
        <ModuleCard key={item.id} tag="DEMO" title={item.title} body={item.body} />
      ))}
      {peopleAgent ? (
        <SpecializedAgentCard
          agent={peopleAgent}
          status="coming_soon"
          activity="COMING SOON — no people model is called"
        />
      ) : null}
    </ExperienceScreen>
  );
}
