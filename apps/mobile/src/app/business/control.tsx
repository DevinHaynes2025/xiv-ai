import { useRouter } from 'expo-router';

import { Button } from '@/components/xiv/button';
import { AssistantDock, ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { useSession } from '@/context/session';
import { assistantPrompts, businessModules } from '@/data/mock';

export default function Control() {
  const router = useRouter();
  const { clearExperience } = useSession();

  return (
    <ExperienceScreen title="Control" subtitle="Agents, systems, and the security center.">
      <PrototypeNotice text="Security center, agents, and connectors are visual. No systems are linked." />
      <SectionHeader kicker="Command" title="Connected layer" />
      {businessModules
        .filter((item) => ['systems', 'agents', 'security'].includes(item.id))
        .map((item) => (
          <ModuleCard key={item.id} title={item.title} body={item.detail} />
        ))}
      <AssistantDock prompts={assistantPrompts.business} />
      <Button
        label="Switch experience"
        variant="subtle"
        onPress={() => {
          clearExperience();
          router.replace('/experience');
        }}
      />
    </ExperienceScreen>
  );
}
