-- Create listing_analytics table
CREATE TABLE IF NOT EXISTS public.listing_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- page_view, phone_click, email_click, website_click, directions_click, social_click, share
    event_data JSONB, -- { platform: "facebook" }
    visitor_id VARCHAR(255), -- anonymous session ID from cookie
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON public.listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON public.listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_created_at ON public.listing_analytics(created_at);

-- Enable Row Level Security
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert (for tracking)
CREATE POLICY "Enable insert for everyone" ON public.listing_analytics
    FOR INSERT WITH CHECK (true);

-- Business owners can view analytics for their own listings
CREATE POLICY "Business owners can view own listing analytics" ON public.listing_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.listing_analytics.listing_id
            AND public.listings.owner_id = auth.uid()
        )
    );

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics" ON public.listing_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE public.users.id = auth.uid()
            AND public.users.role = 'super_admin'
        )
    );
