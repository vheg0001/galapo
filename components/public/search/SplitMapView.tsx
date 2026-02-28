"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { MAP_CENTER } from "@/lib/constants";
import { MapPin, List } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapListing {
    id: string;
    slug: string;
    business_name: string;
    lat: number | null;
    lng: number | null;
    is_featured: boolean;
    is_premium: boolean;
    isSponsored?: boolean;
    image_url?: string | null;
    categories?: { name: string; slug: string } | null;
}

interface SplitMapViewProps {
    listings: MapListing[];
    onResultsUpdate?: (newListings: any[], newTotal: number) => void;
    className?: string;
}

type MobileTab = "map" | "list";

export default function SplitMapView({ listings, onResultsUpdate, className }: SplitMapViewProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<MobileTab>("map");
    const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
    const [isSearchingArea, setIsSearchingArea] = useState(false);
    const [currentBounds, setCurrentBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

    const mapRef = useRef<any>(null);
    const markersRef = useRef<Record<string, any>>({});
    const listRef = useRef<HTMLDivElement>(null);

    const pinned = listings.filter((l) => l.lat != null && l.lng != null);

    const getPinColor = (listing: MapListing) => {
        if (listing.is_premium || listing.isSponsored) return "#F59E0B"; // gold
        if (listing.is_featured) return "#FF6B35";  // orange
        return "#3B82F6";                            // blue
    };

    const setPinActive = useCallback((id: string | null) => {
        setActiveId(id);
    }, []);

    const scrollToCard = useCallback((id: string) => {
        const el = listRef.current?.querySelector(`[data-listing-id="${id}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, []);

    const centerOnPin = useCallback((listing: MapListing) => {
        if (!mapRef.current || listing.lat == null || listing.lng == null) return;
        mapRef.current.setView([listing.lat, listing.lng], 16);
        const marker = markersRef.current[listing.id];
        if (marker) marker.openPopup();
    }, []);

    const handleSearchArea = async () => {
        if (!currentBounds || !onResultsUpdate) return;

        setIsSearchingArea(true);
        try {
            const params = new URLSearchParams({
                north: currentBounds.north.toString(),
                south: currentBounds.south.toString(),
                east: currentBounds.east.toString(),
                west: currentBounds.west.toString(),
            });

            const res = await fetch(`/api/listings/search-area?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                onResultsUpdate(json.data, json.data.length);
                setShowSearchAreaBtn(false);
            }
        } catch (error) {
            console.error("Failed to search area:", error);
        } finally {
            setIsSearchingArea(false);
        }
    };

    // Leaflet is loaded dynamically
    const [LeafletComponents, setLeafletComponents] = useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        Popup: any;
        L: any;
        useMap: any;
        useMapEvents: any;
    } | null>(null);

    useEffect(() => {
        Promise.all([
            import("react-leaflet"),
            import("leaflet"),
            // @ts-ignore
            import("leaflet/dist/leaflet.css"),
        ]).then(([rl, L]) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            setLeafletComponents({
                MapContainer: rl.MapContainer,
                TileLayer: rl.TileLayer,
                Marker: rl.Marker,
                Popup: rl.Popup,
                L: L.default ?? L,
                useMap: rl.useMap,
                useMapEvents: rl.useMapEvents,
            });
        });
    }, []);

    const handleMove = useCallback((bounds: any) => {
        setCurrentBounds(bounds);
        setShowSearchAreaBtn(true);
    }, []);

    return (
        <div className={cn("flex flex-col", className)}>
            {/* Mobile tabs */}
            <div className="flex border-b border-border lg:hidden">
                {(["map", "list"] as MobileTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setMobileTab(tab)}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium capitalize transition-colors",
                            mobileTab === tab
                                ? "border-b-2 border-secondary text-secondary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab === "map" ? <MapPin className="h-4 w-4" /> : <List className="h-4 w-4" />}
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex h-[600px] gap-0 overflow-hidden rounded-xl border border-border lg:h-[680px]">
                {/* Map panel */}
                <div
                    className={cn(
                        "relative shrink-0 overflow-hidden",
                        "w-full lg:w-[60%]",
                        mobileTab !== "map" && "hidden lg:block"
                    )}
                >
                    {LeafletComponents ? (
                        <>
                            <MapPanel
                                listings={pinned}
                                activeId={activeId}
                                setActiveId={setPinActive}
                                onPinClick={scrollToCard}
                                mapRef={mapRef}
                                markersRef={markersRef}
                                LeafletComponents={LeafletComponents}
                                onMove={handleMove}
                            />

                            {/* "Search this area" button */}
                            {showSearchAreaBtn && (
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1001]">
                                    <button
                                        onClick={handleSearchArea}
                                        disabled={isSearchingArea}
                                        className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-xl border border-primary/20 hover:bg-muted hover:border-primary/40 transition-all active:scale-95 disabled:opacity-70"
                                    >
                                        {isSearchingArea ? (
                                            <>
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="h-3.5 w-3.5" />
                                                Search this area
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                            <p className="text-sm text-muted-foreground">Loading map…</p>
                        </div>
                    )}
                </div>

                {/* Results panel */}
                <div
                    ref={listRef}
                    className={cn(
                        "flex flex-col overflow-y-auto border-l border-border bg-background",
                        "w-full lg:w-[40%]",
                        mobileTab !== "list" && "hidden lg:flex"
                    )}
                >
                    {pinned.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-8 text-center">
                            <p className="text-sm text-muted-foreground">No results with map coordinates.</p>
                        </div>
                    ) : (
                        pinned.map((listing) => (
                            <div
                                key={listing.id}
                                data-listing-id={listing.id}
                                onMouseEnter={() => setPinActive(listing.id)}
                                onMouseLeave={() => setPinActive(null)}
                                onClick={() => {
                                    setMobileTab("map");
                                    centerOnPin(listing);
                                }}
                                className={cn(
                                    "group flex cursor-pointer gap-3 border-b border-border p-3 transition-colors last:border-0",
                                    activeId === listing.id
                                        ? "bg-secondary/5"
                                        : "hover:bg-accent"
                                )}
                            >
                                {/* Thumbnail */}
                                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                                    {listing.image_url ? (
                                        <Image
                                            src={listing.image_url}
                                            alt={listing.business_name}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-2xl">🏢</div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <Link
                                        href={`/listing/${listing.slug}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sm font-semibold text-foreground line-clamp-1 hover:text-secondary transition-colors"
                                    >
                                        {listing.business_name}
                                    </Link>
                                    {listing.categories?.name && (
                                        <p className="mt-0.5 text-xs text-secondary">
                                            {listing.categories.name}
                                        </p>
                                    )}
                                    <div className="mt-1 flex items-center gap-1.5">
                                        {listing.isSponsored && (
                                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                                Sponsored
                                            </span>
                                        )}
                                        {listing.is_featured && !listing.isSponsored && (
                                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Inner map components (needs react-leaflet context) ──────────────────

function MapEvents({
    useMapEvents,
    onMove
}: {
    useMapEvents: any;
    onMove: (bounds: { north: number; south: number; east: number; west: number }) => void;
}) {
    useMapEvents({
        moveend: (e: any) => {
            const map = e.target;
            const b = map.getBounds();
            onMove({
                north: b.getNorth(),
                south: b.getSouth(),
                east: b.getEast(),
                west: b.getWest(),
            });
        },
        zoomend: (e: any) => {
            const map = e.target;
            const b = map.getBounds();
            onMove({
                north: b.getNorth(),
                south: b.getSouth(),
                east: b.getEast(),
                west: b.getWest(),
            });
        },
    });
    return null;
}

function MapPanel({
    listings,
    activeId,
    setActiveId,
    onPinClick,
    mapRef,
    markersRef,
    LeafletComponents,
    onMove,
}: {
    listings: MapListing[];
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    onPinClick: (id: string) => void;
    mapRef: React.MutableRefObject<any>;
    markersRef: React.MutableRefObject<Record<string, any>>;
    LeafletComponents: any;
    onMove: (bounds: { north: number; south: number; east: number; west: number }) => void;
}) {
    const { MapContainer, TileLayer, Marker, Popup, L, useMapEvents } = LeafletComponents;

    const createIcon = useCallback(
        (color: string, isActive: boolean) => {
            const size = isActive ? 40 : 32;
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
        },
        [L]
    );

    return (
        <MapContainer
            center={[MAP_CENTER.lat, MAP_CENTER.lng]}
            zoom={MAP_CENTER.zoom}
            scrollWheelZoom
            className="h-full w-full z-0"
            ref={(map: any) => {
                if (map) mapRef.current = map;
            }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents useMapEvents={useMapEvents} onMove={onMove} />
            {listings.map((listing) => {
                if (!listing.lat || !listing.lng) return null;
                const color = (listing.is_premium || listing.isSponsored) ? "#F59E0B" : listing.is_featured ? "#FF6B35" : "#3B82F6";
                const isActive = listing.id === activeId;

                return (
                    <Marker
                        key={listing.id}
                        position={[listing.lat, listing.lng]}
                        icon={createIcon(color, isActive)}
                        ref={(marker: any) => {
                            if (marker) markersRef.current[listing.id] = marker;
                        }}
                        eventHandlers={{
                            click: () => {
                                setActiveId(listing.id);
                                onPinClick(listing.id);
                            },
                            mouseover: () => setActiveId(listing.id),
                            mouseout: () => setActiveId(null),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[140px] text-sm">
                                <p className="font-semibold">{listing.business_name}</p>
                                {listing.categories?.name && (
                                    <p className="text-xs text-gray-500">{listing.categories.name}</p>
                                )}
                                <a
                                    href={`/listing/${listing.slug}`}
                                    className="mt-1.5 inline-block text-xs font-medium text-blue-600 hover:underline"
                                >
                                    View details →
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

