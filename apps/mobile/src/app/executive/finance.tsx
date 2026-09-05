import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { businessRevenue, executiveFinance } from '@/data/mock';

export default function ExecutiveFinance() {
  return (
    <ExperienceScreen title="Finance" subtitle="Board-facing snapshot. Synthetic.">
      <PrototypeNotice text="Figures are invented for the walkthrough. No ledger is connected." />
      <SectionHeader kicker="Snapshot" title="Revenue" />
      <ModuleCard
        tag="Trailing"
        title={businessRevenue.trailing}
        body={businessRevenue.detail}
        meta={businessRevenue.change}
      />
      <SectionHeader kicker="Chair" title="Finance notes" />
      {executiveFinance.map((item) => (
        <ModuleCard key={item.id} tag="Finance" title={item.title} body={item.detail} />
      ))}
    </ExperienceScreen>
  );
}
