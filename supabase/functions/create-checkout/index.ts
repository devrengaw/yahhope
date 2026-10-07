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
    const { 
      amount, 
      isMonthly, 
      donorName, 
      donorEmail, 
      successUrl, 
      cancelUrl,
      paymentMethod 
    } = await req.json()

    if (!amount) {
      return new Response(JSON.stringify({ error: 'Amount is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isPix = paymentMethod === 'pix';
    // Assinaturas automáticas recorrentes no Stripe exigem métodos de cobrança automática (cartão).
    // Quando o doador escolhe Pix, o checkout opera em mode: 'payment' gerando o QR Code dinâmico Pix oficial do Stripe.
    const isSubscription = isMonthly && !isPix;
    const mode = isSubscription ? 'subscription' : 'payment';

    const productName = isMonthly 
      ? (isPix ? 'Mantenedor Mensal (via Pix) - YAH Hope' : 'Doação Mensal - YAH Hope')
      : (isPix ? 'Doação via Pix - YAH Hope' : 'Doação - YAH Hope');

    const priceData: any = {
      currency: 'brl',
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: productName,
      },
    };

    if (isSubscription) {
      priceData.recurring = { interval: 'month' };
    }

    // Configuração dos métodos de pagamento habilitados no Stripe Checkout
    let paymentMethodTypes: string[] = ['card'];
    if (isPix) {
      paymentMethodTypes = ['pix'];
    } else if (isSubscription) {
      paymentMethodTypes = ['card'];
    } else if (paymentMethod === 'card' || paymentMethod === 'credit_card') {
      paymentMethodTypes = ['card'];
    } else {
      // Por padrão em doações únicas, disponibiliza tanto Cartão quanto Pix na tela da Stripe
      paymentMethodTypes = ['card', 'pix'];
    }

    const sessionParams: any = {
      payment_method_types: paymentMethodTypes,
      customer_email: donorEmail || undefined,
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode,
      success_url: successUrl || 'http://localhost:3000/campanha?status=success',
      cancel_url: cancelUrl || 'http://localhost:3000/campanha?status=cancel',
      metadata: {
        donorName: donorName || '',
        donorEmail: donorEmail || '',
        isMonthly: isMonthly ? 'true' : 'false',
        paymentMethod: isPix ? 'pix' : (isSubscription ? 'card_subscription' : 'card'),
        amount: amount.toString()
      }
    };

    // Opções de expiração do QR Code Pix (24 horas)
    if (paymentMethodTypes.includes('pix')) {
      sessionParams.payment_method_options = {
        pix: {
          expires_after_seconds: 86400
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
