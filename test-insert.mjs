import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const newVisit = {
    patient_id: 'some-fake-id', // Use a real patient ID if FK constraint exists
    acs_id: 'acs-1', 
    date: '2026-07-02',
    status: 'pending',
    checklist: {
      house_cleanliness: 0,
      vitamins_followed: false,
      medical_recommendations_followed: false
    },
    observations: '',
    last_clinical_date: '2026-06-25'
  };

  // We first need a real patient ID
  const { data: patients } = await supabase.from('patients').select('id').limit(1);
  if (patients && patients.length > 0) {
    newVisit.patient_id = patients[0].id;
  }

  const { data, error } = await supabase.from('home_visits').insert([newVisit]).select();
  console.log('Data:', data);
  console.log('Error:', error);
}

testInsert();
