require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('--- Iniciando Tarefas de Admin ---');

  // 1. Sincronização de Doações
  console.log('\n1. Sincronizando Doações para o Financeiro...');
  const { data: donations, error: dError } = await supabase.from('donations').select('*');
  if (dError) {
    console.error('Erro ao buscar doações:', dError.message);
  } else if (donations && donations.length > 0) {
    let synced = 0;
    for (const d of donations) {
      // Check if already in finance
      const { data: existing } = await supabase.from('finance_transactions')
        .select('id')
        .eq('description', `Doação via ${d.payment_method} - ${d.donor_name}`)
        .eq('amount', d.amount)
        .maybeSingle();

      if (!existing) {
        await supabase.from('finance_transactions').insert({
          description: `Doação via ${d.payment_method} - ${d.donor_name}`,
          amount: d.amount,
          type: 'income',
          category_id: 'cat_donation',
          status: 'completed',
          account: d.payment_method === 'pix' ? 'PIX' : 'Stripe',
          date: d.created_at
        });
        synced++;
      }
    }
    console.log(`Sincronizadas ${synced} novas doações de um total de ${donations.length}.`);
  } else {
    console.log('Nenhuma doação encontrada.');
  }

  // 2. Apagar usuários de teste
  console.log('\n2. Apagando usuários de teste do Supabase Auth...');
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message);
  } else if (authUsers.users) {
    for (const u of authUsers.users) {
      console.log(`Deletando usuário auth: ${u.email}`);
      await supabase.auth.admin.deleteUser(u.id);
    }
    console.log(`Deletados ${authUsers.users.length} usuários de auth.`);
  }

  console.log('\nApagando registros das tabelas públicas de usuários de teste...');
  // Apagar tabela pública de usuários (o cascade vai apagar sponsorships, etc)
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  // 3. Criar Novo Admin Oficial
  console.log('\n3. Criando novo Admin contato@yahhope.com...');
  const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'contato@yahhope.com',
    password: 'Santos1992*',
    email_confirm: true
  });

  if (createError) {
    console.error('Erro ao criar admin auth:', createError.message);
  } else {
    console.log('Admin auth criado com sucesso:', newAuthUser.user.id);
    
    // Inserir na tabela pública
    const { error: insertError } = await supabase.from('users').insert({
      id: newAuthUser.user.id,
      name: 'Administrador Oficial',
      email: 'contato@yahhope.com',
      role: 'admin'
    });

    if (insertError) {
      console.error('Erro ao inserir admin na tabela users:', insertError.message);
    } else {
      console.log('Admin público criado com sucesso!');
    }
  }

  console.log('\n--- Tarefas Concluídas ---');
}

main();
