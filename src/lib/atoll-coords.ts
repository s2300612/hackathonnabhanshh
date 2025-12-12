// Atoll centroid coordinates for the Maldives
export const ATOLL_COORDS: Record<string, { lat: number; lng: number }> = {
  HA: { lat: 7.1, lng: 72.9 }, // Haa Alif
  HDh: { lat: 6.8, lng: 73.0 }, // Haa Dhaalu
  Sh: { lat: 6.0, lng: 73.3 }, // Shaviyani
  N: { lat: 5.8, lng: 73.4 }, // Noonu
  R: { lat: 5.6, lng: 73.0 }, // Raa
  B: { lat: 5.3, lng: 73.0 }, // Baa
  Lh: { lat: 5.1, lng: 73.5 }, // Lhaviyani
  K: { lat: 4.2, lng: 73.5 }, // Kaafu (Malé)
  AA: { lat: 3.9, lng: 72.8 }, // Alif Alif
  ADh: { lat: 3.8, lng: 72.9 }, // Alif Dhaalu
  V: { lat: 3.5, lng: 73.4 }, // Vaavu
  M: { lat: 3.2, lng: 73.6 }, // Meemu
  F: { lat: 3.1, lng: 73.0 }, // Faafu
  Dh: { lat: 2.8, lng: 73.0 }, // Dhaalu
  Th: { lat: 2.5, lng: 73.1 }, // Thaa
  L: { lat: 1.9, lng: 73.4 }, // Laamu
  GA: { lat: 0.5, lng: 73.5 }, // Gaafu Alif
  GDh: { lat: 0.2, lng: 73.0 }, // Gaafu Dhaalu
  Gn: { lat: -0.3, lng: 73.4 }, // Gnaviyani
  S: { lat: -0.7, lng: 73.1 }, // Seenu (Addu)
  // Capital (Malé) - use Kaafu coords but slight offset
  "Malé (Capital)": { lat: 4.175, lng: 73.508 },
};

export function getAtollCoords(atoll: string): { lat: number; lng: number } {
  // Handle full names that might come from onboarding
  if (atoll.includes("Malé") || atoll.includes("Capital")) {
    return ATOLL_COORDS["Malé (Capital)"] || ATOLL_COORDS.K;
  }
  
  // Try to extract code from strings like "Haa Alif (HA)"
  const match = atoll.match(/\(([A-Za-z]+)\)/);
  const code = match ? match[1] : atoll.trim();
  
  // Return coordinates or default to Malé
  return ATOLL_COORDS[code] || ATOLL_COORDS.K;
}

