<template>
  <div class="orders-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <button @click="voltarParaDashboard" class="btn-back">
          <ArrowLeft :size="20" />
        </button>
        <div>
          <h1>Pedidos</h1>
          <p>Gerencie todos os pedidos do sistema</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="refreshOrders">
          <RefreshCw :size="20" :class="{ spinning: loading }" />
          Atualizar
        </button>
        <button class="btn-primary" @click="$router.push({ path: '/pdv', query: { mode: 'balcao' } })">
          <Plus :size="20" />
          Novo Pedido
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">
          <ShoppingCart :size="24" color="#3b82f6" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Pedidos Hoje</p>
          <p class="stat-value">{{ todayOrdersCount }}</p>
          <p class="stat-change">{{ pendingOrdersCount }} pendentes</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #dcfce7;">
          <DollarSign :size="24" color="#22c55e" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Receita Hoje</p>
          <p class="stat-value">R$ {{ formatPrice(todayRevenue) }}</p>
          <p class="stat-change">Total faturado</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7;">
          <Clock :size="24" color="#f59e0b" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Ticket Médio</p>
          <p class="stat-value">R$ {{ formatPrice(averageTicket) }}</p>
          <p class="stat-change">Por pedido</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fee2e2;">
          <AlertCircle :size="24" color="#ef4444" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Pedidos Ativos</p>
          <p class="stat-value">{{ activeOrdersCount }}</p>
          <p class="stat-change">Em andamento</p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group">
          <Search :size="18" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar por cliente, mesa ou ID..."
            class="search-input"
          >
        </div>

        <div class="filter-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.value"
            class="tab-btn"
            :class="{ active: currentTab === tab.value }"
            @click="currentTab = tab.value"
          >
            {{ tab.label }}
            <span class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</span>
          </button>
        </div>

        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="active">Em Preparo</option>
            <option value="ready">Pronto</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && orders.length === 0" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando pedidos...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <AlertCircle :size="48" color="#ef4444" />
      <h3>Erro ao carregar pedidos</h3>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="refreshOrders">Tentar Novamente</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrders.length === 0" class="empty-container">
      <Package :size="64" color="#d1d5db" />
      <h3>Nenhum pedido encontrado</h3>
      <p v-if="searchQuery">Tente ajustar os filtros de busca</p>
      <p v-else>Nenhum pedido foi criado ainda</p>
      <button class="btn-primary" @click="$router.push({ path: '/pdv', query: { mode: 'balcao' } })">
        <Plus :size="20" />
        Criar Primeiro Pedido
      </button>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-list">
      <div 
        v-for="order in paginatedOrders" 
        :key="order.id"
        class="order-card"
        :class="getOrderStatusClass(order.status)"
        @click="viewOrderDetails(order)"
      >
        <div class="order-header">
          <div class="order-id">
            <ShoppingCart :size="18" />
            Pedido #{{ order.id }}
          </div>
          <div class="order-status" :class="order.status">
            {{ getStatusText(order.status) }}
          </div>
        </div>

        <div class="order-body">
          <div class="order-info">
            <div class="info-row">
              <User :size="16" />
              <span>{{ order.customer_name || 'Cliente não informado' }}</span>
            </div>
            <div class="info-row" v-if="order.mesa_numero">
              <Utensils :size="16" />
              <span>Mesa {{ order.mesa_numero }}</span>
            </div>
            <div class="info-row">
              <Clock :size="16" />
              <span>{{ formatTimeAgo(order.created_at) }}</span>
            </div>
            <div class="info-row" v-if="order.customer_phone">
              <Phone :size="16" />
              <span>{{ order.customer_phone }}</span>
            </div>
          </div>

          <div class="order-items">
            <p class="items-count">{{ getItemsCount(order) }} item(ns)</p>
            <div class="items-preview">
              <span 
                v-for="(item, index) in getFirstItems(order)" 
                :key="index"
                class="item-badge"
              >
                {{ item.quantity }}x {{ item.product_name }}
              </span>
              <span v-if="hasMoreItems(order)" class="more-items">
                +{{ getMoreItemsCount(order) }} mais
              </span>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="order-total">
            <span class="total-label">Total:</span>
            <span class="total-value">R$ {{ formatPrice(order.valor_total) }}</span>
          </div>

          <div class="order-actions" @click.stop>
            <button 
              v-if="order.status === 'pending'"
              class="action-btn primary"
              @click="startOrder(order)"
            >
              <Play :size="16" />
              Iniciar
            </button>
            <button 
              v-if="order.status === 'active'"
              class="action-btn success"
              @click="markAsReady(order)"
            >
              <CheckCircle :size="16" />
              Pronto
            </button>
            <button 
              v-if="order.status === 'ready'"
              class="action-btn success"
              @click="completeOrder(order)"
            >
              <CheckCircle :size="16" />
              Entregar
            </button>
            <button 
              class="action-btn secondary"
              @click="viewOrderDetails(order)"
            >
              <Eye :size="16" />
              Ver
            </button>
            <button 
              v-if="['pending', 'active'].includes(order.status)"
              class="action-btn danger"
              @click="cancelOrder(order)"
            >
              <X :size="16" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="page-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        <ChevronLeft :size="18" />
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-btn"
          :class="{ active: page === currentPage }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
      </div>

      <button 
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Pedido #{{ selectedOrder.id }}</h2>
          <button class="close-btn" @click="closeModal">
            <X :size="24" />
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-section">
            <h3>Informações do Cliente</h3>
            <div class="detail-row">
              <span class="detail-label">Nome:</span>
              <span class="detail-value">{{ selectedOrder.customer_name || 'Não informado' }}</span>
            </div>
            <div class="detail-row" v-if="selectedOrder.customer_phone">
              <span class="detail-label">Telefone:</span>
              <span class="detail-value">{{ selectedOrder.customer_phone }}</span>
            </div>
            <div class="detail-row" v-if="selectedOrder.mesa_numero">
              <span class="detail-label">Mesa:</span>
              <span class="detail-value">{{ selectedOrder.mesa_numero }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Itens do Pedido</h3>
            <div class="items-table">
              <div 
                v-for="(item, index) in selectedOrder.items" 
                :key="index"
                class="item-row"
              >
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.product_name }}</span>
                <span class="item-price">R$ {{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="total-row">
              <span class="total-label">Total do Pedido:</span>
              <span class="total-amount">R$ {{ formatPrice(selectedOrder.valor_total) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Fechar</button>
          <button 
            v-if="selectedOrder.status === 'pending'"
            class="btn-primary" 
            @click="startOrder(selectedOrder); closeModal()"
          >
            Iniciar Preparo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, TABLES } from '@/services/supabase'
import { useUserStore } from '@/stores/user'
import {
  ShoppingCart,
  DollarSign,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  User,
  Utensils,
  Phone,
  Package,
  Eye,
  X,
  Play,
  CheckCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

// State
const orders = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const currentTab = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const selectedOrder = ref(null)

// Tabs
const tabs = computed(() => [
  { label: 'Todos', value: 'all', count: orders.value.length },
  { label: 'Pendentes', value: 'pending', count: pendingOrdersCount.value },
  { label: 'Em Preparo', value: 'active', count: activeOrdersCount.value },
  { label: 'Concluídos', value: 'completed', count: completedOrdersCount.value }
])

// Computed
const todayOrdersCount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return orders.value.filter(o => {
    const orderDate = new Date(o.created_at)
    return orderDate >= today
  }).length
})

const pendingOrdersCount = computed(() => {
  return orders.value.filter(o => o.status === 'pending').length
})

const activeOrdersCount = computed(() => {
  return orders.value.filter(o => o.status === 'active').length
})

const completedOrdersCount = computed(() => {
  return orders.value.filter(o => o.status === 'completed').length
})

const todayRevenue = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return orders.value
    .filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate >= today && o.status === 'completed'
    })
    .reduce((sum, order) => sum + Number(order.valor_total || 0), 0)
})

const averageTicket = computed(() => {
  const completed = orders.value.filter(o => o.status === 'completed')
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, order) => sum + Number(order.valor_total || 0), 0)
  return total / completed.length
})

const filteredOrders = computed(() => {
  let filtered = orders.value

  // Filter by tab
  if (currentTab.value !== 'all') {
    filtered = filtered.filter(o => o.status === currentTab.value)
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(o => o.status === statusFilter.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(o => 
      String(o.id).includes(query) ||
      o.customer_name?.toLowerCase().includes(query) ||
      String(o.mesa_numero).includes(query) ||
      o.customer_phone?.includes(query)
    )
  }

  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage.value))

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredOrders.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price || 0)
}

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'Agora mesmo'
  if (diffMins < 60) return `Há ${diffMins} min`
  if (diffHours < 24) return `Há ${diffHours}h`
  return date.toLocaleDateString('pt-BR')
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pendente',
    active: 'Em Preparo',
    ready: 'Pronto',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

const getOrderStatusClass = (status) => {
  return `status-${status}`
}

const getItemsCount = (order) => {
  return order.items?.length || 0
}

const getFirstItems = (order) => {
  return order.items?.slice(0, 2) || []
}

const hasMoreItems = (order) => {
  return (order.items?.length || 0) > 2
}

const getMoreItemsCount = (order) => {
  return (order.items?.length || 0) - 2
}

const fetchOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    const { data, error: fetchError } = await supabase
      .from(TABLES.PEDIDOS)
      .select(`
        *,
        pwa_mesas (
          numero
        )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    // Buscar IDs dos produtos para fazer lookup
    const allProductIds = new Set()
    data.forEach(order => {
      if (Array.isArray(order.itens)) {
        order.itens.forEach(item => {
          allProductIds.add(item.produto_id)
        })
      }
    })

    // Buscar dados dos produtos
    let productsMap = {}
    if (allProductIds.size > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from('pwa_produtos')
        .select('id, nome')
        .in('id', Array.from(allProductIds))

      if (productsError) console.error('Erro ao buscar produtos:', productsError)
      
      // Criar mapa de produtos para lookup rápido
      productsData?.forEach(product => {
        productsMap[product.id] = product.nome
      })
    }

    orders.value = data.map(order => {
      // Enriquecer itens com nome do produto
      const enrichedItems = (order.itens || []).map(item => ({
        ...item,
        product_name: productsMap[item.produto_id] || 'Produto removido',
        price: item.preco_unitario
      }))

      return {
        ...order,
        items: enrichedItems,
        mesa_numero: order.pwa_mesas?.numero
      }
    })

  } catch (err) {
    console.error('Erro ao buscar pedidos:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const voltarParaDashboard = () => {
  router.back()
}

const refreshOrders = async () => {
  await fetchOrders()
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
}

const closeModal = () => {
  selectedOrder.value = null
}

const startOrder = async (order) => {
  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'active' })
      .eq('id', order.id)

    if (updateError) throw updateError

    await refreshOrders()
  } catch (err) {
    console.error('Erro ao iniciar pedido:', err)
    alert('Erro ao iniciar pedido')
  }
}

const markAsReady = async (order) => {
  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'ready' })
      .eq('id', order.id)

    if (updateError) throw updateError

    await refreshOrders()
  } catch (err) {
    console.error('Erro ao marcar como pronto:', err)
    alert('Erro ao atualizar pedido')
  }
}

const completeOrder = async (order) => {
  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'completed' })
      .eq('id', order.id)

    if (updateError) throw updateError

    await refreshOrders()
  } catch (err) {
    console.error('Erro ao completar pedido:', err)
    alert('Erro ao completar pedido')
  }
}

const cancelOrder = async (order) => {
  if (!confirm(`Deseja realmente cancelar o pedido #${order.id}?`)) return

  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'cancelled' })
      .eq('id', order.id)

    if (updateError) throw updateError

    await refreshOrders()
  } catch (err) {
    console.error('Erro ao cancelar pedido:', err)
    alert('Erro ao cancelar pedido')
  }
}

// Lifecycle
onMounted(() => {
  fetchOrders()
})

onUnmounted(() => {
  // Clean up
})
</script>

<style scoped>
.orders-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: #C41E3A;
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #a51830;
  transform: scale(1.05);
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.header-content p {
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  flex: 1;
  min-width: 200px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex: 2;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f3f4f6;
}

.tab-btn.active {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
}

.tab-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.3);
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 180px;
}

.loading-container,
.error-container,
.empty-container {
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
  border: 4px solid #f3f4f6;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-container h3,
.empty-container h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

.error-container p,
.empty-container p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid #e5e7eb;
}

.order-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-card.status-pending {
  border-left-color: #f59e0b;
}

.order-card.status-active {
  border-left-color: #3b82f6;
}

.order-card.status-ready {
  border-left-color: #8b5cf6;
}

.order-card.status-completed {
  border-left-color: #22c55e;
}

.order-card.status-cancelled {
  border-left-color: #ef4444;
  opacity: 0.6;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.order-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
}

.order-status {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.order-status.pending {
  background: #fef3c7;
  color: #f59e0b;
}

.order-status.active {
  background: #dbeafe;
  color: #3b82f6;
}

.order-status.ready {
  background: #f3e8ff;
  color: #8b5cf6;
}

.order-status.completed {
  background: #dcfce7;
  color: #22c55e;
}

.order-status.cancelled {
  background: #fee2e2;
  color: #ef4444;
}

.order-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.items-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin: 0;
}

.items-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.item-badge {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #4b5563;
}

.more-items {
  padding: 0.25rem 0.75rem;
  background: #C41E3A;
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.total-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.success {
  background: #22c55e;
  color: white;
}

.action-btn.success:hover {
  background: #16a34a;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
}

.action-btn.danger:hover {
  background: #dc2626;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #C41E3A;
}

.page-btn.active {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border-color: transparent;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

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
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  font-size: 1.5rem;
  color: #1f2937;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  color: #1f2937;
}

.items-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.item-qty {
  font-weight: 600;
  color: #C41E3A;
}

.item-name {
  color: #1f2937;
}

.item-price {
  font-weight: 600;
  color: #1f2937;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 1.125rem;
}

.total-label {
  font-weight: 600;
  color: #4b5563;
}

.total-amount {
  font-weight: 700;
  color: #C41E3A;
  font-size: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .orders-view {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters-row {
    flex-direction: column;
  }

  .filter-group,
  .filter-tabs,
  .filter-select {
    width: 100%;
  }

  .filter-tabs {
    overflow-x: auto;
  }

  .order-body {
    grid-template-columns: 1fr;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .order-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: 80px;
  }
}
</style>