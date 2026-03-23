-- =====================================================================
-- GalaPo — Annual Listing Checks Cron Job
-- Module 10.2
-- =====================================================================
-- This SQL sets up a PostgreSQL function and a pg_cron schedule that
-- automatically triggers annual checks for all listings that haven't
-- been verified in over 1 year.
--
-- HOW TO APPLY
-- ─────────────
-- 1. Go to your Supabase project → SQL Editor
-- 2. Run the EXTENSION section first (once per project)
-- 3. Run the FUNCTION section
-- 4. Run the CRON SCHEDULE section
--
-- NOTE: pg_cron is available on Supabase Pro plans. On Free plan you
--       can manually call POST /api/admin/annual-checks/batch-trigger
--       from a scheduled GitHub Action or similar service.
-- =====================================================================


-- ─── 1. Enable pg_cron extension (run once) ────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;


-- ─── 2. Create the annual check function ───────────────────────────
CREATE OR REPLACE FUNCTION check_annual_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    one_year_ago TIMESTAMPTZ := NOW() - INTERVAL '1 year';
    deadline DATE := (NOW() + INTERVAL '14 days')::DATE;
    listing_rec RECORD;
    check_id UUID;
BEGIN
    -- Loop over active listings not verified in the last year
    FOR listing_rec IN
        SELECT
            l.id          AS listing_id,
            l.business_name,
            l.owner_id
        FROM listings l
        WHERE
            l.is_active = TRUE
            AND l.status IN ('approved', 'claimed_pending')
            AND (
                l.last_verified_at IS NULL
                OR l.last_verified_at < one_year_ago
            )
            -- Skip those that already have a pending check
            AND NOT EXISTS (
                SELECT 1
                FROM annual_checks ac
                WHERE ac.listing_id = l.id
                  AND ac.status = 'pending'
            )
    LOOP
        -- Insert the annual check record
        INSERT INTO annual_checks (
            listing_id,
            status,
            sent_at,
            response_deadline,
            created_at
        ) VALUES (
            listing_rec.listing_id,
            'pending',
            NOW(),
            deadline,
            NOW()
        )
        RETURNING id INTO check_id;

        -- Create notification for registered owners only
        IF listing_rec.owner_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data,
                is_read,
                created_at
            ) VALUES (
                listing_rec.owner_id,
                'annual_check',
                'Annual Listing Check — Action Required',
                'Please confirm your listing "' || listing_rec.business_name || '" is still active. Respond before ' || deadline::TEXT || ' to keep it live on GalaPo.',
                jsonb_build_object(
                    'listing_id',    listing_rec.listing_id,
                    'listing_name',  listing_rec.business_name,
                    'check_id',      check_id,
                    'deadline',      deadline
                ),
                FALSE,
                NOW()
            );
        END IF;

        RAISE NOTICE 'Annual check triggered for listing: % (%)',
            listing_rec.business_name, listing_rec.listing_id;
    END LOOP;
END;
$$;


-- ─── 3. Grant execute permission ───────────────────────────────────
GRANT EXECUTE ON FUNCTION check_annual_listings() TO postgres;


-- ─── 4. Schedule the cron job ──────────────────────────────────────
-- Runs daily at midnight Philippine Standard Time (UTC+8 = 16:00 UTC)
SELECT cron.schedule(
    'galapo-annual-checks',           -- job name (unique)
    '0 16 * * *',                     -- cron expression: daily at 16:00 UTC (midnight PH)
    $$SELECT check_annual_listings();$$
);


-- ─── 5. Verify the cron job was registered ─────────────────────────
-- Run this query to confirm:
-- SELECT * FROM cron.job WHERE jobname = 'galapo-annual-checks';


-- ─── 6. Manual override queries ────────────────────────────────────
-- To run the function immediately (for testing):
-- SELECT check_annual_listings();

-- To unschedule the cron job:
-- SELECT cron.unschedule('galapo-annual-checks');

-- To see recent cron job runs and their status:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
