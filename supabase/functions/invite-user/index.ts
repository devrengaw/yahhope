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
    const bodyPayload = await req.json()
    const { action, id, email, name, role, permissions, phone, department, status, category_id } = bodyPayload

    // Action para listar status real de cadastro e último acesso no Supabase Auth (para Área de Usuários)
    if (action === 'list_auth_status') {
      const authUsers: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        created_at: string | null;
        email_confirmed_at: string | null;
        last_sign_in_at: string | null;
      }> = [];

      let page = 1;
      const perPage = 1000;
      while (page <= 10) {
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        });
        if (listError) throw new Error(`Erro ao listar usuários do Auth: ${listError.message}`);
        const batch = listData?.users || [];
        for (const u of batch) {
          if (!u.email) continue;
          authUsers.push({
            id: u.id,
            email: u.email.trim().toLowerCase(),
            name: (u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0] || '').trim(),
            role: String(u.user_metadata?.role || 'SPONSOR'),
            created_at: u.created_at || null,
            email_confirmed_at: u.email_confirmed_at || null,
            last_sign_in_at: u.last_sign_in_at || null,
          });
        }
        if (batch.length < perPage) break;
        page += 1;
      }

      return new Response(JSON.stringify({ success: true, users: authUsers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Action para atualizar permissões/dados de usuário com Service Role (ignora RLS e sincroniza Auth Metadata)
    if (action === 'update_user') {
      const cleanEmail = (email || '').trim().toLowerCase()
      const permsArray = Array.isArray(permissions) ? permissions : []

      const fullDbUpdate: Record<string, any> = {}
      if (name !== undefined) fullDbUpdate.name = name
      if (cleanEmail) fullDbUpdate.email = cleanEmail
      if (role !== undefined) fullDbUpdate.role = role
      if (permissions !== undefined) fullDbUpdate.permissions = permsArray
      if (phone !== undefined) fullDbUpdate.phone = phone

      const minDbUpdate: Record<string, any> = {}
      if (name !== undefined) minDbUpdate.name = name
      if (cleanEmail) minDbUpdate.email = cleanEmail
      if (role !== undefined) minDbUpdate.role = role

      if (id) {
        const { error: errFull } = await supabase.from('users').update(fullDbUpdate).eq('id', id)
        if (errFull) {
          await supabase.from('users').update(minDbUpdate).eq('id', id)
        }
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            full_name: name,
            role: role,
            permissions: permsArray,
            phone: phone,
            department: department,
            status: status,
            category_id: category_id,
          }
        }).catch(() => {})
      } else if (cleanEmail) {
        const { error: errFull } = await supabase.from('users').update(fullDbUpdate).ilike('email', cleanEmail)
        if (errFull) {
          await supabase.from('users').update(minDbUpdate).ilike('email', cleanEmail)
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

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
        data: {
          full_name: name,
          role: role || 'USER',
          permissions: Array.isArray(permissions) ? permissions : undefined,
          phone: phone || undefined,
        },
        redirectTo: 'https://yahhope.com/set-password'
      }
    });

    if (linkError) {
      throw new Error(`Erro ao gerar link de convite: ${linkError.message}`);
    }

    const actionLink = linkData.properties.action_link;

    // Insert into public.users table
    if (linkData?.user?.id) {
      const { error: dbError } = await supabase.from('users').upsert({
        id: linkData.user.id,
        name: name,
        email: email,
        role: role || 'USER',
        ...(Array.isArray(permissions) ? { permissions } : {})
      });
      if (dbError) {
        await supabase.from('users').upsert({
          id: linkData.user.id,
          name: name,
          email: email,
          role: role || 'USER'
        });
      }
    }

    // 2. Fetch Global Settings & Templates
    let logoUrl = 'https://www.yahhope.com/logo-black.png';
    let primaryColor = '#F49853';

    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
    if (settings) {
      if (settings.logo_url && !settings.logo_url.includes('Logo+icone.png')) {
        logoUrl = settings.logo_url;
      }
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
              Se o botão não funcionar, clique no link seguro abaixo:<br>
              <a href="${actionLink}" style="color: ${primaryColor}; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 8px;">https://yahhope.com/acesso-seguro</a>
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
        from: 'YAH Hope <contato@yahhope.com>', // Usando o dominio verificado
        to: email,
        subject: subject,
        html: htmlBody
      })
    });

    if (!request.ok) {
      const errorText = await request.text();
      throw new Error(`Erro do Resend: ${errorText}`);
    }

    const resendData = await request.json().catch(() => ({}));

    try {
      const nowIso = new Date().toISOString();
      const { data: createdCamp } = await supabase
        .from('email_campaigns')
        .insert({
          title: `Automático: Convite de Usuário (${name || email})`,
          subject,
          preheader,
          heading,
          body_html: body,
          sender_name: 'YAH Hope',
          sender_email: 'contato@yahhope.com',
          audience_type: 'automatico',
          audience_summary: `${name || email} (${email})`,
          has_cta: true,
          cta_text: ctaText,
          cta_url: actionLink,
          status: 'sent',
          total_recipients: 1,
          sent_count: 1,
          sent_at: nowIso
        })
        .select('id')
        .single();

      if (createdCamp?.id) {
        await supabase.from('email_campaign_recipients').insert({
          campaign_id: createdCamp.id,
          email,
          name: name || email,
          recipient_type: 'automatico',
          status: 'sent',
          resend_id: resendData?.id || null,
          sent_at: nowIso
        });
      }
    } catch (logErr) {
      console.error('Erro ao registrar envio de convite em email_campaigns:', logErr);
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
