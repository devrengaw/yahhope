import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import 'dotenv/config';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const id = randomUUID();
supabase.from('home_visits').insert([{ patient_id: id, acs_id: id, date: '2026-07-06', status: 'pending', checklist: { dynamic: {} }, observations: '' }]).then(({error}) => console.log(JSON.stringify(error)));
