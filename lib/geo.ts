// ──────────────────────────────────────────────────────────
// GalaPo — Geo Utility Functions
// ──────────────────────────────────────────────────────────

/**
 * Calculate the distance between two lat/lng points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Format a distance in km to a human-readable string.
 * e.g., 0.5 → "500 m", 2.3 → "2.3 km"
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

/**
 * Check if a point (lat2, lng2) is within a certain radius (km) from center (lat1, lng1).
 */
export function isWithinRadius(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    radiusKm: number
): boolean {
    return calculateDistance(lat1, lng1, lat2, lng2) <= radiusKm;
}

/**
 * Get map bounds (north, south, east, west) from a center point and radius in km.
 * 1 degree of latitude is ~111.32 km.
 * 1 degree of longitude is ~40075 * cos(lat) / 360 km.
 */
export function getBoundsFromCenter(lat: number, lng: number, radiusKm: number) {
    const latOffset = radiusKm / 111.32;
    const lngOffset = radiusKm / (40075 * Math.cos(toRad(lat)) / 360);

    return {
        north: lat + latOffset,
        south: lat - latOffset,
        east: lng + lngOffset,
        west: lng - lngOffset,
    };
}

// Olongapo City Geographic Constants
export const OLONGAPO_CENTER = { lat: 14.8292, lng: 120.2834 };
export const OLONGAPO_DEFAULT_ZOOM = 13;
