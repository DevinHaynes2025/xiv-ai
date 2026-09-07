/**
 * CRM core domain contracts. No persistence in 2I-A.
 */
export type CrmAccount = {
  accountId: string;
  organizationId: string;
  universeId: string | null;
  name: string;
  status: 'active' | 'inactive' | 'prospect';
  persisted: false;
};

export type CrmContact = {
  contactId: string;
  organizationId: string;
  accountId: string | null;
  displayName: string;
  persisted: false;
};

export type CrmCustomer = {
  customerId: string;
  organizationId: string;
  accountId: string;
  persisted: false;
};

export type CrmPipelineStage = {
  stageId: string;
  name: string;
  order: number;
};

export type CrmOpportunity = {
  opportunityId: string;
  organizationId: string;
  accountId: string;
  stageId: string;
  amountUnknown: true;
  persisted: false;
};

export type CrmActivity = {
  activityId: string;
  organizationId: string;
  kind: 'call' | 'meeting' | 'email' | 'note' | 'task';
  subject: string;
  persisted: false;
};

export type CrmNote = {
  noteId: string;
  organizationId: string;
  body: string;
  persisted: false;
};

export type CrmTask = {
  taskId: string;
  organizationId: string;
  title: string;
  status: 'open' | 'done';
  persisted: false;
};

export const CRM_CORE_CONTRACTS = [
  'Customer',
  'Account',
  'Contact',
  'Opportunity',
  'PipelineStage',
  'Activity',
  'Note',
  'Task',
] as const;
