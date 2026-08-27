import gradio as gr
import uvicorn
from main import app as fastapi_app

# Create a clean Gradio landing page for Hugging Face Spaces preview
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
          - `GET /health`
        """
    )

# Mount Gradio onto the FastAPI app so both UI and REST API work on port 7860
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
