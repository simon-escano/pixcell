import os
import google.generativeai as genai
from typing import Dict, Any

# Get API key from environment variable

def build_prompt_from_counts(class_counts: Dict[str, int], sample_type: str = "Blood smear", stain: str = "Giemsa", magnification: str = "1000x") -> str:
    """
    Build a prompt for AI analysis based on detection results.
    
    Args:
        class_counts: Dictionary mapping class names to counts
        sample_type: Type of sample (default: "Blood smear")
        stain: Type of stain used (default: "Giemsa")
        magnification: Microscope magnification (default: "1000x")
    
    Returns:
        Formatted prompt string for AI analysis
    """
    summary = "Detected features in sample:\n"
    for cls, count in class_counts.items():
        summary += f"- {count} {cls.replace('_', ' ')}(s)\n"

    summary += f"Sample type: {sample_type}\nStain: {stain}\nMagnification: {magnification}\n"

    return f"""
You are a medical pathologist. Based on the following detection results from a microscopic image, write a concise diagnostic summary and suggest next steps.

{summary}

Output:
- Diagnostic Summary:
- Recommendation:
"""

def analyze_detections(class_counts: Dict[str, int], sample_type: str = "Blood smear", stain: str = "Giemsa", magnification: str = "1000x") -> Dict[str, Any]:
    """
    Analyze detection results using Gemini AI.
    
    Args:
        class_counts: Dictionary mapping class names to counts
        sample_type: Type of sample
        stain: Type of stain used
        magnification: Microscope magnification
    
    Returns:
        Dictionary containing analysis results
    """
    try:
        # Configure the API key
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Build the prompt
        prompt = build_prompt_from_counts(class_counts, sample_type, stain, magnification)
        
        # Generate content from the model
        response = model.generate_content(prompt)
        
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
