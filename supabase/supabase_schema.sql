-- ============================================================================
-- GalaPo City Directory — Initial Schema Setup
-- Run this entire script in the Supabase SQL Editor
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ENUM TYPES
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('super_admin', 'business_owner');
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'claimed_pending');
CREATE TYPE plan_type AS ENUM ('free', 'featured', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending_payment', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE payment_method AS ENUM ('gcash', 'bank_transfer');
CREATE TYPE field_type AS ENUM (
    'text', 'textarea', 'number', 'currency', 'boolean', 'select', 
    'multi_select', 'url', 'phone', 'email', 'image_gallery', 
    'menu_items', 'time_range', 'json'
);
CREATE TYPE placement_location AS ENUM (
    'homepage_banner', 'search_sidebar', 'search_inline', 
    'listing_banner', 'listing_sidebar', 'category_banner', 
    'blog_inline', 'blog_sidebar'
);
CREATE TYPE annual_check_status AS ENUM ('pending', 'confirmed', 'no_response', 'deactivated');
CREATE TYPE notification_type AS ENUM (
    'listing_approved', 'listing_rejected', 'claim_approved', 'claim_rejected', 
    'subscription_expiring', 'premium_expiring', 'annual_check', 'annual_check_warning', 
    'listing_deactivated', 'payment_confirmed', 'payment_rejected', 'new_listing_submitted', 
    'new_claim_request', 'new_payment_uploaded', 'annual_check_flagged', 'annual_check_no_response'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLES (in dependency order)
-- ────────────────────────────────────────────────────────────────────────────

-- PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'business_owner'::user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CITIES
CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    province TEXT NOT NULL,
    region TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BARANGAYS
CREATE TABLE public.barangays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    UNIQUE(city_id, slug)
);

-- CATEGORIES
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CATEGORY_FIELDS
CREATE TABLE public.category_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type field_type NOT NULL,
    is_required BOOLEAN DEFAULT FALSE NOT NULL,
    placeholder TEXT,
    help_text TEXT,
    options JSONB,
    validation_rules JSONB,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- LISTINGS
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
    barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    phone TEXT,
    phone_secondary TEXT,
    email TEXT,
    website TEXT,
    social_links JSONB,
    operating_hours JSONB,
    short_description VARCHAR(160) NOT NULL,
    full_description TEXT,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    payment_methods TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    logo_url TEXT,
    status listing_status DEFAULT 'pending'::listing_status NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    is_pre_populated BOOLEAN DEFAULT FALSE NOT NULL,
    claim_proof_url TEXT,
    claimed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- LISTING_IMAGES
CREATE TABLE public.listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- LISTING_FIELD_VALUES
CREATE TABLE public.listing_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.category_fields(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(listing_id, field_id)
);

-- DEALS
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    discount_text TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- EVENTS
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    venue TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    is_city_wide BOOLEAN DEFAULT FALSE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BLOG_POSTS
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(300),
    featured_image_url TEXT,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    linked_listing_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL,
    status subscription_status NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_proof_url TEXT NOT NULL,
    reference_number TEXT,
    description TEXT NOT NULL,
    status payment_status DEFAULT 'pending'::payment_status NOT NULL,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INVOICES
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    items JSONB NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'issued', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AD_PLACEMENTS
CREATE TABLE public.ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    image_url TEXT,
    target_url TEXT NOT NULL,
    placement_location placement_location NOT NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    advertiser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0 NOT NULL,
    clicks INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_adsense BOOLEAN DEFAULT FALSE NOT NULL,
    adsense_slot_id TEXT,
    cost DECIMAL(10,2),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STATIC_PAGES
CREATE TABLE public.static_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SITE_SETTINGS
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ANNUAL_CHECKS
CREATE TABLE public.annual_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    check_date DATE NOT NULL,
    response_deadline DATE NOT NULL,
    status annual_check_status DEFAULT 'pending'::annual_check_status NOT NULL,
    responded_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- REACTIVATION_FEES
CREATE TABLE public.reactivation_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'paid', 'waived')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TOP_SEARCH_PLACEMENTS
CREATE TABLE public.top_search_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    position INTEGER NOT NULL CHECK (position IN (1, 2, 3)),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CSV_IMPORT_LOGS
CREATE TABLE public.csv_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    total_rows INTEGER NOT NULL,
    successful_rows INTEGER NOT NULL,
    failed_rows INTEGER NOT NULL,
    error_log JSONB,
    imported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_listings_slug ON public.listings(slug);
CREATE INDEX idx_listings_city_category ON public.listings(city_id, category_id, subcategory_id);
CREATE INDEX idx_listings_barangay ON public.listings(barangay_id);
CREATE INDEX idx_listings_status_active ON public.listings(status, is_active);
CREATE INDEX idx_listings_featured_premium ON public.listings(is_featured, is_premium);
CREATE INDEX idx_listings_tags ON public.listings USING GIN (tags);
CREATE INDEX idx_listings_business_name_trgm ON public.listings USING GIST (business_name gist_trgm_ops);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

CREATE INDEX idx_events_date ON public.events(event_date, is_active);
CREATE INDEX idx_deals_dates ON public.deals(end_date, is_active);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug) WHERE is_published = true;

CREATE INDEX idx_subscriptions_listing ON public.subscriptions(listing_id, status, end_date);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_ad_placements_location ON public.ad_placements(placement_location, is_active, start_date, end_date);
CREATE INDEX idx_annual_checks_listing ON public.annual_checks(listing_id, status);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactivation_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_search_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_logs ENABLE ROW LEVEL SECURITY;

-- Utility check for super_admin
-- Note: Requires `plpgsql`
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Profiles are readable by owner and super admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR is_super_admin());
CREATE POLICY "Profiles are updatable by owner and super admin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR is_super_admin());

-- LISTINGS
CREATE POLICY "Approved listings are public" ON public.listings
    FOR SELECT USING (status = 'approved' AND is_active = true);
CREATE POLICY "Owners can see their own listings" ON public.listings
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Super admins see all listings" ON public.listings
    FOR ALL USING (is_super_admin());
CREATE POLICY "Owners can insert their own listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own listings" ON public.listings
    FOR DELETE USING (auth.uid() = owner_id);

-- LISTING_IMAGES
CREATE POLICY "Images of public listings are public" ON public.listing_images
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND status = 'approved' AND is_active = true));
CREATE POLICY "Owners can CRUD images" ON public.listing_images
    FOR ALL USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_images.listing_id AND owner_id = auth.uid()) OR is_super_admin());

-- LISTING_FIELD_VALUES
CREATE POLICY "Field values of public listings are public" ON public.listing_field_values
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND status = 'approved' AND is_active = true));
CREATE POLICY "Owners can CRUD field values" ON public.listing_field_values
    FOR ALL USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_field_values.listing_id AND owner_id = auth.uid()) OR is_super_admin());

-- CATEGORIES, BARANGAYS, CITIES, CATEGORY_FIELDS
CREATE POLICY "Read active" ON public.categories FOR SELECT USING (is_active = true OR is_super_admin());
CREATE POLICY "Admin CRUD" ON public.categories FOR ALL USING (is_super_admin());

CREATE POLICY "Read active" ON public.barangays FOR SELECT USING (is_active = true OR is_super_admin());
CREATE POLICY "Admin CRUD" ON public.barangays FOR ALL USING (is_super_admin());

CREATE POLICY "Read active" ON public.cities FOR SELECT USING (is_active = true OR is_super_admin());
CREATE POLICY "Admin CRUD" ON public.cities FOR ALL USING (is_super_admin());

CREATE POLICY "Read active" ON public.category_fields FOR SELECT USING (is_active = true OR is_super_admin());
CREATE POLICY "Admin CRUD" ON public.category_fields FOR ALL USING (is_super_admin());

-- DEALS
CREATE POLICY "Public deals" ON public.deals
    FOR SELECT USING (is_active = true);
CREATE POLICY "Owner deals" ON public.deals
    FOR ALL USING (EXISTS (SELECT 1 FROM public.listings WHERE id = deals.listing_id AND owner_id = auth.uid()) OR is_super_admin());

-- EVENTS
CREATE POLICY "Public events" ON public.events
    FOR SELECT USING (is_active = true);
CREATE POLICY "Owner events" ON public.events
    FOR ALL USING (created_by = auth.uid() OR is_super_admin());

-- BLOG_POSTS
CREATE POLICY "Public posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);
CREATE POLICY "Admin posts" ON public.blog_posts
    FOR ALL USING (is_super_admin());

-- SUBSCRIPTIONS
CREATE POLICY "Owner subs" ON public.subscriptions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings WHERE id = subscriptions.listing_id AND owner_id = auth.uid()));
CREATE POLICY "Admin subs" ON public.subscriptions
    FOR ALL USING (is_super_admin());

-- PAYMENTS & INVOICES
CREATE POLICY "Owner payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owner insert payments" ON public.payments
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin payments" ON public.payments
    FOR ALL USING (is_super_admin());

CREATE POLICY "Owner invoices" ON public.invoices
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin invoices" ON public.invoices
    FOR ALL USING (is_super_admin());

-- AD_PLACEMENTS, STATIC_PAGES, SITE_SETTINGS
CREATE POLICY "Public ad placements" ON public.ad_placements FOR SELECT USING (is_active = true);
CREATE POLICY "Admin ad placements" ON public.ad_placements FOR ALL USING (is_super_admin());

CREATE POLICY "Public static pages" ON public.static_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admin static pages" ON public.static_pages FOR ALL USING (is_super_admin());

CREATE POLICY "Public site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin site settings" ON public.site_settings FOR ALL USING (is_super_admin());

-- ANNUAL_CHECKS & OTHERS
CREATE POLICY "Owner annual checks" ON public.annual_checks
    FOR ALL USING (EXISTS (SELECT 1 FROM public.listings WHERE id = annual_checks.listing_id AND owner_id = auth.uid()) OR is_super_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 6. FUNCTIONS & TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at_trigger
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    ', t);
  END LOOP;
END;
$$;

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'business_owner'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment ad impression tracking
CREATE OR REPLACE FUNCTION increment_ad_impression(ad_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.ad_placements SET impressions = impressions + 1 WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment ad click tracking
CREATE OR REPLACE FUNCTION increment_ad_click(ad_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.ad_placements SET clicks = clicks + 1 WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────────────────────
-- 7. SEED INITIAL DATA
-- ────────────────────────────────────────────────────────────────────────────

-- Seed City
INSERT INTO public.cities (id, name, slug, province, region) 
VALUES ('c0000000-0000-0000-0000-000000000001', 'Olongapo City', 'olongapo', 'Zambales', 'Central Luzon')
ON CONFLICT (slug) DO NOTHING;

-- Seed Settings
INSERT INTO public.site_settings (key, value, description) VALUES
    ('site_name', '"GalaPo"', 'Site Name'),
    ('site_tagline', '"Discover Olongapo"', 'Site Tagline'),
    ('contact_email', '"admin@galapo.com"', 'Admin Contact Email'),
    ('gcash_number', '"09171234567"', 'Official GCash Number for payments'),
    ('bank_details', '{"bank": "BPI", "account_name": "GalaPo Directory", "account_number": "1234 5678 90"}', 'Bank Transfer details'),
    ('reactivation_fee_amount', '500', 'Fee to reactivate a deactivated listing in PHP'),
    ('featured_listing_monthly_price', '299', 'Featured label subscription price in PHP'),
    ('premium_listing_monthly_price', '599', 'Premium listing features subscription price in PHP'),
    ('top_search_monthly_price', '999', 'Top of search results placement price in PHP'),
    ('ad_placement_monthly_price', '1499', 'Standard banner ad placement price in PHP'),
    ('subscription_expiry_warning_days', '7', 'Days before expiry to send reminder'),
    ('annual_check_response_days', '7', 'Days given to business owner to confirm their listing')
ON CONFLICT (key) DO NOTHING;

-- Seed Static Pages
INSERT INTO public.static_pages (title, slug, content) VALUES
    ('About Us', 'about', '<p>Welcome to GalaPo, Olongapo City''s premier business directory.</p>'),
    ('Contact Us', 'contact', '<p>Get in touch with the GalaPo team.</p>'),
    ('Terms & Conditions', 'terms', '<p>Terms and conditions for using GalaPo.</p>'),
    ('Privacy Policy', 'privacy', '<p>How we handle your data.</p>'),
    ('FAQ', 'faq', '<p>Frequently asked questions.</p>'),
    ('Advertise With Us', 'advertise', '<p>Learn about our advertising options.</p>')
ON CONFLICT (slug) DO NOTHING;

-- Seed Categories & Subcategories
DO $$
DECLARE
    -- Main category IDs
    cat_food UUID;
    cat_shop UUID;
    cat_health UUID;
    cat_serv UUID;
    cat_auto UUID;
    cat_edu UUID;
    cat_accom UUID;
    cat_gov UUID;
    cat_real UUID;
    cat_trans UUID;
    cat_ent UUID;
    cat_rel UUID;
    cat_ind UUID;
    cat_home UUID;
BEGIN
    -- 1. FOOD & DINING
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Food & Dining', 'food-and-dining', '🍽️', 10) RETURNING id INTO cat_food;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Restaurants', 'restaurants', cat_food),
        ('Cafés & Coffee Shops', 'cafes-and-coffee-shops', cat_food),
        ('Bakeries & Pastry Shops', 'bakeries', cat_food),
        ('Street Food & Food Stalls', 'street-food', cat_food),
        ('Bars & Nightlife', 'bars-nightlife', cat_food),
        ('Catering Services', 'catering', cat_food),
        ('Food Trucks', 'food-trucks', cat_food);
        
    -- Note: Because sub-sub-categories are required for 'Restaurants', we inject them too
    DECLARE 
        subcat_resto UUID;
    BEGIN
        SELECT id INTO subcat_resto FROM public.categories WHERE slug = 'restaurants';
        INSERT INTO public.categories (name, slug, parent_id) VALUES
            ('Filipino Cuisine', 'filipino-cuisine', subcat_resto),
            ('Chinese/Japanese/Korean', 'asian-cuisine', subcat_resto),
            ('American/Western', 'western-cuisine', subcat_resto),
            ('Seafood', 'seafood', subcat_resto),
            ('Fast Food', 'fast-food', subcat_resto),
            ('Fine Dining', 'fine-dining', subcat_resto),
            ('Buffet', 'buffet', subcat_resto);
    END;

    -- 2. SHOPPING & RETAIL
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Shopping & Retail', 'shopping-and-retail', '🛍️', 20) RETURNING id INTO cat_shop;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Malls & Department Stores', 'malls', cat_shop),
        ('Grocery & Supermarkets', 'groceries', cat_shop),
        ('Clothing & Fashion', 'clothing-fashion', cat_shop),
        ('Electronics & Gadgets', 'electronics-gadgets', cat_shop),
        ('Hardware & Construction', 'hardware-construction', cat_shop),
        ('Furniture & Home Decor', 'furniture-home-decor', cat_shop),
        ('Pet Shops & Supplies', 'pet-shops-supplies', cat_shop),
        ('Bookstores & Stationery', 'bookstores', cat_shop),
        ('Jewelry & Accessories', 'jewelry-accessories', cat_shop),
        ('Thrift & Ukay-Ukay Shops', 'thrift-shops', cat_shop),
        ('Market / Palengke', 'market-palengke', cat_shop);

    -- 3. HEALTH & WELLNESS
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Health & Wellness', 'health-and-wellness', '🏥', 30) RETURNING id INTO cat_health;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Hospitals', 'hospitals', cat_health),
        ('Clinics (General / Specialist)', 'clinics', cat_health),
        ('Pharmacies / Drugstores', 'pharmacies', cat_health),
        ('Gym & Fitness Centers', 'gym-fitness', cat_health),
        ('Spa & Massage', 'spa-massage', cat_health),
        ('Salon & Barbershop', 'salon-barbershop', cat_health),
        ('Alternative Medicine', 'alternative-medicine', cat_health),
        ('Optical Shops', 'optical-shops', cat_health),
        ('Veterinary Clinics', 'veterinary-clinics', cat_health),
        ('Mental Health Services', 'mental-health', cat_health);
        
    DECLARE 
        subcat_clinics UUID;
    BEGIN
        SELECT id INTO subcat_clinics FROM public.categories WHERE slug = 'clinics';
        INSERT INTO public.categories (name, slug, parent_id) VALUES
            ('Dental Clinic', 'dental-clinic', subcat_clinics),
            ('Eye Clinic', 'eye-clinic', subcat_clinics),
            ('OB-GYN', 'ob-gyn', subcat_clinics),
            ('Pediatric', 'pediatric', subcat_clinics),
            ('Dermatology', 'dermatology', subcat_clinics);
    END;

    -- 4. SERVICES
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Services', 'services', '🔧', 40) RETURNING id INTO cat_serv;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Banks & Financial Services', 'banks-financial', cat_serv),
        ('Insurance', 'insurance', cat_serv),
        ('Legal Services / Law Offices', 'legal-services', cat_serv),
        ('Accounting & Bookkeeping', 'accounting-bookkeeping', cat_serv),
        ('Printing & Graphics', 'printing-graphics', cat_serv),
        ('Laundry & Dry Cleaning', 'laundry-dry-cleaning', cat_serv),
        ('Courier & Delivery', 'courier-delivery', cat_serv),
        ('Pest Control', 'pest-control', cat_serv),
        ('Cleaning Services', 'cleaning-services', cat_serv),
        ('Event Planning', 'event-planning', cat_serv),
        ('Photography & Videography', 'photography-videography', cat_serv),
        ('Tailoring & Alteration', 'tailoring', cat_serv),
        ('Repair Services (Appliance, Phone, etc.)', 'repair-services', cat_serv),
        ('Freelancers & Consultants', 'freelancers-consultants', cat_serv);

    -- 5. AUTOMOTIVE
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Automotive', 'automotive', '🚗', 50) RETURNING id INTO cat_auto;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Car Dealerships', 'car-dealerships', cat_auto),
        ('Motorcycle Dealers', 'motorcycle-dealers', cat_auto),
        ('Auto Repair & Mechanic', 'auto-repair-mechanic', cat_auto),
        ('Car Wash', 'car-wash', cat_auto),
        ('Auto Parts & Accessories', 'auto-parts', cat_auto),
        ('Gas Stations', 'gas-stations', cat_auto),
        ('Tire Shops', 'tire-shops', cat_auto),
        ('Towing Services', 'towing-services', cat_auto),
        ('Driving Schools', 'driving-schools', cat_auto);

    -- 6. EDUCATION
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Education', 'education', '🎓', 60) RETURNING id INTO cat_edu;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Schools (Elementary / High School)', 'schools', cat_edu),
        ('Colleges & Universities', 'colleges-universities', cat_edu),
        ('Tutorial & Review Centers', 'tutorial-review-centers', cat_edu),
        ('Daycare & Preschool', 'daycare-preschool', cat_edu),
        ('Technical-Vocational (TESDA)', 'technical-vocational', cat_edu),
        ('Language Schools', 'language-schools', cat_edu),
        ('Computer & IT Training', 'computer-it-training', cat_edu),
        ('Music & Arts Schools', 'music-arts-schools', cat_edu),
        ('Special Education', 'special-education', cat_edu);

    -- 7. ACCOMMODATION
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Accommodation', 'accommodation', '🏨', 70) RETURNING id INTO cat_accom;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Hotels', 'hotels', cat_accom),
        ('Resorts', 'resorts', cat_accom),
        ('Apartelles & Condotels', 'apartelles-condotels', cat_accom),
        ('Pension Houses', 'pension-houses', cat_accom),
        ('Transient / Homestay', 'transient-homestay', cat_accom),
        ('Airbnb-Style Rentals', 'airbnb-rentals', cat_accom),
        ('Motels & Lodges', 'motels-lodges', cat_accom);

    -- 8. GOVERNMENT & PUBLIC SERVICES
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Government & Public Services', 'government-public-services', '🏛️', 80) RETURNING id INTO cat_gov;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('City Hall & Barangay Halls', 'city-hall-barangay', cat_gov),
        ('Police Stations', 'police-stations', cat_gov),
        ('Fire Stations', 'fire-stations', cat_gov),
        ('Post Office', 'post-office', cat_gov),
        ('SSS / PhilHealth / Pag-IBIG', 'sss-philhealth-pagibig', cat_gov),
        ('DFA / NBI / NSO-PSA', 'dfa-nbi-nso', cat_gov),
        ('Courts', 'courts', cat_gov),
        ('Public Libraries', 'public-libraries', cat_gov),
        ('Utility Offices (OLECO, Water District)', 'utility-offices', cat_gov);

    -- 9. REAL ESTATE & PROPERTY
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Real Estate & Property', 'real-estate-property', '🏢', 90) RETURNING id INTO cat_real;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Real Estate Agents/Brokers', 'real-estate-agents', cat_real),
        ('Property Developers', 'property-developers', cat_real),
        ('Apartments & Condos for Rent', 'apartments-condos-rent', cat_real),
        ('Commercial Spaces', 'commercial-spaces', cat_real),
        ('Warehouse & Storage', 'warehouse-storage', cat_real),
        ('Co-working Spaces', 'coworking-spaces', cat_real);

    -- 10. TRANSPORTATION
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Transportation', 'transportation', '🚌', 100) RETURNING id INTO cat_trans;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Jeepney Routes/Terminals', 'jeepney-terminals', cat_trans),
        ('Tricycle Terminals', 'tricycle-terminals', cat_trans),
        ('Bus Terminals', 'bus-terminals', cat_trans),
        ('Van/UV Express', 'van-uv-express', cat_trans),
        ('Car Rental', 'car-rental', cat_trans),
        ('Taxi / Ride-hailing', 'taxi-ride-hailing', cat_trans),
        ('Shipping & Cargo', 'shipping-cargo', cat_trans),
        ('Travel Agencies', 'travel-agencies', cat_trans);

    -- 11. ENTERTAINMENT & RECREATION
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Entertainment & Recreation', 'entertainment-recreation', '🎭', 110) RETURNING id INTO cat_ent;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('KTV / Karaoke', 'ktv-karaoke', cat_ent),
        ('Internet Cafés & Gaming', 'internet-cafes-gaming', cat_ent),
        ('Cinemas', 'cinemas', cat_ent),
        ('Amusement & Recreation', 'amusement-recreation', cat_ent),
        ('Tourist Spots & Parks', 'tourist-spots-parks', cat_ent),
        ('Beach Resorts (Subic area)', 'beach-resorts', cat_ent),
        ('Billiards & Sports Recreation', 'billiards-sports', cat_ent),
        ('Event Venues / Function Halls', 'event-venues', cat_ent),
        ('Museums & Cultural Sites', 'museums-cultural-sites', cat_ent);

    -- 12. RELIGIOUS & COMMUNITY
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Religious & Community', 'religious-community', '⛪', 120) RETURNING id INTO cat_rel;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Churches (Catholic)', 'churches-catholic', cat_rel),
        ('Christian Churches (Non-Catholic)', 'christian-churches', cat_rel),
        ('Mosques', 'mosques', cat_rel),
        ('Other Places of Worship', 'other-worship', cat_rel),
        ('NGOs & Foundations', 'ngos-foundations', cat_rel),
        ('Community Organizations', 'community-organizations', cat_rel),
        ('Cooperatives', 'cooperatives', cat_rel);

    -- 13. INDUSTRIAL & BUSINESS
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Industrial & Business', 'industrial-business', '🏭', 130) RETURNING id INTO cat_ind;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Manufacturing', 'manufacturing', cat_ind),
        ('Warehousing & Logistics', 'warehousing-logistics', cat_ind),
        ('IT & BPO Companies', 'it-bpo', cat_ind),
        ('Importers & Exporters', 'importers-exporters', cat_ind),
        ('Agricultural Supplies', 'agricultural-supplies', cat_ind),
        ('Construction Companies', 'construction-companies', cat_ind);

    -- 14. HOME & LIVING
    INSERT INTO public.categories (name, slug, icon, sort_order) 
    VALUES ('Home & Living', 'home-and-living', '🏠', 140) RETURNING id INTO cat_home;
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
        ('Plumbing Services', 'plumbing-services', cat_home),
        ('Electrical Services', 'electrical-services', cat_home),
        ('Carpentry', 'carpentry', cat_home),
        ('Landscaping & Gardening', 'landscaping-gardening', cat_home),
        ('Interior Design', 'interior-design', cat_home),
        ('HVAC / Aircon Services', 'hvac-aircon', cat_home),
        ('Roofing', 'roofing', cat_home),
        ('Painting Services', 'painting-services', cat_home),
        ('Moving Services', 'moving-services', cat_home);

END $$;
