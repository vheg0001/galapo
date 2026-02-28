"use client";

import { useEffect, useState } from "react";
import { MAP_CENTER } from "@/lib/constants";

interface MapPin {
    id: string;
    lat: number;
    lng: number;
    name: string;
    category?: string;
    slug: string;
    is_featured?: boolean;
    is_premium?: boolean;
}

interface MapViewProps {
    pins?: MapPin[];
    className?: string;
    zoom?: number;
}

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
        // Colors: Gold (Premium), Orange (Featured), Blue (Regular)
        const color = pin.is_premium ? "#F59E0B" : pin.is_featured ? "#FF6B35" : "#3B82F6";
        const size = 32;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
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
