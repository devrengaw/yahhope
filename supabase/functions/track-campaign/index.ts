import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 1x1 Transparent GIF base64
const TRANSPARENT_GIF_BYTES = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
])

serve(async (req) => {
  const url = new URL(req.url)
  const trackType = url.searchParams.get('t') // 'o' (open), 'c' (click) ou 'u' (unsubscribe)
  const campaignId = url.searchParams.get('cid')
  const recipientId = url.searchParams.get('rid')
  const targetUrl = url.searchParams.get('url')
  const directEmail = url.searchParams.get('email')

  const userAgent = req.headers.get('user-agent') || ''

  // 0. DESCADASTRAMENTO (UNSUBSCRIBE)
  if (trackType === 'u') {
    let targetEmail = (directEmail || '').toLowerCase().trim()

    if (!targetEmail && recipientId && recipientId !== 'test-preview') {
      const { data: rec } = await supabase
        .from('email_campaign_recipients')
        .select('email')
        .eq('id', recipientId)
        .maybeSingle()
      if (rec?.email) targetEmail = rec.email.toLowerCase().trim()
    }

    if (targetEmail && targetEmail.includes('@')) {
      try {
        // 1. Atualiza ou insere na base unificada (newsletter_subscribers) como 'unsubscribed'
        const { data: existingSub } = await supabase
          .from('newsletter_subscribers')
          .select('id, source')
          .ilike('email', targetEmail)
          .maybeSingle()

        if (existingSub) {
          await supabase
            .from('newsletter_subscribers')
            .update({ status: 'unsubscribed' })
            .eq('id', existingSub.id)
        } else {
          await supabase
            .from('newsletter_subscribers')
            .insert({
              id: `sub_${crypto.randomUUID()}`,
              email: targetEmail,
              status: 'unsubscribed',
              source: campaignId ? `Cancelamento (${campaignId})` : 'Cancelamento via E-mail'
            })
        }

        // 2. Adiciona a tag [DESCADASTRADO] no nome de cadastro do usuário (tabela users) para ajuste
        let userName = targetEmail
        const { data: matchedUsers } = await supabase
          .from('users')
          .select('id, name, email')
          .ilike('email', targetEmail)

        for (const u of matchedUsers || []) {
          const currentName = (u.name || '').trim()
          if (currentName) userName = currentName
          if (!currentName.includes('[DESCADASTRADO]')) {
            const taggedName = currentName ? `[DESCADASTRADO] ${currentName}` : `[DESCADASTRADO] ${targetEmail}`
            await supabase
              .from('users')
              .update({ name: taggedName })
              .eq('id', u.id)
          }
        }

        // 3. Registra notificação in-app para administradores/coordenadores
        try {
          const { data: admins } = await supabase
            .from('users')
            .select('id')
            .in('role', ['ADMIN', 'COORDINATOR', 'admin', 'coordinator'])
            .limit(10)

          if (admins && admins.length > 0) {
            await supabase.from('notifications').insert(
              admins.map((adm: any) => ({
                user_id: adm.id,
                title: 'Cancelamento de E-mail (Ajuste Necessário)',
                message: `${userName} (${targetEmail}) cancelou o recebimento de e-mails. Tag [DESCADASTRADO] aplicada no cadastro.`,
                type: 'warning',
                read: false
              }))
            )
          }
        } catch (notifErr) {
          console.warn('Aviso ao gravar notificação in-app:', notifErr)
        }

        // 4. Notifica a equipe por e-mail via Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (resendApiKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'YAH Hope <contato@yahhope.com>',
              to: 'contato@yahhope.com',
              subject: `[DESCADASTRADO] ${userName} cancelou o recebimento de e-mails`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc;">
                  <div style="background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
                    <h2 style="margin: 0 0 12px 0; color: #b91c1c; font-size: 18px;">Aviso de Cancelamento de E-mail</h2>
                    <p style="margin: 0 0 12px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                      Um contato solicitou o cancelamento do recebimento de e-mails. A tag <strong>[DESCADASTRADO]</strong> foi adicionada automaticamente ao nome de cadastro para ajuste.
                    </p>
                    <ul style="margin: 0 0 16px 0; padding-left: 18px; color: #334155; font-size: 14px; line-height: 1.6;">
                      <li><strong>Nome:</strong> ${userName}</li>
                      <li><strong>E-mail:</strong> ${targetEmail}</li>
                      <li><strong>Origem:</strong> ${campaignId || 'E-mail automático'}</li>
                      <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</li>
                    </ul>
                  </div>
                </div>
              `
            })
          }).catch(err => console.warn('Aviso ao notificar equipe por e-mail:', err))
        }
      } catch (unsubErr) {
        console.error('Erro ao processar descadastramento:', unsubErr)
      }
    }

    const htmlConfirm = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Descadastramento Confirmado • YAH Hope</title>
</head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;width:100%;background:#ffffff;border-radius:20px;padding:32px;text-align:center;border:1px solid #e2e8f0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
    <img src="https://www.yahhope.com/logo-black.png" alt="YAH Hope" style="max-height:44px;margin-bottom:20px;" />
    <h1 style="margin:0 0 10px 0;font-size:20px;color:#0f172a;">Recebimento cancelado</h1>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">
      O e-mail <strong>${targetEmail || 'informado'}</strong> foi removido da nossa lista de envios e nossa equipe já foi notificada.
    </p>
    <a href="https://hope.yahchurch.com" style="display:inline-block;padding:12px 24px;background:#F49853;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">Voltar para a YAH Hope</a>
  </div>
</body>
</html>`

    return new Response(htmlConfirm, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200
    })
  }

  try {
    if (recipientId && campaignId && recipientId !== 'test-preview') {
      // 1. RASTREAMENTO DE ABERTURA (OPEN PIXEL)
      if (trackType === 'o') {
        // Busca status atual do destinatário
        const { data: recipient } = await supabase
          .from('email_campaign_recipients')
          .select('id, open_count, opened_at, status')
          .eq('id', recipientId)
          .single()

        if (recipient) {
          const isFirstOpen = !recipient.opened_at || recipient.open_count === 0
          const newOpenCount = (recipient.open_count || 0) + 1

          await supabase
            .from('email_campaign_recipients')
            .update({
              opened_at: recipient.opened_at || new Date().toISOString(),
              open_count: newOpenCount,
              status: recipient.status === 'clicked' ? 'clicked' : 'opened',
              user_agent: userAgent
            })
            .eq('id', recipientId)

          if (isFirstOpen) {
            // Incrementa contador de aberturas únicas na campanha
            const { data: camp } = await supabase
              .from('email_campaigns')
              .select('opened_count')
              .eq('id', campaignId)
              .single()

            if (camp) {
              await supabase
                .from('email_campaigns')
                .update({
                  opened_count: (camp.opened_count || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', campaignId)
            }
          }
        }
      }

      // 2. RASTREAMENTO DE CLIQUE (CLICK REDIRECT)
      else if (trackType === 'c') {
        const { data: recipient } = await supabase
          .from('email_campaign_recipients')
          .select('id, click_count, clicked_at, open_count')
          .eq('id', recipientId)
          .single()

        if (recipient) {
          const isFirstClick = !recipient.clicked_at || recipient.click_count === 0
          const newClickCount = (recipient.click_count || 0) + 1
          const newOpenCount = recipient.open_count > 0 ? recipient.open_count : 1

          await supabase
            .from('email_campaign_recipients')
            .update({
              clicked_at: recipient.clicked_at || new Date().toISOString(),
              click_count: newClickCount,
              open_count: newOpenCount, // Se clicou, com certeza abriu
              status: 'clicked',
              user_agent: userAgent
            })
            .eq('id', recipientId)

          if (isFirstClick) {
            const { data: camp } = await supabase
              .from('email_campaigns')
              .select('clicked_count, opened_count')
              .eq('id', campaignId)
              .single()

            if (camp) {
              await supabase
                .from('email_campaigns')
                .update({
                  clicked_count: (camp.clicked_count || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', campaignId)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro no tracking:', err)
  }

  // Resposta: Se for clique, redireciona 302 para o link original
  if (trackType === 'c' && targetUrl) {
    try {
      const decodedUrl = decodeURIComponent(targetUrl)
      return Response.redirect(decodedUrl, 302)
    } catch {
      return Response.redirect(targetUrl, 302)
    }
  }

  // Resposta padrão: GIF transparente 1x1 sem cache para contabilizar leituras
  return new Response(TRANSPARENT_GIF_BYTES, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF_BYTES.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    },
    status: 200
  })
})
