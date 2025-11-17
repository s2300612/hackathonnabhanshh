export const TINT_SWATCHES = [
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#a855f7",
  "#14b8a6",
  "#eab308",
] as const;

export type Hex = (typeof TINT_SWATCHES)[number];

export function hexToRgba(hex: string, alpha = 0.3) {
  const h = hex.replace("#", "");
  const normalized = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

