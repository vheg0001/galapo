"use client";

import { useEffect, useMemo, useState } from "react";

interface EventVenueMapProps {
    venue: string;
    venueAddress: string;
    lat?: number | null;
    lng?: number | null;
}

interface Coordinates {
    lat: number;
    lng: number;
}

export default function EventVenueMap({ venue, venueAddress, lat, lng }: EventVenueMapProps) {
    const [isApproximate, setIsApproximate] = useState(false);
    const [coords, setCoords] = useState<Coordinates | null>(
        lat && lng ? { lat: Number(lat), lng: Number(lng) } : null
    );
    const [loading, setLoading] = useState(!(lat && lng));
    const [MapComponents, setMapComponents] = useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        Popup: any;
    } | null>(null);

    useEffect(() => {
        if (lat && lng) {
            setCoords({ lat: Number(lat), lng: Number(lng) });
            setLoading(false);
            setIsApproximate(false);
            return;
        }

        let active = true;

        async function geocode() {
            const OLONGAPO_CENTER = { lat: 14.835, lng: 120.284 };
            try {
                // Variations of queries to try in order of specificity
                const queries = [
                    // Try 1: Full address with city context
                    `${venueAddress}${venueAddress.toLowerCase().includes("olongapo") ? "" : ", Olongapo City"}, Philippines`,
                    // Try 2: Venue + Address snippet
                    venue && venueAddress.split(',')[0] ? `${venue}, ${venueAddress.split(',')[0]}, Olongapo` : null,
                    // Try 3: Just the venue + city
                    venue ? `${venue}, Olongapo City` : null,
                    // Try 4: Sanitized address (remove potentially confusing neighborhood names like "City Proper")
                    venueAddress.replace(/City Proper|Proper/i, "").trim() + ", Olongapo City",
                    // Try 5: Just the first part of the address
                    venueAddress.split(',')[0] + ", Olongapo"
                ].filter(Boolean) as string[];

                let finalCoords: Coordinates | null = null;

                for (const q of queries) {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
                        {
                            headers: {
                                'Accept-Language': 'en',
                                'User-Agent': 'GalaPo-Directory/1.0'
                            }
                        }
                    );
                    if (!response.ok) continue;
                    const json = await response.json();
                    if (!active) return;

                    const match = json?.[0];
                    if (match) {
                        finalCoords = { lat: Number(match.lat), lng: Number(match.lon) };
                        break;
                    }
                }

                if (finalCoords) {
                    setCoords(finalCoords);
                    setIsApproximate(false);
                } else {
                    // Final fallback: Use Olongapo Center if we really can't find it
                    setCoords(OLONGAPO_CENTER);
                    setIsApproximate(true);
                    console.warn(`[EventVenueMap] All geocoding attempts failed for: ${venueAddress}. Defaulting to city center.`);
                }
            } catch (error) {
                console.error("[EventVenueMap] geocoding failed", error);
                setCoords(OLONGAPO_CENTER);
                setIsApproximate(true);
            } finally {
                if (active) setLoading(false);
            }
        }

        geocode();

        return () => {
            active = false;
        };
    }, [lat, lng, venue, venueAddress]);

    useEffect(() => {
        Promise.all([
            import("react-leaflet"),
            import("leaflet"),
            // @ts-ignore
            import("leaflet/dist/leaflet.css"),
        ]).then(([rl, L]) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
            setMapComponents({
                MapContainer: rl.MapContainer,
                TileLayer: rl.TileLayer,
                Marker: rl.Marker,
                Popup: rl.Popup,
            });
        });
    }, []);

    const mapsUrl = useMemo(() => {
        if (coords) {
            return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`;
    }, [coords, venueAddress]);

    if (!MapComponents || loading) {
        return (
            <div className="flex h-72 items-center justify-center rounded-[2rem] bg-muted text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading map…</span>
                </div>
            </div>
        );
    }

    if (!coords) {
        return (
            <div className="rounded-[2rem] border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                <p>We couldn&apos;t load the map for this venue yet.</p>
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex font-bold text-primary hover:underline"
                >
                    Open in Google Maps →
                </a>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

    return (
        <div className="space-y-3">
            <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={isApproximate ? 14 : 16}
                scrollWheelZoom={false}
                className="h-72 w-full rounded-[2rem] z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.lat, coords.lng]}>
                    <Popup>
                        <div className="text-sm">
                            <strong className="block">{venue}</strong>
                            <span>{isApproximate ? "Olongapo City (Approximate Location)" : venueAddress}</span>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>

            <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-bold text-primary hover:underline"
            >
                Open in Maps →
            </a>
        </div>
    );
}