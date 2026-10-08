"""
pressure_test_api.py
--------------------
Isolated FastAPI service for software-testing the DuctSense BMP280
pressure sensor module.

This service is COMPLETELY SEPARATE from backend/main.py.
It does NOT modify, import from, or interfere with the main DuctSense backend.

Port: 8002  (distinct from backend:8000 and thermal_test_api:8001)

Because the Raspberry Pi and BMP280 hardware are currently DISCONNECTED,
this service returns mock/fixture data.

The "source" field in every response is explicitly set to "mock" so that
no caller can mistake this for live hardware data.

Endpoints:
    GET /health          — liveness check
    GET /pressure/read   — return mock pressure reading (NORMAL fixture)
    GET /pressure/read?scenario=normal    — normal condition fixture
    GET /pressure/read?scenario=leak      — controlled-leak-like fixture
    GET /pressure/read?scenario=repair    — post-repair fixture

Usage:
    python -m uvicorn pressure_test_api:app --host 0.0.0.0 --port 8002
    # or:
    python pressure_test_api.py
"""

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from sensors.pressure_reader import (
    read_pressure_data,
    MODE_MOCK,
    MOCK_FIXTURE_NORMAL,
    MOCK_FIXTURE_LEAK,
    MOCK_FIXTURE_POST_REPAIR,
)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="DuctSense Pressure Test API",
    description=(
        "Isolated software test API for the BMP280 dual-pressure sensor module. "
        "Live BMP280 hardware is NOT connected in this phase. "
        "All responses use explicit mock/fixture data and are clearly marked source=mock."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Scenario map
# ---------------------------------------------------------------------------

_FIXTURES = {
    "normal": MOCK_FIXTURE_NORMAL,
    "leak":   MOCK_FIXTURE_LEAK,
    "repair": MOCK_FIXTURE_POST_REPAIR,
}

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", summary="Liveness check")
def health() -> dict:
    """Simple liveness check — returns 200 if the API process is running."""
    return {
        "status": "ok",
        "service": "pressure_test_api",
        "hardware_connected": False,
        "note": "Live BMP280 hardware is NOT connected in Phase 1. Mock data only.",
    }


@app.get(
    "/pressure/read",
    summary="Read mock BMP280 pressure data",
    response_description="Mock dual-BMP280 pressure reading",
)
def get_pressure_read(
    scenario: str = Query(
        default="normal",
        description=(
            "Which mock fixture to use. "
            "Options: 'normal' (baseline), 'leak' (controlled-leak-like), 'repair' (post-repair)."
        ),
    )
) -> dict:
    """
    Return a mock BMP280 dual-sensor pressure reading.

    Because the Raspberry Pi and BMP280 sensors are currently disconnected,
    this endpoint uses deterministic software fixture data.

    The 'source' field is always 'mock' — it will never read 'hardware' or 'live'
    until Phase 2 hardware integration is approved and tested.

    The differential pressure formulas applied are the authoritative ones:
        raw_delta_p_pa       = (p1_hpa - p2_hpa) × 100
        corrected_delta_p_pa = raw_delta_p_pa − 50.80

    These are NOT invented values — they are calculated from the fixture
    inputs using the exact same formula as the hardware path.
    """
    fixture = _FIXTURES.get(scenario.lower())
    if fixture is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{scenario}'. Valid options: {list(_FIXTURES.keys())}",
        )

    result = read_pressure_data(mode=MODE_MOCK, mock_fixture=fixture)
    return result


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("pressure_test_api:app", host="0.0.0.0", port=8002, reload=False)
