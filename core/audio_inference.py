"""
core/audio_inference.py
-----------------------
Inference wrapper for the DuctSense binary acoustic leak detection model.

This module reproduces the *exact* feature-extraction pipeline used during
training (ml-training/audio/ductsense_binary_training_v1.ipynb, Cells 2, 14,
and 15) so that runtime predictions are consistent with training-time
predictions.

Public API
----------
load_audio_model()
    Load and cache the model package from disk.  Call once at startup.

predict_audio(audio_path)
    Accept a path to any audio file, convert it to a 16 kHz mono window,
    extract the 30-feature vector, and return a prediction dict:

        {
            "label":            "LEAK" | "NO_LEAK",
            "audio_confidence": <float 0.0–1.0>   # predict_proba[:, 1]
        }

Model contract (verified from models/audio/ductsense_binary_rf_v2_meta.json
and the training notebook):

    Classifier  : sklearn RandomForestClassifier
    Classes     : [0 = NO_LEAK, 1 = LEAK]
    Sample rate : 16 000 Hz
    Window      : 2.0 s  →  32 000 samples
    Features    : 30
      [0..12]   MFCC_1_mean  .. MFCC_13_mean
      [13..25]  MFCC_1_std   .. MFCC_13_std
      [26]      Centroid_mean
      [27]      Centroid_std
      [28]      Bandwidth_mean
      [29]      Bandwidth_std
    MFCC params : n_mfcc=13, n_fft=2048 (librosa default), hop_length=512
                  (librosa default) — NO overrides were used in training.
    Threshold   : 0.70
    .pkl format : joblib dict  →  {"model": <RFC>, "sample_rate": ..., ...}
                  The RandomForestClassifier lives at pkg["model"], NOT at the
                  top level of the file.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import joblib
import librosa
import numpy as np

# ---------------------------------------------------------------------------
# Repository-relative paths
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parent.parent   # …/duct-sense/
_MODEL_PKL  = _REPO_ROOT / "models" / "audio" / "ductsense_binary_rf_v2.pkl"
_MODEL_META = _REPO_ROOT / "models" / "audio" / "ductsense_binary_rf_v2_meta.json"

# ---------------------------------------------------------------------------
# Module-level cache — populated by load_audio_model()
# ---------------------------------------------------------------------------

_model_package: Optional[dict] = None   # full joblib dict (model + metadata)


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def load_audio_model() -> dict:
    """
    Load the audio model package from disk and cache it in memory.

    Returns the complete package dict so callers can inspect metadata if
    needed.  Calling this function more than once is safe; subsequent calls
    return the cached copy without touching disk.

    Raises
    ------
    FileNotFoundError
        If the .pkl file does not exist at its expected location.
    ValueError
        If the .pkl file does not contain the expected dict keys.
    """
    global _model_package

    if _model_package is not None:
        return _model_package

    if not _MODEL_PKL.exists():
        raise FileNotFoundError(
            f"Audio model artifact not found: {_MODEL_PKL}\n"
            "Expected: models/audio/ductsense_binary_rf_v2.pkl"
        )

    pkg = joblib.load(_MODEL_PKL)

    # Validate the bundle contains the keys we depend on.
    required_keys = {"model", "sample_rate", "window_samples", "classes", "threshold"}
    missing = required_keys - set(pkg.keys())
    if missing:
        raise ValueError(
            f"Loaded .pkl package is missing expected keys: {missing}\n"
            f"Found keys: {list(pkg.keys())}"
        )

    # Sanity-check the model is usable.
    if not hasattr(pkg["model"], "predict_proba"):
        raise ValueError(
            "pkg['model'] does not have a predict_proba method.  "
            "The .pkl file may be corrupt or from an incompatible version."
        )

    _model_package = pkg
    return _model_package


def _load_metadata() -> dict:
    """Read the JSON metadata file for informational purposes."""
    if _MODEL_META.exists():
        with open(_MODEL_META, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _extract_features(audio_window: np.ndarray, sr: int) -> np.ndarray:
    """
    Extract the 30-feature vector from a single 2-second audio window.

    This function must remain byte-for-byte identical in behaviour to
    training Cell 15 in ductsense_binary_training_v1.ipynb:

        mfcc       = librosa.feature.mfcc(y=audio, sr=SR, n_mfcc=13)
        centroid   = librosa.feature.spectral_centroid(y=audio, sr=SR)
        bandwidth  = librosa.feature.spectral_bandwidth(y=audio, sr=SR)

    No keyword arguments were passed to those calls in training, so
    librosa's defaults apply throughout:
        n_fft=2048, hop_length=512, window='hann', center=True

    Parameters
    ----------
    audio_window : np.ndarray
        Float32/64 mono array of exactly `window_samples` samples.
    sr : int
        Sample rate (must be 16 000 to match training).

    Returns
    -------
    np.ndarray
        Shape (30,), dtype float32.
    """
    # 1. MFCCs — 13 coefficients, default n_fft / hop_length
    mfcc        = librosa.feature.mfcc(y=audio_window, sr=sr, n_mfcc=13)
    mfcc_mean   = np.mean(mfcc, axis=1)   # shape (13,)
    mfcc_std    = np.std(mfcc, axis=1)    # shape (13,),  ddof=0 (NumPy default)

    # 2. Spectral centroid
    centroid      = librosa.feature.spectral_centroid(y=audio_window, sr=sr)
    centroid_mean = np.mean(centroid)
    centroid_std  = np.std(centroid)

    # 3. Spectral bandwidth
    bandwidth      = librosa.feature.spectral_bandwidth(y=audio_window, sr=sr)
    bandwidth_mean = np.mean(bandwidth)
    bandwidth_std  = np.std(bandwidth)

    # 4. Concatenate in training order — must match feature_names in metadata
    features = np.concatenate([
        mfcc_mean,                                       # [0..12]
        mfcc_std,                                        # [13..25]
        [centroid_mean, centroid_std],                   # [26, 27]
        [bandwidth_mean, bandwidth_std],                 # [28, 29]
    ]).astype(np.float32)

    assert features.shape == (30,), (
        f"Feature extraction produced {features.shape[0]} features; expected 30."
    )
    return features


def predict_audio(audio_path: str | os.PathLike) -> dict:
    """
    Run LEAK / NO_LEAK inference on a single audio file.

    Preprocessing pipeline (mirrors training exactly):
        1. Load and decode audio file.
        2. Resample to 16 000 Hz.
        3. Convert to mono.
        4. Trim or pad to exactly 32 000 samples (2 seconds).
        5. Extract 30-feature vector.
        6. Call model.predict_proba() and read column 1 (LEAK probability).
        7. Apply 0.50 threshold.

    Parameters
    ----------
    audio_path : str or Path
        Path to the audio file.  Any format supported by librosa / soundfile
        works (WAV, FLAC, …).  For guaranteed compatibility without external
        codec dependencies, use uncompressed 16-bit or 32-bit PCM WAV.

    Returns
    -------
    dict with keys:
        "label"            : "LEAK" or "NO_LEAK"
        "audio_confidence" : float  — predict_proba[:, 1] for the input window.
                             This is the fraction of Random Forest trees that
                             voted for LEAK.  It is NOT a percentage and should
                             NOT be labelled "accuracy".

    Raises
    ------
    FileNotFoundError
        If audio_path does not exist.
    RuntimeError
        If the audio cannot be decoded or feature extraction fails.
    """
    audio_path = Path(audio_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # Ensure the model is loaded.
    pkg = load_audio_model()
    model          = pkg["model"]
    target_sr      = int(pkg["sample_rate"])      # 16000
    window_samples = int(pkg["window_samples"])   # 32000
    threshold      = float(pkg["threshold"])      # 0.50
    classes        = pkg["classes"]               # ["NO_LEAK", "LEAK"]

    # ------------------------------------------------------------------
    # Step 1–3: Decode, resample, mono
    #   librosa.load with sr=target_sr resamples on the fly.
    #   mono=True averages channels if the source is stereo.
    # ------------------------------------------------------------------
    try:
        audio, _ = librosa.load(str(audio_path), sr=target_sr, mono=True)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to decode audio file '{audio_path}': {exc}"
        ) from exc

    # ------------------------------------------------------------------
    # Step 4: Trim or pad to exactly one 2-second window.
    #   Training Cell 14 zero-pads short clips with np.pad on the right.
    #   For files longer than 2 s only the first window is used here;
    #   for multi-window inference see the architecture analysis doc.
    # ------------------------------------------------------------------
    if len(audio) < window_samples:
        audio = np.pad(audio, (0, window_samples - len(audio)))

    audio_window = audio[:window_samples]   # first 2-second window

    # ------------------------------------------------------------------
    # Step 5: Feature extraction
    # ------------------------------------------------------------------
    try:
        features = _extract_features(audio_window, sr=target_sr)
    except Exception as exc:
        raise RuntimeError(
            f"Feature extraction failed for '{audio_path}': {exc}"
        ) from exc

    # ------------------------------------------------------------------
    # Steps 6–7: Inference
    # ------------------------------------------------------------------
    features_2d   = features.reshape(1, -1)                        # (1, 30)
    proba         = model.predict_proba(features_2d)               # (1, 2)
    leak_prob     = float(proba[0, 1])                             # P(LEAK)
    threshold = 0.70
    label         = "LEAK" if leak_prob >= threshold else "NO_LEAK"

    return {
        "label":            label,
        "audio_confidence": round(leak_prob, 6),
    }
