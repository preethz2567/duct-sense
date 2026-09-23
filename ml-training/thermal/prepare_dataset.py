"""
prepare_dataset.py

Converts the WinLeak dataset into the folder structure
needed by our DuctSense training pipeline.

LEAK    -> dataset/leak/
NO_LEAK -> dataset/no_leak/
OPEN    -> ignored
"""

import csv
import shutil
from pathlib import Path


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

RAW_DIR = BASE_DIR / "raw_dataset"

THERMAL_DIR = RAW_DIR / "thermal"

CSV_PATH = RAW_DIR / "meta_data.csv"

OUTPUT_DIR = BASE_DIR / "dataset"

LEAK_DIR = OUTPUT_DIR / "leak"

NO_LEAK_DIR = OUTPUT_DIR / "no_leak"


# ---------------------------------------------------------
# CREATE OUTPUT FOLDERS
# ---------------------------------------------------------

LEAK_DIR.mkdir(parents=True, exist_ok=True)

NO_LEAK_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# CHECK INPUTS
# ---------------------------------------------------------

if not CSV_PATH.exists():

    raise FileNotFoundError(
        f"Could not find metadata file:\n{CSV_PATH}"
    )


if not THERMAL_DIR.exists():

    raise FileNotFoundError(
        f"Could not find thermal image folder:\n{THERMAL_DIR}"
    )


# ---------------------------------------------------------
# COUNTERS
# ---------------------------------------------------------

leak_count = 0

no_leak_count = 0

open_count = 0

missing_count = 0


# ---------------------------------------------------------
# READ CSV
# ---------------------------------------------------------

with open(
    CSV_PATH,
    "r",
    encoding="utf-8-sig",
    newline=""
) as file:

    reader = csv.DictReader(file)

    # Make sure the required columns exist.
    required_columns = {
        "THERMAL_IMG_NAME",
        "CLASS_LABEL"
    }

    if not required_columns.issubset(reader.fieldnames):

        raise ValueError(
            "CSV is missing required columns.\n"
            f"Found columns: {reader.fieldnames}"
        )


    # -----------------------------------------------------
    # PROCESS EACH IMAGE
    # -----------------------------------------------------

    for row in reader:

        image_name = row["THERMAL_IMG_NAME"].strip()

        label = row["CLASS_LABEL"].strip().upper()

        source = THERMAL_DIR / image_name


        # ---------------------------------------------
        # LEAK
        # ---------------------------------------------

        if label == "LEAK":

            destination = LEAK_DIR / image_name

            if source.exists():

                shutil.copy2(
                    source,
                    destination
                )

                leak_count += 1

            else:

                print(
                    f"WARNING: Missing image: {source}"
                )

                missing_count += 1


        # ---------------------------------------------
        # NO LEAK
        # ---------------------------------------------

        elif label == "NO_LEAK":

            destination = NO_LEAK_DIR / image_name

            if source.exists():

                shutil.copy2(
                    source,
                    destination
                )

                no_leak_count += 1

            else:

                print(
                    f"WARNING: Missing image: {source}"
                )

                missing_count += 1


        # ---------------------------------------------
        # OPEN
        # ---------------------------------------------

        elif label == "OPEN":

            open_count += 1


# ---------------------------------------------------------
# FINAL REPORT
# ---------------------------------------------------------

print("\n========================================")

print("WinLeak dataset preparation complete!")

print("========================================")

print(f"LEAK images copied:     {leak_count}")

print(f"NO_LEAK images copied:  {no_leak_count}")

print(f"OPEN images ignored:    {open_count}")

print(f"Missing images:         {missing_count}")

print("========================================")

print(f"\nDataset location:")

print(OUTPUT_DIR)