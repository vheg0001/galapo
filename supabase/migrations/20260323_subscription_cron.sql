-- CRON SQL FUNCTIONS for GalaPo Subscription Expiry

-- 1. Function to expire subscriptions daily
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
DECLARE
    expired_record RECORD;
BEGIN
    FOR expired_record IN 
        SELECT id, listing_id, plan_type 
        FROM subscriptions 
        WHERE status = 'active' AND end_date <= NOW()
    LOOP
        -- Update subscription status
        UPDATE subscriptions SET status = 'expired' WHERE id = expired_record.id;
        
        -- Update listing flags
        UPDATE listings SET 
            is_featured = false, 
            is_premium = false 
        WHERE id = expired_record.listing_id;
        
        -- Remove plan badges
        DELETE FROM listing_badges 
        WHERE listing_id = expired_record.listing_id 
        AND badge_id IN ('featured', 'premium');
        
        -- Create notification for owner
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT user_id, 'subscription_expired', 'Plan Expired', 
               'Your ' || expired_record.plan_type || ' plan has expired. Your listing has been reverted to a Free plan.',
               jsonb_build_object('subscription_id', expired_record.id, 'listing_id', expired_record.listing_id)
        FROM listings WHERE id = expired_record.listing_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to expire top search placements
CREATE OR REPLACE FUNCTION expire_top_search()
RETURNS void AS $$
DECLARE
    expired_record RECORD;
BEGIN
    FOR expired_record IN 
        SELECT id, listing_id 
        FROM top_search_placements 
        WHERE is_active = true AND end_date <= NOW()
    LOOP
        -- Deactivate placement
        UPDATE top_search_placements SET is_active = false WHERE id = expired_record.id;
        
        -- Remove Sponsored badge
        DELETE FROM listing_badges 
        WHERE listing_id = expired_record.listing_id 
        AND badge_id = 'sponsored';
        
        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT user_id, 'placement_expired', 'Sponsored Placement Expired', 
               'Your top search placement has expired.',
               jsonb_build_object('placement_id', expired_record.id)
        FROM listings WHERE id = expired_record.listing_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to warn about expiring subscriptions (7 days warning)
CREATE OR REPLACE FUNCTION warn_expiring_subscriptions()
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT l.user_id, 'subscription_warning', 'Plan Expiring Soon', 
           'Your ' || s.plan_type || ' plan will expire in ' || 
           EXTRACT(day FROM (s.end_date - NOW()))::text || ' days.',
           jsonb_build_object('subscription_id', s.id, 'listing_id', l.id)
    FROM subscriptions s
    JOIN listings l ON s.listing_id = l.id
    WHERE s.status = 'active' 
    AND s.end_date > NOW() 
    AND s.end_date <= NOW() + INTERVAL '7 days'
    AND NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = l.user_id 
        AND type = 'subscription_warning' 
        AND created_at > s.start_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
