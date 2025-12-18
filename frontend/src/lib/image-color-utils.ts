/**
 * Extracts dominant colors from an image and generates a gradient
 */

export interface ImageColors {
  lightColor: string
  darkColor: string
  primaryColor: string
}

/**
 * Extracts dominant colors from an image URL
 * Returns a gradient color pair based on the image's color palette
 */
export async function extractImageColors(imageUrl: string | null): Promise<ImageColors> {
  if (!imageUrl) {
    // Fallback to a dark gradient for white text visibility
    return {
      lightColor: "#4b5563",
      darkColor: "#1f2937",
      primaryColor: "#374151",
    }
  }

  try {
    // Create an image element to load and analyze the image
    const img = new Image()
    img.crossOrigin = "anonymous"

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Create a canvas to extract pixel data
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          // Set canvas size (smaller for performance)
          canvas.width = 50
          canvas.height = 50

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const pixels = imageData.data

          // Extract colors using a simple color quantization
          const colorMap = new Map<string, number>()
          const colors: Array<{ r: number; g: number; b: number; count: number }> = []

          // Helper to check if a color is too close to white
          const isWhite = (r: number, g: number, b: number): boolean => {
            // Consider colors with high brightness (> 200) as white
            const brightness = (r + g + b) / 3
            return brightness > 200
          }

          // Sample pixels (every 4th pixel for performance)
          for (let i = 0; i < pixels.length; i += 16) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const a = pixels[i + 3]

            // Skip transparent pixels
            if (a < 128) continue

            // Skip white/very light colors - we want actual colors
            if (isWhite(r, g, b)) continue

            // Quantize colors to reduce noise
            const qr = Math.floor(r / 32) * 32
            const qg = Math.floor(g / 32) * 32
            const qb = Math.floor(b / 32) * 32
            const key = `${qr},${qg},${qb}`

            const count = (colorMap.get(key) || 0) + 1
            colorMap.set(key, count)
          }

          // Convert to array and sort by frequency
          for (const [key, count] of colorMap.entries()) {
            const [r, g, b] = key.split(",").map(Number)
            colors.push({ r, g, b, count })
          }

          colors.sort((a, b) => b.count - a.count)

          // Get dominant colors (top 3), filtering out white
          const dominantColors = colors.filter(c => !isWhite(c.r, c.g, c.b)).slice(0, 3)

          // If no colored pixels found (all white), use a default dark gradient
          if (dominantColors.length === 0) {
            resolve({
              lightColor: "#4b5563",
              darkColor: "#1f2937",
              primaryColor: "#374151",
            })
            return
          }

          // Use the most dominant non-white color as primary
          const primary = dominantColors[0]
          const primaryColor = rgbToHex(primary)

          // Create darker gradient colors for better white text contrast
          // Ensure colors are dark enough for white text to be visible
          // Light color: slightly lighter than primary but keep it dark (max brightness ~180)
          const lightRgb = {
            r: Math.min(180, Math.max(primary.r, primary.r + 20)),
            g: Math.min(180, Math.max(primary.g, primary.g + 20)),
            b: Math.min(180, Math.max(primary.b, primary.b + 20)),
          }
          const lightColor = rgbToHex(lightRgb)

          // Dark color: significantly darker for contrast (at least 60% darker)
          const darkRgb = darkenColor(primary, 0.6)
          // Ensure it's dark enough (max brightness ~120)
          const maxBrightness = 120
          const currentBrightness = (darkRgb.r + darkRgb.g + darkRgb.b) / 3
          if (currentBrightness > maxBrightness) {
            const factor = maxBrightness / currentBrightness
            darkRgb.r = Math.round(darkRgb.r * factor)
            darkRgb.g = Math.round(darkRgb.g * factor)
            darkRgb.b = Math.round(darkRgb.b * factor)
          }
          const darkColor = rgbToHex(darkRgb)

          resolve({
            lightColor,
            darkColor,
            primaryColor,
          })
        } catch (error) {
          console.error("Error extracting colors from image:", error)
          reject(error)
        }
      }

      img.onerror = () => {
        // Fallback on error - dark gradient for white text
        resolve({
          lightColor: "#4b5563",
          darkColor: "#1f2937",
          primaryColor: "#374151",
        })
      }

      img.src = imageUrl
    })
  } catch (error) {
    console.error("Error loading image:", error)
    return {
      lightColor: "#4b5563",
      darkColor: "#1f2937",
      primaryColor: "#374151",
    }
  }
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

function brightenColor(rgb: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
  return {
    r: Math.min(255, rgb.r + (255 - rgb.r) * factor),
    g: Math.min(255, rgb.g + (255 - rgb.g) * factor),
    b: Math.min(255, rgb.b + (255 - rgb.b) * factor),
  }
}

function darkenColor(rgb: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
  return {
    r: Math.max(0, rgb.r * (1 - factor)),
    g: Math.max(0, rgb.g * (1 - factor)),
    b: Math.max(0, rgb.b * (1 - factor)),
  }
}

