import gradio as gr
from main import app as fastapi_app

# Create Gradio Blocks UI
with gr.Blocks(title="PixCell AI Pathology Backend") as demo:
    gr.Markdown(
        """
        # 🔬 PixCell AI Diagnostic Backend
        The FastAPI backend is **online and active**.
        
        - **API Documentation**: Access the interactive Swagger UI at [`/docs`](/docs)
        - **OpenAPI Schema**: Available at [`/openapi.json`](/openapi.json)
        - **Endpoints**:
          - `POST /predict`
          - `POST /detect-and-analyze`
          - `POST /detect-and-analyze-batch`
          - `POST /ai-analysis`
        """
    )

# Mount Gradio onto the FastAPI application at /ui
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

@app.get("/")
async def root_status():
    return {
        "status": "online",
        "service": "PixCell AI Diagnostic Backend",
        "docs": "/docs",
        "ui": "/ui"
    }
