# DuctSense

An AI-powered HVAC duct monitoring system using thermal and audio sensors for real-time anomaly detection.

## Folder Structure

```
ductsense/
├── README.md            # Project overview and documentation entry point
├── .gitignore           # Git exclusion rules (datasets, caches, env files)
├── requirements.txt     # Python package dependencies
├── simulator/           # Sensor data simulators for development and testing
├── core/                # Shared core logic, utilities, and data models
├── storage/             # Data persistence layer (local DB, file I/O helpers)
├── sensors/             # Sensor interface drivers (thermal camera, microphone)
├── models/
│   ├── thermal/         # Exported ONNX/model files for thermal anomaly detection
│   └── audio/           # Exported ONNX/model files for audio anomaly detection
├── ml-training/
│   ├── thermal/         # Training scripts and notebooks for the thermal model
│   └── audio/           # Training scripts and notebooks for the audio model
├── dashboard/           # Frontend UI (web dashboard for live monitoring)
├── backend/             # FastAPI backend server and REST API routes
├── spatial-viewer/      # 3D spatial duct map viewer component
└── docs/                # Project documentation, architecture diagrams, specs
```

> **Note:** Raw training datasets (`ml-training/*/dataset/`) are excluded from git.
> Only the final exported model files in `models/thermal/` and `models/audio/` are committed.
