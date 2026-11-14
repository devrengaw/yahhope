import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const bodyJson = await req.json()
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada no ambiente Supabase.");
    }

    if (bodyJson?.action === 'sync_resend_history') {
      const allEmails: any[] = [];
      let afterCursor: string | null = null;
      let page = 0;

      while (page < 5) {
        const url = afterCursor
          ? `https://api.resend.com/emails?limit=100&after=${encodeURIComponent(afterCursor)}`
          : `https://api.resend.com/emails?limit=100`;

        const listRes = await fetch(url, {
          headers: { 'Authorization': `Bearer ${resendApiKey}` }
        });

        if (!listRes.ok) {
          const errText = await listRes.text();
          throw new Error(`Erro ao consultar histórico no Resend (${listRes.status}): ${errText}`);
        }

        const listData = await listRes.json();
        const batch = Array.isArray(listData?.data) ? listData.data : [];
        allEmails.push(...batch);

        if (!listData?.has_more || batch.length === 0) break;
        afterCursor = batch[batch.length - 1].id;
        page++;
      }

      const { data: existingRows } = await supabase
        .from('email_campaign_recipients')
        .select('resend_id')
        .not('resend_id', 'is', null);

      const existingIds = new Set((existingRows || []).map((r: any) => r.resend_id));
      let importedCount = 0;
      let skippedCount = 0;

      for (const item of allEmails) {
        if (!item?.id || existingIds.has(item.id)) {
          skippedCount++;
          continue;
        }
        if ((item.subject || '').includes('[TESTE]')) {
          skippedCount++;
          continue;
        }

        const toList: string[] = Array.isArray(item.to)
          ? item.to.filter(Boolean)
          : (item.to ? [String(item.to)] : []);

        if (toList.length === 0) {
          skippedCount++;
          continue;
        }

        const lastEvent = String(item.last_event || 'sent').toLowerCase();
        const isClicked = lastEvent === 'clicked';
        const isOpened = isClicked || lastEvent === 'opened';
        const isDelivered = isOpened || lastEvent === 'delivered';
        const isBounced = lastEvent === 'bounced' || lastEvent === 'complained';
        const recipientStatus = isClicked
          ? 'clicked'
          : isOpened
            ? 'opened'
            : isDelivered
              ? 'delivered'
              : isBounced
                ? 'bounced'
                : 'sent';

        const sentAt = item.created_at || new Date().toISOString();
        const { data: createdCamp, error: campInsertErr } = await supabase
          .from('email_campaigns')
          .insert({
            title: item.subject || 'E-mail Enviado (Resend)',
            subject: item.subject || 'Sem assunto',
            audience_type: 'automatico',
            audience_summary: `Histórico Resend (${toList.join(', ')})`,
            status: 'sent',
            total_recipients: toList.length,
            sent_count: toList.length,
            delivered_count: isDelivered ? toList.length : 0,
            opened_count: isOpened ? toList.length : 0,
            clicked_count: isClicked ? toList.length : 0,
            bounced_count: isBounced ? toList.length : 0,
            sent_at: sentAt
          })
          .select('id')
          .single();

        if (campInsertErr || !createdCamp?.id) {
          console.error('Erro ao importar campanha do Resend:', campInsertErr);
          skippedCount++;
          continue;
        }

        const recipientRows = toList.map((toEmail: string) => ({
          campaign_id: createdCamp.id,
          email: toEmail,
          name: toEmail.split('@')[0],
          recipient_type: 'automatico',
          status: recipientStatus,
          resend_id: item.id,
          sent_at: sentAt,
          delivered_at: isDelivered ? sentAt : null,
          opened_at: isOpened ? sentAt : null,
          clicked_at: isClicked ? sentAt : null,
          open_count: isOpened ? 1 : 0,
          click_count: isClicked ? 1 : 0
        }));

        await supabase.from('email_campaign_recipients').insert(recipientRows);
        existingIds.add(item.id);
        importedCount++;
      }

      return new Response(
        JSON.stringify({ success: true, importedCount, skippedCount, totalFetched: allEmails.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { 
      campaignId, 
      isTest, 
      isTransactional,
      testEmail,
      to,
      recipientName,
      subject: directSubject,
      body_html: directBodyHtml,
      heading: directHeading,
      preheader: directPreheader,
      sender_name: directSenderName,
      sender_email: directSenderEmail,
      has_cta: directHasCta,
      cta_text: directCtaText,
      cta_url: directCtaUrl,
      dispatchSource,
      dispatchTitle
    } = bodyJson

    if (!campaignId && !isTest && !isTransactional) {
      throw new Error("campaignId é obrigatório para disparo em massa")
    }

    // 1. Carregar Campanha se campaignId fornecido
    let campaign: any = null
    if (campaignId) {
      const { data: camp, error: campErr } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle()

      if (campErr) {
        console.warn("Erro ao buscar campanha:", campErr.message)
      }
      campaign = camp
    }

    if (!campaign && !isTest && !isTransactional) {
      throw new Error("Campanha não encontrada no banco de dados.")
    }

    // Mescla dados da campanha com sobrescritas diretas (útil em testes ao vivo)
    const activeSubject = directSubject || campaign?.subject || 'E-mail YAH Hope'
    const activeBodyHtml = directBodyHtml ?? campaign?.body_html ?? ''
    const activeHeading = directHeading ?? campaign?.heading ?? ''
    const activePreheader = directPreheader ?? campaign?.preheader ?? ''
    const activeSenderName = directSenderName || campaign?.sender_name || 'YAH Hope'
    const activeSenderEmail = directSenderEmail || campaign?.sender_email || 'contato@yahhope.com'
    const activeHasCta = directHasCta ?? campaign?.has_cta ?? false
    const activeCtaText = directCtaText || campaign?.cta_text || ''
    const activeCtaUrl = directCtaUrl || campaign?.cta_url || ''

    // 2. Carregar Configurações Globais de Marca (email_settings)
    let logoUrl = 'https://www.yahhope.com/logo-black.png'
    let logoLinkUrl = 'https://www.yahhope.com'
    let primaryColor = '#F49853'

    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).maybeSingle()
    if (settings) {
      if (settings.logo_url && !settings.logo_url.includes('Logo+icone.png') && !settings.logo_url.includes('hope.yahchurch.com/wp-content')) {
        logoUrl = settings.logo_url
      }
      if (settings.logo_link_url) logoLinkUrl = settings.logo_link_url
      if (settings.primary_color) primaryColor = settings.primary_color
    }

    // No Resend, garantir envio por domínio verificado (contato@yahhope.com) mantendo o Reply-To personalizado
    const verifiedSenderDomain = 'contato@yahhope.com'
    const fromEmail = (activeSenderEmail && activeSenderEmail.endsWith('@yahhope.com')) ? activeSenderEmail : verifiedSenderDomain
    const fromAddress = `${activeSenderName} <${fromEmail}>`

    // Normalizador de conteúdo para garantir fontes sem serifa e diagramação limpa em todos os clientes
    const SANS_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

    const normalizeBodyContent = (rawHtml: string) => {
      if (!rawHtml) return ''

      let content = rawHtml

      // Se o conteúdo for texto puro sem tags estruturais, converte quebras em parágrafos
      if (!content.includes('<p>') && !content.includes('<p ') && !content.includes('<div>') && !content.includes('<table')) {
        content = content
          .split(/\n\s*\n/)
          .map(para => `<p>${para.replace(/\n/g, '<br />')}</p>`)
          .join('')
      }

      // Aplica inline font-family e estilos consistentes nas tags principais
      content = content
        .replace(/<p(\s+[^>]*)?>/gi, (match) => {
          if (/style="/i.test(match)) {
            return match.replace(/style="([^"]*)"/i, `style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 16px 0; $1"`)
          }
          return `<p style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 16px 0;">`
        })
        .replace(/<h1(\s+[^>]*)?>/gi, (match) => {
          if (/style="/i.test(match)) {
            return match.replace(/style="([^"]*)"/i, `style="font-family: ${SANS_STACK}; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; margin: 24px 0 12px 0; $1"`)
          }
          return `<h1 style="font-family: ${SANS_STACK}; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; margin: 24px 0 12px 0;">`
        })
        .replace(/<h2(\s+[^>]*)?>/gi, (match) => {
          if (/style="/i.test(match)) {
            return match.replace(/style="([^"]*)"/i, `style="font-family: ${SANS_STACK}; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.35; margin: 20px 0 10px 0; $1"`)
          }
          return `<h2 style="font-family: ${SANS_STACK}; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.35; margin: 20px 0 10px 0;">`
        })
        .replace(/<h3(\s+[^>]*)?>/gi, (match) => {
          if (/style="/i.test(match)) {
            return match.replace(/style="([^"]*)"/i, `style="font-family: ${SANS_STACK}; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4; margin: 16px 0 8px 0; $1"`)
          }
          return `<h3 style="font-family: ${SANS_STACK}; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4; margin: 16px 0 8px 0;">`
        })
        .replace(/<ul(\s+[^>]*)?>/gi, `<ul style="margin: 0 0 16px 0; padding-left: 24px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">`)
        .replace(/<ol(\s+[^>]*)?>/gi, `<ol style="margin: 0 0 16px 0; padding-left: 24px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">`)
        .replace(/<li(\s+[^>]*)?>/gi, `<li style="margin-bottom: 6px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">`)
        .replace(/<blockquote(\s+[^>]*)?>/gi, `<blockquote style="margin: 18px 0; padding: 12px 18px; border-left: 4px solid ${primaryColor}; background-color: #f8fafc; font-style: italic; color: #475569; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7;">`)
        .replace(/<a(\s+href="[^"]*")(\s+[^>]*)?>/gi, (match, href) => {
          if (/style="/i.test(match)) {
            return match.replace(/style="([^"]*)"/i, `style="color: ${primaryColor}; text-decoration: underline; font-weight: 600; $1"`)
          }
          return `<a ${href} target="_blank" style="color: ${primaryColor}; text-decoration: underline; font-weight: 600;">`
        })

      return content
    }

    // Helper para gerar o HTML do e-mail com identidade visual e tracking
    const buildEmailHtml = (bodyContent: string, recipientId: string, recipientName: string, recipientEmail: string) => {
      // Personalização de tags
      let personalizedBody = bodyContent
        .replace(/{{nome}}/gi, recipientName || 'Amigo(a)')
        .replace(/{{nome_doador}}/gi, recipientName || 'Amigo(a)')
        .replace(/{{email}}/gi, recipientEmail)

      const formattedBody = normalizeBodyContent(personalizedBody)

      // CTA Tracking com botão bulletproof compatível com todos os clientes
      let ctaHtml = ''
      if (activeHasCta && activeCtaText && activeCtaUrl) {
        const campaignIdForTracking = campaign?.id || 'preview-test'
        const trackedCtaUrl = `${supabaseUrl}/functions/v1/track-campaign?t=c&cid=${campaignIdForTracking}&rid=${recipientId}&url=${encodeURIComponent(activeCtaUrl)}`
        ctaHtml = `
          <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 32px auto 12px auto; text-align: center;">
            <tr>
              <td align="center" style="border-radius: 12px; background-color: ${primaryColor}; box-shadow: 0 4px 14px rgba(244, 152, 83, 0.35);">
                <a href="${trackedCtaUrl}" target="_blank" style="display: inline-block; padding: 15px 34px; font-family: ${SANS_STACK}; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.01em; -webkit-text-size-adjust: none;">
                  ${activeCtaText}
                </a>
              </td>
            </tr>
          </table>
        `
      }

      // Tracking Pixel 1x1
      const campaignIdForPixel = campaign?.id || 'preview-test'
      const trackingPixel = `<img src="${supabaseUrl}/functions/v1/track-campaign?t=o&cid=${campaignIdForPixel}&rid=${recipientId}" width="1" height="1" alt="" style="display:none !important; width:1px !important; height:1px !important; border:0 !important; outline:none !important;" />`

      return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="x-apple-disable-message-reformatting">
          <title>${activeSubject}</title>
          <!--[if mso]>
          <style type="text/css">
            table, td, div, p, a, h1, h2, h3, span { font-family: Arial, sans-serif !important; }
          </style>
          <![endif]-->
          <style type="text/css">
            body, table, td, p, a, li, blockquote {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              font-family: ${SANS_STACK} !important;
            }
            img {
              -ms-interpolation-mode: bicubic;
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
            }
            table {
              border-collapse: collapse !important;
            }
            body {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              background-color: #f1f5f9;
            }
            a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
              font-family: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
            }
            @media only screen and (max-width: 620px) {
              .email-container {
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 0 !important;
                border-left: none !important;
                border-right: none !important;
              }
              .content-cell {
                padding: 20px 20px 28px 20px !important;
              }
              .header-cell {
                padding: 28px 20px 18px 20px !important;
              }
              .footer-cell {
                padding: 24px 20px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: ${SANS_STACK}; color: #334155; -webkit-font-smoothing: antialiased;">
          ${activePreheader ? `<div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #ffffff;">${activePreheader}</div>` : ''}
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px; width: 100%;">
            <tr>
              <td align="center">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table class="email-container" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; margin: 0 auto;">
                  <!-- Header com Logo Branded -->
                  <tr>
                    <td class="header-cell" align="center" style="padding: 36px 32px 20px 32px; text-align: center;">
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

                  <!-- Título de Destaque se houver -->
                  ${activeHeading ? `
                  <tr>
                    <td align="center" style="padding: 8px 36px 4px 36px; text-align: center;">
                      <h1 style="margin: 0; font-family: ${SANS_STACK}; font-size: 22px; font-weight: 800; color: ${primaryColor}; line-height: 1.35; letter-spacing: -0.01em;">
                        ${activeHeading}
                      </h1>
                    </td>
                  </tr>` : ''}

                  <!-- Conteúdo Principal -->
                  <tr>
                    <td class="content-cell" style="padding: 20px 36px 36px 36px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                      <div style="font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                        ${formattedBody}
                      </div>
                      ${ctaHtml}
                    </td>
                  </tr>

                  <!-- Rodapé Branded -->
                  <tr>
                    <td class="footer-cell" style="background-color: #f8fafc; padding: 28px 36px; text-align: center; border-top: 1px solid #f1f5f9; font-family: ${SANS_STACK}; font-size: 12px; line-height: 1.6; color: #64748b;">
                      <p style="margin: 0 0 6px 0; font-family: ${SANS_STACK}; font-size: 13px; font-weight: 700; color: #334155;">
                        YAH Hope
                      </p>
                      <p style="margin: 0 0 10px 0; font-family: ${SANS_STACK}; font-size: 12px; color: #64748b;">
                        Você está recebendo este e-mail através das comunicações oficiais da YAH Hope.
                      </p>
                      ${recipientEmail && recipientId !== 'test-preview' ? `
                      <p style="margin: 0 0 10px 0; font-family: ${SANS_STACK}; font-size: 11px; color: #94a3b8;">
                        Não deseja mais receber nossos e-mails? <a href="${supabaseUrl}/functions/v1/track-campaign?t=u&email=${encodeURIComponent(recipientEmail)}&rid=${encodeURIComponent(recipientId)}&cid=${encodeURIComponent(campaignId || 'transactional')}" target="_blank" style="color: #64748b; text-decoration: underline;">Cancelar recebimento</a>
                      </p>` : ''}
                      <p style="margin: 0; font-family: ${SANS_STACK}; font-size: 11px; color: #94a3b8;">
                        © ${new Date().getFullYear()} Associação YAH Hope. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
              </td>
            </tr>
          </table>
          ${trackingPixel}
        </body>
        </html>
      `
    }

    // 3. SE FOR DISPARO DE TESTE OU TRANSACIONAL DIRETO
    if (isTest || isTransactional) {
      const recipientTarget = to || testEmail || 'contato@yahhope.com'
      const targetName = isTransactional ? (recipientName || 'Mantenedor(a)') : 'Destinatário Teste'
      const finalSubject = isTransactional
        ? activeSubject
        : (activeSubject.startsWith('[TESTE]') ? activeSubject : `[TESTE] ${activeSubject}`)

      // Registra disparos transacionais/manuais/automáticos em email_campaigns para aparecerem em "Disparo & Campanhas"
      let logCampaignId = campaign?.id || null
      let logRecipientId = isTransactional ? 'transactional' : 'test-preview'
      if (isTransactional && !isTest) {
        try {
          const nowIso = new Date().toISOString()
          const sourceType = dispatchSource || 'manual'
          const { data: createdCamp } = await supabase
            .from('email_campaigns')
            .insert({
              title: dispatchTitle || (sourceType === 'automatico' ? `[Automático] ${activeHeading || finalSubject}` : `[Manual] ${activeHeading || finalSubject}`),
              subject: finalSubject,
              preheader: activePreheader,
              heading: activeHeading,
              body_html: activeBodyHtml,
              sender_name: activeSenderName,
              sender_email: fromEmail,
              audience_type: sourceType,
              audience_summary: sourceType === 'automatico' ? 'Disparo automático do sistema' : `Disparo manual (${recipientTarget})`,
              has_cta: Boolean(activeHasCta),
              cta_text: activeCtaText,
              cta_url: activeCtaUrl,
              status: 'sent',
              total_recipients: 1,
              sent_count: 1,
              delivered_count: 1,
              sent_at: nowIso
            })
            .select('id')
            .maybeSingle()

          if (createdCamp?.id) {
            logCampaignId = createdCamp.id
            campaign = { ...campaign, id: createdCamp.id }
            const { data: createdRec } = await supabase
              .from('email_campaign_recipients')
              .insert({
                campaign_id: createdCamp.id,
                email: recipientTarget.toLowerCase().trim(),
                name: targetName,
                recipient_type: 'apoiador',
                status: 'sent',
                sent_at: nowIso
              })
              .select('id')
              .maybeSingle()

            if (createdRec?.id) {
              logRecipientId = createdRec.id
            }
          }
        } catch (logErr) {
          console.warn('Aviso ao registrar disparo transacional:', logErr)
        }
      }

      const singleHtml = buildEmailHtml(activeBodyHtml, logRecipientId, targetName, recipientTarget)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipientTarget,
          subject: finalSubject,
          html: singleHtml,
          reply_to: campaign?.reply_to || activeSenderEmail || undefined
        })
      })

      const resData = await res.json()
      if (!res.ok) {
        if (logCampaignId && logRecipientId !== 'transactional' && logRecipientId !== 'test-preview') {
          await supabase.from('email_campaign_recipients').update({
            status: 'failed',
            error_message: resData?.message || 'Erro desconhecido Resend'
          }).eq('id', logRecipientId)
          await supabase.from('email_campaigns').update({
            status: 'failed',
            sent_count: 0,
            delivered_count: 0,
            failed_count: 1
          }).eq('id', logCampaignId)
        }
        const errorDetail = resData?.message || resData?.error || JSON.stringify(resData)
        throw new Error(`Falha no Resend (${res.status}): ${errorDetail}`)
      }

      if (resData?.id && logRecipientId !== 'transactional' && logRecipientId !== 'test-preview') {
        await supabase.from('email_campaign_recipients').update({
          resend_id: resData.id
        }).eq('id', logRecipientId)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        isTest: Boolean(isTest),
        isTransactional: Boolean(isTransactional),
        target: recipientTarget, 
        resendId: resData.id,
        campaignId: logCampaignId
      }), {
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

    // Carrega e-mails descadastrados para nunca enviar campanhas a quem cancelou recebimento
    const { data: unsubRows } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'unsubscribed')
    const unsubscribedSet = new Set(
      (unsubRows || []).map((r: any) => (r.email || '').toLowerCase().trim()).filter(Boolean)
    )

    // Envio individual em batches para respeitar rate limits
    for (const recipient of recipients) {
      const cleanRecipientEmail = (recipient.email || '').toLowerCase().trim()
      if (unsubscribedSet.has(cleanRecipientEmail)) {
        await supabase
          .from('email_campaign_recipients')
          .update({
            status: 'failed',
            error_message: 'Contato descadastrado (cancelou recebimento de e-mails)'
          })
          .eq('id', recipient.id)
        continue
      }
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
