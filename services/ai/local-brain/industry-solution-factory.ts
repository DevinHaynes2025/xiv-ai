/**
 * 62L-DY Module G — Industry Solution Factory.
 * Solution-pack creation; wedge-first behind supply-chain pilot;
 * listing ≠ auto-grant.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  LISTING_NEQ_AUTO_GRANT,
  MAX_SOLUTION_PACKS,
  WEDGE_FIRST_GATED,
  type DyActor,
} from './intelligent-supply-chain-command-types';

export type SolutionPack = {
  id: string;
  packId: string;
  industry: string;
  supplyChainPilotProven: boolean;
  listed: boolean;
  autoGranted: false;
  status: 'listed_candidate' | 'pilot_eligible' | 'gated' | 'denied';
  reason: string;
  createdAt: string;
};

export type BroaderIndustryGate = {
  id: string;
  supplyChainPilotProofPresent: boolean;
  attemptBroaderIndustry: boolean;
  status: 'allowed_pilot' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  packs: SolutionPack[];
  gates: BroaderIndustryGate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'industry-solution-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], gates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function industrySolutionFactoryHonesty() {
  return {
    listingNeqAutoGrant: true,
    wedgeFirstSupplyChainPilot: true,
    broaderIndustryBeforePilot: false,
    fakeGaClaimed: false,
  };
}

export async function createSolutionPack(input: {
  packId: string;
  industry: string;
  supplyChainPilotProven: boolean;
  listPublicly?: boolean;
  attemptAutoGrant?: boolean;
  root: string;
  actor: DyActor;
}): Promise<SolutionPack> {
  const store = await load(input.root);
  void input.actor;
  if (store.packs.length >= MAX_SOLUTION_PACKS) {
    throw new Error('MAX_SOLUTION_PACKS_REACHED');
  }
  const pack: SolutionPack = {
    id: id('dysp'),
    packId: input.packId.trim(),
    industry: input.industry.trim(),
    supplyChainPilotProven: input.supplyChainPilotProven,
    listed: Boolean(input.listPublicly),
    autoGranted: false,
    status: input.supplyChainPilotProven
      ? input.listPublicly
        ? 'listed_candidate'
        : 'pilot_eligible'
      : 'gated',
    reason: input.attemptAutoGrant
      ? LISTING_NEQ_AUTO_GRANT
      : input.supplyChainPilotProven
        ? LISTING_NEQ_AUTO_GRANT
        : WEDGE_FIRST_GATED,
    createdAt: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function evaluateBroaderIndustryGate(input: {
  supplyChainPilotProofPresent: boolean;
  attemptBroaderIndustry: boolean;
  root: string;
  actor: DyActor;
}): Promise<BroaderIndustryGate> {
  const store = await load(input.root);
  void input.actor;
  const allowed =
    input.supplyChainPilotProofPresent && !input.attemptBroaderIndustry
      ? false
      : input.supplyChainPilotProofPresent && input.attemptBroaderIndustry
        ? true
        : false;
  // Broader industry always gated unless pilot proven; even then listing ≠ auto-grant.
  // attemptBroaderIndustry without pilot → denied
  const denied = !input.supplyChainPilotProofPresent;
  const gate: BroaderIndustryGate = {
    id: id('dywig'),
    supplyChainPilotProofPresent: input.supplyChainPilotProofPresent,
    attemptBroaderIndustry: input.attemptBroaderIndustry,
    status: denied ? 'denied' : 'allowed_pilot',
    reason: denied ? WEDGE_FIRST_GATED : 'SUPPLY_CHAIN_PILOT_PROVEN',
    at: new Date().toISOString(),
  };
  void allowed;
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}
