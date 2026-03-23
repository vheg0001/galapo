import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DateBadge from "@/components/shared/DateBadge";

describe("DateBadge", () => {
    it("renders month abbreviation and day number", () => {
        render(<DateBadge date="2026-01-15" />);

        expect(screen.getByText("JAN")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("today has special styling", () => {
        const today = new Date().toISOString().split("T")[0];
        const { container } = render(<DateBadge date={today} />);

        const badge = container.firstElementChild as HTMLElement;
        expect(badge).toHaveAttribute("data-today", "true");
        expect(badge.className).toContain("bg-primary");
    });

    it("handles different date formats", () => {
        const date = new Date("2026-02-20T00:00:00");
        render(<DateBadge date={date} />);

        expect(screen.getByText("FEB")).toBeInTheDocument();
        expect(screen.getByText("20")).toBeInTheDocument();
    });
});