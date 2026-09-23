"""
train.py

Trains a MobileNetV3-Small model to classify thermal images as:

    1 = leak
    0 = no_leak

Run this only after images have been placed inside:

    dataset/leak/
    dataset/no_leak/
"""

import torch
import torch.nn as nn

from torch.utils.data import DataLoader, random_split

from torchvision import models

from pathlib import Path

from dataset_loader import (
    ThermalLeakDataset,
    get_train_transform,
    get_val_transform
)


# ---------------------------------------------------------
# TRAINING SETTINGS
# ---------------------------------------------------------

SEED = 42

MAX_EPOCHS = 30

EARLY_STOP_PATIENCE = 5

LEARNING_RATE = 0.0001

BATCH_SIZE = 8


# Where the best trained model will be saved.
CHECKPOINT_PATH = (
    Path(__file__).resolve().parent / "best_model.pth"
)


# ---------------------------------------------------------
# BUILD THE MODEL
# ---------------------------------------------------------

def build_model():

    """
    Creates MobileNetV3-Small with ImageNet pretrained weights.

    We replace the original final classifier because the original
    model predicts 1000 ImageNet classes.

    Our model only needs to predict:

        leak
        no_leak
    """

    model = models.mobilenet_v3_small(
        weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1
    )

    # Find the number of inputs expected by the final layer.
    in_features = model.classifier[-1].in_features

    # Replace the original ImageNet classifier.
    model.classifier[-1] = nn.Sequential(

        nn.Linear(
            in_features,
            1
        ),

        nn.Sigmoid()
    )

    return model


# ---------------------------------------------------------
# TRAINING
# ---------------------------------------------------------

def train():

    # Make training reproducible.
    torch.manual_seed(SEED)


    # -----------------------------------------------------
    # LOAD DATASET
    # -----------------------------------------------------

    train_dataset = ThermalLeakDataset(
        transform=get_train_transform()
    )

    val_dataset = ThermalLeakDataset(
        transform=get_val_transform()
    )


    total_images = len(train_dataset)


    # 20% validation
    validation_count = int(total_images * 0.2)

    training_count = total_images - validation_count


    # Make sure the same images are selected for the same
    # train/validation split every time.
    generator = torch.Generator().manual_seed(SEED)


    train_indices, val_indices = random_split(
        range(total_images),
        [
            training_count,
            validation_count
        ],
        generator=generator
    )


    # Use training transformations for training data.
    train_subset = torch.utils.data.Subset(
        train_dataset,
        train_indices.indices
    )


    # Use validation transformations for validation data.
    val_subset = torch.utils.data.Subset(
        val_dataset,
        val_indices.indices
    )


    # -----------------------------------------------------
    # DATA LOADERS
    # -----------------------------------------------------

    train_loader = DataLoader(
        train_subset,
        batch_size=BATCH_SIZE,
        shuffle=True
    )


    val_loader = DataLoader(
        val_subset,
        batch_size=BATCH_SIZE,
        shuffle=False
    )


    print(
        f"Train samples: {training_count} | "
        f"Validation samples: {validation_count}"
    )


    # -----------------------------------------------------
    # DEVICE
    # -----------------------------------------------------

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )


    print(f"Using device: {device}")


    # -----------------------------------------------------
    # MODEL
    # -----------------------------------------------------

    model = build_model()

    model = model.to(device)


    # Binary classification loss.
    criterion = nn.BCELoss()


    # Adam optimizer.
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=LEARNING_RATE
    )


    # -----------------------------------------------------
    # EARLY STOPPING VARIABLES
    # -----------------------------------------------------

    best_val_loss = float("inf")

    epochs_without_improvement = 0


    # -----------------------------------------------------
    # TRAINING LOOP
    # -----------------------------------------------------

    for epoch in range(
        1,
        MAX_EPOCHS + 1
    ):


        # =================================================
        # TRAINING PASS
        # =================================================

        model.train()


        train_loss_total = 0.0

        train_correct = 0


        for images, labels in train_loader:

            images = images.to(device)

            labels = labels.to(device)

            # Convert:
            #
            # [0, 1, 0, 1]
            #
            # into:
            #
            # [[0], [1], [0], [1]]
            labels = labels.unsqueeze(1)


            # Clear old gradients.
            optimizer.zero_grad()


            # Model prediction.
            outputs = model(images)


            # Calculate error.
            loss = criterion(
                outputs,
                labels
            )


            # Calculate gradients.
            loss.backward()


            # Update model weights.
            optimizer.step()


            # Track total loss.
            train_loss_total += (
                loss.item() * images.size(0)
            )


            # Count correct predictions.
            train_correct += (
                (outputs >= 0.5).float() == labels
            ).sum().item()


        train_loss = (
            train_loss_total / training_count
        )


        train_accuracy = (
            train_correct / training_count
        )


        # =================================================
        # VALIDATION PASS
        # =================================================

        model.eval()


        validation_loss_total = 0.0

        validation_correct = 0


        # Don't calculate gradients during validation.
        with torch.no_grad():

            for images, labels in val_loader:

                images = images.to(device)

                labels = labels.to(device)

                labels = labels.unsqueeze(1)


                outputs = model(images)


                loss = criterion(
                    outputs,
                    labels
                )


                validation_loss_total += (
                    loss.item() * images.size(0)
                )


                validation_correct += (
                    (outputs >= 0.5).float() == labels
                ).sum().item()


        validation_loss = (
            validation_loss_total /
            max(validation_count, 1)
        )


        validation_accuracy = (
            validation_correct /
            max(validation_count, 1)
        )


        # -------------------------------------------------
        # PRINT RESULTS
        # -------------------------------------------------

        print(
            f"Epoch {epoch:2d}/{MAX_EPOCHS} | "
            f"train_loss={train_loss:.4f} "
            f"train_acc={train_accuracy:.3f} | "
            f"val_loss={validation_loss:.4f} "
            f"val_acc={validation_accuracy:.3f}"
        )


        # =================================================
        # SAVE BEST MODEL
        # =================================================

        if validation_loss < best_val_loss:

            best_val_loss = validation_loss

            epochs_without_improvement = 0


            torch.save(
                model.state_dict(),
                CHECKPOINT_PATH
            )


            print(
                f"  -> New best model saved "
                f"(val_loss={validation_loss:.4f})"
            )


        else:

            epochs_without_improvement += 1


            if (
                epochs_without_improvement
                >= EARLY_STOP_PATIENCE
            ):

                print(
                    f"No improvement for "
                    f"{EARLY_STOP_PATIENCE} epochs. "
                    f"Stopping early."
                )

                break


    print(
        f"\nTraining done."
        f"\nBest model saved at:"
        f"\n{CHECKPOINT_PATH}"
    )


# ---------------------------------------------------------
# PROGRAM ENTRY POINT
# ---------------------------------------------------------

if __name__ == "__main__":

    train()