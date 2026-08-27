import gradio as gr
import spaces
import io
from PIL import Image
from main import app as fastapi_app, get_model, process_image_with_yolo

# Wired ZeroGPU function recognized by Hugging Face ZeroGPU supervisor
@spaces.GPU(duration=60)
def run_detection_gpu(image, model_name):
    if image is None:
        return None, "Please upload an image."
    try:
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        yolo_model = get_model(model_name)
        class_counts, detection_details, img_bytes_out = process_image_with_yolo(img_byte_arr.getvalue(), yolo_model)
        result_img = Image.open(img_bytes_out)
        return result_img, str(dict(class_counts))
    except Exception as e:
        return None, f"Detection error: {str(e)}"

# Create interactive Gradio Blocks UI wired to the @spaces.GPU function
with gr.Blocks(title="PixCell AI Pathology Backend") as demo:
    gr.Markdown(
        """
        # 🔬 PixCell AI Diagnostic Backend (ZeroGPU)
        The FastAPI backend is **online and active with ZeroGPU acceleration**.
        
        - **API Documentation**: Access the interactive Swagger UI at [`/docs`](/docs)
        - **OpenAPI Schema**: Available at [`/openapi.json`](/openapi.json)
        - **Endpoints**:
          - `POST /predict`
          - `POST /detect-and-analyze`
          - `POST /detect-and-analyze-batch`
          - `POST /ai-analysis`
        """
    )
    
    with gr.Row():
        with gr.Column():
            input_image = gr.Image(type="pil", label="Upload Microscopic Image")
            model_selector = gr.Dropdown(
                choices=[
                    "generic_detection_yolov8",
                    "parasite_detection_yolov8",
                    "anemia_detection_yolov8",
                    "malaria_detection_yolov8"
                ],
                value="parasite_detection_yolov8",
                label="Select Detection Model"
            )
            submit_btn = gr.Button("Run GPU Detection Test", variant="primary")
        with gr.Column():
            output_image = gr.Image(type="pil", label="Detected Cells")
            output_text = gr.Textbox(label="Detection Counts Summary")

    # Wire event so ZeroGPU supervisor registers the GPU function
    submit_btn.click(
        fn=run_detection_gpu,
        inputs=[input_image, model_selector],
        outputs=[output_image, output_text]
    )

# Mount Gradio onto the FastAPI application at /ui
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

@app.get("/")
async def root_status():
    return {
        "status": "online",
        "service": "PixCell AI Diagnostic Backend (ZeroGPU)",
        "docs": "/docs",
        "ui": "/ui"
    }
