import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ClaimDetailView from "@/components/admin/claims/ClaimDetailView";
import ProofDocumentViewer from "@/components/admin/claims/ProofDocumentViewer";

describe("ClaimDetailView", () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const claim = {
        id: "claim-1",
        listing_name: "Cafe Uno",
        category_name: "Food",
        status: "claimed_pending",
        claim_proof_url: "https://cdn.test/proof.jpg",
        claimant: {
            full_name: "Jane Doe",
            email: "jane@example.com",
            phone: "0912 000 1234",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows listing and claimant information", () => {
        render(<ClaimDetailView claim={claim} onAction={onAction} />);
        expect(screen.getByText("Cafe Uno")).toBeInTheDocument();
        expect(screen.getByText("Food")).toBeInTheDocument();
        expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/jane@example.com/i)).toBeInTheDocument();
    });

    it("proof document viewer renders image inline", () => {
        render(<ProofDocumentViewer url="https://cdn.test/proof.jpg" />);
        expect(screen.getByAltText(/Claim proof/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Download \/ Open Proof Document/i })).toBeInTheDocument();
    });

    it("proof document viewer handles pdf documents", () => {
        render(<ProofDocumentViewer url="https://cdn.test/proof.pdf" />);
        expect(screen.getByTitle(/Claim proof PDF/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Download \/ Open Proof Document/i })).toBeInTheDocument();
    });

    it("approve button triggers approve action", async () => {
        render(<ClaimDetailView claim={claim} onAction={onAction} />);
        fireEvent.click(screen.getByRole("button", { name: /Approve Claim/i }));
        await waitFor(() => {
            expect(onAction).toHaveBeenCalledWith("approve", "");
        });
    });

    it("reject button requires reason then triggers reject action", async () => {
        render(<ClaimDetailView claim={claim} onAction={onAction} />);
        const rejectBtn = screen.getByRole("button", { name: /Reject Claim/i });
        expect(rejectBtn).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText(/Required for rejection/i), {
            target: { value: "Insufficient proof" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Reject Claim/i }));

        await waitFor(() => {
            expect(onAction).toHaveBeenCalledWith("reject", "Insufficient proof");
        });
    });
});
