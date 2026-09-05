import { useState } from 'react';

import { Button } from '@/components/xiv/button';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { employeeWellness } from '@/data/mock';

const tones = ['Steady', 'Stretched', 'Recovering'] as const;

export default function Wellness() {
  const [checkIn, setCheckIn] = useState<(typeof tones)[number] | null>(null);

  return (
    <ExperienceScreen title="Private wellness" subtitle="Held apart from the company floor.">
      <PrototypeNotice text="Wellness check-ins are visual only. Nothing is monitored, stored, or shared with the company." />
      <SectionHeader kicker="Private" title="Check-in" />
      <ModuleCard
        tag={checkIn ?? 'Not sent'}
        title="How is the shift landing?"
        body="Choose a private tone. This does not attach to your account or employer."
      />
      {tones.map((tone) => (
        <Button key={tone} label={tone} variant="subtle" onPress={() => setCheckIn(tone)} />
      ))}
      <SectionHeader kicker="Held" title="Stay intact" />
      {employeeWellness.map((item) => (
        <ModuleCard key={item.id} title={item.title} body={item.detail} />
      ))}
    </ExperienceScreen>
  );
}
