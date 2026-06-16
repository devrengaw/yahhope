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
    const { email, name, role } = await req.json()

    if (!email) {
      throw new Error("E-mail é obrigatório")
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error("RESEND_API_KEY não configurado.");

    // 1. Generate Invite Link in Supabase Auth
    // This creates the user if they don't exist, and returns a secure token link.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: { full_name: name, role: role || 'USER' },
        redirectTo: 'https://yahhope.com/set-password'
      }
    });

    if (linkError) {
      throw new Error(`Erro ao gerar link de convite: ${linkError.message}`);
    }

    const actionLink = linkData.properties.action_link;

    // 2. Fetch Global Settings & Templates
    let logoUrl = 'https://yahhope.org/Logo+icone.png';
    let primaryColor = '#F49853';

    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
    if (settings) {
      if (settings.logo_url) logoUrl = settings.logo_url;
      if (settings.primary_color) primaryColor = settings.primary_color;
    }

    let subject = 'Bem-vindo à equipe YAH Hope!';
    let preheader = 'Seu acesso foi criado com sucesso.';
    let heading = 'Bem-vindo(a) à Equipe!';
    let body = `<p>Olá ${name},</p><p><br></p><p>Sua conta no sistema YAH Hope foi criada com sucesso pelo administrador.</p><p>Você já pode acessar o sistema e começar a utilizar as ferramentas disponíveis para a sua função.</p><p><br></p><p>Equipe YAH Hope</p>`;
    let ctaText = 'Definir Minha Senha';

    const { data: template } = await supabase.from('email_templates').select('*').eq('name', 'new_admin_user').single();
    if (template) {
      subject = template.subject || subject;
      preheader = template.preheader || preheader;
      heading = template.heading || heading;
      body = template.body || body;
      ctaText = template.cta_text || ctaText;
    }

    // 3. Build HTML Email using Resend
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
        <div style="display: none;">${preheader}</div>
        
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
          
          <!-- Header -->
          <div style="padding: 40px 40px 20px; text-align: center;">
            <img src="${logoUrl}" alt="YAH Hope Logo" style="height: 60px; margin-bottom: 24px;" />
            <h1 style="margin: 0; font-size: 24px; color: #0f172a; font-weight: 900;">${heading}</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 20px 40px; color: #475569; font-size: 16px; line-height: 1.6;">
            ${body}
          </div>
          
          <!-- CTA -->
          <div style="padding: 20px 40px 40px; text-align: center;">
            <a href="${actionLink}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
              ${ctaText}
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <span style="word-break: break-all; color: #64748b;">${actionLink}</span>
            </p>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="max-w: 600px; margin: 24px auto 0; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© ${new Date().getFullYear()} YAH Hope International. Todos os direitos reservados.</p>
        </div>
      </body>
      </html>
    `;

    const request = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'YAH Hope <contato@yahhope.org>', // Must be verified in Resend
        to: email,
        subject: subject,
        html: htmlBody
      })
    });

    if (!request.ok) {
      const errorText = await request.text();
      throw new Error(`Erro do Resend: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Convite enviado com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error sending invite email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
