import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: 'test_generate_link1@yahhope.com',
    options: {
      data: { full_name: 'Test', role: 'admin' },
      redirectTo: 'https://yahhope.com/set-password'
    }
  });
  console.log(data);
}
test();
