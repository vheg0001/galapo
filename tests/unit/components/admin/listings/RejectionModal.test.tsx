import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RejectionModal from "@/components/admin/listings/RejectionModal";

describe("RejectionModal", () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderModal(open = true, loading = false) {
        return render(
            <RejectionModal
                open={open}
                loading={loading}
                onClose={onClose}
                onSubmit={onSubmit}
            />
        );
    }

    it("modal opens on trigger", () => {
        renderModal(true);
        expect(screen.getByRole("heading", { name: /Reject Listing/i })).toBeInTheDocument();
    });

    it("reason textarea is required", () => {
        renderModal(true);
        fireEvent.change(screen.getByPlaceholderText(/Enter rejection reason/i), {
            target: { value: "" },
        });
        expect(screen.getByRole("button", { name: /Reject Listing/i })).toBeDisabled();
    });

    it("template dropdown pre-fills reason", () => {
        renderModal(true);
        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: "Inappropriate content" } });
        expect(screen.getByPlaceholderText(/Enter rejection reason/i)).toHaveValue("Inappropriate content");
    });

    it("custom reason is editable", () => {
        renderModal(true);
        const select = screen.getByRole("combobox");
        const textarea = screen.getByPlaceholderText(/Enter rejection reason/i);
        fireEvent.change(select, { target: { value: "Custom reason..." } });
        fireEvent.change(textarea, { target: { value: "Missing permit proof" } });
        expect(textarea).toHaveValue("Missing permit proof");
    });

    it("reject button submits reason", () => {
        renderModal(true);
        const textarea = screen.getByPlaceholderText(/Enter rejection reason/i);
        fireEvent.change(textarea, { target: { value: "Duplicate listing" } });
        fireEvent.click(screen.getByRole("button", { name: /Reject Listing/i }));
        expect(onSubmit).toHaveBeenCalledWith("Duplicate listing");
    });

    it("cancel closes modal", () => {
        renderModal(true);
        fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("shows loading state during submission", () => {
        renderModal(true, true);
        expect(screen.getByRole("button", { name: /Rejecting/i })).toBeDisabled();
    });
});
