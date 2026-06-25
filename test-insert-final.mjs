import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const { data: patients } = await supabase.from('patients').select('id').limit(1);
  const patient_id = patients?.[0]?.id || '123e4567-e89b-12d3-a456-426614174000';

  const newVisit = {
    patient_id,
    date: '2026-07-02',
    status: 'pending',
    checklist: { dynamic: {} },
    observations: '',
    last_clinical_date: '2026-06-25'
  };

  const { data, error } = await supabase.from('home_visits').insert([newVisit]).select();
  console.log('Insert Result:', data);
  console.log('Insert Error:', error);
}

testInsert();
