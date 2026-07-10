import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
// We can't easily check RLS policies with anon key. But if we try to select from home_visits, we get [] due to RLS or empty table.
// If I create a patient in `children` table, and then try to insert?
