import { useState } from 'react';

import { Button } from '@/components/xiv/button';
import { Field } from '@/components/xiv/field';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { employeeIdeas } from '@/data/mock';

export default function Ideas() {
  const [draft, setDraft] = useState('');
  const [submitted, setSubmitted] = useState<string[]>([]);

  return (
    <ExperienceScreen title="Ideas" subtitle="Improve the company without standing on a stage.">
      <PrototypeNotice text="Idea heat is mock. Submissions stay on this device until organization membership exists." />
      <SectionHeader kicker="Submit" title="Anonymous proposal" />
      <Field
        label="Idea"
        placeholder="A change that would help the floor"
        value={draft}
        onChangeText={setDraft}
      />
      <Button
        label="Submit idea"
        variant="subtle"
        disabled={!draft.trim()}
        onPress={() => {
          setSubmitted((current) => [draft.trim(), ...current]);
          setDraft('');
        }}
      />
      {submitted.map((idea) => (
        <ModuleCard key={idea} tag="Local" title={idea} body="Prototype submission. Not written to the database." />
      ))}
      <SectionHeader kicker="Open" title="Anonymous proposals" />
      {employeeIdeas.map((item) => (
        <ModuleCard key={item.id} tag={item.heat} title={item.title} body="Heat is a mock ranking, not live voting." />
      ))}
    </ExperienceScreen>
  );
}
