import { createServer, IncomingMessage, ServerResponse } from 'node:http';

export type ControlTowerSnapshot = {
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';
  activeAgents: number;
  queuedJobs: number;
  failedJobs: number;
  lastReceiptAt?: string;
};

export type SnapshotProvider = () => Promise<ControlTowerSnapshot> | ControlTowerSnapshot;

export function createControlTowerServer(provider: SnapshotProvider, token: string) {
  if (!token) throw new Error('control tower auth token required');
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const host = req.headers.host ?? '';
    if (!host.startsWith('127.0.0.1') && !host.startsWith('localhost')) {
      res.writeHead(403); res.end('localhost only'); return;
    }
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(401); res.end('unauthorized'); return;
    }
    if (req.url === '/health' || req.url === '/status') {
      const snapshot = await provider();
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ...snapshot, topSecretIncluded: false }));
      return;
    }
    res.writeHead(404); res.end('not found');
  });
}

export const controlTowerHttpPolicy = {
  bindHost: '127.0.0.1',
  externalNetworkAllowed: false,
  authenticationRequired: true,
  topSecretResponsesAllowed: false,
  productionMutationAllowed: false,
};
