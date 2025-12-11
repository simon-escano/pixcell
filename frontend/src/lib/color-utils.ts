/**
 * Converts a hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : { r: 126, g: 126, b: 130 } // fallback gray
}

/**
 * Converts RGB to hex
 */
function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

/**
 * Interpolates between two RGB colors
 */
function interpolateRgb(
  rgb1: { r: number; g: number; b: number },
  rgb2: { r: number; g: number; b: number },
  factor: number,
): { r: number; g: number; b: number } {
  return {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor),
  }
}

/**
 * Generates a gradient color pair that harmonizes org color with the primary color
 * Updated to blend organization color with a vibrant primary-inspired color for harmonious gradients
 */
export function generateGradientColors(hexColor: string): { lightColor: string; darkColor: string } {
  const orgRgb = hexToRgb(hexColor)

  // Primary accent color (a vibrant blue-ish tone inspired by shadcn primary)
  // This creates a harmonious blend rather than just lightening/darkening
  const primaryAccent = { r: 59, g: 130, b: 246 } // vibrant blue

  // Create gradient start: blend org color with primary accent (60% org, 40% accent for brightness)
  const lightRgb = interpolateRgb(orgRgb, primaryAccent, 0.4)

  // Create gradient end: blend org color with a darker version (org color dominant with accent tint)
  const darkRgb = interpolateRgb(orgRgb, primaryAccent, 0.2)

  return {
    lightColor: rgbToHex(lightRgb),
    darkColor: rgbToHex(darkRgb),
  }
}

/**
 * Determines if a color should have white or black text
 */
export function shouldUseWhiteText(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance < 0.5
}
