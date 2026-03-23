import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ExpiryCountdown from "@/components/shared/ExpiryCountdown";
import "@testing-library/jest-dom";

describe("ExpiryCountdown", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-11T12:00:00+08:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders nothing for expired deals", () => {
        const { container } = render(<ExpiryCountdown endDate="2026-03-10" />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders a live countdown for deals expiring later today", () => {
        vi.setSystemTime(new Date("2026-03-11T18:30:00+08:00"));
        render(<ExpiryCountdown endDate="2026-03-11" />);

        const element = screen.getByText(/EXPIRES:\s*05:29:59/i);
        expect(element).toBeInTheDocument();
        expect(element.closest("div")).toHaveClass("text-red-600");
    });

    it("counts down to the start date for upcoming deals", () => {
        vi.setSystemTime(new Date("2026-03-11T10:00:00+08:00"));
        render(<ExpiryCountdown startDate="2026-03-12" endDate="2026-03-15" />);

        expect(screen.getByText(/Starts in 14:00:00/i)).toBeInTheDocument();
    });

    it("renders 'Expires in X days' for multi-day expiry", () => {
        render(<ExpiryCountdown endDate="2026-03-14" />);

        expect(screen.getByText(/Expires in 3 days/i)).toBeInTheDocument();
    });

    it("treats date-only end dates as the end of the local day", () => {
        vi.setSystemTime(new Date("2026-03-12T23:30:00+08:00"));
        render(<ExpiryCountdown endDate="2026-03-12" />);

        expect(screen.getByText(/EXPIRES:\s*00:29:59/i)).toBeInTheDocument();
    });

    it("treats midnight timestamps with timezone offsets as all-day deal end dates", () => {
        vi.setSystemTime(new Date("2026-03-12T21:00:00+08:00"));
        render(<ExpiryCountdown endDate="2026-03-12T00:00:00+08:00" />);

        expect(screen.getByText(/EXPIRES:\s*02:59:59/i)).toBeInTheDocument();
    });

    it("updates the live countdown every second when less than a day remains", () => {
        vi.setSystemTime(new Date("2026-03-11T23:58:55+08:00"));
        render(<ExpiryCountdown endDate="2026-03-11" />);

        expect(screen.getByText(/EXPIRES:\s*00:01:04/i)).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText(/EXPIRES:\s*00:01:03/i)).toBeInTheDocument();
    });
});
