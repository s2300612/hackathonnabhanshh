export function tintToRGBA(hex: string, alpha = 0.3) {
  const m = hex.replace("#", "");
  const r = parseInt(m.length === 3 ? m[0] + m[0] : m.slice(0, 2), 16);
  const g = parseInt(m.length === 3 ? m[1] + m[1] : m.slice(2, 4), 16);
  const b = parseInt(m.length === 3 ? m[2] + m[2] : m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const TINT_SWATCHES = [
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#a855f7",
];

