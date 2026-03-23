import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DataTable from "@/components/admin/shared/DataTable";

describe("DataTable", () => {
    const columns = [
        { key: "id", header: "ID" },
        { key: "name", header: "Name", sortable: true },
        { key: "email", header: "Email" },
    ];

    const data = [
        { id: "1", name: "Alice", email: "alice@example.com" },
        { id: "2", name: "Bob", email: "bob@example.com" },
        { id: "3", name: "Charlie", email: "charlie@example.com" },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders column headers and data rows correctly", () => {
        render(<DataTable data={data} columns={columns} keyField="id" />);

        expect(screen.getByText("ID")).toBeInTheDocument();
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("sorts data when clicking a sortable header", async () => {
        const user = userEvent.setup();
        render(<DataTable data={data} columns={columns} keyField="id" />);

        const nameHeader = screen.getByText("Name");

        // Initial order: Alice, Bob, Charlie
        // Click to sort ASC
        await user.click(nameHeader);
        let rows = screen.getAllByRole("row").slice(1); // skip header
        expect(within(rows[0]).getByText("Alice")).toBeInTheDocument();

        // Click again to sort DESC
        await user.click(nameHeader);
        rows = screen.getAllByRole("row").slice(1);
        expect(within(rows[0]).getByText("Charlie")).toBeInTheDocument();
    });

    it("filters rows based on search input", async () => {
        const user = userEvent.setup();
        render(<DataTable data={data} columns={columns} keyField="id" />);

        const searchInput = screen.getByPlaceholderText(/Search/i);
        await user.type(searchInput, "Bob");

        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });

    it("handles pagination correctly", () => {
        const largeData = Array.from({ length: 15 }, (_, i) => ({
            id: String(i + 1),
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`
        }));

        render(<DataTable data={largeData} columns={columns} keyField="id" defaultPageSize={10} />);

        // Check for "Page 1 of 2"
        expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
        expect(screen.getByText("User 1")).toBeInTheDocument();
        expect(screen.queryByText("User 11")).not.toBeInTheDocument();
    });

    it("handles row selection and bulk actions", async () => {
        const user = userEvent.setup();
        const mockBulkAction = vi.fn();
        render(
            <DataTable
                data={data}
                columns={columns}
                keyField="id"
                bulkActions={[{ label: "Delete", onClick: mockBulkAction, variant: "destructive" }]}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        // checkboxes[0] is select all, [1] is first row (Alice)
        await user.click(checkboxes[1]);

        expect(screen.getByText("1 selected")).toBeInTheDocument();
        const deleteBtn = screen.getByText("Delete");
        await user.click(deleteBtn);

        expect(mockBulkAction).toHaveBeenCalledWith([data[0]]);
    });

    it("shows loading state", () => {
        render(<DataTable data={[]} columns={columns} keyField="id" isLoading={true} />);
        // Animation rows use animate-pulse. Let's check for specific elements.
        const pulseItems = document.querySelectorAll(".animate-pulse");
        expect(pulseItems.length).toBeGreaterThan(0);
    });

    it("shows empty state when no data", () => {
        render(<DataTable data={[]} columns={columns} keyField="id" emptyMessage="No users here" />);
        expect(screen.getByText("No users here")).toBeInTheDocument();
    });
});
