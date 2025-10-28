<template>
  <div class="users-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <Users :size="32" />
          Usuários
        </h1>
        <p class="page-subtitle">Gerencie os usuários do sistema</p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadUsers" :disabled="loading">
          <RefreshCw :size="20" :class="{ spinning: loading }" />
        </button>
        <button class="primary-btn" @click="openCreateModal" v-if="userStore.can('gerenciar_usuarios')">
          <Plus :size="20" />
          Novo Usuário
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && users.length === 0" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando usuários...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <AlertCircle :size="48" />
      <h3>Erro ao carregar usuários</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadUsers">Tentar Novamente</button>
    </div>

    <!-- Users List -->
    <div v-else class="users-container">
      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-box">
          <Search :size="20" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por nome ou email..."
          />
        </div>
        <div class="filter-group">
          <select v-model="filterRole" class="filter-select">
            <option value="">Todos os Cargos</option>
            <option value="admin">Admin</option>
            <option value="gerente">Gerente</option>
            <option value="garcom">Garçom</option>
            <option value="caixa">Caixa</option>
          </select>
          <select v-model="filterStatus" class="filter-select">
            <option value="">Todos os Status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      <!-- Users Grid -->
      <div class="users-grid">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id"
          class="user-card"
          :class="{ inactive: !user.ativo }"
        >
          <div class="user-header">
            <div class="user-avatar" :style="{ background: getRoleColor(user.role) }">
              {{ user.nome?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div class="user-info">
              <h3 class="user-name">{{ user.nome }}</h3>
              <div class="user-email">{{ user.email }}</div>
            </div>
            <div class="user-badge" :class="user.role">
              {{ getRoleLabel(user.role) }}
            </div>
          </div>

          <div class="user-details">
            <div class="detail-item" v-if="user.telefone">
              <Phone :size="14" />
              <span>{{ user.telefone }}</span>
            </div>
            <div class="detail-item">
              <Calendar :size="14" />
              <span>Desde {{ formatDate(user.created_at) }}</span>
            </div>
          </div>

          <div class="user-footer">
            <span class="status-badge" :class="user.ativo ? 'active' : 'inactive'">
              {{ user.ativo ? 'Ativo' : 'Inativo' }}
            </span>
            
            <div class="user-actions" v-if="userStore.can('gerenciar_usuarios')">
              <button 
                class="action-btn edit" 
                @click="editUser(user)"
                title="Editar"
              >
                <Edit2 :size="16" />
              </button>
              <button 
                class="action-btn toggle" 
                @click="toggleUserStatus(user)"
                :title="user.ativo ? 'Desativar' : 'Ativar'"
              >
                <Power :size="16" />
              </button>
              <button 
                class="action-btn delete" 
                @click="deleteUser(user)"
                title="Excluir"
                v-if="user.id !== userStore.profile?.id"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <Users :size="64" />
        <h3>Nenhum usuário encontrado</h3>
        <p>{{ searchQuery ? 'Tente ajustar os filtros de busca' : 'Comece adicionando um novo usuário' }}</p>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
          <button class="close-btn" @click="closeModal">
            <X :size="24" />
          </button>
        </div>

        <form @submit.prevent="saveUser" class="modal-form">
          <div class="form-group">
            <label>Nome Completo *</label>
            <input 
              type="text" 
              v-model="formData.nome" 
              required
              placeholder="Digite o nome completo"
            />
          </div>

          <div class="form-group">
            <label>E-mail *</label>
            <input 
              type="email" 
              v-model="formData.email" 
              required
              placeholder="email@exemplo.com"
              :disabled="editingUser"
            />
          </div>

          <div class="form-group">
            <label>Telefone</label>
            <input 
              type="tel" 
              v-model="formData.telefone" 
              placeholder="(00) 00000-0000"
            />
          </div>

          <div class="form-group">
            <label>Cargo *</label>
            <select v-model="formData.role" required>
              <option value="">Selecione um cargo</option>
              <option value="admin">Admin</option>
              <option value="gerente">Gerente</option>
              <option value="garcom">Garçom</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>

          <div class="form-group" v-if="!editingUser">
            <label>Senha *</label>
            <input 
              type="password" 
              v-model="formData.senha" 
              :required="!editingUser"
              placeholder="Mínimo 6 caracteres"
              minlength="6"
            />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="formData.ativo" />
              <span>Usuário ativo</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { supabase, TABLES } from '@/services/supabase'
import { 
  Users, Plus, RefreshCw, Search, Mail, Phone, 
  Calendar, Edit2, Trash2, Power, AlertCircle, X
} from 'lucide-vue-next'

const userStore = useUserStore()

const users = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const editingUser = ref(null)
const saving = ref(false)

const formData = ref({
  nome: '',
  email: '',
  telefone: '',
  role: '',
  senha: '',
  ativo: true
})

const filteredUsers = computed(() => {
  let result = users.value

  // Filtro de busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.nome?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }

  // Filtro de role
  if (filterRole.value) {
    result = result.filter(user => user.role === filterRole.value)
  }

  // Filtro de status
  if (filterStatus.value !== '') {
    const isActive = filterStatus.value === 'true'
    result = result.filter(user => user.ativo === isActive)
  }

  return result
})

const getRoleColor = (role) => {
  const colors = {
    admin: 'linear-gradient(135deg, #C41E3A, #FF6B35)',
    gerente: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    garcom: 'linear-gradient(135deg, #10b981, #059669)',
    caixa: 'linear-gradient(135deg, #f59e0b, #d97706)'
  }
  return colors[role] || 'linear-gradient(135deg, #6b7280, #4b5563)'
}

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Admin',
    gerente: 'Gerente',
    garcom: 'Garçom',
    caixa: 'Caixa'
  }
  return labels[role] || role
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const loadUsers = async () => {
  loading.value = true
  error.value = null

  try {
    // ✅ CORRIGIDO: Usando TABLES.USUARIOS que agora aponta para 'pwa_usuarios'
    const { data, error: err } = await supabase
      .from(TABLES.USUARIOS)
      .select('*')
      .order('created_at', { ascending: false })

    if (err) throw err

    users.value = data || []
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingUser.value = null
  formData.value = {
    nome: '',
    email: '',
    telefone: '',
    role: '',
    senha: '',
    ativo: true
  }
  showModal.value = true
}

const editUser = (user) => {
  editingUser.value = user
  formData.value = {
    nome: user.nome,
    email: user.email,
    telefone: user.telefone || '',
    role: user.role,
    senha: '',
    ativo: user.ativo
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
  formData.value = {
    nome: '',
    email: '',
    telefone: '',
    role: '',
    senha: '',
    ativo: true
  }
}

const saveUser = async () => {
  saving.value = true

  try {
    if (editingUser.value) {
      // ============================================
      // ATUALIZAR USUÁRIO EXISTENTE
      // ============================================
      // ✅ CORRIGIDO: Usando TABLES.USUARIOS
      const { error: err } = await supabase
        .from(TABLES.USUARIOS)
        .update({
          nome: formData.value.nome,
          telefone: formData.value.telefone,
          role: formData.value.role,
          ativo: formData.value.ativo
        })
        .eq('id', editingUser.value.id)

      if (err) throw err

      await userStore.logAction('atualizar_usuario', `Usuário atualizado: ${formData.value.nome}`)
    } else {
      // ============================================
      // CRIAR NOVO USUÁRIO VIA EDGE FUNCTION
      // ============================================
      
      console.log('📤 Enviando dados para Edge Function:', {
        email: formData.value.email,
        nome: formData.value.nome,
        telefone: formData.value.telefone,
        role: formData.value.role,
        ativo: formData.value.ativo
      })

      // Pegar o token de autenticação atual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Você precisa estar autenticado')
      }

      // ✅ ADICIONAR TIMEOUT - Evita travamento infinito
      const invokePromise = supabase.functions.invoke('create-user', {
        body: {
          email: formData.value.email,
          senha: formData.value.senha,
          nome: formData.value.nome,
          telefone: formData.value.telefone,
          role: formData.value.role,
          ativo: formData.value.ativo
        }
      })

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: A operação demorou mais de 30 segundos')), 30000)
      )

      const { data, error } = await Promise.race([invokePromise, timeoutPromise])

      console.log('📥 Resposta da Edge Function:', data)
      console.log('❌ Erro da Edge Function:', error)

      if (error) {
        console.error('💥 Erro na invocação:', error)
        
        if (error.message.includes('Timeout')) {
          throw new Error('A operação demorou muito. Verifique se a Edge Function está funcionando.')
        }
        
        throw error
      }
      
      if (!data) {
        throw new Error('Nenhuma resposta recebida do servidor')
      }
      
      if (data?.error) {
        console.error('💥 Erro retornado no data:', data.error)
        throw new Error(data.error)
      }

      if (!data?.success) {
        throw new Error(data.message || 'Falha ao criar usuário')
      }

      console.log('✅ Usuário criado com sucesso!')
      await userStore.logAction('criar_usuario', `Novo usuário criado: ${formData.value.nome}`)
    }

    await loadUsers()
    closeModal()
    
    // Mensagem de sucesso
    alert(editingUser.value ? '✅ Usuário atualizado com sucesso!' : '✅ Usuário criado com sucesso!')
    
  } catch (err) {
    console.error('💥 Erro ao salvar usuário:', err)
    
    // Mensagem de erro mais amigável
    let errorMessage = err.message
    
    if (errorMessage.includes('User already registered')) {
      errorMessage = 'Este e-mail já está cadastrado no sistema.'
    } else if (errorMessage.includes('Invalid email')) {
      errorMessage = 'E-mail inválido.'
    } else if (errorMessage.includes('Sem permissão')) {
      errorMessage = 'Você não tem permissão para criar usuários.'
    } else if (errorMessage.includes('Timeout')) {
      errorMessage = 'A operação demorou muito. Verifique se a Edge Function está funcionando corretamente.'
    } else if (errorMessage.includes('Nenhuma resposta')) {
      errorMessage = 'Servidor não respondeu. Verifique sua conexão.'
    }
    
    alert(`❌ Erro ao salvar usuário: ${errorMessage}`)
  } finally {
    saving.value = false
  }
}

const toggleUserStatus = async (user) => {
  if (!confirm(`Deseja ${user.ativo ? 'desativar' : 'ativar'} o usuário ${user.nome}?`)) {
    return
  }

  try {
    // ✅ CORRIGIDO: Usando TABLES.USUARIOS
    const { error: err } = await supabase
      .from(TABLES.USUARIOS)
      .update({ ativo: !user.ativo })
      .eq('id', user.id)

    if (err) throw err

    await userStore.logAction(
      user.ativo ? 'desativar_usuario' : 'ativar_usuario',
      `Usuário ${user.ativo ? 'desativado' : 'ativado'}: ${user.nome}`
    )

    await loadUsers()
  } catch (err) {
    console.error('Erro ao alterar status:', err)
    alert(`Erro ao alterar status: ${err.message}`)
  }
}

const deleteUser = async (user) => {
  if (!confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?\n\nEsta ação não pode ser desfeita!`)) {
    return
  }

  try {
    // ✅ CORRIGIDO: Usando TABLES.USUARIOS
    const { error: err } = await supabase
      .from(TABLES.USUARIOS)
      .delete()
      .eq('id', user.id)

    if (err) throw err

    await userStore.logAction('deletar_usuario', `Usuário deletado: ${user.nome}`)
    await loadUsers()
  } catch (err) {
    console.error('Erro ao deletar usuário:', err)
    alert(`Erro ao deletar usuário: ${err.message}`)
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-view {
  padding: 1.5rem;
  padding-bottom: 5rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1f2937;
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.refresh-btn {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #f8fafc;
  color: #C41E3A;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.primary-btn {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

/* Loading & Error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-container {
  color: #6b7280;
}

.error-container h3 {
  color: #1f2937;
  margin: 1rem 0 0.5rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.search-box svg {
  color: #6b7280;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: #C41E3A;
}

/* Users Grid - Cards menores e mais compactos */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.user-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-card.inactive {
  opacity: 0.6;
}

/* Header compacto */
.user-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.user-badge.admin {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
}

.user-badge.gerente {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.user-badge.garcom {
  background: linear-gradient(135deg, #10b981, #059669);
}

.user-badge.caixa {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

/* Detalhes compactos */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6b7280;
  font-size: 0.75rem;
}

/* Footer compacto */
.user-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.user-actions {
  display: flex;
  gap: 0.375rem;
}

.action-btn {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit {
  color: #3b82f6;
}

.action-btn.edit:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.action-btn.toggle {
  color: #f59e0b;
}

.action-btn.toggle:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
}

.action-btn.delete {
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #C41E3A;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #C41E3A;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f8fafc;
}

.save-btn {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  border: none;
  color: white;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .filter-group {
    flex-direction: column;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }
  
  .user-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .user-actions {
    justify-content: center;
  }
}
</style>
