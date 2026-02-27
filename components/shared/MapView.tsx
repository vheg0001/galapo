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
    } | null>(null);

    useEffect(() => {
        // Dynamically import Leaflet and react-leaflet client-side only
        Promise.all([
            import("react-leaflet"),
            import("leaflet"),
            // @ts-ignore
            import("leaflet/dist/leaflet.css"),
        ]).then(([rl, L]) => {
            // Fix default marker icons
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

    if (!MapComponents) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-xl ${className}`} style={{ minHeight: 400 }}>
                <p className="text-muted-foreground text-sm">Loading map…</p>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

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
                <Marker key={pin.id} position={[pin.lat, pin.lng]}>
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
