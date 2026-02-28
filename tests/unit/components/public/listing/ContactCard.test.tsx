import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ContactCard from "@/components/public/listing/ContactCard";
import { trackContactClick } from "@/lib/analytics";

// Mock the analytics module
vi.mock("@/lib/analytics", () => ({
    trackContactClick: vi.fn(),
}));

describe("ContactCard", () => {
    const mockProps = {
        phone: "0917-123-4567",
        email: "test@business.com",
        website: "https://testbusiness.com",
        socialLinks: {
            facebook: "https://facebook.com/test",
            instagram: "https://instagram.com/test",
            tiktok: "https://tiktok.com/@test",
        },
        lat: 14.8,
        lng: 120.2,
        businessName: "Test Business",
        listingSlug: "test-business",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("phone renders as tel: link", () => {
        render(<ContactCard {...mockProps} />);
        const phoneElement = screen.getByText(mockProps.phone);
        const link = phoneElement.closest("a");
        expect(link).toHaveAttribute("href", "tel:09171234567");
    });

    it("email renders as mailto: link", () => {
        render(<ContactCard {...mockProps} />);
        const emailElement = screen.getByText(mockProps.email);
        const link = emailElement.closest("a");
        expect(link).toHaveAttribute("href", `mailto:${mockProps.email}`);
    });

    it("website opens in new tab", () => {
        render(<ContactCard {...mockProps} />);
        const link = screen.getByRole("link", { name: /visit website/i });
        expect(link).toHaveAttribute("href", mockProps.website);
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("social media icons render with correct links", () => {
        render(<ContactCard {...mockProps} />);
        expect(screen.getByLabelText(/facebook/i)).toHaveAttribute("href", mockProps.socialLinks.facebook);
        expect(screen.getByLabelText(/instagram/i)).toHaveAttribute("href", mockProps.socialLinks.instagram);
        expect(screen.getByLabelText(/tiktok/i)).toHaveAttribute("href", mockProps.socialLinks.tiktok);
    });

    it("'Get Directions' button generates correct maps URL", () => {
        render(<ContactCard {...mockProps} />);
        const link = screen.getByRole("link", { name: /get directions/i });
        expect(link).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    });

    it("click tracking fires for phone and email", () => {
        render(<ContactCard {...mockProps} />);

        fireEvent.click(screen.getByText(mockProps.phone));
        expect(trackContactClick).toHaveBeenCalled();

        fireEvent.click(screen.getByText(mockProps.email));
        expect(trackContactClick).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("link", { name: /visit website/i }));
        expect(trackContactClick).toHaveBeenCalled();
    });
});
