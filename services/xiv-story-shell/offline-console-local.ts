import { startOfflineConsole } from './offline-console';

// Explicit local-only entry point. No discovery, environment, credentials, or file inputs.
const identity = Object.freeze({ tenantId: 'local', universeId: 'offline', requesterId: 'operator' });
startOfflineConsole(identity, { identity, installedModels: null, pendingReviews: null });
