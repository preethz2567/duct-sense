import torch
from torchvision import models
from pathlib import Path


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

CHECKPOINT_PATH = (
    BASE_DIR
    / "ml-training"
    / "thermal"
    / "best_model.pth"
)

OUTPUT_PATH = (
    BASE_DIR
    / "models"
    / "thermal"
    / "thermal_model.onnx"
)


# --------------------------------------------------
# Build the same model architecture used for training
# --------------------------------------------------

model = models.mobilenet_v3_small(
    weights=None
)

# Replace final classifier with:
# Linear -> Sigmoid
model.classifier[3] = torch.nn.Sequential(
    torch.nn.Linear(
        model.classifier[3].in_features,
        1
    ),
    torch.nn.Sigmoid()
)


# --------------------------------------------------
# Load trained weights
# --------------------------------------------------

checkpoint = torch.load(
    CHECKPOINT_PATH,
    map_location="cpu"
)

model.load_state_dict(checkpoint)

model.eval()


# --------------------------------------------------
# Create dummy input
# Required input shape:
# (1, 3, 224, 224)
# --------------------------------------------------

dummy_input = torch.randn(
    1,
    3,
    224,
    224
)


# --------------------------------------------------
# Export to ONNX
# --------------------------------------------------

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

torch.onnx.export(
    model,
    dummy_input,
    str(OUTPUT_PATH),
    input_names=["input"],
    output_names=["leak_confidence"],
    opset_version=17
)


print("ONNX export successful!")
print(f"Model saved at:")
print(OUTPUT_PATH)