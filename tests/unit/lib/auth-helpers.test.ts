import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    validateEmail,
    validatePhone,
    validatePassword
} from "@/lib/auth-helpers";

describe("auth-helpers", () => {
    describe("validateEmail", () => {
        it("passes for valid emails", () => {
            expect(validateEmail("test@example.com")).toBe(true);
            expect(validateEmail("user.name@domain.co.uk")).toBe(true);
        });

        it("fails for invalid emails", () => {
            expect(validateEmail("plainstring")).toBe(false);
            expect(validateEmail("@missing-local.com")).toBe(false);
            expect(validateEmail("local@missing-domain")).toBe(false);
            expect(validateEmail("local@domain.")).toBe(false);
        });
    });

    describe("validatePhone", () => {
        it("passes for valid Philippine phone formats", () => {
            expect(validatePhone("09171234567")).toBe(true);
            expect(validatePhone("+639171234567")).toBe(true);
            expect(validatePhone("0917-123-4567")).toBe(true);
            expect(validatePhone("0917 123 4567")).toBe(true);
        });

        it("fails for invalid formats", () => {
            expect(validatePhone("1234567890")).toBe(false); // No 09 prefix
            expect(validatePhone("08171234567")).toBe(false); // Not a 09 number
            expect(validatePhone("+19171234567")).toBe(false); // US format
            expect(validatePhone("0917123456")).toBe(false); // Too short
            expect(validatePhone("091712345678")).toBe(false); // Too long
        });
    });

    describe("validatePassword", () => {
        it("returns weak for short passwords", () => {
            const result = validatePassword("abc");
            expect(result.isValid).toBe(false);
            expect(result.strength).toBe("weak");
            expect(result.message).toContain("at least 8 characters");
        });

        it("returns weak for simple passwords", () => {
            const result = validatePassword("abcdefgh");
            expect(result.isValid).toBe(false);
            expect(result.strength).toBe("weak");
            expect(result.message).toContain("too weak");
        });

        it("returns medium for better passwords", () => {
            const result = validatePassword("abc12345");
            expect(result.isValid).toBe(true);
            expect(result.strength).toBe("medium");
        });

        it("returns strong for complex passwords", () => {
            const result = validatePassword("Abc12345!");
            expect(result.isValid).toBe(true);
            expect(result.strength).toBe("strong");
        });
    });
});
