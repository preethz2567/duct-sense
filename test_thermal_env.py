import sys
import os
import traceback
from pathlib import Path

print("ENVIRONMENT")
print(f"- Python version: {sys.version}")
print(f"- virtual environment: {os.environ.get('VIRTUAL_ENV', 'None')}")

try:
    import numpy as np
    print("- numpy: ok")
except Exception as e:
    print(f"- numpy: {e}")

try:
    import sklearn
    print("- sklearn: ok")
except Exception as e:
    print(f"- sklearn: {e}")

try:
    import joblib
    print("- joblib: ok")
except Exception as e:
    print(f"- joblib: {e}")

try:
    from PIL import Image
    print("- Pillow: ok")
except Exception as e:
    print(f"- Pillow: {e}")

try:
    import flyr
    print("- flyr: ok")
except Exception as e:
    print(f"- flyr: {e}")


print("\nMODEL")
try:
    from sensors.thermal_reader import _get_model_and_scaler
    model, scaler = _get_model_and_scaler()
    print("- model load: ok")
    print("- scaler load: ok")
except Exception as e:
    print(f"- model load: {e}")
    print(f"- scaler load: {e}")

try:
    import json
    meta_path = Path("models/thermal/thermal_model_meta.json")
    with open(meta_path, "r") as f:
        meta = json.load(f)
    print(f"- metadata load: {meta['model_type']} ({len(meta['feature_names'])} features)")
except Exception as e:
    print(f"- metadata load: {e}")

print("\nDIRECT INFERENCE")
try:
    from sensors.thermal_reader import analyze
    import glob
    test_images = glob.glob("dashboard/public/assets/thermal/*.jpg")
    for test_image in test_images:
        print(f"\n- test image: {test_image}")
        result = analyze(test_image, out_dir="test_out", save_overlay_png=False)
        print(f"  - inference: {result.get('quality_flag', 'unknown')}")
        if result.get('quality_flag') != 'read_error':
            print(f"  - thermal_confidence: {result.get('thermal_confidence')}")
            print(f"  - anomaly_delta_c: {result.get('anomaly_delta_c')}")
except Exception as e:
    print(f"- inference: error - {e}")
    traceback.print_exc()

