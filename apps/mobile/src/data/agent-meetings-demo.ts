/** Demo-only 62B surfaces. Not LIVE overnight. Not L4. Not video transport. */
export const AGENT_MEETING_DEMO = {
  live: false,
  l4Enabled: false,
  overnightLive: false,
  unauthorizedActions: 0,
  command: {
    logicalAgents: 31,
    activeAgents: 6,
    meetingsRunning: 1,
    approvalsRequired: 1,
    unauthorizedActions: 0,
  },
  overnight: {
    meetingsCompleted: 2,
    issuesInvestigated: 2,
    opportunitiesIdentified: 1,
    anomaliesDetected: 1,
    decisionsRequireApproval: 2,
  },
  disagreement: {
    options: [
      { label: 'Option A', profile: 'Lowest cost.' },
      { label: 'Option B', profile: 'Best resilience.' },
      { label: 'Option C', profile: 'Best sustainability profile.' },
    ],
    recommendation: 'Option B',
    confidence: '82%',
    humanRequired: true,
  },
} as const;
