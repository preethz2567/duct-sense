# DuctSense Audio ML: Binary Acoustic Leak Classification Pipeline

## 1. Overview & Objective

This module implements the audio leak detection pipeline for **DuctSense**, an AI-powered HVAC duct monitoring system combining thermal, acoustic, and pressure sensing.

The acoustic classification pipeline detects airborne acoustic signatures of compressed air leakage inside HVAC ducting. The target model is a **binary classifier**:
- **`LEAK = 1`**: Acoustic signatures consistent with compressed air or duct orifice escaping airflow.
- **`NO_LEAK = 0`**: Acoustic signatures representing baseline duct acoustic environments and HVAC ambient background noise without a duct leak.

### Four Required Operational Scenarios:
1. **No Leak + No Noise $\rightarrow$ NO_LEAK** (Quiet HVAC baseline, no airflow hissing)
2. **No Leak + Noise $\rightarrow$ NO_LEAK** (High operational air movement, fan hum, diffuser turbulence, external ambient noise)
3. **Leak + No Noise $\rightarrow$ LEAK** (Clear acoustic hissing/ultrasound leakage in low-noise duct)
4. **Leak + Noise $\rightarrow$ LEAK** (Acoustic hissing superimposed upon heavy duct turbulence, fan noise, or shop floor interference)

---

## 2. Dataset Sources & Integrity

The training pipeline integrates real acoustic datasets configured in Kaggle:

### A. IICA Compressed Air Leakage Dataset (Fraunhofer IDMT)
- **TUBELEAK**: `/kaggle/input/datasets/jyotshanasr/tube-leak/tubeleak`
- **VENTLEAK**: `/kaggle/input/datasets/jyotshanasr/vent-leak/ventleak`
- **VENTLOW**:  `/kaggle/input/datasets/jyotshanasr/vent-flow/ventlow`

> **CRITICAL DATASET RULE:**
> All recordings in the IICA dataset across acoustic test environments (`lab`, `hydr`, `hydr_low`, `work`, `work_low`) are **LEAK** recordings captured under differing noise and operating conditions. They are **never** labeled as `NO_LEAK`. Noise in a leak recording represents acoustic interference, not absence of a leak.

### B. Environmental NO_LEAK Recordings
- **RoomTone2**: `/kaggle/input/datasets/jyotshanasr/ductsense-no-leak-audio/Room_Record.wav` (Ceiling AC ambient environment)
- **Empty Mall**: `/kaggle/input/datasets/jyotshanasr/ductsense-no-leak-audio/Room_Record (2).wav` (Large open atrium HVAC airflow & background rumble)

### C. External Generalization Test (AIR_LEAK_AUX)
- Optional external recordings (`AIR_LEAK_AUX_1.wav` to `AIR_LEAK_AUX_5.wav`) used strictly as an independent out-of-domain sanity test. They are **never** mixed into training or treated as IICA classes.

---

## 3. Train / Test Methodology & Leakage Prevention

To ensure scientific validity and avoid data contamination:

1. **Recording-Level Stratified Split for IICA:**
   - All IICA recordings are split at the file path level (80% train, 20% test) before any windowing or feature extraction.
   - Recording identity uses the full absolute file path to avoid collisions from identical basenames.
   - Verification check asserts zero overlap between training and testing recording sets (`overlap == 0`).
2. **Controlled Subsampling:**
   - 150 recordings per IICA leak class are sampled for training (450 total leak train recordings).
   - 30 recordings per IICA leak class are sampled for evaluation (90 total leak test recordings).
   - Exactly one 2-second random window is extracted per recording.
3. **NO_LEAK Temporal Partitioning:**
   - Non-overlapping 2-second windows are generated from the continuous environmental recordings.
   - A temporal 80/20 split partitions each recording (first 80% to train, last 20% to test) so no identical audio segments appear across partitions.
   - The training set caps NO_LEAK windows to 120, balanced using Random Forest `class_weight="balanced"`.

---

## 4. Acoustic Feature Pipeline

- **Sampling Rate:** 16,000 Hz (16 kHz mono)
- **Window Length:** 2.0 seconds (32,000 samples)
- **Total Features:** 30 features extracted via `librosa`:
  1. `MFCC_1_mean` to `MFCC_13_mean` (13 features): Spectral envelope shape
  2. `MFCC_1_std` to `MFCC_13_std` (13 features): Temporal variance in spectral envelope
  3. `Centroid_mean` & `Centroid_std` (2 features): Center of acoustic energy distribution
  4. `Bandwidth_mean` & `Bandwidth_std` (2 features): Spectral spread around centroid

> **Note on Feature Importance:** High importance in MFCCs or spectral centroid reflects empirical statistical discrimination in this dataset. It does **not** physical establish or bound an intrinsic acoustic leak frequency.

---

## 5. Model Architecture & Deployment Specifications

- **Classifier:** Random Forest Classifier (`sklearn.ensemble.RandomForestClassifier`)
- **Hyperparameters:**
  - `n_estimators = 300`
  - `max_depth = 12`
  - `class_weight = "balanced"`
  - `random_state = 42`
  - `n_jobs = -1`
- **Output Decision Threshold:** `0.50` (tunable for edge sensitivity)
- **Deployment Compatibility:**
  - Exported model bundle: `ductsense_binary_rf_v2.pkl`
  - Model metadata: `ductsense_binary_rf_v2_meta.json`
  - Model contract: Input shape `(1, 30)` float32 vector, outputs `predict_proba[:, 1]` as `audio_confidence` directly consumed by the DuctSense sensor fusion engine (`core/fusion_logic.py`).

---

## 6. Output Artifacts

Execution in Kaggle generates the following structured artifact bundle under `output/`:

```text
output/
├── metrics.txt                       # Measured metrics, confusion matrix, classification report
├── confusion_matrix.png              # Visual confusion matrix on held-out test data
├── threshold_results.csv             # Sweep of thresholds [0.20 - 0.90] with recall, precision, FPR
├── feature_importance.csv            # Sorted Gini importance across all 30 features
├── test_predictions.csv              # Row-level test predictions traced to source recording paths
├── no_leak_environment_results.csv   # Accuracy & FPR broken down by RoomTone2 vs EmptyMall
├── leak_type_results.csv             # Recall broken down by TUBELEAK, VENTLEAK, VENTLOW
├── external_air_leak_aux_predictions.csv # Auxiliary out-of-domain sanity evaluation (if available)
└── model/
    ├── ductsense_binary_rf_v2.pkl     # Deployable joblib model package
    └── ductsense_binary_rf_v2_meta.json # Detailed model metadata specification
```

---

## 7. Known Limitations

1. **Environmental Diversity:** The current NO_LEAK baseline relies on two primary physical recordings (`RoomTone2` and `Empty Mall`). While temporal splitting guarantees separate window evaluation, this does not represent the full acoustic variety of operating industrial HVAC ducts (e.g. damper rattles, variable volume fans).
2. **Auxiliary Generalization:** 5 external `AIR_LEAK_AUX` files provide exploratory directional feedback but are insufficient to claim proven generalization across arbitrary industrial facilities.
3. **Threshold Calibration:** In high-noise environments, the default threshold (0.50) may need adjustment. The threshold sweep table (`threshold_results.csv`) provides the trade-off between LEAK recall and false positive alarms.

---

## 8. Reproducing Training in Kaggle

1. Open Kaggle Notebook.
2. Attach the required datasets:
   - `jyotshanasr/tube-leak`
   - `jyotshanasr/vent-leak`
   - `jyotshanasr/vent-flow`
   - `jyotshanasr/ductsense-no-leak-audio`
   - *(Optional)* `jyotshanasr/air-leak-aux`
3. Upload and open `ductsense_binary_training_v1.ipynb` (or `ductsense_binary_training_output.ipynb`).
4. Execute **Run All**.
5. Download the complete `output/` directory from Kaggle's `/kaggle/working/output`.
6. Copy the deployable model files:
   - `output/model/ductsense_binary_rf_v2.pkl` $\rightarrow$ `models/audio/`
   - `output/model/ductsense_binary_rf_v2_meta.json` $\rightarrow$ `models/audio/`
7. Copy experiment evaluation files:
   - `output/*.csv`, `output/*.txt`, `output/*.png` $\rightarrow$ `ml-training/audio/output/`
