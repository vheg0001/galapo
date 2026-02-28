import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DynamicFields from "@/components/public/listing/DynamicFields";

describe("DynamicFields", () => {
    const mockFields = [
        {
            id: "1",
            value: "Filipino",
            category_fields: {
                id: "f1",
                field_name: "cuisine",
                field_label: "Cuisine",
                field_type: "text",
                sort_order: 1,
                options: null,
            },
        },
        {
            id: "2",
            value: 500,
            category_fields: {
                id: "f2",
                field_name: "price_range",
                field_label: "Price Range",
                field_type: "number",
                sort_order: 2,
                options: null,
            },
        },
        {
            id: "3",
            value: true,
            category_fields: {
                id: "f3",
                field_name: "delivery",
                field_label: "Delivery Available",
                field_type: "boolean",
                sort_order: 3,
                options: null,
            },
        },
        {
            id: "4",
            value: 1500,
            category_fields: {
                id: "f4",
                field_name: "fee",
                field_label: "Entry Fee",
                field_type: "currency",
                sort_order: 4,
                options: null,
            },
        },
    ];

    it("text fields render as plain text", () => {
        render(<DynamicFields fieldValues={[mockFields[0]]} />);
        expect(screen.getByText("Cuisine")).toBeInTheDocument();
        expect(screen.getByText("Filipino")).toBeInTheDocument();
    });

    it("number fields render correctly", () => {
        render(<DynamicFields fieldValues={[mockFields[1]]} />);
        expect(screen.getByText("500")).toBeInTheDocument();
    });

    it("boolean fields render Yes/No", () => {
        render(<DynamicFields fieldValues={[mockFields[2]]} />);
        expect(screen.getByText("Yes")).toBeInTheDocument();
    });

    it("currency fields render with ₱ symbol", () => {
        render(<DynamicFields fieldValues={[mockFields[3]]} />);
        // formatCurrency uses PHP which is ₱
        expect(screen.getByText(/₱1,500/)).toBeInTheDocument();
    });

    it("menu items render via MenuDisplay", () => {
        const menuField = {
            id: "5",
            value: [
                { id: "m1", name: "Adobo", price: 150, description: "Classic Filipino dish" }
            ],
            category_fields: {
                id: "f5",
                field_name: "menu",
                field_label: "Menu Items",
                field_type: "menu_items",
                sort_order: 5,
                options: null,
            },
        };
        render(<DynamicFields fieldValues={[menuField]} />);
        expect(screen.getByText("Adobo")).toBeInTheDocument();
        // MenuDisplay uses formatCurrency too
        expect(screen.getByText(/₱150/)).toBeInTheDocument();
    });

    it("empty values are skipped", () => {
        const emptyField = {
            id: "6",
            value: null,
            category_fields: { id: "f6", field_name: "empty", field_label: "Empty", field_type: "text", sort_order: 6, options: null },
        };
        render(<DynamicFields fieldValues={[emptyField]} />);
        expect(screen.queryByText("Empty")).not.toBeInTheDocument();
    });
});
