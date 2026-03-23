import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import IconPicker from "@/components/admin/categories/IconPicker";

describe("IconPicker", () => {
    const defaultProps = {
        value: "",
        onChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders default state with empty value", () => {
        render(<IconPicker {...defaultProps} />);
        expect(screen.getByText("Select Icon…")).toBeInTheDocument();
        // The popup grid is not open initially
        expect(screen.queryByPlaceholderText("Search icons...")).not.toBeInTheDocument();
    });

    it("renders selected icon when value is provided", () => {
        render(<IconPicker {...defaultProps} value="Star" />);
        expect(screen.getByText("Star")).toBeInTheDocument();
    });

    it("opens grid of icons when clicked", () => {
        render(<IconPicker {...defaultProps} />);
        const trigger = screen.getByText("Select Icon…");

        fireEvent.click(trigger);

        expect(screen.getByPlaceholderText("Search icons...")).toBeInTheDocument();
        // Check a few icons are rendered by title
        expect(screen.getByTitle("Store")).toBeInTheDocument();
        expect(screen.getByTitle("Star")).toBeInTheDocument();
    });

    it("search filters icons display", () => {
        render(<IconPicker {...defaultProps} />);
        fireEvent.click(screen.getByText("Select Icon…"));

        const searchInput = screen.getByPlaceholderText("Search icons...");

        // Search for 'Cat'
        fireEvent.change(searchInput, { target: { value: "Cat" } });

        expect(screen.getByTitle("Cat")).toBeInTheDocument();
        // 'Dog' shouldn't be visible anymore
        expect(screen.queryByTitle("Dog")).not.toBeInTheDocument();
        // 'Category' isn't in the list, but 'Cat' is.
    });

    it("click icon selects it and calls onChange", () => {
        render(<IconPicker {...defaultProps} />);
        fireEvent.click(screen.getByText("Select Icon…"));

        const starBtn = screen.getByTitle("Star");
        fireEvent.click(starBtn);

        expect(defaultProps.onChange).toHaveBeenCalledWith("Star");
        // Popover closes after selection
        expect(screen.queryByPlaceholderText("Search icons...")).not.toBeInTheDocument();
    });

    it("currently selected icon is highlighted", () => {
        render(<IconPicker {...defaultProps} value="Star" />);

        // Open the popover by clicking the component container (the text 'Star' is inside it)
        fireEvent.click(screen.getByText("Star"));

        const starBtn = screen.getByTitle("Star");

        // Assert it has the highlight class we see in the code
        expect(starBtn).toHaveClass("bg-primary/10", "text-primary", "ring-1");
    });

    it("clear button resets selection", () => {
        render(<IconPicker {...defaultProps} value="Star" />);

        // The clear button has an X icon inside a button. 
        // We can find it because it's the only button in the closed state.
        const clearBtn = screen.getByRole("button");
        fireEvent.click(clearBtn);

        expect(defaultProps.onChange).toHaveBeenCalledWith("");
    });
});
