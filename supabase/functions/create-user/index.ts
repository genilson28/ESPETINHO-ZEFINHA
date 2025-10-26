// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // ✅ Responder ao preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  // ✅ CORREÇÃO: Ler o corpo UMA ÚNICA VEZ no início
  let requestData;
  try {
    requestData = await req.json()
    console.log('📥 Dados recebidos:', requestData)
  } catch (parseError) {
    console.error('❌ Erro ao parsear JSON:', parseError)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'JSON inválido no corpo da requisição' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  try {
    // Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token de autenticação não fornecido' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Não autenticado' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Verificar se o usuário é admin
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('pwa_usuarios')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (userDataError || userData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Sem permissão. Apenas admins podem criar usuários.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // ✅ CORREÇÃO: Usar requestData já parseado
    const email = requestData.email
    const senha = requestData.senha || requestData.password
    const nome = requestData.nome || requestData.name
    const telefone = requestData.telefone || requestData.phone
    const role = requestData.role
    const ativo = requestData.ativo !== undefined ? requestData.ativo : true

    console.log('📝 Dados processados:', { email, nome, role, telefone, ativo })

    // Validação
    if (!email || !senha || !nome || !role) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Dados obrigatórios faltando: email, senha, nome, role' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('📝 Criando usuário no Auth...')

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        role
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar no auth:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao criar usuário: ${authError.message}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('✅ Usuário criado no auth:', authData.user.id)

    // Inserir no banco de dados
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('pwa_usuarios')
      .insert({
        auth_id: authData.user.id,
        nome,
        email,
        telefone: telefone || null,
        role,
        ativo
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao inserir no banco:', dbError)
      
      // Tentar deletar o usuário do auth se falhar no banco
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao salvar no banco: ${dbError.message}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('✅ Usuário inserido no banco com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          nome,
          role,
          telefone,
          ativo
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('💥 Erro inesperado na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    )
  }
})