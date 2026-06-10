import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Webhook payload received from InfinitePay:', payload)

    // A InfinitePay possui variações de Payload dependendo do tipo de produto (Checkout vs Link vs PDV).
    // Esta função procura pelos campos mais comuns em todos os tipos de webhook deles.
    
    // Status do pagamento
    const status = payload.status || payload.state || payload.transaction?.status || 'approved'
    
    // Só processa se o status indicar que o pagamento foi aprovado/confirmado
    const isApproved = ['approved', 'paid', 'success', 'completed', 'authorized'].includes(String(status).toLowerCase())
    if (!isApproved) {
       console.log('Transação ignorada (não aprovada):', status)
       return new Response('Ignored - not an approved transaction', { status: 200 })
    }

    // Identifica o valor (amount)
    let rawAmount = payload.amount || payload.value || payload.net_amount || payload.transaction?.amount || payload.transaction?.value || 0
    let amount = Number(rawAmount);
    
    // Muitas plataformas (incluindo InfinitePay) enviam o valor em centavos (ex: 1000 = R$ 10,00).
    // A regra abaixo converte para reais caso não venha formatado.
    if (Number.isInteger(amount) && amount > 0 && !String(rawAmount).includes('.')) {
       amount = amount / 100;
    }

    const donorName = payload.customer?.name || payload.metadata?.donor_name || payload.transaction?.customer_name || 'Doador InfinitePay'
    const donorEmail = payload.customer?.email || payload.metadata?.donor_email || payload.transaction?.customer_email || ''

    // Pega a campanha ativa para onde o dinheiro deve ir
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, current_amount')
      .eq('is_active', true)
      .limit(1)
      
    const activeCampaign = campaigns?.[0]

    if (activeCampaign && amount > 0) {
      // 1. Atualiza o valor na régua de arrecadação
      await supabase.from('campaigns').update({
        current_amount: Number(activeCampaign.current_amount) + amount
      }).eq('id', activeCampaign.id)

      // 2. Registra na tabela de doações
      await supabase.from('donations').insert({
        campaign_id: activeCampaign.id,
        donor_name: donorName,
        donor_email: donorEmail,
        amount: amount,
        status: 'paid',
        payment_method: 'infinitepay',
        paid_at: new Date().toISOString()
      })

      // 3. Registra no Painel Financeiro Geral
      await supabase.from('finance_transactions').insert({
        description: `Doação via InfinitePay - ${donorName}`,
        amount: amount,
        type: 'income',
        category_id: 'cat_donation',
        status: 'completed',
        account: 'InfinitePay',
        date: new Date().toISOString()
      })
      
      console.log(`Sucesso: Adicionado R$ ${amount} à régua da campanha!`)
      return new Response(JSON.stringify({ success: true, added_amount: amount }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    return new Response('Nenhuma campanha ativa encontrada ou valor zerado', { status: 400 })

  } catch (err: any) {
    console.error('Webhook error processing InfinitePay:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
