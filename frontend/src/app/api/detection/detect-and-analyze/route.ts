import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for Hugging Face Space detection endpoint
 * This avoids CORS issues and provides better error handling
 */
const DETECTION_BACKEND_URL = process.env.NEXT_PUBLIC_DETECTION_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = req.nextUrl.searchParams;
    const modelName = searchParams.get('model_name') || 'anemia_detection_yolov8';
    const sampleType = searchParams.get('sample_type') || 'Blood smear';
    const stain = searchParams.get('stain') || 'Giemsa';
    const magnification = searchParams.get('magnification') || '1000x';

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
    // Ensure the base URL doesn't have a trailing slash
    const baseUrl = DETECTION_BACKEND_URL.endsWith('/') 
      ? DETECTION_BACKEND_URL.slice(0, -1) 
      : DETECTION_BACKEND_URL;
    
    // Construct the full URL
    const backendUrl = new URL('/detect-and-analyze', baseUrl);
    backendUrl.searchParams.append('model_name', modelName);
    backendUrl.searchParams.append('sample_type', sampleType);
    backendUrl.searchParams.append('stain', stain);
    backendUrl.searchParams.append('magnification', magnification);

    const finalUrl = backendUrl.toString();
    console.log('Calling detection backend:', {
      baseUrl,
      finalUrl,
      method: 'POST',
      hasFile: !!file,
      fileName: file.name,
      fileSize: file.size,
    });

    // Forward the request to the Hugging Face Space backend
    // Note: Hugging Face Spaces may be sleeping - first request might take longer
    const response = await fetch(finalUrl, {
      method: 'POST',
      body: backendFormData,
      // Add timeout for Hugging Face Spaces (they can be slow to wake up)
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      const contentType = response.headers.get('content-type') || '';
      
      console.error('Detection backend error:', {
        status: response.status,
        statusText: response.statusText,
        url: finalUrl,
        contentType,
        errorPreview: errorText.substring(0, 200),
      });

      // Check if we got an HTML error page (common when space is sleeping or endpoint doesn't exist)
      const isHtmlError = contentType.includes('text/html') || errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');
      
      let errorMessage = `Detection failed: ${response.status} ${response.statusText}`;
      if (isHtmlError) {
        errorMessage += '. The space might be sleeping or the endpoint path is incorrect.';
        if (response.status === 404) {
          errorMessage += ' Please verify the endpoint exists and the space is running.';
        }
      }

      // Try to parse as JSON if possible, otherwise return text
      let errorDetails = errorText.substring(0, 500);
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = JSON.stringify(errorJson);
      } catch {
        // Not JSON, use text as is
        if (isHtmlError) {
          // Extract meaningful info from HTML if possible
          const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            errorDetails = `HTML Error: ${titleMatch[1]}`;
          }
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorDetails,
          url: finalUrl,
          isHtmlError,
        },
        { status: response.status }
      );
    }

    const resultData = await response.json();
    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error('Detection proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Detection proxy failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

