export type ResidencyControl =
  | 'data_residency'
  | 'regional_storage'
  | 'retention'
  | 'consent'
  | 'cross_border_restrictions'
  | 'customer_controlled_policies';

export function globalPrivacyAssumption() {
  return {
    oneGlobalPrivacyAssumption: false,
    controls: [
      'data_residency',
      'regional_storage',
      'retention',
      'consent',
      'cross_border_restrictions',
      'customer_controlled_policies',
    ] satisfies readonly ResidencyControl[],
    status: 'planned' as const,
  };
}
