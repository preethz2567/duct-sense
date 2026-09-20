"""
storage.py
----------
SQLite-backed persistence layer for DuctSense leak events.

Only leak-detected samples are persisted; clean-pass samples are not stored.

Schema
------
    events (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        walkthrough_id          TEXT,
        timestamp               REAL,
        position_m              REAL,
        leak_confidence         REAL,
        thermal_confidence      REAL,
        pressure_differential_pa REAL,
        audio_confidence        REAL
    )
"""

import sqlite3
import uuid
import os

# ---------------------------------------------------------------------------
# Database path — relative to the repository root so the file lands in docs/
# ---------------------------------------------------------------------------
DB_PATH = "docs/ductsense.db"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_connection() -> sqlite3.Connection:
    """Open (or create) the SQLite database and return a connection."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # rows accessible as dicts
    return conn


def _init_db(conn: sqlite3.Connection) -> None:
    """Create the events table if it does not already exist."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id                       INTEGER PRIMARY KEY AUTOINCREMENT,
            walkthrough_id           TEXT,
            timestamp                REAL,
            position_m               REAL,
            leak_confidence          REAL,
            thermal_confidence       REAL,
            pressure_differential_pa REAL,
            audio_confidence         REAL
        )
        """
    )
    conn.commit()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def start_walkthrough() -> str:
    """
    Generate and return a new unique walkthrough ID.

    Also ensures the database and schema exist before any events are logged.

    Returns
    -------
    str
        A UUID4 string that identifies this walkthrough session.
    """
    walkthrough_id = str(uuid.uuid4())
    conn = _get_connection()
    try:
        _init_db(conn)
    finally:
        conn.close()
    return walkthrough_id


def log_event(walkthrough_id: str, fused_sample: dict) -> None:
    """
    Persist one leak event row to the database.

    Only call this function when fused_sample["leak_detected"] is True.

    Parameters
    ----------
    walkthrough_id : str
        The ID returned by start_walkthrough() for the current session.
    fused_sample : dict
        A fused sample dict produced by core.fusion_logic.fuse(), expected
        to contain: timestamp, position_m, leak_confidence,
        thermal_confidence, pressure_differential_pa, audio_confidence.
    """
    conn = _get_connection()
    try:
        _init_db(conn)
        conn.execute(
            """
            INSERT INTO events (
                walkthrough_id,
                timestamp,
                position_m,
                leak_confidence,
                thermal_confidence,
                pressure_differential_pa,
                audio_confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                walkthrough_id,
                fused_sample["timestamp"],
                fused_sample["position_m"],
                fused_sample["leak_confidence"],
                fused_sample["thermal_confidence"],
                fused_sample["pressure_differential_pa"],
                fused_sample["audio_confidence"],
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_events_for_walkthrough(walkthrough_id: str) -> list[dict]:
    """
    Retrieve all logged leak events for a given walkthrough, sorted by position.

    Parameters
    ----------
    walkthrough_id : str
        The walkthrough session ID to query.

    Returns
    -------
    list[dict]
        List of event rows as plain dicts, ordered by position_m ascending.
        Each dict contains: id, walkthrough_id, timestamp, position_m,
        leak_confidence, thermal_confidence, pressure_differential_pa,
        audio_confidence.
    """
    conn = _get_connection()
    try:
        _init_db(conn)
        cursor = conn.execute(
            """
            SELECT *
            FROM   events
            WHERE  walkthrough_id = ?
            ORDER  BY position_m ASC
            """,
            (walkthrough_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()
