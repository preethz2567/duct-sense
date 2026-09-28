"""
backend/main.py
---------------
DuctSense FastAPI Sync Service.

Exposes two endpoints:
    POST /walkthroughs  — receive and persist a walkthrough report
    GET  /walkthroughs  — return all stored walkthrough reports

Database: backend/sync.db (SQLite, created automatically on first run)

Usage:
    python backend/main.py
    # then open http://localhost:8000/docs for the interactive API explorer
"""

import json
import os
import sqlite3
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Database setup ────────────────────────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(__file__), "sync.db")


def _get_connection() -> sqlite3.Connection:
    """Open (or create) the sync SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    """Create the walkthroughs table if it does not already exist."""
    conn = _get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS walkthroughs (
                walkthrough_id TEXT PRIMARY KEY,
                date           TEXT,
                events_json    TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS findings (
                finding_id      TEXT PRIMARY KEY,
                inspection_id   TEXT,
                floor_plan_id   TEXT,
                floor_plan_page INTEGER,
                finding_type    TEXT,
                x               REAL,
                y               REAL,
                created_at      TEXT,
                updated_at      TEXT,
                photo           TEXT,
                notes           TEXT,
                status          TEXT,
                sync_status     TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


# ── Lifespan (replaces deprecated @app.on_event) ─────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_db()
    yield


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="DuctSense Sync Service",
    description="Receives and serves HVAC duct walkthrough reports.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow all origins — POC only, no authentication required
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class LeakEvent(BaseModel):
    """A single leak-detection event from a sensor walkthrough."""
    position_m:               float
    leak_confidence:          float
    timestamp:                float
    # Sensor-evidence fields — present in new walkthroughs, None in legacy ones.
    thermal_confidence:       Optional[float] = None
    pressure_differential_pa: Optional[float] = None
    normalized_pressure:      Optional[float] = None
    audio_confidence:         Optional[float] = None


class WalkthroughReport(BaseModel):
    """A complete walkthrough session report containing zero or more leak events."""
    walkthrough_id: str
    date:           str
    events:         List[LeakEvent]

class Finding(BaseModel):
    finding_id: str
    inspection_id: str
    floor_plan_id: str
    floor_plan_page: int
    finding_type: str
    x: float
    y: float
    created_at: str
    updated_at: str
    photo: Optional[str] = None
    notes: str
    status: str
    sync_status: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post(
    "/walkthroughs",
    status_code=201,
    summary="Submit a walkthrough report",
    response_description="Confirmation message with the walkthrough_id",
)
def post_walkthrough(report: WalkthroughReport) -> dict:
    """
    Receive a WalkthroughReport and persist it to the local SQLite database.

    - If a report with the same **walkthrough_id** already exists it will be
      replaced (upsert behaviour via INSERT OR REPLACE).
    - The events list is serialised to a JSON string for storage.
    """
    events_json = json.dumps([e.model_dump() for e in report.events])

    conn = _get_connection()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO walkthroughs (walkthrough_id, date, events_json)
            VALUES (?, ?, ?)
            """,
            (report.walkthrough_id, report.date, events_json),
        )
        conn.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        conn.close()

    return {
        "message": "Walkthrough report stored successfully.",
        "walkthrough_id": report.walkthrough_id,
    }


@app.get(
    "/walkthroughs",
    summary="Retrieve all walkthrough reports",
    response_description="List of all stored walkthrough reports",
)
def get_walkthroughs() -> List[dict]:
    """
    Return every stored walkthrough report as a JSON array.

    The **events_json** column is deserialised back into a list of
    LeakEvent-shaped objects before returning.
    """
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "SELECT walkthrough_id, date, events_json FROM walkthroughs"
        )
        rows = cursor.fetchall()
    finally:
        conn.close()

    return [
        {
            "walkthrough_id": row["walkthrough_id"],
            "date":           row["date"],
            "events":         json.loads(row["events_json"]),
        }
        for row in rows
    ]


@app.post(
    "/findings",
    status_code=201,
    summary="Submit a field finding",
)
def post_finding(finding: Finding) -> dict:
    conn = _get_connection()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO findings 
            (finding_id, inspection_id, floor_plan_id, floor_plan_page, finding_type, x, y, created_at, updated_at, photo, notes, status, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                finding.finding_id, finding.inspection_id, finding.floor_plan_id, finding.floor_plan_page,
                finding.finding_type, finding.x, finding.y, finding.created_at, finding.updated_at,
                finding.photo, finding.notes, finding.status, finding.sync_status
            ),
        )
        conn.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        conn.close()

    return {"message": "Finding stored successfully", "finding_id": finding.finding_id}


@app.get(
    "/findings",
    summary="Retrieve all findings",
)
def get_findings() -> List[dict]:
    conn = _get_connection()
    try:
        cursor = conn.execute("SELECT * FROM findings")
        rows = cursor.fetchall()
    finally:
        conn.close()

    return [dict(row) for row in rows]


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
