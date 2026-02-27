// ──────────────────────────────────────────────────────────
// GalaPo — TypeScript Type Definitions
// ──────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum UserRole {
    SUPER_ADMIN = "super_admin",
    BUSINESS_OWNER = "business_owner",
}

export enum ListingStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CLAIMED_PENDING = "claimed_pending",
}

export enum FieldType {
    TEXT = "text",
    TEXTAREA = "textarea",
    NUMBER = "number",
    CURRENCY = "currency",
    BOOLEAN = "boolean",
    SELECT = "select",
    MULTI_SELECT = "multi_select",
    URL = "url",
    PHONE = "phone",
    EMAIL = "email",
    IMAGE_GALLERY = "image_gallery",
    MENU_ITEMS = "menu_items",
    TIME_RANGE = "time_range",
    JSON = "json",
}

export enum PlanType {
    FREE = "free",
    FEATURED = "featured",
    PREMIUM = "premium",
}

export enum SubscriptionStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    PENDING_PAYMENT = "pending_payment",
    CANCELLED = "cancelled",
}

export enum PaymentStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    REJECTED = "rejected",
}

export enum PlacementLocation {
    HOMEPAGE_BANNER = "homepage_banner",
    SEARCH_SIDEBAR = "search_sidebar",
    SEARCH_INLINE = "search_inline",
    LISTING_BANNER = "listing_banner",
    LISTING_SIDEBAR = "listing_sidebar",
    CATEGORY_BANNER = "category_banner",
    BLOG_INLINE = "blog_inline",
    BLOG_SIDEBAR = "blog_sidebar",
}

export enum AnnualCheckStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    NO_RESPONSE = "no_response",
    DEACTIVATED = "deactivated",
}

export enum NotificationType {
    LISTING_APPROVED = "listing_approved",
    LISTING_REJECTED = "listing_rejected",
    CLAIM_APPROVED = "claim_approved",
    CLAIM_REJECTED = "claim_rejected",
    SUBSCRIPTION_EXPIRING = "subscription_expiring",
    PREMIUM_EXPIRING = "premium_expiring",
    ANNUAL_CHECK = "annual_check",
    ANNUAL_CHECK_WARNING = "annual_check_warning",
    LISTING_DEACTIVATED = "listing_deactivated",
    PAYMENT_CONFIRMED = "payment_confirmed",
    PAYMENT_REJECTED = "payment_rejected",
    NEW_LISTING_SUBMITTED = "new_listing_submitted",
    NEW_CLAIM_REQUEST = "new_claim_request",
    NEW_PAYMENT_UPLOADED = "new_payment_uploaded",
    ANNUAL_CHECK_FLAGGED = "annual_check_flagged",
    ANNUAL_CHECK_NO_RESPONSE = "annual_check_no_response",
}

// ═══════════════════════════════════════════════════════════
// ENTITY INTERFACES
// ═══════════════════════════════════════════════════════════

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole;
    avatar_url?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface City {
    id: string;
    name: string;
    slug: string;
    province: string;
    region: string;
    is_active: boolean;
    created_at: string;
}

export interface Barangay {
    id: string;
    city_id: string;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon: string;
    parent_id: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export interface CategoryField {
    id: string;
    category_id: string;
    subcategory_id: string | null;
    field_name: string;
    field_label: string;
    field_type: FieldType;
    is_required: boolean;
    placeholder: string | null;
    help_text?: string | null;
    options: any | null; // JSONB
    validation_rules?: any | null; // JSONB
    sort_order: number;
    is_active: boolean;
}

export interface BusinessListing {
    id: string;
    owner_id: string | null;
    city_id: string;
    barangay_id: string | null;
    category_id: string;
    subcategory_id: string | null;
    business_name: string;
    slug: string;
    address: string;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    phone_secondary?: string | null;
    email: string | null;
    website: string | null;
    social_links: SocialLinks | null;
    operating_hours: OperatingHours | null;
    short_description: string;
    full_description: string | null;
    tags: string[];
    payment_methods: string[];
    logo_url: string | null;
    status: ListingStatus;
    is_active: boolean;
    is_featured: boolean;
    is_premium: boolean;
    is_pre_populated: boolean;
    claim_proof_url?: string | null;
    claimed_at?: string | null;
    rejection_reason?: string | null;
    last_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ListingImage {
    id: string;
    listing_id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    created_at: string;
}

export interface ListingFieldValue {
    id: string;
    listing_id: string;
    field_id: string;
    value: any; // JSONB
    created_at: string;
    updated_at: string;
}

export interface Deal {
    id: string;
    listing_id: string;
    title: string;
    description: string;
    image_url: string | null;
    discount_text: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
}

export interface Event {
    id: string;
    listing_id: string | null;
    title: string;
    slug: string;
    description: string;
    image_url: string | null;
    event_date: string;
    start_time: string;
    end_time: string | null;
    venue: string | null;
    venue_address: string;
    is_city_wide: boolean;
    is_featured: boolean;
    created_by: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    featured_image_url: string | null;
    tags: string[];
    linked_listing_ids: string[];
    is_published: boolean;
    meta_title?: string | null;
    meta_description?: string | null;
    author_id: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    listing_id: string;
    plan_type: PlanType;
    status: SubscriptionStatus;
    start_date: string;
    end_date: string;
    amount: number;
    auto_renew: boolean;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    subscription_id: string | null;
    listing_id: string;
    user_id: string;
    amount: number;
    payment_method: string;
    payment_proof_url: string | null;
    reference_number?: string | null;
    description: string;
    status: PaymentStatus;
    verified_by: string | null;
    verified_at: string | null;
    rejection_reason?: string | null;
    created_at: string;
}

export interface Invoice {
    id: string;
    payment_id: string;
    listing_id: string;
    user_id: string;
    invoice_number: string;
    amount: number;
    description: string;
    items: any; // JSONB
    issued_at: string;
    due_date: string;
    status: string; // 'draft' | 'issued' | 'paid'
    created_at: string;
}

export interface AdPlacement {
    id: string;
    title: string;
    image_url: string | null;
    target_url: string;
    placement_location: PlacementLocation;
    listing_id: string | null;
    advertiser_id?: string | null;
    start_date: string;
    end_date: string;
    impressions: number;
    clicks: number;
    is_active: boolean;
    is_adsense: boolean;
    adsense_slot_id?: string | null;
    cost?: number | null;
    payment_id?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    data: Record<string, unknown> | null;
    created_at: string;
}

export interface StaticPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    meta_title: string | null;
    meta_description: string | null;
    is_published: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface SiteSettings {
    id: string;
    key: string;
    value: any; // JSONB
    description?: string | null;
    updated_at: string;
}

export interface AnnualCheck {
    id: string;
    listing_id: string;
    check_date: string;
    response_deadline: string;
    status: AnnualCheckStatus;
    responded_at: string | null;
    deactivated_at: string | null;
    created_at: string;
}

export interface ReactivationFee {
    id: string;
    listing_id: string;
    amount: number;
    payment_id: string | null;
    status: string; // 'pending' | 'paid' | 'waived'
    created_at: string;
}

export interface TopSearchPlacement {
    id: string;
    listing_id: string;
    category_id: string;
    subcategory_id: string | null;
    start_date: string;
    end_date: string;
    position: number;
    payment_id: string;
    is_active: boolean;
    created_at: string;
}

export interface CsvImportLog {
    id: string;
    file_name: string;
    category_id: string;
    subcategory_id: string | null;
    total_rows: number;
    successful_rows: number;
    failed_rows: number;
    error_log: any | null; // JSONB
    imported_by: string;
    created_at: string;
}

// ═══════════════════════════════════════════════════════════
// NESTED / UTILITY TYPES
// ═══════════════════════════════════════════════════════════

export interface SocialLinks {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    [key: string]: string | undefined;
}

export interface DayHours {
    open: string;
    close: string;
    closed: boolean;
}

export type OperatingHours = Record<
    "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
    DayHours
>;

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface SearchFilters {
    query: string;
    categoryId?: string;
    barangay?: string;
    priceRange?: number[];
    status?: ListingStatus;
    isFeatured?: boolean;
    isPremium?: boolean;
    sortBy: SortOption;
    page: number;
    limit: number;
}

export type SortOption =
    | "relevance"
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc";

