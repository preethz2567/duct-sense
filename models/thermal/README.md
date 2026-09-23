# DuctSense Thermal Leak Detection Model

## Model

DuctSense uses a MobileNetV3-Small model pretrained on ImageNet for binary thermal leak classification.

The model classifies thermal images into `leak` and `no_leak`.

The final model outputs a single leak confidence value between 0 and 1.

## Input

Input shape:

```text
(1, 3, 224, 224)

Images are resized to 224 x 224.

ImageNet normalization:

mean = [0.485, 0.456, 0.406]
std  = [0.229, 0.224, 0.225]
Training Augmentation

Training images use:

Random horizontal flip with probability 0.5
Random rotation up to 15 degrees
Color jitter with brightness 0.2 and contrast 0.2
Training Configuration
Backbone: MobileNetV3-Small
Pretrained weights: ImageNet
Maximum epochs: 30
Early stopping patience: 5
Optimizer: Adam
Learning rate: 0.0001
Loss: Binary Cross Entropy
Train/validation split: 80/20
Random seed: 42
Dataset

Prepared dataset:

Leak: 562 images
No leak: 273 images
Total: 835 images

Images labelled OPEN were excluded from training.

Raw dataset files are not committed to Git.

Output

The ONNX model produces a single floating-point value between 0 and 1, representing leak confidence.

0.0 -> low leak confidence
1.0 -> high leak confidence
ONNX Model

Model file:

models/thermal/thermal_model.onnx

The model expects an input tensor with shape (1, 3, 224, 224).

Inference is performed using ONNX Runtime.

Inference

Run:

python ml-training/thermal/test_inference.py <image_path>

