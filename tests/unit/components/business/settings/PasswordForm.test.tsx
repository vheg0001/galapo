import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordForm from "@/components/business/settings/PasswordForm";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

describe("PasswordForm", () => {
    const mockUpdatePassword = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            updatePassword: mockUpdatePassword,
        });
    });

    test("renders all password fields", () => {
        render(<PasswordForm />);

        expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
        expect(screen.getByLabelText("New Password")).toBeInTheDocument();
        expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    });

    test("shows strength indicator when typing new password", () => {
        render(<PasswordForm />);

        const newPassInput = screen.getByLabelText("New Password");
        // Needs 8 chars to show "Weak" (score 1)
        fireEvent.change(newPassInput, { target: { value: "password" } });
        expect(screen.getByText(/Strength:/i)).toBeInTheDocument();
        expect(screen.getByText("Weak")).toBeInTheDocument();

        // Needs uppercase, number, and special for "Strong" (score 4)
        fireEvent.change(newPassInput, { target: { value: "StrongPass123!" } });
        expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    test("shows error if passwords do not match", async () => {
        render(<PasswordForm />);

        fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "oldpassword" } });
        fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } });
        fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "Different123!" } });

        fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

        await waitFor(() => {
            expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
        });
    });

    test("calls updatePassword on valid submit", async () => {
        mockUpdatePassword.mockResolvedValue({ error: null });
        render(<PasswordForm />);

        fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "oldpassword" } });
        fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewPass123!" } });
        fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "NewPass123!" } });

        fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

        await waitFor(() => {
            expect(mockUpdatePassword).toHaveBeenCalledWith("NewPass123!");
            expect(screen.getByText(/Password updated successfully/i)).toBeInTheDocument();
        });
    });

    test("clears form on successful update", async () => {
        mockUpdatePassword.mockResolvedValue({ error: null });
        render(<PasswordForm />);

        const currentInput = screen.getByLabelText("Current Password");
        fireEvent.change(currentInput, { target: { value: "old" } });
        fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Strong123!" } });
        fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "Strong123!" } });

        fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

        await waitFor(() => {
            expect(currentInput).toHaveValue("");
        });
    });
});
