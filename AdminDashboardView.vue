<template>
  <div class="admin-dashboard">
    <!-- Header do Dashboard -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">
          <LayoutDashboard :size="32" />
          Painel Administrativo
        </h1>
        <p class="dashboard-subtitle">Visão completa do seu negócio em tempo real</p>
      </div>
      <div class="header-right">
        <div class="datetime-display">
          <div class="current-date">{{ currentDate }}</div>
          <div class="current-time">{{ currentTime }}</div>
        </div>
        <button class="refresh-btn" @click="refreshData" title="Atualizar dados">
          <RefreshCw :size="20" :class="{ 'spinning': loading }" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando dados...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <AlertCircle :size="48" />
      <h3>Erro ao carregar dados</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="refreshData">Tentar Novamente</button>
    </div>

    <!-- Main Content -->
    <div v-else class="dashboard-content">
      <!-- Cards de Estatísticas Principais -->
      <div class="stats-grid">
        <div class="stat-card revenue">
          <div class="stat-icon">
            <DollarSign :size="32" />
          </div>
          <div class="stat-info">
            <h3 class="stat-label">Faturamento Hoje</h3>
            <p class="stat-value">R$ {{ formatCurrency(stats.todayRevenue) }}</p>
            <span class="stat-trend positive" v-if="stats.revenueTrend > 0">
              <TrendingUp :size="16" />
              +{{ stats.revenueTrend }}% vs ontem
            </span>
            <span class="stat-trend negative" v-else-if="stats.revenueTrend < 0">
              <TrendingDown :size="16" />
              {{ stats.revenueTrend }}% vs ontem
            </span>
          </div>
        </div>

        <div class="stat-card orders">
          <div class="stat-icon">
            <ShoppingBag :size="32" />
          </div>
          <div class="stat-info">
            <h3 class="stat-label">Pedidos Hoje</h3>
            <p class="stat-value">{{ stats.todayOrders }}</p>
            <span class="stat-detail">{{ stats.pendingOrders }} pendentes</span>
          </div>
        </div>

        <div class="stat-card tables">
          <div class="stat-icon">
            <Users :size="32" />
          </div>
          <div class="stat-info">
            <h3 class="stat-label">Mesas Ocupadas</h3>
            <p class="stat-value">{{ stats.occupiedTables }}/{{ stats.totalTables }}</p>
            <span class="stat-detail">{{ occupancyRate }}% de ocupação</span>
          </div>
        </div>

        <div class="stat-card products">
          <div class="stat-icon">
            <Package :size="32" />
          </div>
          <div class="stat-info">
            <h3 class="stat-label">Produtos em Estoque</h3>
            <p class="stat-value">{{ stats.totalProducts }}</p>
            <span class="stat-alert" v-if="stats.lowStockProducts > 0">
              <AlertTriangle :size="16" />
              {{ stats.lowStockProducts }} com estoque baixo
            </span>
          </div>
        </div>
      </div>

      <!-- Gráficos e Tabelas -->
      <div class="content-grid">
        <!-- Pedidos Recentes -->
        <div class="content-card recent-orders">
          <div class="card-header">
            <h2 class="card-title">
              <Clock :size="24" />
              Pedidos Recentes
            </h2>
            <button class="view-all-btn" @click="$router.push('/pdv')">
              Ver Todos
              <ChevronRight :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div v-if="recentOrders.length === 0" class="empty-state">
              <p>Nenhum pedido recente</p>
            </div>
            <div v-else class="orders-list">
              <div 
                v-for="order in recentOrders" 
                :key="order.id" 
                class="order-item"
              >
                <div class="order-info">
                  <div class="order-header">
                    <span class="order-number">#{{ order.id }}</span>
                    <span class="order-status" :class="order.status">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <div class="order-details">
                    <span class="order-table">Mesa {{ order.table_number }}</span>
                    <span class="order-time">{{ formatTime(order.created_at) }}</span>
                  </div>
                </div>
                <div class="order-value">
                  R$ {{ formatCurrency(order.total_price) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Produtos Mais Vendidos -->
        <div class="content-card top-products">
          <div class="card-header">
            <h2 class="card-title">
              <TrendingUp :size="24" />
              Produtos Mais Vendidos
            </h2>
          </div>
          <div class="card-content">
            <div v-if="topProducts.length === 0" class="empty-state">
              <p>Nenhum dado disponível</p>
            </div>
            <div v-else class="products-list">
              <div 
                v-for="(product, index) in topProducts" 
                :key="product.id" 
                class="product-item"
              >
                <div class="product-rank">{{ index + 1 }}</div>
                <div class="product-info">
                  <h4 class="product-name">{{ product.nome }}</h4>
                  <p class="product-sales">{{ product.sales }} vendidos</p>
                </div>
                <div class="product-revenue">
                  R$ {{ formatCurrency(product.revenue) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alertas de Estoque -->
        <div class="content-card stock-alerts">
          <div class="card-header">
            <h2 class="card-title">
              <AlertTriangle :size="24" />
              Alertas de Estoque
            </h2>
            <button class="view-all-btn" @click="$router.push('/stock')">
              Ver Estoque
              <ChevronRight :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div v-if="lowStockProducts.length === 0" class="empty-state success">
              <CheckCircle :size="48" />
              <p>Todos os produtos com estoque adequado</p>
            </div>
            <div v-else class="stock-list">
              <div 
                v-for="product in lowStockProducts" 
                :key="product.id" 
                class="stock-item"
              >
                <div class="stock-info">
                  <h4 class="stock-name">{{ product.nome }}</h4>
                  <p class="stock-level">
                    Estoque atual: <strong>{{ product.estoque_atual }}</strong>
                    (Mínimo: {{ product.estoque_minimo }})
                  </p>
                </div>
                <button class="restock-btn" @click="$router.push('/stock')">
                  <Plus :size="16" />
                  Repor
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status das Mesas -->
        <div class="content-card tables-status">
          <div class="card-header">
            <h2 class="card-title">
              <UtensilsCrossed :size="24" />
              Status das Mesas
            </h2>
            <button class="view-all-btn" @click="$router.push('/tables')">
              Ver Mesas
              <ChevronRight :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div class="tables-grid">
              <div 
                v-for="table in tables" 
                :key="table.id" 
                class="mini-table-card"
                :class="table.status"
              >
                <div class="mini-table-number">{{ table.number }}</div>
                <div class="mini-table-status">{{ getTableStatusLabel(table.status) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  LayoutDashboard, RefreshCw, AlertCircle, DollarSign, ShoppingBag, 
  Users, Package, AlertTriangle, Clock, ChevronRight, TrendingUp, 
  TrendingDown, CheckCircle, Plus, UtensilsCrossed 
} from 'lucide-vue-next'
import { dashboardAPI } from '@/services/supabase'
import { useProductsStore } from '@/stores/products'
import { useTablesStore } from '@/stores/tables'

const loading = ref(true)
const error = ref(null)
const stats = ref({
  todayRevenue: 0,
  todayOrders: 0,
  pendingOrders: 0,
  occupiedTables: 0,
  totalTables: 0,
  totalProducts: 0,
  lowStockProducts: 0,
  revenueTrend: 0
})

const recentOrders = ref([])
const topProducts = ref([])
const lowStockProducts = ref([])
const tables = ref([])

const currentDate = ref('')
const currentTime = ref('')

const productsStore = useProductsStore()
const tablesStore = useTablesStore()

const occupancyRate = computed(() => {
  if (stats.value.totalTables === 0) return 0
  return Math.round((stats.value.occupiedTables / stats.value.totalTables) * 100)
})

const formatCurrency = (value) => {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    closed: 'Fechado'
  }
  return labels[status] || status
}

const getTableStatusLabel = (status) => {
  const labels = {
    available: 'Disponível',
    occupied: 'Ocupada',
    reserved: 'Reservada'
  }
  return labels[status] || status
}

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  currentTime.value = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const refreshData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Buscar estatísticas
    const dashboardStats = await dashboardAPI.getStats()
    stats.value = dashboardStats

    // Buscar produtos com estoque baixo
    await productsStore.fetchProducts()
    lowStockProducts.value = productsStore.lowStockProducts.slice(0, 5)

    // Buscar mesas
    await tablesStore.fetchTables()
    tables.value = tablesStore.tables

    // Buscar pedidos recentes (simulado - você pode implementar no supabase.js)
    // recentOrders.value = await ordersAPI.getRecent(10)
    
    // Buscar produtos mais vendidos (simulado - você pode implementar no supabase.js)
    // topProducts.value = await productsAPI.getTopSelling(5)

  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err)
    error.value = err.message || 'Erro ao carregar dados'
  } finally {
    loading.value = false
  }
}

let timeInterval

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000)
  refreshData()
  
  // Atualizar dados a cada 30 segundos
  const refreshInterval = setInterval(refreshData, 30000)
  
  onUnmounted(() => {
    clearInterval(timeInterval)
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  background: linear-gradient(to bottom, #fafafa, #f0f0f0);
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.header-left {
  flex: 1;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: #C41E3A;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.datetime-display {
  text-align: right;
}

.current-date {
  font-size: 0.9rem;
  color: #666;
  text-transform: capitalize;
}

.current-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  font-variant-numeric: tabular-nums;
}

.refresh-btn {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #a01a30;
  transform: translateY(-2px);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading and Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-container {
  color: #ef4444;
}

.retry-btn {
  margin-top: 1rem;
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.revenue .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.stat-card.orders .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.stat-card.tables .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.stat-card.products .stat-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.stat-trend,
.stat-detail,
.stat-alert {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.stat-trend.positive {
  color: #10b981;
}

.stat-trend.negative {
  color: #ef4444;
}

.stat-detail {
  color: #666;
}

.stat-alert {
  color: #f59e0b;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #C41E3A;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.view-all-btn:hover {
  color: #a01a30;
}

.card-content {
  padding: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.empty-state.success {
  color: #10b981;
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.order-item:hover {
  background: #f3f4f6;
}

.order-info {
  flex: 1;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.order-number {
  font-weight: 700;
  color: #1a202c;
}

.order-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.order-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.order-status.preparing {
  background: #dbeafe;
  color: #2563eb;
}

.order-status.ready {
  background: #d1fae5;
  color: #059669;
}

.order-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.order-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

/* Products List */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.product-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #C41E3A;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.product-sales {
  font-size: 0.85rem;
  color: #666;
}

.product-revenue {
  font-size: 1.1rem;
  font-weight: 700;
  color: #10b981;
}

/* Stock List */
.stock-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.stock-info {
  flex: 1;
}

.stock-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.stock-level {
  font-size: 0.85rem;
  color: #666;
}

.restock-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
}

.restock-btn:hover {
  background: #a01a30;
}

/* Tables Grid */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.mini-table-card {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 2px solid;
  transition: transform 0.2s ease;
}

.mini-table-card:hover {
  transform: scale(1.05);
}

.mini-table-card.available {
  border-color: #10b981;
  background: #d1fae5;
}

.mini-table-card.occupied {
  border-color: #ef4444;
  background: #fee2e2;
}

.mini-table-card.reserved {
  border-color: #f59e0b;
  background: #fef3c7;
}

.mini-table-number {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.mini-table-status {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1.5rem;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .dashboard-title {
    font-size: 1.75rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

