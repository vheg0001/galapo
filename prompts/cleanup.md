-- Remove test data after verification (run in Supabase SQL Editor)
DELETE FROM listings WHERE slug = 'test-restaurant-galapo';
DELETE FROM events WHERE slug = 'galapo-launch-party';
DELETE FROM ad_placements WHERE title = 'Test Ad Banner';