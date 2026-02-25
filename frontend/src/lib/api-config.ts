/**
 * Backend API configuration
 * Uses environment variable if available, otherwise defaults to Hugging Face Space URL
 * 
 * Note: Hugging Face Spaces FastAPI apps are typically accessible directly at the space URL.
 * If you encounter 404 errors, check:
 * 1. The space is running and accessible
 * 2. The endpoint path matches exactly (case-sensitive)
 * 3. CORS is properly configured on the backend
 * 
 * To use a custom backend URL, set NEXT_PUBLIC_BACKEND_URL in your .env.local file
 */
export const getBackendUrl = (): string => {
  // Check for environment variable first (for local development or custom deployments)
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_ prefix
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pixcell-ss-pixcell-backend.hf.space'
  } else {
    // Server-side: can use regular env var
    return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pixcell-ss-pixcell-backend.hf.space'
  }
}

/**
 * Builds the full API endpoint URL
 * 
 * For Hugging Face Spaces, endpoints are typically accessed directly without /api prefix.
 * If your space requires a different path structure, set NEXT_PUBLIC_BACKEND_URL accordingly.
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = getBackendUrl()
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Build URL
  const url = new URL(normalizedEndpoint, baseUrl)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  
  return url.toString()
}

