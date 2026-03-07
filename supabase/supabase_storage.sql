-- ============================================================================
-- GalaPo — Storage Buckets and RLS Policies (Phase 2.2)
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CREATE BUCKETS
-- ────────────────────────────────────────────────────────────────────────────
-- Limits: Images (5MB = 5242880 bytes), Documents (10MB = 10485760 bytes)
-- Allowed Types: 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'

-- PUBLIC BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('listings', 'listings', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('deals', 'deals', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('events', 'events', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('blog', 'blog', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('ads', 'ads', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('pages', 'pages', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- PRIVATE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('payments', 'payments', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('claims', 'claims', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. ENABLE RLS
-- ────────────────────────────────────────────────────────────────────────────
-- Ensure RLS is active on the storage.objects table
-- RLS is already enabled by default on storage.objects in Supabase.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. STORAGE POLICIES
-- ────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- PUBLIC BUCKETS (logos, listings, deals, events)
-- Allowed: Public Read, Auth Insert, Owner/Admin Update & Delete
-- ════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Public read for business media" ON storage.objects FOR SELECT 
USING (bucket_id IN ('logos', 'listings', 'deals', 'events'));

CREATE POLICY "Auth insert for business media" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('logos', 'listings', 'deals', 'events') AND auth.role() = 'authenticated');

CREATE POLICY "Owner/Admin update business media" ON storage.objects FOR UPDATE 
USING (bucket_id IN ('logos', 'listings', 'deals', 'events') AND ((auth.uid() = owner) OR public.is_super_admin()));

CREATE POLICY "Owner/Admin delete business media" ON storage.objects FOR DELETE 
USING (bucket_id IN ('logos', 'listings', 'deals', 'events') AND ((auth.uid() = owner) OR public.is_super_admin()));


-- ════════════════════════════════════════════════════════════════════════════
-- ADMIN-ONLY BUCKETS (blog, ads, pages)
-- Allowed: Public Read, Admin Insert/Update/Delete
-- ════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Public read for admin media" ON storage.objects FOR SELECT 
USING (bucket_id IN ('blog', 'ads', 'pages'));

CREATE POLICY "Admin insert for admin media" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('blog', 'ads', 'pages') AND public.is_super_admin());

CREATE POLICY "Admin update for admin media" ON storage.objects FOR UPDATE 
USING (bucket_id IN ('blog', 'ads', 'pages') AND public.is_super_admin());

CREATE POLICY "Admin delete for admin media" ON storage.objects FOR DELETE 
USING (bucket_id IN ('blog', 'ads', 'pages') AND public.is_super_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- PRIVATE BUCKETS (payments, claims)
-- Allowed: Owner/Admin Read, Auth Insert, Owner/Admin Update & Delete
-- ════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Owner/Admin read private docs" ON storage.objects FOR SELECT 
USING (bucket_id IN ('payments', 'claims') AND ((auth.uid() = owner) OR public.is_super_admin()));

CREATE POLICY "Auth insert private docs" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('payments', 'claims') AND auth.role() = 'authenticated');

CREATE POLICY "Owner/Admin update private docs" ON storage.objects FOR UPDATE 
USING (bucket_id IN ('payments', 'claims') AND ((auth.uid() = owner) OR public.is_super_admin()));

CREATE POLICY "Owner/Admin delete private docs" ON storage.objects FOR DELETE 
USING (bucket_id IN ('payments', 'claims') AND ((auth.uid() = owner) OR public.is_super_admin()));
