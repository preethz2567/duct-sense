"""
alert.py
--------
Alert-triggering functions for the DuctSense pipeline.

- trigger_console_alert  : prints a formatted alert to stdout
- trigger_hardware_alert : stub for future Raspberry Pi GPIO integration
"""


def trigger_console_alert(fused_sample: dict) -> None:
    """
    Print a formatted leak alert to the console if a leak has been detected.

    Parameters
    ----------
    fused_sample : dict
        A fused sample dict (output of fusion_logic.fuse), expected to contain:
            - leak_detected    (bool)
            - position_m       (float)
            - leak_confidence  (float)
            - timestamp        (float)

    Output format (only printed when leak_detected is True):
        [ALERT] Leak detected at position {position_m}m | confidence: {leak_confidence:.2f} | timestamp: {timestamp:.1f}s
    """
    if fused_sample["leak_detected"]:
        print(
            f"[ALERT] Leak detected at position {fused_sample['position_m']:.3f}m"
            f" | confidence: {fused_sample['leak_confidence']:.2f}"
            f" | timestamp: {fused_sample['timestamp']:.1f}s"
        )


def trigger_hardware_alert(fused_sample: dict) -> None:
    """
    Trigger a physical hardware alert (buzzer / LED) on the Raspberry Pi.

    Parameters
    ----------
    fused_sample : dict
        A fused sample dict (output of fusion_logic.fuse).
    """
    # TODO: wire to Raspberry Pi GPIO buzzer/LED once hardware confirmed
    pass
