import { digest } from './crypto';
import type { BoundedTask } from './types';

/**
 * The bounded execution surface 62D models. Kernels are pure integer
 * reductions, so an Intel lane, an AMD lane and an NVIDIA lane must produce an
 * identical result for an identical input. That is what makes the vendor tests
 * in section 29 a contract test rather than a benchmark.
 *
 * Nothing here touches the network, the filesystem or any external system.
 */

export type KernelResult = {
  output: number;
  outputDigest: string;
};

export function runBoundedKernel(task: BoundedTask): KernelResult {
  const output = compute(task);
  return { output, outputDigest: digest({ kernel: task.kernel, output }) };
}

function compute(task: BoundedTask): number {
  switch (task.kernel) {
    case 'vector_sum':
      return task.input.reduce((total, value) => total + Math.trunc(value), 0);
    case 'row_reduce':
      return task.input.reduce(
        (total, value, index) => total + (index % 2 === 0 ? Math.trunc(value) : -Math.trunc(value)),
        0,
      );
    case 'checksum': {
      let hash = 2166136261;
      for (const value of task.input) {
        hash = Math.imul(hash ^ (Math.trunc(value) >>> 0), 16777619) >>> 0;
      }
      return hash >>> 0;
    }
  }
}

export function taskDigest(task: BoundedTask): string {
  return digest(task);
}
