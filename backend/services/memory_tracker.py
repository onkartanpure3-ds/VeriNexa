"""
VeriNexa — Process Memory Tracker

Measures and logs RSS memory usage in MiB across application startup,
model loading stages, and verification inference.
"""
from __future__ import annotations

import logging
import os
import gc

logger = logging.getLogger("truthlenx.memory")

try:
    import psutil
    _PROCESS = psutil.Process(os.getpid())
except Exception:
    _PROCESS = None


def get_memory_mb() -> float:
    """Return current process Resident Set Size (RSS) in MiB."""
    global _PROCESS
    if _PROCESS is not None:
        try:
            return round(_PROCESS.memory_info().rss / (1024 * 1024), 2)
        except Exception:
            pass
    try:
        import psutil
        _PROCESS = psutil.Process(os.getpid())
        return round(_PROCESS.memory_info().rss / (1024 * 1024), 2)
    except Exception:
        return -1.0


def log_memory(stage: str) -> float:
    """Log current process memory for the given execution stage."""
    mem = get_memory_mb()
    if mem > 0:
        logger.info(f"[MEMORY] {stage} | Current RSS: {mem:.1f} MiB")
    else:
        logger.info(f"[MEMORY] {stage} | Memory measurement unavailable")
    return mem


def cleanup_memory():
    """Trigger Python garbage collection."""
    gc.collect()
