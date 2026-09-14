import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
// Use anon key to simulate client-side request because 403 is likely RLS on the client side!
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  console.log("Testing children update...");
  let res = await supabase.from('children').update({ status: 'Adequado' }).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Children update:", res.error?.message || "Success");

  console.log("Testing clinical_events update...");
  res = await supabase.from('clinical_events').update({ weight: 10 }).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log("clinical_events update:", res.error?.message || "Success");

  console.log("Testing inventory update...");
  res = await supabase.from('inventory').update({ quantity: 10 }).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log("inventory update:", res.error?.message || "Success");

  console.log("Testing inventory_transactions insert...");
  res = await supabase.from('inventory_transactions').insert({
    item_id: '00000000-0000-0000-0000-000000000000',
    type: 'out',
    quantity: 1,
    reason: 'test'
  });
  console.log("inventory_transactions insert:", res.error?.message || "Success");

  console.log("Testing home_visits insert...");
  res = await supabase.from('home_visits').insert({
    patient_id: '00000000-0000-0000-0000-000000000000',
    status: 'pending',
    date: '2026-09-15'
  });
  console.log("home_visits insert:", res.error?.message || "Success");
}
run();
