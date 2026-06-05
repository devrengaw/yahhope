import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, isMonthly, donorName, donorEmail, successUrl, cancelUrl } = await req.json()

    if (!amount) {
      return new Response(JSON.stringify({ error: 'Amount is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const priceData: any = {
      currency: 'brl',
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: isMonthly ? 'Doação Mensal - YAH Hope' : 'Doação Única - YAH Hope',
      },
    };

    if (isMonthly) {
      priceData.recurring = { interval: 'month' };
    }

    // Stripe checkout supports card
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: donorEmail || undefined,
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: isMonthly ? 'subscription' : 'payment',
      success_url: successUrl || 'http://localhost:3000/campanha?status=success',
      cancel_url: cancelUrl || 'http://localhost:3000/campanha?status=cancel',
      metadata: {
        donorName: donorName || '',
        isMonthly: isMonthly ? 'true' : 'false',
        amount: amount.toString()
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
