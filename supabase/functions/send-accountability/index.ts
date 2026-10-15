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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");

    // Fetch Global Settings
    let logoUrl = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png';
    let primaryColor = '#F49853';

    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).maybeSingle();
    if (settings) {
      if (settings.logo_url && !settings.logo_url.includes('Logo+icone.png')) logoUrl = settings.logo_url;
      if (settings.primary_color) primaryColor = settings.primary_color;
    }

    // Parse request body for possible manual trigger flags or single dispatch
    let reqBody: any = {};
    try {
      reqBody = await req.json();
    } catch (_) {
      // Empty body is ok
    }

    // Fetch Accountability Template
    let subject = 'Prestação de Contas: Veja o impacto da sua doação!';
    let body = `Olá {{nome_doador}},\n\nÉ com muita alegria que compartilhamos os resultados alcançados neste mês graças ao seu apoio contínuo.\n\nAcesse o portal do apoiador para conferir o relatório completo de impacto.\n\nObrigado por fazer a diferença!\nEquipe YAH Hope`;

    const { data: template } = await supabase.from('email_templates').select('*').eq('name', 'accountability').maybeSingle();
    if (template) {
      // TRAVA DE SEGURANÇA: Se o template estiver desligado e não for um disparo manual explícito, aborta imediatamente
      if (template.is_active === false && !reqBody.manual_force) {
        return new Response(JSON.stringify({ 
          success: false, 
          skipped: true, 
          message: "O envio automático de prestação de contas está desativado nas configurações do template." 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        });
      }

      subject = template.subject || subject;
      body = template.body || body;
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

    const SANS_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    const emailPromises: Promise<any>[] = [];

    uniqueDonors.forEach((name, email) => {
      const personalizedBody = body
        .replace(/{{nome_doador}}/g, name || 'Amigo(a)')
        .replace(/{{nome}}/g, name || 'Amigo(a)')
        .split(/\n\s*\n/)
        .map(p => `<p style="margin: 0 0 16px 0; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">${p.replace(/\n/g, '<br />')}</p>`)
        .join('');
      
      const htmlBody = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style type="text/css">
            body, table, td, p { font-family: ${SANS_STACK} !important; }
            body { margin: 0; padding: 0; background-color: #f1f5f9; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: ${SANS_STACK}; color: #334155;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px; width: 100%;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; margin: 0 auto;">
                  <tr>
                    <td align="center" style="padding: 36px 32px 20px 32px; text-align: center;">
                      <img src="${logoUrl}" alt="YAH Hope" width="160" border="0" style="display: block; margin: 0 auto; width: 160px; max-width: 160px; height: auto; border: 0;" />
                      <div style="height: 3px; width: 44px; background-color: ${primaryColor}; margin: 20px auto 0 auto; border-radius: 999px;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 36px 36px 36px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.7; color: #334155;">
                      ${personalizedBody}
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9; font-family: ${SANS_STACK}; font-size: 12px; line-height: 1.6; color: #64748b;">
                      <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">YAH Hope</p>
                      <p style="margin: 0;">Você está recebendo este e-mail porque é um apoiador ativo da YAH Hope.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const request = fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'YAH Hope <contato@yahhope.com>', // Ensure this domain is verified in Resend!
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

    // Registra a data do envio realizado no template
    await supabase.from('email_templates').update({
      last_sent_at: new Date().toISOString()
    }).eq('name', 'accountability');

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
