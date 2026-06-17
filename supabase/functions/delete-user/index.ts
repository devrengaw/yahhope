import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      throw new Error("ID do usuário é obrigatório")
    }

    // 1. Deletar do auth.users (isso automaticamente deleta de public.users se houver CASCADE, mas vamos deletar explicitamente caso não tenha)
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    
    if (authError) {
      throw new Error(`Erro ao deletar do Auth: ${authError.message}`)
    }

    // 2. Deletar de public.users (fallback, caso não tenha CASCADE trigger)
    const { error: dbError } = await supabase.from('users').delete().eq('id', id)
    
    if (dbError) {
      console.error('Erro ao deletar de public.users:', dbError)
      // Não damos throw aqui porque o mais importante é deletar a conta auth.
    }

    return new Response(JSON.stringify({ success: true, message: 'Usuário deletado com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
