-- ============================================
-- SEED: Comprehensive Admin Test Data
-- Date: 2026-03-28
-- Instructions: Based on prompts/sql data.md
-- Use with Existing Data (No New Listings/Owners)
-- Fixed: JSONB construction using jsonb_build_object
-- ============================================

BEGIN;

-- 1. Create missing tables (if not existing)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'payment_verified', 'activated', 'expired', 'renewed'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.admin_user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Main Seed Logic (DO BLOCK)
-- ---------------------------------------------------------

DO $$ 
DECLARE
    -- IDs (Pre-fetched or Fixed)
    admin_id UUID := '3cae2a44-5705-43de-99e1-573e41eea70b'; -- vawn0001@hotmail.com
    owner1_id UUID := '00036c91-d6d8-4e5d-97ce-b895b132a262'; -- vawn0001@gmail.com
    
    -- Listings (The 10 specific ones requested)
    list1_id UUID; list2_id UUID; list3_id UUID; list4_id UUID; list5_id UUID;
    list6_id UUID; list7_id UUID; list8_id UUID; list9_id UUID; list10_id UUID;
    
    -- Subscriptions
    sub1_id UUID; sub2_id UUID; sub3_id UUID; sub4_id UUID; sub5_id UUID;
    
    -- Payments
    pay1_id UUID; pay2_id UUID; pay3_id UUID;
    
    -- Variables for unique identifiers
    run_suffix TEXT := TO_CHAR(NOW(), 'HH24MISS'); -- Unique suffix for this run
    curr_invoice_prefix TEXT := 'GP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-';

BEGIN
    -- FETCH IDs
    SELECT id INTO list1_id FROM listings WHERE slug = 'shine-academy-preschool-childcare'; -- Active Premium
    SELECT id INTO list2_id FROM listings WHERE slug = 'saulog-transit'; -- Active Featured
    SELECT id INTO list3_id FROM listings WHERE slug = 'sleep-and-stay-hotel'; -- Expiring Soon
    SELECT id INTO list4_id FROM listings WHERE slug = 'rakk-soo-inc'; -- Expired
    SELECT id INTO list5_id FROM listings WHERE slug = 'pest-science-corporation'; -- Pending Payment
    SELECT id INTO list6_id FROM listings WHERE slug = 'rred-automotive-copy'; -- Due for Check
    SELECT id INTO list7_id FROM listings WHERE slug = 'klf-gym'; -- Confirmed Check
    SELECT id INTO list8_id FROM listings WHERE slug = 'crest-builders-inc'; -- Overdue Check
    SELECT id INTO list9_id FROM listings WHERE slug = 'rred-automotive'; -- Top Search Pos 2
    SELECT id INTO list10_id FROM listings WHERE slug = 'pandayan-bookshop-st-joseph-branch'; -- Deactivated Check

    RAISE NOTICE '✅ IDs fetched successfully. Starting data insertion...';

    -- 2.1 SUBSCRIPTIONS
    -- ---------------------------------------------------------
    
    -- 1 Active Premium (Shine Academy)
    INSERT INTO public.subscriptions (id, listing_id, plan_type, status, start_date, end_date, amount, auto_renew)
    VALUES (gen_random_uuid(), list1_id, 'premium', 'active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 599.00, true)
    RETURNING id INTO sub1_id;

    -- 1 Active Featured (Saulog Transit)
    INSERT INTO public.subscriptions (id, listing_id, plan_type, status, start_date, end_date, amount, auto_renew)
    VALUES (gen_random_uuid(), list2_id, 'featured', 'active', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 299.00, true)
    RETURNING id INTO sub2_id;

    -- 1 Expiring Soon (Sleep and Stay)
    INSERT INTO public.subscriptions (id, listing_id, plan_type, status, start_date, end_date, amount, auto_renew)
    VALUES (gen_random_uuid(), list3_id, 'featured', 'active', CURRENT_DATE - INTERVAL '27 days', CURRENT_DATE + INTERVAL '3 days', 299.00, false)
    RETURNING id INTO sub3_id;

    -- 1 Expired (RAKK SOO)
    INSERT INTO public.subscriptions (id, listing_id, plan_type, status, start_date, end_date, amount)
    VALUES (gen_random_uuid(), list4_id, 'featured', 'expired', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 299.00)
    RETURNING id INTO sub4_id;

    -- 1 Pending Payment (Pest Science)
    INSERT INTO public.subscriptions (id, listing_id, plan_type, status, start_date, end_date, amount)
    VALUES (gen_random_uuid(), list5_id, 'premium', 'pending_payment', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 599.00)
    RETURNING id INTO sub5_id;

    RAISE NOTICE '✅ Subscriptions created.';

    -- 2.2 PAYMENTS & INVOICES
    -- ---------------------------------------------------------
    
    -- Verified Payment (Active Premium)
    INSERT INTO public.payments (id, subscription_id, listing_id, user_id, amount, payment_method, payment_proof_url, reference_number, description, status, verified_by, verified_at)
    VALUES (gen_random_uuid(), sub1_id, list1_id, owner1_id, 599.00, 'bank_transfer', 'https://placehold.co/400x600/10B981/FFFFFF?text=Payment+Proof', 'BT-PREM-' || run_suffix, 'Premium subscription verification', 'verified', admin_id, CURRENT_DATE - INTERVAL '10 days')
    RETURNING id INTO pay1_id;

    -- Verified Payment (Active Featured)
    INSERT INTO public.payments (id, subscription_id, listing_id, user_id, amount, payment_method, payment_proof_url, reference_number, description, status, verified_by, verified_at)
    VALUES (gen_random_uuid(), sub2_id, list2_id, owner1_id, 299.00, 'gcash', 'https://placehold.co/400x600/10B981/FFFFFF?text=Payment+Proof', 'GC-FEAT-' || run_suffix, 'Featured subscription verification', 'verified', admin_id, CURRENT_DATE - INTERVAL '5 days')
    RETURNING id INTO pay2_id;

    -- Pending Payment (Pending Subscription)
    INSERT INTO public.payments (id, subscription_id, listing_id, user_id, amount, payment_method, payment_proof_url, reference_number, description, status)
    VALUES (gen_random_uuid(), sub5_id, list5_id, owner1_id, 599.00, 'gcash', 'https://placehold.co/400x600/10B981/FFFFFF?text=Payment+Proof', 'GC-PEND-' || run_suffix, 'New Premium request', 'pending')
    RETURNING id INTO pay3_id;

    -- Invoices (Fixed: Unique per run to avoid constraint errors)
    INSERT INTO public.invoices (id, payment_id, listing_id, user_id, invoice_number, amount, description, items, status, issued_at, due_date)
    VALUES 
    (gen_random_uuid(), pay1_id, list1_id, owner1_id, curr_invoice_prefix || run_suffix || '-01', 599.00, 'Premium Subscription', jsonb_build_array(jsonb_build_object('description', 'Premium Subscription (30 days)', 'amount', 599.00)), 'paid', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE),
    (gen_random_uuid(), pay2_id, list2_id, owner1_id, curr_invoice_prefix || run_suffix || '-02', 299.00, 'Featured Subscription', jsonb_build_array(jsonb_build_object('description', 'Featured Subscription (30 days)', 'amount', 299.00)), 'paid', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE);

    RAISE NOTICE '✅ Payments and Invoices created.';

    -- 3.3 TOP SEARCH PLACEMENTS
    -- ---------------------------------------------------------
    
    -- Active Pos 1 (KLF GYM)
    INSERT INTO public.top_search_placements (id, listing_id, category_id, start_date, end_date, position, is_active, payment_id)
    SELECT gen_random_uuid(), list7_id, category_id, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 1, true, pay1_id
    FROM listings WHERE id = list7_id;

    -- Active Pos 2 (RRED Automotive)
    INSERT INTO public.top_search_placements (id, listing_id, category_id, start_date, end_date, position, is_active, payment_id)
    SELECT gen_random_uuid(), list9_id, category_id, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '28 days', 2, true, pay2_id
    FROM listings WHERE id = list9_id;

    -- Expired (Sleep and Stay)
    INSERT INTO public.top_search_placements (id, listing_id, category_id, start_date, end_date, position, is_active, payment_id)
    SELECT gen_random_uuid(), list3_id, category_id, CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '5 days', 1, false, pay2_id
    FROM listings WHERE id = list3_id;

    RAISE NOTICE '✅ Top Search Placements created.';

    -- 4.4 FLAG UPDATES
    -- ---------------------------------------------------------
    
    UPDATE listings SET is_featured = true, is_premium = true, is_active = true WHERE id = list1_id; 
    UPDATE listings SET is_featured = true, is_premium = false, is_active = true WHERE id = list2_id; 
    UPDATE listings SET is_featured = false, is_premium = false, is_active = true WHERE id = list4_id; 
    UPDATE listings SET is_featured = true, is_premium = false, is_active = true WHERE id = list9_id; 

    RAISE NOTICE '✅ Listing flags updated.';

    -- 5.5 ANNUAL CHECKS
    -- ---------------------------------------------------------
    
    UPDATE listings SET last_verified_at = NOW() - INTERVAL '400 days' WHERE id = list6_id;
    UPDATE listings SET last_verified_at = NOW() - INTERVAL '380 days' WHERE id = list8_id;

    INSERT INTO public.annual_checks (id, listing_id, check_date, response_deadline, status)
    VALUES (gen_random_uuid(), list2_id, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'pending');

    INSERT INTO public.annual_checks (id, listing_id, check_date, response_deadline, status)
    VALUES (gen_random_uuid(), list8_id, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '3 days', 'pending');

    INSERT INTO public.annual_checks (id, listing_id, check_date, response_deadline, status, responded_at)
    VALUES (gen_random_uuid(), list7_id, CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '33 days', 'confirmed', CURRENT_DATE - INTERVAL '35 days');

    INSERT INTO public.annual_checks (id, listing_id, check_date, response_deadline, status, deactivated_at)
    VALUES (gen_random_uuid(), list10_id, CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '43 days', 'deactivated', CURRENT_DATE - INTERVAL '43 days');

    INSERT INTO public.reactivation_fees (id, listing_id, amount, status)
    VALUES (gen_random_uuid(), list10_id, 500.00, 'pending');

    UPDATE listings SET is_active = false WHERE id = list10_id;

    RAISE NOTICE '✅ Annual Checks data created.';

    -- 6.6 SUBSCRIPTION HISTORY
    -- ---------------------------------------------------------
    
    INSERT INTO public.subscription_history (subscription_id, action, description)
    VALUES 
    (sub1_id, 'created', 'Initial subscription request created.'),
    (sub1_id, 'payment_verified', 'Payment proof verified by admin.'),
    (sub1_id, 'activated', 'Premium features enabled.'),
    (sub2_id, 'created', 'Initial subscription request created.'),
    (sub2_id, 'payment_verified', 'Payment proof verified by admin.'),
    (sub2_id, 'activated', 'Featured features enabled.');

    RAISE NOTICE '✅ Subscription History entries created.';

    -- 7.7 NOTIFICATIONS (FIXED: JSONB construction using jsonb_build_object)
    -- ---------------------------------------------------------
    
    -- ADMIN NOTICES
    INSERT INTO public.notifications (user_id, type, title, message, is_read, data)
    VALUES 
    (admin_id, 'new_listing_submitted', 'New Listing!', 'A new business "Zambales Seafood" has been submitted for approval.', false, jsonb_build_object()),
    (admin_id, 'new_payment_uploaded', 'Payment Proof!', 'Pest Science Corporation uploaded a proof of payment of ₱599.', false, jsonb_build_object('payment_id', pay3_id)),
    (admin_id, 'annual_check', 'Check Due!', 'Mac Performance is now due for its annual verification.', false, jsonb_build_object()),
    (admin_id, 'annual_check_no_response', 'Overdue!', 'Crest Builders Inc. has not responded to their annual check.', false, jsonb_build_object()),
    (admin_id, 'listing_approved', 'Old Notice', 'A listing was approved last month.', true, jsonb_build_object());

    -- OWNER NOTICES
    INSERT INTO public.notifications (user_id, type, title, message, is_read)
    VALUES 
    (owner1_id, 'payment_confirmed', 'Verified!', 'Your payment for Saulog Transit has been verified. Featured status active!', true),
    (owner1_id, 'subscription_expiring', 'Expiring!', 'Your listing Sleep and Stay Hotel expires in 3 days. Renew now!', false);

    RAISE NOTICE '✅ Notifications created.';

    RAISE NOTICE '🚀 COMPLETED! Your tailored seed data is ready for testing.';

END $$;

COMMIT;