-- RLS Policies for top_search_placements
-- This script adds missing security policies to allow admins and owners to manage placements.

-- 1. Super Admin Full Access
CREATE POLICY "Super admins see all top search placements" ON public.top_search_placements
    FOR ALL USING (is_super_admin());

-- 2. Business Owner Read Access (for their own listings)
CREATE POLICY "Owners can see their own top search placements" ON public.top_search_placements
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.listings 
        WHERE id = top_search_placements.listing_id 
        AND owner_id = auth.uid()
    ));

-- 3. Business Owner Insert/Delete (usually handled via payments, but policy helps for visibility)
-- We keep it restricted to Admin for now as per current workflow, but allowing SELECT is essential.
