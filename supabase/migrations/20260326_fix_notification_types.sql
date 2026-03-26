-- Fix: Add missing notification types to the ENUM
-- Run this in the Supabase SQL Editor to resolve insertion errors.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'top_search_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'top_search_removed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'top_search_expiring';
