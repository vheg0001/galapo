// ──────────────────────────────────────────────────────────
// GalaPo — App Constants
// ──────────────────────────────────────────────────────────

export const APP_NAME = "GalaPo" as const;
export const APP_TAGLINE = "Discover Olongapo" as const;
export const APP_DESCRIPTION =
    "Your ultimate city business directory for Olongapo City, Philippines. Discover local businesses, restaurants, services, and more." as const;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const DEFAULT_CITY = "olongapo" as const;
export const CURRENCY = "₱" as const;
export const ITEMS_PER_PAGE = 20;

// Theme Colors (keep in sync with globals.css)
export const THEME = {
    primary: "#1B2A4A",
    secondary: "#FF6B35",
    background: "#FFFFFF",
    surface: "#F5F7FA",
    textPrimary: "#1A1A2E",
    textSecondary: "#6B7280",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    border: "#E5E7EB",
} as const;

// Navigation links
export const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: "Deals", href: "/deals" },
    { label: "Events", href: "/events" },
    { label: "Blog", href: "/blog" },
] as const;

// Footer links
export const FOOTER_QUICK_LINKS = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: "Deals", href: "/deals" },
    { label: "Events", href: "/events" },
    { label: "Blog", href: "/blog" },
] as const;

export const FOOTER_BUSINESS_LINKS = [
    { label: "List Your Business", href: "/register" },
    { label: "Business Login", href: "/login" },
    { label: "Pricing", href: "/pricing" },
    { label: "Advertise", href: "/advertise" },
] as const;

export const FOOTER_LEGAL_LINKS = [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "FAQ", href: "/faq" },
] as const;

// Map (Olongapo City center)
export const MAP_CENTER = {
    lat: 14.8292,
    lng: 120.2827,
    zoom: 14,
} as const;

// Popular search tags for homepage
export const POPULAR_TAGS = [
    "Restaurants",
    "Cafés",
    "Hotels",
    "Gyms",
    "Clinics",
    "Salons",
] as const;

// Pagination
export const PAGINATION = {
    defaultPage: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    maxPageButtons: 5,
} as const;
