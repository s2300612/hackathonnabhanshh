// tiny helpers for reliable UI->file work
export const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function waitForPaint(ms = 48) {
  // two RAFs + a tiny delay between UI updates and capture/export
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (ms) await delay(ms);
}

export async function withTimeout<T>(p: Promise<T>, ms = 8000, label = "op"): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, rej) => (t = setTimeout(() => rej(new Error(`${label} timeout`)), ms)));
  try { return await Promise.race([p, timeout]); } finally { clearTimeout(t); }
}

