import { describe, it, expect } from "vitest";
import { formatDistance, calculateDistance, isWithinRadius, getBoundsFromCenter, OLONGAPO_CENTER } from "@/lib/geo";

describe("Geo Utilities", () => {
    describe("formatDistance", () => {
        it("formats distance less than 1km as meters", () => {
            expect(formatDistance(0.5)).toBe("500 m");
            expect(formatDistance(0.05)).toBe("50 m");
        });

        it("formats distance 1km or more as kilometers with 1 decimal", () => {
            expect(formatDistance(1.23)).toBe("1.2 km");
            expect(formatDistance(5.89)).toBe("5.9 km");
            expect(formatDistance(10)).toBe("10.0 km");
        });
    });

    describe("calculateDistance", () => {
        it("returns 0 for identical points", () => {
            expect(calculateDistance(14.8, 120.2, 14.8, 120.2)).toBe(0);
        });

        it("calculates correct distance between Kalaklan and Barretto (approx 1.5km)", () => {
            // Rough coords
            const kalaklan = { lat: 14.8398, lng: 120.2789 };
            const barretto = { lat: 14.8510, lng: 120.2647 };
            const dist = calculateDistance(kalaklan.lat, kalaklan.lng, barretto.lat, barretto.lng);

            expect(dist).toBeGreaterThan(1);
            expect(dist).toBeLessThan(3);
        });

        it("calculates correct distance between Olongapo Center and SBFZ (approx 3km)", () => {
            const sbfz = { lat: 14.8190, lng: 120.2980 }; // Roughly Subic Bay area
            const dist = calculateDistance(OLONGAPO_CENTER.lat, OLONGAPO_CENTER.lng, sbfz.lat, sbfz.lng);

            expect(dist).toBeGreaterThan(1);
            expect(dist).toBeLessThan(4);
        });
    });

    describe("isWithinRadius", () => {
        const center = { lat: 14.8, lng: 120.2 };

        it("returns true for nearby points well within radius", () => {
            // Roughly 1.1km away
            const nearby = { lat: 14.81, lng: 120.2 };
            expect(isWithinRadius(center.lat, center.lng, nearby.lat, nearby.lng, 5)).toBe(true);
        });

        it("returns false for far points outside radius", () => {
            // Roughly 11km away
            const far = { lat: 14.9, lng: 120.2 };
            expect(isWithinRadius(center.lat, center.lng, far.lat, far.lng, 5)).toBe(false);
        });
    });

    describe("getBoundsFromCenter", () => {
        it("returns correct bounding box based on center and radius", () => {
            const bounds = getBoundsFromCenter(14.8, 120.2, 5); // 5km radius

            // 5km / 111.32 = ~0.0449
            expect(bounds.north).toBeGreaterThan(14.8);
            expect(bounds.south).toBeLessThan(14.8);
            expect(bounds.east).toBeGreaterThan(120.2);
            expect(bounds.west).toBeLessThan(120.2);

            // Calculate distance from center to a bound (e.g., north) to verify it's close to radius
            const distToNorth = calculateDistance(14.8, 120.2, bounds.north, 120.2);
            expect(Math.abs(distToNorth - 5)).toBeLessThan(0.1); // Within 100 meters due to spherical approx
        });
    });
});
