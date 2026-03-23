import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
    usePathname: vi.fn()
}));

describe("useSearchFilters Hook", () => {
    const mockPush = vi.fn();
    const mockRouter = { push: mockPush };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue(mockRouter);
        (usePathname as any).mockReturnValue("/search");
    });

    it("parses filters from URL correctly", () => {
        (useSearchParams as any).mockReturnValue(new URLSearchParams("q=bar&category=food&barangay=barretto,kalaklan&open_now=true"));

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters).toEqual({
            q: "bar",
            category: "food",
            barangay: ["barretto", "kalaklan"],
            sort: "featured",
            openNow: true,
            featuredOnly: false,
            page: 1,
            view: "grid"
        });
    });

    it("updates filter and URL on single change (e.g. setCategory)", () => {
        (useSearchParams as any).mockReturnValue(new URLSearchParams(""));
        const { result } = renderHook(() => useSearchFilters());

        act(() => {
            result.current.setCategory("nightlife");
        });

        expect(mockPush).toHaveBeenCalledWith("/search?category=nightlife", { scroll: false });
    });

    it("toggles barangay: adds new slug", () => {
        (useSearchParams as any).mockReturnValue(new URLSearchParams("barangay=barretto"));
        const { result } = renderHook(() => useSearchFilters());

        act(() => {
            result.current.toggleBarangay("kalaklan");
        });
        expect(mockPush).toHaveBeenCalledWith("/search?barangay=barretto%2Ckalaklan", { scroll: false });
    });

    it("toggles barangay: removes existing slug", () => {
        (useSearchParams as any).mockReturnValue(new URLSearchParams("barangay=barretto,kalaklan"));
        const { result } = renderHook(() => useSearchFilters());

        act(() => {
            result.current.toggleBarangay("barretto");
        });
        expect(mockPush).toHaveBeenCalledWith("/search?barangay=kalaklan", { scroll: false });
    });

    it("handles clearAll", () => {
        (useSearchParams as any).mockReturnValue(new URLSearchParams("q=test&category=food"));
        const { result } = renderHook(() => useSearchFilters());

        act(() => {
            result.current.clearAll();
        });

        expect(mockPush).toHaveBeenCalledWith("/search", { scroll: false });
    });
});
