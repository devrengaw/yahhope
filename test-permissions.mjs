import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPermissionsColumn() {
  const { data, error } = await supabase.from('users').select('permissions').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

checkPermissionsColumn();
