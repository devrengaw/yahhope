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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    let event;
    
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } else {
        // Fallback for local testing if no webhook secret is provided
        event = JSON.parse(body)
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`Event received: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      
      const donorName = session.metadata?.donorName || session.customer_details?.name || 'Anônimo'
      const donorEmail = session.customer_details?.email || ''
      const amount = session.amount_total ? session.amount_total / 100 : 0
      
      // Get the active campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        
      const campaignId = campaigns && campaigns.length > 0 ? campaigns[0].id : null

      if (campaignId) {
        // Insert donation record
        await supabase.from('donations').insert({
          campaign_id: campaignId,
          donor_name: donorName,
          donor_email: donorEmail,
          amount: amount,
          status: 'paid',
          payment_method: session.payment_method_types?.[0] || 'card',
          paid_at: new Date().toISOString()
        })

        // Update campaign current_amount
        // We do a direct update by getting the current amount and adding
        const { data: currentCamp } = await supabase
          .from('campaigns')
          .select('current_amount')
          .eq('id', campaignId)
          .single()
          
        if (currentCamp) {
          await supabase.from('campaigns').update({
            current_amount: Number(currentCamp.current_amount) + amount
          }).eq('id', campaignId)
        }
      }

      // Send Thank You Email via Resend if email is available
      if (donorEmail) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          // Try to fetch template from DB
          let subject = 'Obrigado pela sua doação! 🧡';
          let body = `Olá {{nome_doador}},\n\nNós da YAH Hope queremos agradecer de todo o coração pela sua doação.\nO seu apoio é fundamental para continuarmos transformando vidas e levando esperança para quem mais precisa.\n\nCom gratidão,\nEquipe YAH Hope`;

          // Fetch Global Settings
          let logoUrl = 'https://yahhope.org/Logo+icone.png';
          let primaryColor = '#F49853';
          
          const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
          if (settings) {
            if (settings.logo_url) logoUrl = settings.logo_url;
            if (settings.primary_color) primaryColor = settings.primary_color;
          }

          const { data: templateData } = await supabase
            .from('email_templates')
            .select('subject, body')
            .eq('name', 'donation_thank_you')
            .single();

          if (templateData) {
            subject = templateData.subject;
            body = templateData.body;
          }

          // Replace variables
          const finalBody = body.replace(/{{nome_doador}}/g, donorName);

          const htmlBody = `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
              <div style="text-align: center; padding: 20px; border-bottom: 2px solid ${primaryColor};">
                <img src="${logoUrl}" alt="YAH Hope Logo" style="max-height: 60px;" />
              </div>
              <div style="padding: 30px 20px; line-height: 1.6; white-space: pre-wrap;">
                ${finalBody}
              </div>
              <div style="text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f9f9f9;">
                Obrigado por apoiar a YAH Hope!
              </div>
            </div>
          `;

          // Send via Resend HTTP API
          try {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'YAH Hope <contato@yahhope.org>', // Replace with verified domain if needed
                to: donorEmail,
                subject: subject,
                html: htmlBody,
                text: finalBody
              })
            });

            if (!res.ok) {
              const errData = await res.text();
              console.error('Failed to send Resend email:', errData);
            } else {
              console.log(`Thank you email sent to ${donorEmail}`);
            }
          } catch (emailErr) {
            console.error('Error calling Resend API:', emailErr);
          }
        } else {
          console.log('No RESEND_API_KEY found, skipping email.');
        }
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
