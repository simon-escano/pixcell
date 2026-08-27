import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for Hugging Face Space batch detection endpoint
 * This avoids CORS issues and provides better error handling
 */
const DETECTION_BACKEND_URL = process.env.NEXT_PUBLIC_DETECTION_BACKEND_URL || 'https://pixcell-ss-pixcell-backend.hf.space';

export async function POST(req: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = req.nextUrl.searchParams;
    const modelName = searchParams.get('model_name') || 'anemia_detection_yolov8';
    const sampleType = searchParams.get('sample_type') || 'Blood smear';
    const stain = searchParams.get('stain') || 'Giemsa';
    const magnification = searchParams.get('magnification') || '1000x';

    // Get the files from the request
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Create new FormData for the backend request
    const backendFormData = new FormData();
    files.forEach((file) => {
      backendFormData.append('files', file);
    });

    // Build the backend URL with query parameters
    let backendUrl: URL;
    try {
      backendUrl = new URL('/detect-and-analyze-batch', DETECTION_BACKEND_URL);
    } catch (e) {
      backendUrl = new URL(`${DETECTION_BACKEND_URL}/detect-and-analyze-batch`);
    }
    
    backendUrl.searchParams.append('model_name', modelName);
    backendUrl.searchParams.append('sample_type', sampleType);
    backendUrl.searchParams.append('stain', stain);
    backendUrl.searchParams.append('magnification', magnification);

    const finalUrl = backendUrl.toString();
    console.log('Calling batch detection backend:', finalUrl);

    // Forward the request to the Hugging Face Space backend
    const response = await fetch(finalUrl, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Batch detection backend error:', {
        status: response.status,
        statusText: response.statusText,
        url: finalUrl,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText.substring(0, 1000),
      });

      let errorDetails = errorText.substring(0, 500);
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = JSON.stringify(errorJson);
      } catch {
        // Not JSON, use text as is
      }

      return NextResponse.json(
        {
          success: false,
          error: `Batch detection failed: ${response.status} ${response.statusText}`,
          details: errorDetails,
          url: finalUrl,
        },
        { status: response.status }
      );
    }

    const resultData = await response.json();
    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error('Batch detection proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Batch detection proxy failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

