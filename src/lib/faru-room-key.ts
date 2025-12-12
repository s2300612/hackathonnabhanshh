/**
 * Generate a deterministic room key for Faru based on atoll and 30-minute time window.
 * Format: stormy:{atollCode}:{YYYY-MM-DD}:{HH-00|HH-30}
 * 
 * Example: stormy:K:2024-01-15:14-00 (for 2:00 PM - 2:30 PM window)
 */
export function computeRoomKey(atoll: string, timestamp?: Date): string {
  const now = timestamp || new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Round down to nearest 30-minute window
  const minutes = now.getMinutes();
  const hour = now.getHours();
  const window = minutes < 30 ? "00" : "30";
  const hourStr = hour.toString().padStart(2, "0");
  
  // Extract atoll code from full name (e.g., "Haa Alif (HA)" -> "HA")
  // Or use the atoll as-is if it's already a code
  let atollCode = atoll.trim();
  const match = atoll.match(/\(([A-Za-z]+)\)/);
  if (match) {
    atollCode = match[1];
  }
  
  // Handle special case for Malé/Capital
  if (atoll.includes("Malé") || atoll.includes("Capital")) {
    atollCode = "K"; // Kaafu
  }
  
  return `stormy:${atollCode}:${date}:${hourStr}-${window}`;
}

/**
 * Parse room key to extract components
 */
export function parseRoomKey(roomKey: string): {
  mood: string;
  atoll: string;
  date: string;
  timeWindow: string;
} | null {
  const parts = roomKey.split(":");
  if (parts.length !== 4 || parts[0] !== "stormy") {
    return null;
  }
  
  return {
    mood: parts[0],
    atoll: parts[1],
    date: parts[2],
    timeWindow: parts[3],
  };
}

/**
 * Calculate expiration time for a room (30 minutes from start)
 */
export function getRoomExpiration(startsAt: Date): Date {
  return new Date(startsAt.getTime() + 30 * 60 * 1000);
}

