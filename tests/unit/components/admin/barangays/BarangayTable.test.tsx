import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminBarangaysPage from "@/app/(admin)/admin/barangays/page";

// Mock the child components
vi.mock("@/components/admin/shared/AdminPageHeader", () => ({
    default: ({ title, actions }: any) => (
        <div data-testid="page-header">
            <h1>{title}</h1>
            {actions}
        </div>
    )
}));

vi.mock("@/components/admin/barangays/BarangayModal", () => ({
    default: ({ open, onClose, onSaved }: any) => {
        if (!open) return null;
        return (
            <div data-testid="barangay-modal">
                <button onClick={onClose}>Close Modal</button>
                <button onClick={onSaved}>Save Modal</button>
            </div>
        );
    }
}));

const mockBarangays = [
    {
        id: "b1",
        name: "East Tapinac",
        slug: "east-tapinac",
        sort_order: 10,
        is_active: true,
        listing_count: 5
    },
    {
        id: "b2",
        name: "Barretto",
        slug: "barretto",
        sort_order: 20,
        is_active: false,
        listing_count: 0
    },
    {
        id: "b3",
        name: "Subic Bay Freeport",
        slug: "subic-bay-freeport",
        sort_order: 150,
        is_active: true,
        listing_count: 10
    }
];

describe("BarangayTable (AdminBarangaysPage)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders loading state then barangays with correct grouping", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        render(<AdminBarangaysPage />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("East Tapinac")).toBeInTheDocument();
        });

        expect(screen.getByText("Barretto")).toBeInTheDocument();
        expect(screen.getByText("Subic Bay Freeport")).toBeInTheDocument();

        // Check group labels based on sort_order
        // 10, 20 -> Olongapo City
        // 150 -> SBFZ
        const olongapoLabels = screen.getAllByText("Olongapo City");
        expect(olongapoLabels.length).toBe(2);
        expect(screen.getByText("SBFZ")).toBeInTheDocument();
    });

    it("active toggle switches inline and calls API", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        render(<AdminBarangaysPage />);
        await waitFor(() => expect(screen.getByText("East Tapinac")).toBeInTheDocument());

        // Setup mock for PATCH
        (global.fetch as any).mockResolvedValueOnce({ ok: true });
        // Setup mock for re-load
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        // The exact DOM structure for the toggle is a bit specific (a button with specific classes based on is_active)
        // Finding it is easier by looking at the row. 
        // For 'East Tapinac', it's active. Let's find the toggle button by looking at its container or role
        const toggleButtons = screen.getAllByRole("button").filter(b => b.className.includes("relative inline-flex h-5 w-9"));

        // Click the first one (for East Tapinac)
        fireEvent.click(toggleButtons[0]);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(`/api/admin/barangays/b1`, expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ is_active: false })
            }));
        });
    });

    it("add button opens empty modal", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        render(<AdminBarangaysPage />);
        await waitFor(() => expect(screen.getByText("East Tapinac")).toBeInTheDocument());

        expect(screen.queryByTestId("barangay-modal")).not.toBeInTheDocument();

        const addBtn = screen.getByText("Add Area");
        fireEvent.click(addBtn);

        expect(screen.getByTestId("barangay-modal")).toBeInTheDocument();
    });

    it("edit button opens modal", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        render(<AdminBarangaysPage />);
        await waitFor(() => expect(screen.getByText("East Tapinac")).toBeInTheDocument());

        // Find Edit buttons (Pencil icon buttons). We can find them looking for their general class structure
        // Since we didn't add test IDs to the edit buttons, we find by knowing there are exactly 3 rows with actions.
        const editButtons = screen.getAllByRole("button").filter(b =>
            b.className.includes("hover:bg-muted") && !b.className.includes("text-primary-foreground") && !b.className.includes("h-5 w-9") && !b.className.includes("hover:bg-red")
        );

        // Need to clearly identify the edit button, perhaps the Pencil icon inside is sufficient.
        // It's the first button in the actions div.
        fireEvent.click(editButtons[0]); // Click Edit for East Tapinac

        expect(screen.getByTestId("barangay-modal")).toBeInTheDocument();
    });

    it("delete prompts confirmation and calls API if confirmed", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        render(<AdminBarangaysPage />);
        await waitFor(() => expect(screen.getByText("East Tapinac")).toBeInTheDocument());

        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        (global.fetch as any).mockResolvedValueOnce({ ok: true });
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] })
        }); // re-fetch

        // Find Delete buttons
        const deleteButtons = screen.getAllByRole("button").filter(b => b.className.includes("hover:text-red-600"));

        fireEvent.click(deleteButtons[0]);

        expect(confirmSpy).toHaveBeenCalledWith(`Delete "East Tapinac"? This can't be undone.`);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(`/api/admin/barangays/b1`, { method: "DELETE" });
        });

        confirmSpy.mockRestore();
    });

    it("search filters by name and slug", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockBarangays })
        });

        render(<AdminBarangaysPage />);
        await waitFor(() => expect(screen.getByText("East Tapinac")).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText("Search barangays...");

        fireEvent.change(searchInput, { target: { value: "Tapinac" } });

        await waitFor(() => {
            expect(screen.getByText("East Tapinac")).toBeInTheDocument();
            expect(screen.queryByText("Barretto")).not.toBeInTheDocument();
        });

        fireEvent.change(searchInput, { target: { value: "barretto" } });

        await waitFor(() => {
            expect(screen.getByText("Barretto")).toBeInTheDocument();
            expect(screen.queryByText("East Tapinac")).not.toBeInTheDocument();
        });
    });
});
