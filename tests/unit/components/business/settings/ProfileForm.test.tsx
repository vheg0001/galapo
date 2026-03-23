import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileForm from "@/components/business/settings/ProfileForm";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    createBrowserSupabaseClient: vi.fn(() => ({
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: { id: "1", full_name: "Updated Name", phone: "09171234567" }, error: null })),
                    })),
                })),
            })),
        })),
    })),
}));

describe("ProfileForm", () => {
    const mockProfile = {
        id: "1",
        email: "test@example.com",
        full_name: "John Doe",
        phone: "09123456789",
    };

    const mockSetProfile = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            profile: mockProfile,
            setProfile: mockSetProfile,
        });
    });

    test("renders pre-filled form with current profile data", () => {
        render(<ProfileForm />);

        expect(screen.getByLabelText(/Full Name/i)).toHaveValue("John Doe");
        expect(screen.getByLabelText(/Email/i)).toHaveValue("test@example.com");
        expect(screen.getByLabelText(/Phone Number/i)).toHaveValue("09123456789");
    });

    test("email field is read-only", () => {
        render(<ProfileForm />);
        const emailInput = screen.getByLabelText(/Email/i);
        expect(emailInput).toHaveAttribute("readonly");
    });

    test("updates fields on change", () => {
        render(<ProfileForm />);

        const nameInput = screen.getByLabelText(/Full Name/i);
        fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
        expect(nameInput).toHaveValue("Jane Smith");

        const phoneInput = screen.getByLabelText(/Phone Number/i);
        fireEvent.change(phoneInput, { target: { value: "09171112222" } });
        expect(phoneInput).toHaveValue("09171112222");
    });

    test("shows success message on submit", async () => {
        render(<ProfileForm />);

        fireEvent.click(screen.getByText("Save Changes"));

        await waitFor(() => {
            expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
        });

        expect(mockSetProfile).toHaveBeenCalled();
    });

    test("validates required fields", () => {
        render(<ProfileForm />);
        const nameInput = screen.getByLabelText(/Full Name/i);
        fireEvent.change(nameInput, { target: { value: "" } });

        // HTML5 validation is hard to test directly with RTL without a browser
        // but we can check if 'required' attribute exists
        expect(nameInput).toBeRequired();
    });
});
