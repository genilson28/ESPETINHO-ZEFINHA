<template>
  <div class="dashboard-gerente">
    <!-- Header do Dashboard -->
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-title">Dashboard Gerencial</h1>
        <p class="dashboard-subtitle">Visão geral das operações</p>
      </div>
      <div class="header-actions">
        <div class="header-date">
          <Calendar :size="20" />
          <span>{{ currentDate }}</span>
        </div>
        <button @click="fazerLogout" class="btn-logout" title="Deslogar" :disabled="isLoggingOut">
          <LogOut :size="20" />
          <span>{{ isLoggingOut ? 'Saindo...' : 'Sair' }}</span>
        </button>
      </div>
    </div>

    <!-- Cards de Resumo -->
    <div class="stats-grid">
      <!-- Mesas Ocupadas -->
      <div class="stat-card occupied clickable" @click="goToTables">
        <div class="stat-icon">
          <UtensilsCrossed :size="32" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Mesas Ocupadas</p>
          <h3 class="stat-value">{{ mesasOcupadas }}/{{ totalMesas }}</h3>
        </div>
      </div>

      <!-- Pedidos Hoje -->
      <div class="stat-card orders clickable" @click="router.push('/orders')">
        <div class="stat-icon">
          <ShoppingBag :size="32" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Pedidos Hoje</p>
          <h3 class="stat-value">{{ pedidosHoje }}</h3>
        </div>
      </div>

      <!-- Pedidos em Aberto -->
      <div class="stat-card pending clickable" @click="router.push('/orders')">
        <div class="stat-icon">
          <Clock :size="32" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Em Aberto</p>
          <h3 class="stat-value">{{ pedidosAbertos }}</h3>
        </div>
      </div>

      <!-- Vendas do Dia -->
      <div class="stat-card revenue clickable" @click="router.push('/orders')">
        <div class="stat-icon">
          <DollarSign :size="32" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Vendas Hoje</p>
          <h3 class="stat-value">R$ {{ vendasHoje }}</h3>
        </div>
      </div>
    </div>

    <!-- Ações Rápidas -->
    <div class="quick-actions">
      <h2 class="section-title">Ações Rápidas</h2>
      <div class="actions-grid">
        <button @click="goToTables" class="action-card">
          <UtensilsCrossed :size="40" />
          <span>Ver Mesas</span>
        </button>
        <button @click="goToNewOrder" class="action-card">
          <Plus :size="40" />
          <span>Novo Pedido</span>
        </button>
        <button @click="$router.push('/orders')" class="action-card">
          <List :size="40" />
          <span>Pedidos</span>
        </button>
      </div>
    </div>

    <!-- Mesas Ocupadas -->
    <div class="occupied-tables" v-if="mesasOcupadasList.length > 0">
      <h2 class="section-title">Mesas Ocupadas</h2>
      <div class="tables-list">
        <div 
          v-for="mesa in mesasOcupadasList" 
          :key="mesa.id"
          class="table-item"
          @click="goToPDV(mesa)"
        >
          <div class="table-number">{{ mesa.numero }}</div>
          <div class="table-info">
            <span class="table-label">Mesa {{ mesa.numero }}</span>
            <span class="table-time">{{ formatarTempo(mesa.created_at) }}</span>
          </div>
          <div class="table-action">
            <ChevronRight :size="20" />
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-else class="empty-state">
      <UtensilsCrossed :size="64" />
      <p>Nenhuma mesa ocupada no momento</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '@/stores/tables'
import { useNavigationStore } from '@/stores/navigation'
import { useUserStore } from '@/stores/user'
import { supabase, TABLES } from '@/services/supabase'
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  Calendar,
  Plus,
  List,
  ChevronRight,
  LogOut
} from 'lucide-vue-next'

const router = useRouter()
const tablesStore = useTablesStore()
const navigationStore = useNavigationStore()
const userStore = useUserStore()

// Dados simulados - você pode buscar do banco
const pedidosHoje = ref(0)
const pedidosAbertos = ref(0)
const vendasHoje = ref('0,00')
const isLoggingOut = ref(false)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const totalMesas = computed(() => tablesStore.tables.length)
const mesasOcupadas = computed(() => tablesStore.occupiedTables.length)

const mesasOcupadasList = computed(() => {
  return tablesStore.occupiedTables
})

const formatarTempo = (timestamp) => {
  if (!timestamp) return 'Agora'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 60000) // minutos
  
  if (diff < 1) return 'Agora'
  if (diff < 60) return `${diff}min atrás`
  const hours = Math.floor(diff / 60)
  return `${hours}h atrás`
}

/**
 * ✅ Navega para mesas passando o contexto correto
 */
function goToTables() {
  navigationStore.setContext({ 
    from: 'dashboard',
    returnTo: 'dashboard' 
  })
  router.push({ name: 'tables', query: { from: 'dashboard' } })
}

/**
 * ✅ Navega para PDV direto de uma mesa ocupada
 */
function goToPDV(mesa) {
  navigationStore.setContext({
    from: 'dashboard',
    tableId: mesa.id,
    tableNumber: mesa.numero,
    returnTo: 'dashboard'
  })
  router.push({
    name: 'pdv',
    query: {
      mesaId: mesa.id,
      mesaNumero: mesa.numero,
      from: 'dashboard'
    }
  })
}

/**
 * ✅ Navega para criar novo pedido (vai para mesas primeiro)
 */
function goToNewOrder() {
  navigationStore.setContext({ 
    from: 'dashboard',
    returnTo: 'dashboard' 
  })
  router.push({ name: 'tables', query: { from: 'dashboard' } })
}

/**
 * ✅ Função de logout melhorada
 */
async function fazerLogout() {
  if (isLoggingOut.value) return // Previne cliques múltiplos
  
  if (confirm('Tem certeza que deseja deslogar?')) {
    isLoggingOut.value = true
    
    try {
      console.log('🔄 Iniciando logout...')
      
      // Tenta fazer logout via store
      await userStore.logout()
      
      // Limpa stores locais
      tablesStore.$reset()
      navigationStore.$reset()
      
      console.log('✅ Logout realizado com sucesso')
      
      // Força navegação para login
      await router.replace('/login')
      
      // Recarrega a página para garantir limpeza total
      window.location.href = '/login'
      
    } catch (error) {
      console.error('❌ Erro ao deslogar:', error)
      isLoggingOut.value = false
      
      // Mesmo com erro, força logout local
      try {
        // Logout forçado do Supabase
        await supabase.auth.signOut()
        
        // Limpa tudo localmente
        localStorage.clear()
        sessionStorage.clear()
        
        // Redireciona
        window.location.href = '/login'
      } catch (fallbackError) {
        console.error('❌ Erro crítico no logout:', fallbackError)
        alert('Erro ao deslogar. A página será recarregada.')
        window.location.reload()
      }
    }
  }
}

async function carregarDados() {
  try {
    // Buscar mesas
    await tablesStore.fetchTables()
    
    // Buscar pedidos de hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const { data: pedidos, error } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .gte('created_at', hoje.toISOString())
    
    if (error) {
      console.error('Erro ao buscar pedidos:', error)
      return
    }
    
    // Atualizar contadores
    pedidosHoje.value = pedidos?.length || 0
    pedidosAbertos.value = pedidos?.filter(p => p.status === 'active' || p.status === 'pending').length || 0
    
    // Calcular vendas do dia (apenas pedidos concluídos)
    const vendasTotal = pedidos
      ?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.valor_total) || 0), 0) || 0
    
    vendasHoje.value = vendasTotal.toFixed(2).replace('.', ',')
    
    console.log('✅ Dados atualizados:', { pedidosHoje: pedidosHoje.value, pedidosAbertos: pedidosAbertos.value, vendasHoje: vendasHoje.value })
    
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
  }
}

onMounted(() => {
  carregarDados()
})

// ✅ Recarregar dados quando voltar para o dashboard
onActivated(() => {
  console.log('♻️ Dashboard reativado - recarregando dados...')
  carregarDados()
})
</script>

<style scoped>
.dashboard-gerente {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.dashboard-subtitle {
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #4b5563;
  font-size: 0.9rem;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.btn-logout:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-logout span {
  display: none;
}

@media (min-width: 640px) {
  .btn-logout span {
    display: inline;
  }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 1.25rem;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-card.occupied .stat-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.stat-card.orders .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-card.revenue .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

/* Ações Rápidas */
.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.quick-actions {
  margin-bottom: 2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border: 2px solid #e5e7eb;
  padding: 2rem 1.5rem;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #C41E3A;
}

.action-card:hover {
  border-color: #C41E3A;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(196, 30, 58, 0.15);
}

.action-card span {
  font-weight: 600;
  font-size: 1rem;
}

/* Mesas Ocupadas */
.occupied-tables {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.tables-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.table-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.table-number {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
}

.table-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.table-label {
  font-weight: 600;
  color: #1f2937;
}

.table-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-action {
  color: #9ca3af;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>