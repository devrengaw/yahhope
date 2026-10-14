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
      phone: donorPhone || existingUser.phone,
      status: 'active'
    };
    if (isSponsor) {
      updates.role = 'SPONSOR';
    }
    await supabase.from('users').update(updates).eq('id', existingUser.id);
  } else {
    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({
        name: donorName,
        email: cleanEmail,
        phone: donorPhone,
        role: isSponsor ? 'SPONSOR' : 'USER',
        status: 'active'
      })
      .select('id')
      .single();

    if (!userErr && newUser) {
      userId = newUser.id;
    }
  }

  // 2. Se for mantenedor/apadrinhamento, atualiza ou insere na tabela 'sponsorships'
  if (isSponsor && amount > 0) {
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
      // Atualiza apadrinhamento existente com valores reais
      for (const sp of existingSp) {
        await supabase
          .from('sponsorships')
          .update({
            donor_name: donorName,
            donor_email: cleanEmail,
            donor_phone: donorPhone,
            monthly_amount: amount,
            status: 'active',
            payment_method: paymentMethod,
            last_sponsored_at: timestamp,
            sponsor_id: userId || null
          })
          .eq('id', sp.id);
      }
    } else {
      // Busca criança com menor número de apadrinhamentos (< 2)
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

      const assignedChildId = available.length > 0 ? available[0].id : null;

      await supabase.from('sponsorships').insert({
        child_id: assignedChildId,
        sponsor_id: userId || null,
        donor_name: donorName,
        donor_email: cleanEmail,
        donor_phone: donorPhone,
        monthly_amount: amount,
        quotas_count: data.quotasCount || 1,
        status: 'active',
        payment_method: paymentMethod,
        created_at: timestamp,
        last_sponsored_at: timestamp
      });
    }
  }

  return { userId, cleanEmail, donorName };
}

/**
 * Busca direta no Stripe: consulta assinaturas, clientes e cobranças
 * e sincroniza todos os mantenedores reais no banco.
 */
async function handleStripeSync(filterEmail?: string) {
  const results = {
    synced_maintainers: 0,
    synced_subscriptions: 0,
    synced_donations: 0,
    total_amount: 0,
    details: [] as any[]
  };

  try {
    console.log('Iniciando busca direta de assinaturas e doações no Stripe...');

    // 1. Busca todas as assinaturas reais da Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      expand: ['data.customer']
    });

    for (const sub of subscriptions.data) {
      let customer: any = sub.customer;
      if (typeof customer === 'string') {
        customer = await stripe.customers.retrieve(customer);
      }

      const email = customer?.email || sub.metadata?.donorEmail || '';
      if (!email) continue;
      if (filterEmail && email.toLowerCase() !== filterEmail.toLowerCase().trim()) continue;

      const name = customer?.name || sub.metadata?.donorName || email.split('@')[0];
      const phone = customer?.phone || sub.metadata?.donorPhone || null;
      const amount = sub.items?.data?.[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 90;
      const isActive = sub.status === 'active' || sub.status === 'trialing';

      await syncMaintainerProfile({
        email,
        name,
        phone,
        isSponsor: true,
        isMonthly: true,
        amount,
        lastSponsoredAt: new Date(sub.current_period_start * 1000).toISOString(),
        paymentMethod: 'credit_card',
        subscriptionId: sub.id,
        customerId: customer?.id
      });

      results.synced_maintainers++;
      results.synced_subscriptions++;
      results.total_amount += amount;
      results.details.push({
        type: 'subscription',
        email,
        name,
        amount,
        status: sub.status
      });
    }

    // 2. Busca cobranças avulsas aprovadas na Stripe
    const charges = await stripe.charges.list({
      limit: 100
    });

    // Pega a primeira campanha da régua (Fase 1: Casa Nutri)
    const { data: firstCamp } = await supabase
      .from('campaigns')
      .select('id, current_amount')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle();

    for (const charge of charges.data) {
      if (charge.status !== 'succeeded') continue;
      // Cobranças geradas por fatura de assinatura já foram processadas acima
      if (charge.invoice) continue;

      const email = (charge.billing_details?.email || charge.receipt_email || '').toLowerCase().trim();
      if (!email) continue;
      if (filterEmail && email !== filterEmail.toLowerCase().trim()) continue;

      const name = charge.billing_details?.name || email.split('@')[0];
      const phone = charge.billing_details?.phone || null;
      const amount = charge.amount / 100;
      const paymentDate = new Date(charge.created * 1000).toISOString();
      const paymentMethod = charge.payment_method_details?.type === 'pix' ? 'pix' : 'credit_card';

      // Atualiza perfil no users
      await syncMaintainerProfile({
        email,
        name,
        phone,
        isSponsor: false,
        amount,
        lastSponsoredAt: paymentDate,
        paymentMethod
      });

      // Checa se doação já existe
      const { data: existingDonation } = await supabase
        .from('donations')
        .select('id')
        .ilike('donor_email', email)
        .eq('amount', amount)
        .maybeSingle();

      if (!existingDonation) {
        await supabase.from('donations').insert({
          campaign_id: firstCamp?.id || null,
          donor_name: name,
          donor_email: email,
          donor_phone: phone,
          amount,
          status: 'paid',
          payment_method: paymentMethod,
          created_at: paymentDate,
          paid_at: paymentDate
        });
      }

      results.synced_donations++;
      results.total_amount += amount;
      results.details.push({
        type: 'donation',
        email,
        name,
        amount,
        payment_method: paymentMethod
      });
    }

    // 3. Atualiza a arrecadação da Fase 1 com os valores reais consolidados
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
      message: `Sincronização Stripe concluída com sucesso: ${results.synced_subscriptions} apadrinhamento(s) e ${results.synced_donations} doação(ões) sincronizados.`,
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
      const donorEmail = customer?.email || session.customer_details?.email || session.metadata?.donorEmail || ''
      const donorPhone = customer?.phone || session.customer_details?.phone || session.metadata?.donorPhone || null
      const amount = session.amount_total ? session.amount_total / 100 : 0
      const isSponsorship = session.metadata?.type === 'sponsorship' || session.mode === 'subscription'
      const isMonthly = session.metadata?.isMonthly === 'true' || session.mode === 'subscription'
      const quotasCount = Number(session.metadata?.quotasCount) || 1
      const isPix = session.metadata?.paymentMethod === 'pix' || session.payment_method_types?.includes('pix')
      const paymentMethod = isPix ? 'pix' : 'credit_card'

      // Atualiza o perfil do mantenedor e apadrinhamento
      await syncMaintainerProfile({
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

      // Se for doação avulsa, grava em 'donations' e 'campaigns'
      if (!isSponsorship && !isMonthly && amount > 0) {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, current_amount')
          .order('priority', { ascending: true })
          .limit(1)

        const campaignId = campaigns?.[0]?.id

        if (campaignId) {
          await supabase.from('donations').insert({
            campaign_id: campaignId,
            donor_name: donorName,
            donor_email: donorEmail,
            donor_phone: donorPhone,
            amount: amount,
            status: 'paid',
            payment_method: paymentMethod,
            paid_at: new Date().toISOString()
          })

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

      // Envia e-mail de agradecimento se configurado
      await sendThankYouEmail(donorEmail, donorName)
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

      const email = customer?.email || invoice.customer_email || ''
      const name = customer?.name || invoice.customer_name || 'Mantenedor YAH Hope'
      const phone = customer?.phone || null

      if (email && amount > 0) {
        await syncMaintainerProfile({
          email,
          name,
          phone,
          isSponsor: true,
          isMonthly: true,
          amount,
          subscriptionId: invoice.subscription as string,
          customerId: invoice.customer as string,
          lastSponsoredAt: new Date().toISOString()
        })

        await supabase.from('finance_transactions').insert({
          description: `Recorrência Mensal Stripe - ${name}`,
          amount: amount,
          type: 'income',
          category_id: 'cat_sponsorship',
          status: 'completed',
          account: 'Stripe',
          date: new Date().toISOString()
        })
      }
    }

    // 3. EVENTO: SUBSCRIPTION UPDATED / DELETED
    else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      const isDeleted = event.type === 'customer.subscription.deleted' || subscription.status === 'canceled'
      const status = isDeleted ? 'inactive' : subscription.status === 'active' ? 'active' : 'paused'

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
          .update({ status: isDeleted ? 'inactive' : 'active' })
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

async function sendThankYouEmail(donorEmail: string, donorName: string) {
  if (!donorEmail) return
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) return

  try {
    let subject = 'Obrigado pelo seu apoio! 🧡'
    let body = `Olá {{nome_doador}},\n\nNós da YAH Hope queremos agradecer de todo o coração pelo seu apoio.\nSua contribuição transforma vidas e garante nutrição e dignidade para as nossas crianças.\n\nCom gratidão,\nEquipe YAH Hope`

    let logoUrl = 'https://yahhope.com/Logo+icone.png'
    let logoLinkUrl = 'https://yahhope.com'
    let primaryColor = '#F49853'
    
    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single()
    if (settings) {
      if (settings.logo_url) logoUrl = settings.logo_url
      if (settings.logo_link_url) logoLinkUrl = settings.logo_link_url
      if (settings.primary_color) primaryColor = settings.primary_color
    }

    const { data: templateData } = await supabase
      .from('email_templates')
      .select('subject, body')
      .eq('name', 'donation_thank_you')
      .single()

    if (templateData) {
      subject = templateData.subject
      body = templateData.body
    }

    const finalBody = body.replace(/{{nome_doador}}/g, donorName)
    const htmlBody = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px; border-bottom: 2px solid ${primaryColor};">
          <a href="${logoLinkUrl}" target="_blank" style="text-decoration: none;">
            <img src="${logoUrl}" alt="YAH Hope Logo" style="max-height: 60px; border: none;" />
          </a>
        </div>
        <div style="padding: 30px 20px; line-height: 1.6; white-space: pre-wrap;">
          ${finalBody}
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f9f9f9;">
          Obrigado por apoiar a YAH Hope!
        </div>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
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
        text: finalBody
      })
    })
  } catch (emailErr) {
    console.warn('Erro ao disparar e-mail de agradecimento:', emailErr)
  }
}
