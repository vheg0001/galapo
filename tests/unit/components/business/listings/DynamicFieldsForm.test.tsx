import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DynamicFieldsForm from "@/components/business/listings/DynamicFieldsForm";

// Mocking DynamicFieldRenderer
vi.mock("@/components/business/listings/DynamicFieldRenderer", () => ({
    default: ({ field, value, onChange }: any) => (
        <div data-testid={`field-${field.id}`}>
            <label htmlFor={field.id}>{field.field_label}</label>
            <input
                id={field.id}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}));

describe("DynamicFieldsForm", () => {
    const mockOnChange = vi.fn();
    const mockCategories = [
        {
            id: "cat-1",
            name: "Category 1",
            fields: [
                { id: "f1", field_label: "Field 1", category_id: "cat-1", is_required: true, sort_order: 1 },
            ],
            subcategories: []
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockCategories)
            })
        ) as any;
    });

    it("renders fields for the given category", async () => {
        render(<DynamicFieldsForm categoryId="cat-1" subcategoryId="" values={{}} onChange={mockOnChange} />);

        // Component will show loading first, then the field
        await waitFor(() => {
            expect(screen.getByText("Field 1")).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it("calls onChange when field changes", async () => {
        render(<DynamicFieldsForm categoryId="cat-1" subcategoryId="" values={{}} onChange={mockOnChange} />);

        await waitFor(() => screen.getByLabelText("Field 1"), { timeout: 5000 });
        const input = screen.getByLabelText("Field 1");
        fireEvent.change(input, { target: { value: "Val" } });

        expect(mockOnChange).toHaveBeenCalled();
    });
});
