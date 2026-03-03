"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — MapPinSelector Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Locate } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet (client-side only)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const useMapEvents = dynamic(() => import("react-leaflet").then((mod) => mod.useMapEvents), { ssr: false });

// Default city center (Olongapo)
const DEFAULT_CENTER: [number, number] = [14.8348, 120.2842];

interface MapPinSelectorProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}

// Inner component to handle events
function MapEvents({ onChange }: { onChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function MapPinSelector({ lat, lng, onChange }: MapPinSelectorProps) {
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        // Fix for Leaflet marker icons in Next.js
        import("leaflet").then((leaflet) => {
            setL(leaflet);
            delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
        });
    }, []);

    const handleLocate = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            onChange(pos.coords.latitude, pos.coords.longitude);
        });
    }, [onChange]);

    const position: [number, number] = lat && lng ? [lat, lng] : DEFAULT_CENTER;

    if (!L) return <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-100" />;

    return (
        <div className="space-y-3">
            <div className="relative h-[350px] w-full overflow-hidden rounded-xl border-2 border-gray-100 shadow-sm">
                <MapContainer center={position} zoom={15} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {lat && lng && (
                        <Marker
                            position={position}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e) => {
                                    const marker = e.target;
                                    const pos = marker.getLatLng();
                                    onChange(pos.lat, pos.lng);
                                },
                            }}
                        />
                    )}
                    <MapEvents onChange={onChange} />
                </MapContainer>

                {/* Overlay control */}
                <button
                    type="button"
                    onClick={handleLocate}
                    className="absolute right-3 top-3 z-[400] flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition hover:bg-gray-50 text-gray-700"
                    title="Use my current location"
                >
                    <Locate size={20} />
                </button>

                <div className="absolute bottom-3 left-3 z-[400] rounded-md bg-white/90 px-3 py-1.5 text-[10px] font-medium text-gray-600 shadow-sm backdrop-blur-sm border border-white">
                    Click map to move pin or drag existing pin
                </div>
            </div>

            {/* Manual Lat/Lng display (optional/read-only or editable) */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Latitude</label>
                    <input
                        type="number"
                        readOnly
                        value={lat || ""}
                        className="w-full bg-gray-50 text-sm py-1 border-b border-gray-100 focus:outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Longitude</label>
                    <input
                        type="number"
                        readOnly
                        value={lng || ""}
                        className="w-full bg-gray-50 text-sm py-1 border-b border-gray-100 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
