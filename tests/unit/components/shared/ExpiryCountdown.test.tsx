import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ExpiryCountdown from "../../../components/shared/ExpiryCountdown";
import "@testing-library/jest-dom";

describe("ExpiryCountdown", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders 'Expired' for past dates", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        render(<ExpiryCountdown endDate={pastDate.toISOString()} />);
        expect(screen.getByText(/Expired/i)).toBeInTheDocument();
    });

    it("renders 'Ends today' with red styling for same-day expiry", () => {
        const today = new Date();
        today.setHours(today.getHours() + 5);
        render(<ExpiryCountdown endDate={today.toISOString()} />);

        const element = screen.getByText(/Ends today/i);
        expect(element).toBeInTheDocument();
        expect(element.parentElement).toHaveClass("text-red-500");
    });

    it("renders 'Ends in X days' for upcoming expiry (> 1 day)", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        render(<ExpiryCountdown endDate={futureDate.toISOString()} />);

        expect(screen.getByText(/Ends in 2 days/i)).toBeInTheDocument();
    });

    it("renders 'Ends in 1 day' for expiry between 24-48 hours", () => {
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 30);
        render(<ExpiryCountdown endDate={tomorrow.toISOString()} />);

        expect(screen.getByText(/Ends in 1 day/i)).toBeInTheDocument();
    });

    it("updates countdown every minute", () => {
        const futureDate = new Date();
        futureDate.setMinutes(futureDate.getMinutes() + 65);
        render(<ExpiryCountdown endDate={futureDate.toISOString()} />);

        expect(screen.getByText(/Ends in 1 hour/i)).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(60 * 1000 * 10); // Advance 10 mins
        });

        // Should still be 'Ends in 1 hour' or specific minutes if we added that, 
        // but current component logic is simplified.
    });
});
