export type UniverseStatus = 'active' | 'suspended' | 'archived' | 'prototype';

export type UniverseRole =
  | 'owner'
  | 'executive'
  | 'admin'
  | 'manager'
  | 'employee'
  | 'member'
  | 'consumer_guest'
  | 'agent';

export type UniverseVisibility = 'private' | 'universe' | 'organization' | 'employees' | 'public';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type StorageTier = 'consumer' | 'professional' | 'business' | 'enterprise' | 'sovereign';

export type Universe = {
  universeId: string;
  organizationId: string;
  name: string;
  status: UniverseStatus;
  createdAt: string;
  dataClassification: DataClassification;
  storageTier: StorageTier;
  regionPreference: string;
  prototype: boolean;
};

export type UniverseMembership = {
  membershipId: string;
  universeId: string;
  organizationId: string;
  principalId: string;
  role: UniverseRole;
  status: 'active' | 'revoked';
};

export type UniverseResourceType =
  | 'media'
  | 'document'
  | 'post'
  | 'announcement'
  | 'business_record'
  | 'agent_artifact';

export type UniverseResource = {
  resourceId: string;
  universeId: string;
  organizationId: string;
  ownerId: string;
  resourceType: UniverseResourceType;
  visibility: UniverseVisibility;
  classification: DataClassification;
  createdAt: string;
};

export type UniversePermission = {
  principalId: string;
  role: UniverseRole;
  universeId: string;
  organizationId: string;
};
