-- LocalSquares Islands & Constituencies Structure
-- Adds hierarchical island -> constituency (board) organization
-- Run this migration in your Supabase SQL editor

-- =====================================================
-- 1. Create Islands Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.islands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Island metadata
    population INTEGER,
    area_sq_km NUMERIC(10,2),
    capital TEXT,
    
    -- Display order (for sorting)
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata for future features
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_islands_slug ON public.islands(slug);
CREATE INDEX idx_islands_active ON public.islands(is_active);
CREATE INDEX idx_islands_sort ON public.islands(sort_order);

-- =====================================================
-- 2. Add island_id to boards table
-- =====================================================

-- Add island_id column (nullable first for existing data)
ALTER TABLE public.boards 
ADD COLUMN IF NOT EXISTS island_id UUID REFERENCES public.islands(id) ON DELETE SET NULL;

-- Add index for island lookups
CREATE INDEX IF NOT EXISTS idx_boards_island ON public.boards(island_id);

-- =====================================================
-- 3. Seed Islands Data
-- =====================================================

INSERT INTO public.islands (name, slug, display_name, description, population, capital, sort_order) VALUES
(
    'New Providence',
    'new-providence',
    'New Providence (Nassau)',
    'The most populous island, home to the capital city Nassau. The economic and cultural heart of The Bahamas.',
    275000,
    'Nassau',
    1
),
(
    'Grand Bahama',
    'grand-bahama',
    'Grand Bahama (Freeport)',
    'The second most populous island, featuring Freeport city and beautiful beaches.',
    52000,
    'Freeport',
    2
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 4. Seed Constituencies/Areas (Boards)
-- =====================================================

-- First, get island IDs
DO $$
DECLARE
    new_providence_id UUID;
    grand_bahama_id UUID;
BEGIN
    SELECT id INTO new_providence_id FROM public.islands WHERE slug = 'new-providence';
    SELECT id INTO grand_bahama_id FROM public.islands WHERE slug = 'grand-bahama';

    -- NEW PROVIDENCE CONSTITUENCIES
    -- Update existing boards
    UPDATE public.boards SET island_id = new_providence_id WHERE slug IN ('cable-beach', 'downtown-nassau', 'paradise-island');
    
    -- Insert new constituencies for New Providence
    INSERT INTO public.boards (neighborhood, slug, display_name, description, island_id) VALUES
    -- Central Nassau
    ('Carmichael', 'carmichael', 'Carmichael', 'Carmichael Road area - residential and commercial hub', new_providence_id),
    ('Pinewood', 'pinewood', 'Pinewood Gardens', 'Pinewood Gardens subdivision', new_providence_id),
    ('Golden Gates', 'golden-gates', 'Golden Gates', 'Golden Gates Estates area', new_providence_id),
    ('Golden Isles', 'golden-isles', 'Golden Isles', 'Golden Isles Road area', new_providence_id),
    
    -- Eastern New Providence
    ('Fox Hill', 'fox-hill', 'Fox Hill', 'Historic Fox Hill community', new_providence_id),
    ('Yamacraw', 'yamacraw', 'Yamacraw', 'Yamacraw Beach Estates and surrounding area', new_providence_id),
    ('Elizabeth Estates', 'elizabeth-estates', 'Elizabeth Estates', 'Elizabeth Estates subdivision', new_providence_id),
    ('Sea Breeze', 'sea-breeze', 'Sea Breeze', 'Sea Breeze area', new_providence_id),
    
    -- Western New Providence
    ('Adelaide', 'adelaide', 'Adelaide', 'Adelaide village and surrounding area', new_providence_id),
    ('South Beach', 'south-beach', 'South Beach', 'South Beach area', new_providence_id),
    ('Coral Harbour', 'coral-harbour', 'Coral Harbour', 'Coral Harbour community', new_providence_id),
    ('Lyford Cay', 'lyford-cay', 'Lyford Cay', 'Lyford Cay and western tip', new_providence_id),
    
    -- Other areas
    ('Over-the-Hill', 'over-the-hill', 'Over-the-Hill', 'Historic Over-the-Hill communities - Grants Town, Bain Town', new_providence_id),
    ('Centreville', 'centreville', 'Centreville', 'Centreville area near downtown', new_providence_id),
    ('Oakes Field', 'oakes-field', 'Oakes Field', 'Oakes Field and Marathon area', new_providence_id),
    ('Blair Estates', 'blair-estates', 'Blair Estates', 'Blair Estates and Village Road area', new_providence_id)
    ON CONFLICT (slug) DO UPDATE SET island_id = EXCLUDED.island_id;

    -- GRAND BAHAMA CONSTITUENCIES
    INSERT INTO public.boards (neighborhood, slug, display_name, description, island_id) VALUES
    -- Freeport/Lucaya
    ('Downtown Freeport', 'downtown-freeport', 'Downtown Freeport', 'Downtown Freeport business district', grand_bahama_id),
    ('Lucaya', 'lucaya', 'Lucaya', 'Port Lucaya and Lucaya Beach area', grand_bahama_id),
    ('Lucayan Beach', 'lucayan-beach', 'Lucayan Beach', 'Lucayan Beach and surrounding resorts', grand_bahama_id),
    
    -- Other Grand Bahama areas
    ('Eight Mile Rock', 'eight-mile-rock', 'Eight Mile Rock', 'Eight Mile Rock settlement', grand_bahama_id),
    ('West End', 'west-end', 'West End', 'West End settlement - western tip of Grand Bahama', grand_bahama_id),
    ('High Rock', 'high-rock', 'High Rock', 'High Rock settlement on the east', grand_bahama_id),
    ('Pinders Point', 'pinders-point', 'Pinders Point', 'Pinders Point area', grand_bahama_id),
    ('Hunters', 'hunters', 'Hunters', 'Hunters settlement', grand_bahama_id)
    ON CONFLICT (slug) DO UPDATE SET island_id = EXCLUDED.island_id;

END $$;

-- =====================================================
-- 5. Enable RLS on islands table
-- =====================================================

ALTER TABLE public.islands ENABLE ROW LEVEL SECURITY;

-- Everyone can read islands
CREATE POLICY "Anyone can view islands"
    ON public.islands FOR SELECT
    USING (true);

-- Only admins can modify islands
CREATE POLICY "Admins can manage islands"
    ON public.islands FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- 6. Update boards RLS to include island context
-- =====================================================

-- Boards are still publicly readable (no change needed)
-- The existing policies already allow public read access

-- =====================================================
-- 7. Create helper view for frontend
-- =====================================================

CREATE OR REPLACE VIEW public.boards_with_islands AS
SELECT 
    b.*,
    i.name as island_name,
    i.slug as island_slug,
    i.display_name as island_display_name
FROM public.boards b
LEFT JOIN public.islands i ON b.island_id = i.id;

-- Grant access to the view
GRANT SELECT ON public.boards_with_islands TO anon, authenticated;

