export type MetricName =
  | 'requests'
  | 'errors'
  | 'latency'
  | 'queues'
  | 'agent_failures'
  | 'policy_denies'
  | 'security_events'
  | 'business_data_freshness'
  | 'stream_health';

export type MetricPoint = {
  name: MetricName;
  value: number | 'not_measured';
  tenant: string | null;
  universe: string | null;
};

export function unmeasuredMetrics(): readonly MetricPoint[] {
  const names: readonly MetricName[] = [
    'requests',
    'errors',
    'latency',
    'queues',
    'agent_failures',
    'policy_denies',
    'security_events',
    'business_data_freshness',
    'stream_health',
  ];
  return names.map((name) => ({ name, value: 'not_measured' as const, tenant: null, universe: null }));
}
