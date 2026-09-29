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
  const trackType = url.searchParams.get('t') // 'o' (open) ou 'c' (click)
  const campaignId = url.searchParams.get('cid')
  const recipientId = url.searchParams.get('rid')
  const targetUrl = url.searchParams.get('url')

  const userAgent = req.headers.get('user-agent') || ''

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
