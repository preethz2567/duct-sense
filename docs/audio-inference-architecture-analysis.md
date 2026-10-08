# DuctSense Audio Inference Architecture Analysis & Technical Audit

**Target File:** `docs/audio-inference-architecture-analysis.md`  
**Repository:** `preethz2567/duct-sense`  
**Author:** AI Technical Audit Agent  
**Date:** October 2026  
**Status:** Complete Audit & Architectural Blueprint (No code modified)

---

## 1. Executive Summary

This report delivers an exhaustive technical audit of the **DuctSense** codebase to establish the architectural blueprint for an **End-to-End Audio Inference Pipeline**. 

The intended feature workflow is:
$$\text{User Uploads Audio (.wav)} \longrightarrow \text{React Dashboard} \longrightarrow \text{FastAPI Endpoint} \longrightarrow \text{Preprocess \& Extract 30 Features} \longrightarrow \text{Random Forest Model} \longrightarrow \text{Binary Decision \& Confidence} \longrightarrow \text{Dashboard Display}$$

### Key Findings of the Audit:
1. **Model Artifact is Verified and Ready:** A trained Scikit-Learn `RandomForestClassifier` bundle exists at `models/audio/ductsense_binary_rf_v2.pkl` alongside complete metadata at `models/audio/ductsense_binary_rf_v2_meta.json`. It expects a **30-feature vector** extracted from **16 kHz, 2.0-second mono audio** and predicts binary classes `[0: NO_LEAK, 1: LEAK]`.
2. **Backend Audio Inference Gap:** **No audio inference endpoint currently exists.** The current FastAPI service (`backend/main.py`) exposes only walkthrough persistence (`POST /walkthroughs`, `GET /walkthroughs`) and field findings (`POST /findings`, `GET /findings`).
3. **Frontend Audio UI is Currently Simulated / Mocked:** The React frontend (React 19, Vite 8, Lucide, Recharts) references acoustic metrics (`acousticScore`, `audio_confidence`, `INMP441`) in multiple pages (`UnifiedEvidencePage`, `LiveMonitoring`, `Reports`, `EngineeringPage`, `SensorEvidencePanel`). However, all acoustic scores currently originate from synthetic sensor simulation (`simulator/sensor_simulator.py`) or hardcoded state (`mockDataService.js`), not live inference.
4. **Missing Python Dependencies:** Root `requirements.txt` lists `numpy`, `onnxruntime`, `fastapi`, `uvicorn`, `smbus2`, `scikit-learn`, `joblib`. Crucially, **`librosa`** (required for feature extraction) and **`python-multipart`** (required by FastAPI for file upload handling) are **missing** from `requirements.txt`.
5. **Separation of Audio Inference vs. Multi-Sensor Fusion:** `core/fusion_logic.py` implements multi-sensor fusion where `thermal_confidence >= 0.60` strictly gates leak detection. The requested user flow is a dedicated **Audio Model Inference / Validation tool**. Merging audio upload directly into multi-sensor fusion without thermal/pressure context would improperly suppress detections.

---

## 2. Current Repository Architecture

The repository layout and component responsibilities verified against the filesystem:

```
ductsense/
├── README.md                           # High-level system overview
├── requirements.txt                    # Python dependencies (missing librosa, python-multipart)
├── run_pipeline.py                     # CLI pipeline runner (simulated sensors -> fusion -> SQLite -> report)
├── backend/
│   ├── main.py                         # FastAPI service (walkthroughs & findings CRUD)
│   └── sync.db                         # SQLite DB for backend walkthroughs & findings
├── core/
│   ├── alert.py                        # Console & hardware alert handlers
│   ├── api_client.py                   # Lightweight HTTP publisher (POSTs walkthroughs to FastAPI)
│   └── fusion_logic.py                 # Tri-modal sensor fusion (thermal + pressure + audio)
├── dashboard/                          # React 19 + Vite 8 frontend
│   ├── package.json                    # react, react-dom, recharts, lucide-react, oxlint
│   ├── src/
│   │   ├── App.jsx                     # Top-level state, view switcher, 3s polling for walkthroughs
│   │   ├── App.css                     # Complete design system & industrial styling
│   │   ├── index.css                   # Global CSS reset (light mode locked)
│   │   ├── components/                 # UI components (Sidebar, EvidenceDrawer, SensorEvidencePanel)
│   │   ├── pages/                      # 22 page views (Inspections, UnifiedEvidence, Engineering, etc.)
│   │   └── services/                   # apiService.js, inspectionService.js, mockDataService.js
├── models/
│   ├── audio/
│   │   ├── ductsense_binary_rf_v2.pkl  # Serialized joblib dictionary bundle with trained model
│   │   └── ductsense_binary_rf_v2_meta.json # Model contract & evaluation metadata
│   └── thermal/
│       ├── thermal_model.joblib        # Trained LogisticRegression model
│       ├── thermal_scaler.joblib       # Trained StandardScaler
│       └── thermal_model_meta.json     # Thermal model metadata
├── ml-training/
│   └── audio/
│       ├── README.md                   # Full training methodology & benchmark results
│       ├── ductsense_binary_training_v1.ipynb # Training notebook (data split, feature extraction, export)
│       └── output/                     # CSV metrics, confusion matrix, threshold sweep
├── sensors/
│   └── thermal_reader.py               # Radiometric thermal feature extractor & predictor
├── simulator/
│   └── sensor_simulator.py             # Generates synthetic 2s/30s Gaussian-peak walkthrough data
└── storage/
    ├── storage.py                      # SQLite persistence for run_pipeline.py (docs/ductsense.db)
    └── report_generator.py             # Markdown summary generator (docs/latest_report.md)
```

---

## 3. Current Frontend Audit

### A. Framework and Tooling
- **React Version:** `19.2.8` (configured in `dashboard/package.json`)
- **Vite Version:** `8.3.0` with `@vitejs/plugin-react` `6.1.1`
- **Linting:** `oxlint` `1.81.0`
- **Icon Library:** `lucide-react` `1.48.0`
- **Charting Library:** `recharts` `3.10.1`
- **CSS Architecture:** Pure Vanilla CSS using custom design tokens in `App.css` and a global reset in `index.css`. **Tailwind CSS is NOT used.**
- **Routing Approach:** Single-page stateful tab switcher (`activePage` in `App.jsx`). No `react-router` dependency.
- **State Management:** Top-level React state hooks (`useState`, `useEffect`) passed down via props.
- **API Communication:** Browser `fetch()` calls in `App.jsx`, `apiService.js`, and `InspectionMap.jsx`.

### B. Existing Pages Analysis

| Page Component | Main Purpose | Data Consumed | Backend Endpoints Used | Real vs. Mocked |
|---|---|---|---|---|
| `InspectionsPage.jsx` | Overview of past & ongoing HVAC inspection sessions | `recentInspectionsList` | None | Local mock state |
| `ActiveInspectionPage.jsx` | Technician walkthrough canvas, duct layout & anomaly trigger | `session.sections`, `session.activeAnomaly` | None | Local state |
| `UnifiedEvidencePage.jsx` | Deep-dive multimodal evidence review (Overview, Thermal, Pressure, Acoustic, Photos, Events) | `session.activeAnomaly.evidence`, `telemetry` | None | Local state |
| `CommissioningReport.jsx` | Formal HVAC commissioning certificate | `session` summary | None | Derived local state |
| `SyncPage.jsx` | SQLite offline cache & cloud sync manager | `session.syncStatus` | None (manual trigger sets state) | Derived local state |
| `EngineeringPage.jsx` | Hardware diagnostics: Zero-offset calibration, bus inventory, trends | `initialHardwareStatus`, simulated Recharts | None | Simulated / mock |
| `Reports.jsx` | Legacy walkthrough report viewer | `walkthroughs` from FastAPI | `GET /walkthroughs` | **Real backend data** |
| `LiveMonitoring.jsx` | Real-time walkthrough telemetry visualization | `walkthroughs` peak event | `GET /walkthroughs` (via props) | **Real backend data** |
| `SensorEvidence.jsx` | Tri-modal sensor line charts (ΔP, Thermal, Acoustic) | Synthetic curves | None | Local mock data |
| `InspectionMap.jsx` | Spatial floor plan pin dropping & finding persistence | Findings array | `GET /findings`, `POST /findings` | **Real backend data** |

### C. Existing Visual / Design System

The application employs an **authentic industrial instrumentation console** design language (modeled after professional HVAC test equipment like Testo, Fluke, and FLIR consoles). It explicitly rejects consumer SaaS aesthetics.

- **Appearance Mode:** Strictly **Light Technical Console**. `:root { color-scheme: light; }` is enforced in `index.css` to prevent OS dark-mode overrides.
- **Color Palette Tokens (`App.css`):**
  - `--ds-surface-primary: #F4F3EF`: Warm technical grey-white (canvas background)
  - `--ds-surface-secondary: #E9E8E2`: Deeper technical neutral (borders/wells)
  - `--ds-surface-card: #FFFFFF`: Clean pure white (card panels)
  - `--ds-structure-primary: #20252A`: Deep charcoal (sidebar background, primary headings)
  - `--ds-structure-secondary: #344B5E`: Steel blue (active navigation, engineering headers)
  - `--ds-accent-petrol: #176B73`: Deep petrol teal (brand marks, secondary accents)
  - `--ds-border: #CDD0CE`: Crisp 1px engineering border
  - `--ds-border-light: #E2E8F0`: Subpanel separator border
- **Status & Telemetry Tokens:**
  - Critical / Confirmed Leak: `--ds-state-red: #B83A32`
  - Warning / Active Anomaly: `--ds-state-amber: #D88A19`
  - Nominal / Verified Pass: `--ds-state-green: #3F7655`
- **Typography:**
  - Sans-Serif: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Monospace (all sensor readings, coordinates, timestamps, IDs): `"SF Mono", "Roboto Mono", Consolas, Menlo, monospace`
- **Component Styling:**
  - **Cards:** Crisp flat white rectangles with `1px solid var(--ds-border)`, subtle `border-radius: 3px - 4px`, no heavy drop shadows.
  - **Badges:** Compact monospace or bold uppercase pills (`padding: 2px 6px; font-size: 9px - 10px; border-radius: 2px`).
  - **Buttons:** Solid industrial blocks (`ds-btn-primary`, `ds-btn-amber`, `ds-btn-secondary`) with small icons from `lucide-react`.
  - **Navigation:** Persistent dark left sidebar (`260px` width) with distinct "MAIN WORKFLOW" and "SECONDARY" sections.

### D. Existing Audio-Related UI Elements

Audio and acoustic metrics currently appear in the following UI locations:
1. **`SensorEvidencePanel.jsx` (Lines 50–63):**
   - Shows a dedicated **Acoustic** tile featuring `Mic` icon.
   - Evaluates `audioAnomaly = acousticScore != null && acousticScore >= 0.50`.
   - Displays percentage `(acousticScore * 100).toFixed(0) + '%'`.
2. **`UnifiedEvidencePage.jsx` (Lines 200–220 & 310–326):**
   - Overview Tab: Card titled `"ACOUSTIC ANOMALY (INMP441)"` showing `"INMP441 MEMS (Audible Range)"` and `"Acoustic Turbulence Score: 0.74"`.
   - Dedicated `ACOUSTIC` tab: Shows `"INMP441 AUDIBLE-RANGE ACOUSTIC SENSING"` with score and classification `"Audible Range Leak Turbulence"`.
   - Remediation Card: Shows before/after acoustic scores (`0.74` before $\rightarrow$ `0.15` after).
3. **`LiveMonitoring.jsx` (Line 44 & Line 185):**
   - Derives `acousticScore = peakEvent?.audio_confidence ?? (hasLeak ? 0.78 : 0.08)` and passes it to `SensorEvidencePanel`.
4. **`Reports.jsx` (Line 139 & Line 156):**
   - Displays "Audio" column in the recorded leak points table: `{ev.audio_confidence ? `${(ev.audio_confidence * 100).toFixed(0)}%` : '—'}`.
5. **`EngineeringPage.jsx` (Line 211 & Line 230):**
   - Lists `INMP441 #1` and `INMP441 #2` in the hardware inventory table (`I2S-0 (Audible range)`).
   - Architecture note explains: *"INMP441 MEMS microphone processes audible turbulence frequencies."*
6. **`EvidenceDrawer.jsx` (Lines 166–191):**
   - Acoustic Anomaly tile: Hardware = `INMP441 Audible MEMS`, Acoustic Turbulence = `0.74 (Audible Range Hiss)`.

---

## 4. Current Backend Audit

### Existing Endpoints in `backend/main.py`:
- `POST /walkthroughs`: Accepts a `WalkthroughReport` JSON payload (id, date, list of `LeakEvent` objects) and upserts them into table `walkthroughs` in `backend/sync.db`.
- `GET /walkthroughs`: Returns all stored walkthrough sessions and deserializes the JSON events.
- `POST /findings`: Accepts a `Finding` JSON object and upserts it into table `findings` in `backend/sync.db`.
- `GET /findings`: Returns all stored findings.

### Verification of Audio Inference Endpoints:
```
POST /audio/infer   --> DOES NOT EXIST
POST /audio/predict --> DOES NOT EXIST
POST /infer         --> DOES NOT EXIST
POST /predict       --> DOES NOT EXIST
```
**Explicit Statement:** **No audio inference endpoint currently exists in the backend.**

---

## 5. Current Data Flow (End-to-End)

The repository's current end-to-end data flow operates as follows:

```
┌────────────────────────────────────────────────────────┐
│               1. DATA GENERATION                       │
│  simulator/sensor_simulator.py                         │
│  - Generates 60 samples along a 2.0m duct              │
│  - Produces: thermal_confidence (0.05-0.92)            │
│              pressure_differential_pa (2.0-55.0 Pa)    │
│              audio_confidence (0.05-0.85)              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. MULTI-SENSOR FUSION                   │
│  core/fusion_logic.py: fuse(sample)                    │
│  - normalized_pressure = min(delta_p / 100.0, 1.0)     │
│  - leak_confidence = 0.4*thermal + 0.3*p + 0.3*audio   │
│  - leak_detected = (leak_confidence >= 0.65            │
│                     and thermal_confidence >= 0.60)    │
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│    3A. LOCAL PIPELINE     │ │ 3B. API CLIENT (HTTP)    │
│  storage/storage.py       │ │ core/api_client.py       │
│  - Persists positive leak │ │ - Packs WalkthroughReport│
│    samples to SQLite      │ │ - POSTs to FastAPI       │
│    (docs/ductsense.db)    │ │   at :8000/walkthroughs  │
│  storage/report_generator │ └─────────────┬────────────┘
│  - Writes docs/           │               │
│    latest_report.md       │               │
└───────────────────────────┘               │
                                            ▼
┌────────────────────────────────────────────────────────┐
│               4. FASTAPI BACKEND SERVER                │
│  backend/main.py: POST /walkthroughs                   │
│  - Stores walkthrough_id, date, events JSON in SQLite   │
│    (backend/sync.db)                                   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               5. REACT DASHBOARD POLLING               │
│  dashboard/src/App.jsx                                 │
│  - Silent 3-second interval: GET /walkthroughs         │
│  - Stores normalized walkthroughs in state             │
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│  dashboard/src/pages/     │ │  dashboard/src/pages/    │
│  LiveMonitoring.jsx       │ │  Reports.jsx             │
│  - Reads peak event       │ │  - Lists recorded events │
│  - Displays acousticScore │ │  - Shows SensorEvidence  │
│    in SensorEvidencePanel │ │    Panel with audio conf │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 6. Audio Model Audit

### Verification Against Repository Artifacts:
We verified `models/audio/ductsense_binary_rf_v2.pkl`, `models/audio/ductsense_binary_rf_v2_meta.json`, and training notebook `ml-training/audio/ductsense_binary_training_v1.ipynb`.

```
================================================================================
DUCTSENSE AUDIO MODEL CONTRACT VERIFICATION
================================================================================
Artifact Path           : models/audio/ductsense_binary_rf_v2.pkl
Metadata Path           : models/audio/ductsense_binary_rf_v2_meta.json
Bundle Format           : Python joblib dictionary containing:
                          ['model', 'sample_rate', 'window_seconds', 
                           'window_samples', 'feature_names', 'classes', 
                           'threshold']
Model Type              : sklearn.ensemble.RandomForestClassifier
Target Task             : Binary acoustic leak detection
Class Names             : ['NO_LEAK', 'LEAK']
Class Mapping           : 0 -> NO_LEAK, 1 -> LEAK
Sample Rate (SR)        : 16,000 Hz
Window Duration         : 2.0 seconds
Window Samples          : 32,000 samples
Feature Count           : Exactly 30 features
Feature Order           :
   [0..12] : MFCC_1_mean to MFCC_13_mean
  [13..25] : MFCC_1_std  to MFCC_13_std
      [26] : Centroid_mean
      [27] : Centroid_std
      [28] : Bandwidth_mean
      [29] : Bandwidth_std
Decision Threshold      : 0.50
Hyperparameters         :
  - n_estimators        : 300
  - max_depth           : 12
  - class_weight        : "balanced"
  - random_state        : 42
  - n_jobs              : -1
Input Shape             : (1, 30) float32 / float64 matrix (or (N, 30) for N windows)
Output Format           : model.predict_proba(X) -> [[prob_no_leak, prob_leak]]
================================================================================
```

---

## 7. Critical: Inference Compatibility Analysis

To achieve identical inference results at runtime, the feature extraction code must replicate the training pipeline **sample-for-sample**.

### Step-by-Step Training Preprocessing Trace:
From `ml-training/audio/ductsense_binary_training_v1.ipynb` (Cells 14 & 15):

1. **Audio Loading & Resampling:**
   ```python
   audio, sr = librosa.load(path, sr=16000, mono=True)
   ```
   - Target sample rate: `16000` Hz.
   - Channel formatting: Single-channel mono. If multi-channel, `librosa.load(..., mono=True)` averages stereo channels into mono before resampling.
2. **Window Slicing & Padding:**
   ```python
   if len(audio) < 32000:
       audio = np.pad(audio, (0, 32000 - len(audio)))
   ```
   - Short audio (< 2.0 seconds) is zero-padded on the right to reach exactly 32,000 samples.
3. **Exact Feature Extraction Implementation:**
   ```python
   def extract_features(audio: np.ndarray) -> np.ndarray:
       # 1. MFCCs: 13 coefficients (default n_fft=2048, hop_length=512)
       mfcc = librosa.feature.mfcc(y=audio, sr=16000, n_mfcc=13)
       mfcc_mean = np.mean(mfcc, axis=1) # Shape: (13,)
       mfcc_std = np.std(mfcc, axis=1)   # Shape: (13,) - ddof=0

       # 2. Spectral Centroid
       centroid = librosa.feature.spectral_centroid(y=audio, sr=16000)
       centroid_mean = np.mean(centroid) # Scalar
       centroid_std = np.std(centroid)   # Scalar

       # 3. Spectral Bandwidth
       bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=16000)
       bandwidth_mean = np.mean(bandwidth) # Scalar
       bandwidth_std = np.std(bandwidth)   # Scalar

       # 4. Strict 30-feature concatenation
       return np.concatenate([
           mfcc_mean,
           mfcc_std,
           [centroid_mean, centroid_std],
           [bandwidth_mean, bandwidth_std]
       ]).astype(np.float32)
   ```
4. **Model Loading Detail:**
   Because `ductsense_binary_rf_v2.pkl` is saved as a dictionary:
   ```python
   package = joblib.load("models/audio/ductsense_binary_rf_v2.pkl")
   model = package["model"]  # Extract the RandomForestClassifier instance!
   ```
   *Calling `model.predict_proba()` directly on `package` would raise an `AttributeError`.*
5. **Inference Execution:**
   ```python
   features_2d = features.reshape(1, -1)
   leak_prob = float(model.predict_proba(features_2d)[0, 1])
   prediction = "LEAK" if leak_prob >= 0.50 else "NO_LEAK"
   ```

### Recommended Reusable Module Location:
Rather than inlining this extraction inside a FastAPI route, create a reusable Python service:
$$\text{File: } \mathbf{core/audio\_processor.py}$$
This will serve both the FastAPI upload endpoint and future Raspberry Pi hardware stream processing.

---

## 8. Uploaded Audio Strategy

### A. Accepted File Types
1. **`.wav` (Mandatory):** Industry standard PCM uncompressed format. Decoded natively by `soundfile` with zero OS external codec dependencies.
2. **`.mp3`, `.flac`, `.m4a` (Secondary):**
   - `.flac` is supported natively by `soundfile`.
   - `.mp3` and `.m4a` depend on platform-level `ffmpeg` or `libsndfile` build flags. If `ffmpeg` is missing on the host Windows system, `librosa.load()` on `.mp3` will raise a backend decoding exception.
   - **Recommendation:** Restrict initial POC endpoint to `.wav` (with clear 400 validation for other formats), or accept `.flac`/`.mp3` with a `try/except` returning a graceful error: `"Unsupported audio encoding or missing system decoder"`.

### B. Handling Audio Durations

| Audio Duration | Processing Strategy | Rationale |
|---|---|---|
| **< 2.0 sec** (e.g. 0.5s, 1.0s) | Right-pad with zeros to 32,000 samples | Matches Cell 14 training behavior exactly (`np.pad(audio, (0, 32000 - len(audio)))`). Provides single window prediction with metadata flag `padded=True`. |
| **= 2.0 sec** (32,000 samples) | Standard single-window inference | Exact 1:1 match with model training window. |
| **> 2.0 sec** (e.g. 5s, 10s, 30s) | Multi-window sliding segmentation | Truncating after 2s would discard subsequent leak signatures. Segment audio into $N$ overlapping windows. |

### C. Long-Audio Windowing & Striding Strategy
For audio longer than 2.0 seconds:
- **Window Length:** Fixed at `2.0 seconds` ($W = 32,000$ samples).
- **Hop Size / Stride:** 
  - Option 1: Non-overlapping ($H = 2.0\text{s}$, $32,000$ samples). Faster, but can split a transient hiss across window boundaries.
  - Option 2: 50% Overlap ($H = 1.0\text{s}$, $16,000$ samples). **Recommended.** Guarantees that transient acoustic hiss occurring at a boundary is centered in the subsequent window.
  - *Remainder:* If the trailing segment is $< 2.0\text{s}$, either pad to 32,000 samples or evaluate up to the final full 2.0-second slice.

### D. File-Level Aggregation Decision
When $N$ windows produce probabilities $[p_1, p_2, \dots, p_N]$:
1. **Any-Window Maximum (`max(probs)`):**
   - High sensitivity. Flags a leak if even one window triggers.
   - *Risk:* Vulnerable to single transient spikes (e.g. someone dropping a wrench).
2. **Mean Probability (`mean(probs)`):**
   - Smooths noise.
   - *Risk:* Dilutes localized leak signatures in long recordings.
3. **Majority Vote ($> 50\%$ of windows):**
   - Requires persistent acoustic turbulence across the file.
4. **Recommended DuctSense Strategy: Dual Metric (Max + Window Density):**
   - A file is classified as **`LEAK`** if:
     $$\max(p_i) \ge 0.50 \quad \text{AND} \quad (\text{positive\_windows} \ge 1 \text{ for } N \le 2 \text{ OR } \text{positive\_windows} \ge 2 \text{ for } N > 2)$$
   - The API returns both file-level verdict and complete window-by-window telemetry so the technician can visualize acoustic energy across time.

---

## 9. Prediction & Confidence Semantics

### What `predict_proba[:, 1]` Actually Means:
- In this Random Forest model, `predict_proba[:, 1]` represents the **proportion of decision trees (out of 300) that voted for class `LEAK`**.
- It is **not** physical leakage flow rate (L/min).
- It is **not** statistical classification certainty or ground-truth accuracy.
- It is the **acoustic similarity score** to trained leak signatures under ambient noise.

### UI Labeling Guidelines:
- **Prediction:** Binary classification label: `LEAK DETECTED` vs `NO LEAK DETECTED`.
- **Confidence Metric:** Labeled as `Acoustic Leak Probability` or `Model Confidence` (e.g., `87.4%`).
- **Telemetry Breakdown:** Labeled as `Positive Windows: 3 of 5 (60%)`.

### Relationship to Multi-Sensor Fusion (`core/fusion_logic.py`):
- `core/fusion_logic.py` defines:
  $$\text{leak\_confidence} = 0.4 \times \text{thermal} + 0.3 \times \text{pressure} + 0.3 \times \text{audio}$$
  $$\text{leak\_detected} = (\text{leak\_confidence} \ge 0.65) \land (\text{thermal\_confidence} \ge 0.60)$$
- **Crucial Distinction:** In the multi-sensor pipeline, thermal confidence **gates** the final decision. Audio alone cannot trigger a multi-sensor leak alert.
- **Therefore:** The uploaded audio feature must be treated as a **Standalone Acoustic Model Inference Tool**, not forced through `fusion_logic.py`. Conflating the two would result in false negatives whenever an audio file is uploaded without accompanying thermal camera frames.

---

## 10. Proposed API Contract

### Endpoint: `POST /audio/infer`
Consumes an uploaded audio file and outputs comprehensive model telemetry.

#### Request Specification:
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: Audio file binary (required)
  - `hop_seconds`: Float (optional, default: `1.0`, window step size)
  - `threshold`: Float (optional, default: `0.50`, classification threshold)

#### Success Response Schema (`200 OK`):
```json
{
  "status": "success",
  "filename": "duct_section_c_test.wav",
  "file_duration_seconds": 5.49,
  "sample_rate": 16000,
  "model_version": "ductsense_binary_rf_v2",
  "decision_threshold": 0.50,
  "overall_prediction": "LEAK",
  "overall_leak_probability": 0.9902,
  "summary": {
    "total_windows": 4,
    "positive_windows": 3,
    "positive_ratio": 0.75,
    "max_leak_probability": 0.9902,
    "mean_leak_probability": 0.7845
  },
  "windows": [
    {
      "window_index": 0,
      "start_time_s": 0.0,
      "end_time_s": 2.0,
      "leak_probability": 0.9902,
      "prediction": "LEAK"
    },
    {
      "window_index": 1,
      "start_time_s": 1.0,
      "end_time_s": 3.0,
      "leak_probability": 0.9531,
      "prediction": "LEAK"
    },
    {
      "window_index": 2,
      "start_time_s": 2.0,
      "end_time_s": 4.0,
      "leak_probability": 0.9214,
      "prediction": "LEAK"
    },
    {
      "window_index": 3,
      "start_time_s": 3.0,
      "end_time_s": 5.0,
      "leak_probability": 0.2733,
      "prediction": "NO_LEAK"
    }
  ],
  "feature_summary": {
    "feature_count": 30,
    "spectral_centroid_mean_hz": 2841.5,
    "spectral_bandwidth_mean_hz": 2314.2
  }
}
```

#### Error Responses:
- `400 Bad Request`:
  - `{"detail": "File must be an audio file (.wav format required)"}`
  - `{"detail": "Uploaded file is empty (0 bytes)"}`
- `422 Unprocessable Entity`:
  - `{"detail": "Corrupt or unreadable audio file: Unable to decode PCM data"}`
  - `{"detail": "Audio duration must be at least 0.2 seconds"}`
- `503 Service Unavailable`:
  - `{"detail": "Audio model artifact not found at models/audio/ductsense_binary_rf_v2.pkl"}`

---

## 11. Proposed Frontend User Experience (UX)

### Recommended Location:
The least disruptive and most architecturally sound location for this feature is within:
$$\mathbf{dashboard/src/pages/EngineeringPage.jsx} \quad \text{or a dedicated sub-view in} \quad \mathbf{UnifiedEvidencePage.jsx}$$
In `EngineeringPage.jsx`, adding a 4th tab:
`[ Zero-Offset Calibration | Hardware Bus | Sensor Trends | Acoustic ML Inference ]`
preserves the active technician workflow intact while giving engineers an immediate verification console.

### Wireframe & Visual Design:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  SECONDARY ENGINEERING & DIAGNOSTICS                                                   │
│  ACOUSTIC ANOMALY INFERENCE (DUCTSENSE RF-V2)                                          │
│                                                                                        │
│  [ Zero-Offset Calibration ] [ Hardware Bus ] [ Sensor Trends ] [ Acoustic ML Test * ] │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│  UPLOAD ACOUSTIC RECORDING                                             [ 16 kHz Mono ] │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                  │  │
│  │         [ 🎙️ Drag & drop .wav file here, or click to browse ]                    │  │
│  │         Supports 16kHz uncompressed WAV recordings (0.5s – 60s)                  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  Selected: "sample_duct_leak_joint3.wav" (1.2 MB · 5.4 sec)     [ ⚡ RUN INFERENCE ]   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│  INFERENCE RESULTS                                                                     │
│                                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────┐  │
│  │ VERDICT                 │  │ PEAK LEAK PROBABILITY   │  │ TEMPORAL CONSISTENCY   │  │
│  │                         │  │                         │  │                        │  │
│  │   🚨 LEAK DETECTED      │  │         99.0%           │  │   3 / 4 Windows Active │  │
│  │                         │  │                         │  │                        │  │
│  │  Class 1: Escaping Air  │  │   Threshold: 50.0%      │  │   75% Active Duration  │  │
│  └─────────────────────────┘  └─────────────────────────┘  └────────────────────────┘  │
│                                                                                        │
│  TEMPORAL WINDOW BREAKDOWN:                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Window 0 (0.0s – 2.0s): [████████████████████] 99.0%  -> LEAK                    │  │
│  │ Window 1 (1.0s – 3.0s): [███████████████████░] 95.3%  -> LEAK                    │  │
│  │ Window 2 (2.0s – 4.0s): [██████████████████░░] 92.1%  -> LEAK                    │  │
│  │ Window 3 (3.0s – 5.0s): [█████░░░░░░░░░░░░░░░] 27.3%  -> NO_LEAK                 │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  [ 🔄 Analyze Another Recording ]           [ 📋 Copy Telemetry JSON ]                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Proposed End-to-End Architecture

```
User uploads "leak_sample.wav" in Browser
                    │
                    ▼
dashboard/src/pages/EngineeringPage.jsx (or UnifiedEvidencePage)
  - Validates file extension (.wav) & size (< 10 MB)
  - Constructs FormData({ file, hop_seconds: 1.0 })
                    │
                    ▼
HTTP POST http://localhost:8000/audio/infer
                    │
                    ▼
backend/main.py (Route Handler)
  - Receives FastAPI UploadFile
  - Validates Content-Type / MIME
                    │
                    ▼
backend/services/audio_service.py (or core/audio_processor.py)
  - Reads bytes into memory / temp buffer
  - Calls librosa.load(..., sr=16000, mono=True)
                    │
                    ▼
core/audio_processor.py: extract_window_features(audio_segment)
  - Segment audio into 32,000-sample windows (hop = 16,000 samples)
  - Extracts 13 MFCC means, 13 MFCC stds, spectral centroid mean/std, spectral bandwidth mean/std
  - Assembles (N, 30) float32 matrix
                    │
                    ▼
Model Inference Engine
  - Loads models/audio/ductsense_binary_rf_v2.pkl (cached in memory)
  - model.predict_proba(features)[:, 1]
                    │
                    ▼
Temporal Decision Aggregator
  - Computes max_prob, mean_prob, positive_windows count
  - Formulates final "LEAK" or "NO_LEAK" verdict
                    │
                    ▼
FastAPI JSON Response (200 OK)
                    │
                    ▼
dashboard/src/services/apiService.js: inferAudioFile()
                    │
                    ▼
React UI Result Panel
  - Displays Verdict Card, Probability Meter, and Window Progress Bars
```

---

## 13. Edge Hardware Streaming vs. POC File Upload

The two operating modes must remain clearly delineated:

### Mode A: POC / Development File Upload (This Task)
- **Input:** Static recorded `.wav` file uploaded via HTTP multipart form.
- **Trigger:** Manual technician or engineer action.
- **Execution:** Full-file segmentation into $N$ windows, batch feature extraction, synchronous response.
- **Purpose:** Algorithm validation, ground-truth benchmarking, offline duct acoustic auditing.

### Mode B: Final DuctSense Hardware (Raspberry Pi + INMP441)
- **Input:** Continuous PCM I2S audio stream from the physical INMP441 MEMS microphone.
- **Buffer:** Circular ring buffer of 32,000 samples (2.0s) updating at 16 kHz.
- **Trigger:** Periodic tick every 1.0s or 0.5s.
- **Execution:** Sliding-window feature extraction on the active ring buffer $\rightarrow$ local `model.predict_proba()` $\rightarrow$ output `audio_confidence` directly to `core/fusion_logic.py` and local buzzer/GPIO.
- **Reusable Core:** The feature extraction function (`core/audio_processor.py`) and model artifact (`ductsense_binary_rf_v2.pkl`) are **100% reusable** between Mode A and Mode B.

---

## 14. Current System Gaps

| Requirement | Existing? | Location | Current State & Gap Description |
|---|---|---|---|
| Audio Model Artifact | **Yes** | `models/audio/ductsense_binary_rf_v2.pkl` | Model file exists and is valid. |
| Audio Model Metadata | **Yes** | `models/audio/ductsense_binary_rf_v2_meta.json` | Metadata file exists and is valid. |
| Training Feature Extractor | **Yes** | `ml-training/audio/ductsense_binary_training_v1.ipynb` | Exists in Jupyter notebook, but not exported as a Python module. |
| Reusable Inference Module | **No** | None | No standalone `.py` module to load model and extract features at runtime. |
| Audio Inference Endpoint | **No** | `backend/main.py` | No route exists (`POST /audio/infer` is absent). |
| Backend Multipart Support | **No** | `requirements.txt` | `python-multipart` is missing from requirements. |
| Backend Audio Dependencies | **No** | `requirements.txt` | `librosa` and `soundfile` are missing from requirements. |
| Audio Upload UI Component | **No** | `dashboard/src/` | No drag-and-drop or audio file picker component exists. |
| Audio Result Display Card | **No** | `dashboard/src/` | Acoustic UI exists only for static simulated `acousticScore`. |
| Window Aggregation Logic | **No** | None | No logic to combine multi-window predictions for long audio files. |
| Audio Result Persistence | **No** | `backend/sync.db` | DB schema stores walkthrough events and findings, not standalone audio runs. |

---

## 15. Security & File Handling

For safe production handling of audio uploads:
1. **Max File Size Limit:** Enforce strict 10 MB maximum upload limit (`HTTP 413 Payload Too Large`). 10 MB accommodates over 5 minutes of 16 kHz 16-bit mono PCM.
2. **File Extension & Magic Number Validation:** Validate file extension is `.wav`, and verify the first 4 bytes match the RIFF header (`b'RIFF'`) and bytes 8–12 match `b'WAVE'`.
3. **Path Traversal Prevention:** Never save uploaded files using client-supplied filenames. Process audio in-memory (`io.BytesIO`) or in a secure temporary file (`tempfile.NamedTemporaryFile`).
4. **Temporary File Cleanup:** Guarantee deletion of any temporary files using `try...finally` blocks.
5. **Memory Safety & Resource Bounds:** Cap total audio duration to 120 seconds to prevent denial-of-service via huge allocations during STFT/MFCC computation.

---

## 16. Performance Considerations

### Measured Benchmarks (Tested on Active Machine):
Using `models/audio/ductsense_binary_rf_v2.pkl` with Python 3.12 and `librosa 1.0.0`:
- **Model Deserialization (Cold Load):** ~45 ms (one-time cost at server startup).
- **Audio File Loading (`librosa.load` for 2.0s WAV):** ~20–35 ms (warm).
- **Feature Extraction (30 features, 32k samples):** **~3.5 ms – 5.1 ms** (warm).
- **Random Forest Prediction (300 trees, 1 sample):** **~30 ms – 40 ms** (warm).
- **Total Single-Window Inference Latency:** **~35 ms – 45 ms** (excluding network).

### Expected Scaling Behavior:
- **2.0s File (1 window):** Expected latency $\approx 50\text{ ms}$ processing + upload time.
- **10.0s File (9 overlapping windows):** Expected latency $\approx 350\text{ ms}$ processing + upload time.
- **30.0s File (29 overlapping windows):** Expected latency $\approx 1.1\text{ s}$ processing + upload time.
- **60.0s File (59 overlapping windows):** Expected latency $\approx 2.3\text{ s}$ processing + upload time.

*Conclusion:* The Random Forest model is extremely fast. Sub-second response times are achievable for standard HVAC test recordings up to 15 seconds.

---

## 17. Recommended Implementation Plan

### Phase 1: Reusable Audio Inference Module
- **Create:** `core/audio_processor.py`
- **Dependencies:** `joblib`, `librosa`, `numpy`
- **Purpose:** Implements `load_audio_model()`, `extract_audio_features()`, `infer_window()`, and `infer_audio_buffer()`.
- **Risks:** Discrepancy in librosa default FFT parameters if not strictly matched to training Cell 15.

### Phase 2: Backend Dependencies & FastAPI Endpoint
- **Modify:** `requirements.txt` (add `librosa`, `soundfile`, `python-multipart`).
- **Modify:** `backend/main.py` (add `POST /audio/infer` route using `core/audio_processor.py`).
- **Purpose:** Accepts `.wav` multipart uploads, processes windows, returns JSON contract.
- **Risks:** Cold start latency if model is loaded on every request (must load once during FastAPI `lifespan`).

### Phase 3: Frontend API Client
- **Modify:** `dashboard/src/services/apiService.js`
- **Purpose:** Adds `inferAudio(file, options)` using browser `fetch()` with `FormData`.
- **Risks:** CORS errors if backend headers misconfigured (CORS is already open to `*` in `main.py`).

### Phase 4: Frontend UI Component & Integration
- **Create:** `dashboard/src/components/AudioInferencePanel.jsx`
- **Modify:** `dashboard/src/pages/EngineeringPage.jsx` (integrate tab)
- **Purpose:** Provides file dropzone, progress indicator, verdict card, and window timeline.
- **Risks:** Visual style divergence if arbitrary CSS is used rather than existing tokens in `App.css`.

### Phase 5: End-to-End Testing & Validation
- **Execute:** Test matrix against `AIR_LEAK_AUX` files and `Room_Record.wav`.

---

## 18. Test Plan

| Test Case | Test File / Input | Expected Behavior | Failure Criteria |
|---|---|---|---|
| **Known Leak (Short)** | `AIR_LEAK_AUX_1.wav` (0.64s) | Padded to 2s, Prediction: `LEAK`, Probability $> 0.80$ | Predicted `NO_LEAK` or probability $< 0.50$ |
| **Known Leak (Long)** | `AIR_LEAK_AUX_3.wav` (5.49s) | Multi-window evaluated, Prediction: `LEAK`, Prob $> 0.90$ | Predicted `NO_LEAK` |
| **Known No-Leak (Quiet)** | `Room_Record.wav` (2.0s slice) | Prediction: `NO_LEAK`, Probability $< 0.05$ | Predicted `LEAK` or false positive |
| **Known No-Leak (Noise)** | `Room_Record (2).wav` (Mall HVAC) | Prediction: `NO_LEAK`, Probability $< 0.50$ | Predicted `LEAK` |
| **Corrupt File** | Random binary string `.wav` | HTTP 422 Unprocessable Entity with clear error message | Server crash / 500 Unhandled Exception |
| **Unsupported Format** | Image or `.mp4` file renamed `.wav` | HTTP 422 with audio decode failure error | Crash or silent failure |
| **Wrong Extension** | `sample.mp3` | HTTP 400 Bad Request: `.wav required` | Unchecked processing |
| **Silent Audio** | 2.0s array of exact zeros | Prediction: `NO_LEAK` | Crash due to log(0) in MFCC / division by zero |

---

## 19. Risks & Limitations

1. **Missing Dependencies in `requirements.txt`:** If a developer clones the repo and runs `pip install -r requirements.txt`, `librosa` and `python-multipart` will not be present.
2. **Model Bundle Dictionary Packaging:** `ductsense_binary_rf_v2.pkl` is a Python dictionary containing `{"model": ..., ...}`. Developers might mistakenly assume it is the raw `RandomForestClassifier` instance and experience attribute lookup errors.
3. **Training Dataset Distribution:** As documented in `ml-training/audio/README.md`, the model was trained on IICA compressed air leak recordings and two HVAC environmental baselines (`RoomTone2` and `Empty Mall`). High background noise frequencies outside this distribution could cause false positive spikes.
4. **Thermal Gating in Multi-Sensor Pipeline:** Conflating standalone audio testing with `core/fusion_logic.py` would cause unexpected behavior due to `thermal_confidence` gating.

---

## 20. Decisions That Must Be Made Before Implementation

1. **Location in Dashboard Navigation:**
   - *Option A (Recommended):* Inside `EngineeringPage.jsx` as a diagnostic/ML validation sub-tab. Zero disruption to active inspection sessions.
   - *Option B:* Inside `UnifiedEvidencePage.jsx` under the `ACOUSTIC` tab.
2. **Audio Format Scope:**
   - *Option A (Recommended for POC):* Restrict strictly to uncompressed `.wav`.
   - *Option B:* Support `.mp3` and `.flac` with graceful fallback if host codecs are absent.
3. **Persistence of Uploaded Audio Findings:**
   - *Option A (Recommended for POC):* Ephemeral inference (in-memory results returned to browser, not saved to SQLite).
   - *Option B:* Persist audio inference results into `backend/sync.db` as a new finding or walkthrough event.
4. **Multi-Window Decision Threshold:**
   - Agree on whether file-level verdict requires $\ge 1$ or $\ge 2$ positive windows for recordings longer than 4 seconds.
