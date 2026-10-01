import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Permite GET para teste de status do webhook
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'active',
      message: 'Resend Webhook Endpoint do YAH Hope pronto para receber eventos.',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }

  try {
    const payload = await req.json()
    const eventType = payload.type // 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.replied' | etc.
    const eventData = payload.data || {}
    const emailId = eventData.email_id || eventData.id
    const toEmails = (eventData.to || []).map((e: string) => e.toLowerCase().trim())
    const eventTimestamp = payload.created_at || eventData.created_at || new Date().toISOString()

    console.log(`[Resend Webhook] Evento recebido: ${eventType} para email_id=${emailId}`)

    if (!eventType) {
      return new Response(JSON.stringify({ message: 'Evento ignorado: tipo ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 1. Localizar o destinatário no banco
    let recipient: any = null

    if (emailId) {
      const { data } = await supabase
        .from('email_campaign_recipients')
        .select('*')
        .eq('resend_id', emailId)
        .maybeSingle()
      recipient = data
    }

    // Fallback por e-mail se não encontrar por resend_id
    if (!recipient && toEmails.length > 0) {
      const { data } = await supabase
        .from('email_campaign_recipients')
        .select('*')
        .in('email', toEmails)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      recipient = data
    }

    if (!recipient) {
      console.warn(`[Resend Webhook] Destinatário não encontrado para email_id=${emailId} / to=${toEmails.join(',')}`)
      return new Response(JSON.stringify({ success: true, matched: false, message: 'Destinatário não encontrado no banco' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const campaignId = recipient.campaign_id

    // 2. Processar de acordo com o tipo de evento do Resend
    switch (eventType) {
      case 'email.delivered': {
        const isAlreadyDelivered = !!recipient.delivered_at
        const newStatus = ['opened', 'clicked', 'replied'].includes(recipient.status) 
          ? recipient.status 
          : 'delivered'

        await supabase
          .from('email_campaign_recipients')
          .update({
            delivered_at: recipient.delivered_at || eventTimestamp,
            status: newStatus
          })
          .eq('id', recipient.id)

        if (!isAlreadyDelivered) {
          const { data: camp } = await supabase.from('email_campaigns').select('delivered_count').eq('id', campaignId).single()
          if (camp) {
            await supabase.from('email_campaigns').update({
              delivered_count: (camp.delivered_count || 0) + 1,
              updated_at: new Date().toISOString()
            }).eq('id', campaignId)
          }
        }
        break
      }

      case 'email.opened': {
        const isFirstOpen = !recipient.opened_at || recipient.open_count === 0
        const newOpenCount = (recipient.open_count || 0) + 1
        const newStatus = ['clicked', 'replied'].includes(recipient.status) 
          ? recipient.status 
          : 'opened'

        await supabase
          .from('email_campaign_recipients')
          .update({
            opened_at: recipient.opened_at || eventTimestamp,
            open_count: newOpenCount,
            status: newStatus
          })
          .eq('id', recipient.id)

        if (isFirstOpen) {
          const { data: camp } = await supabase.from('email_campaigns').select('opened_count').eq('id', campaignId).single()
          if (camp) {
            await supabase.from('email_campaigns').update({
              opened_count: (camp.opened_count || 0) + 1,
              updated_at: new Date().toISOString()
            }).eq('id', campaignId)
          }
        }
        break
      }

      case 'email.clicked': {
        const isFirstClick = !recipient.clicked_at || recipient.click_count === 0
        const newClickCount = (recipient.click_count || 0) + 1
        const newOpenCount = recipient.open_count > 0 ? recipient.open_count : 1
        const newStatus = recipient.status === 'replied' ? 'replied' : 'clicked'

        await supabase
          .from('email_campaign_recipients')
          .update({
            clicked_at: recipient.clicked_at || eventTimestamp,
            click_count: newClickCount,
            open_count: newOpenCount,
            status: newStatus
          })
          .eq('id', recipient.id)

        if (isFirstClick) {
          const { data: camp } = await supabase.from('email_campaigns').select('clicked_count, opened_count').eq('id', campaignId).single()
          if (camp) {
            await supabase.from('email_campaigns').update({
              clicked_count: (camp.clicked_count || 0) + 1,
              opened_count: (camp.opened_count || 0) + (recipient.open_count === 0 ? 1 : 0),
              updated_at: new Date().toISOString()
            }).eq('id', campaignId)
          }
        }
        break
      }

      case 'email.bounced':
      case 'email.complained': {
        await supabase
          .from('email_campaign_recipients')
          .update({
            bounced_at: eventTimestamp,
            status: 'bounced',
            error_message: eventData.bounce?.message || 'E-mail rejeitado (Bounced)'
          })
          .eq('id', recipient.id)

        const { data: camp } = await supabase.from('email_campaigns').select('bounced_count, failed_count').eq('id', campaignId).single()
        if (camp) {
          await supabase.from('email_campaigns').update({
            bounced_count: (camp.bounced_count || 0) + 1,
            failed_count: (camp.failed_count || 0) + 1,
            updated_at: new Date().toISOString()
          }).eq('id', campaignId)
        }
        break
      }

      case 'email.replied':
      case 'email.inbound': {
        const isFirstReply = !recipient.replied_at || (recipient.reply_count || 0) === 0
        const newReplyCount = (recipient.reply_count || 0) + 1
        const replySnippet = eventData.text || eventData.subject || 'Resposta recebida'

        await supabase
          .from('email_campaign_recipients')
          .update({
            replied_at: recipient.replied_at || eventTimestamp,
            reply_count: newReplyCount,
            reply_snippet: replySnippet.slice(0, 200),
            status: 'replied'
          })
          .eq('id', recipient.id)

        if (isFirstReply) {
          const { data: camp } = await supabase.from('email_campaigns').select('replied_count').eq('id', campaignId).single()
          if (camp) {
            await supabase.from('email_campaigns').update({
              replied_count: (camp.replied_count || 0) + 1,
              updated_at: new Date().toISOString()
            }).eq('id', campaignId)
          }
        }
        break
      }

      default:
        console.log(`[Resend Webhook] Evento ${eventType} registrado sem ação específica`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matched: true, 
      recipientId: recipient.id, 
      eventType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error('[Resend Webhook] Erro ao processar:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
