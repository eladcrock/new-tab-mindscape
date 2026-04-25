export function isHex(c: string): boolean {
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(c);
}

export function normalizeHex(c: string): string {
  if (!c.startsWith("#")) c = "#" + c;
  if (c.length === 4) {
    c = "#" + c.slice(1).split("").map((x) => x + x).join("");
  }
  return c.toUpperCase();
}

export function sanitizePalette(arr: unknown, fallback: string[]): string[] {
  if (!Array.isArray(arr)) return fallback;
  const cleaned = arr
    .filter((c): c is string => typeof c === "string")
    .map((c) => c.trim())
    .filter(isHex)
    .map(normalizeHex);
  if (cleaned.length < 3) return fallback;
  return cleaned.slice(0, 4).concat(fallback).slice(0, 4);
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Pick black or white text based on average background luminance
export function readableTextColor(palette: string[]): string {
  const avg = palette.reduce((a, h) => a + relativeLuminance(h), 0) / palette.length;
  return avg > 0.45 ? "#0B0B0F" : "#FAFAFA";
}

export function gradientFromPalette(palette: string[]): string {
  const cols = palette.length >= 4 ? palette : [...palette, ...palette].slice(0, 4);
  return `linear-gradient(135deg, ${cols[0]} 0%, ${cols[1]} 35%, ${cols[2]} 70%, ${cols[3]} 100%)`;
}
