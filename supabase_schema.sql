-- Run this in the Supabase SQL Editor

-- 1. Create a table for users (pairs)
CREATE TABLE public.pairs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code varchar(6) NOT NULL UNIQUE,
  user_a_id text,
  user_b_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create a table for pulses (interactions)
CREATE TABLE public.pulses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  type text NOT NULL, -- 'heartbeat', 'thinking', 'love'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Realtime so clients can listen to inserts/updates
alter publication supabase_realtime add table pulses;
alter publication supabase_realtime add table pairs;

-- 4. Enable RLS (Row Level Security) - we'll keep it simple for MVP
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for MVP (In production, use Auth!)
CREATE POLICY "Enable all for anon on pairs" ON public.pairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon on pulses" ON public.pulses FOR ALL USING (true) WITH CHECK (true);
