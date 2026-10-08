from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import shutil
from sensors.thermal_reader import analyze

app = FastAPI(title="Thermal Test API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)

@app.post("/thermal/analyze")
async def analyze_thermal(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['jpg', 'jpeg']:
        raise HTTPException(status_code=400, detail="Unsupported image format. Please upload a FLIR JPG.")
        
    temp_path = TEMP_DIR / file.filename
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = analyze(str(temp_path), out_dir="test_out", save_overlay_png=False)
        
        if result.get("quality_flag") == "read_error":
            raise HTTPException(status_code=400, detail=f"Image is not a valid radiometric FLIR image: {result.get('error')}")
            
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result.get("error"))

        return {
            "success": True,
            "thermal_confidence": result.get("thermal_confidence"),
            "anomaly_delta_c": result.get("anomaly_delta_c"),
            "quality_flag": result.get("quality_flag"),
            "anomaly_type": result.get("anomaly_type"),
            "scene_temp_min_c": result.get("scene_temp_min_c"),
            "scene_temp_max_c": result.get("scene_temp_max_c"),
            "background_c": result.get("background_c"),
        }
    finally:
        if temp_path.exists():
            os.remove(temp_path)
