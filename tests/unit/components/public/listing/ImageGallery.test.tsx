import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ImageGallery from "@/components/public/listing/ImageGallery";
import { createMockListingImage } from "../../../../mocks/factories";

describe("ImageGallery", () => {
    const mockImages = [
        createMockListingImage({ id: "1", image_url: "https://example.com/image1.jpg", is_primary: true }),
        createMockListingImage({ id: "2", image_url: "https://example.com/image2.jpg", is_primary: false }),
    ];

    it("renders main business images", async () => {
        render(<ImageGallery images={mockImages} businessName="Test Business" />);
        // Use a more generic selector if getByAltText fails
        const images = screen.getAllByRole("img");
        expect(images.length).toBeGreaterThan(0);
        // Look for the primary image URL in the src (Next/Image encodes it)
        const mainImg = images.find(img => img.getAttribute("src")?.includes("image1.jpg"));
        expect(mainImg).toBeDefined();
    });

    it("renders thumbnail strip with buttons", () => {
        render(<ImageGallery images={mockImages} businessName="Test Business" />);
        const thumbnails = screen.getAllByRole("button", { name: /view image/i });
        expect(thumbnails).toHaveLength(mockImages.length);
    });

    it("lightbox opens when main image area is clicked", async () => {
        render(<ImageGallery images={mockImages} businessName="Test Business" />);
        // Click the zoom button
        const zoomButton = screen.getByLabelText(/view full screen/i);
        fireEvent.click(zoomButton);

        // Wait for lightbox close button
        expect(await screen.findByLabelText(/close/i)).toBeInTheDocument();
    });
});
