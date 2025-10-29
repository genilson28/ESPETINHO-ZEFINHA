<template>
  <div class="staff-orders-container">
    <!-- Header -->
    <div class="orders-header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Pedidos Ativos</h1>
      <button @click="refreshOrders" class="btn-refresh" :disabled="loading">
        <svg 
          width="20" height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
          :class="{ spinning: loading }"
        >
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>

    <!-- Connection Status -->
    <div v-if="!isOnline" class="connection-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v4m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      </svg>
      <span>Modo Offline - Atualizações em tempo real pausadas</span>
    </div>

    <!-- Stats -->
    <div class="orders-stats">
      <div class="stat-card">
        <div class="stat-icon active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Novos</span>
          <span class="stat-value">{{ newOrders.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon preparing">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Preparando</span>
          <span class="stat-value">{{ preparingOrders.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon ready">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Prontos</span>
          <span class="stat-value">{{ readyOrders.length }}</span>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button 
        @click="currentFilter = 'all'"
        class="filter-tab"
        :class="{ active: currentFilter === 'all' }"
      >
        Todos ({{ orders.length }})
      </button>
      <button 
        @click="currentFilter = 'active'"
        class="filter-tab"
        :class="{ active: currentFilter === 'active' }"
      >
        Novos ({{ newOrders.length }})
      </button>
      <button 
        @click="currentFilter = 'preparing'"
        class="filter-tab"
        :class="{ active: currentFilter === 'preparing' }"
      >
        Preparando ({{ preparingOrders.length }})
      </button>
      <button 
        @click="currentFilter = 'ready'"
        class="filter-tab"
        :class="{ active: currentFilter === 'ready' }"
      >
        Prontos ({{ readyOrders.length }})
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando pedidos...</p>
    </div>

    <!-- Orders List -->
    <div v-else-if="filteredOrders.length > 0" class="orders-list">
      <div 
        v-for="order in filteredOrders" 
        :key="order.id"
        class="order-card"
        :class="getOrderStatusClass(order.status)"
        @click="viewOrderDetails(order)"
      >
        <div class="order-header">
          <div class="order-number">
            <span class="number">#{{ String(order.id).slice(0, 8) }}</span>
            <span class="badge" :class="getOrderStatusClass(order.status)">
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
          <div class="order-table">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Mesa {{ getTableNumber(order.mesa_id) }}</span>
          </div>
        </div>

        <div class="order-items-preview">
          <div v-for="(item, idx) in order.itens.slice(0, 2)" :key="idx" class="item-preview">
            <span>{{ item.quantidade }}x {{ item.nome }}</span>
          </div>
          <div v-if="order.itens.length > 2" class="more-items">
            +{{ order.itens.length - 2 }} item(ns)
          </div>
        </div>

        <div class="order-footer">
          <div class="order-time">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ getTimeAgo(order.created_at) }}
          </div>
          <div class="order-total">
            R$ {{ formatPrice(order.valor_total) }}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="order-actions" @click.stop>
          <button 
            v-if="order.status === 'active'"
            @click="updateOrderStatus(order.id, 'preparing')"
            class="btn-action preparing"
          >
            Preparar
          </button>
          <button 
            v-if="order.status === 'preparing'"
            @click="updateOrderStatus(order.id, 'ready')"
            class="btn-action ready"
          >
            Pronto
          </button>
          <button 
            v-if="order.status === 'ready'"
            @click="updateOrderStatus(order.id, 'delivered')"
            class="btn-action delivered"
          >
            Entregar
          </button>
          <button @click="viewOrderDetails(order)" class="btn-action details">
            Detalhes
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <p>Nenhum pedido {{ currentFilter !== 'all' ? getFilterLabel() : '' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, TABLES, subscribeToTable } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()

const orders = ref([])
const tables = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const isOnline = ref(syncService.checkOnlineStatus())
let subscription = null

// Computed
const newOrders = computed(() => {
  return orders.value.filter(o => o.status === 'active')
})

const preparingOrders = computed(() => {
  return orders.value.filter(o => o.status === 'preparing')
})

const readyOrders = computed(() => {
  return orders.value.filter(o => o.status === 'ready')
})

const filteredOrders = computed(() => {
  if (currentFilter.value === 'all') return orders.value
  return orders.value.filter(o => o.status === currentFilter.value)
})

// Methods
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2).replace('.', ',')
}

const getTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}m atrás`
  if (hours < 24) return `${hours}h atrás`
  return date.toLocaleDateString('pt-BR')
}

const getTableNumber = (tableId) => {
  const table = tables.value.find(t => t.id === tableId)
  return table?.numero || 'N/A'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Novo',
    'preparing': 'Preparando',
    'ready': 'Pronto',
    'delivered': 'Entregue'
  }
  return labels[status] || status
}

const getOrderStatusClass = (status) => {
  return `status-${status}`
}

const getFilterLabel = () => {
  const labels = {
    'active': 'novo',
    'preparing': 'em preparação',
    'ready': 'pronto'
  }
  return labels[currentFilter.value] || ''
}

const loadOrders = async () => {
  loading.value = true

  try {
    // Buscar pedidos ativos
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .in('status', ['active', 'preparing', 'ready'])
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError
    orders.value = ordersData || []

    // Buscar mesas
    const { data: tablesData, error: tablesError } = await supabase
      .from(TABLES.MESAS)
      .select('*')

    if (tablesError) throw tablesError
    tables.value = tablesData || []

    console.log('✅ Pedidos carregados:', orders.value.length)

    // Iniciar subscription
    startRealtimeSubscription()
  } catch (error) {
    console.error('❌ Erro ao carregar pedidos:', error)
  } finally {
    loading.value = false
  }
}

const refreshOrders = () => {
  loadOrders()
}

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const result = await syncService.update(TABLES.PEDIDOS, orderId, {
      status: newStatus
    })

    if (result.offline) {
      alert('Atualização será sincronizada quando voltar online')
    }

    // Atualizar localmente
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = newStatus
      console.log(`✅ Status do pedido ${orderId} atualizado para ${newStatus}`)
    }

    // Se foi entregue, remover da lista
    if (newStatus === 'delivered') {
      setTimeout(() => {
        orders.value = orders.value.filter(o => o.id !== orderId)
      }, 1000)
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
    alert('Erro ao atualizar status do pedido')
  }
}

const viewOrderDetails = (order) => {
  router.push({
    name: 'order-details',
    params: { orderId: order.id }
  })
}

const startRealtimeSubscription = () => {
  if (subscription) return

  subscription = subscribeToTable(TABLES.PEDIDOS, (payload) => {
    console.log('🔄 Atualização de pedido:', payload)

    if (payload.eventType === 'INSERT') {
      // Novo pedido
      if (['active', 'preparing', 'ready'].includes(payload.new.status)) {
        orders.value.unshift(payload.new)
        console.log('✅ Novo pedido adicionado:', payload.new.id)
        
        // Tocar som de notificação
        playNotificationSound()
      }
    } else if (payload.eventType === 'UPDATE') {
      // Atualizar pedido existente
      const index = orders.value.findIndex(o => o.id === payload.new.id)
      if (index !== -1) {
        if (['active', 'preparing', 'ready'].includes(payload.new.status)) {
          orders.value[index] = payload.new
          console.log('✅ Pedido atualizado:', payload.new.id)
        } else {
          // Remover se não for mais ativo
          orders.value.splice(index, 1)
          console.log('🗑️ Pedido removido da lista:', payload.new.id)
        }
      }
    } else if (payload.eventType === 'DELETE') {
      // Remover pedido
      const index = orders.value.findIndex(o => o.id === payload.old.id)
      if (index !== -1) {
        orders.value.splice(index, 1)
        console.log('🗑️ Pedido deletado:', payload.old.id)
      }
    }
  })

  console.log('✅ Subscription realtime iniciada')
}

const stopRealtimeSubscription = () => {
  if (subscription) {
    subscription()
    subscription = null
    console.log('🛑 Subscription realtime parada')
  }
}

const playNotificationSound = () => {
  // Reproduzir som de notificação
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIAtNn9/yuWcdBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuCzPLZiTYIG2i77OihUBELTqXh8bllHws7kNXywn0pBSd+yvLTgjMIGGS56+mlUhUMUKXh8LFkIA==')
  try {
    audio.play()
  } catch (error) {
    console.log('Não foi possível reproduzir som de notificação')
  }
}

const goBack = () => {
  router.back()
}

// Lifecycle
onMounted(() => {
  loadOrders()
  
  // Atualizar status de conexão
  window.addEventListener('online', () => {
    isOnline.value = true
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })
})

onUnmounted(() => {
  stopRealtimeSubscription()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.staff-orders-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding-bottom: 2rem;
}

.orders-header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-back,
.btn-refresh {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-back:hover,
.btn-refresh:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.orders-header h1 {
  margin: 0;
  font-size: 1.5rem;
  flex: 1;
}

.connection-banner {
  background: #fbbf24;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.orders-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.active {
  background: #3b82f620;
  color: #3b82f6;
}

.stat-icon.preparing {
  background: #f59e0b20;
  color: #f59e0b;
}

.stat-icon.ready {
  background: #10b98120;
  color: #10b981;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-value {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: bold;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tab {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.filter-tab.active {
  background: #C41E3A;
  color: white;
  border-color: #C41E3A;
}

.filter-tab:hover {
  border-color: #C41E3A;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.orders-list {
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.order-card.status-active {
  border-left-color: #3b82f6;
}

.order-card.status-preparing {
  border-left-color: #f59e0b;
}

.order-card.status-ready {
  border-left-color: #10b981;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.order-number {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-number .number {
  color: #1f2937;
  font-weight: bold;
  font-size: 1.1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.status-active {
  background: #3b82f620;
  color: #3b82f6;
}

.badge.status-preparing {
  background: #f59e0b20;
  color: #f59e0b;
}

.badge.status-ready {
  background: #10b98120;
  color: #10b981;
}

.order-table {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-weight: 600;
}

.order-items-preview {
  margin-bottom: 1rem;
}

.item-preview {
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.25rem 0;
}

.more-items {
  color: #9ca3af;
  font-size: 0.75rem;
  font-style: italic;
  margin-top: 0.25rem;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.order-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.order-total {
  color: #C41E3A;
  font-size: 1.25rem;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-action.preparing {
  background: #f59e0b;
  color: white;
}

.btn-action.ready {
  background: #10b981;
  color: white;
}

.btn-action.delivered {
  background: #3b82f6;
  color: white;
}

.btn-action.details {
  background: #e5e7eb;
  color: #6b7280;
}

.btn-action:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  opacity: 0.5;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .orders-stats {
    grid-template-columns: 1fr;
  }
  
  .order-actions {
    flex-direction: column;
  }
}
</style>
