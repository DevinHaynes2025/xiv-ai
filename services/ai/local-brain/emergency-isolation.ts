import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { cloudPeerSlots } from './cloud-peer-adapters';

export type IsolationMode = {
  active: boolean;
  reason: string;
  localOnly: true;
  cloudRouting: false;
  peerRouting: false;
  physicalControl: false;
  enteredAt?: string;
  resumedAt?: string;
};

type IsolationStore = { mode: IsolationMode };

const INACTIVE: IsolationMode = {
  active: false,
  reason: 'not_isolated',
  localOnly: true,
  cloudRouting: false,
  peerRouting: false,
  physicalControl: false,
};

function isolationPath(root: string) {
  return xivLocalPath(root, 'emergency-isolation.json');
}

export async function readIsolationMode(root = process.cwd()): Promise<IsolationMode> {
  const store = await readJsonFile<IsolationStore>(isolationPath(root), { mode: INACTIVE });
  return store.mode ?? INACTIVE;
}

export async function enterEmergencyIsolation(input: { reason: string; root?: string }) {
  const root = input.root ?? process.cwd();
  const mode: IsolationMode = {
    active: true,
    reason: input.reason,
    localOnly: true,
    cloudRouting: false,
    peerRouting: false,
    physicalControl: false,
    enteredAt: new Date().toISOString(),
  };
  await writeJsonFileAtomic(isolationPath(root), { mode });
  return {
    mode,
    peers: cloudPeerSlots().map((slot) => ({ peer: slot.peer, state: 'UNAVAILABLE' as const })),
  };
}

export async function resumeFromEmergencyIsolation(input: { explicit: boolean; root?: string }) {
  if (!input.explicit) {
    return { resumed: false as const, reason: 'Isolation does not auto-resume. Explicit local resume is required.' };
  }
  const root = input.root ?? process.cwd();
  const previous = await readIsolationMode(root);
  const mode: IsolationMode = {
    ...INACTIVE,
    reason: 'explicit_local_resume',
    resumedAt: new Date().toISOString(),
    enteredAt: previous.enteredAt,
  };
  await writeJsonFileAtomic(isolationPath(root), { mode });
  return { resumed: true as const, mode };
}
