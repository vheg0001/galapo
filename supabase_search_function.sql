-- =========================================================================
-- GalaPo - Module 6.2 Backend Search API function
-- =========================================================================
-- This function handles comprehensive search logic for listings.
-- Features: Full-text search (pg_trgm relevance ranking), filtering
-- (category, barangay, city, open now, featured), distance sorting.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Assuming earthdistance is already enabled or handled manually using Haversine

-- Drop existing if exists
DROP FUNCTION IF EXISTS search_listings(text,text,text,text[],text,boolean,boolean,double precision,double precision,double precision,text,integer,integer);

CREATE OR REPLACE FUNCTION search_listings(
    search_query TEXT DEFAULT NULL,
    category_slug TEXT DEFAULT NULL,
    subcategory_slug TEXT DEFAULT NULL,
    barangay_slugs TEXT[] DEFAULT NULL,
    city_slug TEXT DEFAULT 'olongapo',
    is_open_now BOOLEAN DEFAULT FALSE,
    featured_only BOOLEAN DEFAULT FALSE,
    user_lat DOUBLE PRECISION DEFAULT NULL,
    user_lng DOUBLE PRECISION DEFAULT NULL,
    radius_km DOUBLE PRECISION DEFAULT 10,
    sort_by TEXT DEFAULT 'featured',
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_category_id UUID;
    v_subcategory_id UUID;
    v_barangay_ids UUID[] := '{}';
    v_child_category_ids UUID[] := '{}';
    v_total_count INTEGER;
    v_offset INTEGER := (page_number - 1) * page_size;
    v_current_day TEXT;
    v_current_time TEXT;
    v_sponsored_results JSONB := '[]'::jsonb;
    v_listings_results JSONB := '[]'::jsonb;
    v_result JSON;
BEGIN
    -- 1. Setup Time for "Open Now" 
    -- We assume the server calls this function with current day/time if we don't calculate it here
    -- But we can calculate it dynamically directly in PG using Asia/Manila 
    IF is_open_now THEN
        v_current_day := LOWER(to_char(timezone('Asia/Manila', now()), 'Day'));
        v_current_time := to_char(timezone('Asia/Manila', now()), 'HH24:MI');
    END IF;

    -- 2. Resolve Slugs to IDs
    IF category_slug IS NOT NULL THEN
        SELECT id INTO v_category_id FROM categories WHERE slug = category_slug AND is_active = true;
        -- Get children in case we search by parent category
        SELECT array_agg(id) INTO v_child_category_ids FROM categories WHERE parent_id = v_category_id;
    END IF;

    IF subcategory_slug IS NOT NULL THEN
        SELECT id INTO v_subcategory_id FROM categories WHERE slug = subcategory_slug AND is_active = true;
    END IF;

    IF barangay_slugs IS NOT NULL AND array_length(barangay_slugs, 1) > 0 THEN
        SELECT array_agg(id) INTO v_barangay_ids FROM barangays WHERE slug = ANY(barangay_slugs) AND is_active = true;
    END IF;

    -- 3. Fetch Sponsored Placements if sorting by featured/relevance and category is specified
    -- (This logic mimics the current API)
    IF v_category_id IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(sponsored_listings), '[]'::jsonb)
        INTO v_sponsored_results
        FROM (
            SELECT
                p.position,
                jsonb_build_object(
                    'id', l.id,
                    'slug', l.slug,
                    'business_name', l.business_name,
                    'short_description', l.short_description,
                    'phone', l.phone,
                    'address', l.address,
                    'logo_url', l.logo_url,
                    'is_featured', l.is_featured,
                    'is_premium', l.is_premium,
                    'lat', l.lat,
                    'lng', l.lng,
                    'tags', l.tags,
                    'category_name', c.name,
                    'subcategory_name', sc.name,
                    'barangay_name', b.name,
                    'primary_image', COALESCE((SELECT image_url FROM listing_images li WHERE li.listing_id = l.id ORDER BY is_primary DESC, sort_order ASC NULLS LAST LIMIT 1), l.logo_url),
                    'is_sponsored', true
                ) AS sponsored_listings
            FROM top_search_placements p
            JOIN listings l ON p.listing_id = l.id
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN categories sc ON l.subcategory_id = sc.id
            LEFT JOIN barangays b ON l.barangay_id = b.id
            WHERE p.category_id = v_category_id
              AND p.is_active = true
              AND p.start_date <= current_date
              AND p.end_date >= current_date
              AND l.status = 'approved'
              AND l.is_active = true
            ORDER BY p.position ASC
        ) sp;
    END IF;


    -- 4. Main Query Builder using CTE
    WITH FilteredListings AS (
        SELECT 
            l.id, l.slug, l.business_name, l.short_description, l.phone, l.address,
            l.logo_url, l.is_featured, l.is_premium, l.lat, l.lng, l.tags, l.created_at, l.updated_at,
            c.name AS category_name,
            sc.name AS subcategory_name,
            b.name AS barangay_name,
            COALESCE((SELECT image_url FROM listing_images li WHERE li.listing_id = l.id ORDER BY is_primary DESC, sort_order ASC NULLS LAST LIMIT 1), l.logo_url) AS primary_image,
            
            -- Full-text search relevance (pg_trgm)
            CASE 
                WHEN search_query IS NOT NULL THEN
                    (
                        (similarity(COALESCE(l.business_name, ''), search_query) * 3) + 
                        (similarity(COALESCE(l.tags::text, ''), search_query) * 2) + 
                        (similarity(COALESCE(l.short_description, '') || COALESCE(l.full_description, ''), search_query) * 1)
                    )
                ELSE 0 
            END AS relevance_score,

            -- Distance calculation (Haversine Formula) in km
            CASE 
                WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND l.lat IS NOT NULL AND l.lng IS NOT NULL THEN
                    (6371 * acos(
                        cos(radians(user_lat)) * cos(radians(l.lat)) * 
                        cos(radians(l.lng) - radians(user_lng)) + 
                        sin(radians(user_lat)) * sin(radians(l.lat))
                    ))
                ELSE NULL 
            END AS distance_km

        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN categories sc ON l.subcategory_id = sc.id
        LEFT JOIN barangays b ON l.barangay_id = b.id
        
        WHERE l.status = 'approved'
          AND l.is_active = true
          
          -- Location Filter (City defaults to olongapo but currently isn't strictly enforced in db structure; skipping for now unless explicitly modelled)
          
          -- Category Filter
          AND (v_category_id IS NULL OR (l.category_id = v_category_id OR l.subcategory_id = ANY(COALESCE(v_child_category_ids, '{}'))))
          
          -- Subcategory Filter
          AND (v_subcategory_id IS NULL OR l.subcategory_id = v_subcategory_id)
          
          -- Barangay Filter
          AND (array_length(v_barangay_ids, 1) IS NULL OR l.barangay_id = ANY(v_barangay_ids))
          
          -- Featured Only Filter
          AND (NOT featured_only OR l.is_featured = true)
          
          -- Full-text Search Filter (Threshold 0.1 for fuzzy matching)
          AND (search_query IS NULL OR 
               l.business_name ILIKE '%' || search_query || '%' OR
               l.short_description ILIKE '%' || search_query || '%' OR
               l.tags::text ILIKE '%' || search_query || '%' OR
               similarity(l.business_name, search_query) > 0.1 OR
               similarity(l.tags::text, search_query) > 0.1
              )
              
          -- Open Now Filter
          AND (NOT is_open_now OR (
                l.operating_hours IS NOT NULL 
                AND l.operating_hours->trim(v_current_day)->>'is_closed' = 'false'
                AND (l.operating_hours->trim(v_current_day)->>'open')::time <= v_current_time::time
                AND (l.operating_hours->trim(v_current_day)->>'close')::time >= v_current_time::time
              ))
    ),
    SortedListings AS (
        SELECT * FROM FilteredListings
        WHERE (radius_km IS NULL OR distance_km IS NULL OR distance_km <= radius_km)
        ORDER BY 
            -- Dynamic Sorting
            CASE WHEN sort_by = 'distance' AND distance_km IS NOT NULL THEN distance_km END ASC,
            CASE WHEN search_query IS NOT NULL THEN relevance_score END DESC,
            CASE WHEN sort_by = 'newest' THEN created_at END DESC,
            CASE WHEN sort_by = 'name_asc' THEN business_name END ASC,
            CASE WHEN sort_by = 'name_desc' THEN business_name END DESC,
            -- Default / Featured sorting
            is_premium DESC,
            is_featured DESC,
            updated_at DESC
    ),
    CountedListings AS (
        SELECT count(*) AS total_count FROM SortedListings
    )
    SELECT 
        json_build_object(
            'total', (SELECT total_count FROM CountedListings),
            'sponsored', v_sponsored_results,
            'listings', COALESCE((
                SELECT json_agg(row_to_json(sl.*)) 
                FROM (SELECT * FROM SortedListings LIMIT page_size OFFSET v_offset) sl
            ), '[]'::json)
        ) INTO v_result;

    RETURN v_result;
END;
$$;
