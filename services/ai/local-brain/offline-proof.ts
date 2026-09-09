import { localModelStatus, completeWithLocalModel } from './local-model';

export type OfflineProof = {
  checkedAt: string;
  localModel: 'PASS' | 'UNAVAILABLE' | 'FAIL';
  inference: 'PASS' | 'UNAVAILABLE' | 'FAIL';
  cloudRequiredWork: 'WAITING_DATA';
  productionMutation: 'DENIED';
  l4Autonomy: false;
  evidence: string[];
};

export async function runOfflineProof(): Promise<OfflineProof> {
  const evidence: string[] = [];
  const status = await localModelStatus();
  evidence.push(`local_model=${status.availability}:${status.reason}`);

  if (status.availability !== 'AVAILABLE') {
    return {
      checkedAt: new Date().toISOString(),
      localModel: 'UNAVAILABLE',
      inference: 'UNAVAILABLE',
      cloudRequiredWork: 'WAITING_DATA',
      productionMutation: 'DENIED',
      l4Autonomy: false,
      evidence,
    };
  }

  try {
    const result = await completeWithLocalModel('Return exactly: XIV_OFFLINE_OK');
    const passed = result.text.trim().includes('XIV_OFFLINE_OK');
    evidence.push(`inference_model=${result.model}`);
    evidence.push(`inference_marker=${passed ? 'present' : 'missing'}`);
    return {
      checkedAt: new Date().toISOString(),
      localModel: 'PASS',
      inference: passed ? 'PASS' : 'FAIL',
      cloudRequiredWork: 'WAITING_DATA',
      productionMutation: 'DENIED',
      l4Autonomy: false,
      evidence,
    };
  } catch (error) {
    evidence.push(`inference_error=${error instanceof Error ? error.message : 'unknown'}`);
    return {
      checkedAt: new Date().toISOString(),
      localModel: 'PASS',
      inference: 'FAIL',
      cloudRequiredWork: 'WAITING_DATA',
      productionMutation: 'DENIED',
      l4Autonomy: false,
      evidence,
    };
  }
}
