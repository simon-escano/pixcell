from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import StreamingResponse, JSONResponse
from PIL import Image
import io
import cv2
from ultralytics import YOLO
from llm import analyze_detections
from typing import Dict, List, Any
from collections import Counter
import base64

app = FastAPI()


model = None
model_cache = {}

@app.on_event("startup")
def load_model():
    global model
    try:
        model = YOLO("models/anemia_detection_yolov8.onnx")
        model_cache["anemia_detection_yolov8"] = model
        print("Default model (anemia_detection_yolov8) successfully loaded")
    except Exception as e:
        print(f"Failed to load default model: {e}")

# Map model_name to model file path
MODEL_PATHS = {
    "generic_detection_yolov8": "models/PixCellv1.pt",
    "parasite_detection_yolov8": "models/parasite_detection_yolov8.onnx",
    "anemia_detection_yolov8": "models/anemia_detection_yolov8.onnx",
    "malaria_detection_yolov8": "models/malaria_detection_yolov8.onnx",
}

@app.post("/predict")
async def predict(file: UploadFile = File(...), model_name: str = Query("anemia_detection_yolov8")):
    # full_model_name = model_name + ".onnx"

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # model = load_model(full_model_name)

    # Use proper YOLO predict method
    results = model.predict(image, save=False, save_txt=False)
    
    # Extract results from the first result object
    result = results[0]
    class_names = []
    
    if result.boxes is not None:
        for box in result.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()  # bounding box [x1, y1, x2, y2]
            class_name = model.names[cls]
            class_names.append(class_name)
                
            print(f"Class: {class_name}, Confidence: {conf:.2f}, BBox: {xyxy}")

    # Use Counter for accurate counting
    class_counts = Counter(class_names)

    img_with_boxes = result.plot()
    img_with_boxes = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)

    img_pil = Image.fromarray(img_with_boxes)
    img_bytes = io.BytesIO()
    img_pil.save(img_bytes, format="JPEG")
    img_bytes.seek(0)

    # Return the processed image as before
    return StreamingResponse(img_bytes, media_type="image/jpeg")

@app.post("/predict-with-data")
async def predict_with_data(file: UploadFile = File(...), model_name: str = Query("anemia_detection_yolov8")):
    """
    Predict endpoint that returns both the processed image and detection data.
    """
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Use proper YOLO predict method
    results = model.predict(image, save=False, save_txt=False)
    
    # Extract results from the first result object
    result = results[0]
    class_names = []
    
    if result.boxes is not None:
        for box in result.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            class_name = model.names[cls]
            class_names.append(class_name)
                
            print(f"Class: {class_name}, Confidence: {conf:.2f}, BBox: {xyxy}")

    # Use Counter for accurate counting
    class_counts = Counter(class_names)

    return JSONResponse({
        "detections": dict(class_counts),
        "total_detections": sum(class_counts.values()),
        "success": True
    })

@app.post("/ai-analysis")
async def ai_analysis(
    file: UploadFile = File(...), 
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    """
    Perform AI analysis on an image using the detection model and LLM.
    """
    try:
        # First, get detections from the image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Use proper YOLO predict method
        results = model.predict(image, save=False, save_txt=False)
        
        # Extract results from the first result object
        result = results[0]
        class_names = []
        
        if result.boxes is not None:
            for box in result.boxes:
                cls = int(box.cls[0])
                class_name = model.names[cls]
                class_names.append(class_name)
        
        # Use Counter for accurate counting
        class_counts = Counter(class_names)
        
        # If no detections found, return early
        if not class_counts:
            return JSONResponse({
                "success": False,
                "error": "No detections found in the image",
                "detection_summary": {}
            })
        
        # Perform AI analysis
        analysis_result = analyze_detections(dict(class_counts), sample_type, stain, magnification)
        
        return JSONResponse(analysis_result)
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": f"Analysis failed: {str(e)}",
            "detection_summary": {}
        })

# New endpoint that combines detection and AI analysis in one call
@app.post("/detect-and-analyze")
async def detect_and_analyze(
    file: UploadFile = File(...), 
    model_name: str = Query("anemia_detection_yolov8"),
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    """
    Combined endpoint that runs detection once and returns both detection results and AI analysis.
    """
    try:
        # Model selection logic
        global model_cache
        if model_name not in MODEL_PATHS:
            return JSONResponse({
                "success": False,
                "error": f"Unknown model_name: {model_name}",
                "detections": {},
                "total_detections": 0,
                "detection_details": [],
                "ai_analysis": None
            }, status_code=400)
        if model_name not in model_cache:
            try:
                model_cache[model_name] = YOLO(MODEL_PATHS[model_name])
                print(f"Model {model_name} loaded from {MODEL_PATHS[model_name]}")
            except Exception as e:
                return JSONResponse({
                    "success": False,
                    "error": f"Failed to load model {model_name}: {e}",
                    "detections": {},
                    "total_detections": 0,
                    "detection_details": [],
                    "ai_analysis": None
                }, status_code=500)
        yolo_model = model_cache[model_name]

        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run model prediction only once
        results = yolo_model.predict(image, save=False, save_txt=False)
        result = results[0]
        
        class_names = []
        detection_details = []
        
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
                print(f"Class: {class_name}, Confidence: {conf:.2f}, BBox: {xyxy}")

        # Use Counter for accurate counting
        class_counts = Counter(class_names)
        
        # Generate processed image
        img_with_boxes = result.plot()
        img_with_boxes = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_with_boxes)
        img_bytes = io.BytesIO()
        img_pil.save(img_bytes, format="JPEG")
        img_bytes.seek(0)

        # Encode processed image as base64
        processed_image_base64 = base64.b64encode(img_bytes.getvalue()).decode("utf-8")

        # Perform AI analysis if detections found
        ai_analysis_result = None
        if class_counts:
            ai_analysis_result = analyze_detections(dict(class_counts), sample_type, stain, magnification)
        else:
            ai_analysis_result = {
                "success": False,
                "error": "No detections found in the image",
                "detection_summary": {}
            }

        return JSONResponse({
            "detections": dict(class_counts),
            "total_detections": sum(class_counts.values()),
            "detection_details": detection_details,
            "ai_analysis": ai_analysis_result,
            "processed_image_base64": processed_image_base64,
            "success": True
        })
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": f"Detection and analysis failed: {str(e)}",
            "detections": {},
            "total_detections": 0,
            "detection_details": [],
            "ai_analysis": None,
            "processed_image_base64": None
        })
    

@app.post("/detect-and-analyze-batch")
async def detect_and_analyze_batch(
    files: list[UploadFile] = File(...),
    model_name: str = Query("anemia_detection_yolov8"),
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    """
    Batch endpoint that runs detection and analysis on multiple images.
    Returns total counts, per-image results, and batch AI analysis.
    """
    try:
        global model_cache
        if model_name not in MODEL_PATHS:
            return JSONResponse({
                "success": False,
                "error": f"Unknown model_name: {model_name}",
                "total_counts": {},
                "total_detections": 0,
                "results": [],
                "ai_analysis": None
            }, status_code=400)
        if model_name not in model_cache:
            try:
                model_cache[model_name] = YOLO(MODEL_PATHS[model_name])
                print(f"Model {model_name} loaded from {MODEL_PATHS[model_name]}")
            except Exception as e:
                return JSONResponse({
                    "success": False,
                    "error": f"Failed to load model {model_name}: {e}",
                    "total_counts": {},
                    "total_detections": 0,
                    "results": [],
                    "ai_analysis": None
                }, status_code=500)
        yolo_model = model_cache[model_name]

        total_class_counts = Counter()
        per_image_results = []
        processed_images = []
        total_detections = 0

        for file in files:
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            results = yolo_model.predict(image, save=False, save_txt=False)
            result = results[0]
            class_names = []
            detection_details = []
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
            total_class_counts.update(class_counts)
            total_detections += sum(class_counts.values())

            # Generate processed image with boxes
            img_with_boxes = result.plot()
            img_with_boxes = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)
            img_pil = Image.fromarray(img_with_boxes)
            img_bytes = io.BytesIO()
            img_pil.save(img_bytes, format="JPEG")
            img_bytes.seek(0)
            processed_image_base64 = base64.b64encode(img_bytes.getvalue()).decode("utf-8")
            processed_images.append(processed_image_base64)

            per_image_results.append({
                "detections": dict(class_counts),
                "total_detections": sum(class_counts.values()),
                "detection_details": detection_details,
                "processed_image_base64": processed_image_base64
            })

        # Perform batch AI analysis on total counts
        if total_class_counts:
            ai_analysis_result = analyze_detections(dict(total_class_counts), sample_type, stain, magnification)
        else:
            ai_analysis_result = {
                "success": False,
                "error": "No detections found in any image",
                "detection_summary": {}
            }

        return JSONResponse({
            "success": True,
            "total_counts": dict(total_class_counts),
            "total_detections": total_detections,
            "results": per_image_results,
            "ai_analysis": ai_analysis_result,
            "processed_images": processed_images
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": f"Batch detection and analysis failed: {str(e)}",
            "total_counts": {},
            "total_detections": 0,
            "results": [],
            "ai_analysis": None
        })
    
