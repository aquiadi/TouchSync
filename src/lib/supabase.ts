import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fdlwckmimscdwpkugkrn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbHdja21pbXNjZHdwa3Vna3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTg5OTYsImV4cCI6MjA5NDA3NDk5Nn0.vwE68cdgRZQCOHHVrFKF3tLFQRzg4modCRWMibbvAdA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
