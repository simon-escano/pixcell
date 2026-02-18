import os
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv


load_dotenv()

<<<<<<< Updated upstream
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set. Please set it in your environment or .env file.")

# Set a working US proxy (test and replace; this one is from free lists as of Dec 2025)
# Find fresh ones at free-proxy-list.net or proxylister.com — filter for US, HTTP, high uptime
#os.environ['HTTP_PROXY'] = 'http://198.199.86.11:80'
#os.environ['HTTPS_PROXY'] = 'http://198.199.86.11:80'
=======
# Get API key from environment variable (matching JavaScript: process.env.GOOGLE_API_KEY)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set. Please set it in your environment or .env file.")

# Get location/region (defaults to us-central1 to match JavaScript config)
# This matches: const client = new GoogleGenerativeAI({ apiKey, location: "us-central1" })
GEMINI_LOCATION = os.environ.get("GEMINI_LOCATION") or os.getenv('GEMINI_LOCATION', 'us-central1')

# Configure the API client - Python equivalent of JavaScript GoogleGenerativeAI client
# In Python SDK, configure the client with API key
# Location is typically handled via project settings or can be set via environment variables
genai.configure(api_key=GEMINI_API_KEY)

# Set the region/location via environment variable if needed
# Some Python SDK versions may use GOOGLE_CLOUD_REGION for location routing
if GEMINI_LOCATION:
    os.environ['GOOGLE_CLOUD_REGION'] = GEMINI_LOCATION
>>>>>>> Stashed changes

# Get API key from environment variable
# Check GC LOL -molt

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
<<<<<<< Updated upstream
        # Configure the API key
        genai.configure(api_key=GEMINI_API_KEY,transport='rest')
        #print("Gemini configured with proxy successfully.")
        
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')
=======
        # Initialize the Gemini model (API client already configured at module level)
        # Location is set via GEMINI_LOCATION environment variable or defaults to us-central1
        model = genai.GenerativeModel('gemini-2.0-pro')
>>>>>>> Stashed changes
        
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
