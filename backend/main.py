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
from typing import List

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
    position_m:       float
    leak_confidence:  float
    timestamp:        float


class WalkthroughReport(BaseModel):
    """A complete walkthrough session report containing zero or more leak events."""
    walkthrough_id: str
    date:           str
    events:         List[LeakEvent]


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


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
