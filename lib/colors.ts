/**
 * Validates if a string is a valid hex color code
 * Supports: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 */
export function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

/**
 * Converts hex color to RGB object
 * Returns null if invalid hex
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } | null {
  if (!isValidHex(hex)) return null;

  // Remove # prefix
  let cleanHex = hex.slice(1);

  // Convert short form (#RGB or #RGBA) to long form
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Handle alpha if present
  if (cleanHex.length === 8) {
    const a = parseInt(cleanHex.substring(6, 8), 16) / 255;
    return { r, g, b, a };
  }

  return { r, g, b };
}

/**
 * Calculates relative luminance of a color
 * Used to determine if text should be black or white
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Returns appropriate text color (black or white) for a given background color
 */
export function getContrastText(hex: string): "#1a1a1a" | "#f5f0eb" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#1a1a1a";

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? "#1a1a1a" : "#1a1a1a";
}

/**
 * Expands shorthand hex to full form
 * #RGB -> #RRGGBB, #RGBA -> #RRGGBBAA
 */
export function expandHex(hex: string): string {
  if (!isValidHex(hex)) return hex;

  let cleanHex = hex.slice(1);

  if (cleanHex.length === 3) {
    return `#${cleanHex[0]}${cleanHex[0]}${cleanHex[1]}${cleanHex[1]}${cleanHex[2]}${cleanHex[2]}`;
  }

  if (cleanHex.length === 4) {
    return `#${cleanHex[0]}${cleanHex[0]}${cleanHex[1]}${cleanHex[1]}${cleanHex[2]}${cleanHex[2]}${cleanHex[3]}${cleanHex[3]}`;
  }

  return hex.toLowerCase();
}
