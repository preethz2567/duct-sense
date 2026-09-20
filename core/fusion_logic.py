"""
fusion_logic.py
---------------
Fuses thermal, pressure, and audio sensor signals into a single
leak-confidence score and binary leak-detected decision.

All threshold and weight constants are intentionally grouped at the top
so a field technician or ML engineer can tune them without reading the
rest of the code.
"""

# ---------------------------------------------------------------------------
# Tunable thresholds — adjust these to calibrate sensitivity in the field
# ---------------------------------------------------------------------------

# Minimum thermal confidence score required to gate a positive detection.
# Even a high weighted average won't trigger an alert if thermal is weak.
THERMAL_THRESHOLD = 0.6

# Minimum pressure differential (Pa) considered indicative of a leak.
PRESSURE_THRESHOLD_PA = 20.0

# Minimum audio hissing-confidence score considered indicative of a leak.
AUDIO_THRESHOLD = 0.6

# Weights for the weighted-sum fusion (must sum to 1.0).
THERMAL_WEIGHT  = 0.4
PRESSURE_WEIGHT = 0.3
AUDIO_WEIGHT    = 0.3

# Minimum fused confidence required to declare a leak (after gating).
LEAK_CONFIDENCE_THRESHOLD = 0.65

# Pressure value (Pa) that maps to a normalised score of 1.0.
# Readings above this cap are clipped to 1.0.
PRESSURE_NORMALIZATION_CAP_PA = 100.0


# ---------------------------------------------------------------------------
# Fusion function
# ---------------------------------------------------------------------------

def fuse(sample: dict) -> dict:
    """
    Fuse a single sensor sample into a leak-confidence decision.

    Parameters
    ----------
    sample : dict
        A sample dict produced by the sensor simulator (or real sensors),
        containing at minimum:
            - thermal_confidence        (float, 0.0–1.0)
            - pressure_differential_pa  (float, Pa)
            - audio_confidence          (float, 0.0–1.0)
            - timestamp                 (float, seconds)
            - position_m                (float, metres)

    Returns
    -------
    dict
        The original sample dict with two new keys appended:
            - leak_confidence  (float)  weighted fusion score
            - leak_detected    (bool)   True if both the fused score and the
                                        thermal gating condition are met
    """
    thermal_confidence       = sample["thermal_confidence"]
    pressure_differential_pa = sample["pressure_differential_pa"]
    audio_confidence         = sample["audio_confidence"]

    # Step a — normalise pressure to 0-1 scale, cap at 1.0
    normalized_pressure = min(
        pressure_differential_pa / PRESSURE_NORMALIZATION_CAP_PA,
        1.0,
    )

    # Step b — weighted-sum fusion score
    leak_confidence = (
        THERMAL_WEIGHT  * thermal_confidence
        + PRESSURE_WEIGHT * normalized_pressure
        + AUDIO_WEIGHT    * audio_confidence
    )

    # Step c — binary decision:
    #   • fused score must clear the confidence threshold, AND
    #   • thermal must independently clear its own gate
    #     (prevents pressure/audio alone from triggering false positives)
    leak_detected = (
        leak_confidence    >= LEAK_CONFIDENCE_THRESHOLD
        and thermal_confidence >= THERMAL_THRESHOLD
    )

    # Step d — return enriched sample (original keys preserved)
    return {
        **sample,
        "leak_confidence": float(leak_confidence),
        "leak_detected":   bool(leak_detected),
    }
