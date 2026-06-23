const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('visit_checklist_items').select('*').limit(1);
  if (error) console.log('Error table visit_checklist_items:', error.message);
  else console.log('visit_checklist_items exists:', data);
  
  const { data: d2, error: e2 } = await supabase.from('checklist_items').select('*').limit(1);
  if (e2) console.log('Error table checklist_items:', e2.message);
  else console.log('checklist_items exists:', d2);
  
  const { data: d3, error: e3 } = await supabase.from('settings').select('*').limit(1);
  if (e3) console.log('Error table settings:', e3.message);
  else console.log('settings exists:', d3);
}
run();
