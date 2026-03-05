import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BulkActionsBar from "@/components/admin/listings/BulkActionsBar";

describe("BulkActionsBar", () => {
    const onAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("appears when rows are selected", () => {
        const { rerender } = render(<BulkActionsBar selectedCount={0} onAction={onAction} />);
        expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();

        rerender(<BulkActionsBar selectedCount={2} onAction={onAction} />);
        expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("shows selected count", () => {
        render(<BulkActionsBar selectedCount={5} onAction={onAction} />);
        expect(screen.getByText("5 selected")).toBeInTheDocument();
    });

    it("provides bulk action controls", () => {
        render(<BulkActionsBar selectedCount={3} onAction={onAction} />);
        expect(screen.getByRole("button", { name: /Approve Selected/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Reject Selected/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Delete Selected/i })).toBeInTheDocument();
    });

    it("calls handler for destructive actions", () => {
        render(<BulkActionsBar selectedCount={1} onAction={onAction} />);
        fireEvent.click(screen.getByRole("button", { name: /Delete Selected/i }));
        expect(onAction).toHaveBeenCalledWith("delete");
    });

    it("supports deselection flow via parent callback", () => {
        render(<BulkActionsBar selectedCount={1} onAction={onAction} />);
        fireEvent.click(screen.getByRole("button", { name: /Reject Selected/i }));
        expect(onAction).toHaveBeenCalledWith("reject");
    });
});
