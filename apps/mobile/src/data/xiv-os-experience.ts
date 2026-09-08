export type XivConnectionMode = 'offline' | 'hybrid' | 'cloud';
export type XivTrustState = 'verified' | 'stale' | 'unknown' | 'synthetic';

export const xivOsExperience = {
  principles: [
    'Show what changed before showing everything.',
    'Every recommendation should expose evidence, freshness and uncertainty.',
    'Offline mode remains useful and visibly distinct from live cloud intelligence.',
    'High-consequence actions always surface an approval checkpoint.',
    'Users see the story, root cause, affected systems, options and expected outcome in one flow.',
  ],
  connectionModes: {
    offline: {
      label: 'Local Brain',
      description: 'Working from approved local models, cached knowledge and device storage.',
      allowed: ['local search', 'local agents', 'saved evidence', 'drafting', 'simulation', 'checkpointed workflows'],
      unavailable: ['fresh web data', 'unconfigured enterprise APIs', 'cloud-only models'],
    },
    hybrid: {
      label: 'Hybrid Intelligence',
      description: 'Local Brain is primary; authorized cloud capabilities may assist when policy allows.',
    },
    cloud: {
      label: 'Connected Intelligence',
      description: 'Authorized online sources are available, with local fallback where supported.',
    },
  },
  agentMeeting: {
    title: 'AI Task Force',
    sections: ['Objective', 'Agents participating', 'Evidence', 'Debate', 'Recommendation', 'Founder/Executive decision'],
  },
  businessHospital: {
    sequence: ['Symptom', 'What changed', 'Likely causes', 'Evidence', 'Affected areas', 'Treatment options', 'Simulated outcome', 'Approval'],
  },
  trustLabels: {
    verified: 'Verified evidence',
    stale: 'Stale — refresh needed',
    unknown: 'Unknown / unavailable',
    synthetic: 'Sample or synthetic data',
  } satisfies Record<XivTrustState, string>,
} as const;
