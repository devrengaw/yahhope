import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const query = `
  ALTER TABLE home_visits ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Nutricao_Acesso_HomeVisits" ON home_visits;
  CREATE POLICY "Nutricao_Acesso_HomeVisits" ON home_visits FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));
`;
supabase.rpc('exec_sql', { sql: query }).then(({data, error}) => console.log(JSON.stringify(error || data)));
