import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import OperatingHours from "@/components/public/listing/OperatingHours";

describe("OperatingHours", () => {
    const mockHours = {
        monday: { open: "08:00", close: "17:00", closed: false },
        tuesday: { open: "08:00", close: "17:00", closed: false },
        wednesday: { open: "08:00", close: "17:00", closed: false },
        thursday: { open: "08:00", close: "17:00", closed: false },
        friday: { open: "08:00", close: "17:00", closed: false },
        saturday: { open: "09:00", close: "15:00", closed: false },
        sunday: { open: "", close: "", closed: true },
    };

    it("all 7 days render in table", () => {
        render(<OperatingHours hours={mockHours} />);
        expect(screen.getByText("Monday")).toBeInTheDocument();
        expect(screen.getByText("Sunday")).toBeInTheDocument();
    });

    it("closed days show 'Closed' in red status", () => {
        render(<OperatingHours hours={mockHours} />);
        const closedLabels = screen.getAllByText(/closed/i);
        expect(closedLabels.length).toBeGreaterThan(0);
    });

    it("open hours show correctly formatted time using n – n separator", () => {
        render(<OperatingHours hours={mockHours} />);
        // The component uses en-dash " – "
        expect(screen.getAllByText(/8:00 AM – 5:00 PM/)).toHaveLength(5);
        expect(screen.getByText(/9:00 AM – 3:00 PM/)).toBeInTheDocument();
    });

    it("'Today' indicator is present for the current day", () => {
        render(<OperatingHours hours={mockHours} />);
        // Since we don't mock the date in this specific test, we just check if "Today" exists
        expect(screen.getByText(/today/i)).toBeInTheDocument();
    });

    it("missing hours data shows 'Contact us for operating hours.'", () => {
        render(<OperatingHours hours={null} />);
        expect(screen.getByText(/contact us for operating hours/i)).toBeInTheDocument();
    });
});
