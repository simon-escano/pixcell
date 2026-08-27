import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for Hugging Face Space predict endpoint (returns processed image)
 * This avoids CORS issues and provides better error handling
 */
const DETECTION_BACKEND_URL = process.env.NEXT_PUBLIC_DETECTION_BACKEND_URL || 'https://pixcell-ss-pixcell-backend.hf.space';

export async function POST(req: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = req.nextUrl.searchParams;
    const modelName = searchParams.get('model_name') || 'anemia_detection_yolov8';

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create new FormData for the backend request
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    // Build the backend URL with query parameters
    const backendUrl = new URL('/predict', DETECTION_BACKEND_URL);
    backendUrl.searchParams.append('model_name', modelName);

    // Forward the request to the Hugging Face Space backend
    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Predict backend error:', {
        status: response.status,
        statusText: response.statusText,
        url: backendUrl.toString(),
        error: errorText.substring(0, 500),
      });

      return NextResponse.json(
        {
          success: false,
          error: `Prediction failed: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Return the image blob directly
    const imageBlob = await response.blob();
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error: any) {
    console.error('Predict proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Predict proxy failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

