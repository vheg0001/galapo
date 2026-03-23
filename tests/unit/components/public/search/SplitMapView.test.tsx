import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SplitMapView from "@/components/public/search/SplitMapView";

// Mock react-leaflet
vi.mock("react-leaflet", () => ({
    MapContainer: ({ children }: any) => <div data-testid="mock-map-container">{children}</div>,
    TileLayer: () => <div data-testid="mock-tile-layer" />,
    Marker: ({ children, position, eventHandlers }: any) => (
        <div
            data-testid={`marker-${position[0]}-${position[1]}`}
            onClick={eventHandlers?.click}
            onMouseOver={eventHandlers?.mouseover}
        >
            {children}
        </div>
    ),
    Popup: ({ children }: any) => <div data-testid="mock-popup">{children}</div>,
    useMap: () => ({ setView: vi.fn() }),
}));

// Mock leaflet
const mockL = {
    Icon: {
        Default: {
            prototype: {}
        }
    },
    divIcon: vi.fn(() => ({})),
};

vi.mock("leaflet", () => ({
    ...mockL,
    default: mockL,
    Icon: mockL.Icon,
    divIcon: mockL.divIcon
}));

// Mock CSS
vi.mock("leaflet/dist/leaflet.css", () => ({}));

const mockListings: any[] = [
    { id: "1", business_name: "Test Biz 1", slug: "test-1", lat: 14.8, lng: 120.2, is_featured: false, is_premium: false },
    { id: "2", business_name: "Featured Biz", slug: "test-2", lat: 14.81, lng: 120.21, is_featured: true, is_premium: false }
];

describe("SplitMapView Component", () => {
    it("renders loading state initially then results", async () => {
        render(<SplitMapView listings={mockListings} />);

        expect(screen.getByText(/Loading map…/i)).toBeInTheDocument();

        // Use waitFor to wait for the transition away from "Loading map"
        await waitFor(() => {
            expect(screen.queryByText(/Loading map…/i)).not.toBeInTheDocument();
        }, { timeout: 2000 });

        expect(screen.getByTestId("mock-map-container")).toBeInTheDocument();
        // There are two: one in the list, one in the map popup
        expect(screen.getAllByText("Test Biz 1").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Featured Biz").length).toBeGreaterThanOrEqual(1);
    });

    it("displays 'No results' message when listings are empty", async () => {
        render(<SplitMapView listings={[]} />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading map…/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText(/No results with map coordinates/i)).toBeInTheDocument();
    });

    it("shows Featured badge for featured listings in the list view", async () => {
        render(<SplitMapView listings={mockListings} />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading map…/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText("Featured")).toBeInTheDocument();
    });
});
