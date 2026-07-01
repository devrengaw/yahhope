import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function testSync() {
  const { data, error } = await supabase.from('clinical_events').select('*');
  console.log('Total clinical events:', data?.length);
  if (data && data.length > 0) {
    console.log('Event types:', [...new Set(data.map(d => d.event_type))]);
  }
}
testSync();
