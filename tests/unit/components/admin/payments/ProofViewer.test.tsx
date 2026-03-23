import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProofViewer from "@/components/admin/payments/ProofViewer";

describe("ProofViewer", () => {
    it("renders image proof correctly", () => {
        render(<ProofViewer url="http://test.com/img.png" />);
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "http://test.com/img.png");
    });

    it("renders PDF proof with download link", () => {
        render(<ProofViewer url="http://test.com/proof.pdf" />);
        expect(screen.getByText(/PDF Document/i)).toBeDefined();
        expect(screen.getByText(/Open PDF in New Tab/i)).toBeDefined();
    });

    it("shows error state for invalid URL", () => {
        render(<ProofViewer url="" />);
        expect(screen.getByText(/No proof uploaded/i)).toBeDefined();
    });
});
