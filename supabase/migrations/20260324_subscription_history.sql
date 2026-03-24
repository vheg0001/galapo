-- Admin Subscription History Tracking
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sub_history_sub ON subscription_history(subscription_id);

-- Function to get status counts for admin dashboard
CREATE OR REPLACE FUNCTION get_subscription_status_counts()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'all', (SELECT count(*) FROM subscriptions),
        'active', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
        'pending_payment', (SELECT count(*) FROM subscriptions WHERE status = 'pending_payment'),
        'expiring_soon', (SELECT count(*) FROM subscriptions WHERE status = 'active' AND end_date > now() AND end_date <= now() + interval '7 days'),
        'expired', (SELECT count(*) FROM subscriptions WHERE status = 'expired'),
        'cancelled', (SELECT count(*) FROM subscriptions WHERE status = 'cancelled')
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
