export function makeId() {
  // Not cryptographically secure, but fine for client-side IDs
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

