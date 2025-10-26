<template>
  <div class="close-order-container">
    <!-- ✅ NOVO: Banner de Status de Conexão -->
    <div v-if="!isOnline || pendingSync > 0" class="connection-banner">
      <div class="banner-content">
        <div class="status-icon">
          <svg v-if="!isOnline" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
        <div class="status-text">
          <span v-if="!isOnline">
            <strong>Modo Offline</strong> - A comanda será fechada quando voltar online
          </span>
          <span v-else>
            <strong>Sincronizando...</strong> {{ pendingSync }} operação(ões) pendente(s)
          </span>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <button @click="goBack" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h1>Fechar Comanda</h1>
      
      <!-- ✅ NOVO: Indicador de Status -->
      <div class="connection-status" :class="connectionStatus">
        <div class="status-dot"></div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      Carregando comanda...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      <AlertCircle :size="48" />
      <p>{{ error }}</p>
      <button @click="loadOrder" class="btn-retry">Tentar Novamente</button>
    </div>

    <!-- Order Details -->
    <div v-else-if="order" class="order-details">
      <div class="order-header">
        <div>
          <h2>Mesa {{ getTableNumber(order.mesa_id) }}</h2>
          <p class="order-id">Pedido #{{ order.id.slice(0, 8) }}</p>
        </div>
      </div>

      <!-- Items List -->
      <div class="items-section">
        <h3>Itens do Pedido</h3>
        <div class="items-list">
          <div v-for="(item, idx) in order.itens" :key="idx" class="item">
            <div class="item-info">
              <span class="item-name">{{ item.nome }}</span>
              <span class="item-qty">x{{ item.quantidade }}</span>
            </div>
            <div class="item-price">R$ {{ formatPrice(item.subtotal) }}</div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>R$ {{ formatPrice(order.valor_total + (order.desconto || 0)) }}</span>
        </div>
        <div v-if="order.desconto > 0" class="summary-row discount">
          <span>Desconto:</span>
          <span>-R$ {{ formatPrice(order.desconto) }}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>R$ {{ formatPrice(order.valor_total) }}</span>
        </div>
        <div class="summary-row">
          <span>Forma de Pagamento:</span>
          <span class="payment-method">{{ getPaymentMethod(order.forma_pagamento) }}</span>
        </div>
      </div>

      <!-- ✅ NOVO: Aviso de Modo Offline -->
      <div v-if="!isOnline" class="offline-warning">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        </svg>
        <span>Você está offline. A comanda será fechada assim que a conexão for restaurada.</span>
      </div>

      <!-- Action Buttons -->
      <div class="actions">
        <button @click="goBack" class="btn-secondary">
          <X :size="18" />
          Voltar
        </button>
        <button @click="closeOrder" class="btn-primary" :disabled="closing">
          <Check :size="18" />
          {{ closing ? 'Fechando...' : 'Fechar Comanda' }}
        </button>
      </div>
    </div>

    <!-- No Order Found -->
    <div v-else class="no-order">
      <Package :size="48" />
      <p>Nenhum pedido ativo para esta mesa</p>
      <button @click="goBack" class="btn-primary">Voltar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, X, Check, Package, AlertCircle } from 'lucide-vue-next'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()
const route = useRoute()

const tableId = route.params.idMesa
const order = ref(null)
const tables = ref([])
const loading = ref(true)
const closing = ref(false)
const error = ref(null)

// ✅ NOVO: Estados de sincronização
const isOnline = ref(syncService.checkOnlineStatus())
const pendingSync = ref(syncService.getPendingCount())

// ✅ NOVO: Status de conexão
const connectionStatus = computed(() => {
  if (!isOnline.value) return 'offline'
  if (pendingSync.value > 0) return 'syncing'
  return 'online'
})

// ✅ NOVO: Atualizar status de sincronização
function updateSyncStatus() {
  isOnline.value = syncService.checkOnlineStatus()
  pendingSync.value = syncService.getPendingCount()
}

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2).replace('.', ',')
}

const getTableNumber = (tableId) => {
  const table = tables.value.find(t => t.id === tableId)
  return table?.numero || tableId || 'N/A'
}

const getPaymentMethod = (method) => {
  const methods = {
    'dinheiro': 'Dinheiro',
    'debito': 'Débito',
    'credito': 'Crédito',
    'pix': 'PIX'
  }
  return methods[method] || method
}

const loadOrder = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Buscar pedidos ativos da mesa
    const { data: orders, error: ordersError } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('mesa_id', tableId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (ordersError) throw ordersError

    if (orders && orders.length > 0) {
      order.value = orders[0]
    } else {
      error.value = 'Nenhum pedido ativo encontrado'
    }
    
    // ✅ Atualizar status de sincronização
    updateSyncStatus()
  } catch (err) {
    console.error('Erro ao carregar pedido:', err)
    error.value = 'Erro ao carregar pedido'
  } finally {
    loading.value = false
  }
}

// ✅ MODIFICADO: Usando syncService para fechar comanda
const closeOrder = async () => {
  closing.value = true

  try {
    // ✅ Atualizar pedido para closed usando syncService
    const orderUpdate = await syncService.update(TABLES.PEDIDOS, order.value.id, { 
      status: 'closed' 
    })

    if (orderUpdate.error && !orderUpdate.offline) {
      throw orderUpdate.error
    }

    // ✅ Liberar mesa usando syncService
    const tableUpdate = await syncService.update(TABLES.MESAS, tableId, {
      status: 'available',
      pedido_atual_id: null,
      clientes_atual: 0,
      ocupada_desde: null
    })

    if (tableUpdate.error && !tableUpdate.offline) {
      throw tableUpdate.error
    }

    // ✅ Criar atividade de encerramento usando syncService
    const activityData = {
      tipo: 'close_order',
      titulo: `Comanda Mesa ${getTableNumber(tableId)} fechada`,
      descricao: `Pedido #${order.value.id.slice(0, 8)} encerrado - Total: R$ ${formatPrice(order.value.valor_total)}`,
      mesa_id: tableId,
      pedido_id: order.value.id,
      valor: order.value.valor_total,
      prioridade: 'normal'
    }

    await syncService.insert(TABLES.ATIVIDADES, activityData)

    // ✅ Atualizar status de sincronização
    updateSyncStatus()

    // ✅ Mensagem adequada baseada no status de conexão
    if (!isOnline.value || pendingSync.value > 0) {
      alert('Comanda será fechada quando voltar online. Mesa liberada localmente.')
    } else {
      alert('Comanda fechada com sucesso! Mesa liberada.')
    }

    router.push('/tables')

  } catch (error) {
    console.error('Erro ao fechar comanda:', error)
    alert('Erro ao fechar comanda. Tente novamente.')
  } finally {
    closing.value = false
  }
}

const goBack = () => {
  router.push('/tables')
}

const loadTables = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESAS)
      .select('*')
      .order('numero')

    if (error) throw error
    tables.value = data || []
  } catch (error) {
    console.error('Erro ao carregar mesas:', error)
  }
}

onMounted(() => {
  loadTables()
  loadOrder()
  
  // ✅ NOVO: Listener para mudanças de conexão
  window.addEventListener('online', updateSyncStatus)
  window.addEventListener('offline', updateSyncStatus)
})
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
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.status-icon {
  flex-shrink: 0;
}

.status-text {
  flex: 1;
  font-size: 0.9rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ✅ NOVO: Indicador de Status no Header */
.connection-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-left: auto;
}

.connection-status.online .status-dot {
  background: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

.connection-status.offline .status-dot {
  background: #ef4444;
}

.connection-status.syncing .status-dot {
  background: #fbbf24;
  animation: pulse 1s ease-in-out infinite;
}

.status-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ✅ NOVO: Aviso de Modo Offline */
.offline-warning {
  background: #fef3c7;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #92400e;
  margin-bottom: 1.5rem;
}

.offline-warning svg {
  flex-shrink: 0;
}

.offline-warning span {
  font-size: 0.9rem;
  line-height: 1.5;
}

.close-order-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
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
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.loading,
.error-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading {
  color: #6b7280;
}

.error-message {
  flex-direction: column;
  gap: 1rem;
  color: #dc2626;
}

.error-message svg {
  opacity: 0.5;
}

.btn-retry {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-retry:hover {
  background: #a51830;
}

.order-details {
  flex: 1;
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.order-header {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.order-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.order-id {
  margin: 0.5rem 0 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.items-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.items-section h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-name {
  font-weight: 500;
  color: #1f2937;
}

.item-qty {
  color: #6b7280;
  font-size: 0.85rem;
}

.item-price {
  font-weight: 600;
  color: #C41E3A;
}

.summary {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
}

.summary-row.total {
  border-bottom: none;
  border-top: 2px solid #C41E3A;
  padding-top: 1rem;
  margin-top: 1rem;
  font-weight: 700;
  color: #1f2937;
  font-size: 1.1rem;
}

.summary-row.discount span:last-child {
  color: #10b981;
}

.payment-method {
  background: #C41E3A20;
  color: #C41E3A;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #C41E3A;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #a51830;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.no-order {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.no-order svg {
  opacity: 0.5;
}

.btn-primary {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .order-details {
    padding: 1rem;
  }

  .header h1 {
    font-size: 1.2rem;
  }

  .order-header,
  .items-section,
  .summary {
    padding: 1rem;
  }
  
  .banner-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>