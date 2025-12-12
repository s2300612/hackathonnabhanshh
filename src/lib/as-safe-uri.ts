/**
 * Safely converts a value to a URI string, or returns null if invalid.
 * Use this when passing URIs to components like SvgUri, Image, etc.
 */
export function asSafeUri(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return null;
}

