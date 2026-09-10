# XIV Silicon Adapter Atlas (classical-first)

Story: ecosystem expansion under 62L-EZ / offline-first OS.
Truth ladder: UNKNOWN → DOCUMENTED → DETECTED → SUPPORTED → VERIFIED.
DETECTED ≠ VERIFIED. No BIOS/firmware/overclock work.

## AMD (ASUS XiV — primary offline path)
| Resource | State | Notes |
|----------|-------|-------|
| Ryzen 7 260 CPU | DETECTED | Win32_Processor 8c/16t |
| Radeon 780M iGPU | DETECTED | Driver 32.0.22024.3004; Ollama GPU accel NOT_TESTED |
| NPU | UNKNOWN | Do not claim DirectML/NPU without receipt |
| Ollama 0.33.3 + qwen2.5-coder:7b | VERIFIED (runtime smoke) | CPU/unknown device path |

## NVIDIA
| Resource | State | Notes |
|----------|-------|-------|
| CUDA / TensorRT path | DOCUMENTED candidate | Not present on ASUS (no NVIDIA GPU) |
| Cloud NVIDIA workers | WAITING_PROVIDER | Optional cloud only |

## Intel
| Resource | State | Notes |
|----------|-------|-------|
| CPU / Arc / NPU | DOCUMENTED candidate | Not on this machine |
| OpenVINO | DOCUMENTED | Future offline edge path |

## Quantum / agentic OS stance
Classical metaphors + QPU as authorized candidate only.
Phone/desktop/cloud = one Universe fabric with RLS; agents propose, humans approve; L4 off.
Never claim trillion-row mining without measured corpus manifests.
