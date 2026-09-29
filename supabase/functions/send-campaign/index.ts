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
    const { campaignId, isTest, testEmail } = await req.json()

    if (!campaignId) {
      throw new Error("campaignId é obrigatório")
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada no ambiente Supabase.");
    }

    // 1. Carregar Campanha
    const { data: campaign, error: campErr } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campErr || !campaign) {
      throw new Error("Campanha não encontrada: " + (campErr?.message || ''))
    }

    // 2. Carregar Configurações Globais de Marca (email_settings)
    let logoUrl = 'https://yahhope.com/Logo+icone.png'
    let logoLinkUrl = 'https://yahhope.com'
    let primaryColor = '#F49853'

    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single()
    if (settings) {
      if (settings.logo_url) logoUrl = settings.logo_url
      if (settings.logo_link_url) logoLinkUrl = settings.logo_link_url
      if (settings.primary_color) primaryColor = settings.primary_color
    }

    const senderEmail = campaign.sender_email || 'contato@yahhope.com'
    const senderName = campaign.sender_name || 'YAH Hope'
    const fromAddress = `${senderName} <${senderEmail}>`

    // Helper para gerar o HTML do e-mail com identidade visual e tracking
    const buildEmailHtml = (bodyContent: string, recipientId: string, recipientName: string, recipientEmail: string) => {
      // Personalização de tags
      let personalizedBody = bodyContent
        .replace(/{{nome}}/gi, recipientName || 'Amigo(a)')
        .replace(/{{nome_doador}}/gi, recipientName || 'Amigo(a)')
        .replace(/{{email}}/gi, recipientEmail)

      // CTA Tracking
      let ctaHtml = ''
      if (campaign.has_cta && campaign.cta_text && campaign.cta_url) {
        const trackedCtaUrl = `${supabaseUrl}/functions/v1/track-campaign?t=c&cid=${campaign.id}&rid=${recipientId}&url=${encodeURIComponent(campaign.cta_url)}`
        ctaHtml = `
          <div style="margin: 32px 0; text-align: center;">
            <a href="${trackedCtaUrl}" target="_blank" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ${campaign.cta_text}
            </a>
          </div>
        `
      }

      // Tracking Pixel 1x1
      const trackingPixel = `<img src="${supabaseUrl}/functions/v1/track-campaign?t=o&cid=${campaign.id}&rid=${recipientId}" width="1" height="1" alt="" style="display:none !important; width:1px !important; height:1px !important; border:0 !important; outline:none !important;" />`

      return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${campaign.subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
          ${campaign.preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">${campaign.preheader}</div>` : ''}
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                  <!-- Header com Logo -->
                  <tr>
                    <td style="padding: 28px 24px; text-align: center; border-bottom: 2px solid ${primaryColor};">
                      <a href="${logoLinkUrl}" target="_blank">
                        <img src="${logoUrl}" alt="YAH Hope" style="max-height: 54px; max-width: 220px; object-fit: contain;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Título se houver -->
                  ${campaign.heading ? `
                  <tr>
                    <td style="padding: 32px 32px 10px 32px; text-align: center;">
                      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${primaryColor}; line-height: 1.3;">
                        ${campaign.heading}
                      </h1>
                    </td>
                  </tr>` : ''}

                  <!-- Conteúdo Principal -->
                  <tr>
                    <td style="padding: ${campaign.heading ? '16px' : '32px'} 32px; font-size: 15px; line-height: 1.65; color: #334155;">
                      ${personalizedBody}
                      ${ctaHtml}
                    </td>
                  </tr>

                  <!-- Rodapé -->
                  <tr>
                    <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">YAH Hope - Transformando Vidas</p>
                      <p style="margin: 0 0 8px 0;">Você está recebendo este e-mail através das comunicações oficiais da YAH Hope.</p>
                      <p style="margin: 0;">© ${new Date().getFullYear()} YAH Hope. Todos os direitos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          ${trackingPixel}
        </body>
        </html>
      `
    }

    // 3. SE FOR DISPARO DE TESTE
    if (isTest) {
      const recipientTarget = testEmail || 'contato@yahhope.com'
      const testHtml = buildEmailHtml(campaign.body_html, 'test-preview', 'Destinatário Teste', recipientTarget)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipientTarget,
          subject: `[TESTE] ${campaign.subject}`,
          html: testHtml,
          reply_to: campaign.reply_to || undefined
        })
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData?.message || 'Falha ao enviar e-mail de teste no Resend')
      }

      return new Response(JSON.stringify({ success: true, isTest: true, target: recipientTarget, resendId: resData.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 4. DISPARO EM MASSA OFICIAL
    // Atualiza status da campanha para 'sending'
    await supabase
      .from('email_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaignId)

    // Busca todos os destinatários com status 'pending'
    const { data: recipients, error: recErr } = await supabase
      .from('email_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (recErr || !recipients || recipients.length === 0) {
      await supabase
        .from('email_campaigns')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaignId)

      return new Response(JSON.stringify({ success: true, count: 0, message: "Nenhum destinatário pendente encontrado." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let successCount = 0
    let failedCount = 0

    // Envio individual em batches para respeitar rate limits
    for (const recipient of recipients) {
      const emailHtml = buildEmailHtml(campaign.body_html, recipient.id, recipient.name || '', recipient.email)

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: recipient.email,
            subject: campaign.subject,
            html: emailHtml,
            reply_to: campaign.reply_to || undefined
          })
        })

        const resData = await res.json()

        if (res.ok) {
          successCount++
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'sent',
              resend_id: resData.id,
              sent_at: new Date().toISOString()
            })
            .eq('id', recipient.id)
        } else {
          failedCount++
          await supabase
            .from('email_campaign_recipients')
            .update({
              status: 'failed',
              error_message: resData?.message || 'Erro desconhecido Resend'
            })
            .eq('id', recipient.id)
        }
      } catch (err: any) {
        failedCount++
        await supabase
          .from('email_campaign_recipients')
          .update({
            status: 'failed',
            error_message: err.message
          })
          .eq('id', recipient.id)
      }
    }

    // Atualiza contadores consolidados na campanha
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: successCount,
        delivered_count: successCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    return new Response(JSON.stringify({ 
      success: true, 
      total: recipients.length, 
      sent: successCount, 
      failed: failedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro ao enviar campanha:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
