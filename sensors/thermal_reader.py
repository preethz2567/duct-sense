"""
thermal_reader.py
DuctSense thermal module, FLIR E95, model v2-lr (Logistic Regression)

One radiometric E95 still -> one result dict out.

Model:  models/thermal/thermal_model.joblib  (LogisticRegression, sklearn)
Scaler: models/thermal/thermal_scaler.joblib (StandardScaler, sklearn)
Both trained on 97 real FLIR E95 images (51 leak / 46 no_leak) captured
on our own duct setup.

Usage:
    from thermal_reader import analyze
    result = analyze("FLIR0142.jpg")

Backward compatible:
    from thermal_reader import get_thermal_confidence
    conf = get_thermal_confidence("FLIR0142.jpg")

Command line:
    python thermal_reader.py FLIR0142.jpg
    python thermal_reader.py --check FLIR0142.jpg

IMPORTANT:
- Use the ORIGINAL .jpg from the camera.
- Screenshots, phone photos and WhatsApp-compressed copies
  do not contain the original temperature data.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from PIL import Image, ImageDraw


# -----------------------------------------------------------------------------
# Constants that define the model contract
# -----------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[1]

MODEL_PATH  = REPO_ROOT / "models" / "thermal" / "thermal_model.joblib"
SCALER_PATH = REPO_ROOT / "models" / "thermal" / "thermal_scaler.joblib"

MODEL_VERSION = "v2-lr"

# Fixed temperature window used for the overlay image only.
TEMP_WINDOW_C = (15.0, 45.0)

# The exact feature order the scaler and model were trained on.
# DO NOT reorder — must match ml-training/thermal/train.py ::FEATURE_NAMES.
FEATURE_NAMES = [
    "max_temp_c",
    "mean_temp_c",
    "temp_range_c",
    "temp_std_c",
    "delta_from_background_c",
    "hot_pixel_fraction",
]

# Threshold above which a pixel counts as "notably hot" relative to background.
HOT_PIXEL_THRESHOLD_C = 2.0


# -----------------------------------------------------------------------------
# Analysis / quality thresholds
# -----------------------------------------------------------------------------

E95_EXPECTED_SHAPE = (348, 464)

LOW_CONTRAST_RANGE_C = 2.0

OUT_OF_WINDOW_FRACTION = 0.20

SMOOTH_PIXELS = 5


# -----------------------------------------------------------------------------
# 1. Read the temperature array from the radiometric JPEG
# -----------------------------------------------------------------------------

def extract_temperature_array(jpeg_path) -> np.ndarray:
    """
    Returns a 2D float32 array of temperatures in degrees Celsius.

    Tries flyr first, then flirimageextractor.
    """

    jpeg_path = str(jpeg_path)

    errors = []

    # Try flyr first
    try:
        import flyr

        temps = np.asarray(
            flyr.unpack(jpeg_path).celsius,
            dtype=np.float32
        )

        if temps.ndim == 2:
            return temps

        errors.append(
            f"flyr returned array with shape {temps.shape}"
        )

    except Exception as e:
        errors.append(f"flyr: {e}")

    # Try flirimageextractor second
    try:
        from flirimageextractor import FlirImageExtractor

        extractor = FlirImageExtractor()

        extractor.process_image(jpeg_path)

        temps = np.asarray(
            extractor.get_thermal_np(),
            dtype=np.float32
        )

        if temps.ndim == 2:
            return temps

        errors.append(
            "flirimageextractor returned "
            f"array with shape {temps.shape}"
        )

    except Exception as e:
        errors.append(
            f"flirimageextractor: {e}"
        )

    raise RuntimeError(
        f"Could not read temperature data from {jpeg_path}. "
        "Details: "
        + " | ".join(errors)
        + ". "
        "Last-resort fallback: export CSV from FLIR Tools "
        "and read that."
    )


# -----------------------------------------------------------------------------
# 2. Extract the 6 hand-crafted thermal features
# -----------------------------------------------------------------------------

def extract_features(temps: np.ndarray) -> np.ndarray:
    """
    Turn a 2D temperature array into the 6-element feature vector
    expected by the Logistic Regression model.

    Feature order MUST match FEATURE_NAMES and the training script.

    Returns a float32 array of shape (1, 6) ready for scaler.transform().
    """
    background = float(np.median(temps))
    deviation  = temps - background
    hot_mask   = deviation > HOT_PIXEL_THRESHOLD_C

    features = np.array([
        float(temps.max()),                 # max_temp_c
        float(temps.mean()),                # mean_temp_c
        float(temps.max() - temps.min()),   # temp_range_c
        float(temps.std()),                 # temp_std_c
        float(deviation.max()),             # delta_from_background_c
        float(hot_mask.mean()),             # hot_pixel_fraction
    ], dtype=np.float32).reshape(1, -1)

    return features


# -----------------------------------------------------------------------------
# 3. Model loading (lazy, cached)
# -----------------------------------------------------------------------------

_MODEL  = None
_SCALER = None


def _get_model_and_scaler():
    global _MODEL, _SCALER

    if _MODEL is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}\n"
                "Run ml-training/thermal/train.py to generate it."
            )
        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Scaler not found: {SCALER_PATH}\n"
                "Run ml-training/thermal/train.py to generate it."
            )
        _MODEL  = joblib.load(MODEL_PATH)
        _SCALER = joblib.load(SCALER_PATH)

    return _MODEL, _SCALER


# -----------------------------------------------------------------------------
# 4. Model inference
# -----------------------------------------------------------------------------

def run_model(temps: np.ndarray) -> float:
    """
    Given a 2D temperature array, extract features, scale them,
    and return the leak confidence in [0.0, 1.0].
    """
    model, scaler = _get_model_and_scaler()

    features_raw    = extract_features(temps)
    features_scaled = scaler.transform(features_raw)

    # predict_proba returns [[prob_no_leak, prob_leak]]
    confidence = float(model.predict_proba(features_scaled)[0, 1])

    return round(confidence, 4)


# -----------------------------------------------------------------------------
# 5. Physical anomaly analysis
# -----------------------------------------------------------------------------

def _box_smooth(
    a: np.ndarray,
    k: int
) -> np.ndarray:
    """
    Simple k x k mean filter.

    Uses an integral image and keeps the output
    the same size as the input.
    """

    if k <= 1:
        return a

    pad = k // 2

    # Pad the input so the output remains H x W
    p = np.pad(
        a,
        pad,
        mode="edge"
    )

    # Integral image with an extra zero row/column.
    # This makes the rectangle indexing safe.
    c = np.pad(
        np.cumsum(
            np.cumsum(p, axis=0),
            axis=1
        ),
        ((1, 0), (1, 0)),
        mode="constant"
    )

    h, w = a.shape

    # Sum of every k x k window
    s = (
        c[k:h + 2 * pad + 1, k:w + 2 * pad + 1]
        - c[0:h, k:w + 2 * pad + 1]
        - c[k:h + 2 * pad + 1, 0:w]
        + c[0:h, 0:w]
    )

    return (
        s / (k * k)
    ).astype(np.float32)


def analyze_anomaly(
    temps: np.ndarray
) -> dict:
    """
    Background = median temperature of the frame.

    The anomaly is the smoothed pixel that deviates
    most from the background.
    """

    background = float(
        np.median(temps)
    )

    dev = _box_smooth(
        temps - background,
        SMOOTH_PIXELS
    )

    idx = np.unravel_index(
        np.argmax(np.abs(dev)),
        dev.shape
    )

    delta = float(
        dev[idx]
    )

    return {
        "anomaly_delta_c": round(
            delta,
            2
        ),

        "anomaly_type": (
            "warm"
            if delta >= 0
            else "cold"
        ),

        "anomaly_xy": [
            int(idx[1]),
            int(idx[0])
        ],

        "scene_temp_min_c": round(
            float(temps.min()),
            2
        ),

        "scene_temp_max_c": round(
            float(temps.max()),
            2
        ),

        "background_c": round(
            background,
            2
        ),
    }


def quality_flag(
    temps: np.ndarray
) -> str:
    """
    Returns:

        ok
        low_contrast
        out_of_window

    Reflection risk is not automatically detected.
    """

    smooth = _box_smooth(
        temps,
        SMOOTH_PIXELS
    )

    if float(
        smooth.max() - smooth.min()
    ) < LOW_CONTRAST_RANGE_C:

        return "low_contrast"

    lo, hi = TEMP_WINDOW_C

    outside = float(
        np.mean(
            (temps < lo)
            | (temps > hi)
        )
    )

    if outside > OUT_OF_WINDOW_FRACTION:
        return "out_of_window"

    return "ok"


# -----------------------------------------------------------------------------
# 6. Overlay image
# -----------------------------------------------------------------------------

def save_overlay(
    temps: np.ndarray,
    result: dict,
    out_path: Path
) -> None:

    lo, hi = TEMP_WINDOW_C

    gray = (
        np.clip(
            (temps - lo) / (hi - lo),
            0,
            1
        )
        * 255
    ).astype(np.uint8)

    img = Image.fromarray(
        gray
    ).convert("RGB")

    draw = ImageDraw.Draw(img)

    x, y = result["anomaly_xy"]

    r = 22

    draw.rectangle(
        [
            x - r,
            y - r,
            x + r,
            y + r
        ],
        outline=(255, 156, 0),
        width=3
    )

    conf = result["thermal_confidence"]

    if conf is not None:
        label = (
            f"{conf * 100:.0f}% "
            f"{result['anomaly_delta_c']:+.1f}C"
        )
    else:
        label = (
            "n/a "
            f"{result['anomaly_delta_c']:+.1f}C"
        )

    draw.text(
        (
            max(x - r, 2),
            max(y - r - 14, 2)
        ),
        label,
        fill=(255, 156, 0)
    )

    out_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    img.save(out_path)


# -----------------------------------------------------------------------------
# 7. Public API
# -----------------------------------------------------------------------------

def analyze(
    jpeg_path,
    out_dir="out",
    save_overlay_png=True
) -> dict:
    """
    Analyze one original FLIR E95 radiometric JPEG.

    Returns a result dictionary.
    """

    jpeg_path = Path(jpeg_path)

    result = {
        "image_id": jpeg_path.name,
        "source_file": str(jpeg_path),
        "ingested_at": datetime.now().isoformat(
            timespec="seconds"
        ),
        "model_version": MODEL_VERSION,
        "thermal_confidence": None,
        "anomaly_delta_c": None,
        "anomaly_type": None,
        "anomaly_xy": None,
        "scene_temp_min_c": None,
        "scene_temp_max_c": None,
        "background_c": None,
        "quality_flag": "read_error",
        "overlay_png": None,
    }

    # Read thermal data
    try:
        temps = extract_temperature_array(
            jpeg_path
        )

    except Exception as e:
        result["error"] = str(e)
        return result

    # Analyze physical anomaly
    result.update(
        analyze_anomaly(temps)
    )

    # Quality check
    result["quality_flag"] = quality_flag(
        temps
    )

    # Run Logistic Regression model
    try:
        result["thermal_confidence"] = run_model(temps)

    except Exception as e:
        result["quality_flag"] = "model_error"
        result["error"] = str(e)

    # Save overlay
    if save_overlay_png:

        overlay = (
            Path(out_dir)
            / f"{jpeg_path.stem}_overlay.png"
        )

        save_overlay(
            temps,
            result,
            overlay
        )

        result["overlay_png"] = str(
            overlay
        )

    return result


# -----------------------------------------------------------------------------
# Backward-compatible helper
# -----------------------------------------------------------------------------

def get_thermal_confidence(
    jpeg_path
):
    """
    Returns thermal confidence as a float.

    Returns None if the image cannot be read.
    """

    return analyze(
        jpeg_path,
        save_overlay_png=False
    )["thermal_confidence"]


# -----------------------------------------------------------------------------
# Check whether the FLIR file contains real temperature data
# -----------------------------------------------------------------------------

def check_file(
    jpeg_path
) -> int:
    """
    Verify that a file really contains temperature data.

    Returns:
        0 = success
        1 = failure
    """

    try:

        temps = extract_temperature_array(
            jpeg_path
        )

    except Exception as e:

        print(
            f"FAIL: {e}"
        )

        return 1

    print(
        "OK: temperature array read, "
        f"shape (rows, cols) = {temps.shape}"
    )

    print(
        f"    min {temps.min():.1f} C | "
        f"mean {temps.mean():.1f} C | "
        f"max {temps.max():.1f} C"
    )

    if temps.shape != E95_EXPECTED_SHAPE:

        print(
            f"NOTE: E95 sensor is normally "
            f"{E95_EXPECTED_SHAPE}; "
            f"got {temps.shape}. "
            "Check that this is an original E95 IR file."
        )

    if not (
        -20 < temps.min()
        and temps.max() < 400
    ):

        print(
            "WARNING: temperature range looks "
            "implausible; extraction may be wrong."
        )

    return 0


# -----------------------------------------------------------------------------
# Command-line interface
# -----------------------------------------------------------------------------

if __name__ == "__main__":

    args = sys.argv[1:]

    if not args:

        print(__doc__)

        sys.exit(1)

    if args[0] == "--check":

        if len(args) < 2:

            print(
                "Usage: "
                "python thermal_reader.py "
                "--check <image.jpg>"
            )

            sys.exit(1)

        sys.exit(
            check_file(args[1])
        )

    print(
        json.dumps(
            analyze(args[0]),
            indent=2
        )
    )