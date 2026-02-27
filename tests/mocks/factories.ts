import {
    BusinessListing,
    Category,
    CategoryField,
    ListingFieldValue,
    User,
    Deal,
    Event,
    Subscription,
    Payment,
    Invoice,
    AdPlacement,
    Notification,
    BlogPost,
    City,
    Barangay,
    UserRole,
    ListingStatus,
    PlanType,
    SubscriptionStatus,
    PaymentStatus,
    FieldType,
    PlacementLocation,
    NotificationType
} from "@/lib/types";

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// ── Mock Factories ────────────────────────────────────────────────────────

export function createMockCity(overrides?: Partial<City>): City {
    return {
        id: generateId(),
        name: "Olongapo City",
        slug: "olongapo",
        province: "Zambales",
        region: "Central Luzon",
        is_active: true,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockBarangay(overrides?: Partial<Barangay>): Barangay {
    return {
        id: generateId(),
        city_id: generateId(),
        name: "Barretto",
        slug: "barretto",
        is_active: true,
        sort_order: 1,
        ...overrides,
    };
}

export function createMockUser(overrides?: Partial<User>): User {
    return {
        id: generateId(),
        email: "user@example.com",
        full_name: "Juan Dela Cruz",
        phone: "+639171234567",
        role: UserRole.BUSINESS_OWNER,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockCategory(overrides?: Partial<Category>): Category {
    return {
        id: generateId(),
        name: "Restaurants",
        slug: "restaurants",
        icon: "🍽️",
        parent_id: null,
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockCategoryField(overrides?: Partial<CategoryField>): CategoryField {
    return {
        id: generateId(),
        category_id: generateId(),
        subcategory_id: null,
        field_name: "cuisine_type",
        field_label: "Type of Cuisine",
        field_type: FieldType.SELECT,
        is_required: true,
        placeholder: "e.g., Filipino, Western",
        options: ["Filipino", "Western", "Asian Fusion"],
        sort_order: 1,
        is_active: true,
        ...overrides,
    };
}

export function createMockListing(overrides?: Partial<BusinessListing>): BusinessListing {
    return {
        id: generateId(),
        owner_id: generateId(),
        city_id: generateId(),
        barangay_id: generateId(),
        category_id: generateId(),
        subcategory_id: null,
        business_name: "Sample Restaurant Olongapo",
        slug: "sample-restaurant-olongapo",
        address: "123 Magsaysay Drive, Olongapo City",
        lat: 14.8386,
        lng: 120.2842,
        phone: "09171234567",
        email: "hello@samplerestaurant.com",
        website: "https://samplerestaurant.com",
        social_links: { facebook: "https://facebook.com/sample" },
        operating_hours: {
            monday: { open: "08:00", close: "17:00", closed: false },
            tuesday: { open: "08:00", close: "17:00", closed: false },
            wednesday: { open: "08:00", close: "17:00", closed: false },
            thursday: { open: "08:00", close: "17:00", closed: false },
            friday: { open: "08:00", close: "17:00", closed: false },
            saturday: { open: "09:00", close: "15:00", closed: false },
            sunday: { open: "", close: "", closed: true },
        },
        short_description: "The best local restaurant in Olongapo.",
        full_description: "Detailed description of the sample restaurant.",
        tags: ["food", "restaurant", "olongapo"],
        payment_methods: ["cash", "gcash"],
        logo_url: "https://placehold.co/400x400/png",
        status: ListingStatus.APPROVED,
        is_active: true,
        is_featured: false,
        is_premium: false,
        is_pre_populated: false,
        last_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockListingFieldValue(overrides?: Partial<ListingFieldValue>): ListingFieldValue {
    return {
        id: generateId(),
        listing_id: generateId(),
        field_id: generateId(),
        value: "Filipino",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockDeal(overrides?: Partial<Deal>): Deal {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    return {
        id: generateId(),
        listing_id: generateId(),
        title: "20% Off Lunch Menu",
        description: "Enjoy 20% off from 11am to 2pm.",
        image_url: "https://placehold.co/800x400/png",
        discount_text: "20% OFF",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockEvent(overrides?: Partial<Event>): Event {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 14);

    return {
        id: generateId(),
        listing_id: generateId(),
        title: "Grand Opening Celebration",
        slug: "grand-opening-celebration",
        description: "Join us for our grand opening!",
        image_url: "https://placehold.co/800x400/png",
        event_date: eventDate.toISOString(),
        start_time: "10:00",
        end_time: "18:00",
        venue: "Sample Restaurant",
        venue_address: "123 Magsaysay Drive",
        is_city_wide: false,
        is_featured: true,
        created_by: generateId(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockBlogPost(overrides?: Partial<BlogPost>): BlogPost {
    return {
        id: generateId(),
        title: "Top 10 Restaurants in Subic Bay",
        slug: "top-10-restaurants-subic-bay",
        content: "<p>Here are the best places to eat...</p>",
        excerpt: "Discover the culinary delights of Subic Bay.",
        featured_image_url: "https://placehold.co/1200x600/png",
        tags: ["food", "subic", "guide"],
        linked_listing_ids: [generateId(), generateId()],
        is_published: true,
        author_id: generateId(),
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockSubscription(overrides?: Partial<Subscription>): Subscription {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    return {
        id: generateId(),
        listing_id: generateId(),
        plan_type: PlanType.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount: 599,
        auto_renew: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockPayment(overrides?: Partial<Payment>): Payment {
    return {
        id: generateId(),
        subscription_id: generateId(),
        listing_id: generateId(),
        user_id: generateId(),
        amount: 599,
        payment_method: "gcash",
        payment_proof_url: "https://placehold.co/600x800/png",
        description: "Premium Plan - 1 Month",
        status: PaymentStatus.VERIFIED,
        verified_by: generateId(),
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockInvoice(overrides?: Partial<Invoice>): Invoice {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    return {
        id: generateId(),
        payment_id: generateId(),
        listing_id: generateId(),
        user_id: generateId(),
        invoice_number: `INV-GAL-${Date.now()}`,
        amount: 599,
        description: "Premium Subscription",
        items: [{ name: "Premium 1 Month", amount: 599 }],
        status: "paid",
        issued_at: new Date().toISOString(),
        due_date: dueDate.toISOString(),
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockAdPlacement(overrides?: Partial<AdPlacement>): AdPlacement {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    return {
        id: generateId(),
        title: "Homepage Top Banner Deal",
        image_url: "https://placehold.co/1200x120/png",
        target_url: "https://samplerestaurant.com",
        placement_location: PlacementLocation.HOMEPAGE_BANNER,
        listing_id: null,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        impressions: 1542,
        clicks: 34,
        is_active: true,
        is_adsense: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

export function createMockNotification(overrides?: Partial<Notification>): Notification {
    return {
        id: generateId(),
        user_id: generateId(),
        type: NotificationType.LISTING_APPROVED,
        title: "Listing Approved!",
        message: "Your business listing 'Sample Restaurant' is now active.",
        is_read: false,
        data: { listing_id: generateId() },
        created_at: new Date().toISOString(),
        ...overrides,
    };
}
