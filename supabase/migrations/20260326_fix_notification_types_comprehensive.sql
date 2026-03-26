-- Fix: Add all application-supported notification types to the ENUM
-- Run this in the Supabase SQL Editor to resolve insertion errors.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'broadcast';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'annual_check';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'annual_check_resolved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'annual_check_closure';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'annual_check_reminder';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_verified';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_payment_uploaded';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'listing_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'listing_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'claim_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'claim_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'top_search_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'top_search_removed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'top_search_expiring';
