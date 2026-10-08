"""
sensors/pressure_reader.py
--------------------------
DuctSense BMP280 dual-sensor pressure reader.

Hardware:
    BMP280 #1 at I2C address 0x76 → P1 (upstream)
    BMP280 #2 at I2C address 0x77 → P2 (downstream)
    I2C bus 1 (Raspberry Pi GPIO)

Differential pressure formula (preserved from teammate implementation):
    raw_delta_p_pa = (p1_hpa - p2_hpa) * 100      # hPa → Pa
    corrected_delta_p_pa = raw_delta_p_pa - BASELINE_OFFSET_PA

Two operating modes (must be selected explicitly — no silent fallback):
    MODE_HARDWARE : reads live BMP280 sensors via smbus2 / bmp280
    MODE_MOCK     : uses explicitly-supplied fixture values (for software testing)

Usage (hardware mode — requires Raspberry Pi + BMP280):
    from sensors.pressure_reader import read_pressure_data, MODE_HARDWARE
    data = read_pressure_data(mode=MODE_HARDWARE)

Usage (mock/test mode — works on any machine):
    from sensors.pressure_reader import read_pressure_data, MODE_MOCK, MOCK_FIXTURE_NORMAL
    data = read_pressure_data(mode=MODE_MOCK, mock_fixture=MOCK_FIXTURE_NORMAL)

IMPORTANT:
    This module does NOT silently fall back from hardware to mock mode.
    If hardware mode is requested but the hardware libraries / bus are
    unavailable, a clear PressureHardwareError is raised.

    Mock mode is for SOFTWARE TESTING ONLY.
    Mock fixture values are NOT live sensor measurements.
"""

# ---------------------------------------------------------------------------
# Constants (preserved from teammate implementation — do NOT change)
# ---------------------------------------------------------------------------

I2C_BUS          = 1       # Raspberry Pi GPIO I2C bus
ADDR_BMP280_P1   = 0x76   # upstream sensor
ADDR_BMP280_P2   = 0x77   # downstream sensor

BASELINE_OFFSET_PA = 50.80  # Pa — prototype baseline correction carried over from the reported teammate implementation (not independently validated)

# Mode identifiers (pass one of these to read_pressure_data())
MODE_HARDWARE = "hardware"
MODE_MOCK     = "mock"


# ---------------------------------------------------------------------------
# Software test fixtures
# Three deterministic scenarios for unit tests and API smoke tests.
# These are NOT live sensor measurements.
# ---------------------------------------------------------------------------

MOCK_FIXTURE_NORMAL: dict = {
    # Typical baseline condition — both sensors reading nearly identical pressures.
    # Expected corrected_delta_p_pa = (1004.20 - 1004.00) * 100 - 50.80 = -30.80 Pa
    "label":    "NORMAL_CONDITION",
    "p1_hpa":   1004.20,
    "p2_hpa":   1004.00,
    "t1_c":     30.5,
    "t2_c":     30.1,
}

MOCK_FIXTURE_LEAK: dict = {
    # Controlled-leak-like condition — elevated differential.
    # Expected corrected_delta_p_pa = (1005.10 - 1003.80) * 100 - 50.80 = 79.20 Pa
    "label":    "CONTROLLED_LEAK_LIKE_CONDITION",
    "p1_hpa":   1005.10,
    "p2_hpa":   1003.80,
    "t1_c":     31.2,
    "t2_c":     30.4,
}

MOCK_FIXTURE_POST_REPAIR: dict = {
    # Post-repair condition — raw differential (P1-P2) is small,
    # but after applying the 50.80 Pa baseline correction the result is -45.80 Pa.
    # Expected: raw_delta_p_pa = (1004.05 - 1004.00) * 100 = 5.0 Pa
    #           corrected_delta_p_pa = 5.0 - 50.80 = -45.80 Pa
    "label":    "POST_REPAIR_CONDITION",
    "p1_hpa":   1004.05,
    "p2_hpa":   1004.00,
    "t1_c":     30.2,
    "t2_c":     30.0,
}


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class PressureHardwareError(RuntimeError):
    """Raised when hardware mode is requested but hardware is unavailable."""


class PressureConfigError(ValueError):
    """Raised for configuration mistakes (e.g. missing mock_fixture)."""


# ---------------------------------------------------------------------------
# Internal: ΔP calculation (formula-only, no hardware dependency)
# ---------------------------------------------------------------------------

def _calculate_delta_p(p1_hpa: float, p2_hpa: float) -> dict:
    """
    Calculate raw and baseline-corrected differential pressure.

    Parameters
    ----------
    p1_hpa : float
        Upstream pressure reading in hPa (BMP280 #1, address 0x76).
    p2_hpa : float
        Downstream pressure reading in hPa (BMP280 #2, address 0x77).

    Returns
    -------
    dict with keys:
        raw_delta_p_pa        (float) — (P1 - P2) × 100
        corrected_delta_p_pa  (float) — raw_delta_p_pa - BASELINE_OFFSET_PA
    """
    raw_delta_p_pa       = (p1_hpa - p2_hpa) * 100.0
    corrected_delta_p_pa = raw_delta_p_pa - BASELINE_OFFSET_PA
    return {
        "raw_delta_p_pa":       round(raw_delta_p_pa,       4),
        "corrected_delta_p_pa": round(corrected_delta_p_pa, 4),
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def read_pressure_data(
    mode: str = MODE_MOCK,
    mock_fixture: dict | None = None,
) -> dict:
    """
    Read dual-BMP280 pressure data and return a structured result.

    Parameters
    ----------
    mode : str
        One of MODE_HARDWARE or MODE_MOCK.
        Default is MODE_MOCK (safe for development without hardware).

    mock_fixture : dict or None
        Required when mode == MODE_MOCK.
        Must contain keys: p1_hpa, p2_hpa, t1_c, t2_c.
        Use one of the MOCK_FIXTURE_* constants, or supply your own dict.

    Returns
    -------
    dict with keys:
        source                (str)   — "hardware" or "mock"
        label                 (str)   — fixture label (mock only) or "live"
        p1_hpa                (float) — upstream pressure in hPa
        p2_hpa                (float) — downstream pressure in hPa
        t1_c                  (float) — upstream temperature in °C
        t2_c                  (float) — downstream temperature in °C
        raw_delta_p_pa        (float) — (P1 − P2) × 100 in Pa
        corrected_delta_p_pa  (float) — raw_delta_p_pa − 50.80 Pa

    Raises
    ------
    PressureHardwareError
        If mode == MODE_HARDWARE but smbus2 or bmp280 are unavailable,
        or if the I2C bus cannot be opened.
    PressureConfigError
        If mode == MODE_MOCK but mock_fixture is None.
    ValueError
        If mode is not a recognised value.
    """

    if mode == MODE_MOCK:
        return _read_mock(mock_fixture)
    elif mode == MODE_HARDWARE:
        return _read_hardware()
    else:
        raise ValueError(
            f"Unknown mode '{mode}'. Use MODE_HARDWARE or MODE_MOCK."
        )


def _read_mock(mock_fixture: dict | None) -> dict:
    """Return a mock pressure reading using an explicit fixture."""
    if mock_fixture is None:
        raise PressureConfigError(
            "mock_fixture must be provided when using MODE_MOCK. "
            "Use one of: MOCK_FIXTURE_NORMAL, MOCK_FIXTURE_LEAK, MOCK_FIXTURE_POST_REPAIR."
        )

    required_keys = {"p1_hpa", "p2_hpa", "t1_c", "t2_c"}
    missing = required_keys - mock_fixture.keys()
    if missing:
        raise PressureConfigError(f"mock_fixture is missing required keys: {missing}")

    p1_hpa = float(mock_fixture["p1_hpa"])
    p2_hpa = float(mock_fixture["p2_hpa"])
    t1_c   = float(mock_fixture["t1_c"])
    t2_c   = float(mock_fixture["t2_c"])

    dp = _calculate_delta_p(p1_hpa, p2_hpa)

    return {
        "source":               "mock",
        "label":                mock_fixture.get("label", "UNNAMED_FIXTURE"),
        "p1_hpa":               p1_hpa,
        "p2_hpa":               p2_hpa,
        "t1_c":                 t1_c,
        "t2_c":                 t2_c,
        "raw_delta_p_pa":       dp["raw_delta_p_pa"],
        "corrected_delta_p_pa": dp["corrected_delta_p_pa"],
    }


def _read_hardware() -> dict:
    """
    Read live data from two BMP280 sensors on the I2C bus.

    This will raise PressureHardwareError clearly if:
    - smbus2 is not installed
    - bmp280 library is not installed
    - The I2C bus cannot be opened
    - Either sensor address does not respond
    """
    try:
        import smbus2                          # type: ignore[import]
    except ImportError as exc:
        raise PressureHardwareError(
            "Hardware mode requires 'smbus2'. Install it on the Raspberry Pi: "
            "pip install smbus2"
        ) from exc

    try:
        from bmp280 import BMP280              # type: ignore[import]
    except ImportError as exc:
        raise PressureHardwareError(
            "Hardware mode requires 'bmp280'. Install it on the Raspberry Pi: "
            "pip install bmp280"
        ) from exc

    try:
        bus = smbus2.SMBus(I2C_BUS)
    except Exception as exc:
        raise PressureHardwareError(
            f"Could not open I2C bus {I2C_BUS}. "
            "Ensure you are running on a Raspberry Pi with I2C enabled."
        ) from exc

    try:
        sensor1 = BMP280(i2c_dev=bus, i2c_addr=ADDR_BMP280_P1)
        sensor2 = BMP280(i2c_dev=bus, i2c_addr=ADDR_BMP280_P2)

        p1_hpa = sensor1.get_pressure()
        t1_c   = sensor1.get_temperature()
        p2_hpa = sensor2.get_pressure()
        t2_c   = sensor2.get_temperature()
    except Exception as exc:
        raise PressureHardwareError(
            f"Failed to read BMP280 sensors from I2C bus {I2C_BUS}. "
            f"Check physical connections and I2C addresses. Details: {exc}"
        ) from exc
    finally:
        bus.close()

    dp = _calculate_delta_p(p1_hpa, p2_hpa)

    return {
        "source":               "hardware",
        "label":                "live",
        "p1_hpa":               round(p1_hpa, 4),
        "p2_hpa":               round(p2_hpa, 4),
        "t1_c":                 round(t1_c, 2),
        "t2_c":                 round(t2_c, 2),
        "raw_delta_p_pa":       dp["raw_delta_p_pa"],
        "corrected_delta_p_pa": dp["corrected_delta_p_pa"],
    }
