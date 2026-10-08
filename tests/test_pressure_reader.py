"""
tests/test_pressure_reader.py
------------------------------
Minimal unit tests for sensors/pressure_reader.py.

Tests verify:
1.  Correct hPa → Pa conversion formula: (P1 - P2) * 100
2.  Correct P1 - P2 subtraction
3.  Correct baseline subtraction of 50.80 Pa
4.  Returned dict contains all required fields
5.  Mock mode source field is "mock" (not "hardware" or "live")
6.  Hardware mode raises PressureHardwareError on a dev laptop (no RPi libs)
7.  Mock mode with missing fixture raises PressureConfigError
8.  All three fixture scenarios produce valid output
9.  Thermal functionality is not imported or disturbed by this module

Run:
    python -m pytest tests/test_pressure_reader.py -v
or:
    python tests/test_pressure_reader.py
"""

import sys
import os

# Ensure the project root is on the path regardless of where pytest is invoked
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from sensors.pressure_reader import (
    read_pressure_data,
    _calculate_delta_p,
    MODE_MOCK,
    MODE_HARDWARE,
    MOCK_FIXTURE_NORMAL,
    MOCK_FIXTURE_LEAK,
    MOCK_FIXTURE_POST_REPAIR,
    BASELINE_OFFSET_PA,
    PressureHardwareError,
    PressureConfigError,
)

REQUIRED_FIELDS = {
    "source",
    "label",
    "p1_hpa",
    "p2_hpa",
    "t1_c",
    "t2_c",
    "raw_delta_p_pa",
    "corrected_delta_p_pa",
}


# ---------------------------------------------------------------------------
# 1. hPa → Pa conversion (raw_delta_p_pa)
# ---------------------------------------------------------------------------

def test_hpa_to_pa_conversion_normal():
    """(1004.20 - 1004.00) * 100 == 20.0 Pa"""
    result = _calculate_delta_p(p1_hpa=1004.20, p2_hpa=1004.00)
    assert abs(result["raw_delta_p_pa"] - 20.0) < 1e-6, (
        f"Expected raw_delta_p_pa=20.0, got {result['raw_delta_p_pa']}"
    )


def test_hpa_to_pa_conversion_leak():
    """(1005.10 - 1003.80) * 100 == 130.0 Pa"""
    result = _calculate_delta_p(p1_hpa=1005.10, p2_hpa=1003.80)
    assert abs(result["raw_delta_p_pa"] - 130.0) < 1e-6, (
        f"Expected raw_delta_p_pa=130.0, got {result['raw_delta_p_pa']}"
    )


# ---------------------------------------------------------------------------
# 2. P1 - P2 subtraction (sign and direction)
# ---------------------------------------------------------------------------

def test_p1_minus_p2_positive():
    """When P1 > P2, raw_delta_p_pa must be positive."""
    result = _calculate_delta_p(p1_hpa=1005.0, p2_hpa=1003.0)
    assert result["raw_delta_p_pa"] > 0


def test_p1_minus_p2_negative():
    """When P1 < P2, raw_delta_p_pa must be negative."""
    result = _calculate_delta_p(p1_hpa=1003.0, p2_hpa=1005.0)
    assert result["raw_delta_p_pa"] < 0


def test_p1_minus_p2_zero():
    """When P1 == P2, raw_delta_p_pa must be 0.0."""
    result = _calculate_delta_p(p1_hpa=1004.0, p2_hpa=1004.0)
    assert abs(result["raw_delta_p_pa"]) < 1e-6


# ---------------------------------------------------------------------------
# 3. Baseline subtraction (corrected_delta_p_pa = raw - 50.80)
# ---------------------------------------------------------------------------

def test_baseline_subtraction_normal():
    """(1004.20 - 1004.00) * 100 - 50.80 == -30.80 Pa"""
    result = _calculate_delta_p(p1_hpa=1004.20, p2_hpa=1004.00)
    expected_corrected = 20.0 - BASELINE_OFFSET_PA   # == -30.80
    assert abs(result["corrected_delta_p_pa"] - expected_corrected) < 1e-6, (
        f"Expected corrected_delta_p_pa={expected_corrected}, got {result['corrected_delta_p_pa']}"
    )


def test_baseline_subtraction_leak():
    """(1005.10 - 1003.80) * 100 - 50.80 == 79.20 Pa"""
    result = _calculate_delta_p(p1_hpa=1005.10, p2_hpa=1003.80)
    expected_corrected = 130.0 - BASELINE_OFFSET_PA  # == 79.20
    assert abs(result["corrected_delta_p_pa"] - expected_corrected) < 1e-6, (
        f"Expected corrected_delta_p_pa={expected_corrected}, got {result['corrected_delta_p_pa']}"
    )


def test_baseline_constant_is_correct():
    """BASELINE_OFFSET_PA must be exactly 50.80."""
    assert BASELINE_OFFSET_PA == 50.80


# ---------------------------------------------------------------------------
# 4. Required fields present in returned dict
# ---------------------------------------------------------------------------

def test_required_fields_normal_fixture():
    result = read_pressure_data(mode=MODE_MOCK, mock_fixture=MOCK_FIXTURE_NORMAL)
    missing = REQUIRED_FIELDS - result.keys()
    assert not missing, f"Missing fields: {missing}"


def test_required_fields_leak_fixture():
    result = read_pressure_data(mode=MODE_MOCK, mock_fixture=MOCK_FIXTURE_LEAK)
    missing = REQUIRED_FIELDS - result.keys()
    assert not missing, f"Missing fields: {missing}"


def test_required_fields_repair_fixture():
    result = read_pressure_data(mode=MODE_MOCK, mock_fixture=MOCK_FIXTURE_POST_REPAIR)
    missing = REQUIRED_FIELDS - result.keys()
    assert not missing, f"Missing fields: {missing}"


# ---------------------------------------------------------------------------
# 5. Mock mode source field identification
# ---------------------------------------------------------------------------

def test_mock_source_is_mock():
    """source field must be 'mock', not 'hardware' or 'live'."""
    result = read_pressure_data(mode=MODE_MOCK, mock_fixture=MOCK_FIXTURE_NORMAL)
    assert result["source"] == "mock", (
        f"Expected source='mock', got '{result['source']}'"
    )
    assert result["source"] != "hardware"
    assert result["source"] != "live"


def test_mock_label_matches_fixture():
    """label must match the fixture's label string."""
    result = read_pressure_data(mode=MODE_MOCK, mock_fixture=MOCK_FIXTURE_NORMAL)
    assert result["label"] == MOCK_FIXTURE_NORMAL["label"]


# ---------------------------------------------------------------------------
# 6. Hardware mode raises PressureHardwareError on dev laptop
# ---------------------------------------------------------------------------

def test_hardware_mode_raises_on_dev_laptop():
    """
    On a development laptop without smbus2/bmp280, hardware mode must
    raise PressureHardwareError immediately — no silent fallback.
    """
    with pytest.raises(PressureHardwareError):
        read_pressure_data(mode=MODE_HARDWARE)


# ---------------------------------------------------------------------------
# 7. Missing fixture raises PressureConfigError
# ---------------------------------------------------------------------------

def test_mock_without_fixture_raises():
    with pytest.raises(PressureConfigError):
        read_pressure_data(mode=MODE_MOCK, mock_fixture=None)


def test_mock_with_incomplete_fixture_raises():
    with pytest.raises(PressureConfigError):
        read_pressure_data(mode=MODE_MOCK, mock_fixture={"p1_hpa": 1004.0})  # missing keys


# ---------------------------------------------------------------------------
# 8. All three fixture scenarios produce valid numeric output
# ---------------------------------------------------------------------------

def test_all_fixtures_produce_numeric_output():
    for fixture in [MOCK_FIXTURE_NORMAL, MOCK_FIXTURE_LEAK, MOCK_FIXTURE_POST_REPAIR]:
        result = read_pressure_data(mode=MODE_MOCK, mock_fixture=fixture)
        assert isinstance(result["raw_delta_p_pa"], float)
        assert isinstance(result["corrected_delta_p_pa"], float)
        assert isinstance(result["p1_hpa"], float)
        assert isinstance(result["p2_hpa"], float)


# ---------------------------------------------------------------------------
# 9. Thermal module is not disturbed
# ---------------------------------------------------------------------------

def test_thermal_module_importable():
    """sensors/thermal_reader.py must still be importable after pressure changes."""
    try:
        from sensors import thermal_reader  # noqa: F401
        assert hasattr(thermal_reader, "analyze"), "thermal_reader.analyze() must still exist"
    except ImportError as exc:
        pytest.fail(f"thermal_reader import failed: {exc}")


# ---------------------------------------------------------------------------
# Run as standalone script
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    tests = [
        test_hpa_to_pa_conversion_normal,
        test_hpa_to_pa_conversion_leak,
        test_p1_minus_p2_positive,
        test_p1_minus_p2_negative,
        test_p1_minus_p2_zero,
        test_baseline_subtraction_normal,
        test_baseline_subtraction_leak,
        test_baseline_constant_is_correct,
        test_required_fields_normal_fixture,
        test_required_fields_leak_fixture,
        test_required_fields_repair_fixture,
        test_mock_source_is_mock,
        test_mock_label_matches_fixture,
        test_hardware_mode_raises_on_dev_laptop,
        test_mock_without_fixture_raises,
        test_mock_with_incomplete_fixture_raises,
        test_all_fixtures_produce_numeric_output,
        test_thermal_module_importable,
    ]

    passed = failed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {t.__name__}: {e}")
            failed += 1

    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed out of {len(tests)} tests")
    if failed > 0:
        sys.exit(1)
