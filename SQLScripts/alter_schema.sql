-- ==========================================
-- REALINVEST: Investment & Market Schema Alters
-- ==========================================

-- 1. Add balance to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 100.00;

-- 2. Add market fields to reels
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS investments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[{"timestamp": "2023-01-01T00:00:00Z", "price": 10.00}]'::jsonb;

-- 3. Create the investments table
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    amount_invested DECIMAL(10,2) NOT NULL,
    shares_bought DECIMAL(10,4) NOT NULL,
    buy_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for getting a user's investments quickly
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
-- Index for getting all investments for a reel quickly
CREATE INDEX IF NOT EXISTS idx_investments_reel_id ON public.investments(reel_id);

-- Provide $100 to any existing users who were created before this column existed
UPDATE public.users SET balance = 100.00 WHERE balance IS NULL;

-- Setup initial price history for existing reels
UPDATE public.reels 
SET price_history = jsonb_build_array(
    jsonb_build_object(
        'timestamp', created_at,
        'price', price
    )
)
WHERE price_history = '[]'::jsonb OR price_history IS NULL;
