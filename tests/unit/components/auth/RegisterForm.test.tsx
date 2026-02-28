import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterForm from "@/components/auth/RegisterForm";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

const mockRegister = vi.fn();

describe("RegisterForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            register: mockRegister,
            isLoading: false,
        });
    });

    it("renders all form fields", () => {
        render(<RegisterForm />);
        expect(screen.getByLabelText(/full name/i)).toBeDefined();
        expect(screen.getByLabelText(/email address/i)).toBeDefined();
        expect(screen.getByLabelText(/phone number/i)).toBeDefined();
        expect(screen.getByLabelText(/^password/i)).toBeDefined();
        expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
        expect(screen.getByRole("checkbox", { name: /i agree/i })).toBeDefined();
        expect(screen.getByRole("button", { name: /create account/i })).toBeDefined();
    });

    it("shows error for invalid email format", async () => {
        render(<RegisterForm />);
        const emailInput = screen.getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.blur(emailInput);

        await waitFor(() => {
            expect(screen.getByText(/please enter a valid email address/i)).toBeDefined();
        });
    });

    it("shows error for non-PH phone format", async () => {
        render(<RegisterForm />);
        const phoneInput = screen.getByLabelText(/phone number/i);
        fireEvent.change(phoneInput, { target: { value: "1234567890" } });
        fireEvent.blur(phoneInput);

        await waitFor(() => {
            expect(screen.getByText(/enter a valid ph number/i)).toBeDefined();
        });
    });

    it("shows password mismatch error", async () => {
        render(<RegisterForm />);
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "Password123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password1234!" } });
        fireEvent.blur(screen.getByLabelText(/confirm password/i));

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeDefined();
        });
    });

    it("disables submit button when terms not checked", () => {
        render(<RegisterForm />);
        const submitButton = screen.getByRole("button", { name: /create account/i });
        expect(submitButton).toBeDisabled();
    });

    it("submits successfully with valid data", async () => {
        mockRegister.mockResolvedValue({ error: null });
        render(<RegisterForm />);

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Juan Dela Cruz" } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "juan@example.com" } });
        fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "09171234567" } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "StrongPass123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "StrongPass123!" } });
        fireEvent.click(screen.getByRole("checkbox", { name: /i agree/i }));

        const submitButton = screen.getByRole("button", { name: /create account/i });
        expect(submitButton).not.toBeDisabled();
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(
                "juan@example.com",
                "StrongPass123!",
                "Juan Dela Cruz",
                "09171234567",
            );
        });
    });
});
