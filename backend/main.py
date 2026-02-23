import os
import io
import base64
import cv2
import sys
from collections import Counter
import numpy as np
from PIL import Image

# FastAPI tools
from fastapi import FastAPI, File, UploadFile, Query, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# AI and YOLO
from ultralytics import YOLO
from dotenv import load_dotenv

# Import LLM specialist function
from llm import analyze_detections

# Setup
load_dotenv()
sys.stdout.flush()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 1. Configuration & Model Loading (The "Brain")
# ---------------------------------------------------------
MODEL_PATHS = {
    "generic_detection_yolov8": "models/PixCellv1.pt",
    "parasite_detection_yolov8": "models/parasite_detection_yolov8.onnx",
    "anemia_detection_yolov8": "models/anemia_detection_yolov8.onnx",
    "malaria_detection_yolov8": "models/malaria_detection_yolov8.onnx",
}

model_cache = {}

def get_model(model_name: str) -> YOLO:
    """Loads a model from cache or disk safely."""
    if model_name not in MODEL_PATHS:
        raise ValueError(f"Unknown model_name: {model_name}")
    
    if model_name not in model_cache:
        model_cache[model_name] = YOLO(MODEL_PATHS[model_name])
        print(f"Model {model_name} loaded from {MODEL_PATHS[model_name]}")
        
    return model_cache[model_name]

# ---------------------------------------------------------
# 2. Core Processing Logic (The "Engine")
# ---------------------------------------------------------
def process_image_with_yolo(image_bytes: bytes, yolo_model: YOLO):
    """
    Centralized function to handle all YOLO predictions. 
    Prevents repeating this 5 times in the endpoints below.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Run prediction
    results = yolo_model.predict(image, save=False, save_txt=False)
    result = results[0]
    
    class_names = []
    detection_details = []
    
    # Extract boxes
    if result.boxes is not None:
        for box in result.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            class_name = yolo_model.names[cls]
            
            class_names.append(class_name)
            detection_details.append({
                "class": class_name,
                "confidence": conf,
                "bbox": xyxy
            })
            
    class_counts = Counter(class_names)
    
    # Generate visual plot
    img_with_boxes = result.plot()
    img_with_boxes = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)
    img_pil = Image.fromarray(img_with_boxes)
    
    img_bytes_out = io.BytesIO()
    img_pil.save(img_bytes_out, format="JPEG")
    img_bytes_out.seek(0)
    
    return class_counts, detection_details, img_bytes_out

# ---------------------------------------------------------
# 3. API Endpoints (The "Routing")
# ---------------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...), model_name: str = Query("anemia_detection_yolov8")):
    try:
        yolo_model = get_model(model_name)
        _, _, img_bytes_out = process_image_with_yolo(await file.read(), yolo_model)
        return StreamingResponse(img_bytes_out, media_type="image/jpeg")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/predict-with-data")
async def predict_with_data(file: UploadFile = File(...), model_name: str = Query("anemia_detection_yolov8")):
    try:
        yolo_model = get_model(model_name)
        class_counts, _, _ = process_image_with_yolo(await file.read(), yolo_model)
        return JSONResponse({
            "success": True,
            "detections": dict(class_counts),
            "total_detections": sum(class_counts.values())
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/ai-analysis")
async def ai_analysis(
    file: UploadFile = File(...), 
    model_name: str = Query("anemia_detection_yolov8"),
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    try:
        yolo_model = get_model(model_name)
        class_counts, _, _ = process_image_with_yolo(await file.read(), yolo_model)
        
        if not class_counts:
            return JSONResponse({"success": False, "error": "No detections found", "detection_summary": {}})
            
        analysis = analyze_detections(dict(class_counts), sample_type, stain, magnification)
        return JSONResponse(analysis)
    except Exception as e:
        return JSONResponse({"success": False, "error": f"Analysis failed: {str(e)}", "detection_summary": {}})

@app.post("/detect-and-analyze")
async def detect_and_analyze(
    file: UploadFile = File(...), 
    model_name: str = Query("anemia_detection_yolov8"),
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    try:
        yolo_model = get_model(model_name)
        class_counts, details, img_bytes_out = process_image_with_yolo(await file.read(), yolo_model)
        
        processed_image_base64 = base64.b64encode(img_bytes_out.getvalue()).decode("utf-8")
        
        ai_analysis_result = None
        if class_counts:
            ai_analysis_result = analyze_detections(dict(class_counts), sample_type, stain, magnification)
        else:
            ai_analysis_result = {"success": False, "error": "No detections found", "detection_summary": {}}

        return JSONResponse({
            "success": True,
            "detections": dict(class_counts),
            "total_detections": sum(class_counts.values()),
            "detection_details": details,
            "ai_analysis": ai_analysis_result,
            "processed_image_base64": processed_image_base64
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": f"Failed: {str(e)}"})

@app.post("/detect-and-analyze-batch")
async def detect_and_analyze_batch(
    request: Request,
    model_name: str = Query("anemia_detection_yolov8"),
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    try:
        form = await request.form()
        files = form.getlist("files")
        
        if not files:
            return JSONResponse({"success": False, "error": "No files provided"})
            
        yolo_model = get_model(model_name)
        total_class_counts = Counter()
        per_image_results = []
        
        for idx, file_item in enumerate(files):
            filename = file_item.filename or f'image_{idx}.jpg'
            try:
                class_counts, details, img_bytes_out = process_image_with_yolo(await file_item.read(), yolo_model)
                processed_image_base64 = base64.b64encode(img_bytes_out.getvalue()).decode('utf-8')
                
                total_class_counts.update(class_counts)
                
                per_image_results.append({
                    "image_index": idx,
                    "filename": filename,
                    "detections": dict(class_counts),
                    "total_detections": sum(class_counts.values()),
                    "detection_details": details,
                    "processed_image_base64": processed_image_base64
                })
            except Exception as e:
                per_image_results.append({"image_index": idx, "filename": filename, "error": str(e)})

        ai_analysis_result = None
        if total_class_counts:
            ai_analysis_result = analyze_detections(dict(total_class_counts), sample_type, stain, magnification)
        else:
            ai_analysis_result = {"success": False, "error": "No detections found"}

        return JSONResponse({
            "success": True,
            "total_counts": dict(total_class_counts),
            "total_detections": sum(total_class_counts.values()),
            "results": per_image_results,
            "ai_analysis": ai_analysis_result,
            "images_processed": len(files)
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": f"Batch failed: {str(e)}"})