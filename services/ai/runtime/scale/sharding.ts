export type ShardRoute = {
  organizationId: string;
  homeRegion: string | null;
  dataResidency: string | null;
  shardId: string | null;
};

export function routeTenantShard(input: {
  organizationId: string;
  homeRegion?: string | null;
  dataResidency?: string | null;
  clientRequestedShardId?: string | null;
}): ShardRoute | { allowed: false; reason: string } {
  if (input.clientRequestedShardId) {
    return { allowed: false, reason: 'Client cannot choose an arbitrary database shard: DENY' };
  }
  return {
    organizationId: input.organizationId,
    homeRegion: input.homeRegion ?? null,
    dataResidency: input.dataResidency ?? null,
    shardId: null,
  };
}

export function shardingIsEnabled() {
  return false;
}
