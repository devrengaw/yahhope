import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

/**
 * Atualiza ou cria o perfil do mantenedor e seu vínculo de apadrinhamento
 * com base nos dados reais vindos da API / Webhook do Stripe.
 */
async function syncMaintainerProfile(data: {
  email: string;
  name?: string;
  phone?: string;
  isSponsor?: boolean;
  isMonthly?: boolean;
  amount?: number;
  quotasCount?: number;
  paymentMethod?: string;
  subscriptionId?: string;
  customerId?: string;
  lastSponsoredAt?: string;
}) {
  const cleanEmail = (data.email || '').toLowerCase().trim();
  if (!cleanEmail) return null;

  const donorName = data.name || cleanEmail.split('@')[0];
  const donorPhone = data.phone || null;
  const isSponsor = data.isSponsor || data.isMonthly;
  const amount = data.amount || 0;
  const paymentMethod = data.paymentMethod || 'credit_card';
  const timestamp = data.lastSponsoredAt || new Date().toISOString();

  const isMonthly = Boolean(data.isMonthly);
  const monthlyAmount = Number(data.amount || 0);

  // REGRA DE OURO:
  // - Apenas doadores MENSAIS com valor >= R$ 90,00 podem apadrinhar crianças.
  // - Crianças atribuídas a cada múltiplo inteiro de R$ 90 (90 = 1, 180 = 2, 270 = 3...).
  // - Excedentes (ex: 95) apadrinham 1 criança e o excedente apoia o projeto como um todo.
  // - Quem doa R$ 50,00 (ou qualquer valor < R$ 90) é Mantenedor Mensal de Apoio Geral (child_id = NULL).
  // - Doações avulsas/pontuais não entram na tabela 'sponsorships'.
  const canSponsorChild = isMonthly && monthlyAmount >= 90 && data.isSponsor !== false;
  const quotasCount = canSponsorChild ? Math.floor(monthlyAmount / 90) : 0;

  // 1. Atualiza ou insere o perfil na tabela 'users'
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, name, role, phone')
    .ilike('email', cleanEmail)
    .maybeSingle();

  let userId = existingUser?.id;

  if (existingUser) {
    const updates: any = {
      name: donorName || existingUser.name,
      phone: donorPhone || existingUser.phone
    };
    if (canSponsorChild) {
      updates.role = 'SPONSOR';
    } else if (isMonthly) {
      updates.role = 'MANTENEDOR';
    }
    await supabase.from('users').update(updates).eq('id', existingUser.id);
  } else {
    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({
        name: donorName,
        email: cleanEmail,
        phone: donorPhone,
        role: canSponsorChild ? 'SPONSOR' : isMonthly ? 'MANTENEDOR' : 'USER'
      })
      .select('id')
      .maybeSingle();

    if (!userErr && newUser) {
      userId = newUser.id;
    }
  }

  // 2. Se for assinatura mensal ativa, atualiza ou insere na tabela 'sponsorships'
  if (isMonthly && monthlyAmount > 0) {
    let spQuery = supabase
      .from('sponsorships')
      .select('id, child_id')
      .eq('status', 'active');

    if (userId) {
      spQuery = spQuery.or(`donor_email.ilike.${cleanEmail},sponsor_id.eq.${userId}`);
    } else {
      spQuery = spQuery.ilike('donor_email', cleanEmail);
    }

    const { data: existingSp } = await spQuery;

    if (existingSp && existingSp.length > 0) {
      const targetQuotas = canSponsorChild ? Math.max(quotasCount, existingSp.length) : existingSp.length;
      // Atualiza apadrinhamento existente dividindo o valor total pelas cotas reais
      const perQuotaAmount = targetQuotas > 1
        ? Number((monthlyAmount / targetQuotas).toFixed(2))
        : monthlyAmount;

      const existingChildIds = new Set(existingSp.map((sp: any) => sp.child_id).filter(Boolean));
      const missingCount = canSponsorChild ? Math.max(0, quotasCount - existingSp.length) : 0;
      const unassignedExisting = canSponsorChild ? existingSp.filter((sp: any) => !sp.child_id) : [];

      let extraChildIds: string[] = [];
      if (canSponsorChild && (missingCount > 0 || unassignedExisting.length > 0)) {
        const { data: allChildren } = await supabase.from('children').select('id, name').order('name');
        const { data: activeSp } = await supabase.from('sponsorships').select('child_id').eq('status', 'active');

        const spCountByChild = new Map<string, number>();
        (activeSp || []).forEach((s: any) => {
          if (s.child_id) {
            spCountByChild.set(s.child_id, (spCountByChild.get(s.child_id) || 0) + 1);
          }
        });

        const available = (allChildren || []).filter(
          (c: any) => !existingChildIds.has(c.id) && (spCountByChild.get(c.id) || 0) < 2
        );
        available.sort((a: any, b: any) => ((spCountByChild.get(a.id) || 0) - (spCountByChild.get(b.id) || 0)));

        const totalNeeded = missingCount + unassignedExisting.length;
        extraChildIds = available.slice(0, totalNeeded).map((c: any) => c.id);
        if (extraChildIds.length < totalNeeded && allChildren && allChildren.length > 0) {
          const fallbackPool = allChildren.filter((c: any) => !existingChildIds.has(c.id) && !extraChildIds.includes(c.id));
          extraChildIds = [...extraChildIds, ...fallbackPool.slice(0, totalNeeded - extraChildIds.length).map((c: any) => c.id)];
        }
      }

      for (const sp of existingSp) {
        // Se o valor for menor que R$ 90 (ex: R$ 50) ou for Mantenedor Geral explícito, desvincula qualquer criança indevida
        let finalChildId = canSponsorChild ? sp.child_id : null;
        if (canSponsorChild && !finalChildId && extraChildIds.length > 0) {
          finalChildId = extraChildIds.shift() || null;
        }

        await supabase
          .from('sponsorships')
          .update({
            child_id: finalChildId,
            donor_name: donorName,
            donor_email: cleanEmail,
            donor_phone: donorPhone,
            monthly_amount: perQuotaAmount,
            status: 'active',
            payment_method: paymentMethod,
            last_sponsored_at: timestamp,
            sponsor_id: userId || null
          })
          .eq('id', sp.id);
      }

      // Se o valor mensal dá direito a mais cotas do que os registros existentes (ex: R$ 300 = 3 crianças, tinha só 1), cria as faltantes
      for (let i = 0; i < missingCount && extraChildIds.length > 0; i++) {
        const chId = extraChildIds.shift();
        if (!chId) break;
        await supabase.from('sponsorships').insert({
          child_id: chId,
          sponsor_id: userId || null,
          donor_name: donorName,
          donor_email: cleanEmail,
          donor_phone: donorPhone,
          monthly_amount: perQuotaAmount,
          quotas_count: 1,
          status: 'active',
          payment_method: paymentMethod,
          created_at: timestamp,
          last_sponsored_at: timestamp,
          stripe_subscription_id: data.subscriptionId || null,
          stripe_customer_id: data.customerId || null
        });
      }
    } else {
      let assignedChildIds: (string | null)[] = [null];

      // Só busca e atribui criança se o valor cobrir a cota mínima de R$ 90,00!
      // Se valor > R$ 90,00, a pessoa DEVE receber mais de uma criança!
      if (canSponsorChild) {
        const { data: allChildren } = await supabase.from('children').select('id, name').order('name');
        const { data: activeSp } = await supabase.from('sponsorships').select('child_id').eq('status', 'active');
        
        const spCountByChild = new Map<string, number>();
        (activeSp || []).forEach((s: any) => {
          if (s.child_id) {
            spCountByChild.set(s.child_id, (spCountByChild.get(s.child_id) || 0) + 1);
          }
        });

        const available = (allChildren || []).filter((c: any) => (spCountByChild.get(c.id) || 0) < 2);
        available.sort((a: any, b: any) => ((spCountByChild.get(a.id) || 0) - (spCountByChild.get(b.id) || 0)));

        const needed = Math.max(quotasCount, 1);
        assignedChildIds = available.slice(0, needed).map((c: any) => c.id);
        if (assignedChildIds.length === 0) {
          // Não há mais crianças disponíveis para apadrinhamento; segue como Mantenedor sem criança vinculada
          assignedChildIds = [null];
        }
      }

      for (const chId of assignedChildIds) {
        await supabase.from('sponsorships').insert({
          child_id: chId, // NULL para doadores de R$ 50 (Apoio Geral)
          sponsor_id: userId || null,
          donor_name: donorName,
          donor_email: cleanEmail,
          donor_phone: donorPhone,
          monthly_amount: quotasCount > 1 ? monthlyAmount / quotasCount : monthlyAmount,
          quotas_count: 1,
          status: 'active',
          payment_method: paymentMethod,
          created_at: timestamp,
          last_sponsored_at: timestamp,
          stripe_subscription_id: data.subscriptionId || null,
          stripe_customer_id: data.customerId || null
        });
      }
    }
  } else {
    // Doação avulsa não deve apagar apadrinhamentos/mantenedores recorrentes ativos;
    // apenas cancelamentos/exclusões de assinatura devem desativar sponsorships.
    console.log(`[syncMaintainerProfile] Doação avulsa para ${cleanEmail}; mantendo eventuais apadrinhamentos ativos intactos.`);
  }

  return { userId, cleanEmail, donorName };
}

/**
 * Busca direta no Stripe: consulta assinaturas, clientes e cobranças
 * e sincroniza todos os mantenedores reais no banco.
 */
async function handleStripeSync(filterEmail?: string) {
  const results = {
    synced_customers: 0,
    synced_maintainers: 0,
    synced_subscriptions: 0,
    synced_donations: 0,
    total_amount: 0,
    details: [] as any[]
  };

  try {
    console.log('Iniciando sincronização completa de clientes, assinaturas e cobranças no Stripe...');

    // 1. Busca todos os clientes cadastrados na Stripe (garante os 27 clientes)
    const customers = await stripe.customers.list({
      limit: 100
    });
    console.log(`Localizados ${customers.data.length} clientes na Stripe.`);

    // 2. Busca todas as assinaturas (ativas, canceladas, trialing, etc.)
    const subscriptions = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      expand: ['data.customer']
    });
    console.log(`Localizadas ${subscriptions.data.length} assinaturas na Stripe.`);

    // Mapa de assinaturas ativas por customer ID e por email
    const subsByCustomer = new Map<string, any>();
    const subsByEmail = new Map<string, any>();

    for (const sub of subscriptions.data) {
      let customer: any = sub.customer;
      const custId = typeof customer === 'string' ? customer : customer?.id;
      const custEmail = (typeof customer === 'object' ? customer?.email : sub.metadata?.donorEmail || '')?.toLowerCase().trim();

      const isActive = sub.status === 'active' || sub.status === 'trialing';
      if (custId && (isActive || !subsByCustomer.has(custId))) {
        subsByCustomer.set(custId, sub);
      }
      if (custEmail && (isActive || !subsByEmail.has(custEmail))) {
        subsByEmail.set(custEmail, sub);
      }
    }

    // Listas oficiais dos 8 assinantes Stripe:
    const CONFIRMED_STRIPE_PADRINHOS = new Set([
      'lucas.wagneer@gmail.com',
      'jonata_xx@hotmail.com',
      'diegott@ymail.com'
    ]);

    const CONFIRMED_STRIPE_MANTENEDORES = new Set([
      'messiasletic@gmail.com',
      'gerson.simionato@gmail.com',
      'fe.carmagnani@hotmail.com',
      'jesspenido@gmail.com',
      'gabrielbertoline1202@yahoo.com'
    ]);

    // 3. Processa e garante o cadastro de cada cliente da Stripe no banco
    for (const customer of customers.data) {
      const email = (customer.email || '').toLowerCase().trim();
      if (!email) continue;
      if (filterEmail && email !== filterEmail.toLowerCase().trim()) continue;

      const name = customer.name || email.split('@')[0];
      const phone = customer.phone || null;

      const isKnownPadrinho = CONFIRMED_STRIPE_PADRINHOS.has(email);
      const isKnownMantenedor = CONFIRMED_STRIPE_MANTENEDORES.has(email);

      const sub = subsByCustomer.get(customer.id) || subsByEmail.get(email);
      const hasActiveSub = Boolean(sub && (sub.status === 'active' || sub.status === 'trialing'));
      const hasCanceledOrUnpaidSub = Boolean(sub && !hasActiveSub);

      // Se existe assinatura na Stripe e ela foi cancelada / cortada por falta de pagamento, desativa no banco!
      if (hasCanceledOrUnpaidSub) {
        await supabase.from('sponsorships').update({ status: 'inactive' }).ilike('donor_email', email);
        await supabase.from('users').update({ status: 'inactive' }).ilike('email', email);
        results.synced_customers++;
        continue;
      }
      
      const isMonthly = isKnownPadrinho || isKnownMantenedor || hasActiveSub;
      
      const stripeUnitAmount = sub?.items?.data?.[0]?.price?.unit_amount
        ? sub.items.data[0].price.unit_amount / 100
        : 0;

      let subAmount = 0;
      if (hasActiveSub && stripeUnitAmount > 0) {
        subAmount = stripeUnitAmount;
      } else if (isKnownPadrinho) {
        subAmount = 90;
      } else if (isKnownMantenedor) {
        subAmount = 50;
      } else if (hasActiveSub) {
        subAmount = 90;
      }

      await syncMaintainerProfile({
        email,
        name,
        phone,
        isSponsor: !isKnownMantenedor && (isKnownPadrinho || subAmount >= 90),
        isMonthly: isMonthly,
        amount: subAmount,
        lastSponsoredAt: sub ? new Date(sub.current_period_start * 1000).toISOString() : new Date(customer.created * 1000).toISOString(),
        paymentMethod: 'credit_card',
        subscriptionId: sub?.id,
        customerId: customer.id
      });

      results.synced_customers++;
      if (isMonthly) {
        results.synced_maintainers++;
        results.synced_subscriptions++;
      }
    }

    // Pega a primeira campanha da régua para associar cobranças avulsas
    const { data: firstCamp } = await supabase
      .from('campaigns')
      .select('id, current_amount')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle();

    // 4. Busca faturas pagas (invoices) das assinaturas
    const invoices = await stripe.invoices.list({
      status: 'paid',
      limit: 100
    });

    for (const inv of invoices.data) {
      const email = (inv.customer_email || '').toLowerCase().trim();
      if (!email) continue;
      if (filterEmail && email !== filterEmail.toLowerCase().trim()) continue;

      const amount = inv.amount_paid ? inv.amount_paid / 100 : 0;
      if (amount <= 0) continue;

      const paymentId = (inv.payment_intent as string) || inv.id;
      const invDateIso = new Date(inv.created * 1000).toISOString();
      const donorName = inv.customer_name || email.split('@')[0];
      const isPadrinhoInv = !CONFIRMED_STRIPE_MANTENEDORES.has(email) && (CONFIRMED_STRIPE_PADRINHOS.has(email) || amount >= 90);

      const { data: existingDonation } = await supabase
        .from('donations')
        .select('id')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle();

      if (!existingDonation) {
        await supabase.from('donations').insert({
          campaign_id: null,
          donor_name: donorName,
          donor_email: email,
          donor_phone: inv.customer_phone || null,
          amount,
          status: 'paid',
          payment_method: 'credit_card',
          created_at: invDateIso,
          paid_at: invDateIso,
          stripe_payment_id: paymentId,
          stripe_subscription_id: (inv.subscription as string) || null,
          is_sponsorship: isPadrinhoInv
        });
        results.synced_donations++;
        results.total_amount += amount;
      }

      // Garante que a entrada também exista em finance_transactions (ex: faturas de Novembro)
      const invDayPrefix = invDateIso.slice(0, 10);
      const { data: existingFinTx } = await supabase
        .from('finance_transactions')
        .select('id')
        .eq('type', 'income')
        .eq('amount', amount)
        .gte('date', `${invDayPrefix}T00:00:00`)
        .lte('date', `${invDayPrefix}T23:59:59`)
        .ilike('description', `%${donorName}%`)
        .limit(1)
        .maybeSingle();

      if (!existingFinTx) {
        await supabase.from('finance_transactions').insert({
          description: `${isPadrinhoInv ? 'Apadrinhamento Mensal Stripe' : 'Mantenedor Mensal Stripe'} - ${donorName}`,
          amount,
          type: 'income',
          category_id: isPadrinhoInv ? 'cat_sponsorship' : 'cat_donations',
          status: 'completed',
          account: 'Stripe',
          date: invDateIso
        });
      }
    }

    // 5. Busca cobranças avulsas aprovadas na Stripe (exclui faturas de assinatura já processadas acima)
    const charges = await stripe.charges.list({
      limit: 100
    });

    for (const charge of charges.data) {
      if (charge.status !== 'succeeded') continue;
      if (charge.invoice) continue;
      const email = (charge.billing_details?.email || charge.receipt_email || '').toLowerCase().trim();
      if (!email) continue;
      if (filterEmail && email !== filterEmail.toLowerCase().trim()) continue;

      const amount = charge.amount / 100;
      const paymentDate = new Date(charge.created * 1000).toISOString();
      const paymentMethod = charge.payment_method_details?.type === 'pix' ? 'pix' : 'credit_card';
      const paymentId = charge.id;
      const donorName = charge.billing_details?.name || email.split('@')[0];

      const { data: existingDonation } = await supabase
        .from('donations')
        .select('id')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle();

      if (!existingDonation) {
        await supabase.from('donations').insert({
          campaign_id: firstCamp?.id || null,
          donor_name: donorName,
          donor_email: email,
          donor_phone: charge.billing_details?.phone || null,
          amount,
          status: 'paid',
          payment_method: paymentMethod,
          created_at: paymentDate,
          paid_at: paymentDate,
          stripe_payment_id: paymentId,
          is_sponsorship: false
        });
        results.synced_donations++;
        results.total_amount += amount;
      }

      const dayPrefix = paymentDate.slice(0, 10);
      const { data: existingFinTx } = await supabase
        .from('finance_transactions')
        .select('id')
        .eq('type', 'income')
        .eq('amount', amount)
        .gte('date', `${dayPrefix}T00:00:00`)
        .lte('date', `${dayPrefix}T23:59:59`)
        .ilike('description', `%${donorName}%`)
        .limit(1)
        .maybeSingle();

      if (!existingFinTx) {
        await supabase.from('finance_transactions').insert({
          description: `Doação via Stripe (${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}) - ${donorName}`,
          amount,
          type: 'income',
          category_id: 'cat_donation',
          status: 'completed',
          account: 'Stripe',
          date: paymentDate
        });
      }
    }

    // 6. Atualiza a arrecadação da Fase 1 com os valores reais consolidados
    if (firstCamp) {
      const { data: allPaidDonations } = await supabase.from('donations').select('amount').eq('status', 'paid');
      const { data: allActiveSp } = await supabase.from('sponsorships').select('monthly_amount').eq('status', 'active');

      const sumDonations = (allPaidDonations || []).reduce((acc: number, d: any) => acc + (Number(d.amount) || 0), 0);
      const sumSponsorships = (allActiveSp || []).reduce((acc: number, s: any) => acc + (Number(s.monthly_amount) || 0), 0);
      const realTotal = sumDonations + sumSponsorships;

      await supabase.from('campaigns').update({
        current_amount: realTotal,
        last_reset_at: null,
        is_active: true
      }).eq('id', firstCamp.id);
    }

    return {
      success: true,
      message: `Sincronização Stripe concluída com sucesso: ${results.synced_customers} cliente(s), ${results.synced_subscriptions} apadrinhamento(s) e ${results.synced_donations} doação(ões) recuperadas.`,
      ...results
    };
  } catch (err: any) {
    console.error('Erro na sincronização Stripe:', err);
    return {
      success: false,
      error: err.message,
      ...results
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const url = new URL(req.url)

    // Se for chamada manual sem assinatura (ex: Painel Admin ou ação de sincronização)
    if (!signature) {
      let bodyJson: any = {}
      try {
        const rawText = await req.text()
        if (rawText) bodyJson = JSON.parse(rawText)
      } catch {}

      const action = url.searchParams.get('action') || bodyJson.action || 'sync'
      const filterEmail = url.searchParams.get('email') || bodyJson.email

      if (action === 'sync' || action === 'sync_stripe' || action === 'search') {
        const syncResult = await handleStripeSync(filterEmail)
        return new Response(JSON.stringify(syncResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      return new Response(JSON.stringify({ error: 'Nenhuma assinatura Stripe ou ação válida fornecida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Processamento de Webhook com Assinatura da Stripe
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    let event: any
    try {
      if (webhookSecret) {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      } else {
        event = JSON.parse(body)
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`Stripe Event recebido: ${event.type}`)

    // 1. EVENTO: CHECKOUT SESSION COMPLETED
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      
      let customer: any = null
      if (session.customer) {
        try {
          customer = await stripe.customers.retrieve(session.customer as string)
        } catch (cErr) {
          console.warn('Aviso ao consultar customer no Stripe:', cErr)
        }
      }

      const donorName = customer?.name || session.metadata?.donorName || session.customer_details?.name || 'Apoiador YAH Hope'
      const rawDonorEmail = customer?.email || session.customer_details?.email || session.metadata?.donorEmail || ''
      const donorEmail = rawDonorEmail.toLowerCase().trim()
      const donorPhone = customer?.phone || session.customer_details?.phone || session.metadata?.donorPhone || null
      const amount = session.amount_total ? session.amount_total / 100 : 0
      const isSponsorship = session.metadata?.type === 'sponsorship' || session.mode === 'subscription'
      const isMonthly = session.metadata?.isMonthly === 'true' || session.mode === 'subscription'
      const quotasCount = Number(session.metadata?.quotasCount) || 1
      const isPix = session.metadata?.paymentMethod === 'pix' || session.payment_method_types?.includes('pix')
      const paymentMethod = isPix ? 'pix' : 'credit_card'

      // Verifica antes de inserir se já é doador/padrinho/mantenedor recorrente para não repetir e-mail de boas-vindas todo mês
      let isRepeatSupporter = false
      if (donorEmail) {
        const [{ data: prevDonations }, { data: prevSp }] = await Promise.all([
          supabase.from('donations').select('id').ilike('donor_email', donorEmail).eq('status', 'paid').limit(1),
          supabase.from('sponsorships').select('id').ilike('donor_email', donorEmail).eq('status', 'active').limit(1)
        ])
        isRepeatSupporter = Boolean((prevDonations && prevDonations.length > 0) || (prevSp && prevSp.length > 0))
      }

      // Atualiza o perfil do mantenedor e apadrinhamento
      const syncResult = await syncMaintainerProfile({
        email: donorEmail,
        name: donorName,
        phone: donorPhone,
        isSponsor: isSponsorship || isMonthly,
        isMonthly,
        amount,
        quotasCount,
        paymentMethod,
        subscriptionId: session.subscription as string,
        customerId: session.customer as string
      })
      const resolvedUserId = syncResult?.userId || null

      // Registra automaticamente na base unificada de e-mails (sem reativar quem já cancelou recebimento)
      if (donorEmail && donorEmail.includes('@')) {
        await supabase.from('newsletter_subscribers').upsert({
          id: `sub_${crypto.randomUUID()}`,
          email: donorEmail,
          status: 'active',
          source: isSponsorship ? 'Apadrinhamento Stripe' : isMonthly ? 'Mantenedor Stripe' : 'Doação Stripe'
        }, { onConflict: 'email', ignoreDuplicates: true })
      }

      // Busca a campanha para associar à doação
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, current_amount')
        .order('priority', { ascending: true })
        .limit(1)

      const campaignId = campaigns?.[0]?.id

      // Registra a doação na tabela 'donations' para somatória completa do apoiador
      if (amount > 0) {
        await supabase.from('donations').insert({
          campaign_id: (isSponsorship || isMonthly) ? null : (campaignId || null),
          donor_name: donorName,
          donor_email: donorEmail,
          donor_phone: donorPhone,
          amount: amount,
          status: 'paid',
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
          user_id: resolvedUserId,
          is_sponsorship: isSponsorship || isMonthly,
          stripe_payment_id: session.payment_intent || session.id,
          stripe_subscription_id: session.subscription || null
        })

        if (!isSponsorship && !isMonthly && campaignId) {
          const newTotal = Number(campaigns[0].current_amount || 0) + amount
          await supabase.from('campaigns').update({
            current_amount: newTotal,
            last_reset_at: null
          }).eq('id', campaignId)

          await supabase.from('finance_transactions').insert({
            description: `Doação via Stripe (${isPix ? 'PIX' : 'Cartão'}) - ${donorName}`,
            amount: amount,
            type: 'income',
            category_id: 'cat_donation',
            status: 'completed',
            account: 'Stripe',
            date: new Date().toISOString()
          })
        }
      }

      // Busca as crianças reais vinculadas ao padrinho após a sincronização
      let assignedChildren: any[] = []
      if (isSponsorship || (isMonthly && amount >= 90)) {
        let chQuery = supabase
          .from('sponsorships')
          .select('child_id, children(id, name, dob, gender, address, province, photo_url, story)')
          .eq('status', 'active')
          .not('child_id', 'is', null)

        if (resolvedUserId) {
          chQuery = chQuery.or(`donor_email.ilike.${donorEmail},sponsor_id.eq.${resolvedUserId}`)
        } else {
          chQuery = chQuery.ilike('donor_email', donorEmail)
        }

        const { data: spWithChildren } = await chQuery
        const seenIds = new Set<string>()
        assignedChildren = (spWithChildren || [])
          .map((row: any) => row.children)
          .filter((c: any) => {
            if (!c || !c.id || seenIds.has(c.id)) return false
            seenIds.add(c.id)
            return true
          })
      }

      // Envia e-mail de boas-vindas apenas na primeira doação/assinatura; para apoiadores recorrentes ou já cadastrados, evita repetir "Bem-vindo" todo mês
      if ((isSponsorship || isMonthly) && isRepeatSupporter) {
        console.log(`E-mail de boas-vindas ignorado para ${donorEmail}: apoiador já possui histórico ativo.`)
      } else {
        await sendThankYouEmail(donorEmail, donorName, {
          isSponsorship,
          isMonthly,
          amount,
          children: assignedChildren,
          isRepeatDonor: isRepeatSupporter
        })
      }
    }

    // 2. EVENTO: INVOICE PAYMENT SUCCEEDED (Recorrência Mensal Confirmada)
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any
      const amount = invoice.amount_paid ? invoice.amount_paid / 100 : 0

      let customer: any = null
      if (invoice.customer) {
        try {
          customer = await stripe.customers.retrieve(invoice.customer as string)
        } catch {}
      }

      const rawEmail = customer?.email || invoice.customer_email || ''
      const email = rawEmail.toLowerCase().trim()
      const name = customer?.name || invoice.customer_name || 'Mantenedor YAH Hope'
      const phone = customer?.phone || null

      if (email && amount > 0) {
        const isPadrinho = amount >= 90
        const syncResult = await syncMaintainerProfile({
          email,
          name,
          phone,
          isSponsor: isPadrinho,
          isMonthly: true,
          amount,
          subscriptionId: invoice.subscription as string,
          customerId: invoice.customer as string,
          lastSponsoredAt: new Date().toISOString()
        })
        const resolvedUserId = syncResult?.userId || null

        // Registra automaticamente na base unificada de e-mails (sem reativar quem já cancelou recebimento)
        if (email && email.includes('@')) {
          await supabase.from('newsletter_subscribers').upsert({
            id: `sub_${crypto.randomUUID()}`,
            email: email,
            status: 'active',
            source: isPadrinho ? 'Apadrinhamento Stripe' : 'Mantenedor Stripe'
          }, { onConflict: 'email', ignoreDuplicates: true })
        }

        // Evita duplicar se for o primeiro pagamento do checkout que acabou de criar o invoice
        const paymentIdentifier = invoice.payment_intent || invoice.id
        const { data: existingDonation } = await supabase
          .from('donations')
          .select('id')
          .eq('stripe_payment_id', paymentIdentifier)
          .maybeSingle()

        if (!existingDonation) {
          await supabase.from('donations').insert({
            donor_name: name,
            donor_email: email,
            donor_phone: phone,
            amount: amount,
            status: 'paid',
            payment_method: 'credit_card',
            paid_at: new Date().toISOString(),
            user_id: resolvedUserId,
            is_sponsorship: isPadrinho,
            stripe_payment_id: paymentIdentifier,
            stripe_subscription_id: invoice.subscription as string
          })

          await supabase.from('finance_transactions').insert({
            description: `${isPadrinho ? 'Apadrinhamento Mensal Stripe' : 'Mantenedor Mensal Stripe'} - ${name}`,
            amount: amount,
            type: 'income',
            category_id: isPadrinho ? 'cat_sponsorship' : 'cat_donations',
            status: 'completed',
            account: 'Stripe',
            date: new Date().toISOString()
          })
        }
      }
    }

    // 3. EVENTO: SUBSCRIPTION UPDATED / DELETED
    else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      const isInactive =
        event.type === 'customer.subscription.deleted' ||
        ['canceled', 'unpaid', 'past_due', 'incomplete_expired'].includes(subscription.status)
      const status = isInactive ? 'inactive' : subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'paused'

      let customer: any = null
      if (subscription.customer) {
        try {
          customer = await stripe.customers.retrieve(subscription.customer as string)
        } catch {}
      }

      const email = customer?.email || ''
      if (email) {
        const cleanEmail = email.toLowerCase().trim()
        await supabase
          .from('sponsorships')
          .update({ status })
          .ilike('donor_email', cleanEmail)

        await supabase
          .from('users')
          .update({ status: isInactive ? 'inactive' : 'active' })
          .ilike('email', cleanEmail)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Webhook processing failed:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function formatChildAgeForEmail(dobString?: string): string {
  if (!dobString) return 'Idade em acompanhamento'
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return 'Idade em acompanhamento'
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`
  return `${months} ${months === 1 ? 'mês' : 'meses'}`
}

async function sendThankYouEmail(donorEmail: string, donorName: string, meta?: { isSponsorship?: boolean; isMonthly?: boolean; amount?: number; children?: any[]; isRepeatDonor?: boolean }) {
  if (!donorEmail) return
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) return

  try {
    let logoUrl = 'https://www.yahhope.com/logo-black.png'
    let logoLinkUrl = 'https://www.yahhope.com'
    let primaryColor = '#F49853'
    
    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).maybeSingle()
    if (settings) {
      if (settings.logo_url && !settings.logo_url.includes('Logo+icone.png') && !settings.logo_url.includes('hope.yahchurch.com/wp-content')) logoUrl = settings.logo_url
      if (settings.logo_link_url) logoLinkUrl = settings.logo_link_url
      if (settings.primary_color) primaryColor = settings.primary_color
    }

    const childrenList = meta?.children || []
    const isSponsorWithChild = childrenList.length > 0
    const isMaintainer = !isSponsorWithChild && Boolean(meta?.isMonthly)
    const targetTemplateName = isSponsorWithChild
      ? 'new_sponsor'
      : isMaintainer
        ? 'new_maintainer'
        : 'donation_thank_you'

    // Carrega o template correspondente configurado em Comunicação > E-mails
    let { data: templateData } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', targetTemplateName)
      .maybeSingle()

    if (!templateData && targetTemplateName === 'new_sponsor') {
      const { data: fallbackTpl } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', 'donation_thank_you')
        .maybeSingle()
      templateData = fallbackTpl
    }

    // Trava de segurança: Se o template estiver explicitamente desativado, não envia
    if (templateData && templateData.is_active === false) {
      console.log(`Disparo de agradecimento ignorado: template ${templateData.name} está desativado.`)
      return
    }

    const defaultSubject = isSponsorWithChild
      ? 'Bem-vindo à família YAH Hope! 🧡 Finalize seu cadastro'
      : isMaintainer
        ? 'Obrigado por se tornar um mantenedor da YAH Hope! 🧡'
        : 'Obrigado pelo seu apoio! 🧡 Finalize seu cadastro'
    const defaultPreheader = isSponsorWithChild
      ? 'Seu apoio mensal como padrinho e mantenedor transforma vidas.'
      : isMaintainer
        ? 'Seu apoio mensal transforma vidas na Casa Nutri.'
        : 'Crie sua senha de acesso para acompanhar o impacto da sua doação no portal.'
    const defaultHeading = isSponsorWithChild
      ? 'Obrigado por se tornar um padrinho!'
      : isMaintainer
        ? 'Obrigado por se tornar um mantenedor!'
        : 'Obrigado por transformar vidas!'
    const defaultBody = isSponsorWithChild
      ? `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Estamos muito felizes em receber você como mantenedor e apadrinhador! Seu apoio mensal será fundamental para garantir alimentação, desenvolvimento e cuidado diário para as crianças.</p><p><br></p><p>Para acompanhar as fotos da criança atendida, novidades e relatórios de transparência, finalize o seu cadastro no portal criando sua senha:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`
      : isMaintainer
        ? `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Estamos muito felizes em receber você como mantenedor mensal da YAH Hope! A sua contribuição contínua garante alimentação, nutrição terapêutica e cuidado diário para as crianças atendidas pela nossa missão.</p><p><br></p><p>Para acompanhar os relatórios de impacto, novidades e acessar sua área exclusiva no site, finalize o seu cadastro criando sua senha de acesso:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`
        : `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Nós da YAH Hope queremos agradecer de todo o coração pela sua contribuição! Seja através de uma doação pontual, apoio mensal recorrente ou apadrinhamento, o seu gesto garante nutrição, educação e dignidade para as nossas crianças.</p><p><br></p><p>Para acompanhar os relatórios de impacto, ver fotos das nossas crianças e acessar sua área exclusiva, finalize o seu cadastro no portal criando sua senha de acesso:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`
    const defaultCtaText = isSponsorWithChild
      ? 'Finalizar Cadastro de Padrinho'
      : isMaintainer
        ? 'Acessar Portal do Mantenedor'
        : 'Finalizar Meu Cadastro'

    const childrenNames = childrenList.map((c: any) => c.name).filter(Boolean).join(', ')

    let subject = (templateData?.subject || defaultSubject)
      .replace(/{{nome_doador}}/gi, donorName || 'Amigo(a)')
      .replace(/{{nome}}/gi, donorName || 'Amigo(a)')
      .replace(/{{nome_crianca}}/gi, childrenNames || 'sua criança apadrinhada')
    let preheader = templateData?.preheader || defaultPreheader
    let heading = (templateData?.heading || defaultHeading)
      .replace(/{{nome_doador}}/gi, donorName || 'Amigo(a)')
      .replace(/{{nome}}/gi, donorName || 'Amigo(a)')
      .replace(/{{nome_crianca}}/gi, childrenNames || 'sua criança apadrinhada')
    let body = templateData?.body || defaultBody
    let hasCta = templateData?.has_cta ?? true
    let ctaText = templateData?.cta_text || defaultCtaText
    let ctaUrl = templateData?.cta_url || 'https://yahhope.com/finalizar-cadastro'

    // Personaliza corpo do texto
    let personalizedBody = body
      .replace(/{{nome_doador}}/gi, donorName || 'Amigo(a)')
      .replace(/{{nome}}/gi, donorName || 'Amigo(a)')
      .replace(/{{email}}/gi, donorEmail)
      .replace(/{{nome_crianca}}/gi, childrenNames || 'sua criança apadrinhada')

    const SANS_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

    // Normaliza tags HTML
    if (!personalizedBody.includes('<p>') && !personalizedBody.includes('<p ') && !personalizedBody.includes('<div>')) {
      personalizedBody = personalizedBody
        .split(/\n\s*\n/)
        .map(para => `<p style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 16px 0;">${para.replace(/\n/g, '<br />')}</p>`)
        .join('')
    } else {
      personalizedBody = personalizedBody
        .replace(/<p(\s+[^>]*)?>/gi, `<p style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 16px 0;">`)
        .replace(/<h1(\s+[^>]*)?>/gi, `<h1 style="font-family: ${SANS_STACK}; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; margin: 24px 0 12px 0;">`)
        .replace(/<h2(\s+[^>]*)?>/gi, `<h2 style="font-family: ${SANS_STACK}; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.35; margin: 20px 0 10px 0;">`)
        .replace(/<h3(\s+[^>]*)?>/gi, `<h3 style="font-family: ${SANS_STACK}; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4; margin: 16px 0 8px 0;">`)
        .replace(/<ul(\s+[^>]*)?>/gi, `<ul style="margin: 0 0 16px 0; padding-left: 24px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">`)
        .replace(/<ol(\s+[^>]*)?>/gi, `<ol style="margin: 0 0 16px 0; padding-left: 24px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">`)
        .replace(/<li(\s+[^>]*)?>/gi, `<li style="margin-bottom: 6px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">`)
    }

    // Cards da(s) criança(s) real(is) apadrinhada(s)
    const childrenCardsHtml = childrenList.length > 0
      ? `<div style="margin: 24px 0 8px 0;">
          ${childrenList.map((c: any, idx: number) => {
            const photoSrc = c.photo_url && String(c.photo_url).trim().length > 0
              ? c.photo_url
              : logoUrl
            const genderLabel = c.gender === 'F' ? 'Menina' : 'Menino'
            const ageText = formatChildAgeForEmail(c.dob)
            const community = c.address || c.province || 'Casa Nutri - Nampula'
            const story = c.story || 'Acompanhada com muito amor e carinho pela equipe clínica da Casa Nutri em Moçambique, recebendo fórmula terapêutica, alimentação balanceada e exames regulares.'
            const label = childrenList.length > 1 ? `Criança Apadrinhada #${idx + 1}` : 'Seu Novo Afilhado(a)'
            return `
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 16px;">
                <div style="background-color: #0f172a; padding: 10px 18px; color: #ffffff;">
                  <span style="font-family: ${SANS_STACK}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: ${primaryColor};">${label}</span>
                </div>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width: 110px; vertical-align: top; padding: 16px 0 16px 16px;">
                      <img src="${photoSrc}" alt="${c.name}" width="96" height="96" style="width: 96px; height: 96px; object-fit: cover; border-radius: 12px; border: 2px solid ${primaryColor}; display: block;" />
                    </td>
                    <td style="vertical-align: top; padding: 16px;">
                      <div style="display: inline-block; background-color: #fff7ed; color: #ea580c; font-family: ${SANS_STACK}; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 12px; margin-bottom: 6px;">
                        ${genderLabel} • ${ageText}
                      </div>
                      <h3 style="margin: 0 0 4px 0; font-family: ${SANS_STACK}; font-size: 18px; font-weight: 800; color: #0f172a;">${c.name}</h3>
                      <p style="margin: 0 0 8px 0; font-family: ${SANS_STACK}; font-size: 12px; color: #64748b; font-weight: 600;">📍 ${community}</p>
                      <p style="margin: 0; font-family: ${SANS_STACK}; font-size: 13px; line-height: 1.5; color: #334155;">${story}</p>
                    </td>
                  </tr>
                </table>
              </div>
            `
          }).join('')}
        </div>`
      : ''

    // Botão de Finalização de Cadastro (CTA) ou Portal se já for doador recorrente
    let ctaHtml = ''
    if (hasCta && ctaText && ctaUrl) {
      let effectiveCtaText = ctaText
      let effectiveCtaUrl = ctaUrl
      if (meta?.isRepeatDonor) {
        effectiveCtaText = 'Acessar Portal do Apoiador'
        effectiveCtaUrl = 'https://www.yahhope.com/portal/dashboard'
      }
      // Concatena parâmetros de e-mail e nome para preencher automaticamente na tela de finalização
      const sep = effectiveCtaUrl.includes('?') ? '&' : '?'
      const targetCtaUrl = (effectiveCtaUrl.includes('cadastro') || effectiveCtaUrl.includes('finalizar') || effectiveCtaUrl.includes('portal') || effectiveCtaUrl.includes('set-password'))
        ? `${effectiveCtaUrl}${sep}email=${encodeURIComponent(donorEmail)}&name=${encodeURIComponent(donorName)}`
        : effectiveCtaUrl

      ctaHtml = `
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 32px auto 12px auto; text-align: center;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: ${primaryColor}; box-shadow: 0 4px 14px rgba(244, 152, 83, 0.35);">
              <a href="${targetCtaUrl}" target="_blank" style="display: inline-block; padding: 15px 34px; font-family: ${SANS_STACK}; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.01em; -webkit-text-size-adjust: none;">
                ${effectiveCtaText}
              </a>
            </td>
          </tr>
        </table>
      `
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${subject}</title>
        <style type="text/css">
          body, table, td, p, a, li {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            font-family: ${SANS_STACK} !important;
          }
          body { margin: 0; padding: 0; background-color: #f1f5f9; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: ${SANS_STACK}; color: #334155; -webkit-font-smoothing: antialiased;">
        ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #ffffff;">${preheader}</div>` : ''}
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; margin: 0 auto;">
                <!-- Header com Logo Branded -->
                <tr>
                  <td align="center" style="padding: 36px 32px 20px 32px; text-align: center;">
                    <a href="${logoLinkUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img 
                        src="${logoUrl}" 
                        alt="YAH Hope" 
                        width="160" 
                        border="0"
                        style="display: block; margin: 0 auto; width: 160px; max-width: 160px; height: auto; border: 0; outline: none; text-decoration: none;" 
                      />
                    </a>
                    <div style="height: 3px; width: 44px; background-color: ${primaryColor}; margin: 20px auto 0 auto; border-radius: 999px;"></div>
                  </td>
                </tr>

                <!-- Título se houver -->
                ${heading ? `
                <tr>
                  <td align="center" style="padding: 8px 36px 4px 36px; text-align: center;">
                    <h1 style="margin: 0; font-family: ${SANS_STACK}; font-size: 22px; font-weight: 800; color: ${primaryColor}; line-height: 1.35;">
                      ${heading}
                    </h1>
                  </td>
                </tr>` : ''}

                <!-- Conteúdo Principal -->
                <tr>
                  <td style="padding: 20px 36px 36px 36px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                    <div style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                      ${personalizedBody}
                    </div>
                    ${childrenCardsHtml}
                    ${ctaHtml}
                  </td>
                </tr>

                <!-- Rodapé Branded -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 28px 36px; text-align: center; border-top: 1px solid #f1f5f9; font-family: ${SANS_STACK}; font-size: 12px; line-height: 1.6; color: #64748b;">
                    <p style="margin: 0 0 6px 0; font-family: ${SANS_STACK}; font-size: 13px; font-weight: 700; color: #334155;">
                      YAH Hope
                    </p>
                    <p style="margin: 0 0 10px 0; font-family: ${SANS_STACK}; font-size: 12px; color: #64748b;">
                      Você está recebendo este e-mail por apoiar os projetos oficiais da Associação YAH Hope.
                    </p>
                    <p style="margin: 0 0 10px 0; font-family: ${SANS_STACK}; font-size: 11px; color: #94a3b8;">
                      Não deseja mais receber nossos e-mails? <a href="${supabaseUrl}/functions/v1/track-campaign?t=u&email=${encodeURIComponent(donorEmail)}&cid=${targetTemplateName}" target="_blank" style="color: #64748b; text-decoration: underline;">Cancelar recebimento</a>
                    </p>
                    <p style="margin: 0; font-family: ${SANS_STACK}; font-size: 11px; color: #94a3b8;">
                      © ${new Date().getFullYear()} Associação YAH Hope. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'YAH Hope <contato@yahhope.com>',
        to: donorEmail,
        subject: subject,
        html: htmlBody,
        reply_to: 'contato@yahhope.com'
      })
    })
    const resendData = await resendRes.json().catch(() => ({}))

    try {
      const nowIso = new Date().toISOString()
      const autoTitle = isSponsorWithChild
        ? '[Automático] Boas-vindas Padrinho'
        : isMaintainer
          ? '[Automático] Boas-vindas Mantenedor'
          : '[Automático] Agradecimento de Doação'
      const { data: campRow } = await supabase
        .from('email_campaigns')
        .insert({
          title: autoTitle,
          subject,
          preheader,
          heading,
          body_html: personalizedBody,
          sender_name: 'YAH Hope',
          sender_email: 'contato@yahhope.com',
          audience_type: 'automatico',
          audience_summary: `Disparo automático Stripe (${donorEmail})`,
          has_cta: Boolean(hasCta),
          cta_text: ctaText,
          cta_url: ctaUrl,
          status: resendRes.ok ? 'sent' : 'failed',
          total_recipients: 1,
          sent_count: resendRes.ok ? 1 : 0,
          delivered_count: resendRes.ok ? 1 : 0,
          failed_count: resendRes.ok ? 0 : 1,
          sent_at: nowIso
        })
        .select('id')
        .maybeSingle()

      if (campRow?.id) {
        await supabase.from('email_campaign_recipients').insert({
          campaign_id: campRow.id,
          email: donorEmail.toLowerCase().trim(),
          name: donorName,
          recipient_type: isSponsorWithChild ? 'sponsor' : 'donor',
          status: resendRes.ok ? 'sent' : 'failed',
          resend_id: resendData?.id || null,
          error_message: resendRes.ok ? null : (resendData?.message || 'Erro no Resend'),
          sent_at: nowIso
        })
      }
    } catch (logErr) {
      console.warn('Aviso ao registrar disparo automático Stripe:', logErr)
    }

    console.log(`E-mail de agradecimento e finalização de cadastro enviado com sucesso para ${donorEmail}`)
  } catch (emailErr) {
    console.warn('Erro ao disparar e-mail de agradecimento:', emailErr)
  }
}
