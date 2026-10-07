# DuctSense Thermal ML Handoff

## 1. Overview

The DuctSense thermal leak detection module analyzes radiometric thermal images captured using the FLIR E95 thermal camera.

The current implementation uses a classical Machine Learning approach rather than the previous CNN/MobileNetV3 approach.

### Current pipeline

FLIR E95 radiometric image
↓
Thermal feature extraction
↓
StandardScaler
↓
Logistic Regression
↓
`thermal_confidence`
↓
Sensor Fusion

The sensor-fusion layer is handled separately by the sensor-fusion implementation.

---

## 2. Model

The current model is:

**Logistic Regression**

Model artifact:

```text
models/thermal/thermal_model.joblib
```

Scaler:

```text
models/thermal/thermal_scaler.joblib
```

Model metadata:

```text
models/thermal/thermal_model_meta.json
```

Inference implementation:

```text
sensors/thermal_reader.py
```

---

## 3. Input Requirements

The inference function expects the original **radiometric FLIR E95 image**.

Use the original FLIR thermal image files.

Do NOT use:

* screenshots
* normal RGB photographs
* generated overlay PNGs
* compressed visualizations that do not contain radiometric temperature data

The model depends on actual temperature values extracted from the radiometric image.

---

## 4. Thermal Features

The model uses six physically meaningful features.

They must remain in this exact order:

```text
1. max_temp_c
2. mean_temp_c
3. temp_range_c
4. temp_std_c
5. delta_from_background_c
6. hot_pixel_fraction
```

### Feature meanings

**max_temp_c**

Maximum temperature detected in the image.

**mean_temp_c**

Average temperature across the thermal image.

**temp_range_c**

Difference between maximum and minimum temperature.

```text
max_temp_c - min_temp_c
```

**temp_std_c**

Standard deviation of the temperature values.

**delta_from_background_c**

Difference between the hottest temperature and the median/background temperature.

**hot_pixel_fraction**

Percentage of pixels that are more than 2°C above the median/background temperature.

---

## 5. Inference

The main inference implementation is:

```text
sensors/thermal_reader.py
```

The inference function is:

```python
analyze(image_path)
```

Example:

```python
from sensors.thermal_reader import analyze

result = analyze("path/to/FLIR_image.jpg")

print(result)
```

The result contains the thermal analysis information, including:

```text
thermal_confidence
```

---

## 6. Thermal Confidence

`thermal_confidence` is a continuous value between:

```text
0.0 → 1.0
```

Higher values indicate stronger thermal evidence of a leak.

Example:

```text
0.95  → strong thermal leak evidence
0.70  → moderate/strong thermal leak evidence
0.50  → threshold boundary
0.20  → weak thermal leak evidence
0.05  → very weak thermal leak evidence
```

For a simple standalone thermal verdict:

```text
thermal_confidence >= 0.5
```

can be interpreted as:

```text
LEAK
```

and values below 0.5 as:

```text
NO_LEAK
```

However, the preferred approach for DuctSense is to pass the continuous confidence value to the sensor-fusion layer rather than converting it to a boolean too early.

---

## 7. Recommended Sensor-Fusion Usage

The thermal module should provide:

```text
thermal_confidence
```

to the sensor-fusion system.

The fusion system can then combine the thermal confidence with the other sensor measurements.

Conceptually:

```text
Thermal sensor
      ↓
thermal_confidence
      ↓
              ┌──────────────┐
Other sensors → Sensor Fusion → Final Leak Confidence
              └──────────────┘
                         ↓
                    Leak decision
```

The thermal module itself should not make the final DuctSense leak decision.

---

## 8. Model Performance

Current dataset:

```text
97 real FLIR E95 images
51 leak
46 no_leak
```

Training set:

```text
77 images
```

Validation set:

```text
20 images
```

Current validation results:

```text
Accuracy: 75.0%
Precision: 80.0%
Recall: 72.7%
F1 Score: 0.762
```

A separate live inference check was performed on six real FLIR images.

Results:

```text
6 / 6 classifications correct
```

These results are suitable for the current Proof of Concept.

They should NOT be presented as production-level performance because the dataset is still small.

---

## 9. Important Limitation

The current validation split is a random stratified split.

Thermal images from the same capture session may therefore be present in both training and validation data.

This can make validation performance appear better than performance on completely unseen sessions.

For a production-oriented model, session-aware splitting or GroupKFold validation should be used.

---

## 10. Legacy Model

The previous CNN/MobileNetV3 ONNX model is no longer used by the active inference pipeline.

The old model has been preserved only as a deprecated artifact:

```text
models/thermal/thermal_model_v1_winleak_DEPRECATED.onnx
```

The active thermal model is the Logistic Regression model:

```text
models/thermal/thermal_model.joblib
```

---

## 11. Current Git Version

The completed thermal ML migration was committed as:

```text
d71ea25
```

Commit:

```text
feat: replace thermal CNN with feature-based ML PoC
```

This commit is already pushed to the `main` branch.

---

## 12. For Sensor-Fusion Integration

The sensor-fusion implementation should consume:

```text
thermal_confidence
```

as a continuous value.

Recommended behavior:

```python
thermal_confidence = result["thermal_confidence"]
```

Then use that value as one of the inputs to the fusion logic.

Avoid modifying the thermal model, scaler, or feature ordering unless the ML pipeline is intentionally retrained and versioned again.

---

## 13. Quick Integration Example

```python
from sensors.thermal_reader import analyze

result = analyze("FLIR_image.jpg")

thermal_confidence = result.get("thermal_confidence")

if thermal_confidence is not None:
    # Pass thermal_confidence to sensor-fusion logic
    fusion_input = thermal_confidence
```

The sensor-fusion layer is responsible for combining this value with the other sensor signals and determining the final DuctSense decision.

---

## 14. Summary

The thermal ML module is currently:

```text
FLIR E95
   ↓
Radiometric temperature data
   ↓
6 thermal features
   ↓
StandardScaler
   ↓
Logistic Regression
   ↓
thermal_confidence (0–1)
   ↓
Sensor Fusion
```

The thermal ML component has been tested and committed.

**Status: Ready for POC integration.**
