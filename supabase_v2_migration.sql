-- TouchSync V2 Migration
-- Run this in the Supabase SQL Editor

-- 1. Add presence and lifecycle columns to pairs
ALTER TABLE public.pairs ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.pairs ADD COLUMN IF NOT EXISTS user_a_last_active timestamptz;
ALTER TABLE public.pairs ADD COLUMN IF NOT EXISTS user_b_last_active timestamptz;
ALTER TABLE public.pairs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Index for fast lookups by code + status (the primary query path)
CREATE INDEX IF NOT EXISTS idx_pairs_code_status ON public.pairs (code, status);

-- 3. Index for presence queries
CREATE INDEX IF NOT EXISTS idx_pairs_status_active ON public.pairs (status) WHERE status = 'active';
