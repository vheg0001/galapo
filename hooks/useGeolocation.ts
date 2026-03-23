"use client";

import { useState, useCallback } from "react";

interface GeolocationState {
    lat: number | null;
    lng: number | null;
    loading: boolean;
    error: string | null;
}

export interface UseGeolocationReturn extends GeolocationState {
    requestPermission: () => void;
    isSupported: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lng: null,
        loading: false,
        error: null,
    });

    const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

    const requestPermission = useCallback(() => {
        if (!isSupported) {
            setState((s) => ({ ...s, error: "Geolocation is not supported by your browser." }));
            return;
        }

        setState((s) => ({ ...s, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    loading: false,
                    error: null,
                });
            },
            (err) => {
                setState({
                    lat: null,
                    lng: null,
                    loading: false,
                    error: err.message || "Unable to get your location.",
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [isSupported]);

    return { ...state, requestPermission, isSupported };
}
