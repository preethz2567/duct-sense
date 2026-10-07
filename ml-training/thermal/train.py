"""
train_thermal_poc.py

SIMPLE, from-scratch pipeline for the PoC round. No CNN, no epochs -
classical ML on a handful of physically-meaningful numbers extracted
from each FLIR E95 radiometric image. Trains in under a second.

Folder structure expected:
    dataset/
        leak/       <- FLIR .jpg files, leak present
        no_leak/    <- FLIR .jpg files, no leak

Usage:
    python train_thermal_poc.py --dataset ./dataset

Outputs (written next to this script, in ./output/):
    results.csv           - filename, leak_confidence, verdict for EVERY image
    confusion_matrix.png  - visual confusion matrix on the held-out validation set
    metrics.txt            - accuracy / precision / recall / F1, printed and saved
"""

import argparse
import json
import glob
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)

# Where the production model artifacts are written.
# Path is relative to the repo root (two levels up from this script).
REPO_ROOT = Path(__file__).resolve().parents[2]
MODEL_OUTPUT_DIR = REPO_ROOT / "models" / "thermal"

import flyr  # pip install flyr


# ----------------------------------------------------------------------------
# STEP 1: Turn one radiometric JPEG into a handful of physically-meaningful
# numbers. This is the whole "feature engineering" step - no neural network,
# just descriptive statistics of the temperature array.
# ----------------------------------------------------------------------------
def extract_features(image_path: str) -> dict:
    thermogram = flyr.unpack(image_path)
    temps = np.asarray(thermogram.celsius, dtype=np.float32)  # 2D array, deg C

    background = float(np.median(temps))          # "normal" temperature in this frame
    deviation = temps - background                 # how far each pixel is from normal
    hot_mask = deviation > 2.0                      # pixels notably warmer than background

    return {
        "max_temp_c": float(temps.max()),
        "mean_temp_c": float(temps.mean()),
        "temp_range_c": float(temps.max() - temps.min()),
        "temp_std_c": float(temps.std()),
        # background-subtracted peak: self-corrects for the whole scene being
        # warmer/cooler that day, unlike raw max_temp_c above
        "delta_from_background_c": float(deviation.max()),
        # fraction of the image that's notably hot: distinguishes a small
        # point leak from a broadly warm frame, which max/mean alone cannot
        "hot_pixel_fraction": float(hot_mask.mean()),
    }


FEATURE_NAMES = [
    "max_temp_c", "mean_temp_c", "temp_range_c",
    "temp_std_c", "delta_from_background_c", "hot_pixel_fraction",
]


# ----------------------------------------------------------------------------
# STEP 2: Build one big table - one row per image - from the two folders.
# ----------------------------------------------------------------------------
def build_feature_table(dataset_dir: str) -> pd.DataFrame:
    rows = []
    for label_name, label_value in [("leak", 1), ("no_leak", 0)]:
        folder = Path(dataset_dir) / label_name
        files = sorted({str(p) for p in Path(folder).iterdir() if p.suffix.lower() == ".jpg"})
        if not files:
            print(f"WARNING: no .jpg files found in {folder}")
        for f in files:
            try:
                feats = extract_features(f)
            except Exception as e:
                print(f"  SKIPPED {f}: could not read temperature data ({e})")
                continue
            feats["filename"] = os.path.basename(f)
            feats["label"] = label_value
            rows.append(feats)

    df = pd.DataFrame(rows)
    print(f"\nLoaded {len(df)} images total "
          f"({(df['label'] == 1).sum()} leak, {(df['label'] == 0).sum()} no_leak)")
    return df


# ----------------------------------------------------------------------------
# STEP 3: Train. ONE call to .fit() - this is the entire "training" step.
# No epochs, no loops - classical ML fits directly on the whole training set.
# ----------------------------------------------------------------------------
def train_and_evaluate(df: pd.DataFrame, output_dir: Path):
    X = df[FEATURE_NAMES].values
    y = df["label"].values

    # Stratified split keeps the leak/no_leak ratio similar in both sets.
    # NOTE: this is a RANDOM split, not session-aware. If your images were
    # captured in a few short bursts, images from the same burst could end
    # up in both train and validation, making the score look better than it
    # really is. Fine for a first PoC pass - flag this honestly if asked.
    X_train, X_val, y_train, y_val, files_train, files_val = train_test_split(
        X, y, df["filename"].values,
        test_size=0.2, stratify=y, random_state=42
    )

    # Scale features so no single number (e.g. max_temp_c, ~30) dominates
    # a smaller-scale one (e.g. hot_pixel_fraction, 0-1) purely by magnitude.
    scaler = StandardScaler().fit(X_train)
    X_train_scaled = scaler.transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # class_weight="balanced" matters here: 51 leak vs 46 no_leak is close,
    # but this makes the model robust if your real counts end up more skewed.
    model = LogisticRegression(class_weight="balanced", random_state=42)
    model.fit(X_train_scaled, y_train)   # <-- this line IS the entire training step

    # ---- Evaluate on the held-out validation images ----
    val_pred = model.predict(X_val_scaled)
    acc = accuracy_score(y_val, val_pred)
    prec = precision_score(y_val, val_pred, zero_division=0)
    rec = recall_score(y_val, val_pred, zero_division=0)
    f1 = f1_score(y_val, val_pred, zero_division=0)
    cm = confusion_matrix(y_val, val_pred, labels=[0, 1])

    metrics_text = (
        f"Validation set: {len(y_val)} images ({int(y_val.sum())} leak, "
        f"{len(y_val) - int(y_val.sum())} no_leak)\n"
        f"Accuracy:  {acc:.3f}\n"
        f"Precision: {prec:.3f}\n"
        f"Recall:    {rec:.3f}\n"
        f"F1 score:  {f1:.3f}\n\n"
        f"Confusion matrix (rows=actual, cols=predicted, order=[no_leak, leak]):\n"
        f"{cm}\n"
    )
    print("\n" + metrics_text)
    (output_dir / "metrics.txt").write_text(metrics_text)

    # ---- Save a visual confusion matrix ----
    fig, ax = plt.subplots(figsize=(4.5, 4))
    im = ax.imshow(cm, cmap="Blues")
    labels = ["no_leak", "leak"]
    ax.set_xticks([0, 1]); ax.set_xticklabels(labels)
    ax.set_yticks([0, 1]); ax.set_yticklabels(labels)
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    ax.set_title("DuctSense Thermal - Confusion Matrix")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                     color="white" if cm[i, j] > cm.max() / 2 else "black", fontsize=14)
    fig.colorbar(im)
    fig.tight_layout()
    fig.savefig(output_dir / "confusion_matrix.png", dpi=150)
    print(f"Saved confusion matrix to {output_dir / 'confusion_matrix.png'}")

    # ---- Full results.csv: EVERY image, train and validation, with the
    # model's confidence and verdict. Simple, per your request. ----
    X_all_scaled = scaler.transform(df[FEATURE_NAMES].values)
    all_confidence = model.predict_proba(X_all_scaled)[:, 1]  # probability of "leak"
    results = pd.DataFrame({
        "filename": df["filename"],
        "true_label": df["label"].map({0: "no_leak", 1: "leak"}),
        "leak_confidence": np.round(all_confidence, 4),
        "verdict": np.where(all_confidence >= 0.5, "leak", "no_leak"),
        "split": np.where(df["filename"].isin(files_val), "validation", "train"),
    })
    results.to_csv(output_dir / "results.csv", index=False)
    print(f"Saved per-image results to {output_dir / 'results.csv'}")

    # ---- Persist model + scaler to models/thermal/ for production use ----
    MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model_path  = MODEL_OUTPUT_DIR / "thermal_model.joblib"
    scaler_path = MODEL_OUTPUT_DIR / "thermal_scaler.joblib"
    meta_path   = MODEL_OUTPUT_DIR / "thermal_model_meta.json"
    joblib.dump(model,  model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Saved model  -> {model_path}")
    print(f"Saved scaler -> {scaler_path}")

    # ---- Write meta.json: feature contract + model type + validation metrics ----
    meta = {
        "model_type": type(model).__name__,
        "model_params": model.get_params(),
        "feature_names": FEATURE_NAMES,
        "hot_pixel_threshold_c": 2.0,
        "train_images": int(len(X_train)),
        "val_images": int(len(X_val)),
        "val_metrics": {
            "accuracy":  round(float(acc),  4),
            "precision": round(float(prec), 4),
            "recall":    round(float(rec),  4),
            "f1":        round(float(f1),   4),
        },
    }
    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"Saved meta   -> {meta_path}")

    return model, scaler


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="./dataset",
                         help="Folder containing leak/ and no_leak/ subfolders")
    parser.add_argument("--output", default="./output")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = build_feature_table(args.dataset)
    if len(df) == 0:
        raise SystemExit("No images loaded - check --dataset path and folder names.")

    train_and_evaluate(df, output_dir)
