import os
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing. Check your .env file.")

genai.configure(api_key=GEMINI_API_KEY)

def analyze_detections(
    class_counts: Dict[str, int], 
    sample_type: str = "Blood smear", 
    stain: str = "Giemsa", 
    magnification: str = "1000x"
) -> Dict[str, Any]:
    """
    Analyzes microscopic detection results using Gemini's System Instructions.
    """
    try:
        # Define the AI's Persona via System Instruction
        system_msg = (
            "You are a professional medical pathologist. Your task is to analyze "
            "microscopic detection counts and provide a professional diagnostic "
            "summary and clinical recommendations. Be concise and accurate. Immediately provide your findings as is. Eliminate introductory paragraphs or courtesies."
        )

        # Initialize Model (Using gemini-3.6-flash)
        model = genai.GenerativeModel(
            model_name='gemini-3.6-flash',
            system_instruction=system_msg
        )

        # Format the data-driven prompt
        summary_data = "\n".join([f"- {count} {cls.replace('_', ' ')}" for cls, count in class_counts.items()])
        
        user_prompt = f"""
        DATASET SUMMARY:
        {summary_data}
        
        METADATA:
        - Sample: {sample_type}
        - Stain: {stain}
        - Magnification: {magnification}

        Please provide:
        1. Diagnostic Summary
        2. Clinical Recommendations
        """

        response = model.generate_content(user_prompt)

        return {
            "success": True,
            "analysis": response.text,
            "detection_summary": class_counts
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "detection_summary": class_counts
        }

# --- Example Usage ---
if __name__ == "__main__":
    test_counts = {"Plasmodium_falciparum_ring": 42, "WBC": 5}
    result = analyze_detections(test_counts)
    
    if result["success"]:
        print(result["analysis"])
    else:
        print(f"Error: {result['error']}")

print("Available Models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)