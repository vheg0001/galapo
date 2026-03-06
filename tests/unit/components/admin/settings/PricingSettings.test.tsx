import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminSettingsPage from "@/app/(admin)/admin/settings/page";

describe("PricingSettings (AdminSettingsPage)", () => {
    const mockSettings = {
        price_basic: "0",
        price_premium: "2400",
        price_featured: "500",
        price_claim: "500",
        price_reactivation: "200",
        price_ad_banner: "1500",
        price_top_search: "500",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders pricing tab with all fields pre-filled", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockSettings })
        });

        render(<AdminSettingsPage />);

        await waitFor(() => {
            expect(screen.getByText("Site Settings")).toBeInTheDocument();
        });

        // Switch to Pricing tab
        const pricingTab = screen.getByText("Pricing");
        fireEvent.click(pricingTab);

        expect(screen.getByText("Subscription Plans")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2400")).toBeInTheDocument(); // Premium Plan
        expect(screen.getByDisplayValue("0")).toBeInTheDocument(); // Basic Plan

        // Count the occurrences of "500" - there should be 3 (featured, claim, top search)
        const fiveHundredInputs = screen.getAllByDisplayValue("500");
        expect(fiveHundredInputs.length).toBe(3);
    });

    it("edit numeric fields and save calls API with updates", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockSettings })
        });

        render(<AdminSettingsPage />);
        await waitFor(() => expect(screen.getByText("Site Settings")).toBeInTheDocument());

        // Setup save mock
        (global.fetch as any).mockResolvedValueOnce({ ok: true });

        // Switch to Pricing tab
        const pricingTab = screen.getByText("Pricing");
        fireEvent.click(pricingTab);

        // Edit a field (Premium Plan)
        const premiumInput = screen.getByDisplayValue("2400");
        fireEvent.change(premiumInput, { target: { value: "3000" } });

        const saveBtn = screen.getByText("Save Settings");
        fireEvent.click(saveBtn);

        expect(global.fetch).toHaveBeenCalledWith("/api/admin/settings", expect.objectContaining({
            method: "PATCH",
        }));

        const callArgs = (global.fetch as any).mock.calls[1][1];
        const bodyContent = JSON.parse(callArgs.body);

        expect(bodyContent.price_premium).toBe("3000"); // Updated value

        await waitFor(() => {
            expect(screen.getByText("Saved!")).toBeInTheDocument();
        });
    });

    // We test validation in API or form wrapper, currently SettingsInput assumes text/number string values.
    // Basic structural validation tests.
    it("renders validation errors if any (API handles negative numbers)", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockSettings })
        });

        render(<AdminSettingsPage />);
        await waitFor(() => expect(screen.getByText("Site Settings")).toBeInTheDocument());

        // Setup mocked failure
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Validation failed: expected positive number" })
        });

        const saveSpy = vi.spyOn(window, "alert").mockImplementation(() => { });

        // Switch to Pricing tab
        const pricingTab = screen.getByText("Pricing");
        fireEvent.click(pricingTab);

        // Edit
        const premiumInput = screen.getByDisplayValue("2400");
        fireEvent.change(premiumInput, { target: { value: "-500" } });

        const saveBtn = screen.getByText("Save Settings");
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith("Failed to save settings");
        });
        saveSpy.mockRestore();
    });
});
