import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MobileBottomBar from "@/components/public/listing/MobileBottomBar";
import { trackContactClick } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
    trackContactClick: vi.fn(),
}));

describe("MobileBottomBar", () => {
    const mockProps = {
        phone: "0917-123-4567",
        lat: 14.8,
        lng: 120.2,
        businessName: "Test Business",
        url: "https://galapo.ph/listing/test-business",
        listingSlug: "test-business",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders three buttons: Call, Directions, Share", () => {
        render(<MobileBottomBar {...mockProps} />);
        expect(screen.getByRole("link", { name: /call/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /directions/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
    });

    it("call button uses tel: link without formatting characters", () => {
        render(<MobileBottomBar {...mockProps} />);
        const link = screen.getByRole("link", { name: /call/i });
        expect(link).toHaveAttribute("href", "tel:09171234567");
    });

    it("directions button opens maps URL", () => {
        render(<MobileBottomBar {...mockProps} />);
        const link = screen.getByRole("link", { name: /directions/i });
        expect(link).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    });

    it("share button triggers Web Share API if available", async () => {
        const shareSpy = vi.fn().mockResolvedValue(undefined);
        global.navigator.share = shareSpy;

        render(<MobileBottomBar {...mockProps} />);
        fireEvent.click(screen.getByRole("button", { name: /share/i }));

        expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({
            title: mockProps.businessName,
            url: mockProps.url,
        }));
    });

    it("bar is sticky at bottom hidden by default on desktop", () => {
        const { container } = render(<MobileBottomBar {...mockProps} />);
        const bar = container.firstChild;
        expect(bar).toHaveClass("fixed", "bottom-0", "lg:hidden");
    });
});
