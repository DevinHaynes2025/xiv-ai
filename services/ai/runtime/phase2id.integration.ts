/**
 * Optional Phase 2I-D public provider integration.
 * Not part of npm run test:runtime. May require network.
 * Delegates to the World Bank real-data proof.
 */
import { runWorldBankRealDataProof } from './phase2id.worldbank.proof';

const result = await runWorldBankRealDataProof();
process.exitCode = result.ok ? 0 : 1;
