import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pawrxmkgqbfawfsqseah.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3J4bWtncWJmYXdmc3FzZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDU2ODgsImV4cCI6MjA5MDcyMTY4OH0.r2veCZk8WaoUUrfbObSE5sENQTujnM7LxwLvnMSnJzQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
