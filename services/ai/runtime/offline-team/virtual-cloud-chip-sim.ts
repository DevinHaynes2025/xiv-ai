export type SimNodeKind='LOCAL_SERVER'|'VIRTUAL_SERVER'|'CPU'|'GPU'|'NPU'|'TPU'|'QPU_SIM'|'WORLD'|'GALAXY'|'BLACK_HOLE_LINK'|'WORMHOLE_LINK';
export interface SimNode { id:string; kind:SimNodeKind; capacityUnits:number; evidenceRefs:readonly string[]; simulationOnly:true; }
export interface SimEdge { from:string; to:string; latencyMs:number; bandwidthUnits:number; }
export interface VirtualTopology { nodes:readonly SimNode[]; edges:readonly SimEdge[]; productionAuthority:false; physicalPortalClaim:false; quantumAdvantageClaimed:false; }
export const VIRTUAL_CLOUD_GUARDRAILS={simulationOnly:true,physicalPortalClaim:false,quantumAdvantageClaimed:false,liveChipControl:false,productionAuthority:false} as const;
export function buildVirtualTopology(nodes:readonly SimNode[],edges:readonly SimEdge[]):VirtualTopology{
  const ids=new Set(nodes.map(n=>n.id));
  for(const e of edges){if(!ids.has(e.from)||!ids.has(e.to)) throw new Error('edge references unknown node');}
  return Object.freeze({nodes:Object.freeze([...nodes]),edges:Object.freeze([...edges]),productionAuthority:false,physicalPortalClaim:false,quantumAdvantageClaimed:false});
}
