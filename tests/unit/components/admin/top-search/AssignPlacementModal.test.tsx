import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssignPlacementModal } from "@/components/admin/top-search/AssignPlacementModal";
import { server } from "../../../../mocks/server";
import { http, HttpResponse } from "msw";
import { APP_URL } from "@/lib/constants";

describe("AssignPlacementModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("listing search works and results are selectable", async () => {
        server.use(
            http.get(`${APP_URL}/api/admin/listings/search`, () => {
                return HttpResponse.json({
                    data: [{ id: "list-1", business_name: "Found Business" }]
                });
            })
        );

        render(
            <AssignPlacementModal 
                isOpen={true} 
                onClose={vi.fn()} 
                onSuccess={vi.fn()} 
                categoryId="cat-1" 
                categoryName="Food" 
                position={1} 
            />
        );

        const input = screen.getByPlaceholderText(/Search by business name/i);
        fireEvent.change(input, { target: { value: "Found" } });

        await waitFor(() => {
            expect(screen.getByText("Found Business")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Found Business"));
        expect(screen.getByText("Found Business")).toHaveClass("text-emerald-800");
    });

    it("duration defaults to 30 days", () => {
        render(
            <AssignPlacementModal 
                isOpen={true} 
                onClose={vi.fn()} 
                onSuccess={vi.fn()} 
                categoryId="cat-1" 
                categoryName="Food" 
                position={1} 
            />
        );

        const thirtyDaysLabel = screen.getByLabelText(/30 Days/i);
        // Radios are sr-only, so we check the parent's classes or the checked state if we can find it
        expect(thirtyDaysLabel).toBeChecked();
    });

    it("submission creates placement and calls onSuccess", async () => {
        const onSuccess = vi.fn();
        const onClose = vi.fn();
        
        server.use(
            http.get(`${APP_URL}/api/admin/listings/search`, () => {
                return HttpResponse.json({
                    data: [{ id: "list-1", business_name: "Test Biz" }]
                });
            }),
            http.post(`${APP_URL}/api/admin/top-search`, () => {
                return HttpResponse.json({ success: true }, { status: 201 });
            })
        );

        render(
            <AssignPlacementModal 
                isOpen={true} 
                onClose={onClose} 
                onSuccess={onSuccess} 
                categoryId="cat-1" 
                categoryName="Food" 
                position={1} 
            />
        );

        // Search and select
        fireEvent.change(screen.getByPlaceholderText(/Search by business name/i), { target: { value: "Test" } });
        await waitFor(() => screen.getByText("Test Biz"));
        fireEvent.click(screen.getByText("Test Biz"));

        // Submit
        fireEvent.click(screen.getByRole("button", { name: /Assign Placement/i }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });
});
