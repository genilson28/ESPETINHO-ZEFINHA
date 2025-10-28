<template>
  <div class="tables-container">
    <!-- Header -->
    <div class="tables-header">
      <div class="header-top">
        <button @click="voltarParaDashboard" class="btn-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="tables-title">Selecione uma Mesa</h1>
      </div>
      <div class="tables-stats">
        <span class="stat-item">
          <span class="stat-label">Total:</span>
          <span class="stat-value">{{ tablesStore.tables.length }}</span>
        </span>
        <span class="stat-item available">
          <span class="stat-label">Disponíveis:</span>
          <span class="stat-value">{{ tablesStore.availableTables.length }}</span>
        </span>
        <span class="stat-item occupied">
          <span class="stat-label">Ocupadas:</span>
          <span class="stat-value">{{ tablesStore.occupiedTables.length }}</span>
        </span>
        <span class="stat-item revenue">
          <span class="stat-label">Consumo Total:</span>
          <span class="stat-value">{{ formatCurrency(totalConsumption) }}</span>
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="tablesStore.loading" class="loading-state">
      <p>Carregando mesas...</p>
    </div>

    <!-- Grid de Mesas -->
    <div v-else class="tables-grid">
      <div 
        v-for="mesa in tablesStore.tables" 
        :key="mesa.id"
        @click="selecionarMesa(mesa)"
        class="table-card"
        :class="{ 
          'occupied': mesa.status === 'occupied',
          'available': mesa.status === 'available',
          'reserved': mesa.status === 'reserved'
        }"
      >
        <div class="table-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        
        <div class="table-number">Mesa {{ mesa.numero }}</div>
        
        <!-- ✅ Exibe consumo para mesas ocupadas -->
        <div v-if="mesa.status === 'occupied'" class="consumption-info">
          <div class="consumption-value">{{ formatCurrency(mesa.totalComanda || 0) }}</div>
          <div class="consumption-label">Consumo Atual</div>
        </div>
        
        <div v-else class="table-status">{{ getStatusText(mesa.status) }}</div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!tablesStore.loading && tablesStore.tables.length === 0" class="empty-state">
      <p>Nenhuma mesa cadastrada</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'
import { useTablesStore } from '@/stores/tables'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const route = useRoute()
const navigationStore = useNavigationStore()
const tablesStore = useTablesStore()
const userStore = useUserStore()
const cartStore = useCartStore()

// Observa mudanças no carrinho para atualizar consumo das mesas
watch(() => cartStore.carts, () => {
  loadTablesConsumption()
}, { deep: true })

// ✅ Calcular consumo total de todas as mesas ocupadas
const totalConsumption = computed(() => {
  return tablesStore.occupiedTables.reduce((total, mesa) => {
    const consumption = mesa.totalComanda || 0
    return total + consumption
  }, 0)
})

onMounted(async () => {
  // Carregar mesas
  await tablesStore.fetchTables()
  
  // Carregar consumo de cada mesa do carrinho
  loadTablesConsumption()
  
  // Iniciar subscription realtime
  tablesStore.startRealtimeSubscription()
  
  // Se veio do dashboard pela query string, salva o contexto
  const fromQuery = route.query.from
  if (fromQuery) {
    navigationStore.setContext({ 
      from: fromQuery,
      returnTo: fromQuery 
    })
  }
  
  console.log('🎯 Página de mesas montada. Contexto:', navigationStore.currentContext)
})

// Carrega o consumo de cada mesa do cartStore
function loadTablesConsumption() {
  tablesStore.tables.forEach(mesa => {
    if (mesa.status === 'occupied') {
      const cartData = cartStore.getCartByTable(mesa.id)
      if (cartData && cartData.items.length > 0) {
        // Calcula o total do carrinho para esta mesa
        const total = cartData.items.reduce((sum, item) => {
          return sum + (item.product.preco * item.quantity)
        }, 0)
        
        // Aplica desconto se houver
        let finalTotal = total
        if (cartData.discountValue > 0) {
          if (cartData.discountType === 'percentage') {
            finalTotal = total - (total * cartData.discountValue / 100)
          } else {
            finalTotal = total - cartData.discountValue
          }
        }
        
        // Atualiza o total da mesa
        mesa.totalComanda = Math.max(0, finalTotal)
        console.log(`💰 Mesa ${mesa.numero}: R$ ${mesa.totalComanda.toFixed(2)}`)
      } else {
        mesa.totalComanda = 0
      }
    }
  })
}

onUnmounted(() => {
  // Parar subscription ao sair da página
  tablesStore.stopRealtimeSubscription()
})

function selecionarMesa(mesa) {
  // Pega o "from" atual ou usa 'tables' como fallback
  const currentFrom = navigationStore.currentContext.from || 'tables'
  
  navigationStore.goToPDV(router, mesa, currentFrom)
}

function voltarParaDashboard() {
  const from = route.query.from
  const userRole = userStore.profile?.role
  
  console.log('🔙 Voltando. From:', from, 'Role:', userRole)
  
  if (from === 'dashboard') {
    router.push({ name: 'dashboard-gerente' })
  } else {
    router.back()
  }
}

function getStatusText(status) {
  const statusMap = {
    'available': 'Disponível',
    'occupied': 'Ocupada',
    'reserved': 'Reservada'
  }
  return statusMap[status] || status
}

// ✅ Formatar valor monetário
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.tables-container {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
}

.tables-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-back {
  background: #C41E3A;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
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

.tables-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.tables-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: bold;
  font-size: 1.25rem;
  color: #1f2937;
}

.stat-item.available .stat-value {
  color: #10b981;
}

.stat-item.occupied .stat-value {
  color: #ef4444;
}

.stat-item.revenue .stat-value {
  color: #8b5cf6;
  font-size: 1.1rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.table-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  border: 3px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  min-height: 180px;
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.table-card.available {
  border-color: #10b981;
}

.table-card.available .table-icon {
  color: #10b981;
}

.table-card.available:hover {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}

.table-card.occupied {
  border-color: #ef4444;
}

.table-card.occupied .table-icon {
  color: #ef4444;
}

.table-card.occupied:hover {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.table-card.reserved {
  border-color: #f59e0b;
}

.table-card.reserved .table-icon {
  color: #f59e0b;
}

.table-card.reserved:hover {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.table-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.table-number {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.table-status {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ✅ Estilos para informações de consumo */
.consumption-info {
  text-align: center;
}

.consumption-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #ef4444;
  margin-bottom: 0.25rem;
}

.consumption-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-card.available .table-status {
  color: #10b981;
}

.table-card.occupied .table-status {
  color: #ef4444;
}

.table-card.reserved .table-status {
  color: #f59e0b;
}

@media (max-width: 768px) {
  .tables-container {
    padding: 1rem;
  }

  .tables-header {
    padding: 1.5rem;
  }

  .tables-title {
    font-size: 1.5rem;
  }

  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }

  .table-card {
    padding: 1rem;
    min-height: 160px;
  }

  .table-number {
    font-size: 1.1rem;
  }
  
  .consumption-value {
    font-size: 1.1rem;
  }
  
  .tables-stats {
    gap: 1rem;
  }
  
  .stat-item {
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
  }
}
</style>
