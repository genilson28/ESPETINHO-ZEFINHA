// stores/user.js
import { defineStore } from 'pinia'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

// ✅ Função helper para timeout (da minha solução)
const withTimeout = (promise, timeoutMs = 10000, errorMsg = 'Operação excedeu o tempo limite') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ])
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    profile: null,
    permissions: null,
    loading: false,
    error: null,
    authLoading: true,
    authInitialized: false,
    authListener: null,
    isFetchingProfile: false,
    isOnline: syncService.checkOnlineStatus(),
    pendingSync: syncService.getPendingCount()
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isAdmin: (state) => state.profile?.role === 'admin',
    isGarcom: (state) => state.profile?.role === 'garcom',
    isCaixa: (state) => state.profile?.role === 'caixa',
    isGerente: (state) => state.profile?.role === 'gerente',
    isCozinha: (state) => state.profile?.role === 'cozinha', // ✅ NOVO
    
    can: (state) => (permission) => {
      if (!state.permissions) return false
      return state.permissions[permission] === true
    },

    connectionStatus: (state) => {
      if (!state.isOnline) return 'offline'
      if (state.pendingSync > 0) return 'syncing'
      return 'online'
    },

    hasPendingOperations: (state) => {
      return state.pendingSync > 0
    }
  },

  actions: {
    updateConnectionStatus() {
      this.isOnline = syncService.checkOnlineStatus()
      this.pendingSync = syncService.getPendingCount()
    },

    async initAuth() {
      console.log('🔐 Iniciando autenticação...')
      
      if (this.authInitialized) {
        console.log('⚠️ Auth já inicializado, ignorando...')
        return
      }
      
      this.setupAuthListener()
      this.authLoading = true
      
      try {
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Timeout ao buscar sessão'
        )
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError)
          throw sessionError
        }

        if (session?.user) {
          console.log('✅ Sessão encontrada para:', session.user.email)
          
          if (!this.profile || this.profile.email !== session.user.email) {
            this.currentUser = session.user
            await this.fetchProfile(session.user)
          }
        } else {
          console.log('⚠️ Nenhuma sessão ativa encontrada')
          this.clearUserData()
        }
        
        this.updateConnectionStatus()
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error)
        this.error = error.message
        this.clearUserData()
        
        if (error.message.includes('Timeout') || error.message.includes('tempo limite')) {
          console.log('⏰ Detectado timeout, limpando sessão...')
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            console.error('Erro ao fazer signOut:', signOutError)
          }
        }
      } finally {
        this.authLoading = false
        this.authInitialized = true
      }
    },

    setupAuthListener() {
      if (this.authListener) {
        console.log('⚠️ Listener já existe, ignorando...')
        return
      }

      console.log('🎧 Configurando listener de autenticação...')
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          console.log('🔕 Ignorando evento:', event)
          return
        }
        
        if (this.isFetchingProfile) {
          console.log('⏳ Já buscando perfil, ignorando evento...')
          return
        }

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ Usuário fez login:', session.user.email)
              
              if (!this.currentUser || this.currentUser.id !== session.user.id) {
                this.currentUser = session.user
                
                try {
                  await this.fetchProfile(session.user)
                } catch (error) {
                  console.error('❌ Erro no listener ao buscar perfil:', error)
                  this.error = 'Erro ao carregar perfil do usuário'
                }
              }
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 Usuário fez logout')
            this.clearUserData()
            break;
            
          case 'USER_UPDATED':
            console.log('🔄 Usuário atualizado')
            this.currentUser = session?.user || null
            break;
            
          default:
            console.log('🔔 Evento não tratado:', event)
        }
        
        this.updateConnectionStatus()
      })

      this.authListener = subscription
    },

    async fetchProfile(authUser) {
      if (this.isFetchingProfile) {
        console.log('⏳ Fetch de perfil já em andamento...')
        return
      }

      this.isFetchingProfile = true
      
      try {
        console.log('👤 Buscando perfil para:', authUser.email)
        
        const { data: usuarioData, error: usuarioError } = await withTimeout(
          supabase
            .from('pwa_usuarios')
            .select('*')
            .or(`auth_id.eq.${authUser.id},email.eq.${authUser.email}`)
            .eq('ativo', true)
            .maybeSingle(),
          8000,
          'Timeout ao buscar usuário no banco de dados'
        )

        if (usuarioError) {
          console.error('❌ Erro ao buscar usuário:', usuarioError)
          throw usuarioError
        }

        if (!usuarioData) {
          console.error('❌ Usuário não encontrado na tabela pwa_usuarios')
          throw new Error('Usuário não cadastrado no sistema. Entre em contato com o administrador.')
        }

        if (!usuarioData.auth_id) {
          console.log('⚠️ Atualizando auth_id do usuário...')
          
          const { error: updateError } = await withTimeout(
            supabase
              .from('pwa_usuarios')
              .update({ auth_id: authUser.id })
              .eq('id', usuarioData.id),
            5000,
            'Timeout ao atualizar auth_id'
          )
          
          if (!updateError) {
            usuarioData.auth_id = authUser.id
          }
        }

        if (!this.profile || this.profile.id !== usuarioData.id) {
          console.log('✅ Usuário encontrado:', usuarioData.nome, '- Role:', usuarioData.role)
          
          this.profile = {
            id: usuarioData.id,
            auth_id: usuarioData.auth_id,
            role: usuarioData.role,
            nome: usuarioData.nome,
            email: usuarioData.email,
            telefone: usuarioData.telefone,
            ativo: usuarioData.ativo
          }
          
          try {
            await withTimeout(
              this.fetchPermissions(usuarioData.role),
              5000,
              'Timeout ao buscar permissões'
            )
          } catch (permError) {
            console.warn('⚠️ Erro ao buscar permissões, usando padrão:', permError)
            this.permissions = this.getDefaultPermissions(usuarioData.role)
          }
          
          this.logAction('login', `Login realizado: ${usuarioData.nome || usuarioData.email}`).catch(err => {
            console.warn('⚠️ Erro ao registrar log:', err)
          })
        } else {
          console.log('ℹ️ Perfil já carregado, ignorando...')
        }
        
      } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error)
        this.error = error.message
        
        if (!error.message.includes('Timeout') && !error.message.includes('tempo limite')) {
          await supabase.auth.signOut()
        }
        
        throw error
      } finally {
        this.isFetchingProfile = false
      }
    },

    async fetchPermissions(role) {
      try {
        console.log('🔑 Buscando permissões para role:', role)
        
        const { data, error } = await supabase
          .from('pwa_permissoes')
          .select('*')
          .eq('role', role)
          .maybeSingle()

        if (error) {
          console.warn('⚠️ Erro ao buscar permissões:', error)
          this.permissions = this.getDefaultPermissions(role)
          return
        }

        if (data) {
          console.log('✅ Permissões carregadas:', data)
          this.permissions = data
        } else {
          console.log('⚠️ Permissões não encontradas, usando padrão')
          this.permissions = this.getDefaultPermissions(role)
        }
      } catch (error) {
        console.error('❌ Erro ao buscar permissões:', error)
        this.permissions = this.getDefaultPermissions(role)
      }
    },

    getDefaultPermissions(role) {
      const defaults = {
        admin: {
          ver_dashboard: true,
          ver_mesas: true,
          ver_pedidos: true,
          ver_produtos: true,
          ver_financeiro: true,
          ver_usuarios: true,
          ver_relatorios: true,
          criar_pedido: true,
          editar_pedido: true,
          cancelar_pedido: true,
          gerenciar_mesas: true,
          gerenciar_produtos: true,
          gerenciar_usuarios: true,
          aplicar_desconto: true,
          fechar_caixa: true
        },
        gerente: {
          ver_dashboard: true,
          ver_mesas: true,
          ver_pedidos: true,
          ver_produtos: true,
          ver_financeiro: true,
          ver_usuarios: false,
          ver_relatorios: true,
          criar_pedido: true,
          editar_pedido: true,
          cancelar_pedido: true,
          gerenciar_mesas: true,
          gerenciar_produtos: true,
          gerenciar_usuarios: false,
          aplicar_desconto: true,
          fechar_caixa: true
        },
        garcom: {
          ver_dashboard: false,
          ver_mesas: true,
          ver_pedidos: true,
          ver_produtos: true,
          ver_financeiro: false,
          ver_usuarios: false,
          ver_relatorios: false,
          criar_pedido: true,
          editar_pedido: true,
          cancelar_pedido: false,
          gerenciar_mesas: false,
          gerenciar_produtos: false,
          gerenciar_usuarios: false,
          aplicar_desconto: false,
          fechar_caixa: false
        },
        // ✅ NOVO - COZINHA
        cozinha: {
          ver_dashboard: true,
          ver_mesas: false,
          ver_pedidos: true,
          ver_produtos: false,
          ver_financeiro: false,
          ver_usuarios: false,
          ver_relatorios: false,
          criar_pedido: false,
          editar_pedido: true,
          cancelar_pedido: false,
          gerenciar_mesas: false,
          gerenciar_produtos: false,
          gerenciar_usuarios: false,
          aplicar_desconto: false,
          fechar_caixa: false
        },
        caixa: {
          ver_dashboard: false,
          ver_mesas: true,
          ver_pedidos: true,
          ver_produtos: true,
          ver_financeiro: true,
          ver_usuarios: false,
          ver_relatorios: false,
          criar_pedido: true,
          editar_pedido: true,
          cancelar_pedido: true,
          gerenciar_mesas: false,
          gerenciar_produtos: false,
          gerenciar_usuarios: false,
          aplicar_desconto: true,
          fechar_caixa: true
        }
      }

      return defaults[role] || defaults.garcom
    },

    async login(email, password) {
      console.log('🔐 Tentando login com email:', email)
      this.loading = true
      this.error = null
      
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          10000,
          'Timeout ao fazer login'
        )

        if (error) {
          console.error('❌ Erro de autenticação:', error.message)
          throw error
        }

        console.log('✅ Login bem-sucedido para:', email)
        
        // ✅ Buscar profile DIRETAMENTE ao invés de esperar o listener
        if (data.user) {
          this.currentUser = data.user
          await this.fetchProfile(data.user)
        }

        this.updateConnectionStatus()

        // ✅ RETORNAR ROLE PARA REDIRECIONAMENTO
        console.log('🎯 Retornando role:', this.profile?.role)
        return this.profile?.role
      } catch (error) {
        console.error('❌ Erro no login:', error)
        
        if (error.message.includes('Invalid login credentials')) {
          this.error = 'E-mail ou senha incorretos.'
        } else if (error.message.includes('User not found')) {
          this.error = 'Usuário não encontrado.'
        } else if (error.message.includes('Email not confirmed')) {
          this.error = 'Por favor, confirme seu e-mail.'
        } else if (error.message.includes('Timeout') || error.message.includes('tempo limite')) {
          this.error = 'Conexão lenta. Tente novamente.'
        } else {
          this.error = error.message || 'Erro ao fazer login.'
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      console.log('👋 Fazendo logout...')
      try {
        if (this.profile?.id) {
          this.logAction('logout', 'Logout realizado').catch(err => {
            console.warn('⚠️ Erro ao registrar log de logout:', err)
          })
        }
        
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Erro ao fazer signOut:', error)
        }
        
        this.clearUserData()
        this.authInitialized = false
        
        if (this.authListener) {
          this.authListener.unsubscribe()
          this.authListener = null
        }
        
        this.stopRealtimeSubscription()
        
        console.log('✅ Logout concluído')
        return true
      } catch (error) {
        console.error('❌ Erro no logout:', error)
        this.error = error.message
        
        this.clearUserData()
        this.authInitialized = false
        
        return false
      }
    },

    clearUserData() {
      this.currentUser = null
      this.profile = null
      this.permissions = null
      this.isFetchingProfile = false
    },
    
    stopRealtimeSubscription() {
      if (this.subscription) {
        try {
          this.subscription.unsubscribe()
          this.subscription = null
        } catch (error) {
          console.error('Erro ao parar subscription:', error)
        }
      }
    },

    async logAction(acao, descricao, entidade = null, entidadeId = null) {
      if (!this.profile?.id) return

      try {
        const logData = {
          usuario_id: this.profile.id,
          acao,
          descricao,
          entidade,
          entidade_id: entidadeId,
          ip_address: null,
          user_agent: navigator.userAgent
        }

        const result = await syncService.insert(TABLES.USUARIOS_LOGS, logData)
        
        if (result.offline) {
          console.log('📴 Log será sincronizado quando voltar online')
        }
        
        this.updateConnectionStatus()
      } catch (error) {
        console.error('❌ Erro ao registrar log:', error)
      }
    },

    async loadUserFromStorage() {
      await this.initAuth()
    },

    clearError() {
      this.error = null
    }
  }
})
