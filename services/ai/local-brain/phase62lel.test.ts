/**
 * 62L-EL tests — Windows Hardware Truth Probe + Local Runtime Verification.
 * SoT: GitHub #156
 */

import {
  runEl1El4Sequence,
  runHardwareProbe,
  toPrivacyMinimalProbe,
  assertNoSensitiveLeak,
  createInitialRuntimeState,
  recordGateResult,
  assertEl1El4Pass,
  routeWorkload,
  governResources,
  classifyHeartbeat,
  agentsMayClaimWorking,
  runClassicalCpuBenchmark,
  gateQuantumInspiredCompare,
  getOnnxAdapterStatus,
  attemptOnnxModelLoad,
  probeSoftWires,
  createCapabilityRegistry,
  defaultCapabilityFlags,
  defaultCapabilityStates,
  EL_LOCKS,
  HONESTY_BANNER,
  GITHUB_SOT_ISSUE,
  CAPABILITY_FLAGS,
} from '../local-runtime/index';

const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

check('honesty_banner', HONESTY_BANNER.includes('DOCUMENTED') && HONESTY_BANNER.includes('VERIFIED'), HONESTY_BANNER);
check('sot_github_156', GITHUB_SOT_ISSUE === 156, `issue=${GITHUB_SOT_ISSUE}`);
check('l4_autonomy_false', EL_LOCKS.L4_AUTONOMY_ENABLED === false, 'L4_AUTONOMY_ENABLED=false');

const soft = probeSoftWires();
check('softwire_policy_auto_exec', soft.policy.canAutoExecuteAlwaysFalse === true, 'canAutoExecute always false');
check('softwire_policy_medium_approval', soft.policy.mediumRiskRequiresApproval && soft.policy.sampleAuthorizeMediumRequiresApproval, 'medium-risk requires approval');
check('softwire_policy_high_blocked', soft.policy.highRiskBlocked === true, 'high-risk tools blocked');
check('softwire_model_router_supplier_sim', soft.modelRouter.supplierReallocationRequiresApproval && soft.modelRouter.supplierReallocationIsProposalNotExecute, 'supplier sim requires approval');
check('softwire_diagnostics_redaction', soft.diagnosticsRedactionPresent === true, 'diagnostics.ts present');
check('softwire_ei_report', soft.predecessors.eiReport === 'PRESENT', `62L_EI_* ${soft.predecessors.eiReport}`);
check('softwire_ek_report_honest', soft.predecessors.ekReport === 'ABSENT' || soft.predecessors.ekReport === 'PRESENT', `62L_EK_* ${soft.predecessors.ekReport}`);

const flags = defaultCapabilityFlags();
const states = defaultCapabilityStates();
check('EL1_defaults_unknown_false_not_tested',
  flags.CPU_DETECTED === 'unknown' && flags.GPU_DETECTED === 'unknown' && flags.NPU_DETECTED === 'unknown' &&
  flags.WINDOWS_ML_SUPPORTED === 'unknown' && flags.AMD_EP_SUPPORTED === 'unknown' &&
  flags.MODEL_LOAD_VERIFIED === false && flags.ONNX_LOAD_VERIFIED === false &&
  states.GPU === 'NOT_TESTED' && states.NPU === 'NOT_TESTED' && states.AMD_EP === 'NOT_TESTED' &&
  states.MODEL_LOAD === 'NOT_TESTED' && CAPABILITY_FLAGS.includes('GPU_DETECTED') && CAPABILITY_FLAGS.includes('AMD_EP_SUPPORTED'),
  'capability registry defaults unknown/false/NOT_TESTED');

const probe = runHardwareProbe({
  platform: 'linux', hostname: 'SECRET-HOST-XYZ', serialNumber: 'SN-SHOULD-REDACT-999',
  username: 'founder_secret_user', homeDirectory: '/home/founder_secret_user',
  machineGuid: 'guid-abc-should-redact', macAddresses: ['00:11:22:33:44:55'], gpuNames: [], npuNames: [],
});
check('EL2_read_only_contract',
  probe.readOnly === true && probe.stealthPersistence === false && probe.permissionBypass === false &&
  probe.registry.flags.CPU_DETECTED === true && probe.registry.states.WINDOWS_ML === 'NOT_TESTED' &&
  probe.registry.flags.MODEL_LOAD_VERIFIED === false,
  'read-only probe; no stealth; Windows ML NOT_TESTED on non-Windows');

const rawSensitive = {
  hostname: 'SECRET-HOST-XYZ', serialNumber: 'SN-SHOULD-REDACT-999', username: 'founder_secret_user',
  homeDirectory: '/home/founder_secret_user', machineGuid: 'guid-abc-should-redact', macAddresses: ['00:11:22:33:44:55'],
};
const minimal = toPrivacyMinimalProbe(probe, rawSensitive);
check('EL3_privacy_minimal_redaction',
  minimal.privacyMinimal === true && assertNoSensitiveLeak(minimal, rawSensitive) &&
  minimal.redactedFields.includes('hostname') && minimal.redactedFields.includes('serialNumber') &&
  !JSON.stringify(minimal).includes('SECRET-HOST-XYZ') && !JSON.stringify(minimal).includes('founder_secret_user'),
  'sensitive identifiers redacted from probe output');

const incomplete = createInitialRuntimeState();
const denyBefore = routeWorkload({
  target: 'amd_gpu', runtime: incomplete,
  registry: createCapabilityRegistry({ flags: { GPU_DETECTED: true, AMD_EP_SUPPORTED: true, MODEL_LOAD_VERIFIED: true } }),
});
check('AMD_GPU_denied_before_EL1_EL4',
  denyBefore.allowed === false && denyBefore.reason === 'AMD_GPU_NPU_ROUTE_DENIED_BEFORE_EL1_EL4_PASS' && denyBefore.amdInferenceClaimed === false,
  denyBefore.reason);

const denyNpuBefore = routeWorkload({
  target: 'amd_npu', runtime: incomplete,
  registry: createCapabilityRegistry({ flags: { NPU_DETECTED: true, AMD_EP_SUPPORTED: true } }),
});
check('AMD_NPU_denied_before_EL1_EL4', denyNpuBefore.allowed === false && denyNpuBefore.state === 'DENIED', denyNpuBefore.reason);

const govBefore = governResources({ kind: 'amd_gpu', runtime: incomplete });
check('resource_governor_denies_AMD_before_EL1_EL4', govBefore.allowed === false && govBefore.reason.includes('EL1_EL4'), govBefore.reason);

const sequence = runEl1El4Sequence({
  platform: 'linux', hostname: 'should-not-leak', serialNumber: 'serial-leak-check', username: 'user-leak-check',
});
check('EL1_gate_pass', sequence.runtime.gates.EL1.status === 'PASS', sequence.runtime.gates.EL1.evidence);
check('EL2_gate_pass', sequence.runtime.gates.EL2.status === 'PASS', sequence.runtime.gates.EL2.evidence);
check('EL3_gate_pass', sequence.runtime.gates.EL3.status === 'PASS', sequence.runtime.gates.EL3.evidence);
check('EL4_gate_pass', sequence.runtime.gates.EL4.status === 'PASS', sequence.runtime.gates.EL4.evidence);
check('EL1_EL4_complete', sequence.el1El4Pass === true && assertEl1El4Pass(sequence.runtime), 'all gates PASS');

const afterNoFlags = routeWorkload({ target: 'amd_gpu', runtime: sequence.runtime, registry: sequence.registry });
check('AMD_GPU_denied_without_probe_flags_after_EL',
  afterNoFlags.allowed === false && (afterNoFlags.reason === 'GPU_DETECTED_REQUIRED' || afterNoFlags.state === 'UNAVAILABLE'),
  afterNoFlags.reason);

const afterWithFlags = routeWorkload({
  target: 'amd_gpu', runtime: sequence.runtime,
  registry: createCapabilityRegistry({ flags: { GPU_DETECTED: true, AMD_EP_SUPPORTED: true, MODEL_LOAD_VERIFIED: true, CPU_DETECTED: true } }),
});
check('AMD_GPU_candidate_after_EL1_EL4_with_flags',
  afterWithFlags.allowed === true && afterWithFlags.amdInferenceClaimed === false, afterWithFlags.reason);

const afterNpuNoFlag = routeWorkload({
  target: 'amd_npu', runtime: sequence.runtime,
  registry: createCapabilityRegistry({ flags: { NPU_DETECTED: 'unknown' } }),
});
check('AMD_NPU_unavailable_without_NPU_DETECTED',
  afterNpuNoFlag.allowed === false && afterNpuNoFlag.state === 'UNAVAILABLE', afterNpuNoFlag.reason);

const waiting = classifyHeartbeat({ nodeId: 'asus-1' });
check('heartbeat_waiting_node', waiting.state === 'WAITING_NODE' && agentsMayClaimWorking(waiting) === false, waiting.detail);
const offline = classifyHeartbeat({ nodeId: 'asus-1', devicePoweredOn: false, observedAt: new Date().toISOString() });
check('heartbeat_offline_stopped', offline.state === 'OFFLINE_STOPPED' && offline.agentsClaimedWorkingWhileOff === false, offline.detail);
const running = classifyHeartbeat({ nodeId: 'asus-1', devicePoweredOn: true, running: true, observedAt: new Date().toISOString() });
check('heartbeat_running_verified', running.state === 'RUNNING_VERIFIED' && agentsMayClaimWorking(running) === true, running.detail);

const bench = runClassicalCpuBenchmark({ iterations: 5_000 });
check('classical_cpu_benchmark', bench.passed && bench.target === 'cpu' && bench.quantumComparisonAllowed === false, `${bench.metric}=${bench.value}${bench.unit}`);
const qDeny = gateQuantumInspiredCompare({ classicalBaselinePresent: false, classicalBaselinePassed: false });
check('quantum_denied_without_classical_baseline', qDeny.allowed === false && qDeny.quantumAdvantageClaimed === false, qDeny.reason);
const qAllowBounded = gateQuantumInspiredCompare({ classicalBaselinePresent: true, classicalBaselinePassed: true });
check('quantum_compare_bounded_no_advantage_claim', qAllowBounded.allowed === true && qAllowBounded.quantumAdvantageClaimed === false, qAllowBounded.reason);

const onnx = getOnnxAdapterStatus();
check('onnx_adapter_not_tested', onnx.loadState === 'NOT_TESTED' && onnx.modelLoadVerified === false && onnx.contractReady === true, onnx.reason);
const onnxClaim = attemptOnnxModelLoad({ claimVerified: true, evidencePresent: false });
check('onnx_claim_without_evidence_denied', onnxClaim.loadState === 'DENIED' && onnxClaim.modelLoadVerified === false, onnxClaim.reason);

const cpuRoute = routeWorkload({ target: 'cpu_baseline', runtime: incomplete, registry: createCapabilityRegistry() });
check('cpu_baseline_allowed_pre_EL', cpuRoute.allowed === true, cpuRoute.reason);

let partial = createInitialRuntimeState();
partial = recordGateResult(partial, 'EL1', 'PASS', 'ok');
partial = recordGateResult(partial, 'EL2', 'PASS', 'ok');
const stillDenied = routeWorkload({
  target: 'amd_gpu', runtime: partial,
  registry: createCapabilityRegistry({ flags: { GPU_DETECTED: true, AMD_EP_SUPPORTED: true } }),
});
check('AMD_denied_when_EL3_EL4_pending', stillDenied.allowed === false, stillDenied.reason);

if (failures.length) {
  console.error('\nFAIL 62L-EL');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log('\nPASS 62L-EL — EL1–EL4 + heartbeat + classical benchmark + AMD deny-before-pass');
console.log(`SoT GitHub #${GITHUB_SOT_ISSUE}; soft-wire EK=${soft.predecessors.ekReport} EI=${soft.predecessors.eiReport}`);
