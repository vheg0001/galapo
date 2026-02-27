import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SocialShareButtons from "@/components/shared/SocialShareButtons";

describe("SocialShareButtons Component", () => {
    const mockUrl = "https://galapo.com/listing/test";
    const mockTitle = "Test Listing";

    beforeEach(() => {
        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
            share: vi.fn().mockResolvedValue(undefined),
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it("renders all share buttons", () => {
        render(<SocialShareButtons url={mockUrl} title={mockTitle} />);

        expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
        expect(screen.getByLabelText("Share on Twitter")).toBeInTheDocument();
        expect(screen.getByLabelText("Copy link")).toBeInTheDocument();
        expect(screen.getByLabelText("Share")).toBeInTheDocument(); // Native share
    });

    it("has correct Facebook share link", () => {
        render(<SocialShareButtons url={mockUrl} title={mockTitle} />);
        const fbBtn = screen.getByLabelText("Share on Facebook");
        expect(fbBtn).toHaveAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mockUrl)}`);
    });

    it("has correct Twitter share link", () => {
        render(<SocialShareButtons url={mockUrl} title={mockTitle} />);
        const twBtn = screen.getByLabelText("Share on Twitter");
        expect(twBtn).toHaveAttribute("href", `https://twitter.com/intent/tweet?url=${encodeURIComponent(mockUrl)}&text=${encodeURIComponent(mockTitle)}`);
    });

    it("copies link to clipboard and shows 'Copied!' toast", async () => {
        render(<SocialShareButtons url={mockUrl} title={mockTitle} />);

        const copyBtn = screen.getByLabelText("Copy link");

        await act(async () => {
            fireEvent.click(copyBtn);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
        expect(screen.getByText("Copied!")).toBeInTheDocument();

        // Advance timer to hide toast
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
    });

    it("calls native share API when available", async () => {
        render(<SocialShareButtons url={mockUrl} title={mockTitle} />);

        const shareBtn = screen.getByLabelText("Share");

        await act(async () => {
            fireEvent.click(shareBtn);
        });

        expect(navigator.share).toHaveBeenCalledWith({ title: mockTitle, url: mockUrl });
    });
});
