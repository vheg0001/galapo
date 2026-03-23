import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGeolocation } from "@/hooks/useGeolocation";

describe("useGeolocation Hook", () => {
    const mockGeolocation = {
        getCurrentPosition: vi.fn()
    };

    beforeEach(() => {
        vi.stubGlobal("navigator", {
            geolocation: mockGeolocation
        });
        vi.clearAllMocks();
    });

    it("returns idle state initially", () => {
        const { result } = renderHook(() => useGeolocation());
        expect(result.current.loading).toBe(false);
        expect(result.current.lat).toBeNull();
        expect(result.current.lng).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("returns loading state after requesting permission", async () => {
        const { result } = renderHook(() => useGeolocation());

        act(() => {
            result.current.requestPermission();
        });

        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("returns coordinates on success", async () => {
        mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
            success({
                coords: {
                    latitude: 14.8,
                    longitude: 120.2
                }
            })
        );

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.requestPermission();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.lat).toBe(14.8);
        expect(result.current.lng).toBe(120.2);
        expect(result.current.error).toBeNull();
    });

    it("returns error on denial", async () => {
        mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) =>
            error({ message: "User denied Geolocation" })
        );

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.requestPermission();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.lat).toBeNull();
        expect(result.current.error).toBe("User denied Geolocation");
    });
});
