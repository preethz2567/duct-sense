"""
run_pipeline.py
---------------
End-to-end DuctSense pipeline runner.

Pulls a full simulated walkthrough from the sensor simulator, passes
every sample through the fusion engine, fires console alerts on detected
leaks, and prints a post-run summary.

Usage:
    python run_pipeline.py
"""

import sys
import os

# Allow imports from sibling packages (simulator/, core/) without installing
# the repo as a package.
sys.path.insert(0, os.path.dirname(__file__))

from simulator.sensor_simulator import generate_walkthrough_full
from core.fusion_logic import fuse
from core.alert import trigger_console_alert


def run_pipeline(leak_position: float = 1.2, no_leak: bool = False) -> None:
    """
    Run the full sensor → fusion → alert pipeline.

    Parameters
    ----------
    leak_position : float
        Simulated leak position in metres (passed to the simulator).
    no_leak : bool
        If True, run a clean no-leak walkthrough (baseline only).
    """
    print("=" * 65)
    print("DuctSense Pipeline Runner")
    print(f"  Simulator : leak_position={leak_position} m  |  no_leak={no_leak}")
    print("=" * 65)

    samples = generate_walkthrough_full(leak_position=leak_position, no_leak=no_leak)

    total_samples    = 0
    leak_count       = 0
    first_leak_pos   = None

    for sample in samples:
        fused = fuse(sample)
        trigger_console_alert(fused)

        total_samples += 1
        if fused["leak_detected"]:
            leak_count += 1
            if first_leak_pos is None:
                first_leak_pos = fused["position_m"]

    # ── Post-run summary ───────────────────────────────────────────────────
    print()
    print("-" * 65)
    print("Pipeline Summary")
    print("-" * 65)
    print(f"  Total samples processed : {total_samples}")
    print(f"  Leak-detected samples   : {leak_count}")
    if first_leak_pos is not None:
        print(f"  First leak position     : {first_leak_pos:.3f} m")
    else:
        print("  First leak position     : No leak detected")
    print("-" * 65)


if __name__ == "__main__":
    run_pipeline()
