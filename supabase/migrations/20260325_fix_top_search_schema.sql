-- Fix top_search_placements schema gaps
-- 1. Add missing columns
ALTER TABLE public.top_search_placements 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Make payment_id nullable for complimentary placements
ALTER TABLE public.top_search_placements 
ALTER COLUMN payment_id DROP NOT NULL;

-- 3. Add updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_trigger ON public.top_search_placements;
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON public.top_search_placements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
