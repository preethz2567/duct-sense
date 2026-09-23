import sys
from pathlib import Path

import numpy as np
from PIL import Image
import onnxruntime as ort


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "thermal"
    / "thermal_model.onnx"
)


# --------------------------------------------------
# Check command-line argument
# --------------------------------------------------

if len(sys.argv) != 2:
    print("Usage:")
    print(
        "python ml-training\\thermal\\test_inference.py "
        "<image_path>"
    )
    sys.exit(1)


IMAGE_PATH = Path(sys.argv[1])


# --------------------------------------------------
# Load ONNX model
# --------------------------------------------------

session = ort.InferenceSession(
    str(MODEL_PATH),
    providers=["CPUExecutionProvider"]
)


# --------------------------------------------------
# Load and preprocess image
# --------------------------------------------------

image = Image.open(IMAGE_PATH).convert("RGB")

image = image.resize((224, 224))

image = np.array(image).astype(np.float32) / 255.0


# ImageNet normalization
mean = np.array(
    [0.485, 0.456, 0.406],
    dtype=np.float32
)

std = np.array(
    [0.229, 0.224, 0.225],
    dtype=np.float32
)

image = (image - mean) / std


# HWC -> CHW
image = np.transpose(
    image,
    (2, 0, 1)
)


# Add batch dimension
image = np.expand_dims(
    image,
    axis=0
)


# --------------------------------------------------
# Run inference
# --------------------------------------------------

input_name = session.get_inputs()[0].name

output = session.run(
    None,
    {
        input_name: image
    }
)


# --------------------------------------------------
# Read leak confidence
# --------------------------------------------------

leak_confidence = float(
    np.asarray(output[0]).reshape(-1)[0]
)


print()
print("===================================")
print("DuctSense Thermal Inference")
print("===================================")
print(f"Image: {IMAGE_PATH}")
print(f"Leak confidence: {leak_confidence:.4f}")
print(f"Leak confidence: {leak_confidence * 100:.2f}%")
print("===================================")