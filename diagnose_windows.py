from pathlib import Path

import joblib
import librosa
import numpy as np


MODEL_PATH = Path("models/audio/ductsense_binary_rf_v2.pkl")
TEST_DIR = Path("ml-training/audio/dataset/test_data")

WINDOW_SECONDS = 2
HOP_SECONDS = 1
SAMPLE_RATE = 16000

package = joblib.load(MODEL_PATH)
model = package["model"]

WINDOW_SAMPLES = int(WINDOW_SECONDS * SAMPLE_RATE)


def extract_features(audio_window, sr):
    mfcc = librosa.feature.mfcc(
        y=audio_window,
        sr=sr,
        n_mfcc=13,
    )

    centroid = librosa.feature.spectral_centroid(
        y=audio_window,
        sr=sr,
    )

    bandwidth = librosa.feature.spectral_bandwidth(
        y=audio_window,
        sr=sr,
    )

    features = np.concatenate([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
        [
            np.mean(centroid),
            np.std(centroid),
            np.mean(bandwidth),
            np.std(bandwidth),
        ],
    ])

    return features


for audio_path in sorted(TEST_DIR.glob("*.wav")):

    y, sr = librosa.load(
        audio_path,
        sr=SAMPLE_RATE,
        mono=True,
    )

    print("\n" + "=" * 70)
    print(audio_path.name)
    print("=" * 70)

    duration = len(y) / sr
    print(f"Duration: {duration:.2f} sec")

    probabilities = []

    for start in range(
        0,
        max(1, len(y) - WINDOW_SAMPLES + 1),
        int(HOP_SECONDS * sr),
    ):

        window = y[start:start + WINDOW_SAMPLES]

        if len(window) < WINDOW_SAMPLES:
            window = np.pad(
                window,
                (0, WINDOW_SAMPLES - len(window)),
            )

        features = extract_features(window, sr)

        probability = model.predict_proba(
            features.reshape(1, -1)
        )[0, 1]

        start_sec = start / sr
        end_sec = start_sec + WINDOW_SECONDS

        probabilities.append(probability)

        print(
            f"{start_sec:5.1f}-{end_sec:5.1f} sec"
            f"  LEAK probability: {probability:.3f}"
        )

    print("-" * 70)

    probabilities = np.array(probabilities)

    print(f"Minimum probability: {probabilities.min():.3f}")
    print(f"Maximum probability: {probabilities.max():.3f}")
    print(f"Mean probability:    {probabilities.mean():.3f}")
    print(
        f"Windows >= 0.50:    "
        f"{np.sum(probabilities >= 0.50)}/{len(probabilities)}"
    )