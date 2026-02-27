import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY } from "@/lib/constants";

// ── Tailwind classname merge ────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Slug Generator ──────────────────────────────────────

/**
 * Converts a text string into a URL-friendly slug.
 * @example generateSlug("Juan's Eatery & Bar") → "juans-eatery-and-bar"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ñ/g, "n")                // handle filipino nino
    .replace(/&/g, "and")
    .replace(/['']/g, "")              // remove apostrophes
    .replace(/[^\w\s-]/g, "")          // remove special chars
    .replace(/[\s_]+/g, "-")           // spaces/underscores → hyphens
    .replace(/-+/g, "-")              // collapse multiple hyphens
    .replace(/^-|-$/g, "");           // trim leading/trailing hyphens
}

// ── Currency Formatter ──────────────────────────────────

/**
 * Formats a number as Philippine Peso.
 * @example formatCurrency(1500) → "₱1,500.00"
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Date Formatter ──────────────────────────────────────

/**
 * Formats an ISO date string into a human-readable format.
 * @example formatDate("2026-02-27T14:00:00Z") → "Feb 27, 2026"
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats an ISO date string into a date + time format.
 * @example formatDateTime("2026-02-27T14:00:00Z") → "Feb 27, 2026, 2:00 PM"
 */
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Phone Formatter ─────────────────────────────────────

/**
 * Formats a Philippine phone number.
 * @example formatPhone("09171234567") → "+63 917 123 4567"
 */
export function formatPhone(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle 11-digit PH mobile (09xx...)
  if (digits.length === 11 && digits.startsWith("0")) {
    const country = "+63";
    const area = digits.slice(1, 4);
    const mid = digits.slice(4, 7);
    const last = digits.slice(7);
    return `${country} ${area} ${mid} ${last}`;
  }

  // Handle 12-digit with country code (639xx...)
  if (digits.length === 12 && digits.startsWith("63")) {
    const area = digits.slice(2, 5);
    const mid = digits.slice(5, 8);
    const last = digits.slice(8);
    return `+63 ${area} ${mid} ${last}`;
  }

  // Fallback — return as-is
  return phone;
}

// ── Invoice Number Generator ────────────────────────────

/**
 * Generates a unique invoice number.
 * @example generateInvoiceNumber() → "GP-20260227-A1B2C3"
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GP-${y}${m}${d}-${random}`;
}

// ── Text Truncation ─────────────────────────────────────

/**
 * Truncates text to a given length, appending "…" if exceeded.
 * @example truncateText("Hello World", 5) → "Hello…"
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "…";
}

// ── Relative Time ───────────────────────────────────────

/**
 * Returns a human-readable relative time string.
 * @example getRelativeTime("2026-02-26T14:00:00Z") → "1 day ago"
 */
export function getRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(date);
}
