import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { SectionHeader } from '@/components/xiv/section-header';

export default function Performance() {
  return (
    <ExperienceScreen title="Pulse" subtitle="Revenue, operations, and customers.">
      <SectionHeader kicker="Performance" title="Where the company is moving" />
      <ModuleCard tag="Revenue" title="$48.2M trailing" body="Recognized vs pipeline. Figures are invented for the investor walkthrough." />
      <ModuleCard tag="Operations" title="14 exceptions open" body="Two warehouses off SLA. Recovery plan is a static mock." />
      <ModuleCard tag="Customers" title="Health 4.6 / 5" body="Expansion sits in three named accounts. Names are fictional." />
    </ExperienceScreen>
  );
}
