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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");

    // Fetch Global Settings
    let logoUrl = 'https://yahhope.org/Logo+icone.png';
    let primaryColor = '#F49853';

    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
    if (settings) {
      if (settings.logo_url) logoUrl = settings.logo_url;
      if (settings.primary_color) primaryColor = settings.primary_color;
    }

    // Fetch Accountability Template
    let subject = 'Prestação de Contas: Veja o impacto da sua doação!';
    let body = `Olá {{nome_doador}},\n\nÉ com muita alegria que compartilhamos os resultados alcançados neste mês graças ao seu apoio contínuo.\n\nAcesse o portal do apoiador para conferir o relatório completo de impacto.\n\nObrigado por fazer a diferença!\nEquipe YAH Hope`;

    const { data: template } = await supabase.from('email_templates').select('*').eq('name', 'accountability').single();
    if (template) {
      subject = template.subject;
      body = template.body;
    }

    // Fetch distinct donor emails
    // A more advanced query would group by email. We will fetch all and filter duplicates in memory.
    const { data: donations } = await supabase.from('donations').select('donor_name, donor_email').not('donor_email', 'is', null);
    
    if (!donations || donations.length === 0) {
      return new Response(JSON.stringify({ message: "No donors found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const uniqueDonors = new Map<string, string>(); // email -> name
    donations.forEach(d => {
      if (d.donor_email) uniqueDonors.set(d.donor_email, d.donor_name);
    });

    const emailPromises: Promise<any>[] = [];

    uniqueDonors.forEach((name, email) => {
      const personalizedBody = body.replace(/{{nome_doador}}/g, name);
      
      // Building a simple HTML template with the global settings
      const htmlBody = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px; border-bottom: 2px solid ${primaryColor};">
            <img src="${logoUrl}" alt="YAH Hope Logo" style="max-height: 60px;" />
          </div>
          <div style="padding: 30px 20px; line-height: 1.6; white-space: pre-wrap;">
            ${personalizedBody}
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f9f9f9;">
            Você está recebendo este e-mail porque é um apoiador ativo da YAH Hope.
          </div>
        </div>
      `;

      const request = fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'YAH Hope <contato@yahhope.org>', // Ensure this domain is verified in Resend!
          to: email,
          subject: subject,
          html: htmlBody,
          text: personalizedBody
        })
      });

      emailPromises.push(request);
    });

    // We can use Promise.all to send them in parallel, 
    // or batch API if Resend batch is preferred, but loop fetch works for < 100 requests easily.
    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ success: true, count: uniqueDonors.size }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error sending accountability emails:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
