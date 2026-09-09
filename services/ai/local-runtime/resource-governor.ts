export type ResourceBudget = {
  maxConcurrentTasks: number;
  maxMemoryBytes: number;
};

export type ResourceRequest = {
  concurrentTasks: number;
  estimatedMemoryBytes: number;
};

export type ResourceDecision = {
  allowed: boolean;
  reasons: string[];
};

export function evaluateResourceRequest(
  request: ResourceRequest,
  budget: ResourceBudget,
): ResourceDecision {
  const reasons: string[] = [];

  if (!Number.isFinite(request.concurrentTasks) || request.concurrentTasks < 0) {
    reasons.push('Concurrent task count must be a finite non-negative number.');
  }
  if (!Number.isFinite(request.estimatedMemoryBytes) || request.estimatedMemoryBytes < 0) {
    reasons.push('Estimated memory must be a finite non-negative number.');
  }
  if (request.concurrentTasks > budget.maxConcurrentTasks) {
    reasons.push(`Requested concurrency ${request.concurrentTasks} exceeds ceiling ${budget.maxConcurrentTasks}.`);
  }
  if (request.estimatedMemoryBytes > budget.maxMemoryBytes) {
    reasons.push(`Estimated memory ${request.estimatedMemoryBytes} exceeds ceiling ${budget.maxMemoryBytes}.`);
  }

  return { allowed: reasons.length === 0, reasons };
}
