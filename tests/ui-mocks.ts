import * as React from "react";
import { vi } from "vitest";

// Global UI Mocks (using React.createElement for maximum compatibility)
vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => React.createElement("div", { "data-testid": "dropdown-menu" }, children),
    DropdownMenuTrigger: ({ children, asChild, ...props }: any) => React.createElement("button", { "data-testid": "dropdown-trigger", ...props }, children),
    DropdownMenuContent: ({ children }: any) => React.createElement("div", { "data-testid": "dropdown-content" }, children),
    DropdownMenuItem: ({ children, onSelect, asChild }: any) => 
        React.createElement("div", { onClick: onSelect, "data-testid": "dropdown-item" }, children),
    DropdownMenuSeparator: () => React.createElement("hr"),
    DropdownMenuLabel: ({ children }: any) => React.createElement("div", null, children),
}));

vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, className }: any) => React.createElement("a", { href, className }, children)
}));

vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => React.createElement("div", { className }, children),
    CardHeader: ({ children, className }: any) => React.createElement("div", { className }, children),
    CardTitle: ({ children, className }: any) => React.createElement("h2", { className }, children),
    CardContent: ({ children, className }: any) => React.createElement("div", { className }, children),
}));

vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: any) => React.createElement("div", null, children),
    DialogContent: ({ children }: any) => React.createElement("div", null, children),
    DialogHeader: ({ children }: any) => React.createElement("div", null, children),
    DialogTitle: ({ children }: any) => React.createElement("h2", null, children),
    DialogDescription: ({ children }: any) => React.createElement("p", null, children),
    DialogFooter: ({ children }: any) => React.createElement("div", null, children),
}));

vi.mock("@/components/ui/badge", () => ({
    Badge: ({ children, className }: any) => React.createElement("div", { "data-testid": "badge", className }, children),
}));

vi.mock("@/components/ui/label", () => ({
    Label: ({ children, htmlFor }: any) => React.createElement("label", { htmlFor }, children),
}));

vi.mock("@/components/ui/input", () => ({
    Input: (props: any) => React.createElement("input", { ...props }),
}));
