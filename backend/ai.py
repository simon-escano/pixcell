from fastapi import APIRouter, File, UploadFile, Query, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from PIL import Image
import io
import cv2
import os
import base64
from ultralytics import YOLO
from llm import analyze_detections
from typing import Dict, List, Any, Optional
from collections import Counter

router = APIRouter()

# Model cache to avoid reloading models
_model_cache: Dict[str, YOLO] = {}

def load_model(model_name: str) -> YOLO:
    """
    Load a YOLO model from the models directory.
    Models can be either .pt (PyTorch) or .onnx format.
    """
    if model_name in _model_cache:
        return _model_cache[model_name]
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Try to load from models directory
    model_path_onnx = os.path.join(script_dir, "models", f"{model_name}.onnx")
    model_path_pt = os.path.join(script_dir, "models", f"{model_name}.pt")
    base_model_path = os.path.join(script_dir, "yolo11n.pt")  # Fallback base model
    
    try:
        # Check if ONNX model exists - YOLO v8+ can load ONNX models
        if os.path.exists(model_path_onnx):
            print(f"Loading ONNX model from: {model_path_onnx}")
            model = YOLO(model_path_onnx, task='detect')
        elif os.path.exists(model_path_pt):
            print(f"Loading PyTorch model from: {model_path_pt}")
            model = YOLO(model_path_pt)
        elif os.path.exists(base_model_path):
            print(f"Warning: Model {model_name} not found, using base model: {base_model_path}")
            model = YOLO(base_model_path)
        else:
            # Last resort: try to download/use a base YOLO model
            print(f"Warning: No model files found for {model_name}, using default YOLO11n")
            model = YOLO("yolo11n.pt")
        
        _model_cache[model_name] = model
        return model
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load model {model_name}: {str(e)}"
        )


@router.post("/predict")
async def predict(file: UploadFile = File(...), model_name: str = Query("anemia_detection_yolov8")):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Load the model
    model = load_model(model_name)

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

@router.post("/predict-with-data")
async def predict_with_data(file: UploadFile = File(...), model_name: str = Query("anemia_detection_yolov8")):
    """
    Predict endpoint that returns both the processed image and detection data.
    """
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Load the model
    model = load_model(model_name)

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

@router.post("/ai-analysis")
async def ai_analysis(
    file: UploadFile = File(...),
    model_name: str = Query("anemia_detection_yolov8"),
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
        
        # Load the model
        model = load_model(model_name)
        
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
@router.post("/detect-and-analyze")
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

        # Load the model
        model = load_model(model_name)

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

@router.post("/detect-and-analyze-batch")
async def detect_and_analyze_batch(
    request: Request,
    model_name: str = Query("anemia_detection_yolov8"),
    sample_type: str = Query("Blood smear"),
    stain: str = Query("Giemsa"),
    magnification: str = Query("1000x")
):
    """
    Batch endpoint that processes multiple images and returns aggregated detection results and AI analysis.
    """
    try:
        # Parse multipart form data manually to handle multiple files with same key
        form = await request.form()
        files = form.getlist("files")
        
        if not files:
            return JSONResponse({
                "success": False,
                "error": "No files provided",
                "total_counts": {},
                "total_detections": 0,
                "results": [],
                "ai_analysis": None
            })
        
        # Load the model once for all images
        model = load_model(model_name)
        
        # Aggregate all detections across all images
        total_class_counts = Counter()
        per_image_results = []
        
        # Process each image
        for idx, file_item in enumerate(files):
            original_image_bytes = None  # Initialize for error handling
            filename = file_item.filename or f'image_{idx}.jpg'
            try:
                # Read image bytes from UploadFile (store original for error case)
                image_bytes = await file_item.read()
                original_image_bytes = image_bytes  # Store original for error handling
                
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                # Run model prediction
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
                
                # Count detections for this image
                image_class_counts = Counter(class_names)
                
                # Generate processed image with bounding boxes
                img_with_boxes = result.plot()
                img_with_boxes = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)
                img_pil = Image.fromarray(img_with_boxes)
                img_bytes_processed = io.BytesIO()
                img_pil.save(img_bytes_processed, format="JPEG")
                img_bytes_processed.seek(0)
                
                # Convert to base64
                processed_image_base64 = base64.b64encode(img_bytes_processed.read()).decode('utf-8')
                
                # Add to total counts
                total_class_counts.update(image_class_counts)
                
                # Store per-image results with processed image
                per_image_results.append({
                    "image_index": idx,
                    "filename": filename,
                    "detections": dict(image_class_counts),
                    "total_detections": sum(image_class_counts.values()),
                    "detection_details": detection_details,
                    "processed_image_base64": processed_image_base64
                })
                
                print(f"Processed image {idx + 1}/{len(files)}: {filename} - {sum(image_class_counts.values())} detections")
                
            except Exception as e:
                print(f"Error processing image {idx} ({filename}): {str(e)}")
                import traceback
                traceback.print_exc()
                # Try to include the original image even if processing failed
                processed_image_base64 = None
                try:
                    # Use the original image bytes if available
                    if original_image_bytes:
                        processed_image_base64 = base64.b64encode(original_image_bytes).decode('utf-8')
                except:
                    processed_image_base64 = None
                
                per_image_results.append({
                    "image_index": idx,
                    "filename": filename,
                    "detections": {},
                    "total_detections": 0,
                    "detection_details": [],
                    "error": str(e),
                    "processed_image_base64": processed_image_base64
                })
        
        # Perform AI analysis on aggregated results
        ai_analysis_result = None
        try:
            if total_class_counts:
                print(f"Running AI analysis on {sum(total_class_counts.values())} total detections")
                ai_analysis_result = analyze_detections(dict(total_class_counts), sample_type, stain, magnification)
                print(f"AI analysis result: success={ai_analysis_result.get('success', False)}")
            else:
                print("No detections found, creating error response for AI analysis")
                ai_analysis_result = {
                    "success": False,
                    "error": "No detections found in any of the images",
                    "detection_summary": {}
                }
        except Exception as e:
            print(f"Error during AI analysis: {str(e)}")
            import traceback
            traceback.print_exc()
            ai_analysis_result = {
                "success": False,
                "error": f"AI analysis failed: {str(e)}",
                "detection_summary": dict(total_class_counts) if total_class_counts else {}
            }
        
        return JSONResponse({
            "success": True,
            "total_counts": dict(total_class_counts),
            "total_detections": sum(total_class_counts.values()),
            "results": per_image_results,
            "ai_analysis": ai_analysis_result,
            "images_processed": len(files)
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
    
