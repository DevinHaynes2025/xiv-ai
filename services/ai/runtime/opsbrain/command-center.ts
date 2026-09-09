export type CommandCenterView = 'MOBILE' | 'TABLET_DESKTOP';
export type CommandCenterAlert = { alertId: string; priority: 'high' | 'normal' };
export type CommandCenterDecision = { decisionId: string; pendingApproval: boolean };
export type CommandCenterApproval = { approvalId: string; granted: boolean };
export type CommandCenterTaskForce = { forceId: string; grantsPermissions: false };
export type CommandCenterMetric = { name: string; invented: false };
export type CommandCenterTimeline = { entries: readonly string[] };
export type CommandCenterIncident = { incidentId: string };
export type CommandCenterBrief = { briefId: string };

export type OperationsCommandCenter = {
  view: CommandCenterView;
  mobilePriorities: readonly string[];
  tabletPanels: readonly string[];
  autonomous: false;
};

export function openOperationsCommandCenter(view: CommandCenterView): OperationsCommandCenter {
  return {
    view,
    mobilePriorities: ['alerts', 'approvals', 'AI summaries', 'task-force status', 'high-priority decisions'],
    tabletPanels: [
      'multi-panel operations',
      'maps',
      'graphs',
      'timelines',
      'company health',
      'task forces',
      'agent activity',
      'data provenance',
    ],
    autonomous: false,
  };
}
