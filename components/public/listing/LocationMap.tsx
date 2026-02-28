"use client";

import { useEffect, useState } from "react";
import { MAP_CENTER } from "@/lib/constants";

interface LocationMapProps {
    lat: number;
    lng: number;
    businessName: string;
    address: string;
    barangayName?: string | null;
}

export default function LocationMap({ lat, lng, businessName, address, barangayName }: LocationMapProps) {
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => { setMapReady(true); }, []);

    if (!mapReady) {
        return (
            <div className="flex h-48 w-full items-center justify-center rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">Loading map…</p>
            </div>
        );
    }

    return <MapInner lat={lat} lng={lng} businessName={businessName} address={address} barangayName={barangayName} />;
}

function MapInner({ lat, lng, businessName, address, barangayName }: LocationMapProps) {
    const [MapComponents, setMapComponents] = useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        Popup: any;
    } | null>(null);

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

    if (!MapComponents) {
        return (
            <div className="flex h-48 w-full items-center justify-center rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">Loading map…</p>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup } = MapComponents;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return (
        <div className="space-y-2">
            <MapContainer
                center={[lat, lng]}
                zoom={16}
                scrollWheelZoom={false}
                className="h-48 w-full rounded-xl z-0"
                style={{ minHeight: 192 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                    <Popup>
                        <div className="text-sm">
                            <strong className="block">{businessName}</strong>
                            <span className="text-gray-500">{address}</span>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>

            <div className="flex items-start justify-between gap-4 text-sm">
                <div>
                    <p className="text-foreground font-medium truncate">{address}</p>
                    {barangayName && (
                        <p className="text-muted-foreground text-xs">{barangayName}, Olongapo City</p>
                    )}
                </div>
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                    Open in Maps →
                </a>
            </div>
        </div>
    );
}
