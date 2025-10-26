<template>
  <div class="tables-container">
    <!-- ✅ NOVO: Indicador de Status de Conexão -->
    <div v-if="!tablesStore.isOnline || tablesStore.hasPendingOperations" class="connection-banner">
      <div class="banner-content">
        <div class="status-icon">
          <svg v-if="!tablesStore.isOnline" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
        <div class="status-text">
          <span v-if="!tablesStore.isOnline">
            <strong>Modo Offline</strong> - Suas ações serão sincronizadas quando voltar online
          </span>
          <span v-else>
            <strong>Sincronizando...</strong> {{ tablesStore.pendingSync }} operação(ões) pendente(s)
          </span>
        </div>
        <button 
          v-if="tablesStore.hasPendingOperations && tablesStore.isOnline" 
          @click="forceSyncNow" 
          class="btn-sync"
        >
          Sincronizar Agora
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="tables-header">
      <div class="header-top">
        <button @click="voltarParaDashboard" class="btn-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="tables-title">Selecione uma Mesa</h1>
        
        <!-- ✅ NOVO: Indicador de Status Compacto -->
        <div class="connection-indicator" :class="tablesStore.connectionStatus">
          <div class="indicator-dot"></div>
          <span class="indicator-text">{{ getConnectionText() }}</span>
        </div>
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
          'reserved': mesa.status === 'reserved',
          'pending-sync': mesa.pendingSync
        }"
      >
        <!-- ✅ NOVO: Badge de Sincronização Pendente -->
        <div v-if="mesa.pendingSync" class="sync-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
        
        <div class="table-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <div class="table-number">Mesa {{ mesa.numero }}</div>
        <div class="table-status">{{ getStatusText(mesa.status) }}</div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!tablesStore.loading && tablesStore.tables.length === 0" class="empty-state">
      <p>Nenhuma mesa cadastrada</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'
import { useTablesStore } from '@/stores/tables'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const navigationStore = useNavigationStore()
const tablesStore = useTablesStore()
const userStore = useUserStore()

onMounted(async () => {
  // Carregar mesas
  await tablesStore.fetchTables()
  
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

// ✅ NOVO: Função para forçar sincronização
async function forceSyncNow() {
  try {
    await tablesStore.forceSyncPendingOperations()
    alert('Sincronização concluída!')
  } catch (error) {
    console.error('Erro ao sincronizar:', error)
    alert('Erro ao sincronizar. Tente novamente.')
  }
}

// ✅ NOVO: Texto do status de conexão
function getConnectionText() {
  const status = tablesStore.connectionStatus
  const texts = {
    'online': 'Online',
    'offline': 'Offline',
    'syncing': 'Sincronizando'
  }
  return texts[status] || 'Online'
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

/* ✅ NOVO: Estilos do Banner de Conexão */
.connection-banner {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  flex-shrink: 0;
}

.status-text {
  flex: 1;
}

.btn-sync {
  background: white;
  color: #f59e0b;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-sync:hover {
  background: #fef3c7;
  transform: scale(1.05);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ✅ NOVO: Indicador de Conexão Compacto */
.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: auto;
}

.connection-indicator.online {
  background: #d1fae5;
  color: #065f46;
}

.connection-indicator.offline {
  background: #fee2e2;
  color: #991b1b;
}

.connection-indicator.syncing {
  background: #fef3c7;
  color: #92400e;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.connection-indicator.online .indicator-dot {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.indicator-text {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ✅ NOVO: Badge de Sincronização Pendente */
.sync-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #fbbf24;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.table-card.pending-sync {
  border-color: #fbbf24;
  opacity: 0.85;
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

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.table-card {
  background: white;
  padding: 2rem 1.5rem;
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
  opacity: 0.7;
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
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.table-number {
  font-size: 1.5rem;
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
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .table-card {
    padding: 1.5rem 1rem;
  }

  .table-number {
    font-size: 1.25rem;
  }
  
  .connection-indicator {
    display: none;
  }
  
  .banner-content {
    flex-direction: column;
    text-align: center;
  }
  
  .btn-sync {
    width: 100%;
  }
}
</style>