import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wamgkgaemfnkcmokxqfe.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbWdrZ2FlbWZua2Ntb2t4cWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzUxMzY4OSwiZXhwIjoyMDQ5MDkwMDg5fQ.q0-d5tB1Z4fM0s-bCgD70K9VdD4K0048X07n9XyI5tE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  const { data: donations } = await supabase.from('donations').select('*').eq('status', 'paid');
  if (donations && donations.length > 0) {
    for (const d of donations) {
      await supabase.from('finance_transactions').insert({
        description: `Doação via ${d.payment_method} - ${d.donor_name}`,
        amount: d.amount,
        type: 'income',
        category_id: 'cat_donation',
        status: 'completed',
        account: d.payment_method === 'pix' ? 'PIX' : 'Stripe',
        date: d.created_at
      });
    }
    console.log(`Foram migradas ${donations.length} doações para o Módulo Financeiro!`);
  } else {
    console.log('Nenhuma doação paga encontrada para migrar.');
  }
}

backfill();
