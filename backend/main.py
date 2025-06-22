from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from PIL import Image
import io
import cv2
from ultralytics import YOLO
from llm import analyze_detections
from typing import Dict, List, Any
from collections import Counter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = None

@app.on_event("startup")
def load_model():
    global model
    model = YOLO("models/PixCellv1.pt")
    print("model successfully loaded")
    


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
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run model prediction only once
        results = model.predict(image, save=False, save_txt=False)
        result = results[0]
        
        class_names = []
        detection_details = []
        
        if result.boxes is not None:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()
                class_name = model.names[cls]
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
            "success": True
        })
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": f"Detection and analysis failed: {str(e)}",
            "detections": {},
            "total_detections": 0,
            "detection_details": [],
            "ai_analysis": None
        })
    
