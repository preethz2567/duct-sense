"""
sensor_simulator.py
-------------------
Simulates a DuctSense technician walkthrough along a 2.0-metre HVAC duct
section, generating fused thermal / pressure / audio sensor readings.

Usage (standalone):
    python sensor_simulator.py                          # leak at 1.2 m (default)
    python sensor_simulator.py --leak-position 0.8      # leak at 0.8 m
    python sensor_simulator.py --no-leak                # no leak, baseline + noise only

Importable API:
    generate_walkthrough_full(leak_position=1.2, no_leak=False)  -> list[dict]
    generate_walkthrough_stream(leak_position=1.2, no_leak=False) -> generator[dict]
"""

import argparse
import time
import numpy as np

# ── Walkthrough constants ──────────────────────────────────────────────────────
DUCT_LENGTH_M   = 2.0       # metres
DURATION_S      = 30.0      # seconds
SAMPLE_RATE_HZ  = 2         # samples per second
N_SAMPLES       = int(DURATION_S * SAMPLE_RATE_HZ)   # 60
STREAM_DELAY_S  = 0.1       # real-time delay between yields in streaming mode

# Gaussian leak shape
SIGMA_M = 0.15              # standard deviation in metres

# Signal parameters  (baseline, peak, noise_std)
THERMAL_BASELINE  = 0.05;  THERMAL_PEAK  = 0.92;  THERMAL_NOISE  = 0.03
PRESSURE_BASELINE = 2.0;   PRESSURE_PEAK = 55.0;  PRESSURE_NOISE = 3.0
AUDIO_BASELINE    = 0.05;  AUDIO_PEAK    = 0.85;  AUDIO_NOISE    = 0.04


# ── Core signal generation ─────────────────────────────────────────────────────

def _gaussian(positions: np.ndarray, center: float, sigma: float = SIGMA_M) -> np.ndarray:
    """Return a unit-height Gaussian envelope over the position array."""
    return np.exp(-0.5 * ((positions - center) / sigma) ** 2)


def _build_samples(leak_position: float = 1.2, no_leak: bool = False,
                   rng: np.random.Generator | None = None) -> list[dict]:
    """
    Core computation: returns 60 sample dicts.

    Parameters
    ----------
    leak_position : float
        Position along the duct (metres) where the leak is located.
    no_leak : bool
        If True, suppress the Gaussian peak entirely — baseline + noise only.
    rng : numpy random Generator
        Optional seeded generator for reproducible tests.
    """
    if rng is None:
        rng = np.random.default_rng()

    timestamps  = np.linspace(0.0, DURATION_S - (1.0 / SAMPLE_RATE_HZ), N_SAMPLES)
    positions   = np.linspace(0.0, DUCT_LENGTH_M, N_SAMPLES)

    if no_leak:
        envelope = np.zeros(N_SAMPLES)
    else:
        envelope = _gaussian(positions, center=leak_position)

    # ── Thermal confidence ──────────────────────────────────────────────────
    thermal = (
        THERMAL_BASELINE
        + (THERMAL_PEAK - THERMAL_BASELINE) * envelope
        + rng.normal(0, THERMAL_NOISE, N_SAMPLES)
    )
    thermal = np.clip(thermal, 0.0, 1.0)

    # ── Pressure differential (Pa) ──────────────────────────────────────────
    pressure = (
        PRESSURE_BASELINE
        + (PRESSURE_PEAK - PRESSURE_BASELINE) * envelope
        + rng.normal(0, PRESSURE_NOISE, N_SAMPLES)
    )

    # ── Audio confidence ────────────────────────────────────────────────────
    audio = (
        AUDIO_BASELINE
        + (AUDIO_PEAK - AUDIO_BASELINE) * envelope
        + rng.normal(0, AUDIO_NOISE, N_SAMPLES)
    )
    audio = np.clip(audio, 0.0, 1.0)

    samples = []
    for i in range(N_SAMPLES):
        samples.append({
            "timestamp":                float(timestamps[i]),
            "position_m":               float(positions[i]),
            "thermal_confidence":       float(thermal[i]),
            "pressure_differential_pa": float(pressure[i]),
            "audio_confidence":         float(audio[i]),
        })

    return samples


# ── Public API ─────────────────────────────────────────────────────────────────

def generate_walkthrough_full(leak_position: float = 1.2,
                              no_leak: bool = False,
                              rng: np.random.Generator | None = None) -> list[dict]:
    """
    Return the complete list of 60 samples immediately (no delay).

    Useful for fast automated tests and batch processing.

    Parameters
    ----------
    leak_position : float
        Leak location in metres (default 1.2 m).
    no_leak : bool
        If True, generate baseline-only data (no Gaussian peak).
    rng : numpy random Generator
        Optional seeded generator for reproducible results.

    Returns
    -------
    list[dict]
        60 sample dicts, each with keys:
        timestamp, position_m, thermal_confidence,
        pressure_differential_pa, audio_confidence.
    """
    return _build_samples(leak_position=leak_position, no_leak=no_leak, rng=rng)


def generate_walkthrough_stream(leak_position: float = 1.2,
                                no_leak: bool = False,
                                rng: np.random.Generator | None = None):
    """
    Yield one sample dict at a time with a 0.1 s real-time delay between yields.

    Mimics live sensor arrival for testing the live pipeline.

    Parameters
    ----------
    leak_position : float
        Leak location in metres (default 1.2 m).
    no_leak : bool
        If True, generate baseline-only data (no Gaussian peak).
    rng : numpy random Generator
        Optional seeded generator for reproducible results.

    Yields
    ------
    dict
        One sample dict per yield (same shape as generate_walkthrough_full).
    """
    samples = _build_samples(leak_position=leak_position, no_leak=no_leak, rng=rng)
    for sample in samples:
        yield sample
        time.sleep(STREAM_DELAY_S)


# ── Summary helper ─────────────────────────────────────────────────────────────

def _print_summary(samples: list[dict]) -> None:
    """Print per-sample lines and a final summary of peak values."""
    for s in samples:
        print(
            f"t={s['timestamp']:5.1f}s  pos={s['position_m']:.3f}m  "
            f"thermal={s['thermal_confidence']:.4f}  "
            f"pressure={s['pressure_differential_pa']:7.3f} Pa  "
            f"audio={s['audio_confidence']:.4f}"
        )

    # Find peak indices
    thermals  = [s["thermal_confidence"]       for s in samples]
    pressures = [s["pressure_differential_pa"] for s in samples]
    audios    = [s["audio_confidence"]          for s in samples]

    ti = int(np.argmax(thermals))
    pi = int(np.argmax(pressures))
    ai = int(np.argmax(audios))

    print("\n-- Summary --------------------------------------------------------------")
    print(f"  Peak thermal_confidence       : {thermals[ti]:.4f}  "
          f"at position {samples[ti]['position_m']:.3f} m  (t={samples[ti]['timestamp']:.1f}s)")
    print(f"  Peak pressure_differential_pa : {pressures[pi]:.3f} Pa  "
          f"at position {samples[pi]['position_m']:.3f} m  (t={samples[pi]['timestamp']:.1f}s)")
    print(f"  Peak audio_confidence         : {audios[ai]:.4f}  "
          f"at position {samples[ai]['position_m']:.3f} m  (t={samples[ai]['timestamp']:.1f}s)")
    print("-------------------------------------------------------------------------")


# ── CLI entry point ────────────────────────────────────────────────────────────

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="DuctSense sensor walkthrough simulator.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--leak-position",
        type=float,
        default=1.2,
        metavar="METRES",
        help="Position of the simulated leak along the duct (0.0 – 2.0 m).",
    )
    parser.add_argument(
        "--no-leak",
        action="store_true",
        default=False,
        help="Generate a clean walkthrough with no leak (baseline + noise only).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()

    mode = "NO-LEAK (baseline only)" if args.no_leak else f"LEAK at {args.leak_position:.2f} m"
    print(f"DuctSense Sensor Simulator — {mode}")
    print(f"  {N_SAMPLES} samples  |  {SAMPLE_RATE_HZ} Hz  |  {DUCT_LENGTH_M} m duct  |  {DURATION_S} s walkthrough\n")

    samples = generate_walkthrough_full(
        leak_position=args.leak_position,
        no_leak=args.no_leak,
    )
    _print_summary(samples)
