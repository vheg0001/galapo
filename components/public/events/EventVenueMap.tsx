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
            return;
        }

        let active = true;

        async function geocode() {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(venueAddress)}`
                );
                const json = await response.json();
                if (!active) return;

                const match = json?.[0];
                if (match) {
                    setCoords({ lat: Number(match.lat), lng: Number(match.lon) });
                }
            } catch (error) {
                console.error("[EventVenueMap] geocoding failed", error);
            } finally {
                if (active) setLoading(false);
            }
        }

        geocode();

        return () => {
            active = false;
        };
    }, [lat, lng, venueAddress]);

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
                Loading map…
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
                zoom={16}
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
                            <span>{venueAddress}</span>
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