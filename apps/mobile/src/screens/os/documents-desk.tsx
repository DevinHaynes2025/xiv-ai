import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { informationDesks } from '@/data/operating-system';

export function DocumentsDesk() {
  return (
    <ExperienceScreen title="Documents" subtitle="Digital foundation. Permission-aware.">
      <PrototypeNotice text="Information management is a prototype. No private documents, messages, or contracts are loaded. Access would follow your role — XIV does not secretly read your files." />
      <SectionHeader kicker="Digital" title="Knowledge layer" />
      {informationDesks.map((item) => (
        <ModuleCard key={item.id} tag="COMING SOON" title={item.title} body={item.body} />
      ))}
    </ExperienceScreen>
  );
}
