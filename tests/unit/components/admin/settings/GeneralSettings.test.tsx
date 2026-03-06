import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminSettingsPage from "@/app/(admin)/admin/settings/page";

describe("GeneralSettings (AdminSettingsPage)", () => {
    const mockSettings = {
        site_name: "GalaPo Test",
        site_tagline: "Test Tagline",
        site_description: "Test Description",
        contact_email: "test@example.com",
        support_phone: "123456789",
        facebook_url: "fb.com/test",
        maintenance_mode: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders all general settings fields pre-filled from database", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockSettings })
        });

        render(<AdminSettingsPage />);

        // Wait for load
        await waitFor(() => {
            expect(screen.getByDisplayValue("GalaPo Test")).toBeInTheDocument();
        });

        // General tab is open by default
        expect(screen.getByDisplayValue("Test Tagline")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
        expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
        expect(screen.getByDisplayValue("123456789")).toBeInTheDocument();
        expect(screen.getByDisplayValue("fb.com/test")).toBeInTheDocument();
    });

    it("edit fields and save calls API with updates", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockSettings })
        });

        render(<AdminSettingsPage />);
        await waitFor(() => expect(screen.getByDisplayValue("GalaPo Test")).toBeInTheDocument());

        // Setup save mock
        (global.fetch as any).mockResolvedValueOnce({ ok: true });

        // Edit a field
        const nameInput = screen.getByDisplayValue("GalaPo Test");
        fireEvent.change(nameInput, { target: { value: "New Site Name" } });

        // Toggle maintenance mode
        // Find by clicking the toggle container. In the component:
        // text: "Maintenance Mode" is next to the toggle
        const toggleContainer = screen.getByText("Maintenance Mode").closest("label");
        // Inside the label there's a div acting as a toggle
        const toggleDiv = toggleContainer?.querySelector("div.relative");
        if (toggleDiv) {
            fireEvent.click(toggleDiv);
        }

        const saveBtn = screen.getByText("Save Settings");
        fireEvent.click(saveBtn);

        expect(global.fetch).toHaveBeenCalledWith("/api/admin/settings", expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining("New Site Name"), // Check it includes the updated value
        }));

        // Check if `maintenance_mode` became false (it was true initially)
        const callArgs = (global.fetch as any).mock.calls[1][1];
        const bodyContent = JSON.parse(callArgs.body);
        expect(bodyContent.maintenance_mode).toBe(false);

        await waitFor(() => {
            expect(screen.getByText("Saved!")).toBeInTheDocument();
        });
    });
});
