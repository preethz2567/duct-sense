"""
run_pipeline.py
---------------
End-to-end DuctSense pipeline runner.

Pulls a full simulated walkthrough from the sensor simulator, passes
every sample through the fusion engine, fires console alerts on detected
leaks, persists leak events to SQLite, generates a Markdown report, and
writes it to docs/latest_report.md.

Usage:
    python run_pipeline.py
"""

import sys
import os
import datetime

# Allow imports from sibling packages (simulator/, core/, storage/) without
# installing the repo as a package.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from simulator.sensor_simulator import generate_walkthrough_full
from core.fusion_logic import fuse
from core.alert import trigger_console_alert
from core.api_client import publish_walkthrough
from storage.storage import start_walkthrough, log_event, get_events_for_walkthrough
from storage.report_generator import generate_report
REPORT_PATH = "docs/latest_report.md"


def run_pipeline(leak_position: float = 1.2, no_leak: bool = False, thermal_image_path: str = None) -> None:
    """
    Run the full sensor -> fusion -> alert -> storage -> report pipeline.

    Parameters
    ----------
    leak_position : float
        Simulated leak position in metres (passed to the simulator).
    no_leak : bool
        If True, run a clean no-leak walkthrough (baseline only).
    thermal_image_path : str
        Optional path to a real FLIR thermal image. If provided, the true ML
        confidence will override the simulated thermal confidence near the leak.
    """
    print("=" * 65)
    print("DuctSense Pipeline Runner")
    print(f"  Simulator : leak_position={leak_position} m  |  no_leak={no_leak}")
    if thermal_image_path:
        print(f"  Thermal Image : {thermal_image_path}")
    print("=" * 65)

    # ── Start a new walkthrough session ───────────────────────────────────
    walkthrough_id = start_walkthrough()
    print(f"  Walkthrough ID : {walkthrough_id}\n")

    # ── Process all samples ────────────────────────────────────────────────
    samples = generate_walkthrough_full(leak_position=leak_position, no_leak=no_leak)

    real_thermal_conf = None
    if thermal_image_path:
        if not os.path.exists(thermal_image_path):
            print(f"  -> Error: Thermal image path does not exist: {thermal_image_path}")
        else:
            try:
                from sensors.thermal_reader import analyze
                print(f"  Analyzing real thermal image: {thermal_image_path}...")
                analysis = analyze(thermal_image_path)
                real_thermal_conf = analysis.get("thermal_confidence")
                print(f"  -> Real thermal_confidence: {real_thermal_conf}")
            except ImportError as e:
                print(f"  -> Thermal Integration Error: Missing dependencies. {e}")
            except Exception as e:
                print(f"  -> Error analyzing thermal image: {e}")

    total_samples  = 0
    leak_count     = 0
    first_leak_pos = None

    for sample in samples:
        # Inject real thermal confidence if near the leak position (e.g. within 0.15m)
        if real_thermal_conf is not None and abs(sample["position_m"] - leak_position) <= 0.15:
            sample["thermal_confidence"] = real_thermal_conf

        fused = fuse(sample)

        # Console alert
        trigger_console_alert(fused)

        # Persist leak events and track stats
        if fused["leak_detected"]:
            log_event(walkthrough_id, fused)
            leak_count += 1
            if first_leak_pos is None:
                first_leak_pos = fused["position_m"]

        total_samples += 1

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

    # ── Generate and save Markdown report ─────────────────────────────────
    report = generate_report(walkthrough_id)

    print()
    print(report)

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"Report written to: {REPORT_PATH}")

    # ── Publish to FastAPI (non-fatal if backend is unavailable) ──────────────
    print()
    today = datetime.date.today().isoformat()   # e.g. "2026-09-28"
    leak_events = get_events_for_walkthrough(walkthrough_id)
    print(f"Publishing walkthrough to FastAPI ({len(leak_events)} leak event(s))...")
    publish_walkthrough(
        walkthrough_id=walkthrough_id,
        date=today,
        events=leak_events,
    )


if __name__ == "__main__":
    thermal_img = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(thermal_image_path=thermal_img)
