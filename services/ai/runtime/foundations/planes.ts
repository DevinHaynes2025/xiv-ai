import type { InfrastructurePlane } from './types';

export type ControlPlane = {
  identity: true;
  guardian: true;
  policy: true;
  licensing: true;
  deviceRegistry: true;
  universeRegistry: true;
};

export type DataPlane = {
  databases: true;
  objectStorage: true;
  streams: true;
  search: true;
  graph: true;
  vector: true;
  replication: true;
};

export type ComputePlane = {
  cpu: true;
  gpu: true;
  distributedJobs: true;
  aiInference: true;
  optimization: true;
  simulation: true;
  mediaProcessing: true;
};

export type Underlay = {
  audit: true;
  observability: true;
  recovery: true;
  encryption: true;
  secrets: true;
  keyManagement: true;
  regionalPolicy: true;
  dataResidency: true;
};

export function planePrivilege(plane: InfrastructurePlane): { expandsAuthority: false } {
  void plane;
  return { expandsAuthority: false };
}

export function createGlobalInfrastructure(): {
  control: ControlPlane;
  data: DataPlane;
  compute: ComputePlane;
  underlay: Underlay;
} {
  return {
    control: {
      identity: true,
      guardian: true,
      policy: true,
      licensing: true,
      deviceRegistry: true,
      universeRegistry: true,
    },
    data: {
      databases: true,
      objectStorage: true,
      streams: true,
      search: true,
      graph: true,
      vector: true,
      replication: true,
    },
    compute: {
      cpu: true,
      gpu: true,
      distributedJobs: true,
      aiInference: true,
      optimization: true,
      simulation: true,
      mediaProcessing: true,
    },
    underlay: {
      audit: true,
      observability: true,
      recovery: true,
      encryption: true,
      secrets: true,
      keyManagement: true,
      regionalPolicy: true,
      dataResidency: true,
    },
  };
}
