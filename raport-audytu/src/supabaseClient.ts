import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://irrrasxtbyorhdfulaww.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycnJhc3h0YnlvcmhkZnVsYXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTU3NjYsImV4cCI6MjA3ODE3MTc2Nn0.xsN3GCHEgoWdGkGq18aIr8eMwEijjdVp9iV8ObAYbUA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
