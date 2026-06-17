import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDelete() {
  const { data: users, error: fetchError } = await supabase.from('users').select('id, name').limit(5);
  console.log("Users:", users);
  
  // Just try to delete a non-existent UUID to see if we get an RLS error or if it just returns 0 count.
  const { data, error, count } = await supabase.from('users').delete({ count: 'exact' }).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Delete result:", data, error, count);
}

checkDelete();
