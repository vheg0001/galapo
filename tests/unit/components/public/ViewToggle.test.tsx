import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ViewToggle from "@/components/public/ViewToggle";

describe("ViewToggle Component", () => {
    it("renders three toggle buttons", () => {
        const onChange = vi.fn();
        render(<ViewToggle current="grid" onChange={onChange} />);

        expect(screen.getByLabelText("Grid view")).toBeInTheDocument();
        expect(screen.getByLabelText("List view")).toBeInTheDocument();
        expect(screen.getByLabelText("Map view")).toBeInTheDocument();
    });

    it("highlights the active view button", () => {
        const onChange = vi.fn();
        const { rerender } = render(<ViewToggle current="grid" onChange={onChange} />);

        const gridBtn = screen.getByLabelText("Grid view");
        expect(gridBtn.className).toContain("bg-primary");

        const listBtn = screen.getByLabelText("List view");
        expect(listBtn.className).not.toContain("bg-primary");

        // Switch to list
        rerender(<ViewToggle current="list" onChange={onChange} />);
        expect(screen.getByLabelText("List view").className).toContain("bg-primary");
        expect(screen.getByLabelText("Grid view").className).not.toContain("bg-primary");
    });

    it("calls onChange when clicking a toggle", () => {
        const onChange = vi.fn();
        render(<ViewToggle current="grid" onChange={onChange} />);

        fireEvent.click(screen.getByLabelText("Map view"));
        expect(onChange).toHaveBeenCalledWith("map");

        fireEvent.click(screen.getByLabelText("List view"));
        expect(onChange).toHaveBeenCalledWith("list");
    });
});
