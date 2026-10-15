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
      
      // Envia e-mail de agradecimento da primeira doação com botão de finalização de cadastro
      if (donorEmail) {
        await sendThankYouEmail(donorEmail, donorName)
      }

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

async function sendThankYouEmail(donorEmail: string, donorName: string) {
  if (!donorEmail) return
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) return

  try {
    let logoUrl = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png'
    let logoLinkUrl = 'https://hope.yahchurch.com'
    let primaryColor = '#F49853'
    
    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).maybeSingle()
    if (settings) {
      if (settings.logo_url && !settings.logo_url.includes('Logo+icone.png')) logoUrl = settings.logo_url
      if (settings.logo_link_url) logoLinkUrl = settings.logo_link_url
      if (settings.primary_color) primaryColor = settings.primary_color
    }

    const { data: templateData } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'donation_thank_you')
      .maybeSingle()

    if (templateData && templateData.is_active === false) {
      console.log('Disparo de agradecimento ignorado: template donation_thank_you está desativado.')
      return
    }

    let subject = templateData?.subject || 'Obrigado pelo seu apoio! 🧡 Finalize seu cadastro'
    let preheader = templateData?.preheader || 'Crie sua senha de acesso para acompanhar o impacto da sua doação no portal.'
    let heading = templateData?.heading || 'Obrigado por transformar vidas!'
    let body = templateData?.body || `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Nós da YAH Hope queremos agradecer de todo o coração pela sua contribuição! Seja através de uma doação pontual, apoio mensal recorrente ou apadrinhamento, o seu gesto garante nutrição, educação e dignidade para as nossas crianças.</p><p><br></p><p>Para acompanhar os relatórios de impacto, ver fotos das nossas crianças e acessar sua área exclusiva, finalize o seu cadastro no portal criando sua senha de acesso:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`
    let hasCta = templateData?.has_cta ?? true
    let ctaText = templateData?.cta_text || 'Finalizar Meu Cadastro'
    let ctaUrl = templateData?.cta_url || 'https://yahhope.com/finalizar-cadastro'

    let personalizedBody = body
      .replace(/{{nome_doador}}/gi, donorName || 'Amigo(a)')
      .replace(/{{nome}}/gi, donorName || 'Amigo(a)')
      .replace(/{{email}}/gi, donorEmail)

    const SANS_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

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
    }

    let ctaHtml = ''
    if (hasCta && ctaText && ctaUrl) {
      const sep = ctaUrl.includes('?') ? '&' : '?'
      const targetCtaUrl = (ctaUrl.includes('cadastro') || ctaUrl.includes('finalizar') || ctaUrl.includes('portal') || ctaUrl.includes('set-password'))
        ? `${ctaUrl}${sep}email=${encodeURIComponent(donorEmail)}&name=${encodeURIComponent(donorName)}`
        : ctaUrl

      ctaHtml = `
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 32px auto 12px auto; text-align: center;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: ${primaryColor}; box-shadow: 0 4px 14px rgba(244, 152, 83, 0.35);">
              <a href="${targetCtaUrl}" target="_blank" style="display: inline-block; padding: 15px 34px; font-family: ${SANS_STACK}; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.01em; -webkit-text-size-adjust: none;">
                ${ctaText}
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

                ${heading ? `
                <tr>
                  <td align="center" style="padding: 8px 36px 4px 36px; text-align: center;">
                    <h1 style="margin: 0; font-family: ${SANS_STACK}; font-size: 22px; font-weight: 800; color: ${primaryColor}; line-height: 1.35;">
                      ${heading}
                    </h1>
                  </td>
                </tr>` : ''}

                <tr>
                  <td style="padding: 20px 36px 36px 36px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                    <div style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                      ${personalizedBody}
                    </div>
                    ${ctaHtml}
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f8fafc; padding: 28px 36px; text-align: center; border-top: 1px solid #f1f5f9; font-family: ${SANS_STACK}; font-size: 12px; line-height: 1.6; color: #64748b;">
                    <p style="margin: 0 0 6px 0; font-family: ${SANS_STACK}; font-size: 13px; font-weight: 700; color: #334155;">
                      YAH Hope
                    </p>
                    <p style="margin: 0 0 10px 0; font-family: ${SANS_STACK}; font-size: 12px; color: #64748b;">
                      Você está recebendo este e-mail por apoiar os projetos oficiais da Associação YAH Hope.
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
        reply_to: 'contato@yahhope.com'
      })
    })

    console.log(`E-mail de agradecimento e finalização de cadastro enviado com sucesso para ${donorEmail}`)
  } catch (emailErr) {
    console.warn('Erro ao disparar e-mail de agradecimento no InfinitePay:', emailErr)
  }
}
