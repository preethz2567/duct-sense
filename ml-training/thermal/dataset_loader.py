"""
dataset_loader.py

Loads thermal images from:

    dataset/leak/
    dataset/no_leak/

Labels:
    1 = leak
    0 = no_leak
"""

import os
from pathlib import Path

from PIL import Image

import torch
from torch.utils.data import Dataset
from torchvision import transforms


# ImageNet normalization
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


# dataset/ is inside ml-training/thermal/
DATASET_DIR = Path(__file__).resolve().parent / "dataset"


def get_train_transform():
    """
    Transformations used during training.
    """

    return transforms.Compose([
        transforms.Resize((224, 224)),

        transforms.RandomHorizontalFlip(p=0.5),

        transforms.RandomRotation(degrees=15),

        transforms.ColorJitter(
            brightness=0.2,
            contrast=0.2
        ),

        transforms.ToTensor(),

        transforms.Normalize(
            mean=IMAGENET_MEAN,
            std=IMAGENET_STD
        )
    ])


def get_val_transform():
    """
    Transformations used during validation.
    No random augmentation.
    """

    return transforms.Compose([
        transforms.Resize((224, 224)),

        transforms.ToTensor(),

        transforms.Normalize(
            mean=IMAGENET_MEAN,
            std=IMAGENET_STD
        )
    ])


class ThermalLeakDataset(Dataset):

    def __init__(self, transform):

        self.transform = transform

        # Stores:
        # (image_path, label)
        #
        # 1 = leak
        # 0 = no_leak
        self.samples = []

        leak_dir = DATASET_DIR / "leak"
        no_leak_dir = DATASET_DIR / "no_leak"

        if not leak_dir.exists():
            raise FileNotFoundError(
                f"Leak folder not found:\n{leak_dir}"
            )

        if not no_leak_dir.exists():
            raise FileNotFoundError(
                f"No-leak folder not found:\n{no_leak_dir}"
            )

        valid_extensions = {
            ".jpg",
            ".jpeg",
            ".png",
            ".bmp",
            ".tif",
            ".tiff"
        }

        # Load leak images
        for filename in sorted(os.listdir(leak_dir)):

            filepath = leak_dir / filename

            if (
                filepath.is_file()
                and filepath.suffix.lower()
                in valid_extensions
            ):
                self.samples.append(
                    (filepath, 1)
                )

        # Load no-leak images
        for filename in sorted(os.listdir(no_leak_dir)):

            filepath = no_leak_dir / filename

            if (
                filepath.is_file()
                and filepath.suffix.lower()
                in valid_extensions
            ):
                self.samples.append(
                    (filepath, 0)
                )

        if len(self.samples) == 0:
            raise ValueError(
                "No images found in dataset."
            )

        leak_count = sum(
            label == 1
            for _, label in self.samples
        )

        no_leak_count = sum(
            label == 0
            for _, label in self.samples
        )

        print(
            f"Loaded {len(self.samples)} images "
            f"({leak_count} leak, "
            f"{no_leak_count} no_leak)"
        )

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):

        filepath, label = self.samples[index]

        image = Image.open(filepath).convert("RGB")

        image = self.transform(image)

        label = torch.tensor(
            label,
            dtype=torch.float32
        )

        return image, label