import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Hugging Face Space connectivity
 */
const DETECTION_BACKEND_URL = process.env.NEXT_PUBLIC_DETECTION_BACKEND_URL || 'https://aizerner-pixcell-backend.hf.space';

export async function GET(req: NextRequest) {
  try {
    // Try to access the docs endpoint to verify the space is accessible
    const docsUrl = `${DETECTION_BACKEND_URL}/docs`;
    const rootUrl = DETECTION_BACKEND_URL;
    
    console.log('Testing Hugging Face Space connectivity...');
    console.log('Docs URL:', docsUrl);
    console.log('Root URL:', rootUrl);

    // Try accessing the root
    const rootResponse = await fetch(rootUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    // Try accessing the docs
    const docsResponse = await fetch(docsUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      success: true,
      spaceUrl: DETECTION_BACKEND_URL,
      rootStatus: rootResponse.status,
      rootStatusText: rootResponse.statusText,
      docsStatus: docsResponse.status,
      docsStatusText: docsResponse.statusText,
      message: 'Check the status codes above. 200 means accessible, 503 might mean sleeping.',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      spaceUrl: DETECTION_BACKEND_URL,
    }, { status: 500 });
  }
}

