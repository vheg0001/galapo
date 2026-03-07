"use client";

import { useEffect, useState } from "react";
import { MAP_CENTER } from "@/lib/constants";
import type { PinTier } from "@/lib/badge-utils";

interface MapPin {
    id: string;
    lat: number;
    lng: number;
    name: string;
    category?: string;
    slug: string;
    is_featured?: boolean;
    is_premium?: boolean;
    /** Highest badge tier — drives pin colour. Determined by getPinTier() in the caller. */
    badge_tier?: PinTier;
}

interface MapViewProps {
    pins?: MapPin[];
    className?: string;
    zoom?: number;
}

// Pin colours per tier
const PIN_COLORS: Record<PinTier, string> = {
    premium: "#F59E0B",  // Gold
    featured: "#FF6B35", // Orange
    special: "#22C55E",  // Green
    regular: "#3B82F6",  // Blue
};

export default function MapView({ pins = [], className = "", zoom }: MapViewProps) {
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setMapReady(true);
    }, []);

    if (!mapReady) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-xl ${className}`} style={{ minHeight: 400 }}>
                <p className="text-muted-foreground text-sm">Loading map…</p>
            </div>
        );
    }

    return <MapInner pins={pins} className={className} zoom={zoom} />;
}

// Dynamic inner to avoid SSR issues
function MapInner({ pins, className, zoom }: MapViewProps) {
    const [MapComponents, setMapComponents] = useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        Popup: any;
        L: any;
    } | null>(null);

    useEffect(() => {
        // Dynamically import Leaflet and react-leaflet client-side only
        Promise.all([
            import("react-leaflet"),
            import("leaflet"),
            // @ts-ignore
            import("leaflet/dist/leaflet.css"),
        ]).then(([rl, L]) => {
            setMapComponents({
                MapContainer: rl.MapContainer,
                TileLayer: rl.TileLayer,
                Marker: rl.Marker,
                Popup: rl.Popup,
                L: L.default ?? L,
            });
        });
    }, []);

    if (!MapComponents) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-xl ${className}`} style={{ minHeight: 400 }}>
                <p className="text-muted-foreground text-sm">Loading map…</p>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup, L } = MapComponents;

    const createIcon = (pin: MapPin) => {
        // Resolve tier: badge_tier takes priority, then fall back to legacy flags
        const tier: PinTier =
            pin.badge_tier ??
            (pin.is_premium ? "premium" : pin.is_featured ? "featured" : "regular");

        const color = PIN_COLORS[tier];
        const isSpecial = tier === "special";
        const size = 36;

        // For special tier (Must Visit / Editor's Pick) we add a star inside the pin
        const starPath = isSpecial
            ? `<text x="12" y="13" text-anchor="middle" font-size="8" fill="white" font-family="sans-serif">★</text>`
            : `<circle cx="12" cy="9" r="2.5" fill="white"/>`;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="1.5"/>
            ${starPath}
        </svg>`;

        return L.divIcon({
            html: svg,
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size],
            className: "leaflet-custom-pin",
        });
    };

    return (
        <MapContainer
            center={[MAP_CENTER.lat, MAP_CENTER.lng]}
            zoom={zoom || MAP_CENTER.zoom}
            scrollWheelZoom={true}
            className={`rounded-xl z-0 ${className}`}
            style={{ minHeight: 400 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pins?.map((pin) => (
                <Marker
                    key={pin.id}
                    position={[pin.lat, pin.lng]}
                    icon={createIcon(pin)}
                >
                    <Popup>
                        <div className="text-sm">
                            <strong>{pin.name}</strong>
                            {pin.category && <p className="text-gray-500">{pin.category}</p>}
                            <a href={`/listing/${pin.slug}`} className="text-blue-600 hover:underline">
                                View Details →
                            </a>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
