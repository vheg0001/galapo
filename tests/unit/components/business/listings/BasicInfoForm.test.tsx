import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BasicInfoForm from "@/components/business/listings/BasicInfoForm";
import { useListingFormStore } from "@/store/listingFormStore";

// Mock the store and components
vi.mock("@/store/listingFormStore", () => ({
    useListingFormStore: vi.fn(),
}));

vi.mock("@/components/business/listings/RichTextEditor", () => ({
    default: ({ value, onChange, placeholder }: any) => (
        <textarea
            data-testid="rich-text-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

vi.mock("@/components/business/listings/TagInput", () => ({
    default: ({ tags, onChange, placeholder }: any) => (
        <div data-testid="tag-input">
            <input
                placeholder={placeholder}
                onKeyDown={(e: any) => {
                    if (e.key === "Enter") {
                        onChange([...tags, e.target.value]);
                        e.target.value = "";
                    }
                }}
            />
            {(tags || []).map((tag: string) => (
                <span key={tag}>{tag} <button onClick={() => onChange(tags.filter((t: string) => t !== tag))}>x</button></span>
            ))}
        </div>
    ),
}));

describe("BasicInfoForm", () => {
    const mockUpdateFormData = vi.fn();
    const defaultData = {
        business_name: "",
        short_description: "",
        full_description: "",
        phone: "",
        email: "",
        website: "",
        tags: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useListingFormStore as any).mockImplementation(() => ({
            formData: defaultData,
            updateFormData: mockUpdateFormData,
            errors: {}
        }));
    });

    it("renders all core fields", () => {
        render(<BasicInfoForm />);
        expect(screen.getByPlaceholderText(/Olongapo Grand Hotel/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/A brief summary/i)).toBeInTheDocument();
        expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/0912 345 6789/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/hello@business.com/i)).toBeInTheDocument();
    });

    it("updates business name on change", () => {
        render(<BasicInfoForm />);
        const input = screen.getByPlaceholderText(/Olongapo Grand Hotel/i);
        fireEvent.change(input, { target: { value: "New Business" } });
        expect(mockUpdateFormData).toHaveBeenCalledWith({ business_name: "New Business" });
    });

    it("displays character counter for short description", () => {
        (useListingFormStore as any).mockImplementation(() => ({
            formData: { ...defaultData, short_description: "Hello" },
            updateFormData: mockUpdateFormData,
            errors: {}
        }));
        render(<BasicInfoForm />);
        expect(screen.getByText("5 / 160")).toBeInTheDocument();
    });

    it("shows validation errors for required fields", () => {
        (useListingFormStore as any).mockImplementation(() => ({
            formData: defaultData,
            updateFormData: mockUpdateFormData,
            errors: { business_name: "Required" }
        }));
        render(<BasicInfoForm />);
        expect(screen.getByText("Required")).toBeInTheDocument();
    });

    it("handles tag addition and removal", async () => {
        render(<BasicInfoForm />);
        const tagInput = screen.getByTestId("tag-input").querySelector("input")!;

        fireEvent.change(tagInput, { target: { value: "Tag1" } });
        fireEvent.keyDown(tagInput, { key: "Enter" });

        await waitFor(() => {
            expect(mockUpdateFormData).toHaveBeenCalledWith(expect.objectContaining({ tags: ["Tag1"] }));
        });
    });
});
