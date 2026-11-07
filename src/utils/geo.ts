/**
 * Geolocation and Routing helpers
 */

// Calculate Haversine distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calculate bearing/angle between two coordinates (0-360 deg) for motorcycle icon rotation
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return (b + 360) % 360;
}

// Linear interpolation for smooth coordinate movement
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Shortest path angle interpolation (avoids spinning around 0/360 boundary)
export function lerpAngle(start: number, end: number, t: number): number {
  const diff = ((end - start + 540) % 360) - 180;
  return (start + diff * t + 360) % 360;
}

// Format meters or km nicely
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format seconds into minutes & seconds (e.g. "3 min 20s" or "45 seg")
export function formatETA(seconds: number): string {
  if (seconds <= 0) return 'Chegando!';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs} seg`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
}

/**
 * Generate a realistic multi-step street-like route between two coordinates
 */
export function generateRoutePoints(
  start: [number, number],
  end: [number, number],
  steps = 40
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Create subtle street grid doglegs for a realistic urban courier path
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const perpLat = -(lng2 - lng1) * 0.15;
  const perpLng = (lat2 - lat1) * 0.15;

  const controlPoints: [number, number][] = [
    [lat1, lng1],
    [lat1 + (midLat - lat1) * 0.6 + perpLat * 0.4, lng1 + (midLng - lng1) * 0.4 + perpLng * 0.4],
    [midLat + perpLat, midLng + perpLng],
    [midLat + (lat2 - midLat) * 0.4 - perpLat * 0.3, midLng + (lng2 - midLng) * 0.6 - perpLng * 0.3],
    [lat2, lng2],
  ];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Cubic bezier or multi-segment linear interpolation
    const segCount = controlPoints.length - 1;
    const globalT = t * segCount;
    const segIdx = Math.min(Math.floor(globalT), segCount - 1);
    const localT = globalT - segIdx;

    const p0 = controlPoints[segIdx];
    const p1 = controlPoints[segIdx + 1];

    const lat = p0[0] + (p1[0] - p0[0]) * localT;
    const lng = p0[1] + (p1[1] - p0[1]) * localT;
    points.push([lat, lng]);
  }

  return points;
}

// BRL Currency Formatter
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Standard Brazilian Pix Payload Generator (EMV QRCPS-MPM format)
 * Generates an accurate Pix Copia e Cola code that banking apps recognize.
 */
export function generatePixPayload(key: string, name: string, city: string, amount: number, txId = 'MOTOFLASH'): string {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo =
    formatField('00', 'br.gov.bcb.pix') +
    formatField('01', key);

  let payload =
    formatField('00', '01') + // Format indicator
    formatField('26', merchantAccountInfo) +
    formatField('52', '0000') + // Merchant category code
    formatField('53', '986') + // Currency BRL
    formatField('54', amount.toFixed(2)) +
    formatField('58', 'BR') + // Country code
    formatField('59', name.substring(0, 25)) + // Merchant name
    formatField('60', city.substring(0, 15)) + // Merchant city
    formatField('62', formatField('05', txId.substring(0, 25)));

  payload += '6304'; // CRC16 placeholder

  // CRC-16-CCITT (0xFFFF)
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return payload + crcHex;
}
