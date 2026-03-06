import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PageEditor from "@/components/admin/pages/PageEditor";

// Mock router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace })
}));

// Mock RichTextEditor
vi.mock("@/components/admin/pages/RichTextEditor", () => ({
    default: ({ value, onChange, placeholder }: any) => (
        <div data-testid="rich-text-editor">
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                data-testid="rte-input"
            />
            <button onClick={() => onChange("<strong>Bold HTML</strong>")}>Make Bold</button>
        </div>
    )
}));

describe("PageEditor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders empty form for new page and auto-generates slug", () => {
        render(<PageEditor pageId="new" />);

        expect(screen.getByPlaceholderText("About GalaPo")).toHaveValue("");
        expect(screen.getByPlaceholderText("about-galapo")).toHaveValue("");

        // Type title -> auto generate slug
        const titleInput = screen.getByPlaceholderText("About GalaPo");
        fireEvent.change(titleInput, { target: { value: "Terms of Service" } });

        expect(screen.getByPlaceholderText("about-galapo")).toHaveValue("terms-of-service");
    });

    it("loads existing page data", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    title: "Privacy Policy",
                    slug: "privacy-policy",
                    content: "<p>We protect your data.</p>",
                    meta_title: "Privacy - GalaPo",
                    meta_description: "Our privacy rules.",
                    is_published: true,
                }
            })
        });

        render(<PageEditor pageId="p1" />);

        // Should initially show loading, then content
        await waitFor(() => {
            expect(screen.getByDisplayValue("Privacy Policy")).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue("privacy-policy")).toBeInTheDocument();
        expect(screen.getByDisplayValue("<p>We protect your data.</p>")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Privacy - GalaPo")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Our privacy rules.")).toBeInTheDocument();

        // is_published toggle
        const publishToggle = screen.getByLabelText("Published (visible to public)");
        expect(publishToggle).toBeChecked();

        // Preview button should be visible for existing pages with slug
        expect(screen.getByText("Preview")).toHaveAttribute("href", "/pages/privacy-policy");
    });

    it("rich text editor correctly receives and updates content", async () => {
        render(<PageEditor pageId="new" />);

        // Wait for render
        const rte = await screen.findByTestId("rte-input");
        expect(rte).toHaveValue("<p></p>"); // Default new state

        // Simulate internal change
        fireEvent.change(rte, { target: { value: "<h2>Hello</h2>" } });
        expect(rte).toHaveValue("<h2>Hello</h2>");

        // Use mock "Make Bold" button
        fireEvent.click(screen.getByText("Make Bold"));
        expect(rte).toHaveValue("<strong>Bold HTML</strong>");
    });

    it("displays character counts for meta fields and warns if over limit", () => {
        render(<PageEditor pageId="new" />);

        const metaTitleInput = screen.getByPlaceholderText("Override page title for search engines...");
        const metaDescInput = screen.getByPlaceholderText("Brief description for search engines (max 160 chars)...");

        // Initially 0/70 and 0/160
        expect(screen.getByText("0/70")).toBeInTheDocument();
        expect(screen.getByText("0/160")).toBeInTheDocument();

        // Type to title (under limit)
        fireEvent.change(metaTitleInput, { target: { value: "A short title" } }); // 13 chars
        expect(screen.getByText("13/70")).toHaveClass("text-muted-foreground");

        // Type a long title (over 70 limit but allowed by input up to 80, we want to see the warning color)
        const longTitle = "A very long title that exceeds the recommended 70 character limit for search engines";
        fireEvent.change(metaTitleInput, { target: { value: longTitle } });

        const countDisplay = screen.getByText(`${longTitle.length}/70`);
        expect(countDisplay).toBeInTheDocument();
        expect(countDisplay).toHaveClass("text-red-500");
    });

    it("saves new page and redirects to edit mode", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { id: "p1" } })
        });

        render(<PageEditor pageId="new" />);

        const titleInput = screen.getByPlaceholderText("About GalaPo");
        fireEvent.change(titleInput, { target: { value: "Test Page" } });

        const saveBtn = screen.getByText("Save Page");
        fireEvent.click(saveBtn);

        expect(global.fetch).toHaveBeenCalledWith("/api/admin/pages", expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("test-page") // Auto-slug
        }));

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith("/admin/pages/p1/edit");
            expect(screen.getByText("Saved!")).toBeInTheDocument();
        });
    });
});
