import { render, screen, fireEvent } from "@testing-library/react";
import PaymentProofUpload from "@/components/business/subscription/PaymentProofUpload";

describe("PaymentProofUpload", () => {
    it("renders reference number input and file upload zone", () => {
        const onFileSelect = vi.fn();
        const onReferenceChange = vi.fn();
        render(
            <PaymentProofUpload
                onFileSelect={onFileSelect}
                onReferenceChange={onReferenceChange}
                referenceNumber=""
            />
        );

        expect(screen.getByLabelText(/1\. Reference Number/i)).toBeInTheDocument();
        expect(screen.getByText(/Click to upload receipt/i)).toBeInTheDocument();
    });

    it("handles reference number change", () => {
        const onReferenceChange = vi.fn();
        render(
            <PaymentProofUpload
                onFileSelect={vi.fn()}
                onReferenceChange={onReferenceChange}
                referenceNumber=""
            />
        );

        const input = screen.getByPlaceholderText(/reference number/i);
        fireEvent.change(input, { target: { value: "REF123" } });
        expect(onReferenceChange).toHaveBeenCalledWith("REF123");
    });

    it("shows image preview when an image is selected", async () => {
        const onFileSelect = vi.fn();
        render(
            <PaymentProofUpload
                onFileSelect={onFileSelect}
                onReferenceChange={vi.fn()}
                referenceNumber=""
            />
        );

        const file = new File(["hello"], "receipt.png", { type: "image/png" });
        const input = screen.getByLabelText(/2\. Upload Proof of Payment/i) as HTMLInputElement;

        // Mock URL.createObjectURL
        global.URL.createObjectURL = vi.fn(() => "mock-url");

        fireEvent.change(input, { target: { files: [file] } });

        expect(onFileSelect).toHaveBeenCalledWith(file);
        expect(screen.getByText("receipt.png")).toBeInTheDocument();
        expect(screen.getByAltText("Payment proof preview")).toHaveAttribute("src", "mock-url");
    });

    it("shows PDF icon when a PDF is selected", () => {
        const onFileSelect = vi.fn();
        render(
            <PaymentProofUpload
                onFileSelect={onFileSelect}
                onReferenceChange={vi.fn()}
                referenceNumber=""
            />
        );

        const file = new File(["hello"], "receipt.pdf", { type: "application/pdf" });
        const input = screen.getByLabelText(/2\. Upload Proof of Payment/i) as HTMLInputElement;

        fireEvent.change(input, { target: { files: [file] } });

        expect(onFileSelect).toHaveBeenCalledWith(file);
        expect(screen.getByText("receipt.pdf")).toBeInTheDocument();
        expect(screen.getByText(/PDF Document selected/i)).toBeInTheDocument();
    });

    it("can clear selected file", () => {
        const onFileSelect = vi.fn();
        render(
            <PaymentProofUpload
                onFileSelect={onFileSelect}
                onReferenceChange={vi.fn()}
                referenceNumber=""
            />
        );

        const file = new File(["hello"], "receipt.png", { type: "image/png" });
        const input = screen.getByLabelText(/2\. Upload Proof of Payment/i) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        const clearBtn = screen.getByRole("button", { name: /clear selected file/i });
        fireEvent.click(clearBtn);

        expect(onFileSelect).toHaveBeenLastCalledWith(null);
        expect(screen.queryByText("receipt.png")).not.toBeInTheDocument();
    });

    it("displays error message if provided", () => {
        render(
            <PaymentProofUpload
                onFileSelect={vi.fn()}
                onReferenceChange={vi.fn()}
                referenceNumber=""
                error="File is too large"
            />
        );

        expect(screen.getByText("File is too large")).toBeInTheDocument();
    });
});
