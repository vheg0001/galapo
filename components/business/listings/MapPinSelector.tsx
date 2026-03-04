"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — MapPinSelector Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Locate } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet (client-side only)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer as any),
    { ssr: false }
) as any;
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer as any),
    { ssr: false }
) as any;
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker as any),
    { ssr: false }
) as any;
const useMapEvents = dynamic(
    () => import("react-leaflet").then((mod) => mod.useMapEvents as any),
    { ssr: false }
) as any;

// Default city center (Olongapo)
const DEFAULT_CENTER: [number, number] = [14.8348, 120.2842];

interface MapPinSelectorProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}

// Inner component to handle events
function MapEvents({ onChange }: { onChange: (lat: number, lng: number) => void }) {
    // Dynamic import for useMapEvents returns a component, but useMapEvents is a hook.
    // Let's just require it since we're inside the dynamically loaded map.
    const { useMapEvents: useLeafletMapEvents } = require("react-leaflet");

    useLeafletMapEvents({
        click(e: any) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Inner component to handle centering the map when coordinates change
function MapUpdater({ lat, lng }: { lat: number | null, lng: number | null }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
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
        const fallbackToIP = () => {
            fetch("https://get.geojs.io/v1/ip/geo.json")
                .then((res) => res.json())
                .then((data) => {
                    if (data.latitude && data.longitude) {
                        onChange(parseFloat(data.latitude), parseFloat(data.longitude));
                    } else {
                        throw new Error("Invalid IP geo data");
                    }
                })
                .catch((err) => {
                    console.error("IP Geolocation fallback failed:", err);
                    alert("Could not determine your location. Please ensure your OS location services are enabled or enter it manually.");
                });
        };

        if (!navigator.geolocation) {
            fallbackToIP();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange(pos.coords.latitude, pos.coords.longitude);
            },
            (error) => {
                console.warn("Native geolocation error, falling back to IP:", error);
                fallbackToIP();
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
    }, [onChange]);

    const position: [number, number] = lat && lng ? [lat, lng] : DEFAULT_CENTER;

    if (!L) return <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-100" />;

    return (
        <div className="space-y-3">
            <div className="relative z-0 h-[350px] w-full overflow-hidden rounded-xl border-2 border-gray-100 shadow-sm">
                <MapContainer center={position} zoom={15} className="z-0 h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {lat && lng && (
                        <Marker
                            position={position}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e: any) => {
                                    const marker = e.target;
                                    const pos = marker.getLatLng();
                                    onChange(pos.lat, pos.lng);
                                },
                            }}
                        />
                    )}
                    <MapEvents onChange={onChange} />
                    <MapUpdater lat={lat} lng={lng} />
                </MapContainer>

                {/* Overlay control */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        handleLocate();
                    }}
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
                        step="any"
                        value={lat || ""}
                        onChange={(e) => {
                            const newLat = parseFloat(e.target.value);
                            if (!isNaN(newLat)) onChange(newLat, lng || DEFAULT_CENTER[1]);
                        }}
                        className="w-full bg-gray-50 text-sm py-1 border-b border-gray-100 focus:outline-none focus:border-[#FF6B35]"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lng || ""}
                        onChange={(e) => {
                            const newLng = parseFloat(e.target.value);
                            if (!isNaN(newLng)) onChange(lat || DEFAULT_CENTER[0], newLng);
                        }}
                        className="w-full bg-gray-50 text-sm py-1 border-b border-gray-100 focus:outline-none focus:border-[#FF6B35]"
                    />
                </div>
            </div>
        </div>
    );
}
