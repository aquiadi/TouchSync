-- TouchSync V2.1 — Fix code reuse
-- Run this in the Supabase SQL Editor

-- 1. Drop the UNIQUE constraint on code (allows reuse after pair ends)
ALTER TABLE public.pairs DROP CONSTRAINT IF EXISTS pairs_code_key;

-- 2. Add a partial unique index: codes must be unique ONLY among active, open pairs
-- This means: two ended pairs can have the same code, but only one active open pair per code
CREATE UNIQUE INDEX IF NOT EXISTS idx_pairs_active_open_code
  ON public.pairs (code)
  WHERE status = 'active' AND user_b_id IS NULL;
