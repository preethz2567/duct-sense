"""
report_generator.py
-------------------
Generates a Markdown-formatted leak report for a completed walkthrough.
"""

from storage.storage import get_events_for_walkthrough


def generate_report(walkthrough_id: str) -> str:
    """
    Build and return a Markdown report for a given walkthrough session.

    Fetches all leak events from the database (sorted by position ascending)
    and formats them as a Markdown document with a summary line and a table.

    Parameters
    ----------
    walkthrough_id : str
        The walkthrough session ID (returned by start_walkthrough()).

    Returns
    -------
    str
        A Markdown-formatted report string ready to print or write to a file.
    """
    events = get_events_for_walkthrough(walkthrough_id)
    total  = len(events)

    lines = [
        f"# DuctSense Walkthrough Report",
        f"",
        f"**Walkthrough ID:** `{walkthrough_id}`",
        f"",
        f"**Total leak events detected:** {total}",
        f"",
    ]

    if total == 0:
        lines.append("_No leaks detected during this walkthrough._")
    else:
        # Markdown table
        lines.append("| Position (m) | Confidence | Timestamp (s) |")
        lines.append("|:------------:|:----------:|:-------------:|")
        for event in events:
            lines.append(
                f"| {event['position_m']:.3f}"
                f" | {event['leak_confidence']:.2f}"
                f" | {event['timestamp']:.1f} |"
            )

    return "\n".join(lines) + "\n"
