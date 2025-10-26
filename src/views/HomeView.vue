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
        <button class="stat-card revenue" @click="navigateToSales" type="button">
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
        </button>

        <button class="stat-card orders" @click="navigateToOrders" type="button">
          <div class="stat-icon">
            <ShoppingBag :size="32" />
          </div>
          <div class="stat-info">
            <h3 class="stat-label">Pedidos Hoje</h3>
            <p class="stat-value">{{ stats.todayOrders }}</p>
            <span class="stat-detail">{{ stats.pendingOrders }} pendentes</span>
          </div>
        </button>

        <button class="stat-card tables" @click="navigateToTables" type="button">
          <div class="stat-icon">
            <Users :size="32" />
          </div>
          <div class="stat-info">
            <h3 class="stat-label">Mesas Ocupadas</h3>
            <p class="stat-value">{{ stats.occupiedTables }}/{{ stats.totalTables }}</p>
            <span class="stat-detail">{{ occupancyRate }}% de ocupação</span>
          </div>
        </button>

        <button class="stat-card products" @click="navigateToStock" type="button">
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
        </button>
      </div>

      <!-- Gestão de Clientes -->
      <div class="management-section">
        <h2 class="section-title">
          <Users :size="28" />
          Gestão de Clientes
        </h2>
        <div class="management-grid">
          <router-link to="/qr-codes" class="management-card">
            <div class="management-icon qr-code">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="5" height="5"/>
                <rect x="16" y="3" width="5" height="5"/>
                <rect x="3" y="16" width="5" height="5"/>
                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                <path d="M21 21v.01"/>
                <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                <path d="M3 12h.01"/>
                <path d="M12 3h.01"/>
                <path d="M12 16v.01"/>
                <path d="M16 12h1"/>
                <path d="M21 12v.01"/>
                <path d="M12 21v-1"/>
              </svg>
            </div>
            <div class="management-content">
              <h3>Gerar QR Codes</h3>
              <p>Crie QR codes para mesas e áreas</p>
            </div>
            <ChevronRight :size="24" class="management-arrow" />
          </router-link>

          <router-link to="/menu" class="management-card">
            <div class="management-icon categories">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6h13"/>
                <path d="M8 12h13"/>
                <path d="M8 18h13"/>
                <path d="M3 6h.01"/>
                <path d="M3 12h.01"/>
                <path d="M3 18h.01"/>
              </svg>
            </div>
            <div class="management-content">
              <h3>Gerenciar Categorias</h3>
              <p>Organize categorias do cardápio</p>
            </div>
            <ChevronRight :size="24" class="management-arrow" />
          </router-link>

          <router-link to="/products" class="management-card">
            <div class="management-icon products">
              <Package :size="40" />
            </div>
            <div class="management-content">
              <h3>Gerenciar Produtos</h3>
              <p>Adicione e edite produtos do menu</p>
            </div>
            <ChevronRight :size="24" class="management-arrow" />
          </router-link>
        </div>
      </div>

      <!-- Gestão de Pedidos -->
      <div class="management-section">
        <h2 class="section-title">
          <ShoppingBag :size="28" />
          Gestão de Pedidos
        </h2>
        <div class="management-grid">
          <router-link to="/staff/orders" class="management-card">
            <div class="management-icon orders">
              <Clock :size="40" />
            </div>
            <div class="management-content">
              <h3>Pedidos Ativos</h3>
              <p>Gerencie pedidos em andamento</p>
            </div>
            <ChevronRight :size="24" class="management-arrow" />
          </router-link>

          <router-link to="/tables" class="management-card">
            <div class="management-icon tables">
              <UtensilsCrossed :size="40" />
            </div>
            <div class="management-content">
              <h3>Visualizar Mesas</h3>
              <p>Veja status e ocupação das mesas</p>
            </div>
            <ChevronRight :size="24" class="management-arrow" />
          </router-link>
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
            <button class="view-all-btn" @click="navigateToSales">
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
            <button class="view-all-btn" @click="navigateToStock">
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
                  <p class="stock-level">Estoque: {{ product.quantity }} {{ product.unit }}</p>
                </div>
                <button class="restock-btn" @click="restockProduct(product.id)">
                  <Plus :size="16" />
                  Repor
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mesas em Tempo Real -->
        <div class="content-card tables-status">
          <div class="card-header">
            <h2 class="card-title">
              <Users :size="24" />
              Status das Mesas
            </h2>
            <button class="view-all-btn" @click="navigateToTables">
              Ver Detalhes
              <ChevronRight :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div class="tables-grid">
              <div 
                v-for="table in tablesStatus" 
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

<script>
import {
  LayoutDashboard,
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  UtensilsCrossed,
  Plus
} from 'lucide-vue-next'

export default {
  name: 'AdminDashboard',
  components: {
    LayoutDashboard,
    RefreshCw,
    AlertCircle,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    Users,
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    ChevronRight,
    UtensilsCrossed,
    Plus
  },
  data() {
    return {
      currentDate: '',
      currentTime: '',
      loading: false,
      error: null,
      stats: {
        todayRevenue: 0,
        revenueTrend: 0,
        todayOrders: 0,
        pendingOrders: 0,
        occupiedTables: 0,
        totalTables: 21,
        totalProducts: 0,
        lowStockProducts: 0
      },
      recentOrders: [],
      topProducts: [],
      lowStockProducts: [],
      tablesStatus: []
    }
  },
  computed: {
    occupancyRate() {
      return Math.round((this.stats.occupiedTables / this.stats.totalTables) * 100)
    }
  },
  mounted() {
    this.updateDateTime()
    setInterval(() => this.updateDateTime(), 1000)
    this.loadDashboardData()
  },
  methods: {
    updateDateTime() {
      const now = new Date()
      this.currentDate = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      this.currentTime = now.toLocaleTimeString('pt-BR')
    },
    
    async loadDashboardData() {
      try {
        this.loading = true
        this.error = null
        // Aqui você faria suas chamadas à API para carregar os dados
        // await this.fetchStatsData()
        // await this.fetchRecentOrders()
        // await this.fetchTopProducts()
        // await this.fetchLowStockProducts()
        // await this.fetchTablesStatus()
      } catch (err) {
        this.error = 'Erro ao carregar os dados do dashboard'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    refreshData() {
      this.loadDashboardData()
    },
    
    // ✅ NAVEGAÇÃO CORRIGIDA - Faturamento vai para FINANCEIRO
    navigateToSales() {
      try {
        this.$router.push('/finance')
      } catch (err) {
        console.error('Erro ao navegar para Financeiro:', err)
      }
    },

    navigateToOrders() {
      try {
        this.$router.push('/staff/orders')
      } catch (err) {
        console.error('Erro ao navegar para Orders:', err)
      }
    },
    
    navigateToStock() {
      try {
        this.$router.push('/stock')
      } catch (err) {
        console.error('Erro ao navegar para Stock:', err)
      }
    },
    
    navigateToTables() {
      try {
        this.$router.push('/tables')
      } catch (err) {
        console.error('Erro ao navegar para Tables:', err)
      }
    },
    
    // ✅ MÉTODO CORRIGIDO PARA REPOR ESTOQUE
    async restockProduct(productId) {
      try {
        console.log('Repoendo produto:', productId)
        // Aqui você faria a chamada à API para repor estoque
        // await this.api.restockProduct(productId)
        // Depois recarrega os dados
        // await this.loadDashboardData()
      } catch (err) {
        console.error('Erro ao repor estoque:', err)
      }
    },
    
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    },
    
    formatTime(date) {
      return new Date(date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getStatusLabel(status) {
      const labels = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'in_preparation': 'Em Preparação',
        'ready': 'Pronto',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado'
      }
      return labels[status] || status
    },
    
    getTableStatusLabel(status) {
      const labels = {
        'available': 'Disponível',
        'occupied': 'Ocupada',
        'reserved': 'Reservada'
      }
      return labels[status] || status
    }
  }
}
</script>

<style scoped>
/* Layout Principal */
/* Layout Principal - SEM PADDING para permitir páginas full-width */
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 2rem 0 2rem;
  padding: 1.5rem;
  background: white;
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
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
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
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.current-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.refresh-btn {
  background: #C41E3A;
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: #a01a30;
  transform: scale(1.05);
}

.refresh-btn:active {
  transform: scale(0.95);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading & Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 64px;
  height: 64px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-container {
  color: #ef4444;
}

.error-container h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
}

.retry-btn {
  margin-top: 1rem;
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #a01a30;
  transform: scale(1.05);
}

/* Main Content */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.revenue:hover {
  border-color: #10b981;
}

.stat-card.orders:hover {
  border-color: #3b82f6;
}

.stat-card.tables:hover {
  border-color: #f59e0b;
}

.stat-card.products:hover {
  border-color: #8b5cf6;
}

.stat-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.revenue .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.orders .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.tables .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.products .stat-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.stat-trend.positive {
  color: #10b981;
  background: #d1fae5;
}

.stat-trend.negative {
  color: #ef4444;
  background: #fee2e2;
}

.stat-detail {
  font-size: 0.85rem;
  color: #6b7280;
}

.stat-alert {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #f59e0b;
  background: #fef3c7;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
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
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: #C41E3A;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.view-all-btn:hover {
  background: rgba(196, 30, 58, 0.1);
  transform: translateX(4px);
}

.card-content {
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #9ca3af;
  text-align: center;
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
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.order-item:hover {
  border-color: #C41E3A;
  box-shadow: 0 2px 8px rgba(196, 30, 58, 0.1);
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
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  text-transform: uppercase;
}

.order-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.order-status.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.order-status.in_preparation {
  background: #fef3c7;
  color: #92400e;
}

.order-status.ready {
  background: #d1fae5;
  color: #065f46;
}

.order-status.delivered {
  background: #d1fae5;
  color: #065f46;
}

.order-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.order-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
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
  border: 1px solid #e5e7eb;
}

.product-rank {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A, #a01a30);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}

.product-sales {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
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
  gap: 1rem;
}

.stock-info {
  flex: 1;
  min-width: 0;
}

.stock-name {
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}

.stock-level {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
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
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.restock-btn:hover {
  background: #a01a30;
}

.restock-btn:active {
  transform: scale(0.95);
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
  transition: all 0.2s ease;
  cursor: pointer;
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

/* Management Sections */
.management-section {
  margin: 2rem 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1.5rem;
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.management-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  text-decoration: none;
  border: 2px solid transparent;
  cursor: pointer;
}

.management-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(196, 30, 58, 0.15);
  border-color: #C41E3A;
}

.management-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.management-icon.qr-code {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.management-icon.categories {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.management-icon.products {
  background: linear-gradient(135deg, #10b981, #059669);
}

.management-icon.orders {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.management-icon.tables {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.management-content {
  flex: 1;
}

.management-content h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.management-content p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.management-arrow {
  color: #9ca3af;
  transition: transform 0.3s ease;
}

.management-card:hover .management-arrow {
  transform: translateX(4px);
  color: #C41E3A;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1.5rem;
    margin: 0 1rem 0 1rem;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .dashboard-title {
    font-size: 1.75rem;
  }

  .dashboard-content {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .management-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .management-card {
    padding: 1.25rem;
  }

  .management-icon {
    width: 56px;
    height: 56px;
  }

  .management-icon svg {
    width: 32px;
    height: 32px;
  }

  .management-content h3 {
    font-size: 1rem;
  }

  .management-content p {
    font-size: 0.85rem;
  }

  .stock-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .restock-btn {
    width: 100%;
    justify-content: center;
  }
}

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  gap: 1rem;
}

.stock-info {
  flex: 1;
  min-width: 0;
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
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.restock-btn:hover {
  background: #a01a30;
}

.restock-btn:active {
  transform: scale(0.95);
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
  transition: all 0.2s ease;
  cursor: pointer;
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

/* Management Sections */
.management-section {
  margin: 2rem 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1.5rem;
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.management-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  text-decoration: none;
  border: 2px solid transparent;
  cursor: pointer;
}

.management-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(196, 30, 58, 0.15);
  border-color: #C41E3A;
}

.management-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.management-icon.qr-code {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.management-icon.categories {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.management-icon.products {
  background: linear-gradient(135deg, #10b981, #059669);
}

.management-icon.orders {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.management-icon.tables {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.management-content {
  flex: 1;
}

.management-content h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.management-content p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.management-arrow {
  color: #9ca3af;
  transition: transform 0.3s ease;
}

.management-card:hover .management-arrow {
  transform: translateX(4px);
  color: #C41E3A;
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

  .management-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .management-card {
    padding: 1.25rem;
  }

  .management-icon {
    width: 56px;
    height: 56px;
  }

  .management-icon svg {
    width: 32px;
    height: 32px;
  }

  .management-content h3 {
    font-size: 1rem;
  }

  .management-content p {
    font-size: 0.85rem;
  }

  .stock-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .restock-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>