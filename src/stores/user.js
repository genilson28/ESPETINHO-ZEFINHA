// stores/user.js
import { defineStore } from 'pinia'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    profile: null,
    permissions: null,
    loading: false,
    error: null,
    authLoading: true,
    authInitialized: false,
    authListener: null, // ✅ NOVO: Armazenar referência do listener
    isOnline: syncService.checkOnlineStatus(),
    pendingSync: syncService.getPendingCount()
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isAdmin: (state) => state.profile?.role === 'admin',
    isGarcom: (state) => state.profile?.role === 'garcom',
    isCaixa: (state) => state.profile?.role === 'caixa',
    isGerente: (state) => state.profile?.role === 'gerente',
    
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
      
      // ✅ CRÍTICO: Só registrar listener UMA VEZ
      if (!this.authInitialized) {
        this.setupAuthListener()
      }
      
      this.authLoading = true
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError)
          throw sessionError
        }

        if (session?.user) {
          console.log('✅ Sessão encontrada para:', session.user.email)
          this.currentUser = session.user
          await this.fetchProfile(session.user)
        } else {
          console.log('⚠️ Nenhuma sessão ativa encontrada')
          this.currentUser = null
          this.profile = null
          this.permissions = null
        }
        
        this.updateConnectionStatus()
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error)
        this.error = error.message
      } finally {
        this.authLoading = false
        this.authInitialized = true
      }
    },

    // ✅ NOVO: Método separado para configurar listener APENAS UMA VEZ
    setupAuthListener() {
      if (this.authListener) {
        console.log('⚠️ Listener já existe, ignorando...')
        return
      }

      console.log('🎧 Configurando listener de autenticação...')
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        // ✅ Ignorar evento inicial para evitar fetch duplicado
        if (event === 'INITIAL_SESSION') {
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuário fez login:', session.user.email)
          this.currentUser = session.user
          await this.fetchProfile(session.user)
          this.updateConnectionStatus()
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário fez logout')
          this.currentUser = null
          this.profile = null
          this.permissions = null
        } else if (event === 'USER_UPDATED') {
          console.log('🔄 Usuário atualizado')
          this.currentUser = session?.user || null
        }
      })

      this.authListener = subscription
    },

    async fetchProfile(authUser) {
      try {
        console.log('👤 Buscando perfil para:', authUser.email)
        
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('pwa_usuarios')
          .select('*')
          .or(`auth_id.eq.${authUser.id},email.eq.${authUser.email}`)
          .eq('ativo', true)
          .maybeSingle()

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
          
          const { error: updateError } = await supabase
            .from('pwa_usuarios')
            .update({ auth_id: authUser.id })
            .eq('id', usuarioData.id)
          
          if (!updateError) {
            usuarioData.auth_id = authUser.id
          }
        }

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
        
        await this.fetchPermissions(usuarioData.role)
        await this.logAction('login', `Login realizado: ${usuarioData.nome || usuarioData.email}`)
        
      } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error)
        this.error = error.message
        await supabase.auth.signOut()
        throw error
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
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })

        if (error) {
          console.error('❌ Erro de autenticação:', error.message)
          throw error
        }

        console.log('✅ Login bem-sucedido para:', email)
        await new Promise(resolve => setTimeout(resolve, 500))
        this.updateConnectionStatus()

      } catch (error) {
        console.error('❌ Erro no login:', error)
        
        if (error.message.includes('Invalid login credentials')) {
          this.error = 'E-mail ou senha incorretos.'
        } else if (error.message.includes('User not found')) {
          this.error = 'Usuário não encontrado.'
        } else if (error.message.includes('Email not confirmed')) {
          this.error = 'Por favor, confirme seu e-mail.'
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
          await this.logAction('logout', 'Logout realizado')
        }
        
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Erro ao fazer signOut:', error)
        }
        
        this.currentUser = null
        this.profile = null
        this.permissions = null
        this.authInitialized = false
        
        // ✅ Limpar listener
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
        
        this.currentUser = null
        this.profile = null
        this.permissions = null
        this.authInitialized = false
        
        return false
      }
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
