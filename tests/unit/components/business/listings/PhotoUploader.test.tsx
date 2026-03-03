import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PhotoUploader from "@/components/business/listings/PhotoUploader";

describe("PhotoUploader", () => {
    const mockOnChange = vi.fn();
    const mockPhotos = [
        { id: "1", url: "https://example.com/1.jpg", isPrimary: true },
        { id: "2", url: "https://example.com/2.jpg", isPrimary: false }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
        global.URL.revokeObjectURL = vi.fn();
    });

    it("renders existing photos", () => {
        render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);
        expect(screen.getAllByRole("img")).toHaveLength(2);
        expect(screen.getByText("COVER")).toBeInTheDocument();
    });

    it("marks the first photo as primary by default upon upload if list was empty", () => {
        render(<PhotoUploader photos={[]} onChange={mockOnChange} />);
        const input = screen.getByLabelText(/Add Photos/i) as HTMLInputElement;

        const file = new File(["test"], "test.png", { type: "image/png" });
        fireEvent.change(input, { target: { files: [file] } });

        expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ isPrimary: true })
        ]));
    });

    it("allows setting a different photo as primary", () => {
        render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

        const setCoverButtons = screen.getAllByRole("button", { name: /Set as Cover/i });
        fireEvent.click(setCoverButtons[0]); // Photo 2

        expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: "2", isPrimary: true })
        ]));
    });

    it("removes a photo when delete is clicked", () => {
        render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

        const deleteButtons = screen.getAllByRole("button").filter(b => b.querySelector("svg"));
        fireEvent.click(deleteButtons[0]);

        expect(mockOnChange).toHaveBeenCalledWith([{ id: "2", url: "https://example.com/2.jpg", isPrimary: true }]);
    });

    it("enforces max photos limit", () => {
        const fullPhotos = Array(10).fill(null).map((_, i) => ({ id: `${i}`, url: "...", isPrimary: i === 0 }));
        render(<PhotoUploader photos={fullPhotos} onChange={mockOnChange} maxPhotos={10} />);

        expect(screen.queryByLabelText(/Add Photos/i)).not.toBeInTheDocument();
    });
});
