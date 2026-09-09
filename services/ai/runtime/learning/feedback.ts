import { feedbackDoesNotRetrain } from '../feedback';

export function continuousLearningMutatesModels() {
  return feedbackDoesNotRetrain().retrainsModel;
}
